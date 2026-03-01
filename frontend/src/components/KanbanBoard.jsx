import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    IconPlus, 
    IconTrash, 
    IconCalendar, 
    IconExternalLink, 
    IconX, 
    IconLoader2
} from "@tabler/icons-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const KanbanBoard = ({ token, projects, onNavigateToProject }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        status: 'todo',
        dueDate: '',
        projectId: ''
    });
    const [creating, setCreating] = useState(false);

    const columns = [
        { id: 'todo', title: 'To Do', color: 'bg-slate-500/10 border-slate-500/20' },
        { id: 'in-progress', title: 'In Progress', color: 'bg-indigo-500/10 border-indigo-500/20' },
        { id: 'done', title: 'Done', color: 'bg-emerald-500/10 border-emerald-500/20' }
    ];

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            // Data is already sorted by 'order' from backend
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const createTask = async () => {
        if (!newTask.title.trim()) return;
        setCreating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTask)
            });
            const task = await response.json();
            setTasks([...tasks, task]);
            setShowCreateModal(false);
            setNewTask({ title: '', description: '', status: 'todo', dueDate: '', projectId: '' });
        } catch (error) {
            console.error('Error creating task:', error);
        } finally {
            setCreating(false);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTasks(tasks.filter(t => t._id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const updateTaskStatusAndOrder = async (taskId, newStatus, newOrder) => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus, order: newOrder })
            });
            const updatedTask = await response.json();
            
            // Re-fetch all tasks to ensure correct ordering is displayed
            // (Alternatively, update locally but bulk updates might be needed)
            fetchTasks();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const getProjectName = (projectId) => {
        const project = projects.find(p => p._id === projectId);
        return project ? project.name : 'No Project';
    };

    // Drag and Drop implementation
    const onDragStart = (e, taskId) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = (e, status, targetTaskIndex = -1) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        
        // Find moving task
        const taskToMove = tasks.find(t => t._id === taskId);
        if (!taskToMove) return;

        // Get all tasks in the target status
        const columnTasks = tasks.filter(t => t.status === status);
        
        // Simple reordering logic
        let newOrder;
        if (targetTaskIndex === -1 || columnTasks.length === 0) {
            newOrder = columnTasks.length;
        } else {
            newOrder = targetTaskIndex;
        }

        updateTaskStatusAndOrder(taskId, status, newOrder);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <IconLoader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Task Board
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Manage your project milestones</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-medium"
                >
                    <IconPlus size={18} />
                    New Task
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {columns.map(column => (
                    <div 
                        key={column.id}
                        className={`flex-1 min-w-[320px] max-w-[400px] flex flex-col rounded-2xl border ${column.color} backdrop-blur-sm`}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, column.id)}
                    >
                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-300">
                                    {column.title}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-bold text-slate-500">
                                    {tasks.filter(t => t.status === column.id).length}
                                </span>
                            </div>
                        </div>

                        <div 
                            className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent"
                            onDrop={(e) => onDrop(e, column.id, -1)}
                        >
                            <AnimatePresence mode='popLayout'>
                                {tasks
                                    .filter(t => t.status === column.id)
                                    .map((task, index) => (
                                        <motion.div
                                            key={task._id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, task._id)}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onDrop(e, column.id, index);
                                            }}
                                            className="p-4 bg-slate-900/50 border border-white/10 rounded-xl hover:border-white/20 transition-all group cursor-grab active:cursor-grabbing shadow-xl relative"
                                        >
                                            {/* Card Number */}
                                            <div className="absolute top-2 right-10 text-[10px] font-mono text-slate-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                #{index + 1}
                                            </div>

                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                                    {task.title}
                                                </h4>
                                                <button 
                                                    onClick={() => deleteTask(task._id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                                                >
                                                    <IconTrash className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                            
                                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                                {task.description}
                                            </p>

                                            <div className="flex flex-col gap-2">
                                                {task.dueDate && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <IconCalendar size={14} />
                                                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                
                                                {task.projectId && (
                                                    <button 
                                                        onClick={() => onNavigateToProject(task.projectId)}
                                                        className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1 w-fit"
                                                    >
                                                        <IconExternalLink size={14} />
                                                        <span className="truncate max-w-[150px] font-medium">
                                                            {getProjectName(task.projectId)}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Task Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">New Task</h3>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                    <IconX size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Task Title</label>
                                    <input 
                                        type="text"
                                        placeholder="What needs to be done?"
                                        value={newTask.title}
                                        onChange={e => setNewTask({...newTask, title: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                                    <textarea 
                                        placeholder="Add more details..."
                                        value={newTask.description}
                                        onChange={e => setNewTask({...newTask, description: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-24 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Due Date</label>
                                        <input 
                                            type="date"
                                            value={newTask.dueDate}
                                            onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Project</label>
                                        <select 
                                            value={newTask.projectId}
                                            onChange={e => setNewTask({...newTask, projectId: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        >
                                            <option value="" className="bg-slate-900">None</option>
                                            {projects.map(p => (
                                                <option key={p._id} value={p._id} className="bg-slate-900">{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    onClick={createTask}
                                    disabled={creating || !newTask.title.trim()}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all mt-4"
                                >
                                    {creating ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KanbanBoard;
