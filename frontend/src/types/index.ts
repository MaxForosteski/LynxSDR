// Types para o frontend do SDR Agent

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatSession {
  sessionId: string;
  messages: Message[];
  isActive: boolean;
  expiresAt?: Date;
}

export interface ApiChatRequest {
  sessionId?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface ApiChatResponse {
  message: string;
  sessionId: string;
  requiresAction?: boolean;
  actionType?: string;
  data?: any;
}

export interface ApiStartSessionResponse {
  sessionId: string;
  message: string;
  expiresAt: string;
}

export interface ApiHistoryResponse {
  sessionId: string;
  messages: Message[];
  status: string;
}

export interface ChatState {
  sessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
}

export interface ChatConfig {
  apiUrl: string;
  autoStart: boolean;
  persistSession: boolean;
  maxMessages: number;
  typingIndicatorDelay: number;
}