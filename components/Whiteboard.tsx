import React, { useState, useRef } from 'react';
import { UserRole, WhiteboardNode, WhiteboardConnection } from '../types';
import { Plus, Type, Trash2, Wand2, ArrowRight } from 'lucide-react';
import { generateInsight } from '../services/gemini';

interface WhiteboardProps {
  role: UserRole;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ role }) => {
  const [nodes, setNodes] = useState<WhiteboardNode[]>([
    { id: '1', type: 'note', x: 100, y: 100, content: 'Q3 Sales Strategy', color: 'bg-yellow-100' },
    { id: '2', type: 'process', x: 400, y: 150, content: 'Data Ingestion Pipeline', color: 'bg-blue-100' },
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
        // Create connection
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
      x: 300,
      y: 300,
      content: 'New Item',
      color: type === 'note' ? 'bg-yellow-100' : 'bg-white border-2 border-slate-800'
    };
    setNodes([...nodes, newNode]);
  };

  const generateAINode = async () => {
    const insight = await generateInsight("Generate a strategic note for next quarter planning based on current mock data.");
    const newNode: WhiteboardNode = {
      id: Date.now().toString(),
      type: 'note',
      x: 500,
      y: 200,
      content: insight,
      color: 'bg-purple-100'
    };
    setNodes([...nodes, newNode]);
  };

  // Helper to get center of a node
  const getNodeCenter = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return { x: 0, y: 0 };
    // Assuming width ~192px (w-48) and height ~100px
    return { x: node.x + 96, y: node.y + 50 };
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-slate-100 rounded-xl overflow-hidden border border-slate-300 relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 bg-white shadow-lg rounded-lg p-2 flex flex-col space-y-2 border border-slate-200">
        <button onClick={() => addNode('note')} className="p-2 hover:bg-slate-100 rounded text-slate-600" title="Add Sticky Note">
          <Plus size={20} />
        </button>
        <button onClick={() => addNode('process')} className="p-2 hover:bg-slate-100 rounded text-slate-600" title="Add Process Block">
          <Type size={20} />
        </button>
        <div className="w-full h-px bg-slate-200 my-1"></div>
        <button 
          onClick={() => { setConnectMode(!connectMode); setConnectStart(null); }} 
          className={`p-2 rounded transition-colors ${connectMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`} 
          title="Connect Nodes"
        >
          <ArrowRight size={20} />
        </button>
        <div className="w-full h-px bg-slate-200 my-1"></div>
        <button onClick={generateAINode} className="p-2 hover:bg-purple-50 text-purple-600 rounded" title="AI Generate Insight">
          <Wand2 size={20} />
        </button>
      </div>

      {connectMode && (
        <div className="absolute top-4 left-20 z-20 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg animate-bounce">
          Select two nodes to connect
        </div>
      )}

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden cursor-crosshair bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* SVG Layer for Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5" opacity="0.2" />
            </pattern>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
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
            style={{ 
              left: node.x, 
              top: node.y,
              cursor: connectMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab')
            }}
            className={`absolute w-48 p-4 shadow-lg rounded-md transition-all select-none z-10 
              ${node.color} 
              ${node.type === 'process' ? 'rounded-full text-center flex items-center justify-center h-24' : 'min-h-[100px]'}
              ${connectStart === node.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              hover:shadow-xl
            `}
          >
            <textarea
              className="w-full h-full bg-transparent resize-none focus:outline-none text-sm font-medium text-slate-800 text-center"
              value={node.content}
              onChange={(e) => setNodes(nodes.map(n => n.id === node.id ? { ...n, content: e.target.value } : n))}
            />
            {!connectMode && (
              <button 
                onClick={(e) => { e.stopPropagation(); setNodes(nodes.filter(n => n.id !== node.id)); }}
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50 text-red-500 opacity-0 hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-xs text-slate-500 shadow-sm border border-slate-200">
        Skyc.ai Whiteboard &bull; {role} Access &bull; {nodes.length} Items
      </div>
    </div>
  );
};

export default Whiteboard;
