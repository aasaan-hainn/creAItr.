import React, { useState, useEffect } from 'react';
import { IconBrandYoutube, IconUsers, IconEye, IconVideo, IconTrendingUp, IconTrendingDown, IconLoader2 } from '@tabler/icons-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const YouTubeStats = ({ token }) => {
    const [channelId, setChannelId] = useState('');
    const [savedChannelId, setSavedChannelId] = useState('');
    const [stats, setStats] = useState(null);
    const [growth, setGrowth] = useState(null);
    const [graphData, setGraphData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    // Load saved channel on mount
    useEffect(() => {
        loadSavedChannel();
    }, []);

    const loadSavedChannel = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/stats/youtube/channel`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();

            if (data.channelId) {
                setSavedChannelId(data.channelId);
                setChannelId(data.channelId);
                // Auto-load stats if channel exists
                await loadStats();
                await loadGrowth();
                await loadGraph();
            }
        } catch (err) {
            console.error('Error loading channel:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/stats/youtube/realtime`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const loadGrowth = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/stats/youtube/growth`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setGrowth(data);
            }
        } catch (err) {
            console.error('Error loading growth:', err);
        }
    };

    const loadGraph = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/stats/youtube/graph`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setGraphData(data.graph);
            }
        } catch (err) {
            console.error('Error loading graph:', err);
        }
    };

    const saveChannel = async () => {
        if (!channelId.trim()) return;

        setSaving(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/stats/youtube/channel`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ channelId: channelId.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to save channel');
                return;
            }

            setSavedChannelId(channelId);
            setStats(data.stats);
            await loadGrowth();
        } catch (err) {
            setError('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toLocaleString() || '0';
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <IconLoader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <IconBrandYoutube className="w-8 h-8 text-red-500" />
                    <h2 className="text-2xl font-bold text-white">YouTube Analytics</h2>
                </div>

                {/* Channel ID Input */}
                {!savedChannelId && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Connect Your Channel</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Enter your YouTube Channel ID to view analytics. Find it in your channel's URL or YouTube Studio.
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={channelId}
                                onChange={(e) => setChannelId(e.target.value)}
                                placeholder="UC... or channel handle"
                                className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            />
                            <button
                                onClick={saveChannel}
                                disabled={saving || !channelId.trim()}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                            >
                                {saving && <IconLoader2 className="w-4 h-4 animate-spin" />}
                                Connect
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats Display */}
                {stats && (
                    <>
                        {/* Channel Info */}
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                            {stats.thumbnail && (
                                <img
                                    src={stats.thumbnail}
                                    alt={stats.title}
                                    className="w-16 h-16 rounded-full"
                                />
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-white">{stats.title}</h3>
                                <p className="text-slate-400 text-sm">{stats.channelId}</p>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {/* Subscribers */}
                            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <IconUsers className="w-6 h-6 text-red-400" />
                                    {growth && growth.subscriberGrowth !== 0 && (
                                        <div className={`flex items-center gap-1 text-sm ${growth.subscriberGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {growth.subscriberGrowth > 0 ? <IconTrendingUp className="w-4 h-4" /> : <IconTrendingDown className="w-4 h-4" />}
                                            {Math.abs(growth.subscriberGrowth).toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">
                                    {stats.subscriberHidden ? 'Hidden' : formatNumber(stats.subscribers)}
                                </div>
                                <div className="text-sm text-slate-400">Subscribers</div>
                            </div>

                            {/* Views */}
                            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <IconEye className="w-6 h-6 text-blue-400" />
                                    {growth && growth.viewGrowth !== 0 && (
                                        <div className={`flex items-center gap-1 text-sm ${growth.viewGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {growth.viewGrowth > 0 ? <IconTrendingUp className="w-4 h-4" /> : <IconTrendingDown className="w-4 h-4" />}
                                            {Math.abs(growth.viewGrowth).toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">
                                    {formatNumber(stats.views)}
                                </div>
                                <div className="text-sm text-slate-400">Total Views</div>
                            </div>

                            {/* Videos */}
                            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <IconVideo className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">
                                    {formatNumber(stats.videoCount)}
                                </div>
                                <div className="text-sm text-slate-400">Videos</div>
                            </div>
                        </div>

                        {/* Growth Summary */}
                        {growth && growth.daysSinceSnapshot > 0 && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
                                <h4 className="text-lg font-semibold text-white mb-3">Growth Summary</h4>
                                <p className="text-slate-400 text-sm mb-4">
                                    Compared to {growth.daysSinceSnapshot} days ago
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${growth.subscriberDiff >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                            {growth.subscriberDiff >= 0 ?
                                                <IconTrendingUp className="w-5 h-5 text-green-400" /> :
                                                <IconTrendingDown className="w-5 h-5 text-red-400" />
                                            }
                                        </div>
                                        <div>
                                            <div className={`font-semibold ${growth.subscriberDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {growth.subscriberDiff >= 0 ? '+' : ''}{formatNumber(growth.subscriberDiff)}
                                            </div>
                                            <div className="text-xs text-slate-500">Subscribers</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${growth.viewDiff >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                            {growth.viewDiff >= 0 ?
                                                <IconTrendingUp className="w-5 h-5 text-green-400" /> :
                                                <IconTrendingDown className="w-5 h-5 text-red-400" />
                                            }
                                        </div>
                                        <div>
                                            <div className={`font-semibold ${growth.viewDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {growth.viewDiff >= 0 ? '+' : ''}{formatNumber(growth.viewDiff)}
                                            </div>
                                            <div className="text-xs text-slate-500">Views</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Growth Graph */}
                        {graphData && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                <h4 className="text-lg font-semibold text-white mb-4">Growth History</h4>
                                <img
                                    src={graphData}
                                    alt="Growth Graph"
                                    className="w-full rounded-lg"
                                />
                            </div>
                        )}

                        {/* Refresh Button */}
                        <button
                            onClick={async () => {
                                setLoading(true);
                                await loadStats();
                                await loadGrowth();
                                await loadGraph();
                                setLoading(false);
                            }}
                            className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-sm transition-colors"
                        >
                            Refresh Stats
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default YouTubeStats;
