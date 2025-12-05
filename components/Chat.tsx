import React, { useState, useRef, useEffect } from 'react';
import { UserRole, ChatMessage } from '../types';
import { Send, Mic, Paperclip, Globe, Lock, Bot, Loader2, FileText, ExternalLink } from 'lucide-react';
import { generateAgentResponse } from '../services/gemini';

interface ChatProps {
  role: UserRole;
}

const Chat: React.FC<ChatProps> = ({ role }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: `Hello. I am the Skyc.ai Enterprise Agent. I am ready to assist you with internal operations, analytics, and predictions. Currently authenticated as: ${role}.`,
      timestamp: new Date(),
      isInternal: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isInternalMode, setIsInternalMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      setLoadingStep('');
      return;
    }
    const steps = isInternalMode 
      ? ['Authenticating...', 'Accessing Secure Vector DB...', 'Analyzing Internal Data...']
      : ['Connecting to Web...', 'Verifying External Sources...', 'Cross-referencing Facts...'];
    
    let currentStep = 0;
    setLoadingStep(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, isInternalMode]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
      isInternal: isInternalMode
    };

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
        citations: isInternalMode 
          ? ['Email: Q3_Report.msg', 'Doc: Security_Protocol_v2.pdf'] 
          : undefined,
        groundingChunks: !isInternalMode ? groundingChunks : undefined
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Dynamic height calculation to fit mobile viewport correctly
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
      
      {/* Chat Header */}
      <div className="p-3 md:p-4 border-b border-purple-50 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-3">
        <div className="flex bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setIsInternalMode(true)}
            className={`flex-1 sm:flex-none flex justify-center items-center px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
              isInternalMode ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Lock size={14} className="mr-2 text-emerald-500" />
            Internal
          </button>
          <button
            onClick={() => setIsInternalMode(false)}
            className={`flex-1 sm:flex-none flex justify-center items-center px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
              !isInternalMode ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe size={14} className="mr-2 text-blue-500" />
            Web
          </button>
        </div>
        <div className="hidden sm:flex items-center text-[10px] uppercase tracking-wider font-bold text-slate-400">
          <div className={`w-2 h-2 rounded-full mr-2 ${isInternalMode ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></div>
          {isInternalMode ? 'Secure Channel' : 'Public Access'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gradient-to-b from-white to-purple-50/30" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 md:p-5 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-sm' 
                : 'bg-white text-slate-800 rounded-tl-sm border border-purple-100'
            }`}>
              <div className="flex items-center mb-2 opacity-50 text-[10px] uppercase tracking-wider font-bold">
                {msg.role === 'user' ? 'You' : 'Skyc.ai'}
                {msg.role === 'model' && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] ${msg.isInternal ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {msg.isInternal ? 'INT' : 'EXT'}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.text}</p>
              
              {/* Citations */}
              {(msg.citations || msg.groundingChunks) && (
                <div className="mt-4 pt-3 border-t border-dashed border-current opacity-70">
                  <div className="flex flex-wrap gap-2">
                    {msg.citations?.map((cite, i) => (
                      <span key={i} className="text-[10px] bg-emerald-50/50 px-2 py-1 rounded border border-emerald-100 flex items-center">
                        <FileText size={10} className="mr-1" /> {cite}
                      </span>
                    ))}
                    {msg.groundingChunks?.map((chunk, i) => chunk.web && (
                      <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-blue-50/50 px-2 py-1 rounded border border-blue-100 flex items-center hover:bg-blue-100 transition-colors">
                        <ExternalLink size={10} className="mr-1" /> {chunk.web.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-purple-100 shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center space-x-3">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-purple-200 rounded-full animate-ping opacity-50"></div>
                <Bot className="relative text-purple-600" size={24} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800">Processing</div>
                <div className="text-xs text-purple-600 flex items-center mt-0.5 truncate">
                  <Loader2 size={10} className="animate-spin mr-1.5" />
                  {loadingStep}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 bg-white border-t border-purple-50">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your command..."
            className="w-full pl-4 pr-24 md:pr-32 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all shadow-inner text-sm md:text-base"
          />
          <div className="absolute right-2 flex items-center space-x-1">
            <button className="p-1.5 md:p-2 text-slate-400 hover:text-purple-600 rounded-lg transition-colors hidden sm:block">
              <Paperclip size={18} />
            </button>
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-2 bg-gradient-to-r from-purple-600 to-red-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;