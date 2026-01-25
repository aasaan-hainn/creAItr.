import { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Download,
  Copy,
  Save,
  Check,
  Wand2,
  Sparkles,
  X,
  Send,
  Loader2,
  SplitSquareHorizontal,
  Eye,
  Edit3,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to convert LaTeX delimiters to Markdown delimiters
const preprocessLaTeX = (content) => {
  if (typeof content !== "string") return content;
  return content
    .replace(/\\\[/g, "$$$")
    .replace(/\\\\]/g, "$$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\\]/g, "$");
};

export default function WritingArea({ projectId, token }) {
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState("edit"); // "edit", "preview", "split"
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI States
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [selectedContext, setSelectedContext] = useState("");
  const textareaRef = useRef(null);

  // Load content on mount or projectId change
  useEffect(() => {
    if (!projectId) return;

    const loadContent = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/projects/${projectId}/workspace/writing`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        setContent(data.writing || "");
      } catch (error) {
        console.error("Error loading content:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [projectId, token]);

  // Debounced auto-save
  useEffect(() => {
    if (!projectId || loading) return;

    const saveContent = async () => {
      setSaving(true);
      try {
        await fetch(`${API_BASE_URL}/projects/${projectId}/workspace/writing`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ writing: content }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (error) {
        console.error("Error saving content:", error);
      } finally {
        setSaving(false);
      }
    };

    const timeout = setTimeout(() => {
      saveContent();
    }, 1000); // Auto-save after 1 second of no typing

    return () => clearTimeout(timeout);
  }, [content, projectId, token, loading]);

  const applyFormat = (format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        break;
      case "underline":
        formattedText = `<u>${selectedText}</u>`;
        break;
      default:
        return;
    }

    const newContent =
      content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
  };

  const downloadAsMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "document.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert("Copied to clipboard!");
  };

  // Capture selection for AI
  const handleSelect = (e) => {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    if (start !== end) {
      setSelectedContext(content.substring(start, end));
    } else {
      setSelectedContext("");
    }
  };

  const generateWriting = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setAiError("");

    try {
      const payload = { prompt: aiPrompt };
      let mode = "generate"; // generate, edit-selection, edit-full

      if (selectedContext) {
        payload.selectedText = selectedContext;
        mode = "edit-selection";
      } else if (content.trim()) {
        payload.fullText = content;
        mode = "edit-full";
      }

      const response = await fetch(`${API_BASE_URL}/generate-writing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const generatedText = data.text;
      const textarea = textareaRef.current;

      if (mode === "edit-selection" && textarea) {
        // Replace selection
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          content.substring(0, start) + generatedText + content.substring(end);
        setContent(newContent);
      } else if (mode === "edit-full") {
        // Replace full document
        setContent(generatedText);
      } else if (textarea) {
        // Insert at cursor (scratch generation)
        const start = textarea.selectionStart;
        const newContent =
          content.substring(0, start) +
          generatedText +
          content.substring(start);
        setContent(newContent);
      } else {
        // Fallback append
        setContent((prev) => prev + "\n" + generatedText);
      }

      setAiPrompt("");
      setIsAISidebarOpen(false);
      setSelectedContext("");
    } catch (error) {
      console.error("Error generating writing:", error);
      setAiError(error.message || "Failed to generate text");
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    "Fix grammar and spelling",
    "Make this more professional",
    "Summarize this paragraph",
    "Expand on this idea",
  ];

  // Calculate stats
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Loading...
      </div>
    );
  }

  const renderEditor = () => (
    <textarea
      ref={textareaRef}
      id="writing-textarea"
      value={content}
      onChange={(e) => setContent(e.target.value)}
      onSelect={handleSelect}
      onClick={handleSelect}
      onKeyUp={handleSelect}
      placeholder="Start writing... (Supports Markdown)"
      className="w-full h-full bg-transparent text-slate-200 placeholder-slate-500 outline-none resize-none font-mono text-sm leading-relaxed p-4"
    />
  );

  const renderPreview = () => (
    <div className="h-full overflow-y-auto prose prose-invert max-w-none p-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: ({ ...props }) => (
            <code
              className="bg-white/10 rounded px-1 py-0.5 text-indigo-300 font-mono text-sm"
              {...props}
            />
          ),
          pre: ({ ...props }) => (
            <pre
              className="bg-black/50 p-4 rounded-lg overflow-x-auto my-2 text-sm border border-white/5"
              {...props}
            />
          ),
          a: ({ ...props }) => (
            <a
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
              {...props}
            />
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc pl-4 space-y-1 my-2" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4 w-full">
              <table
                className="min-w-full divide-y divide-white/10 border border-white/10 rounded-xl overflow-hidden"
                {...props}
              />
            </div>
          ),
          thead: ({ ...props }) => <thead className="bg-white/5" {...props} />,
          th: ({ ...props }) => (
            <th
              className="px-4 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/10"
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td
              className="px-4 py-2 text-sm text-slate-300 border-b border-white/5"
              {...props}
            />
          ),
        }}
      >
        {preprocessLaTeX(content) || "*Nothing to preview*"}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 relative overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex gap-2">
          <button
            onClick={() => applyFormat("bold")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Bold"
          >
            <Bold size={18} className="text-slate-300" />
          </button>
          <button
            onClick={() => applyFormat("italic")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Italic"
          >
            <Italic size={18} className="text-slate-300" />
          </button>
          <button
            onClick={() => applyFormat("underline")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Underline"
          >
            <Underline size={18} className="text-slate-300" />
          </button>

          {/* Save Status */}
          <div className="flex items-center gap-1 ml-4 text-xs text-slate-500">
            {saving ? (
              <>
                <Save size={14} className="animate-pulse" />
                <span>Saving...</span>
              </>
            ) : saved ? (
              <>
                <Check size={14} className="text-green-500" />
                <span className="text-green-500">Saved</span>
              </>
            ) : (
              <span>Auto-save enabled</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {/* View Mode Toggles */}
          <div className="flex bg-white/5 rounded-lg p-1 mr-2">
            <button
              onClick={() => setViewMode("edit")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "edit" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
              title="Edit Mode"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "split" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
              title="Split View"
            >
              <SplitSquareHorizontal size={16} />
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "preview" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
              title="Preview Mode"
            >
              <Eye size={16} />
            </button>
          </div>

          <button
            onClick={copyToClipboard}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Copy"
          >
            <Copy size={18} className="text-slate-300" />
          </button>
          <button
            onClick={downloadAsMarkdown}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Download"
          >
            <Download size={18} className="text-slate-300" />
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {viewMode === "edit" && (
            <div className="w-full h-full">{renderEditor()}</div>
          )}
          {viewMode === "preview" && (
            <div className="w-full h-full">{renderPreview()}</div>
          )}
          {viewMode === "split" && (
            <>
              <div className="w-1/2 h-full border-r border-white/10">
                {renderEditor()}
              </div>
              <div className="w-1/2 h-full bg-black/20">{renderPreview()}</div>
            </>
          )}
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 px-2 py-1 text-[10px] text-slate-500 font-mono border-t border-white/5 uppercase tracking-widest shrink-0">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>{readingTime} min read</span>
        </div>
      </div>

      {/* Write with AI Button */}
      <button
        onClick={() => setIsAISidebarOpen(true)}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-105 font-medium text-sm"
      >
        <Wand2 size={16} />
        <span>Write with AI</span>
        <Sparkles size={14} className="opacity-70" />
      </button>

      {/* AI Sidebar */}
      <div
        className={`absolute top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-20 transform transition-transform duration-300 ease-out ${isAISidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg">
              <Wand2 size={16} className="text-white" />
            </div>
            <span className="font-semibold text-white">Write with AI</span>
          </div>
          <button
            onClick={() => setIsAISidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="p-4 flex flex-col h-[calc(100%-60px)]">
          <p className="text-slate-400 text-sm mb-4">
            {selectedContext
              ? `Editing selection (${selectedContext.length} chars). Describe how to change it.`
              : content.trim()
                ? "Editing entire document. AI will update the text based on your prompt."
                : "Describe what you want to write. AI will generate text for you."}
          </p>

          {/* Prompt Input */}
          <div className="relative mb-4">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generateWriting();
                }
              }}
              placeholder={
                selectedContext
                  ? "e.g., Fix grammar, make it shorter..."
                  : "e.g., Write an intro for a blog post about AI..."
              }
              className="w-full h-28 p-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              disabled={isGenerating}
            />
          </div>

          {/* Error Message */}
          {aiError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {aiError}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateWriting}
            disabled={!aiPrompt.trim() || isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>
                  {selectedContext ? "Edit Selection" : "Generate Text"}
                </span>
              </>
            )}
          </button>

          {/* Example Prompts */}
          <div className="mt-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
              Try these examples
            </p>
            <div className="space-y-2">
              {examplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setAiPrompt(prompt)}
                  disabled={isGenerating}
                  className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-white/5">
            <p className="text-xs text-slate-600 text-center">
              Powered by Qwen AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
