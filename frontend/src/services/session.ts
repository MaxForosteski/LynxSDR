import { Message } from '../types';

const SESSION_STORAGE_KEY = 'sdr_agent_session';
const MESSAGES_STORAGE_KEY = 'sdr_agent_messages';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

interface StoredSession {
  sessionId: string;
  expiresAt: number;
  lastActivity: number;
}

class SessionService {
  /**
   * Salva a sessão no localStorage
   */
  saveSession(sessionId: string, expiresAt?: Date): void {
    const session: StoredSession = {
      sessionId,
      expiresAt: expiresAt
        ? expiresAt.getTime()
        : Date.now() + SESSION_TIMEOUT,
      lastActivity: Date.now(),
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  /**
   * Recupera a sessão do localStorage
   */
  getSession(): string | null {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!stored) return null;

    try {
      const session: StoredSession = JSON.parse(stored);

      // Verificar se a sessão expirou
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      // Atualizar última atividade
      session.lastActivity = Date.now();
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

      return session.sessionId;
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
      return null;
    }
  }

  /**
   * Remove a sessão
   */
  clearSession(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
  }

  /**
   * Salva mensagens no localStorage
   */
  saveMessages(messages: Message[]): void {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Erro ao salvar mensagens:', error);
    }
  }

  /**
   * Recupera mensagens do localStorage
   */
  getMessages(): Message[] {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);

    if (!stored) return [];

    try {
      const messages = JSON.parse(stored);
      // Converter timestamps de string para Date
      return messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      console.error('Erro ao recuperar mensagens:', error);
      return [];
    }
  }

  /**
   * Verifica se a sessão ainda está ativa
   */
  isSessionActive(): boolean {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!stored) return false;

    try {
      const session: StoredSession = JSON.parse(stored);
      return Date.now() < session.expiresAt;
    } catch (error) {
      return false;
    }
  }

  /**
   * Atualiza o tempo de expiração da sessão
   */
  extendSession(): void {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!stored) return;

    try {
      const session: StoredSession = JSON.parse(stored);
      session.expiresAt = Date.now() + SESSION_TIMEOUT;
      session.lastActivity = Date.now();
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Erro ao estender sessão:', error);
    }
  }

  /**
   * Gera um ID de sessão anônimo (baseado em cookie/localStorage)
   */
  generateAnonymousId(): string {
    let anonymousId = localStorage.getItem('sdr_anonymous_id');

    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sdr_anonymous_id', anonymousId);
    }

    return anonymousId;
  }
}

export default new SessionService();