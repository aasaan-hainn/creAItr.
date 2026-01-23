import { useState, useRef, useEffect } from "react";
import { Upload, Type, Scissors, Download, Play, Pause } from "lucide-react";

export default function VideoEditor() {
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

    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideo(url);
        }
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
                duration: 3 // 3 seconds
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
        // This is a simplified export - in a real application, you'd use ffmpeg.wasm or similar
        alert("Export functionality requires server-side processing or ffmpeg.wasm. Currently showing trimmed range: " + formatTime(trimStart) + " - " + formatTime(trimEnd));
    };

    // Check if current time matches any text overlay
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
                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                    >
                        <Upload size={18} />
                        <span className="text-sm">Upload Video</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

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
                    <p className="text-xs text-slate-500 mt-2">Text will appear for 3 seconds</p>
                </div>
            )}

            {/* Video Area */}
            <div className="flex-1 flex flex-col p-4 gap-4">
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
                            />
                            {/* Text Overlay */}
                            {getCurrentOverlayText() && (
                                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-lg">
                                    <p className="text-white text-lg font-semibold">{getCurrentOverlayText()}</p>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="space-y-3">
                            {/* Playback Controls */}
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
                                <p className="text-xs text-slate-500 mt-2">
                                    Trimmed duration: {formatTime(trimEnd - trimStart)}
                                </p>
                            </div>

                            {/* Text Overlays List */}
                            {textOverlays.length > 0 && (
                                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="text-sm font-medium text-slate-300 mb-2">Text Overlays:</div>
                                    <div className="space-y-1">
                                        {textOverlays.map((overlay, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400">"{overlay.text}"</span>
                                                <span className="text-slate-500">at {formatTime(overlay.time)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
        </div>
    );
}
