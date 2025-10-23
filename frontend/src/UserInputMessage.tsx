import { IoMdSend } from "react-icons/io";

export default function UserInputMessage() {
    return (
        <div className="w-full lg:w-[90%] m-2 flex border-gray-200 border-1 border-solid rounded-full">
            <form className="p-2 pl-5 flex w-full justify-between">
                <input type="text" className="w-[95%] 2xl:text-lg" id="user-input" name="user-input" placeholder="Type your message here..." />
                <button type="submit" className="p-2 2xl:p-3 bg-blue-600 w-auto rounded-full hover:bg-blue-700">
                    <IoMdSend className="text-xl 2xl:text-xl text-white"/>
                </button>
            </form>
        </div>
    );
}