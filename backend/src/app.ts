import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config, { validateConfig } from './config';
import {
  chatHandler,
  getHistoryHandler,
  startSessionHandler,
  endSessionHandler,
  healthCheckHandler,
} from './handlers/chat';
import { AppError } from './types';

validateConfig();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Muitas requisições, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    ip: req.ip,
  });
  next();
});

// ===== ROUTES =====

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

app.post('/api/session/start', startSessionHandler);
app.delete('/api/session/:sessionId', endSessionHandler);

app.post('/api/chat', chatHandler);
app.get('/api/chat/:sessionId/history', getHistoryHandler);

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'LynxSDR API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      startSession: 'POST /api/session/start',
      chat: 'POST /api/chat',
      history: 'GET /api/chat/:sessionId/history',
      endSession: 'DELETE /api/session/:sessionId',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro não tratado:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  res.status(500).json({
    error: 'Erro interno do servidor',
    message: config.env === 'development' ? err.message : undefined,
  });
});


process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando com segurança...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, encerrando com segurança...');
  process.exit(0);
});

export default app;