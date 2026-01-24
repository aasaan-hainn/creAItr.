import { useState, useRef, useEffect } from "react";
import { Upload, Type, Scissors, Download, Play, Pause, Loader, Video } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function VideoEditor({ projectId }) {
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

    const videoRef = useRef(null);
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
                        <span className="text-sm">{uploading ? "Uploading..." : "Upload Video"}</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <span className="text-xs text-slate-500">Max 100MB</span>

                    {video && (
                        <>
                            <button
                                onClick={() => setShowTextInput(!showTextInput)}
                                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Type size={18} />
                                <span className="text-sm">Add Text</span>
                            </button>
                            <button
                                onClick={exportVideo}
                                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Download size={18} />
                                <span className="text-sm">Export</span>
                            </button>
                        </>
                    )}
                </div>

                {video && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">Speed:</span>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                            <button
                                key={speed}
                                onClick={() => setPlaybackSpeed(speed)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${playbackSpeed === speed
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                                    }`}
                            >
                                {speed}x
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Text Input Modal */}
            {showTextInput && (
                <div className="p-4 border-b border-white/10 bg-white/5">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            placeholder="Enter text to overlay..."
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none"
                        />
                        <button
                            onClick={addTextOverlay}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition-colors"
                        >
                            Add at {formatTime(currentTime)}
                        </button>
                    </div>
                </div>
            )}

            {/* Video Area */}
            <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                {/* Main Video Section */}
                <div className="flex-1 flex flex-col gap-4">
                    {video ? (
                        <>
                            {/* Video Player */}
                            <div className="relative flex-1 flex items-center justify-center bg-black/50 rounded-lg">
                                <video
                                    ref={videoRef}
                                    src={video}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    className="max-w-full max-h-full rounded-lg"
                                    crossOrigin="anonymous"
                                />
                                {getCurrentOverlayText() && (
                                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-lg">
                                        <p className="text-white text-lg font-semibold">{getCurrentOverlayText()}</p>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={togglePlayPause}
                                        className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                                    >
                                        {playing ? <Pause size={20} /> : <Play size={20} />}
                                    </button>
                                    <span className="text-sm text-slate-400 min-w-20">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </span>
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 0}
                                        step="0.1"
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="flex-1"
                                    />
                                </div>

                                {/* Trim Controls */}
                                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Scissors size={16} className="text-slate-400" />
                                        <span className="text-sm font-medium text-slate-300">Trim Video</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-slate-400 block mb-1">Start: {formatTime(trimStart)}</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max={duration || 0}
                                                step="0.1"
                                                value={trimStart}
                                                onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-slate-400 block mb-1">End: {formatTime(trimEnd)}</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max={duration || 0}
                                                step="0.1"
                                                value={trimEnd}
                                                onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center text-slate-500">
                            <div>
                                <Upload size={48} className="mx-auto mb-2 opacity-50" />
                                <p>Upload a video to get started</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Project Videos Panel */}
                <div className="w-48 p-3 bg-white/5 rounded-lg border border-white/10 overflow-y-auto">
                    <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Video size={14} />
                        Project Videos
                    </h3>
                    {loadingMedia ? (
                        <div className="text-xs text-slate-500">Loading...</div>
                    ) : projectVideos.length === 0 ? (
                        <div className="text-xs text-slate-500">No videos uploaded yet</div>
                    ) : (
                        <div className="space-y-2">
                            {projectVideos.map((vid, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => loadFromProject(vid.url)}
                                    className="w-full p-2 text-left rounded-lg border border-white/10 hover:border-indigo-500 transition-colors"
                                >
                                    <div className="text-xs text-slate-300 truncate">{vid.name}</div>
                                    <div className="text-[10px] text-slate-500 truncate">{new Date(vid.uploadedAt).toLocaleDateString()}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
