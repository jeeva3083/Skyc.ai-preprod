import React, { useState, useRef, useEffect } from 'react';
import { UserRole, ChatMessage } from '../types';
import { 
  Send, Plus, Globe, Lock, FileText, ExternalLink, 
  Video, Mic, MicOff, PhoneOff, VideoOff, AudioLines, 
  X, ChevronRight, Loader2, Zap, MapPin, Film, 
  Image as ImageIcon, Volume2, Play, Bug, Workflow, Share2
} from 'lucide-react';
import { generateAgentResponse, generateVeoVideo, generateSpeech } from '../services/gemini';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface ChatProps {
  role: UserRole;
}

// --- UTILS ---
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const Chat: React.FC<ChatProps> = ({ role }) => {
  // --- STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: `Identity Verified: ${role}. Secure Uplink Established.\nI am Skyc.ai. Ready for multimodal analysis, video generation, and secure data queries.`,
      timestamp: new Date(),
      isInternal: true
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false); // Specific loading for Veo
  
  // Agentic Tools State
  const [fastMode, setFastMode] = useState(false); // Bolt (Flash Lite)
  const [useSearch, setUseSearch] = useState(false); // Google Search
  const [useMaps, setUseMaps] = useState(false); // Google Maps
  const [veoMode, setVeoMode] = useState(false); // Veo Video Generation
  
  // Enterprise Integration State
  const [useJira, setUseJira] = useState(false);
  const [useServiceNow, setUseServiceNow] = useState(false);
  const [useSharePoint, setUseSharePoint] = useState(false);

  // Media Inputs
  const [selectedFile, setSelectedFile] = useState<{ file: File, type: 'image' | 'video' | 'audio', preview: string } | null>(null);

  // Live API State
  const [interactionMode, setInteractionMode] = useState<'text' | 'live'>('text');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(false);
  
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, isProcessingVideo]);

  // --- HANDLERS ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : 
                     file.type.startsWith('audio/') ? 'audio' : null;

    if (fileType) {
      setSelectedFile({
        file,
        type: fileType as 'image' | 'video' | 'audio',
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile)) return;

    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: input, 
      timestamp: new Date(), 
      isInternal: !useSearch, // If using search, it's external
      imageUri: selectedFile?.type === 'image' ? selectedFile.preview : undefined
    };
    
    // Add visual cue for file
    if (selectedFile) {
        userMsg.text = `[Uploaded ${selectedFile.type}: ${selectedFile.file.name}] ${input}`;
    }

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentFile = selectedFile;
    setSelectedFile(null); // Clear file after sending
    
    // Check for Veo Mode
    if (veoMode) {
        setIsProcessingVideo(true);
        try {
            let imageBase64 = undefined;
            if (currentFile?.type === 'image') {
                imageBase64 = await blobToBase64(currentFile.file);
            }
            
            const videoUri = await generateVeoVideo(userMsg.text, imageBase64);
            
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "Here is your generated video.",
                timestamp: new Date(),
                isInternal: true,
                videoUri: videoUri, // Veo URI
                isVeoGeneration: true
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Video generation failed.", timestamp: new Date(), isInternal: true }]);
        } finally {
            setIsProcessingVideo(false);
        }
        return;
    }

    // Normal Agent Response (Text/Multimedia Analysis/Grounding)
    setLoading(true);
    try {
      let imagePart, videoPart, audioPart;

      if (currentFile) {
        const base64 = await blobToBase64(currentFile.file);
        const inlineData = { data: base64, mimeType: currentFile.file.type };
        if (currentFile.type === 'image') imagePart = { inlineData };
        if (currentFile.type === 'video') videoPart = { inlineData };
        if (currentFile.type === 'audio') audioPart = { inlineData };
      }

      // Append integration context if selected
      let finalPrompt = userMsg.text;
      if (useJira) finalPrompt += " (Context: Search JIRA for relevant issues)";
      if (useServiceNow) finalPrompt += " (Context: Check ServiceNow Incidents)";
      if (useSharePoint) finalPrompt += " (Context: Search Corporate Knowledge Base)";

      const { text, groundingChunks } = await generateAgentResponse(finalPrompt, role, {
        isInternal: !useSearch,
        useSearch: useSearch,
        useMaps: useMaps,
        fastMode: fastMode,
        imagePart,
        videoPart,
        audioPart
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: new Date(),
        isInternal: !useSearch,
        groundingChunks: groundingChunks
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = async (text: string, msgId: string) => {
    const audioData = await generateSpeech(text);
    if (audioData) {
        // Play audio directly
        const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
        audio.play();
    }
  };

  // --- LIVE API (Conversational Voice App) ---
  const startLiveSession = async () => {
    setInteractionMode('live');
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found.");

      const ai = new GoogleGenAI({ apiKey });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: "You are Skyc.ai conversational agent. Be helpful and concise."
        },
        callbacks: {
          onopen: () => {
             setIsLiveConnected(true);
             // Setup Audio Streaming
             const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
             const processor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
             processor.onaudioprocess = (e) => {
                 if (!isMicOn) return;
                 const inputData = e.inputBuffer.getChannelData(0);
                 // Simple PCM 16 conversion for demo
                 const l = inputData.length;
                 const int16 = new Int16Array(l);
                 for (let i=0; i<l; i++) int16[i] = inputData[i] * 32768;
                 let binary = '';
                 const bytes = new Uint8Array(int16.buffer);
                 for (let i=0; i<bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                 const b64 = btoa(binary);
                 
                 sessionPromise.then(s => s.sendRealtimeInput({ media: { mimeType: 'audio/pcm;rate=16000', data: b64 } }));
             };
             source.connect(processor);
             processor.connect(inputAudioContextRef.current!.destination);
             
             // Video Loop
             if (canvasRef.current && videoRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                setInterval(() => {
                    if (!isCamOn || !videoRef.current || !canvasRef.current || !ctx) return;
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                    ctx.drawImage(videoRef.current, 0, 0);
                    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                    sessionPromise.then(s => s.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64 }}));
                }, 1000);
             }
          },
          onmessage: async (msg: LiveServerMessage) => {
              const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioData && outputAudioContextRef.current) {
                  const ctx = outputAudioContextRef.current;
                  const binary = atob(audioData);
                  const len = binary.length;
                  const bytes = new Uint8Array(len);
                  for (let i=0; i<len; i++) bytes[i] = binary.charCodeAt(i);
                  const int16 = new Int16Array(bytes.buffer);
                  const buffer = ctx.createBuffer(1, int16.length, 24000);
                  const channel = buffer.getChannelData(0);
                  for (let i=0; i<int16.length; i++) channel[i] = int16[i] / 32768.0;
                  
                  const source = ctx.createBufferSource();
                  source.buffer = buffer;
                  source.connect(ctx.destination);
                  source.start();
              }
          },
          onclose: () => setIsLiveConnected(false)
        }
      });
      sessionRef.current = sessionPromise;
    } catch (e) {
        console.error("Live Error", e);
        setInteractionMode('text');
    }
  };

  const stopLiveSession = () => {
      if (sessionRef.current) sessionRef.current.then((s: any) => s.close());
      setInteractionMode('text');
      setIsLiveConnected(false);
  };


  return (
    <div className="relative flex flex-col h-full bg-[#0f111a] border-t border-purple-500/20 shadow-2xl">
      
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#2e1065_0%,_#0f111a_60%)] opacity-40"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
      </div>

      {/* --- LIVE MODE OVERLAY --- */}
      {interactionMode === 'live' && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
             <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover transition-opacity ${isCamOn ? 'opacity-100' : 'opacity-30 blur-xl'}`} muted playsInline />
             <canvas ref={canvasRef} className="hidden" />
             <div className="relative z-10 flex flex-col items-center space-y-8">
                 <div className={`w-32 h-32 rounded-full flex items-center justify-center ${isLiveConnected ? 'bg-purple-600 animate-pulse' : 'bg-slate-700'}`}>
                    <Mic size={40} className="text-white" />
                 </div>
                 <h2 className="text-2xl font-bold text-white tracking-tight">Skyc.ai Voice Uplink</h2>
                 <div className="flex space-x-6">
                     <button onClick={() => setIsMicOn(!isMicOn)} className={`p-4 rounded-full ${isMicOn ? 'bg-white text-black' : 'bg-red-500 text-white'}`}><Mic size={24}/></button>
                     <button onClick={stopLiveSession} className="p-6 rounded-full bg-red-600 text-white shadow-lg transform hover:scale-110 transition-transform"><PhoneOff size={32}/></button>
                     <button onClick={() => setIsCamOn(!isCamOn)} className={`p-4 rounded-full ${isCamOn ? 'bg-white text-black' : 'bg-white/10 text-white'}`}><Video size={24}/></button>
                 </div>
             </div>
          </div>
      )}

      {/* --- TEXT MODE HEADER --- */}
      <div className="relative z-10 p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-white text-sm font-bold tracking-wider uppercase">Skyc.ai <span className="text-purple-400">Core</span></h2>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                <span>{fastMode ? 'BOLT ENGINE (FAST)' : 'PRO ENGINE (REASONING)'}</span>
                {veoMode && <span className="text-purple-400"> • VEO VIDEO GEN</span>}
            </div>
          </div>
        </div>
      </div>

      {/* --- MESSAGES AREA --- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-5 relative group ${
              msg.role === 'user' 
                ? 'bg-purple-600/10 border border-purple-500/30 text-white rounded-tr-sm' 
                : 'bg-slate-800/60 border border-white/10 text-slate-200 rounded-tl-sm backdrop-blur-md'
            }`}>
              {/* Header/Meta */}
              <div className="flex items-center justify-between mb-2 opacity-50 text-[9px] uppercase tracking-widest font-bold font-mono">
                 <span>{msg.role === 'user' ? 'USER_CMD' : 'AI_RESPONSE'}</span>
                 {msg.role === 'model' && (
                   <button onClick={() => handleTTS(msg.text, msg.id)} className="hover:text-purple-400 transition-colors">
                      <Volume2 size={12} />
                   </button>
                 )}
              </div>

              {/* Text Content */}
              <p className="whitespace-pre-wrap leading-relaxed text-sm font-light">{msg.text}</p>
              
              {/* Multimedia Attachments */}
              {msg.imageUri && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-white/10 w-48">
                      <img src={msg.imageUri} alt="User Upload" className="w-full h-auto" />
                  </div>
              )}
              {/* Veo Video Result */}
              {msg.videoUri && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-purple-500/30 shadow-lg">
                      <video src={`${msg.videoUri}&key=${process.env.API_KEY}`} controls className="w-full max-w-md bg-black" />
                  </div>
              )}

              {/* Grounding Chips */}
              {(msg.groundingChunks) && (
                <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                    {msg.groundingChunks.map((chunk, i) => {
                        if (chunk.web) {
                            return (
                                <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 flex items-center text-blue-400 hover:bg-blue-500/20 transition-colors">
                                    <Globe size={10} className="mr-1.5" /> {chunk.web.title}
                                </a>
                            );
                        }
                        if (chunk.maps) {
                            return (
                                <a key={i} href={chunk.maps.googleMapsUri} target="_blank" rel="noreferrer" className="text-[10px] bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                                    <MapPin size={10} className="mr-1.5" /> {chunk.maps.title}
                                </a>
                            );
                        }
                        return null;
                    })}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-4 flex items-center space-x-3">
              <Loader2 className="animate-spin text-purple-400" size={18} />
              <span className="text-xs text-slate-400 font-mono">PROCESSING DATA...</span>
            </div>
          </div>
        )}
        
        {isProcessingVideo && (
           <div className="flex justify-start animate-fade-in">
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-4 flex items-center space-x-3">
              <Loader2 className="animate-spin text-purple-400" size={18} />
              <span className="text-xs text-purple-300 font-mono">RENDERING VEO VIDEO... (This may take a minute)</span>
            </div>
          </div>
        )}
      </div>

      {/* --- INPUT AREA --- */}
      <div className="bg-black/60 backdrop-blur-xl border-t border-white/10 p-4">
        
        {/* Agentic Toolbar */}
        <div className="flex items-center space-x-2 mb-3 px-2 overflow-x-auto no-scrollbar">
            {/* Standard Tools */}
            <button 
                onClick={() => setFastMode(!fastMode)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${
                    fastMode ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
            >
                <Zap size={12} /> <span>Fast</span>
            </button>
            <button 
                onClick={() => { setUseSearch(!useSearch); setUseMaps(false); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${
                    useSearch ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
            >
                <Globe size={12} /> <span>Search</span>
            </button>
            <button 
                onClick={() => { setUseMaps(!useMaps); setUseSearch(false); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${
                    useMaps ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
            >
                <MapPin size={12} /> <span>Maps</span>
            </button>
            <button 
                onClick={() => setVeoMode(!veoMode)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${
                    veoMode ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/50' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
            >
                <Film size={12} /> <span>Veo</span>
            </button>

            <div className="w-px h-4 bg-white/10 mx-1"></div>

             {/* Enterprise Tools */}
             <button 
                onClick={() => setUseJira(!useJira)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${
                    useJira ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
            >
                <Bug size={12} /> <span>JIRA</span>
            </button>
            <button 
                onClick={() => setUseServiceNow(!useServiceNow)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${
                    useServiceNow ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
            >
                <Workflow size={12} /> <span>ServiceNow</span>
            </button>
             <button 
                onClick={() => setUseSharePoint(!useSharePoint)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${
                    useSharePoint ? 'bg-teal-500/20 border-teal-500/50 text-teal-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
            >
                <Share2 size={12} /> <span>SharePoint</span>
            </button>
        </div>

        {/* Input Field */}
        <div className="relative group flex items-center gap-2">
            
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*,video/*,audio/*"
            />
            
            {/* Attachment Button */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-full transition-colors border border-transparent ${
                    selectedFile ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            >
                {selectedFile?.type === 'image' ? <ImageIcon size={20} /> :
                 selectedFile?.type === 'video' ? <Film size={20} /> :
                 selectedFile?.type === 'audio' ? <Mic size={20} /> :
                 <Plus size={20} />
                }
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={
                        veoMode ? "Describe the video you want to generate..." :
                        selectedFile ? "Add a prompt for this file..." :
                        "Ask anything or use tools..."
                    }
                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-full pl-5 pr-12 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-light"
                />
            </div>

            {/* Action Button: Send or Live */}
            {input.trim() || selectedFile ? (
                <button 
                    onClick={handleSend}
                    className="p-3.5 bg-white text-black rounded-full hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                    <ChevronRight size={20} className="ml-0.5" />
                </button>
            ) : (
                <button
                    onClick={startLiveSession}
                    className="p-3.5 bg-black text-white border border-white/20 rounded-full hover:border-purple-500/50 hover:text-purple-400 hover:scale-105 transition-all"
                    title="Start Voice Chat"
                >
                    <AudioLines size={20} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Chat;