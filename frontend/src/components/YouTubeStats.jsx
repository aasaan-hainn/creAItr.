import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { IconBrandYoutube, IconLoader2, IconAlertCircle, IconUsers, IconEye, IconVideo, IconCheck, IconX, IconCalendar } from '@tabler/icons-react';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const YouTubeStats = ({ token }) => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [channelStats, setChannelStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Time Range State
    const [timeRange, setTimeRange] = useState('30d');
    const [fullData, setFullData] = useState(null);
    
    // Channel ID input state
    const [channelInput, setChannelInput] = useState('');
    const [isSavingChannel, setIsSavingChannel] = useState(false);
    const [channelError, setChannelError] = useState('');

    useEffect(() => {
        fetchData();
    }, [token]);

    // Re-filter data when time range changes
    useEffect(() => {
        if (fullData) {
            setAnalyticsData(transformData(fullData, timeRange));
        }
    }, [fullData, timeRange]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Fetch Basic Channel Stats
            await fetchChannelStats();
            
            // 2. Fetch Analytics Data
            await fetchAnalytics();
        } catch (err) {
            console.error('Error loading data:', err);
            // Don't set main error if just analytics fails, but do if everything fails
            if (!channelStats && !analyticsData) {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchChannelStats = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/stats/youtube/realtime`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setChannelStats(data);
            } else {
                // If 400, it likely means no channel configured
                if (response.status !== 400 && response.status !== 404) {
                    console.warn("Failed to fetch channel stats");
                }
                setChannelStats(null);
            }
        } catch (error) {
            console.error("Error fetching channel stats", error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/analytics`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized. Please log in again.');
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch analytics');
            }

            const data = await response.json();
            setFullData(data); // Store raw data
            // Initial transform handled by useEffect
        } catch (err) {
            console.error('Error loading analytics:', err);
            // Allow partial loading (stats might work even if analytics fail)
            throw err;
        }
    };

    const saveChannelId = async () => {
        if (!channelInput.trim()) return;
        
        setIsSavingChannel(true);
        setChannelError('');
        
        try {
            const response = await fetch(`${API_BASE_URL}/stats/youtube/channel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ channelId: channelInput.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                setChannelError(data.error || 'Failed to save channel');
                return;
            }

            setChannelStats(data.stats);
            setChannelInput('');
            // Refresh analytics too
            fetchAnalytics();
        } catch (err) {
            setChannelError('Failed to connect channel');
        } finally {
            setIsSavingChannel(false);
        }
    };

    const transformData = (data, range) => {
        if (!data || !data.rows || !data.columns) return null;

        let filteredRows = data.rows;

        // Apply Time Filter
        if (range !== 'all') {
            const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
            
            // Normalize today to start of day (00:00:00) to ensure consistent comparison
            const cutoff = new Date();
            cutoff.setHours(0, 0, 0, 0);
            cutoff.setDate(cutoff.getDate() - days);
            
            filteredRows = data.rows.filter(row => {
                // Backend sends YYYY-MM-DD. 
                // new Date("YYYY-MM-DD") creates a date at midnight UTC.
                const rowDate = new Date(row[0]);
                return rowDate >= cutoff;
            });
        }

        // data.rows is strictly [["2024-01-01", 120, 340, 2], ...]
        // data.columns is ["day", "views", "watchTimeMinutes", "subscribersGained"]
        
        const labels = filteredRows.map(row => row[0]); // Day
        const views = filteredRows.map(row => row[1]); // Views
        const watchTime = filteredRows.map(row => row[2]); // Watch Time
        const subscribers = filteredRows.map(row => row[3]); // Subscribers

        return {
            labels,
            datasets: {
                views: {
                    label: 'Views',
                    data: views,
                    borderColor: 'rgb(59, 130, 246)', // Blue
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                watchTime: {
                    label: 'Watch Time (Minutes)',
                    data: watchTime,
                    borderColor: 'rgb(168, 85, 247)', // Purple
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                subscribers: {
                    label: 'Subscribers Gained',
                    data: subscribers,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red
                }
            }
        };
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    };

    const commonOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#e2e8f0' // slate-200
                }
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#94a3b8' // slate-400
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#94a3b8' // slate-400
                }
            }
        },
        maintainAspectRatio: false,
    };

    const TimeRangeSelector = () => (
        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 gap-1">
            {['7d', '30d', '90d', 'all'].map((range) => (
                <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        timeRange === range 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {range === 'all' ? 'All Time' : `Last ${range.replace('d', ' Days')}`}
                </button>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <IconLoader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto h-full">
            <div className="max-w-6xl mx-auto w-full space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <IconBrandYoutube className="w-8 h-8 text-red-500" />
                    <h2 className="text-2xl font-bold text-white">YouTube Analytics Dashboard</h2>
                </div>

                {/* Channel Connection / Stats Section */}
                {!channelStats ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Connect Your Channel</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Enter your YouTube Channel ID (e.g., UC...) to fetch real-time stats.
                        </p>
                        <div className="flex gap-3 max-w-xl">
                            <input
                                type="text"
                                placeholder="Channel ID (starts with UC...)"
                                value={channelInput}
                                onChange={(e) => setChannelInput(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                            />
                            <button
                                onClick={saveChannelId}
                                disabled={isSavingChannel || !channelInput.trim()}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {isSavingChannel ? <IconLoader2 className="animate-spin w-4 h4" /> : 'Connect'}
                            </button>
                        </div>
                        {channelError && (
                            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                                <IconAlertCircle className="w-4 h-4" /> {channelError}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Profile Card */}
                        <div className="md:col-span-1 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                            {channelStats.thumbnail && (
                                <img 
                                    src={channelStats.thumbnail} 
                                    alt={channelStats.title} 
                                    className="w-20 h-20 rounded-full mb-3 border-2 border-red-500"
                                />
                            )}
                            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{channelStats.title}</h3>
                            <p className="text-xs text-slate-400 font-mono mb-3">{channelStats.channelId}</p>
                            <div className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30">
                                Live Data
                            </div>
                        </div>

                        {/* Stat Cards */}
                        <div className="md:col-span-3 grid grid-cols-3 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <span className="text-slate-400 text-sm">Subscribers</span>
                                    <IconUsers className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="text-2xl font-bold text-white mt-2">
                                    {channelStats.subscriberHidden ? 'Hidden' : formatNumber(channelStats.subscribers)}
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <span className="text-slate-400 text-sm">Total Views</span>
                                    <IconEye className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="text-2xl font-bold text-white mt-2">
                                    {formatNumber(channelStats.views)}
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <span className="text-slate-400 text-sm">Total Videos</span>
                                    <IconVideo className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="text-2xl font-bold text-white mt-2">
                                    {formatNumber(channelStats.videoCount)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter & Charts Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <IconCalendar className="w-5 h-5 text-indigo-400" />
                            Growth Analytics
                         </h3>
                         <TimeRangeSelector />
                    </div>

                    {analyticsData ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Views Chart */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-[350px]">
                                <h3 className="text-lg font-semibold text-white mb-4">Views Overview</h3>
                                <div className="h-[280px]">
                                    <Line 
                                        data={{
                                            labels: analyticsData.labels,
                                            datasets: [analyticsData.datasets.views]
                                        }}
                                        options={commonOptions}
                                    />
                                </div>
                            </div>

                            {/* Watch Time Chart */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-[350px]">
                                <h3 className="text-lg font-semibold text-white mb-4">Watch Time</h3>
                                <div className="h-[280px]">
                                    <Line 
                                        data={{
                                            labels: analyticsData.labels,
                                            datasets: [analyticsData.datasets.watchTime]
                                        }}
                                        options={commonOptions}
                                    />
                                </div>
                            </div>

                            {/* Subscribers Chart */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-[350px] lg:col-span-2">
                                <h3 className="text-lg font-semibold text-white mb-4">Daily Subscriber Growth</h3>
                                <div className="h-[280px]">
                                    <Bar 
                                        data={{
                                            labels: analyticsData.labels,
                                            datasets: [analyticsData.datasets.subscribers]
                                        }}
                                        options={commonOptions}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-12 border border-white/10 rounded-xl bg-white/5 text-slate-400">
                            {error ? (
                                <div className="text-center">
                                    <IconAlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                                    <p>{error}</p>
                                </div>
                            ) : (
                                "Loading Analytics..."
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-sm transition-colors flex items-center gap-2"
                    >
                         Refresh Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default YouTubeStats;