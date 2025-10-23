import UserInputMessage from "./UserInputMessage";

export default function App() {
    return(
        <div className="bg-white h-screen">
            <div className="p-2 w-full bg-gray-800">
                <h1 className="text-white text-xl font-bold">LynxSDR</h1>
            </div>
            <div className="absolute flex justify-center bottom-0 w-full">
                <UserInputMessage />
            </div>
        </div>
    );
}