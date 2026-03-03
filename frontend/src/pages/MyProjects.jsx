import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { FloatingDock } from '../components/ui/floating-dock';
import { useAuth } from '../context/AuthContext';
import {
    IconMessageChatbot,
    IconVideo,
    IconPhoto,
    IconBrush,
    IconFileText,
    IconPlus,
    IconArrowLeft,
    IconTrash,
    IconX,
    IconChartBar,
    IconLayoutKanban,
    IconFlame,
    IconSparkles,
    IconChevronDown,
    IconChevronUp,
    IconExternalLink,
    IconNews
} from "@tabler/icons-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AIChat = lazy(() => import('../components/tools/AIChat'));
const VideoEditor = lazy(() => import('../components/tools/VideoEditor'));
const PhotoEditor = lazy(() => import('../components/tools/PhotoEditor'));
const Canvas = lazy(() => import('../components/tools/Canvas'));
const WritingArea = lazy(() => import('../components/tools/WritingArea'));
const YouTubeStats = lazy(() => import('../components/YouTubeStats'));
const KanbanBoard = lazy(() => import('../components/KanbanBoard'));

const PanelLoader = () => (
    <div className="flex items-center justify-center h-full text-slate-400">
        <div className="h-8 w-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
    </div>
);

const TrendSpotter = ({ token, onCreateProject }) => {
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selectedTrend, setSelectedTrend] = useState(null);

    const stripHtml = (html) => {
        if (!html) return "";
        return html.replace(/<[^>]*>?/gm, '');
    };

    const fetchTrends = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/trends`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setTrends(data.trends || []);
        } catch (error) {
            console.error('Error fetching trends:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchTrends();
    }, [fetchTrends]);

    const handleCreateProject = async (e, trend) => {
        if (e) e.stopPropagation();
        setGenerating(trend.title);
        try {
            if (onCreateProject) {
                await onCreateProject(trend.title);
                setSelectedTrend(null);
            }
        } catch (error) {
            console.error('Error generating project from trend:', error);
        } finally {
            setGenerating(null);
        }
    };

    if (loading) return (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
            <div className="h-4 w-32 bg-white/10 rounded mb-4" />
            <div className="space-y-3">
                <div className="h-10 w-full bg-white/10 rounded" />
            </div>
        </div>
    );

    return (
        <>
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 border border-white/10 shadow-xl backdrop-blur-sm overflow-hidden transition-all duration-300">
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-orange-500/20">
                            <IconFlame className="w-4 h-4 text-orange-400" />
                        </div>
                        <h3 className="font-bold text-sm text-white tracking-tight">Trend Spotter</h3>
                    </div>
                    {isCollapsed ? (
                        <IconChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                        <IconChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                </button>
                
                {!isCollapsed && (
                    <div className="px-4 pb-4 space-y-3">
                        {trends.map((trend, i) => (
                            <div 
                                key={i} 
                                onClick={() => setSelectedTrend(trend)}
                                className="group relative flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer"
                            >
                                <p className="text-xs font-medium text-slate-300 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                                    {trend.title}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-tighter">
                                        {trend.source || 'News'}
                                    </span>
                                    <button
                                        onClick={(e) => handleCreateProject(e, trend)}
                                        disabled={generating === trend.title}
                                        className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all text-[9px] font-bold text-indigo-300 disabled:opacity-50"
                                    >
                                        {generating === trend.title ? (
                                            <div className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <IconSparkles className="w-2.5 h-2.5" />
                                        )}
                                        {generating === trend.title ? '...' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        {trends.length === 0 && (
                            <p className="text-[10px] text-slate-500 text-center py-2">No trends found right now</p>
                        )}
                    </div>
                )}
            </div>

            {/* Trend Detail Modal */}
            <AnimatePresence mode="wait">
                {selectedTrend && (
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
                        onClick={() => setSelectedTrend(null)}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-2xl relative shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                            
                            <button
                                onClick={() => setSelectedTrend(null)}
                                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full border border-white/10 transition-colors z-[110]"
                            >
                                <IconX className="w-5 h-5 text-slate-400" />
                            </button>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 rounded-xl bg-orange-500/20">
                                        <IconFlame className="w-6 h-6 text-orange-400" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">Trending Story</div>
                                        <span className="text-xs text-slate-500">{selectedTrend.source} • {selectedTrend.publishedAt}</span>
                                    </div>
                                </div>

                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">
                                    {selectedTrend.title}
                                </h2>

                                <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent text-slate-300 leading-relaxed">
                                    <p className="text-lg font-medium text-slate-200">
                                        {stripHtml(selectedTrend.description)}
                                    </p>
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-2 mb-3 text-indigo-400">
                                            <IconNews className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Story Context</span>
                                        </div>
                                        <p className="text-sm">
                                            {stripHtml(selectedTrend.content) || "Full story content available on source site."}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-10">
                                    <button
                                        onClick={(e) => handleCreateProject(e, selectedTrend)}
                                        disabled={generating === selectedTrend.title}
                                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                                    >
                                        {generating === selectedTrend.title ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <IconSparkles className="w-5 h-5" />
                                        )}
                                        {generating === selectedTrend.title ? 'Creating Project...' : 'Auto-Generate Video Project'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

const MyProjects = () => {
    const { isAuthenticated, token, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [activeTool, setActiveTool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectColor, setNewProjectColor] = useState('#6366f1');
    const [creating, setCreating] = useState(false);

    const projectColors = [
        '#ef4444', '#f59e0b', '#10b981', '#06b6d4', 
        '#6366f1', '#8b5cf6', '#ec4899', '#94a3b8'
    ];
    const [showStats, setShowStats] = useState(false);
    const [showKanban, setShowKanban] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Helper function to get auth headers
    const getAuthHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }), [token]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [authLoading, isAuthenticated, navigate]);

    const fetchProjects = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/auth');
                    return;
                }
                throw new Error('Failed to fetch projects');
            }
            const data = await response.json();
            setProjects(data);
            if (data.length > 0 && !selectedProject) {
                setSelectedProject(data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders, navigate, selectedProject]);

    // Fetch projects on mount (only if authenticated)
    useEffect(() => {
        if (isAuthenticated && token) {
            fetchProjects();
        }
    }, [isAuthenticated, token, fetchProjects]);

    const createProject = async () => {
        if (!newProjectName.trim()) return;
        await handleCreateProjectByName(newProjectName.trim(), newProjectColor);
        setShowCreateModal(false);
        setNewProjectName('');
        setNewProjectColor('#6366f1');
    };

    const handleCreateProjectByName = async (name, color = '#6366f1') => {
        setCreating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ 
                    name: name,
                    color: color
                })
            });
            const newProject = await response.json();
            setProjects(prev => [newProject, ...prev]);
            setSelectedProject(newProject._id);
            return newProject;
        } catch (error) {
            console.error('Error creating project:', error);
        } finally {
            setCreating(false);
        }
    };

    const deleteProject = async (projectId, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            await fetch(`${API_BASE_URL}/projects/${projectId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            setProjects(projects.filter(p => p._id !== projectId));
            if (selectedProject === projectId) {
                setSelectedProject(projects[0]?._id || null);
            }
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const tools = useMemo(() => [
        { id: 'ai-chat', title: "AI Chat", icon: <IconMessageChatbot className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
        { id: 'video-editor', title: "Video Editor", icon: <IconVideo className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
        { id: 'photo-editor', title: "Photo Editor", icon: <IconPhoto className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
        { id: 'canvas', title: "Canvas", icon: <IconBrush className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
        { id: 'writing-area', title: "Writing Area", icon: <IconFileText className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
    ], []);

    const links = useMemo(() => tools.map(tool => ({
        title: tool.title,
        icon: tool.icon,
        href: "#",
        onClick: () => setActiveTool(tool.id)
    })), [tools]);

    const renderTools = () => {
        if (!selectedProject) {
            return (
                <div className="flex items-center justify-center h-full text-slate-500">
                    <div className="text-center">
                        <h2 className="text-2xl font-light mb-2">No Project Selected</h2>
                        <p className="text-sm">Create or select a project to get started</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="h-full w-full relative" key={selectedProject}>
                <div className={activeTool === 'ai-chat' ? "h-full w-full" : "hidden"}>
                    <AIChat hideSidebar={true} projectId={selectedProject} token={token} />
                </div>
                <div className={activeTool === 'video-editor' ? "h-full w-full" : "hidden"}>
                    <VideoEditor projectId={selectedProject} token={token} />
                </div>
                <div className={activeTool === 'photo-editor' ? "h-full w-full" : "hidden"}>
                    <PhotoEditor projectId={selectedProject} token={token} />
                </div>
                <div className={activeTool === 'canvas' ? "h-full w-full" : "hidden"}>
                    <Canvas projectId={selectedProject} token={token} />
                </div>
                <div className={activeTool === 'writing-area' ? "h-full w-full" : "hidden"}>
                    <WritingArea projectId={selectedProject} token={token} />
                </div>
                {!activeTool && (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        <div className="text-center">
                            <h2 className="text-2xl font-light mb-2">Select a Tool</h2>
                            <p className="text-sm">Choose a tool from the toolbar above to get started</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="h-screen bg-black text-white flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">
            <Header />

            <div className="flex flex-1 pt-24 px-4 gap-4 pb-4 overflow-hidden">
                {/* Sidebar */}
                <div className={`${isSidebarCollapsed ? 'w-0 opacity-0 pr-0 border-r-0 overflow-hidden' : 'w-64 opacity-100 pr-4 border-r border-white/10'} flex flex-col gap-4 relative transition-all duration-300 ease-in-out`}>
                    {/* Header Section of Sidebar */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => { setShowStats(true); setShowKanban(false); setSelectedProject(null); setActiveTool(null); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all group ${showStats
                                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                }`}
                        >
                            <IconChartBar className={`w-5 h-5 ${showStats ? 'text-indigo-300' : 'text-indigo-400 group-hover:text-indigo-300'}`} />
                            <span className="font-semibold text-sm">Stats</span>
                        </button>

                        <button
                            onClick={() => { setShowKanban(true); setShowStats(false); setSelectedProject(null); setActiveTool(null); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all group ${showKanban
                                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                }`}
                        >
                            <IconLayoutKanban className={`w-5 h-5 ${showKanban ? 'text-indigo-300' : 'text-indigo-400 group-hover:text-indigo-300'}`} />
                            <span className="font-semibold text-sm">Todo List</span>
                        </button>

                        <button
                            onClick={() => { setShowCreateModal(true); setShowStats(false); setShowKanban(false); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                        >
                            <IconPlus className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
                            <span className="font-semibold text-sm">New Project</span>
                        </button>

                        <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">
                            Created Projects
                        </div>
                    </div>

                    {/* Projects List */}
                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {loading ? (
                            <div className="text-slate-500 text-sm text-center py-4">Loading...</div>
                        ) : projects.length === 0 ? (
                            <div className="text-slate-500 text-sm text-center py-4">No projects yet</div>
                        ) : (
                            projects.map((project) => (
                                <div
                                    key={project._id}
                                    onClick={() => { setSelectedProject(project._id); setShowStats(false); setShowKanban(false); }}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${selectedProject === project._id
                                        ? 'bg-white/5 border-indigo-500/50'
                                        : 'border-transparent hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    {selectedProject === project._id && (
                                        <div 
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full -ml-[1px]" 
                                            style={{ backgroundColor: project.color || '#6366f1' }}
                                        />
                                    )}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div 
                                                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                                style={{ backgroundColor: project.color || '#6366f1' }}
                                            />
                                            <div>
                                                <h3 className={`font-medium text-sm mb-1 transition-colors ${selectedProject === project._id ? 'text-white' : 'text-slate-300'}`}
                                                    style={selectedProject === project._id ? { color: project.color || '#fff' } : {}}
                                                >
                                                    {project.name}
                                                </h3>
                                                {/* Project Progress Bar */}
                                                <div className="mt-3 space-y-1.5">
                                                    <div className="flex justify-between items-center gap-2 text-[11px] font-bold text-slate-400 tracking-tight">
                                                        <span className="truncate">{project.stats?.completedTasks || 0}/{project.stats?.totalTasks || 0} Tasks</span>
                                                        <span className="text-white/80 shrink-0">{project.stats?.percentComplete || 0}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${project.stats?.percentComplete || 0}%` }}
                                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                                            className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                                            style={{ backgroundColor: project.color || '#6366f1' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => deleteProject(project._id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                                        >
                                            <IconTrash className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Trend Spotter Section */}
                    <div className="mt-auto pt-4 border-t border-white/5">
                        <TrendSpotter token={token} onCreateProject={handleCreateProjectByName} />
                    </div>
                </div>

                {/* Collapse Button - Outside sidebar so it's always visible */}
                <div className="absolute left-[var(--sidebar-offset)] top-1/2 -translate-y-1/2 z-20 transition-all duration-300" style={{ '--sidebar-offset': isSidebarCollapsed ? '8px' : '268px' }}>
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="h-6 w-6 rounded-full bg-black border border-white/20 flex items-center justify-center hover:scale-110 hover:border-indigo-500/50 transition-all"
                        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <IconArrowLeft className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>
                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-3 border border-white/10 rounded-2xl p-3 bg-white/[0.02] overflow-hidden">
                    <Suspense fallback={<PanelLoader />}>
                        {showStats ? (
                            /* Stats Section - YouTube Analytics */
                            <YouTubeStats token={token} />
                        ) : showKanban ? (
                            /* Kanban Board Section */
                            <KanbanBoard
                                token={token}
                                projects={projects}
                                onTaskUpdate={fetchProjects}
                                onNavigateToProject={(id) => {
                                    setSelectedProject(id);
                                    setShowKanban(false);
                                    setActiveTool('ai-chat'); // Default to AI Chat when jumping to project
                                }}
                            />
                        ) : (
                            <>
                                {/* Project Toolbar */}
                                <div className="h-16 w-full border border-white/10 rounded-xl flex items-center justify-center bg-black/40 backdrop-blur-sm relative overflow-visible group shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                    <div className="flex items-center justify-center w-full">
                                        <FloatingDock
                                            items={links}
                                            desktopClassName="bg-transparent scale-90"
                                        />
                                    </div>
                                    <span className="absolute top-1 left-3 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                                        Project Toolbar
                                    </span>
                                </div>

                                {/* Tool Area */}
                                <div className="flex-1 flex flex-col rounded-xl overflow-hidden bg-black/20 border border-white/5 relative min-h-0">
                                    <div className="absolute inset-0 overflow-auto">
                                        {renderTools()}
                                    </div>
                                </div>
                            </>
                        )}
                    </Suspense>
                </div>
            </div>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Create New Project</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <IconX className="w-5 h-5" />
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="Project name..."
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createProject()}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 mb-4"
                            autoFocus
                        />

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Project Color</label>
                            <div className="flex flex-wrap gap-3">
                                {projectColors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setNewProjectColor(color)}
                                        className={`w-8 h-8 rounded-full transition-all ${newProjectColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createProject}
                                disabled={creating || !newProjectName.trim()}
                                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProjects;
