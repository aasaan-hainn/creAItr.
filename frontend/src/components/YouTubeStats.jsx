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
import { IconBrandYoutube, IconLoader2, IconAlertCircle } from '@tabler/icons-react';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, [token]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
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
            setAnalyticsData(transformData(data));
        } catch (err) {
            console.error('Error loading analytics:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const transformData = (data) => {
        if (!data || !data.rows || !data.columns) return null;

        // data.rows is strictly [["2024-01-01", 120, 340, 2], ...]
        // data.columns is ["day", "views", "watchTimeMinutes", "subscribersGained"]
        
        const labels = data.rows.map(row => row[0]); // Day
        const views = data.rows.map(row => row[1]); // Views
        const watchTime = data.rows.map(row => row[2]); // Watch Time
        const subscribers = data.rows.map(row => row[3]); // Subscribers

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

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <IconLoader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-red-400 gap-4">
                <IconAlertCircle className="w-12 h-12" />
                <p className="text-lg">{error}</p>
                <button 
                    onClick={fetchAnalytics}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px] text-slate-400">
                No analytics data available
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

                {/* Charts Grid */}
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

                <div className="flex justify-end">
                    <button
                        onClick={fetchAnalytics}
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