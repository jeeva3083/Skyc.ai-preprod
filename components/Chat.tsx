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

  // Simulate agent "thinking" steps
  useEffect(() => {
    if (!loading) {
      setLoadingStep('');
      return;
    }
    const steps = isInternalMode 
      ? ['Authenticating Access...', 'Querying Secure Vector DB...', 'Synthesizing Internal Data...']
      : ['Connecting to Web...', 'Verifying External Sources...', 'Cross-referencing Facts...'];
    
    let currentStep = 0;
    setLoadingStep(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep]);
      }
    }, 800);

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
        // If internal, use mock citations. If external, use real grounding chunks if available.
        citations: isInternalMode 
          ? ['Email: Q3_Report.msg', 'Doc: Security_Protocol_v2.pdf'] 
          : undefined,
        groundingChunks: !isInternalMode ? groundingChunks : undefined
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Chat Header / Mode Switcher */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsInternalMode(true)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isInternalMode ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Lock size={14} className="mr-2" />
            Internal Agent
          </button>
          <button
            onClick={() => setIsInternalMode(false)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !isInternalMode ? 'bg-[#E30613] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Globe size={14} className="mr-2" />
            External Agent
          </button>
        </div>
        <div className="flex items-center text-xs text-slate-400">
          <span className={`w-2 h-2 rounded-full mr-2 ${isInternalMode ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
          {isInternalMode ? 'Secure Environment: Swiss Cloud' : 'External Access: Public Internet'}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl p-5 ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center mb-2 opacity-50 text-xs uppercase tracking-wider font-bold">
                {msg.role === 'user' ? 'You' : 'Skyc.ai Agent'}
                {msg.role === 'model' && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${msg.isInternal ? 'bg-emerald-200 text-emerald-800' : 'bg-orange-200 text-orange-800'}`}>
                    {msg.isInternal ? 'PRIVATE' : 'PUBLIC'}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.text}</p>
              
              {/* Internal Citations (Mock) */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/50">
                  <p className="text-xs font-semibold mb-2 opacity-70 flex items-center">
                    <FileText size={12} className="mr-1" /> Internal Sources:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((cite, i) => (
                      <span key={i} className="text-[10px] bg-white/60 px-2 py-1.5 rounded border border-slate-200/50 truncate max-w-xs flex items-center hover:bg-white cursor-pointer transition-colors">
                        {cite}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External Grounding (Real) */}
              {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/50">
                  <p className="text-xs font-semibold mb-2 opacity-70 flex items-center">
                    <Globe size={12} className="mr-1" /> Web Sources:
                  </p>
                  <div className="flex flex-col gap-1">
                    {msg.groundingChunks.map((chunk, i) => (
                      chunk.web ? (
                        <a 
                          key={i} 
                          href={chunk.web.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline flex items-center bg-white/60 px-2 py-1.5 rounded border border-slate-200/50"
                        >
                          <ExternalLink size={10} className="mr-2 flex-shrink-0" />
                          <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                        </a>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Agent Thinking Indicator */}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-slate-200 shadow-md rounded-2xl rounded-tl-none p-4 flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                <Bot className="relative text-blue-600" size={24} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Agent Working</div>
                <div className="text-xs text-slate-500 flex items-center mt-0.5">
                  <Loader2 size={10} className="animate-spin mr-1.5" />
                  {loadingStep}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isInternalMode ? "Ask about internal emails, reports, or KPIs..." : "Search the web for external market trends..."}
            className="w-full pl-4 pr-32 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-sm font-medium text-slate-700"
          />
          <div className="absolute right-2 top-2 bottom-2 flex items-center space-x-1">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
              <Paperclip size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
              <Mic size={20} />
            </button>
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-2 bg-[#E30613] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 px-1">
          <div className="text-[10px] text-slate-400">
            Skyc.ai output is generated by AI. Verify critical information.
          </div>
          {isInternalMode && (
             <div className="flex items-center text-[10px] text-emerald-600 font-medium">
               <Lock size={10} className="mr-1" />
               AES-256 Encrypted
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
