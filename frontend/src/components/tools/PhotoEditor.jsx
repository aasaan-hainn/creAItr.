import { useState, useRef, useEffect } from "react";
import { Upload, Download, RotateCw, Loader, Image as ImageIcon } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PhotoEditor({ projectId }) {
    const [image, setImage] = useState(null);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [uploading, setUploading] = useState(false);
    const [projectImages, setProjectImages] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(true);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Load project media on mount
    useEffect(() => {
        if (projectId) {
            loadProjectMedia();
        }
    }, [projectId]);

    const loadProjectMedia = async () => {
        setLoadingMedia(true);
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${projectId}/workspace/media`);
            const data = await response.json();
            const images = (data.media || []).filter(m => m.type === "image");
            setProjectImages(images);
        } catch (error) {
            console.error("Error loading media:", error);
        } finally {
            setLoadingMedia(false);
        }
    };

    useEffect(() => {
        if (image) {
            applyFilters();
        }
    }, [image, brightness, contrast, saturation]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert("File too large. Maximum size is 10MB.");
            return;
        }

        // Load for editing
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

        // Upload to Cloudinary
        if (projectId) {
            await uploadToCloudinary(file);
        }
    };

    const uploadToCloudinary = async (file) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "image");

            const response = await fetch(`${API_BASE_URL}/projects/${projectId}/workspace/upload`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setProjectImages([...projectImages, data]);
            } else {
                const error = await response.json();
                alert(error.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setUploading(false);
        }
    };

    const loadFromProject = (url) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setImage(img);
            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            applyFilters(img);
        };
        img.src = url;
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
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {uploading ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
                        <span className="text-sm">{uploading ? "Uploading..." : "Upload Image"}</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <span className="text-xs text-slate-500">Max 10MB</span>
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

                {/* Side Panel */}
                <div className="w-64 space-y-4 overflow-y-auto">
                    {/* Controls */}
                    {image && (
                        <div className="space-y-4 p-3 bg-white/5 rounded-lg border border-white/10">
                            <h3 className="text-sm font-medium text-slate-300">Adjustments</h3>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">
                                    Brightness: {brightness}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="200"
                                    value={brightness}
                                    onChange={(e) => setBrightness(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">
                                    Contrast: {contrast}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="200"
                                    value={contrast}
                                    onChange={(e) => setContrast(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">
                                    Saturation: {saturation}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="200"
                                    value={saturation}
                                    onChange={(e) => setSaturation(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}

                    {/* Project Images */}
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                            <ImageIcon size={14} />
                            Project Images
                        </h3>
                        {loadingMedia ? (
                            <div className="text-xs text-slate-500">Loading...</div>
                        ) : projectImages.length === 0 ? (
                            <div className="text-xs text-slate-500">No images uploaded yet</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {projectImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => loadFromProject(img.url)}
                                        className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-indigo-500 transition-colors"
                                    >
                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
