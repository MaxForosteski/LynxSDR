import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import databaseService from '../services/database';
import openaiService from '../services/openai';
import { executeFunctionCall } from '../utils/functions';
import { ChatRequest, ChatResponse, ValidationError } from '../types';

export async function chatHandler(req: Request, res: Response) {
  try {
    const { sessionId, message, metadata }: ChatRequest = req.body;

    if (!message || message.trim().length === 0) {
      throw new ValidationError('Mensagem não pode estar vazia');
    }

    let session = sessionId
      ? await databaseService.getSession(sessionId)
      : null;

    let finalSessionId = sessionId;

    if (!session) {
      finalSessionId = uuidv4();
      session = await databaseService.createSession(finalSessionId);
    } else {
      if (new Date() > session.expiresAt) {
        await databaseService.updateSessionStatus(finalSessionId, 'expired');
        throw new ValidationError('Sessão expirada. Por favor, inicie uma nova conversa.');
      }

      await databaseService.extendSession(finalSessionId);
    }

    await databaseService.saveMessage(finalSessionId, {
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    const history = await databaseService.getMessages(finalSessionId);

    const conversationData = await databaseService.getConversationData(finalSessionId);

    let openAiResponse = await openaiService.chat(history, conversationData);

    if (openAiResponse.functionCalls && openAiResponse.functionCalls.length > 0) {
      const functionResults = [];

      for (const functionCall of openAiResponse.functionCalls) {
        const result = await executeFunctionCall(
          functionCall.name,
          functionCall.args,
          finalSessionId
        );

        functionResults.push({
          name: functionCall.name,
          response: result,
        });
      }

      openAiResponse = await openaiService.chatWithFunctionResult(
        history,
        functionResults,
        conversationData
      );
    }

    await databaseService.saveMessage(finalSessionId, {
      role: 'assistant',
      content: openAiResponse.message,
      timestamp: new Date(),
    });

    const response: ChatResponse = {
      message: openAiResponse.message,
      sessionId: finalSessionId,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Erro no chat handler:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Erro ao processar mensagem. Por favor, tente novamente.',
    });
  }
}

export async function getHistoryHandler(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new ValidationError('SessionId é obrigatório');
    }

    const session = await databaseService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Sessão não encontrada',
      });
    }

    const messages = await databaseService.getMessages(sessionId);

    res.json({
      sessionId,
      messages,
      status: session.status,
    });
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      error: 'Erro ao buscar histórico de mensagens',
    });
  }
}

export async function startSessionHandler(req: Request, res: Response) {
  try {
    const sessionId = uuidv4();
    const session = await databaseService.createSession(sessionId);

    const initialMessage = `Olá! Eu sou o assistente virtual da ${req.body.companyName || 'nossa empresa'}. 

Estou aqui para ajudá-lo a conhecer nosso ${req.body.productName || 'produto/serviço'} e entender como podemos atender suas necessidades.

Para começar, como posso te chamar?`;

    await databaseService.saveMessage(sessionId, {
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date(),
    });

    res.json({
      sessionId,
      message: initialMessage,
      expiresAt: session.expiresAt,
    });
  } catch (error: any) {
    console.error('Erro ao iniciar sessão:', error);
    res.status(500).json({
      error: 'Erro ao iniciar sessão',
    });
  }
}

export async function endSessionHandler(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new ValidationError('SessionId é obrigatório');
    }

    await databaseService.updateSessionStatus(sessionId, 'completed');

    res.json({
      message: 'Sessão encerrada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao encerrar sessão:', error);
    res.status(500).json({
      error: 'Erro ao encerrar sessão',
    });
  }
}

export async function healthCheckHandler(req: Request, res: Response) {
  try {
    await databaseService.query('SELECT 1');

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        api: 'ok',
      },
    });
  } catch (error: any) {
    console.error('Health check falhou:', error);
    res.status(503).json({
      status: 'error',
      error: error.message,
    });
  }
}