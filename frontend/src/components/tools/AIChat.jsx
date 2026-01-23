import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AIChat() {
    const [messages, setMessages] = useState([
        {
            role: "ai",
            content: "Hello! I'm your AI assistant. How can I help you today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        const aiMsgId = Date.now();
        setMessages((prev) => [
            ...prev,
            { role: "ai", content: "", id: aiMsgId },
        ]);

        try {
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
                const lines = chunk.split("\\n\\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const jsonStr = line.replace("data: ", "");
                        if (jsonStr === "[DONE]") break;

                        try {
                            const data = JSON.parse(jsonStr);

                            setMessages((prev) =>
                                prev.map((msg) => {
                                    if (msg.id === aiMsgId && data.type === "answer") {
                                        return { ...msg, content: msg.content + data.content };
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
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === aiMsgId
                        ? { ...msg, content: "Error: Could not connect to AI service." }
                        : msg
                ),
            );
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                        {/* Avatar */}
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "ai" ? "bg-indigo-600" : "bg-blue-600"}`}
                        >
                            {msg.role === "ai" ? <Bot size={16} /> : <User size={16} />}
                        </div>

                        {/* Message Bubble */}
                        <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                            {msg.content && (
                                <div
                                    className={`p-3 rounded-xl shadow-lg leading-relaxed text-sm ${msg.role === "user"
                                        ? "bg-blue-600 text-white rounded-tr-none"
                                        : "bg-white/5 text-slate-200 rounded-tl-none border border-white/10"
                                        }`}
                                >
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10">
                <div className="relative flex items-center bg-white/5 rounded-xl border border-white/10">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type your message..."
                        className="w-full bg-transparent p-3 outline-none text-slate-200 placeholder-slate-500"
                        disabled={loading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="p-2 mr-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
