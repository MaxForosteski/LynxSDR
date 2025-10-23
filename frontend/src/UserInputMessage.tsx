import { IoMdSend } from "react-icons/io";

export default function UserInputMessage() {
    return (
        <div className="w-99 m-2 flex border-gray-200 border-1 border-solid rounded-full">
            <form className="p-2 pl-5 flex w-full justify-between">
                <input type="text" id="user-input" name="user-input" placeholder="Type your message here..." />
                <button type="submit" className="p-2 bg-blue-600 rounded-full hover:bg-blue-700">
                    <IoMdSend className="text-xl text-white"/>
                </button>
            </form>
        </div>
    );
}