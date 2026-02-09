import { useState, useRef, useEffect } from "react";
import { Upload, Type, Scissors, Download, Play, Pause, Loader, Video, Maximize2, Minimize2, Wand2, X, Send, Sparkles } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function VideoEditor({ projectId, token }) {
    const [video, setVideo] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [textOverlays, setTextOverlays] = useState([]);
    const [showTextInput, setShowTextInput] = useState(false);
    const [newText, setNewText] = useState("");
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [projectVideos, setProjectVideos] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(true);
    const [currentVideoUrl, setCurrentVideoUrl] = useState(null);

    // AI Analysis states
    const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState("");
    const [aiError, setAiError] = useState("");

    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
            const videos = (data.media || []).filter(m => m.type === "video");
            setProjectVideos(videos);
        } catch (error) {
            console.error("Error loading media:", error);
        } finally {
            setLoadingMedia(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            alert("File too large. Maximum size is 100MB.");
            return;
        }

        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideo(url);

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
            formData.append("type", "video");

            const response = await fetch(`${API_BASE_URL}/projects/${projectId}/workspace/upload`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setProjectVideos([...projectVideos, data]);
                setCurrentVideoUrl(data.url);
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
        setVideo(url);
        setCurrentVideoUrl(url);
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            setDuration(dur);
            setTrimEnd(dur);
        }
    };

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (playing) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setPlaying(!playing);
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    const addTextOverlay = () => {
        if (newText.trim()) {
            setTextOverlays([...textOverlays, {
                text: newText,
                time: currentTime,
                duration: 3
            }]);
            setNewText("");
            setShowTextInput(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const analyzeVideo = async () => {
        if (!aiPrompt.trim() || !currentVideoUrl) return;

        setIsAnalyzing(true);
        setAiError("");
        setAiAnalysis("");

        try {
            const response = await fetch(`${API_BASE_URL}/analyze-media`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    mediaUrl: currentVideoUrl,
                    mediaType: "video",
                    prompt: aiPrompt
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setAiAnalysis(data.analysis);
        } catch (error) {
            console.error("Error analyzing video:", error);
            setAiError(error.message || "Failed to analyze video.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const exportVideo = () => {
        alert("Export functionality requires server-side processing or ffmpeg.wasm. Currently showing trimmed range: " + formatTime(trimStart) + " - " + formatTime(trimEnd));
    };

    const getCurrentOverlayText = () => {
        const overlay = textOverlays.find(
            o => currentTime >= o.time && currentTime <= o.time + o.duration
        );
        return overlay?.text || "";
    };

    return (
        <div ref={containerRef} className={`flex flex-col h-full bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden ${isFullscreen ? 'rounded-none' : ''}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between p-3 border-b border-white/10 gap-3 bg-black/20 shrink-0">
                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {uploading ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
                        <span className="text-sm">{uploading ? "Uploading..." : "Upload Video"}</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <span className="text-[10px] text-slate-500 hidden sm:inline">Max 100MB</span>

                    {video && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAISidebarOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                            >
                                <Wand2 size={18} />
                                <span className="text-sm hidden sm:inline">Ask AI</span>
                            </button>
                            <button
                                onClick={() => setShowTextInput(!showTextInput)}
                                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Type size={18} />
                                <span className="text-sm hidden sm:inline">Add Text</span>
                            </button>
                            <button
                                onClick={exportVideo}
                                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Download size={18} />
                                <span className="text-sm hidden sm:inline">Export</span>
                            </button>
                        </div>
                    )}
                </div>

                {video && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Speed:</span>
                        <div className="flex bg-white/5 rounded-lg p-1">
                            {[0.5, 1, 1.5, 2].map(speed => (
                                <button
                                    key={speed}
                                    onClick={() => setPlaybackSpeed(speed)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${playbackSpeed === speed
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Text Input Modal */}
            {showTextInput && (
                <div className="p-4 border-b border-white/10 bg-indigo-500/5 shrink-0">
                    <div className="flex gap-2 max-w-2xl mx-auto">
                        <input
                            type="text"
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            placeholder="Enter text to overlay..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/50"
                        />
                        <button
                            onClick={addTextOverlay}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
                        >
                            Add at {formatTime(currentTime)}
                        </button>
                    </div>
                </div>
            )}

            {/* Scrollable Editor Area */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-black/20">
                <div className="p-4 flex flex-col lg:flex-row gap-6 min-h-full">
                    {/* Main Video Section */}
                    <div className="flex-1 flex flex-col gap-6">
                        {video ? (
                            <>
                                {/* Video Player Container */}
                                <div className="relative group aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                                    <video
                                        ref={videoRef}
                                        src={video}
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        className="w-full h-full"
                                        crossOrigin="anonymous"
                                    />
                                    {getCurrentOverlayText() && (
                                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 shadow-2xl">
                                            <p className="text-white text-xl font-bold tracking-tight">{getCurrentOverlayText()}</p>
                                        </div>
                                    )}
                                    
                                    {/* Playback Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                                        {!playing && <Play size={64} className="text-white/50" />}
                                    </div>

                                    {/* Fullscreen Toggle - Positioned within player for better UX */}
                                    <button
                                        onClick={toggleFullscreen}
                                        className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-xl text-white/70 border border-white/10 hover:bg-indigo-600 hover:text-white transition-all shadow-xl"
                                    >
                                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                    </button>
                                </div>

                                {/* Controls Card */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl backdrop-blur-sm">
                                    {/* Main Playback & Seek */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={togglePlayPause}
                                                className="w-12 h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                            >
                                                {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                            </button>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                                    <span>Current: {formatTime(currentTime)}</span>
                                                    <span>Total: {formatTime(duration)}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={duration || 0}
                                                    step="0.01"
                                                    value={currentTime}
                                                    onChange={handleSeek}
                                                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Trim Section */}
                                    <div className="pt-6 border-t border-white/10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-red-500/20 rounded-lg">
                                                    <Scissors size={16} className="text-red-400" />
                                                </div>
                                                <h3 className="text-sm font-bold text-white tracking-tight">Trim Range</h3>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                {formatTime(trimEnd - trimStart)} selected
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-xs font-medium text-slate-400">Start Point</label>
                                                    <span className="text-xs font-mono text-indigo-400">{formatTime(trimStart)}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={trimEnd}
                                                    step="0.1"
                                                    value={trimStart}
                                                    onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                                                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-xs font-medium text-slate-400">End Point</label>
                                                    <span className="text-xs font-mono text-red-400">{formatTime(trimEnd)}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={trimStart}
                                                    max={duration || 0}
                                                    step="0.1"
                                                    value={trimEnd}
                                                    onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                                                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 min-h-[400px] flex items-center justify-center text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                                <div className="max-w-xs">
                                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Upload size={32} className="text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Ready to edit?</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                        Upload a video from your computer or select one from your project library to begin.
                                    </p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                                    >
                                        Choose Video File
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Project Videos Panel */}
                    <div className="w-full lg:w-72 shrink-0">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sticky top-0 shadow-xl backdrop-blur-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Video size={14} className="text-indigo-400" />
                                Project Assets
                            </h3>
                            
                            {loadingMedia ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader size={24} className="animate-spin text-slate-600" />
                                </div>
                            ) : projectVideos.length === 0 ? (
                                <div className="text-center py-12 px-4 border border-white/5 rounded-xl bg-black/20">
                                    <p className="text-xs text-slate-500">No media assets found in this project.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {projectVideos.map((vid, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => loadFromProject(vid.url)}
                                            className={`w-full group p-3 text-left rounded-xl border transition-all ${
                                                video === vid.url 
                                                ? "bg-indigo-500/10 border-indigo-500/50" 
                                                : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
                                            }`}
                                        >
                                            <div className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">{vid.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-1">{new Date(vid.uploadedAt).toLocaleDateString()}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
                        <span className="font-semibold text-white">Ask Gemini AI</span>
                    </div>
                    <button
                        onClick={() => setIsAISidebarOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Sidebar Content */}
                <div className="p-4 flex flex-col h-[calc(100%-60px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <p className="text-slate-400 text-sm mb-4">
                        Ask Gemini about this video. It can summarize scenes, explain actions, or suggest improvements.
                    </p>

                    {/* Prompt Input */}
                    <div className="relative mb-4">
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    analyzeVideo();
                                }
                            }}
                            placeholder="e.g., Summarize what happens in this video..."
                            className="w-full h-28 p-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                            disabled={isAnalyzing}
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
                        onClick={analyzeVideo}
                        disabled={!aiPrompt.trim() || isAnalyzing || !currentVideoUrl}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 disabled:shadow-none"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader size={18} className="animate-spin" />
                                <span>Analyzing Video...</span>
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                <span>Ask AI</span>
                            </>
                        )}
                    </button>

                    {/* AI Analysis Result */}
                    {aiAnalysis && (
                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Sparkles size={12} />
                                Gemini Analysis
                            </h4>
                            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {aiAnalysis}
                            </div>
                        </div>
                    )}

                    {/* Example Prompts */}
                    <div className="mt-6">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Try these</p>
                        <div className="space-y-2">
                            {[
                                "What happens in this video?",
                                "Summarize the key moments",
                                "Suggest some background music for this",
                                "Describe the lighting and atmosphere"
                            ].map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => setAiPrompt(prompt)}
                                    disabled={isAnalyzing}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10 disabled:opacity-50"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
