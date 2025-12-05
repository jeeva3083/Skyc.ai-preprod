import React, { useState, useRef, useEffect } from 'react';
import { UserRole, ChatMessage } from '../types';
import { Send, Plus, Globe, Lock, FileText, ExternalLink, Video, Mic, MicOff, PhoneOff, VideoOff, AudioLines, X, ChevronRight, Loader2 } from 'lucide-react';
import { generateAgentResponse } from '../services/gemini';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface ChatProps {
  role: UserRole;
}

// --- VISUAL COMPONENTS FOR 2035 FEEL ---

const NeuralOrb = ({ active, size = "md" }: { active: boolean, size?: "sm" | "md" | "lg" }) => {
  const dim = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-64 h-64" : "w-16 h-16";
  const blur = size === "lg" ? "blur-xl" : "blur-sm";
  
  return (
    <div className={`relative flex items-center justify-center ${dim}`}>
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 ${blur} z-10 transition-all duration-1000 ${active ? 'scale-110 shadow-[0_0_60px_rgba(124,58,237,0.6)]' : 'shadow-[0_0_20px_rgba(124,58,237,0.3)]'}`}></div>
      <div className={`absolute inset-0 border-2 border-purple-400/30 rounded-full animate-[spin_10s_linear_infinite] ${active ? 'border-purple-400/60' : ''}`}></div>
      <div className={`absolute inset-0 border border-indigo-400/20 rounded-full scale-125 -m-1 animate-[spin_15s_linear_infinite_reverse]`}></div>
    </div>
  );
};

// --- AUDIO HELPERS ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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
  return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
}

// --- UNIFIED AGENT COMPONENT ---

const Chat: React.FC<ChatProps> = ({ role }) => {
  // Modes: 'text' (default), 'live' (video/audio overlay)
  const [interactionMode, setInteractionMode] = useState<'text' | 'live'>('text');
  
  // --- TEXT CHAT STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: `Identity Verified: ${role}. Secure Uplink Established.\nI am Skyc.ai. Accessing internal data nodes... Ready for query.`,
      timestamp: new Date(),
      isInternal: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isInternalMode, setIsInternalMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- VOICE INPUT STATE ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // --- LIVE AGENT STATE ---
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [liveErrorMsg, setLiveErrorMsg] = useState<string | null>(null);
  
  // Refs for Live Media
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const frameIntervalRef = useRef<number | null>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // --- TEXT LOGIC ---
  const handleSendText = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date(), isInternal: isInternalMode };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { text, groundingChunks } = await generateAgentResponse(userMsg.text, role, isInternalMode);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: new Date(),
        isInternal: isInternalMode,
        citations: isInternalMode ? ['Email: Q3_Report.msg', 'Doc: Security_Protocol_v2.pdf'] : undefined,
        groundingChunks: !isInternalMode ? groundingChunks : undefined
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- VOICE INPUT LOGIC ---
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after one sentence for query mode
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      const startInput = input;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        // Replace input with transcript or append? Standard is replace or append. 
        // We'll append if there's space, or replace if empty.
        // Actually for realtime interim, we typically replace the *current* segment.
        // Simple approach: Set input to (startInput + transcript)
        if (event.results[0].isFinal) {
             setInput(prev => (prev ? prev + ' ' : '') + transcript);
        } else {
             // Show interim? For simplicity in React state, maybe just log or wait for final
             // Better UX: update input in real-time
             // setInput(startInput + (startInput ? ' ' : '') + transcript); 
             // Issues with React state updates in callback. Let's just handle final result for simplicity in this MVP snippet
             // Or just use the transcript for the current utterance.
        }
      };
      
      // Let's stick to a simpler onresult for MVP that just updates the input field when valid result comes
      recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setInput(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // --- FILE UPLOAD LOGIC ---
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate file attachment
      setInput(prev => `[Attached: ${file.name}] ${prev}`);
    }
  };

  // --- LIVE LOGIC ---
  const startLiveSession = async () => {
    setInteractionMode('live');
    setLiveStatus('connecting');
    setLiveErrorMsg(null);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found.");

      const ai = new GoogleGenAI({ apiKey });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = outputAudioContextRef.current!.createGain();
      outputNode.connect(outputAudioContextRef.current!.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsLiveConnected(true);
            setLiveStatus('connected');
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

            // Video loop
            if (canvasRef.current && videoRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                frameIntervalRef.current = window.setInterval(async () => {
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
            setIsLiveConnected(false);
            setLiveStatus('idle');
          },
          onerror: (e) => {
            console.error(e);
            setLiveErrorMsg("Uplink Failed.");
            setLiveStatus('error');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are Skyc.ai Live Agent. Greet the ${role} immediately. Be concise.`
        }
      });
      sessionRef.current = sessionPromise;
    } catch (e: any) {
      setLiveErrorMsg(e.message);
      setLiveStatus('error');
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) sessionRef.current.then((s: any) => s.close());
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsLiveConnected(false);
    setLiveStatus('idle');
    setInteractionMode('text'); // Go back to text mode
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (isLiveConnected) stopLiveSession();
    };
  }, []);

  // --- RENDER ---

  return (
    <div className="relative flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] bg-[#0f111a] rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl">
      
      {/* 2035 Background Animation (Always present but subtle) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#2e1065_0%,_#0f111a_60%)] opacity-40"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </div>

      {/* --- HEADER --- */}
      <div className="relative z-10 p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <NeuralOrb active={loading || isLiveConnected} size="sm" />
          <div>
            <h2 className="text-white text-sm font-bold tracking-wider uppercase">Skyc.ai <span className="text-purple-400">Neural Core</span></h2>
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-purple-500'}`}></div>
              <span className="text-[10px] text-slate-400 font-mono">
                {isLiveConnected ? 'LIVE UPLINK ACTIVE' : 'TEXT INTERFACE READY'}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Indicators or secondary controls if needed */}
        {interactionMode === 'text' && (
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => setIsInternalMode(!isInternalMode)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border transition-colors text-[10px] font-mono uppercase tracking-wide ${isInternalMode ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' : 'bg-blue-900/30 border-blue-500/30 text-blue-400'}`}
                    title={isInternalMode ? "Internal Secure Mode" : "External Web Mode"}
                >
                    {isInternalMode ? <Lock size={12} /> : <Globe size={12} />}
                    <span>{isInternalMode ? 'Secure Intranet' : 'Public Net'}</span>
                </button>
            </div>
        )}
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="relative flex-1 overflow-hidden">
        
        {/* TEXT MODE VIEW */}
        <div className={`absolute inset-0 flex flex-col transition-all duration-500 transform ${interactionMode === 'text' ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
            <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-5 relative group ${
                    msg.role === 'user' 
                        ? 'bg-purple-600/10 border border-purple-500/30 text-white rounded-tr-sm' 
                        : 'bg-slate-800/40 border border-white/10 text-slate-200 rounded-tl-sm backdrop-blur-sm'
                    }`}>
                    {/* Decorative corner markers */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 rounded-tl"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 rounded-br"></div>

                    <div className="flex items-center mb-3 opacity-50 text-[9px] uppercase tracking-widest font-bold font-mono">
                        {msg.role === 'user' ? `CMD_ID::${msg.id.slice(-4)}` : 'AI_RESPONSE::NODE_01'}
                        {msg.role === 'model' && (
                        <span className={`ml-2 px-1 py-0.5 rounded text-[8px] ${msg.isInternal ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                            {msg.isInternal ? 'SECURE_INT' : 'PUBLIC_NET'}
                        </span>
                        )}
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm font-light">{msg.text}</p>
                    
                    {(msg.citations || msg.groundingChunks) && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                        <div className="flex flex-wrap gap-2">
                            {msg.citations?.map((cite, i) => (
                            <span key={i} className="text-[10px] bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center text-emerald-400 hover:bg-emerald-500/20 cursor-default transition-colors">
                                <FileText size={10} className="mr-1.5" /> {cite}
                            </span>
                            ))}
                            {msg.groundingChunks?.map((chunk, i) => chunk.web && (
                            <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 flex items-center text-blue-400 hover:bg-blue-500/20 transition-colors">
                                <ExternalLink size={10} className="mr-1.5" /> {chunk.web.title}
                            </a>
                            ))}
                        </div>
                        </div>
                    )}
                    </div>
                </div>
                ))}
                
                {loading && (
                <div className="flex justify-start animate-fade-in">
                    <div className="bg-slate-800/40 border border-white/10 rounded-2xl rounded-tl-sm p-4 flex items-center space-x-4">
                    <NeuralOrb active={true} size="sm" />
                    <div>
                        <div className="text-xs font-mono text-purple-400 animate-pulse">PROCESSING DATA STREAM...</div>
                    </div>
                    </div>
                </div>
                )}
            </div>

            {/* Bottom Input Area */}
            <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/5">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    
                    {/* Upload Button */}
                    <button 
                        onClick={handleUploadClick}
                        className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all border border-transparent hover:border-white/10"
                        title="Upload Document"
                    >
                        <Plus size={20} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

                    {/* Main Input Wrapper */}
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                            placeholder="Ask anything..."
                            className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-full pl-5 pr-12 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-light"
                        />
                        
                        {/* Voice Input Mic (Inside Input) */}
                        <button 
                            onClick={toggleListening}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                                isListening 
                                ? 'text-red-400 bg-red-500/10 animate-pulse' 
                                : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                            title="Speak to Transcribe"
                        >
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                    </div>

                    {/* Send Button (Hidden if empty, or separate?) usually Send is part of input or separate. 
                        Let's keep Send button if there is text, but user asked for "Audio response icon" like screenshot.
                        If there is text, maybe the Live button becomes Send? 
                        Typically, Chat apps have a Send button.
                    */}
                    {input.trim() ? (
                        <button 
                            onClick={handleSendText}
                            className="p-3.5 bg-white text-black rounded-full hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        >
                            <ChevronRight size={20} className="ml-0.5" />
                        </button>
                    ) : (
                        /* Live Audio Response Button (The "Black Circle with Waveform") */
                        <button
                            onClick={startLiveSession}
                            className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white border border-white/20 hover:border-purple-500/50 hover:scale-105 transition-all shadow-lg group relative overflow-hidden"
                            title="Start Live Voice Agent"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <AudioLines size={20} className="text-white group-hover:text-purple-400 transition-colors" />
                        </button>
                    )}
                </div>
                
                <div className="text-center mt-3">
                    <p className="text-[9px] text-slate-600 font-mono tracking-wider uppercase">
                        AI-09 Secure Channel • <span className="text-emerald-500/60">Encrypted</span>
                    </p>
                </div>
            </div>
        </div>

        {/* LIVE VIDEO MODE VIEW */}
        <div className={`absolute inset-0 z-20 bg-black flex flex-col transition-all duration-700 transform ${interactionMode === 'live' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
            {/* Main Video Stage */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                <video 
                    ref={videoRef} 
                    className={`w-full h-full object-cover transition-all duration-700 ${!isCamOn ? 'blur-2xl opacity-20 scale-110' : 'opacity-100 scale-100'}`} 
                    muted 
                    playsInline 
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* HUD Overlay */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none">
                    <div className="flex justify-between items-start">
                        <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-lg">
                            <div className="text-[10px] text-emerald-400 font-mono tracking-widest mb-1">SIGNAL STRENGTH</div>
                            <div className="flex space-x-1">
                                <div className="w-1 h-3 bg-emerald-500"></div>
                                <div className="w-1 h-3 bg-emerald-500"></div>
                                <div className="w-1 h-3 bg-emerald-500"></div>
                                <div className="w-1 h-3 bg-emerald-500/30"></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-mono">SESSION ID</div>
                            <div className="text-xs text-white font-mono">XJ-992-ALPHA</div>
                        </div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {!isCamOn && (
                            <div className="flex flex-col items-center justify-center animate-fade-in">
                                <NeuralOrb active={isLiveConnected} size="lg" />
                                <div className="mt-8 text-center space-y-2">
                                    <h3 className="text-2xl font-light text-white tracking-tight">Audio Uplink Active</h3>
                                    <p className="text-purple-300/60 text-sm">"I am listening. Enable vision for object analysis."</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center">
                       {liveErrorMsg && (
                           <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-md text-xs font-mono">
                               ERROR: {liveErrorMsg}
                           </div>
                       )}
                    </div>
                </div>
            </div>

            {/* Live Controls */}
            <div className="h-32 bg-black/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-center gap-8 relative z-30">
                <button 
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`p-5 rounded-full border transition-all duration-300 ${
                        isMicOn ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-110' : 'bg-red-500/10 border-red-500/30 text-red-500'
                    }`}
                >
                    {isMicOn ? <Mic size={28} /> : <MicOff size={28} />}
                </button>

                <button 
                    onClick={stopLiveSession}
                    className="p-8 rounded-full bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:bg-red-700 hover:scale-105 hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] transition-all duration-300"
                >
                    <PhoneOff size={36} />
                </button>

                <button 
                    onClick={() => setIsCamOn(!isCamOn)}
                    className={`p-5 rounded-full border transition-all duration-300 ${
                        isCamOn ? 'bg-white text-black border-white hover:scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                >
                    {isCamOn ? <Video size={28} /> : <VideoOff size={28} />}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Chat;