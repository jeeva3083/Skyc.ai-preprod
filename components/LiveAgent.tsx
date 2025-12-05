import React, { useRef, useEffect, useState } from 'react';
import { UserRole } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Activity, Camera, Zap, ShieldCheck, Sparkles } from 'lucide-react';

interface LiveAgentProps {
  role: UserRole;
}

// --- Audio Helpers (Standard) ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  let binary = '';
  const len = int16.buffer.byteLength;
  const bytes = new Uint8Array(int16.buffer);
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Visual Components ---

const NeuralOrb = ({ active }: { active: boolean }) => (
  <div className="relative flex items-center justify-center">
    {/* Core */}
    <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 blur-sm z-10 transition-all duration-1000 ${active ? 'scale-110 shadow-[0_0_60px_rgba(124,58,237,0.6)]' : 'shadow-[0_0_30px_rgba(124,58,237,0.3)]'}`}></div>
    
    {/* Outer Rings */}
    <div className={`absolute inset-0 border-2 border-purple-400/30 rounded-full w-32 h-32 animate-[spin_10s_linear_infinite] ${active ? 'border-purple-400/60' : ''}`}></div>
    <div className={`absolute inset-0 border border-indigo-400/20 rounded-full w-48 h-48 -m-8 animate-[spin_15s_linear_infinite_reverse]`}></div>
    
    {/* Particles */}
    <div className="absolute w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
  </div>
);

const AudioWave = ({ active }: { active: boolean }) => (
  <div className={`flex items-center justify-center space-x-1 h-8 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}>
    {[...Array(5)].map((_, i) => (
      <div 
        key={i} 
        className="w-1 bg-emerald-400 rounded-full animate-pulse"
        style={{ 
          height: `${Math.random() * 20 + 10}px`, 
          animationDuration: `${0.5 + Math.random() * 0.5}s` 
        }} 
      />
    ))}
  </div>
);

