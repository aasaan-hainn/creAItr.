import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
    IconSearch, 
    IconFilter, 
    IconPlus, 
    IconX, 
    IconSparkles,
    IconFlame,
    IconChevronRight,
    IconDeviceGamepad2,
    IconNews,
    IconMicrophone2,
    IconGavel,
    IconRefresh
} from '@tabler/icons-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Trends = () => {
    const { isAuthenticated, token, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrend, setSelectedTrend] = useState(null);
    const [creatingProject, setCreatingProject] = useState(false);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (selectedTrend) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedTrend]);

    const categories = [
        { id: 'all', label: 'All Trends', icon: <IconFlame className="w-4 h-4" /> },
        { id: 'gaming', label: 'Gaming', icon: <IconDeviceGamepad2 className="w-4 h-4" />, query: 'gaming' },
        { id: 'news', label: 'News', icon: <IconNews className="w-4 h-4" />, category: 'general' },
        { id: 'politics', label: 'Politics', icon: <IconGavel className="w-4 h-4" />, query: 'politics' },
        { id: 'podcasts', label: 'Podcasts', icon: <IconMicrophone2 className="w-4 h-4" />, query: 'podcast' },
        { id: 'technology', label: 'Tech', icon: <IconSparkles className="w-4 h-4" />, category: 'technology' },
    ];

    const fetchTrends = useCallback(async (reset = false) => {
        if (!token) return;
        setLoading(true);
        try {
            const currentCategory = categories.find(c => c.id === filter);
            let url = `${API_BASE_URL}/trends?`;
            
            if (searchQuery) {
                url += `q=${encodeURIComponent(searchQuery)}`;
            } else if (currentCategory?.query) {
                url += `q=${encodeURIComponent(currentCategory.query)}`;
            } else if (currentCategory?.category) {
                url += `category=${currentCategory.category}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (reset) {
                setTrends(data.trends || []);
            } else {
                setTrends(prev => [...prev, ...(data.trends || [])]);
            }
        } catch (error) {
            console.error('Error fetching trends:', error);
        } finally {
            setLoading(false);
        }
    }, [token, filter, searchQuery]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [authLoading, isAuthenticated, navigate]);

    useEffect(() => {
        fetchTrends(true);
        setPage(1);
    }, [filter, searchQuery, fetchTrends]);

    const handleCreateProject = async (trend) => {
        setCreatingProject(true);
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    name: trend.title,
                    color: '#6366f1'
                })
            });
            if (response.ok) {
                navigate('/my-projects');
            }
        } catch (error) {
            console.error('Error creating project:', error);
        } finally {
            setCreatingProject(false);
            setSelectedTrend(null);
        }
    };

    const stripHtml = (html) => {
        if (!html) return "";
        return html.replace(/<[^>]*>?/gm, '');
    };

    const visibleTrends = trends.slice(0, page * 10);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <Header />
            
            <main className="pt-28 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="relative mb-12 text-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-slate-400 to-indigo-400 bg-clip-text text-transparent"
                    >
                        Trending Now
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg max-w-2xl mx-auto"
                    >
                        Discover what's happening around the world and turn hot topics into viral projects.
                    </motion.p>
                </div>

                {/* Filters & Search - Sticky Bar */}
                <div className="sticky top-[72px] z-40 py-3 border-y border-white/10 bg-black/90 mb-12 backdrop-blur-2xl">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar w-full md:w-auto">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilter(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap text-sm font-medium ${
                                        filter === cat.id 
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                                    }`}
                                >
                                    {cat.icon}
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-80 group">
                            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search topics or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Trends Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleTrends.map((trend, idx) => (
                        <motion.div
                            key={`${trend.title}-${idx}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx % 10 * 0.05 }}
                            onClick={() => setSelectedTrend(trend)}
                            className="group bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all duration-500 cursor-pointer flex flex-col hover:shadow-2xl hover:shadow-indigo-500/5"
                        >
                            <div className="aspect-video relative overflow-hidden bg-white/5">
                                {trend.urlToImage ? (
                                    <img 
                                        src={trend.urlToImage} 
                                        alt={trend.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <IconNews className="w-12 h-12 text-white/10" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                                        {trend.source}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-indigo-300 transition-colors leading-tight">
                                    {trend.title}
                                </h3>
                                <p className="text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                                    {stripHtml(trend.description)}
                                </p>
                                
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-500 uppercase font-mono">
                                            {new Date(trend.publishedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <IconChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* No Results */}
                {!loading && visibleTrends.length === 0 && (
                    <div className="text-center py-20">
                        <IconSearch className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">No trends found</h3>
                        <p className="text-slate-600">Try adjusting your filters or search query.</p>
                        <button 
                            onClick={() => {setFilter('all'); setSearchQuery('');}}
                            className="mt-6 text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-2 mx-auto"
                        >
                            <IconRefresh className="w-4 h-4" />
                            Clear all filters
                        </button>
                    </div>
                )}

                {/* Show More */}
                {!loading && trends.length > visibleTrends.length && (
                    <div className="mt-12 text-center">
                        <button 
                            onClick={() => setPage(p => p + 1)}
                            className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-bold text-slate-300"
                        >
                            Show More Trends
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white/5 border border-white/5 rounded-3xl h-80 animate-pulse" />
                        ))}
                    </div>
                )}
            </main>

            {/* Detail Modal - Rendered via Portal to stay fixed in the viewport */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {selectedTrend && (
                        <div className="fixed inset-0 z-[100] grid place-items-center p-4 md:p-8 h-screen w-screen overflow-hidden pointer-events-none">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedTrend(null)}
                                className="absolute inset-0 bg-black/95 backdrop-blur-2xl pointer-events-auto" 
                            />
                            
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 0 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-5xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col md:flex-row z-[110] origin-center pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button 
                                    onClick={() => setSelectedTrend(null)}
                                    className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full border border-white/10 transition-all text-white"
                                >
                                    <IconX className="w-6 h-6" />
                                </button>

                                <div className="w-full md:w-1/2 relative bg-black flex items-center justify-center min-h-[300px] md:min-h-0">
                                    {selectedTrend.urlToImage ? (
                                        <img 
                                            src={selectedTrend.urlToImage} 
                                            alt={selectedTrend.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <IconNews className="w-32 h-32 text-white/5" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-slate-900" />
                                </div>

                                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                                            {selectedTrend.source}
                                        </span>
                                        <span className="text-slate-500 text-xs">
                                            {new Date(selectedTrend.publishedAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    <h2 className="text-3xl font-black mb-6 leading-tight">
                                        {selectedTrend.title}
                                    </h2>

                                    <div className="space-y-6 text-slate-300 leading-relaxed mb-10 flex-1">
                                        <p className="text-lg font-medium text-slate-200">
                                            {stripHtml(selectedTrend.description)}
                                        </p>
                                        <p className="text-sm opacity-70">
                                            {stripHtml(selectedTrend.content) || "Full content available on the source website."}
                                        </p>
                                    </div>

                                    <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
                                        <button 
                                            onClick={() => handleCreateProject(selectedTrend)}
                                            disabled={creatingProject}
                                            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {creatingProject ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <IconSparkles className="w-5 h-5" />
                                            )}
                                            {creatingProject ? 'Creating...' : 'Create Project with this Trend'}
                                        </button>
                                        
                                        <a 
                                            href={selectedTrend.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all text-center"
                                        >
                                            Read Original Article
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default Trends;
