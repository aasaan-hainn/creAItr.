import Header from "../components/Header";
import AIChat from "../components/tools/AIChat";

function Chat() {
  return (
    <div className="h-screen bg-black overflow-hidden flex flex-col">
      <Header />
      <div className="flex-1 h-full pt-24 relative">
        <AIChat />
      </div>
    </div>
  );
}

export default Chat;
