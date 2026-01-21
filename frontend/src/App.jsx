import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Newspaper,
  Volume2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hello! I am connected to Qwen 3 (NVIDIA) and your local News Database. Ask me anything!",
      thought: "",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Function to refresh news database
  const updateNews = async () => {
    setNewsLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/update-news`, { method: "POST" });
      alert("News Database Updated Successfully!");
    } catch (e) {
      alert("Error updating news: " + e);
    }
    setNewsLoading(false);
  };

  // Function to play TTS
  const playAudio = async (text) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  // Function to send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Create a placeholder for AI response
    const aiMsgId = Date.now();
    setMessages((prev) => [
      ...prev,
      { role: "ai", content: "", thought: "", id: aiMsgId },
    ]);

    try {
      // Prepare history (exclude thought/id fields)
      const historyPayload = messages.map(({ role, content }) => ({
        role,
        content,
      }));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: historyPayload }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "");
            if (jsonStr === "[DONE]") break;

            try {
              const data = JSON.parse(jsonStr);

              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id === aiMsgId) {
                    if (data.type === "thought") {
                      return { ...msg, thought: msg.thought + data.content };
                    } else {
                      return { ...msg, content: msg.content + data.content };
                    }
                  }
                  return msg;
                }),
              );
            } catch (e) {
              console.error("Parse error", e);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-950 p-4 border-r border-slate-800 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8 text-emerald-400 font-bold text-xl">
          <Bot size={28} />
          <span>Qwen-RAG</span>
        </div>

        <button
          onClick={updateNews}
          disabled={newsLoading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 p-3 rounded-lg transition-all text-sm font-medium mb-4"
        >
          <RefreshCw size={18} className={newsLoading ? "animate-spin" : ""} />
          {newsLoading ? "Scraping News..." : "Update News DB"}
        </button>

        <div className="mt-auto text-xs text-slate-500">
          Powered by NVIDIA Nemotron
          <br />& Local ChromaDB
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "ai" ? "bg-emerald-600" : "bg-blue-600"}`}
              >
                {msg.role === "ai" ? <Bot size={18} /> : <User size={18} />}
              </div>

              {/* Bubble */}
              <div
                className={`flex flex-col max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {/* Thinking Box (Only for AI) */}
                {msg.thought && <ThoughtBox text={msg.thought} />}

                {/* Final Answer */}
                {msg.content && (
                  <div className="relative group">
                    <div
                      className={`p-4 rounded-2xl shadow-lg mt-2 leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                      }`}
                    >
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {/* TTS Button (Only for AI) */}
                    {msg.role === "ai" && msg.content && (
                      <button
                        onClick={() => playAudio(msg.content)}
                        className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Read Aloud"
                      >
                        <Volume2 size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="relative flex items-center bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask Qwen about the news..."
              className="w-full bg-transparent p-4 outline-none text-slate-200 placeholder-slate-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="p-2 mr-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate Component for the Collapsible Thought Process
const ThoughtBox = ({ text }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2 w-full max-w-2xl">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider mb-1"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Reasoning Process
      </button>

      {open && (
        <div className="bg-slate-950/50 border-l-2 border-slate-700 p-3 rounded-r text-sm text-slate-400 font-mono text-xs leading-relaxed animate-in fade-in slide-in-from-top-2">
          {text}
        </div>
      )}
    </div>
  );
};

export default App;
