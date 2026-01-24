import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { FloatingDock } from '../components/ui/floating-dock';
import AIChat from '../components/tools/AIChat';
import VideoEditor from '../components/tools/VideoEditor';
import PhotoEditor from '../components/tools/PhotoEditor';
import Canvas from '../components/tools/Canvas';
import WritingArea from '../components/tools/WritingArea';
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
    IconX
} from "@tabler/icons-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MyProjects = () => {
    const { isAuthenticated, token, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [activeTool, setActiveTool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [creating, setCreating] = useState(false);

    // Helper function to get auth headers
    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [authLoading, isAuthenticated, navigate]);

    // Fetch projects on mount (only if authenticated)
    useEffect(() => {
        if (isAuthenticated && token) {
            fetchProjects();
        }
    }, [isAuthenticated, token]);

    const fetchProjects = async () => {
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
    };

    const createProject = async () => {
        if (!newProjectName.trim()) return;

        setCreating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name: newProjectName.trim() })
            });
            const newProject = await response.json();
            setProjects([newProject, ...projects]);
            setSelectedProject(newProject._id);
            setShowCreateModal(false);
            setNewProjectName('');
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

    const tools = [
        { id: 'ai-chat', title: "AI Chat", icon: <IconMessageChatbot className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
        { id: 'video-editor', title: "Video Editor", icon: <IconVideo className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
        { id: 'photo-editor', title: "Photo Editor", icon: <IconPhoto className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
        { id: 'canvas', title: "Canvas", icon: <IconBrush className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
        { id: 'writing-area', title: "Writing Area", icon: <IconFileText className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
    ];

    const links = tools.map(tool => ({
        title: tool.title,
        icon: tool.icon,
        href: "#",
        onClick: () => setActiveTool(tool.id)
    }));

    const renderTool = () => {
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

        switch (activeTool) {
            case 'ai-chat':
                return <AIChat hideSidebar={true} projectId={selectedProject} token={token} />;
            case 'video-editor':
                return <VideoEditor projectId={selectedProject} token={token} />;
            case 'photo-editor':
                return <PhotoEditor projectId={selectedProject} token={token} />;
            case 'canvas':
                return <Canvas projectId={selectedProject} token={token} />;
            case 'writing-area':
                return <WritingArea projectId={selectedProject} token={token} />;
            default:
                return (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        <div className="text-center">
                            <h2 className="text-2xl font-light mb-2">Select a Tool</h2>
                            <p className="text-sm">Choose a tool from the toolbar above to get started</p>
                        </div>
                    </div>
                );
        }
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

            <div className="flex flex-1 pt-24 px-6 gap-6 pb-6 overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 flex flex-col gap-6 relative border-r border-white/10 pr-6">
                    {/* Header Section of Sidebar */}
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                        >
                            <IconPlus className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
                            <span className="font-semibold text-sm">New Project</span>
                        </button>

                        <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2">
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
                                    onClick={() => setSelectedProject(project._id)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${selectedProject === project._id
                                        ? 'bg-white/5 border-indigo-500/50'
                                        : 'border-transparent hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    {selectedProject === project._id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full -ml-[1px]" />
                                    )}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className={`font-medium text-sm mb-1 ${selectedProject === project._id ? 'text-white' : 'text-slate-300'}`}>
                                                {project.name}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {formatDate(project.created)}
                                            </p>
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

                    {/* Collapse Button */}
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                        <button className="h-6 w-6 rounded-full bg-black border border-white/20 flex items-center justify-center hover:scale-110 transition-transform">
                            <IconArrowLeft className="w-3 h-3 text-slate-400" />
                        </button>
                    </div>
                </div>
                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-4 border border-white/10 rounded-3xl p-4 bg-white/[0.02] overflow-hidden">
                    {/* Project Toolbar */}
                    <div className="h-20 w-full border border-white/10 rounded-2xl flex items-center justify-center bg-black/40 backdrop-blur-sm relative overflow-visible group shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                        <div className="flex items-center justify-center w-full">
                            <FloatingDock
                                items={links}
                                desktopClassName="bg-transparent"
                            />
                        </div>
                        <span className="absolute top-2 left-4 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                            Project Toolbar
                        </span>
                    </div>

                    {/* Tool Area */}
                    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-black/20 border border-white/5 relative min-h-0">
                        <div className="absolute inset-0 overflow-auto">
                            {renderTool()}
                        </div>
                    </div>
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
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 mb-6"
                            autoFocus
                        />

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
