import React, { useState, useRef } from 'react';
import { UserRole, WhiteboardNode, WhiteboardConnection } from '../types';
import { Plus, Type, Trash2, Wand2, ArrowRight, MousePointer } from 'lucide-react';
import { generateInsight } from '../services/gemini';

interface WhiteboardProps {
  role: UserRole;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ role }) => {
  const [nodes, setNodes] = useState<WhiteboardNode[]>([
    { id: '1', type: 'note', x: 50, y: 50, content: 'Q3 Sales Strategy', color: 'bg-yellow-50 border-yellow-200' },
    { id: '2', type: 'process', x: 300, y: 150, content: 'Ingestion Pipeline', color: 'bg-blue-50 border-blue-200' },
  ]);
  const [connections, setConnections] = useState<WhiteboardConnection[]>([
    { id: 'c1', from: '1', to: '2' }
  ]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectStart, setConnectStart] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

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

  const addNode = (type: WhiteboardNode['type']) => {
    const newNode: WhiteboardNode = {
      id: Date.now().toString(),
      type,
      x: 100,
      y: 100,
      content: 'New Item',
      color: type === 'note' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-300'
    };
    setNodes([...nodes, newNode]);
  };

  const generateAINode = async () => {
    const insight = await generateInsight("Generate a strategic note for next quarter planning based on current mock data.");
    const newNode: WhiteboardNode = {
      id: Date.now().toString(),
      type: 'note',
      x: 200,
      y: 200,
      content: insight,
      color: 'bg-purple-50 border-purple-200'
    };
    setNodes([...nodes, newNode]);
  };

  const getNodeCenter = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return { x: 0, y: 0 };
    return { x: node.x + 80, y: node.y + 40 };
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-slate-100 rounded-2xl overflow-hidden border border-purple-100 relative shadow-inner">
      {/* Floating Toolbar */}
      <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md shadow-xl rounded-xl p-2 flex flex-col space-y-2 border border-slate-200">
        <button onClick={() => addNode('note')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Note">
          <Plus size={20} />
        </button>
        <button onClick={() => addNode('process')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Process">
          <Type size={20} />
        </button>
        <div className="w-full h-px bg-slate-200 my-1"></div>
        <button 
          onClick={() => { setConnectMode(!connectMode); setConnectStart(null); }} 
          className={`p-2 rounded-lg transition-colors ${connectMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`} 
          title="Connect"
        >
          <ArrowRight size={20} />
        </button>
        <div className="w-full h-px bg-slate-200 my-1"></div>
        <button onClick={generateAINode} className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors" title="AI Generate">
          <Wand2 size={20} />
        </button>
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
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={(e) => {
          // Basic touch support
          const touch = e.touches[0];
          if (!isDragging || !draggedNode || !canvasRef.current) return;
          const rect = canvasRef.current.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          setNodes(nodes.map(n => n.id === draggedNode ? { ...n, x: x - 60, y: y - 25 } : n));
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
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
                stroke="#94a3b8"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {nodes.map(node => (
          <div
            key={node.id}
            onMouseDown={(e) => handleMouseDown(node.id, e)}
            onTouchStart={() => { setIsDragging(true); setDraggedNode(node.id); }}
            onTouchEnd={() => { setIsDragging(false); setDraggedNode(null); }}
            style={{ 
              left: node.x, 
              top: node.y,
              cursor: connectMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab')
            }}
            className={`absolute w-40 md:w-48 p-3 shadow-md rounded-xl transition-all select-none z-10 border-2
              ${node.color} 
              ${node.type === 'process' ? 'rounded-full h-24 flex items-center justify-center text-center' : 'min-h-[100px]'}
              ${connectStart === node.id ? 'ring-4 ring-blue-200' : ''}
              hover:shadow-xl hover:scale-105
            `}
          >
            <textarea
              className="w-full h-full bg-transparent resize-none focus:outline-none text-xs md:text-sm font-medium text-slate-800 text-center"
              value={node.content}
              onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, content: e.target.value } : n))}
            />
            {!connectMode && (
              <button 
                onClick={(e) => { e.stopPropagation(); setNodes(nodes.filter(n => n.id !== node.id)); }}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[10px] text-slate-500 shadow-sm border border-slate-200 pointer-events-none">
        {nodes.length} Items &bull; {connections.length} Links
      </div>
    </div>
  );
};

export default Whiteboard;