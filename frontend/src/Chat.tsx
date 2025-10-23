import ChatMessage from "./ChatMessage";
import type { ChatMessageProps } from "./ChatMessage";

type ChatProps = {
    messages: ChatMessageProps[]
}

export default function Chat({ messages }: ChatProps) {
    return(
        <div className="flex flex-col">
            {messages.map((message, index) => (
                <ChatMessage key={index} type={message.type} content={message.content} />
            ))}
        </div>
    );
}