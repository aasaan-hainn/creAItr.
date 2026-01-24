import { useRef, useState, useEffect } from "react";
import { Download, Trash2, Circle, Square, Minus, Save, Check } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Canvas({ projectId, token }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState("pen");
    const [color, setColor] = useState("#ffffff");
    const [brushSize, setBrushSize] = useState(3);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load canvas on mount
    useEffect(() => {
        if (projectId && canvasRef.current) {
            loadCanvas();
        }
    }, [projectId]);

    // Initialize canvas when ref is available
    useEffect(() => {
        if (canvasRef.current && loading) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (projectId) {
                loadCanvas();
            } else {
                setLoading(false);
            }
        }
    }, [canvasRef.current]);

    const loadCanvas = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${projectId}/workspace/canvas`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            const canvas = canvasRef.current;
            if (!canvas) {
                setLoading(false);
                return;
            }
            const ctx = canvas.getContext("2d");

            if (data.canvas && data.canvas.startsWith('data:image')) {
                // Load saved image data (base64 PNG)
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    setLoading(false);
                };
                img.onerror = () => {
                    // If image fails to load, initialize with empty canvas
                    ctx.fillStyle = "#1e293b";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    setLoading(false);
                };
                img.src = data.canvas;
            } else {
                // Initialize empty canvas
                ctx.fillStyle = "#1e293b";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                setLoading(false);
            }
        } catch (error) {
            console.error("Error loading canvas:", error);
            // Initialize empty canvas on error
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#1e293b";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            setLoading(false);
        }
    };

    const saveCanvas = async () => {
        if (!projectId || !canvasRef.current) return;

        setSaving(true);
        try {
            const canvas = canvasRef.current;
            const canvasData = canvas.toDataURL("image/png");

            await fetch(`${API_BASE_URL}/projects/${projectId}/workspace/canvas`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ canvas: canvasData })
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Error saving canvas:", error);
        } finally {
            setSaving(false);
        }
    };

    // Auto-save on drawing stop
    const handleDrawingEnd = () => {
        setIsDrawing(false);
        // Debounced save after drawing
        setTimeout(() => {
            saveCanvas();
        }, 500);
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        setStartPos({ x, y });

        if (tool === "pen" || tool === "eraser") {
            const ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ctx = canvas.getContext("2d");

        if (tool === "pen" || tool === "eraser") {
            ctx.strokeStyle = tool === "eraser" ? "#1e293b" : color;
            ctx.lineWidth = brushSize;
            ctx.lineCap = "round";
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const stopDrawing = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ctx = canvas.getContext("2d");

        if (tool !== "pen" && tool !== "eraser") {
            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;

            switch (tool) {
                case "circle":
                    const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
                    ctx.beginPath();
                    ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                    break;
                case "square":
                    ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
                    break;
                case "line":
                    ctx.beginPath();
                    ctx.moveTo(startPos.x, startPos.y);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    break;
            }
        }

        handleDrawingEnd();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveCanvas();
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = "drawing.png";
        link.click();
    };

    const colors = ["#ffffff", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#000000"];

    return (
        <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="flex gap-2">
                    {/* Tools */}
                    <button
                        onClick={() => setTool("pen")}
                        className={`p-2 rounded-lg transition-colors ${tool === "pen" ? "bg-indigo-600" : "bg-white/5 hover:bg-white/10"}`}
                        title="Pen"
                    >
                        <span className="text-sm font-bold text-white">✏️</span>
                    </button>
                    <button
                        onClick={() => setTool("eraser")}
                        className={`p-2 rounded-lg transition-colors ${tool === "eraser" ? "bg-indigo-600" : "bg-white/5 hover:bg-white/10"}`}
                        title="Eraser"
                    >
                        <span className="text-sm font-bold text-white">🧹</span>
                    </button>
                    <button
                        onClick={() => setTool("line")}
                        className={`p-2 rounded-lg transition-colors ${tool === "line" ? "bg-indigo-600" : "bg-white/5 hover:bg-white/10"}`}
                        title="Line"
                    >
                        <Minus size={18} className="text-slate-300" />
                    </button>
                    <button
                        onClick={() => setTool("circle")}
                        className={`p-2 rounded-lg transition-colors ${tool === "circle" ? "bg-indigo-600" : "bg-white/5 hover:bg-white/10"}`}
                        title="Circle"
                    >
                        <Circle size={18} className="text-slate-300" />
                    </button>
                    <button
                        onClick={() => setTool("square")}
                        className={`p-2 rounded-lg transition-colors ${tool === "square" ? "bg-indigo-600" : "bg-white/5 hover:bg-white/10"}`}
                        title="Rectangle"
                    >
                        <Square size={18} className="text-slate-300" />
                    </button>

                    {/* Colors */}
                    <div className="flex gap-1 ml-4">
                        {colors.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-white scale-110" : "border-white/30"} transition-all`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    {/* Brush Size */}
                    <div className="flex items-center gap-2 ml-4">
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-20"
                        />
                        <span className="text-xs text-slate-400 w-8">{brushSize}px</span>
                    </div>

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
                        onClick={clearCanvas}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Clear"
                    >
                        <Trash2 size={18} className="text-slate-300" />
                    </button>
                    <button
                        onClick={downloadCanvas}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Download"
                    >
                        <Download size={18} className="text-slate-300" />
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex items-center justify-center p-4 relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <div className="text-slate-500">Loading canvas...</div>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="border border-white/20 rounded-lg cursor-crosshair"
                    style={{ maxWidth: "100%", height: "auto" }}
                />
            </div>
        </div>
    );
}
