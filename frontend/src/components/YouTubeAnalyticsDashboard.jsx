import React, { useState, useEffect } from 'react';
import {
    IconChartLine,
    IconClock,
    IconUserPlus,
    IconLoader2,
    IconAlertCircle,
    IconRefresh,
    IconBrandYoutube
} from '@tabler/icons-react';
// Chart.js imports for interactive graphs
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

// Register Chart.js components
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

/**
 * Backend API base URL
 * All analytics data is fetched from the Flask backend only
 * NO direct Google API calls from frontend
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://qwenify.onrender.com';

/**
 * YouTubeAnalyticsDashboard Component
 * 
 * Displays YouTube Analytics data as interactive Chart.js graphs.
 * 
 * SECURITY CONSTRAINTS:
 * - Does NOT include Google Client ID or Secret
 * - Does NOT include OAuth logic
 * - Does NOT call YouTube APIs directly
 * - ONLY consumes backend analytics JSON from /analytics endpoint
 * 
 * @param {string} token - JWT token for backend authentication (passed from parent)
 */
const YouTubeAnalyticsDashboard = ({ token }) => {
    // State for storing analytics data
    const [analyticsData, setAnalyticsData] = useState(null);
    // Loading state while fetching data
    const [loading, setLoading] = useState(true);
    // Error state if backend request fails
    const [error, setError] = useState(null);

    /**
     * Get authorization headers for API requests
     * Uses JWT token from backend authentication (NOT Google token)
     */
    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    /**
     * Fetch analytics data from backend on component mount
     */
    useEffect(() => {
        fetchAnalytics();
    }, []);

    /**
     * Fetch analytics data from Flask backend
     * Endpoint: GET /analytics
     * 
     * Expected response format:
     * {
     *   "columns": ["day", "views", "watchTimeMinutes", "subscribersGained"],
     *   "rows": [
     *     ["2024-01-01", 120, 340, 2],
     *     ["2024-01-02", 180, 420, 3]
     *   ]
     * }
     */
    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/analytics`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setAnalyticsData(data);
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError(err.message || 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Transform backend JSON into Chart.js-compatible format
     * 
     * Backend format: { columns: [...], rows: [[...], [...]] }
     * Chart.js format: { labels: [...], datasets: [...] }
     * 
     * @param {string} dataKey - The column name to extract (e.g., 'views')
     * @param {string} label - Label for the dataset
     * @param {string} color - Color for the chart
     * @returns {object} Chart.js data object
     */
    const transformToChartData = (dataKey, label, color) => {
        if (!analyticsData || !analyticsData.columns || !analyticsData.rows) {
            return null;
        }

        // Find the index of the data column
        const columnIndex = analyticsData.columns.indexOf(dataKey);
        const dayIndex = analyticsData.columns.indexOf('day');

        if (columnIndex === -1 || dayIndex === -1) {
            return null;
        }

        // Extract labels (dates) and values
        const labels = analyticsData.rows.map(row => {
            const date = new Date(row[dayIndex]);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const values = analyticsData.rows.map(row => row[columnIndex]);

        return {
            labels,
            datasets: [
                {
                    label,
                    data: values,
                    borderColor: color,
                    backgroundColor: color + '33', // Add transparency for fill
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4, // Smooth curves
                    pointRadius: 4,
                    pointBackgroundColor: color,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                }
            ]
        };
    };

    /**
     * Transform data for Bar chart (Subscribers Gained)
     */
    const transformToBarChartData = (dataKey, label, color) => {
        if (!analyticsData || !analyticsData.columns || !analyticsData.rows) {
            return null;
        }

        const columnIndex = analyticsData.columns.indexOf(dataKey);
        const dayIndex = analyticsData.columns.indexOf('day');

        if (columnIndex === -1 || dayIndex === -1) {
            return null;
        }

        const labels = analyticsData.rows.map(row => {
            const date = new Date(row[dayIndex]);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const values = analyticsData.rows.map(row => row[columnIndex]);

        return {
            labels,
            datasets: [
                {
                    label,
                    data: values,
                    backgroundColor: color + 'cc', // Slightly transparent
                    borderColor: color,
                    borderWidth: 1,
                    borderRadius: 6,
                    hoverBackgroundColor: color,
                }
            ]
        };
    };

    /**
     * Chart.js options for Line charts
     * Dark theme matching the app's design
     */
    const getLineChartOptions = (title, yAxisLabel) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: title,
                color: '#fff',
                font: {
                    size: 14,
                    weight: '600'
                },
                padding: { bottom: 16 }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: false
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#6b7280',
                    font: { size: 11 },
                    maxRotation: 45
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#6b7280',
                    font: { size: 11 }
                },
                beginAtZero: true,
                title: {
                    display: true,
                    text: yAxisLabel,
                    color: '#9ca3af',
                    font: { size: 11 }
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    });

    /**
     * Chart.js options for Bar chart
     */
    const getBarChartOptions = (title) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: title,
                color: '#fff',
                font: {
                    size: 14,
                    weight: '600'
                },
                padding: { bottom: 16 }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#6b7280',
                    font: { size: 11 },
                    maxRotation: 45
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: '#6b7280',
                    font: { size: 11 },
                    stepSize: 1
                },
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Subscribers',
                    color: '#9ca3af',
                    font: { size: 11 }
                }
            }
        }
    });

    // Prepare chart data
    const viewsChartData = transformToChartData('views', 'Views', '#3b82f6');
    const watchTimeChartData = transformToChartData('watchTimeMinutes', 'Watch Time (min)', '#8b5cf6');
    const subscribersChartData = transformToBarChartData('subscribersGained', 'Subscribers Gained', '#22c55e');

    // Loading state
    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <IconLoader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-400 text-sm">Loading analytics data...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md text-center">
                    <IconAlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Analytics</h3>
                    <p className="text-slate-400 text-sm mb-4">{error}</p>
                    <button
                        onClick={fetchAnalytics}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    >
                        <IconRefresh className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // No data state
    if (!analyticsData || !analyticsData.rows || analyticsData.rows.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-md text-center">
                    <IconBrandYoutube className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Analytics Data</h3>
                    <p className="text-slate-400 text-sm">
                        No analytics data available yet. Make sure you have connected your YouTube channel and have some activity.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <IconBrandYoutube className="w-8 h-8 text-red-500" />
                        <h2 className="text-2xl font-bold text-white">YouTube Analytics</h2>
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-sm transition-colors flex items-center gap-2"
                    >
                        <IconRefresh className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Views per Day - Line Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <IconChartLine className="w-5 h-5 text-blue-400" />
                            <span className="text-sm font-medium text-slate-300">Views per Day</span>
                        </div>
                        <div className="h-64">
                            {viewsChartData ? (
                                <Line
                                    data={viewsChartData}
                                    options={getLineChartOptions('Daily Views', 'Views')}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500">
                                    No views data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Watch Time per Day - Line Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <IconClock className="w-5 h-5 text-purple-400" />
                            <span className="text-sm font-medium text-slate-300">Watch Time per Day</span>
                        </div>
                        <div className="h-64">
                            {watchTimeChartData ? (
                                <Line
                                    data={watchTimeChartData}
                                    options={getLineChartOptions('Daily Watch Time', 'Minutes')}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500">
                                    No watch time data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Subscribers Gained - Bar Chart (Full Width) */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <IconUserPlus className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-medium text-slate-300">Subscribers Gained per Day</span>
                    </div>
                    <div className="h-72">
                        {subscribersChartData ? (
                            <Bar
                                data={subscribersChartData}
                                options={getBarChartOptions('Daily Subscribers Gained')}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                No subscriber data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Data Summary */}
                {analyticsData.rows.length > 0 && (
                    <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-5">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Data Summary</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-blue-400">
                                    {analyticsData.rows.reduce((sum, row) => sum + (row[analyticsData.columns.indexOf('views')] || 0), 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">Total Views</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-purple-400">
                                    {Math.round(analyticsData.rows.reduce((sum, row) => sum + (row[analyticsData.columns.indexOf('watchTimeMinutes')] || 0), 0)).toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">Total Watch Minutes</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-400">
                                    {analyticsData.rows.reduce((sum, row) => sum + (row[analyticsData.columns.indexOf('subscribersGained')] || 0), 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">Total Subscribers Gained</div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-3 text-center">
                            Showing data for {analyticsData.rows.length} days
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YouTubeAnalyticsDashboard;