const LiveAgent: React.FC<LiveAgentProps> = ({ role }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(false); // Default video OFF
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const frameIntervalRef = useRef<number | null>(null);

  const startSession = async () => {
    setStatus('connecting');
    setErrorMsg(null);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found.");

      const ai = new GoogleGenAI({ apiKey });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = outputAudioContextRef.current!.createGain();
      outputNode.connect(outputAudioContextRef.current!.destination);

      // Request both audio and video permission upfront to ensure smooth toggling later
      // But we will only draw video frames if isCamOn is true
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setStatus('connected');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!isMicOn) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);

            if (canvasRef.current && videoRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                frameIntervalRef.current = window.setInterval(async () => {
                    // Only send frames if Camera is explicitly ON
                    if (!isCamOn || !videoRef.current || !canvasRef.current || !ctx) return;
                    
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                    ctx.drawImage(videoRef.current, 0, 0);
                    const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                    sessionPromise.then((session) => {
                        session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                    });
                }, 1000); 
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNode);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            if (msg.serverContent?.interrupted) {
                for (const src of sourcesRef.current) src.stop();
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            setIsConnected(false);
            setStatus('idle');
          },
          onerror: (e) => {
            console.error(e);
            setErrorMsg("Connection Error.");
            setStatus('error');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          // Proactive Greeting Instruction
          systemInstruction: `You are Skyc.ai Live Agent. 
          IMPORTANT: As soon as the session starts, immediately greet the user with "Hello! I am ready to help. What is on your mind?"
          Speak concisely to a ${role}. 
          If the user enables their camera, describe what you see or analyze documents shown.`
        }
      });
      sessionRef.current = sessionPromise;
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to start session");
      setStatus('error');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.then((s: any) => s.close());
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsConnected(false);
    setStatus('idle');
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-black rounded-2xl overflow-hidden relative shadow-2xl ring-1 ring-white/10">
      
      {/* --- IDLE STATE: THE AI "MIND" BACKGROUND --- */}
      {!isConnected && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden">
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#0f0f1a] to-black animate-pulse"></div>
          <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
          
          {/* The AI Presence */}
          <div className="relative z-20 flex flex-col items-center animate-fade-in text-center">
            <NeuralOrb active={status === 'connecting'} />
            
            <div className="mt-8 space-y-6 max-w-lg px-6">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                How can I help you?
              </h2>
              <p className="text-purple-200/80 text-lg font-light leading-relaxed">
                I am ready to analyze data, answer questions, or view documents via your camera.
              </p>
            </div>

            {/* Main Action Button */}
            <div className="mt-12">
              {status === 'connecting' ? (
                <div className="flex items-center space-x-3 text-emerald-400 bg-emerald-900/20 px-8 py-4 rounded-full border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <Activity className="animate-spin" size={24} />
                  <span className="text-base font-semibold tracking-wide">CONNECTING TO AGENT...</span>
                </div>
              ) : (
                <button 
                  onClick={startSession}
                  className="group relative flex items-center justify-center space-x-4 bg-white text-black px-10 py-5 rounded-full font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:shadow-[0_0_80px_rgba(255,255,255,0.6)]"
                >
                  <Sparkles className="text-purple-600 fill-purple-600 group-hover:rotate-12 transition-transform" size={24} />
                  <span className="text-lg">Start Conversation</span>
                </button>
              )}
            </div>
            
            {errorMsg && (
              <p className="mt-6 text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded border border-red-900/50">{errorMsg}</p>
            )}
          </div>
        </div>
      )}

      {/* --- CONNECTED STATE: VIDEO FEED + HUD --- */}
      <div className={`flex-1 relative bg-black flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-0'}`}>
        <video 
            ref={videoRef} 
            className={`w-full h-full object-cover transition-all duration-700 ${!isCamOn ? 'blur-2xl opacity-40 scale-110' : 'opacity-100 scale-100'}`} 
            muted 
            playsInline 
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            {/* HUD Top */}
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">Live Uplink</span>
                </div>
                <div className="flex items-center space-x-2">
                    <ShieldCheck size={16} className="text-slate-400" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">E2E Encrypted</span>
                </div>
            </div>

            {/* HUD Center (Camera Prompt) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!isCamOn && (
                    <div className="text-center space-y-4 animate-pulse">
                        <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 mx-auto">
                            <Camera size={32} className="text-white/50" />
                        </div>
                        <p className="text-white/40 text-sm font-mono tracking-wider">CAMERA OFF</p>
                        <p className="text-white/20 text-xs">Enable camera below to show objects</p>
                    </div>
                )}
            </div>

            {/* HUD Bottom (AI Status) */}
            <div className="flex justify-center pb-24">
               <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 flex items-center space-x-4 shadow-2xl">
                  <div className="flex flex-col items-end">
                      <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Skyc.ai Agent</span>
                      <span className="text-[9px] text-slate-400">Listening...</span>
                  </div>
                  <div className="h-8 w-px bg-white/20"></div>
                  <AudioWave active={true} />
               </div>
            </div>
        </div>
      </div>

      {/* --- CONTROLS BAR (Always Visible if Connected) --- */}
      {isConnected && (
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-center gap-8 z-30 pb-6">
            <button 
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-4 rounded-full backdrop-blur-md border transition-all duration-200 transform hover:scale-105 ${
                    isMicOn ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-red-500/20 border-red-500/50 text-red-400'
                }`}
                title="Toggle Microphone"
            >
                {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>

            <button 
                onClick={stopSession}
                className="p-6 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 hover:scale-110 transition-all duration-300 ring-4 ring-red-900/30"
                title="End Conversation"
            >
                <PhoneOff size={32} />
            </button>

            <button 
                onClick={() => setIsCamOn(!isCamOn)}
                className={`p-4 rounded-full backdrop-blur-md border transition-all duration-200 transform hover:scale-105 ${
                    isCamOn ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
                title={isCamOn ? "Turn Camera Off" : "Connect Camera to Show Objects"}
            >
                {isCamOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
        </div>
      )}
    </div>
  );
};

export default LiveAgent;