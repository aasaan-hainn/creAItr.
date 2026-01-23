import { useState, useRef, useEffect } from "react";
import { Upload, Download, RotateCw } from "lucide-react";

export default function PhotoEditor() {
    const [image, setImage] = useState(null);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (image) {
            applyFilters();
        }
    }, [image, brightness, contrast, saturation]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setImage(img);
                    const canvas = canvasRef.current;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    applyFilters(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const applyFilters = (img = image) => {
        if (!img) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.drawImage(img, 0, 0);
    };

    const downloadImage = () => {
        const canvas = canvasRef.current;
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = "edited-photo.png";
        link.click();
    };

    const resetFilters = () => {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
    };

    return (
        <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                    >
                        <Upload size={18} />
                        <span className="text-sm">Upload Image</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>

                {image && (
                    <div className="flex gap-2">
                        <button
                            onClick={resetFilters}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Reset"
                        >
                            <RotateCw size={18} className="text-slate-300" />
                        </button>
                        <button
                            onClick={downloadImage}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Download"
                        >
                            <Download size={18} className="text-slate-300" />
                        </button>
                    </div>
                )}
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                {/* Preview */}
                <div className="flex-1 flex items-center justify-center bg-black/30 rounded-lg border border-white/10 overflow-auto">
                    {image ? (
                        <canvas
                            ref={canvasRef}
                            className="max-w-full max-h-full"
                        />
                    ) : (
                        <div className="text-center text-slate-500">
                            <Upload size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Upload an image to get started</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                {image && (
                    <div className="w-64 space-y-4">
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">
                                Brightness: {brightness}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={brightness}
                                onChange={(e) => setBrightness(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">
                                Contrast: {contrast}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={contrast}
                                onChange={(e) => setContrast(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">
                                Saturation: {saturation}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={saturation}
                                onChange={(e) => setSaturation(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
