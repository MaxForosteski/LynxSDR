import { AgentConfig } from '../types';
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL || '',
    ssl: process.env.NODE_ENV === 'production',
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
  },

  // Pipefy
  pipefy: {
    apiKey: process.env.PIPEFY_API_KEY || '',
    apiUrl: 'https://api.pipefy.com/graphql',
    pipeId: process.env.PIPEFY_PIPE_ID || '',
    phaseId: process.env.PIPEFY_PHASE_ID || '', // Fase inicial do funil
  },

  // Calendar (Cal.com ou Calendly)
  calendar: {
    provider: (process.env.CALENDAR_PROVIDER || 'calcom') as 'calcom' | 'calendly',
    apiKey: process.env.CALENDAR_API_KEY || '',
    apiUrl: process.env.CALENDAR_API_URL || 'https://api.cal.com/v1',
    eventTypeId: process.env.CALENDAR_EVENT_TYPE_ID || '',
    timezone: process.env.CALENDAR_TIMEZONE || 'America/Sao_Paulo',
  },

  // CORS
  cors: {
    origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  },

  // Session
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT || '30', 10), // minutos
    cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE || '86400000', 10), // 24h em ms
  },

  // Agent configuration
  agent: {
    productName: process.env.PRODUCT_NAME || 'Sistema de Automação de Marketing',
    productDescription: process.env.PRODUCT_DESCRIPTION || 
      'Plataforma completa de automação de marketing e vendas que ajuda empresas a aumentar conversões e otimizar processos comerciais',
    companyName: process.env.COMPANY_NAME || 'TechSolutions',
    tone: 'profissional, empático e consultivo',
    maxMessages: parseInt(process.env.MAX_MESSAGES || '50', 10),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '30', 10),
  } as AgentConfig,

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 min
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // Environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validação de configurações obrigatórias
export function validateConfig() {
  const required = {
    'DATABASE_URL': config.database.url,
    'OPENAI_API_KEY': config.openai.apiKey,
    'PIPEFY_API_KEY': config.pipefy.apiKey,
    'PIPEFY_PIPE_ID': config.pipefy.pipeId,
    'CALENDAR_API_KEY': config.calendar.apiKey,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Configurações obrigatórias faltando: ${missing.join(', ')}\n` +
      'Por favor, configure as variáveis de ambiente necessárias.'
    );
  }
}

export default config;