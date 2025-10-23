import UserInputMessage from "./UserInputMessage";
import Chat from "./Chat";
import type { ChatMessageProps } from "./ChatMessage";
import { useEffect, useState } from "react";

export default function App() {
    const [messages, setMessages] = useState<ChatMessageProps[]>([]);

    useEffect(() => {
        setMessages([
            { type: "bot", content: "Hello! How can i help you?" },
            { type: "user", content: "i dont know" },

            { type: "bot", content: "Hello! How can i help you?" },
            { type: "user", content: "i dont know" },

            { type: "bot", content: "Hello! How can i help you?" },
            { type: "user", content: "i dont know" },

            { type: "bot", content: "Hello! How can i help you?" },
            { type: "user", content: "i dont know" },

            { type: "bot", content: "Hello! How can i help you?" },
            { type: "user", content: "i dont know" },

            { type: "bot", content: "Hello! How can i help you?" },
            { type: "user", content: "i dont know" },

            { type: "bot", content: "Hello! How can i help you?" },
            { type: "user", content: "i dont know" },

            { type: "bot", content: "Hello! How can i help you?" },
            { type: "user", content: "i dont know" },

            { type: "bot", content: "Hello! How can i help you?" },
            { type: "user", content: "i dont know" },

            { type: "bot", content: "Hello! How can i help you?" },
            { type: "user", content: "i dont know" },

            { type: "bot", content: "Hello! How can i help you?" },
            { type: "user", content: "i dont know" },
        ])
    }
        , [])

    return (
        <div className="h-screen flex flex-col bg-white">
            <div className="shrink-0 h-12 p-2 w-full bg-gray-800">
                <h1 className="text-white text-xl ml-5 font-bold">LynxSDR</h1>
            </div>

            <div className="flex-1 w-full overflow-y-auto">
                <Chat messages={messages} />
            </div>

            <div className="shrink-0 h-24 w-[98vw] mx-2 flex justify-center items-center">
                <UserInputMessage />
            </div>
        </div>
    );
}