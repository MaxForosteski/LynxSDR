import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatState } from '../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import apiService from '../services/api';
import sessionService from '../services/session';

export const ChatWidget: React.FC = () => {
  const [state, setState] = useState<ChatState>({
    sessionId: null,
    messages: [],
    isLoading: false,
    isConnected: false,
    error: null,
  });

  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  // Initialize chat
  useEffect(() => {
    initializeChat();
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (state.messages.length > 0) {
      sessionService.saveMessages(state.messages);
    }
  }, [state.messages]);

  const initializeChat = async () => {
    try {
      // Check API health
      const isHealthy = await apiService.healthCheck();
      setState((prev) => ({ ...prev, isConnected: isHealthy }));

      if (!isHealthy) {
        setState((prev) => ({
          ...prev,
          error: 'Não foi possível conectar ao servidor',
        }));
        return;
      }

      // Try to restore session
      const existingSessionId = sessionService.getSession();

      if (existingSessionId && sessionService.isSessionActive()) {
        // Restore session and messages
        const messages = sessionService.getMessages();
        setState((prev) => ({
          ...prev,
          sessionId: existingSessionId,
          messages,
        }));
      } else {
        // Start new session
        await startNewSession();
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      setState((prev) => ({
        ...prev,
        error: 'Erro ao inicializar chat',
        isConnected: false,
      }));
    }
  };

  const startNewSession = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await apiService.startSession();

      const initialMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        sessionId: response.sessionId,
        messages: [initialMessage],
        isLoading: false,
      }));

      sessionService.saveSession(
        response.sessionId,
        new Date(response.expiresAt)
      );
    } catch (error: any) {
      console.error('Error starting session:', error);
      setState((prev) => ({
        ...prev,
        error: error.message || 'Erro ao iniciar sessão',
        isLoading: false,
      }));
    }
  };

  const sendMessage = async (content: string) => {
    if (!state.sessionId || state.isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Add user message
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    // Add loading indicator
    const loadingMessage: Message = {
      id: 'loading',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, loadingMessage],
    }));

    try {
      const response = await apiService.sendMessage({
        sessionId: state.sessionId,
        message: content,
      });

      // Remove loading message and add response
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages.filter((m) => m.id !== 'loading'),
          {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: response.message,
            timestamp: new Date(),
          },
        ],
        isLoading: false,
      }));

      // Extend session
      sessionService.extendSession();
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Remove loading message and show error
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages.filter((m) => m.id !== 'loading'),
          {
            id: `msg_error_${Date.now()}`,
            role: 'assistant',
            content:
              'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
            timestamp: new Date(),
          },
        ],
        isLoading: false,
        error: error.message,
      }));
    }
  };

  const resetChat = async () => {
    if (state.sessionId) {
      try {
        await apiService.endSession(state.sessionId);
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }

    sessionService.clearSession();
    setState({
      sessionId: null,
      messages: [],
      isLoading: false,
      isConnected: false,
      error: null,
    });

    await startNewSession();
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all z-50"
        aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
      >
        {isOpen ? (
          <svg
            className="w-8 h-8 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-8 h-8 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-full max-w-md h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200"
          role="dialog"
          aria-label="Chat do assistente"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Assistente SDR</h3>
                <p className="text-xs text-blue-100">
                  {state.isConnected ? '🟢 Online' : '🔴 Offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetChat}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Reiniciar conversa"
                title="Reiniciar conversa"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={toggleChat}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Minimizar chat"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
          >
            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-semibold">Erro</p>
                <p>{state.error}</p>
              </div>
            )}

            {state.messages.length === 0 && !state.error && (
              <div className="text-center text-gray-500 py-12">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p>Iniciando conversa...</p>
              </div>
            )}

            {state.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput
            onSendMessage={sendMessage}
            disabled={state.isLoading || !state.isConnected}
            placeholder={
              state.isConnected
                ? 'Digite sua mensagem...'
                : 'Conectando ao servidor...'
            }
          />
        </div>
      )}
    </>
  );
};

export default ChatWidget;