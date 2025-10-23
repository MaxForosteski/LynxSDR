export type ChatMessageProps = {
    type: "user" | "bot"
    content: string
}

export default function ChatMessage({ type, content }: ChatMessageProps) {
    return (
        <div className={"flex w-full " + (type === "user" ? "justify-end" : "justify-start")}>
            <div className={"p-3 w-fit flex align-center rounded-lg m-3 text-sm 2xl:text-lg " + (type === "user" ? "bg-black text-white ml-8 max-w-[85%] md:max-w-[65%] xl:max-w-[53%] 2xl:max-w-[45%]" : "bg-gray-200 text-black mr-8 max-w-[95%] 2xl:max-w-[90%]")}>
                <p>{content}</p>
            </div>
        </div>

    );
}