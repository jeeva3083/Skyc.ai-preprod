import React, { useState, useRef, useEffect } from 'react';
import { UserRole, WhiteboardNode, WhiteboardConnection } from '../types';
import { 
  Plus, Type, Trash2, Wand2, ArrowRight, MousePointer, 
  Upload, Camera, Mic, FileText, Presentation, 
  BarChart3, Palette, Grid, Link2, MoreVertical, X,
  Image as ImageIcon, Video, Music, Loader2,
  FileSpreadsheet, File as FileIcon, Send,
  Zap, Globe, MapPin, Film, AudioLines, Bug, Workflow, Share2
} from 'lucide-react';
import { generateInsight, generatePresentationStructure, interpretWhiteboardCommand } from '../services/gemini';

interface WhiteboardProps {
  role: UserRole;
}

const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
};

const Whiteboard: React.FC<WhiteboardProps> = ({ role }) => {
  // --- STATE ---
  const [nodes, setNodes] = useState<WhiteboardNode[]>([
    { id: '1', type: 'note', x: 50, y: 50, content: 'Q3 Sales Strategy', color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-100' },
    { id: '2', type: 'process', x: 300, y: 150, content: 'Ingestion Pipeline', color: 'bg-blue-500/20 border-blue-500/50 text-blue-100' },
  ]);
  const [connections, setConnections] = useState<WhiteboardConnection[]>([
    { id: 'c1', from: '1', to: '2' }
  ]);
  
  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectStart, setConnectStart] = useState<string | null>(null);
  
  // AI Agentic State
  const [agentInput, setAgentInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [fastMode, setFastMode] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [veoMode, setVeoMode] = useState(false);
  
  // Enterprise Tool State
  const [useJira, setUseJira] = useState(false);
  const [useServiceNow, setUseServiceNow] = useState(false);
  const [useSharePoint, setUseSharePoint] = useState(false);

  const [showAddMenu, setShowAddMenu] = useState(false); // For the "+" button
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectMode) {
      if (connectStart === null) {
        setConnectStart(id);
      } else if (connectStart !== id) {
        setConnections([...connections, { id: `c-${Date.now()}`, from: connectStart, to: id }]);
        setConnectStart(null);
        setConnectMode(false);
      }
    } else {
      setIsDragging(true);
      setDraggedNode(id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedNode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setNodes(nodes.map(n => n.id === draggedNode ? { ...n, x: x - 60, y: y - 25 } : n));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const addNode = (type: WhiteboardNode['type'], content = 'New Item', meta?: any) => {
    let color = 'bg-slate-700/50 border-slate-500/50 text-white';
    if (type === 'note') color = 'bg-yellow-500/20 border-yellow-500/50 text-yellow-100';
    if (type === 'process') color = 'bg-blue-500/20 border-blue-500/50 text-blue-100';
    if (type === 'media' || type === 'file') color = 'bg-purple-900/40 border-purple-500/50 text-purple-100';
    if (type === 'integration') color = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100';

    const newNode: WhiteboardNode = {
      id: Date.now().toString(),
      type,
      x: 100 + Math.random() * 50,
      y: 100 + Math.random() * 50,
      content,
      color,
      meta
    };
    setNodes([...nodes, newNode]);
    setShowAddMenu(false);
  };

  // --- FILE UPLOAD HANDLING ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await blobToDataUrl(file);
        
        let fileType: any = 'unknown';
        if (file.type.includes('pdf')) fileType = 'pdf';
        else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) fileType = 'doc';
        else if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) fileType = 'sheet';
        else if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type.startsWith('audio/')) fileType = 'audio';
        else if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.startsWith('text/')) fileType = 'text';

        addNode('file', file.name, {
            fileType,
            fileUrl: dataUrl,
            fileName: file.name
        });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowAddMenu(false);
  };

  // --- AI ACTIONS ---
  const handleAgentSubmit = async () => {
      if (!agentInput.trim()) return;
      const prompt = agentInput;
      setAgentInput('');
      setIsAgentThinking(true);

      try {
          const actions = await interpretWhiteboardCommand(prompt, nodes, {
              fastMode,
              useSearch,
              useMaps
          });
          
          const newNodes: WhiteboardNode[] = [];
          const newConns: WhiteboardConnection[] = [];

          actions.forEach(act => {
              if (act.action === 'create_node') {
                  const n: WhiteboardNode = {
                      id: `ai-${Date.now()}-${Math.random()}`,
                      type: act.params.type || 'note',
                      x: act.params.x || Math.random() * 800,
                      y: act.params.y || Math.random() * 600,
                      content: act.params.content,
                      color: 'bg-purple-600/20 border-purple-500/50 text-purple-100'
                  };
                  newNodes.push(n);
              }
              if (act.action === 'connect_nodes') {
                  // Basic fuzzy match
                  const fromNode = nodes.find(n => n.content.toLowerCase().includes(act.params.from_content_match?.toLowerCase()));
                  const toNode = nodes.find(n => n.content.toLowerCase().includes(act.params.to_content_match?.toLowerCase())) || newNodes.find(n => n.content.toLowerCase().includes(act.params.to_content_match?.toLowerCase()));
                  
                  if (fromNode && toNode) {
                      newConns.push({ id: `ai-conn-${Date.now()}`, from: fromNode.id, to: toNode.id });
                  }
              }
          });
          
          setNodes(prev => [...prev, ...newNodes]);
          setConnections(prev => [...prev, ...newConns]);

      } catch (e) {
          console.error(e);
      } finally {
          setIsAgentThinking(false);
      }
  };

  const getNodeCenter = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return { x: 0, y: 0 };
    return { x: node.x + 96, y: node.y + 40 }; 
  };

  // --- RENDER HELPERS ---
  const renderFileContent = (node: WhiteboardNode) => {
      if (!node.meta?.fileUrl) return <p>Missing File</p>;

      const { fileType, fileUrl, fileName } = node.meta;

      switch (fileType) {
          case 'image':
              return <img src={fileUrl} alt={fileName} className="w-full h-32 object-cover rounded-md mt-2" />;
          case 'video':
              return <video src={fileUrl} controls className="w-full h-32 rounded-md mt-2 bg-black" />;
          case 'audio':
              return <div className="mt-2 w-full"><audio src={fileUrl} controls className="w-full h-8" /></div>;
          case 'pdf':
              return (
                  <div className="mt-2 w-full h-40 bg-white rounded overflow-hidden relative group">
                      <iframe src={fileUrl} className="w-full h-full pointer-events-none group-hover:pointer-events-auto" title={fileName} />
                      <div className="absolute top-0 right-0 p-1">
                          <a href={fileUrl} download={fileName} className="bg-black/50 text-white p-1 rounded hover:bg-black"><Upload size={12} className="rotate-180"/></a>
                      </div>
                  </div>
              );
          default:
              return (
                  <div className="mt-2 flex items-center p-3 bg-white/5 rounded-lg border border-white/10 group-hover:bg-white/10 transition-colors cursor-pointer" onClick={() => {
                      const a = document.createElement('a');
                      a.href = fileUrl;
                      a.download = fileName || 'download';
                      a.click();
                  }}>
                      <div className={`p-2 rounded mr-3 bg-blue-500/20 text-blue-400`}>
                          <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-white">{fileName}</p>
                          <p className="text-[10px] text-slate-400">Click to Download</p>
                      </div>
                  </div>
              );
      }
  };

  return (
    <div className="h-full flex bg-[#0f111a] border-t border-purple-500/20 relative shadow-2xl">
      
      {/* Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(124, 58, 237, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* --- CANVAS --- */}
      <div className="flex-1 relative flex flex-col">
          {/* Top Bar (Quick Manual Actions) */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-xl flex items-center space-x-2 pointer-events-auto">
              <button onClick={() => addNode('note')} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors" title="Note">
                <Plus size={18} />
              </button>
              <button 
                onClick={() => { setConnectMode(!connectMode); setConnectStart(null); }} 
                className={`p-2 rounded-lg transition-colors ${connectMode ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'}`} 
                title="Connect Mode"
              >
                <ArrowRight size={18} />
              </button>
              <button onClick={() => setNodes([])} className="p-2 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg" title="Clear Canvas">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-xs font-mono text-emerald-400 pointer-events-auto">
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block mr-2 animate-pulse"></span>
              WORKSPACE LIVE
            </div>
          </div>

          {/* SVG Connections Layer */}
          <div 
            ref={canvasRef}
            className="flex-1 relative overflow-hidden cursor-crosshair z-0"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
              </defs>
              {connections.map(conn => {
                const start = getNodeCenter(conn.from);
                const end = getNodeCenter(conn.to);
                return (
                  <line 
                    key={conn.id}
                    x1={start.x} y1={start.y}
                    x2={end.x} y2={end.y}
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map(node => (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDown(node.id, e)}
                style={{ 
                  left: node.x, 
                  top: node.y,
                  cursor: connectMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab')
                }}
                className={`absolute p-4 shadow-2xl rounded-xl transition-all select-none z-10 border backdrop-blur-md group
                  ${node.color} 
                  ${node.type === 'process' ? 'rounded-full h-32 w-32 flex items-center justify-center text-center' : 'w-64 min-h-[100px]'}
                  ${connectStart === node.id ? 'ring-2 ring-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : ''}
                  hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]
                `}
              >
                {/* Node Header */}
                <div className="flex items-center justify-between mb-2 opacity-70 text-[10px] uppercase font-mono tracking-widest w-full">
                  <span className="flex items-center gap-1">
                      {node.type === 'file' && <FileIcon size={10} />}
                      {node.type === 'media' && <Video size={10} />}
                      {node.type === 'note' && <FileText size={10} />}
                      {node.type}
                  </span>
                </div>

                {/* Node Content */}
                {node.type === 'file' || node.type === 'media' ? (
                    <div className="w-full">
                        <input 
                            className="bg-transparent text-sm font-bold w-full focus:outline-none mb-1 text-white" 
                            value={node.content} 
                            onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, content: e.target.value } : n))}
                        />
                        {renderFileContent(node)}
                    </div>
                ) : (
                    <textarea
                      className="w-full h-full bg-transparent resize-none focus:outline-none text-xs md:text-sm font-medium text-inherit text-center placeholder-white/20"
                      value={node.content}
                      onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, content: e.target.value } : n))}
                    />
                )}

                {!connectMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setNodes(nodes.filter(n => n.id !== node.id)); }}
                    className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-1.5 shadow hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors border border-white/10 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* --- AGENTIC COMMAND CENTER (Bottom Icons) --- */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
            
            {/* Tool Chips */}
            <div className="flex items-center justify-center space-x-2 mb-3 px-2 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setFastMode(!fastMode)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border backdrop-blur-md shadow-lg ${
                        fastMode ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                >
                    <Zap size={12} /> <span>Fast</span>
                </button>
                <button 
                    onClick={() => { setUseSearch(!useSearch); setUseMaps(false); }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border backdrop-blur-md shadow-lg ${
                        useSearch ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                >
                    <Globe size={12} /> <span>Search</span>
                </button>
                <button 
                    onClick={() => { setUseMaps(!useMaps); setUseSearch(false); }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border backdrop-blur-md shadow-lg ${
                        useMaps ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                >
                    <MapPin size={12} /> <span>Maps</span>
                </button>
                <button 
                    onClick={() => setVeoMode(!veoMode)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border backdrop-blur-md shadow-lg ${
                        veoMode ? 'bg-purple-600 text-white border-purple-500' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                >
                    <Film size={12} /> <span>Veo</span>
                </button>
                
                <div className="w-px h-4 bg-white/20 mx-1"></div>

                 {/* Enterprise Chips */}
                <button 
                    onClick={() => setUseJira(!useJira)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border backdrop-blur-md shadow-lg ${
                        useJira ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                >
                    <Bug size={12} /> <span>JIRA</span>
                </button>
                 <button 
                    onClick={() => setUseServiceNow(!useServiceNow)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border backdrop-blur-md shadow-lg ${
                        useServiceNow ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                >
                    <Workflow size={12} /> <span>ServiceNow</span>
                </button>
            </div>

            {/* Main Input Bar */}
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center gap-2 shadow-2xl relative">
               
               {/* Add / Upload Button */}
               <div className="relative">
                   <button 
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className={`p-3 rounded-full transition-colors border border-transparent ${showAddMenu ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                   >
                      <Plus size={20} className={showAddMenu ? 'rotate-45 transition-transform' : 'transition-transform'} />
                   </button>
                   
                   {/* Popover Menu for Add */}
                   {showAddMenu && (
                       <div className="absolute bottom-full left-0 mb-3 bg-[#1a1a2e] border border-white/10 rounded-xl p-2 w-48 shadow-2xl flex flex-col gap-1 animate-fade-in">
                          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded text-left text-slate-300 hover:text-white text-xs">
                             <Upload size={16} /> Upload File
                          </button>
                          <button onClick={() => addNode('media', 'Camera Capture', { fileType: 'image', fileUrl: '', fileName: 'Capture' })} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded text-left text-slate-300 hover:text-white text-xs">
                             <Camera size={16} /> Camera
                          </button>
                          <div className="h-px bg-white/10 my-1"></div>
                          <button onClick={() => addNode('integration', 'PowerBI')} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded text-left text-slate-300 hover:text-white text-xs">
                             <BarChart3 size={16} className="text-yellow-500" /> PowerBI Integration
                          </button>
                       </div>
                   )}
                   <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*,video/*,audio/*"
                    />
               </div>

               {/* Agent Input */}
               <div className="flex-1 relative">
                    <input
                        type="text"
                        value={agentInput}
                        onChange={(e) => setAgentInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAgentSubmit()}
                        placeholder={
                            useSearch ? "Ask me to find information and create a board..." :
                            useMaps ? "Ask me to map locations..." :
                            veoMode ? "Describe a video to generate on the canvas..." :
                            "Ask Skyc.ai to build a workflow, diagram, or plan..."
                        }
                        className="w-full bg-transparent border-none text-white placeholder-slate-500 focus:outline-none focus:ring-0 text-sm font-light px-2"
                        disabled={isAgentThinking}
                    />
               </div>

               {/* Action Buttons */}
               {agentInput.trim() ? (
                   <button 
                        onClick={handleAgentSubmit}
                        className="p-3 bg-white text-black rounded-full hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                   >
                        {isAgentThinking ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                   </button>
               ) : (
                   <button className="p-3 bg-black text-white border border-white/20 rounded-full hover:border-purple-500/50 hover:text-purple-400 hover:scale-105 transition-all">
                        <AudioLines size={20} />
                   </button>
               )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default Whiteboard;