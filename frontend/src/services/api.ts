import {
  ApiChatRequest,
  ApiChatResponse,
  ApiStartSessionResponse,
  ApiHistoryResponse,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  /**
   * Inicia uma nova sessão
   */
  async startSession(): Promise<ApiStartSessionResponse> {
    const response = await fetch(`${this.baseUrl}/api/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Erro ao iniciar sessão');
    }

    return response.json();
  }

  /**
   * Envia mensagem para o chat
   */
  async sendMessage(request: ApiChatRequest): Promise<ApiChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao enviar mensagem');
    }

    return response.json();
  }

  /**
   * Busca histórico de mensagens
   */
  async getHistory(sessionId: string): Promise<ApiHistoryResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/chat/${sessionId}/history`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar histórico');
    }

    return response.json();
  }

  /**
   * Encerra uma sessão
   */
  async endSession(sessionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/session/${sessionId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao encerrar sessão');
    }
  }

  /**
   * Health check da API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default new ApiService();