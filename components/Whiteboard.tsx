import React, { useState, useRef } from 'react';
import { UserRole, WhiteboardNode, WhiteboardConnection } from '../types';
import { 
  Plus, Type, Trash2, Wand2, ArrowRight, MousePointer, 
  Upload, Camera, Mic, FileText, Presentation, 
  BarChart3, Palette, Grid, Link2, MoreVertical, X,
  Image as ImageIcon, Video, Music
} from 'lucide-react';
import { generateInsight } from '../services/gemini';

interface WhiteboardProps {
  role: UserRole;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ role }) => {
  const [nodes, setNodes] = useState<WhiteboardNode[]>([
    { id: '1', type: 'note', x: 50, y: 50, content: 'Q3 Sales Strategy', color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-100' },
    { id: '2', type: 'process', x: 300, y: 150, content: 'Ingestion Pipeline', color: 'bg-blue-500/20 border-blue-500/50 text-blue-100' },
  ]);
  const [connections, setConnections] = useState<WhiteboardConnection[]>([
    { id: 'c1', from: '1', to: '2' }
  ]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectStart, setConnectStart] = useState<string | null>(null);
  const [showIntegrations, setShowIntegrations] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setNodes(nodes.map(n => 
      n.id === draggedNode ? { ...n, x: x - 60, y: y - 25 } : n
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const addNode = (type: WhiteboardNode['type'], content = 'New Item', meta?: any) => {
    let color = 'bg-slate-700/50 border-slate-500/50 text-white';
    if (type === 'note') color = 'bg-yellow-500/20 border-yellow-500/50 text-yellow-100';
    if (type === 'process') color = 'bg-blue-500/20 border-blue-500/50 text-blue-100';
    if (type === 'media') color = 'bg-purple-500/20 border-purple-500/50 text-purple-100';
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
    setShowIntegrations(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addNode('media', file.name, { fileType: 'doc' });
    }
  };

  const generateAINode = async () => {
    const insight = await generateInsight("Generate a strategic node based on simulated enterprise data.");
    addNode('note', insight);
  };

  const getNodeCenter = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return { x: 0, y: 0 };
    // Assuming standard node size roughly
    return { x: node.x + 96, y: node.y + 40 }; 
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-[#0f111a] rounded-2xl overflow-hidden border border-purple-500/20 relative shadow-2xl">
      
      {/* Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(124, 58, 237, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-xl flex flex-col space-y-2 pointer-events-auto">
          <button onClick={() => addNode('note')} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors" title="Note">
            <Plus size={20} />
          </button>
          <button onClick={() => addNode('process')} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors" title="Process">
            <Type size={20} />
          </button>
          <div className="w-full h-px bg-white/10 my-1"></div>
          <button 
            onClick={() => { setConnectMode(!connectMode); setConnectStart(null); }} 
            className={`p-2 rounded-lg transition-colors ${connectMode ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'}`} 
            title="Connect"
          >
            <ArrowRight size={20} />
          </button>
          <button onClick={generateAINode} className="p-2 hover:bg-purple-900/50 text-purple-400 rounded-lg transition-colors" title="AI Generate">
            <Wand2 size={20} />
          </button>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-xs font-mono text-emerald-400 pointer-events-auto">
          <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block mr-2 animate-pulse"></span>
          WORKSPACE LIVE
        </div>
      </div>

      {connectMode && (
        <div className="absolute top-6 left-20 z-20 bg-blue-600 text-white text-xs px-4 py-2 rounded-full shadow-lg animate-bounce flex items-center">
          <MousePointer size={12} className="mr-2" /> Select two nodes to connect
        </div>
      )}

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
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

        {nodes.map(node => (
          <div
            key={node.id}
            onMouseDown={(e) => handleMouseDown(node.id, e)}
            style={{ 
              left: node.x, 
              top: node.y,
              cursor: connectMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab')
            }}
            className={`absolute w-48 p-4 shadow-2xl rounded-xl transition-all select-none z-10 border backdrop-blur-md
              ${node.color} 
              ${node.type === 'process' ? 'rounded-full h-24 flex items-center justify-center text-center' : 'min-h-[120px]'}
              ${connectStart === node.id ? 'ring-2 ring-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : ''}
              hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]
            `}
          >
            <div className="flex items-center justify-between mb-2 opacity-50 text-[10px] uppercase font-mono tracking-widest">
              <span>{node.type}</span>
              {node.meta?.icon && <span>{node.meta.icon}</span>}
            </div>
            <textarea
              className="w-full h-full bg-transparent resize-none focus:outline-none text-xs md:text-sm font-medium text-inherit text-center placeholder-white/20"
              value={node.content}
              onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, content: e.target.value } : n))}
            />
            {!connectMode && (
              <button 
                onClick={(e) => { e.stopPropagation(); setNodes(nodes.filter(n => n.id !== node.id)); }}
                className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-1.5 shadow hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors border border-white/10"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Bottom Floating Dock - Futuristic Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl">
          
          <div className="flex items-center gap-1 px-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all hover:scale-110 tooltip-trigger group relative"
            >
              <Upload size={20} />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Upload Doc</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

            <button 
              onClick={() => addNode('media', 'Camera Capture', { fileType: 'img' })}
              className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all hover:scale-110 group relative"
            >
              <Camera size={20} />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">Snap</span>
            </button>

            <button 
              onClick={() => addNode('media', 'Audio Note', { fileType: 'audio' })}
              className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all hover:scale-110 group relative"
            >
              <Mic size={20} />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">Voice Note</span>
            </button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1"></div>

          {/* Integrations Toggle */}
          <div className="relative">
            <button 
              onClick={() => setShowIntegrations(!showIntegrations)}
              className={`p-3 rounded-xl transition-all hover:scale-110 flex items-center gap-2 font-bold ${showIntegrations ? 'bg-white text-black' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.5)]'}`}
            >
              <Plus size={20} />
              <span className="text-xs uppercase tracking-wider">Connect</span>
            </button>

            {/* Integrations Menu */}
            {showIntegrations && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-[#1a1a2e] border border-white/10 rounded-xl p-2 w-64 shadow-2xl grid grid-cols-2 gap-2 animate-fade-in">
                <button 
                  onClick={() => addNode('integration', 'PowerBI Dashboard', { icon: 'BI' })}
                  className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
                >
                  <BarChart3 size={24} className="mb-2 text-yellow-500" />
                  <span className="text-[10px]">PowerBI</span>
                </button>
                <button 
                  onClick={() => addNode('integration', 'Miro Board', { icon: 'MIRO' })}
                  className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
                >
                  <Grid size={24} className="mb-2 text-blue-400" />
                  <span className="text-[10px]">Miro</span>
                </button>
                <button 
                  onClick={() => addNode('integration', 'Canva Design', { icon: 'CANVA' })}
                  className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
                >
                  <Palette size={24} className="mb-2 text-cyan-400" />
                  <span className="text-[10px]">Canva</span>
                </button>
                <button 
                  onClick={() => addNode('integration', 'PowerPoint Deck', { icon: 'PPT' })}
                  className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
                >
                  <Presentation size={24} className="mb-2 text-orange-500" />
                  <span className="text-[10px]">PowerPoint</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur border border-white/10 px-4 py-2 rounded-full text-[10px] text-slate-400 shadow-sm pointer-events-none">
        {nodes.length} Neural Nodes &bull; {connections.length} Synapses
      </div>
    </div>
  );
};

export default Whiteboard;