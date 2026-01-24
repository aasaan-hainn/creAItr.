import { useState, useEffect, useCallback } from "react";
import { Bold, Italic, Underline, Download, Copy, Save, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function WritingArea({ projectId, token }) {
    const [content, setContent] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load content on mount or projectId change
    useEffect(() => {
        if (projectId) {
            loadContent();
        }
    }, [projectId]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${projectId}/workspace/writing`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setContent(data.writing || "");
        } catch (error) {
            console.error("Error loading content:", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced auto-save
    useEffect(() => {
        if (!projectId || loading) return;

        const timeout = setTimeout(() => {
            saveContent();
        }, 1000); // Auto-save after 1 second of no typing

        return () => clearTimeout(timeout);
    }, [content, projectId]);

    const saveContent = async () => {
        if (!projectId) return;

        setSaving(true);
        try {
            await fetch(`${API_BASE_URL}/projects/${projectId}/workspace/writing`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ writing: content })
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Error saving content:", error);
        } finally {
            setSaving(false);
        }
    };

    const applyFormat = (format) => {
        const textarea = document.getElementById("writing-textarea");
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

        const newContent = content.substring(0, start) + formattedText + content.substring(end);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                Loading...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
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

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-300 transition-colors"
                    >
                        {showPreview ? "Edit" : "Preview"}
                    </button>
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
            <div className="flex-1 overflow-hidden p-4">
                {showPreview ? (
                    <div className="h-full overflow-y-auto prose prose-invert max-w-none">
                        <ReactMarkdown>{content || "*Nothing to preview*"}</ReactMarkdown>
                    </div>
                ) : (
                    <textarea
                        id="writing-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start writing... (Supports Markdown)"
                        className="w-full h-full bg-transparent text-slate-200 placeholder-slate-500 outline-none resize-none font-mono text-sm leading-relaxed"
                    />
                )}
            </div>
        </div>
    );
}
