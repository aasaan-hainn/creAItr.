import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Volume2,
  Sparkles,
  Zap,
  ArrowLeft,
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DEFAULT_MESSAGE = {
  role: "ai",
  content: "Hello! I am connected to **Qwen 3 (NVIDIA)** and your local **News Database**. \n\nI can analyze PDFs, read the latest news, and answer your questions with real-time reasoning.",
  thought: "",
};

function AIChat({ hideSidebar = false, projectId = null }) {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([DEFAULT_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Standalone chat session state
  const [chatSessions, setChatSessions] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Restore pending message from Landing Page
  useEffect(() => {
    const pendingMsg = localStorage.getItem("pending_chat_message");
    if (pendingMsg) {
      setInput(pendingMsg);
      localStorage.removeItem("pending_chat_message");
    }
  }, []);

  // Initial load: either project history or recent standalone chats
  useEffect(() => {
    if (projectId) {
      loadChatHistory();
    } else if (isAuthenticated && !hideSidebar) {
      fetchRecentChatSessions();
    }
  }, [projectId, isAuthenticated, hideSidebar]);

  const fetchRecentChatSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chats`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      setChatSessions(data);
    } catch (e) {
      console.error("Error fetching sessions:", e);
    }
  };

  const loadChatHistory = async () => {
    setHistoryLoading(true);
    try {
      const url = projectId 
        ? `${API_BASE_URL}/projects/${projectId}/workspace/chat`
        : `${API_BASE_URL}/chats/${currentChatId}`;
      
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      
      const history = projectId ? data.chatHistory : data.messages;
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([DEFAULT_MESSAGE]);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      setMessages([DEFAULT_MESSAGE]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const startNewStandaloneChat = () => {
    setCurrentChatId(null);
    setMessages([DEFAULT_MESSAGE]);
  };

  const deleteChatSession = async (chatId, e) => {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;
    
    try {
      await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (currentChatId === chatId) {
        startNewStandaloneChat();
      }
      fetchRecentChatSessions();
    } catch (e) {
      console.error("Error deleting chat:", e);
    }
  };

  const renameChatSession = async (chatId) => {
    if (!editingTitle.trim()) {
      setEditingChatId(null);
      return;
    }
    
    try {
      await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ title: editingTitle.trim() })
      });
      setEditingChatId(null);
      fetchRecentChatSessions();
    } catch (e) {
      console.error("Error renaming chat:", e);
    }
  };

  const saveChatMessage = async (message, existingChatId = null) => {
    const targetChatId = existingChatId || currentChatId;
    
    // 1. If inside a project
    if (projectId) {
      try {
        await fetch(`${API_BASE_URL}/projects/${projectId}/workspace/chat`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(message),
        });
      } catch (error) {
        console.error("Error saving project chat message:", error);
      }
      return null;
    }

    // 2. If standalone chat
    if (!isAuthenticated) return null;

    try {
      let chatId = targetChatId;
      
      // Create new session if none exists
      if (!chatId) {
        const createRes = await fetch(`${API_BASE_URL}/chats`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ title: message.content.substring(0, 30) })
        });
        const newChat = await createRes.json();
        chatId = newChat._id;
        setCurrentChatId(chatId);
        fetchRecentChatSessions(); // Refresh list
      }

      // Add message to session
      await fetch(`${API_BASE_URL}/chats/${chatId}/message`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(message),
      });

      return chatId;
    } catch (e) {
      console.error("Error saving standalone chat message:", e);
      return null;
    }
  };

  // Function to refresh news database
  const updateNews = async () => {
    setNewsLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/update-news`, {
        method: "POST",
      });
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

    // Save user message and get chatId if it's new
    const savedChatId = await saveChatMessage(userMsg);
    const activeChatId = savedChatId || currentChatId;

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

      const response = await fetch(
        `${API_BASE_URL}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input, history: historyPayload }),
        },
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Track accumulated content for saving
      let accumulatedContent = "";
      let accumulatedThought = "";

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

              if (data.type === "thought") {
                accumulatedThought += data.content;
              } else {
                accumulatedContent += data.content;
              }

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

      // Save AI response to project history
      if (accumulatedContent) {
        saveChatMessage({ 
          role: "ai", 
          content: accumulatedContent, 
          thought: accumulatedThought 
        }, activeChatId);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-full bg-black text-slate-100 font-sans relative selection:bg-indigo-500/30">
      {/* Background Gradients */}
      {/* <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" /> */}

      {/* Sidebar */}
      {!hideSidebar && (
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 hidden md:flex flex-col relative z-20"
        >
          <div className="p-6 border-b border-white/5">
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <div className="flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold text-2xl mb-6">
              <Bot size={32} className="text-indigo-500" />
              <span>Creaty Chat</span>
            </div>
            
            <button
              onClick={startNewStandaloneChat}
              className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl transition-all text-sm font-medium mb-4 group"
            >
              <Plus size={18} className="text-indigo-400 group-hover:rotate-90 transition-transform" />
              New Chat
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">
              Recent Chats
            </div>
            
            <AnimatePresence>
              {chatSessions.map((session) => (
                <motion.div
                  key={session._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => {
                    if (editingChatId !== session._id) {
                      setCurrentChatId(session._id);
                      loadChatHistory();
                    }
                  }}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                    currentChatId === session._id 
                    ? "bg-indigo-500/10 border-indigo-500/30 text-white" 
                    : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <MessageSquare size={16} className={currentChatId === session._id ? "text-indigo-400" : "text-slate-500"} />
                    
                    {editingChatId === session._id ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameChatSession(session._id);
                          if (e.key === "Escape") setEditingChatId(null);
                        }}
                        onBlur={() => renameChatSession(session._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-black/40 border border-indigo-500/50 rounded px-2 py-0.5 text-sm w-full outline-none text-white focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      <span className="text-sm truncate pr-2">{session.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {editingChatId === session._id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          renameChatSession(session._id);
                        }}
                        className="p-1 hover:bg-emerald-500/20 rounded text-emerald-400"
                      >
                        <Check size={14} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChatId(session._id);
                            setEditingTitle(session.title);
                          }}
                          className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-indigo-400"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => deleteChatSession(session._id, e)}
                          className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="p-4 border-t border-white/5 space-y-3">
            <button
              onClick={updateNews}
              disabled={newsLoading}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 p-3 rounded-xl transition-all text-sm disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={newsLoading ? "animate-spin" : ""}
              />
              {newsLoading ? "Updating..." : "Update Knowledge Base"}
            </button>
            <div className="text-center text-[10px] text-slate-600">
              Powered by RAG • Qwen 2.5
            </div>
          </div>
        </motion.div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col w-full relative z-10 max-w-6xl mx-auto">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="min-h-full flex flex-col justify-end space-y-8">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 md:gap-6 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === "ai"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                      : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                      }`}
                  >
                    {msg.role === "ai" ? <Bot size={20} /> : <User size={20} />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    {/* Thinking Box (Only for AI) */}
                    {msg.thought && <ThoughtBox text={msg.thought} />}

                    {/* Final Answer */}
                    {msg.content && (
                      <div className="relative group">
                        <div
                          className={`p-5 rounded-2xl shadow-xl backdrop-blur-sm leading-relaxed text-[0.95rem] md:text-base ${msg.role === "user"
                            ? "bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-tr-none border border-white/10"
                            : "bg-white/5 text-slate-200 rounded-tl-none border border-white/10 hover:bg-white/10 transition-colors"
                            }`}
                        >
                          <ReactMarkdown
                            components={{
                              code: ({ node, ...props }) => (
                                <code
                                  className="bg-black/30 rounded px-1 py-0.5 text-indigo-300 font-mono text-sm"
                                  {...props}
                                />
                              ),
                              pre: ({ node, ...props }) => (
                                <pre
                                  className="bg-black/50 p-4 rounded-lg overflow-x-auto my-2 text-sm border border-white/5"
                                  {...props}
                                />
                              ),
                              a: ({ node, ...props }) => (
                                <a
                                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                                  {...props}
                                />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul
                                  className="list-disc pl-4 space-y-1 my-2"
                                  {...props}
                                />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol
                                  className="list-decimal pl-4 space-y-1 my-2"
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        {/* TTS Button (Only for AI) */}
                        {msg.role === "ai" && msg.content && (
                          <button
                            onClick={() => playAudio(msg.content)}
                            className="absolute -right-10 top-2 p-2 text-slate-500 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Read Aloud"
                          >
                            <Volume2 size={20} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="relative flex items-end gap-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything..."
              className="w-full bg-transparent p-3 max-h-32 outline-none text-slate-200 placeholder-slate-500 resize-none overflow-y-auto"
              disabled={loading}
              autoComplete="off"
            />
            <div className="flex gap-2 pb-1 pr-1">
              <button
                disabled
                className="p-2 text-slate-500 hover:text-indigo-400 transition-colors hover:bg-white/5 rounded-lg"
                title="Upload File (Coming Soon)"
              >
                <Sparkles size={20} />
              </button>
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-95"
              >
                <Send size={20} className={loading ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>
          <div className="text-center mt-3">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">
              AI can make mistakes. Check important info.
            </p>
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
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mb-2 w-full max-w-2xl"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-wider mb-2 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit border border-emerald-500/20"
      >
        <Zap size={12} className={open ? "fill-current" : ""} />
        {open ? "Hide Reasoning" : "Show Reasoning"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-black/40 border-l-2 border-emerald-500/50 p-4 rounded-r-lg text-sm text-slate-400 font-mono text-xs leading-relaxed shadow-inner">
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIChat;
