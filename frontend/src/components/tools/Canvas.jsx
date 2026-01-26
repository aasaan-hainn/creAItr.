import { useState, useEffect, useRef } from "react";
import { Excalidraw, WelcomeScreen, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { Save, Check, Loader2, Maximize2, Minimize2, Wand2, X, Send, Sparkles } from "lucide-react";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import "@excalidraw/excalidraw/index.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Canvas({ projectId, token }) {
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const saveTimeoutRef = useRef(null);
    const containerRef = useRef(null);

    // AI Drawing states
    const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState("");

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error("Error toggling fullscreen:", error);
        }
    };

    useEffect(() => {
        if (projectId) {
            loadCanvas();
        }
    }, [projectId]);

    const loadCanvas = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/projects/${projectId}/workspace/canvas`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.canvas) {
                // Check if it's the old image format (base64)
                if (typeof data.canvas === 'string' && data.canvas.startsWith('data:image')) {
                    // Old format: ignore or maybe we could load it as an image element in the future
                    // For now, we start fresh to avoid crashing Excalidraw
                    setInitialData(null);
                    if (excalidrawAPI) excalidrawAPI.resetScene();
                } else {
                    // Try to parse JSON data
                    try {
                        const parsedData = typeof data.canvas === 'string'
                            ? JSON.parse(data.canvas)
                            : data.canvas;

                        setInitialData(parsedData);
                        if (excalidrawAPI) {
                            excalidrawAPI.updateScene(parsedData);
                        }
                    } catch (e) {
                        console.error("Failed to parse canvas data", e);
                        setInitialData(null);
                        if (excalidrawAPI) excalidrawAPI.resetScene();
                    }
                }
            } else {
                // No canvas data found for this project -> Reset to blank
                setInitialData(null);
                if (excalidrawAPI) {
                    excalidrawAPI.resetScene();
                }
            }
        } catch (error) {
            console.error("Error loading canvas:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveCanvas = async (elements, appState) => {
        if (!projectId) return;

        setSaving(true);
        setSaved(false);

        try {
            const canvasData = JSON.stringify({
                elements,
                appState: {
                    viewBackgroundColor: appState.viewBackgroundColor,
                    currentItemFontFamily: appState.currentItemFontFamily,
                    currentItemFontSize: appState.currentItemFontSize,
                    // Add other needed appState properties
                }
            });

            await fetch(`${API_BASE_URL}/projects/${projectId}/workspace/canvas`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ canvas: canvasData })
            });

            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Error saving canvas:", error);
            setSaving(false);
        }
    };

    const handleChange = (elements, appState) => {
        if (loading) return;

        // Debounce save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveCanvas(elements, appState);
        }, 1000);
    };

    // Generate drawing from AI prompt
    const generateDrawing = async () => {
        if (!aiPrompt.trim() || !excalidrawAPI) return;

        setIsGenerating(true);
        setAiError("");

        try {
            // 1. Get Mermaid code from backend
            const response = await fetch(`${API_BASE_URL}/generate-drawing`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: aiPrompt })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // 2. Parse Mermaid to Excalidraw skeleton
            const { elements: skeletonElements } = await parseMermaidToExcalidraw(data.mermaid);

            // 3. Convert skeleton to full Excalidraw elements
            const excalidrawElements = convertToExcalidrawElements(skeletonElements);

            // 4. Get existing elements and add new ones
            const existingElements = excalidrawAPI.getSceneElements();

            // Offset new elements to avoid overlap
            const offsetX = existingElements.length > 0 ? 100 : 0;
            const offsetY = existingElements.length > 0 ? 100 : 0;

            const offsetElements = excalidrawElements.map(el => ({
                ...el,
                x: el.x + offsetX,
                y: el.y + offsetY,
            }));

            // 5. Update the scene with new elements
            excalidrawAPI.updateScene({
                elements: [...existingElements, ...offsetElements],
            });

            // Clear prompt and close sidebar on success
            setAiPrompt("");
            setIsAISidebarOpen(false);

        } catch (error) {
            console.error("Error generating drawing:", error);
            setAiError(error.message || "Failed to generate drawing. Please try a different prompt.");
        } finally {
            setIsGenerating(false);
        }
    };

    const examplePrompts = [
        "User login authentication flow",
        "API request response cycle",
        "E-commerce checkout process",
        "Database CRUD operations",
    ];

    return (
        <div
            ref={containerRef}
            className={`flex flex-col h-full bg-[#1e293b] rounded-xl border border-white/10 overflow-hidden relative ${isFullscreen ? 'rounded-none' : ''}`}
        >
            {/* Status Indicator & Fullscreen Toggle */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                {/* Status Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-xs text-white/70 border border-white/5">
                    {saving ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : saved ? (
                        <>
                            <Check size={12} className="text-green-500" />
                            <span className="text-green-500">Saved</span>
                        </>
                    ) : (
                        <span>Ready</span>
                    )}
                </div>

                {/* Fullscreen Toggle Button */}
                <button
                    onClick={toggleFullscreen}
                    className="flex items-center justify-center w-8 h-8 bg-black/40 backdrop-blur-md rounded-full text-white/70 border border-white/5 hover:bg-white/10 hover:text-white transition-all duration-200"
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                    {isFullscreen ? (
                        <Minimize2 size={14} />
                    ) : (
                        <Maximize2 size={14} />
                    )}
                </button>
            </div>

            {/* Draw with AI Button */}
            <button
                onClick={() => setIsAISidebarOpen(true)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-full shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 font-medium text-sm"
            >
                <Wand2 size={16} />
                <span>Draw with AI</span>
                <Sparkles size={14} className="opacity-70" />
            </button>

            {/* AI Sidebar */}
            <div
                className={`absolute top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-20 transform transition-transform duration-300 ease-out ${isAISidebarOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg">
                            <Wand2 size={16} className="text-white" />
                        </div>
                        <span className="font-semibold text-white">Draw with AI</span>
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
                        Describe the diagram you want to create. AI will generate flowcharts, sequences, and more.
                    </p>

                    {/* Prompt Input */}
                    <div className="relative mb-4">
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    generateDrawing();
                                }
                            }}
                            placeholder="e.g., User authentication flow with login, signup, and password reset..."
                            className="w-full h-28 p-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
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
                        onClick={generateDrawing}
                        disabled={!aiPrompt.trim() || isGenerating}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 disabled:shadow-none"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                <span>Generate Diagram</span>
                            </>
                        )}
                    </button>

                    {/* Example Prompts */}
                    <div className="mt-6">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Try these examples</p>
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
                            Powered by Qwen AI • Mermaid Diagrams
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                    <Loader2 className="animate-spin" />
                    <span>Loading canvas...</span>
                </div>
            ) : (
                <div className="flex-1 w-full h-full">
                    <Excalidraw
                        excalidrawAPI={(api) => setExcalidrawAPI(api)}
                        initialData={initialData?.elements?.length > 0 ? initialData : undefined}
                        onChange={handleChange}
                        theme="dark"
                        UIOptions={{
                            canvasActions: {
                                loadScene: false,
                                saveToActiveFile: false,
                            }
                        }}
                    >
                        <WelcomeScreen>
                            <WelcomeScreen.Hints.ToolbarHint>
                                <p> ToolBar Hints </p>
                            </WelcomeScreen.Hints.ToolbarHint>
                            <WelcomeScreen.Hints.MenuHint />
                            <WelcomeScreen.Hints.HelpHint />
                            <WelcomeScreen.Center>
                                <WelcomeScreen.Center.Logo />
                                <WelcomeScreen.Center.Heading>
                                    Welcome to creAItr. X Excalidraw Canvas!
                                </WelcomeScreen.Center.Heading>
                                <WelcomeScreen.Center.Menu>
                                    <WelcomeScreen.Center.MenuItemHelp />
                                </WelcomeScreen.Center.Menu>
                            </WelcomeScreen.Center>
                        </WelcomeScreen>
                    </Excalidraw>
                </div>
            )}
        </div>
    );
}
