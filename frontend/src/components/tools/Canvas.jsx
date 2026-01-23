import { useRef, useState, useEffect } from "react";
import { Download, Trash2, Circle, Square, Minus } from "lucide-react";

export default function Canvas() {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState("pen"); // pen, eraser, circle, square, line
    const [color, setColor] = useState("#ffffff");
    const [brushSize, setBrushSize] = useState(3);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
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

        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
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
            <div className="flex-1 flex items-center justify-center p-4">
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
