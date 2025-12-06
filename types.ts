export enum UserRole {
  CEO = 'CEO',
  DIRECTOR = 'DIRECTOR',
  MANAGER = 'MANAGER',
  ANALYST = 'ANALYST'
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  WHITEBOARD = 'WHITEBOARD',
  SETTINGS = 'SETTINGS'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isInternal: boolean; 
  citations?: string[]; 
  groundingChunks?: { 
    web?: { uri: string; title: string };
    maps?: { title: string; googleMapsUri: string; address?: string };
  }[];
  // Multimedia capabilities
  videoUri?: string; // For Veo generated videos
  audioData?: string; // For TTS or audio responses
  imageUri?: string; // For uploaded images
  isVeoGeneration?: boolean; // Flag if this message was a video gen request
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface WhiteboardNode {
  id: string;
  type: 'note' | 'chart' | 'process' | 'media' | 'integration' | 'file';
  x: number;
  y: number;
  content: string;
  color?: string;
  meta?: {
    icon?: string; 
    fileType?: 'pdf' | 'doc' | 'sheet' | 'video' | 'audio' | 'image' | 'text' | 'unknown';
    fileUrl?: string;
    fileName?: string;
  };
}

export interface WhiteboardConnection {
  id: string;
  from: string;
  to: string;
}

export interface WhiteboardAction {
  action: 'create_node' | 'connect_nodes' | 'delete_node' | 'clear_canvas';
  params?: any;
}