import React, { useState } from 'react';
import Header from '../components/Header';
import { FloatingDock } from '../components/ui/floating-dock';
import AIChat from '../components/tools/AIChat';
import VideoEditor from '../components/tools/VideoEditor';
import PhotoEditor from '../components/tools/PhotoEditor';
import Canvas from '../components/tools/Canvas';
import WritingArea from '../components/tools/WritingArea';
import {
    IconMessageChatbot,
    IconVideo,
    IconPhoto,
    IconBrush,
    IconFileText,
    IconPlus,
    IconArrowLeft
} from "@tabler/icons-react";

const MyProjects = () => {
    const [selectedProject, setSelectedProject] = useState(0);
    const [activeTool, setActiveTool] = useState(null); // null, 'ai-chat', 'video-editor', 'photo-editor', 'canvas', 'writing-area'

    const projects = [
        { id: 0, name: 'Project Alpha', created: '2026-01-20' },
        { id: 1, name: 'Project Beta', created: '2026-01-22' },
        { id: 2, name: 'Project Gamma', created: '2026-01-23' },
    ];

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
        switch (activeTool) {
            case 'ai-chat':
                return <AIChat hideSidebar={true} />;
            case 'video-editor':
                return <VideoEditor />;
            case 'photo-editor':
                return <PhotoEditor />;
            case 'canvas':
                return <Canvas />;
            case 'writing-area':
                return <WritingArea />;
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

    return (
        <div className="h-screen bg-black text-white flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">
            <Header />

            <div className="flex flex-1 pt-24 px-6 gap-6 pb-6 overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 flex flex-col gap-6 relative border-r border-white/10 pr-6">
                    {/* Header Section of Sidebar */}
                    <div className="flex flex-col gap-4">
                        <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
                            <IconPlus className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
                            <span className="font-semibold text-sm">New Project</span>
                        </button>

                        <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2">
                            Created Projects
                        </div>
                    </div>

                    {/* Projects List */}
                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {projects.map((project, index) => (
                            <div
                                key={project.id}
                                onClick={() => setSelectedProject(index)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${selectedProject === index
                                    ? 'bg-white/5 border-indigo-500/50'
                                    : 'border-transparent hover:bg-white/5 hover:border-white/10'
                                    }`}
                            >
                                {selectedProject === index && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full -ml-[1px]" />
                                )}
                                <h3 className={`font-medium text-sm mb-1 ${selectedProject === index ? 'text-white' : 'text-slate-300'}`}>
                                    {project.name}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {project.created}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Collapse Button (Visual only based on wireframe) */}
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                        <button className="h-6 w-6 rounded-full bg-black border border-white/20 flex items-center justify-center hover:scale-110 transition-transform">
                            <IconArrowLeft className="w-3 h-3 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-4 border border-white/10 rounded-3xl p-4 bg-white/[0.02] overflow-hidden">
                    {/* Project Toolbar */}
                    <div className="h-20 w-full border border-white/10 rounded-2xl flex items-center justify-center bg-black/40 backdrop-blur-sm relative overflow-hidden group shrink-0">
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

                    {/* Tool Area - Replaces "Opened Project" */}
                    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-black/20 border border-white/5 relative">
                        <div className="flex-1 w-full h-full">
                             {renderTool()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProjects;
