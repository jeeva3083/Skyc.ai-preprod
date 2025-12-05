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
  isInternal: boolean; // True if using internal private agent
  citations?: string[]; // For internal mock citations
  groundingChunks?: { // For real external google search citations
    web?: { uri: string; title: string };
  }[];
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface WhiteboardNode {
  id: string;
  type: 'note' | 'chart' | 'process';
  x: number;
  y: number;
  content: string;
  color?: string;
}

export interface WhiteboardConnection {
  id: string;
  from: string;
  to: string;
}
