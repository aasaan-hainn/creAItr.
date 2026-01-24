import { useState, useEffect, useRef, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { Save, Check, Loader2 } from "lucide-react";
import "@excalidraw/excalidraw/index.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Canvas({ projectId, token }) {
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const saveTimeoutRef = useRef(null);

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
                } else {
                    // Try to parse JSON data
                    try {
                        const parsedData = typeof data.canvas === 'string'
                            ? JSON.parse(data.canvas)
                            : data.canvas;

                        setInitialData(parsedData);
                    } catch (e) {
                        console.error("Failed to parse canvas data", e);
                        setInitialData(null);
                    }
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

    return (
        <div className="flex flex-col h-full bg-[#1e293b] rounded-xl border border-white/10 overflow-hidden relative">
            {/* Status Indicator */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-xs text-white/70 border border-white/5">
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

            {loading ? (
                <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                    <Loader2 className="animate-spin" />
                    <span>Loading canvas...</span>
                </div>
            ) : (
                <div className="flex-1 w-full h-full">
                    <Excalidraw
                        excalidrawAPI={(api) => setExcalidrawAPI(api)}
                        initialData={initialData}
                        onChange={handleChange}
                        theme="dark"
                        UIOptions={{
                            canvasActions: {
                                loadScene: false,
                                saveToActiveFile: false,
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}
