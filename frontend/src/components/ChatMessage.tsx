import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
    message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.role === 'user';

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (message.isLoading) {
        return (
            <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01"
                        />
                    </svg>
                </div>
                <div className="flex-1 bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex items-start gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''
                }`}
            role="article"
            aria-label={`Mensagem de ${isUser ? 'você' : 'assistente'}`}
        >
            {/* Avatar */}
            <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
            >
                {isUser ? (
                    <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                ) : (
                    <svg
                        className="w-5 h-5 text-white"
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
                )}
            </div>

            {/* Message bubble */}
            <div className="flex-1 max-w-[80%]">
                <div
                    className={`rounded-2xl px-4 py-3 ${isUser
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-gray-100 text-gray-900 rounded-tl-none'
                        }`}
                >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                    </p>
                </div>
                <div
                    className={`text-xs text-gray-500 mt-1 px-2 ${isUser ? 'text-right' : 'text-left'
                        }`}
                >
                    {formatTime(message.timestamp)}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;