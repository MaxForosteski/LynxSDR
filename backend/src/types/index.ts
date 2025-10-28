// Types para o backend do SDR Agent

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatSession {
  id: string;
  sessionId: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'completed';
}

export interface Lead {
  id?: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  need?: string;
  interestConfirmed: boolean;
  status: 'new' | 'contacted' | 'qualified' | 'meeting_scheduled' | 'closed_won' | 'closed_lost';
  pipefyCardId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastContactAt?: Date;
}

export interface Meeting {
  id?: string;
  leadId: string;
  sessionId: string;
  meetingDatetime: Date;
  meetingLink?: string;
  calendarEventId?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConversationData {
  sessionId: string;
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  need?: string;
  interestConfirmed?: boolean;
  collectedFields: string[];
}

export interface TimeSlot {
  datetime: Date;
  available: boolean;
  duration: number; // em minutos
}

export interface PipefyCard {
  id?: string;
  title: string;
  fields: Array<{
    field_id: string;
    field_value: string | boolean;
  }>;
  pipe_id: string;
  phase_id?: string;
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | null;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      function_call?: {
        name: string;
        arguments: string;
      };
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}


export interface FunctionResult {
  name: string;
  response: {
    success: boolean;
    data?: any;
    error?: string;
  };
}

// Request/Response types para API
export interface ChatRequest {
  sessionId: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  requiresAction?: boolean;
  actionType?: 'schedule_meeting' | 'collect_info';
  data?: any;
}

export interface ScheduleMeetingRequest {
  sessionId: string;
  slotIndex: number;
}

export interface ScheduleMeetingResponse {
  success: boolean;
  meeting?: Meeting;
  meetingLink?: string;
  message: string;
}

export interface AvailableSlotsResponse {
  slots: TimeSlot[];
  timezone: string;
}

// Funções disponíveis para o Gemini
export interface AgentFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

// Configuração do agente
export interface AgentConfig {
  productName: string;
  productDescription: string;
  companyName: string;
  tone: string;
  maxMessages: number;
  sessionTimeout: number; // em minutos
}

// Database query results
export interface DbChatSession {
  id: string;
  session_id: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
  status: string;
}

export interface DbLead {
  id: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  need?: string;
  interest_confirmed: boolean;
  status: string;
  pipefy_card_id?: string;
  created_at: Date;
  updated_at: Date;
  last_contact_at?: Date;
}

export interface DbMeeting {
  id: string;
  lead_id: string;
  session_id: string;
  meeting_datetime: Date;
  meeting_link?: string;
  calendar_event_id?: string;
  status: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Error types
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class IntegrationError extends AppError {
  constructor(service: string, message: string) {
    super(502, `${service} Integration Error: ${message}`);
    Object.setPrototypeOf(this, IntegrationError.prototype);
  }
}