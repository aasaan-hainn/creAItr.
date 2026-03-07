import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    IconUpload, 
    IconFile, 
    IconTrash, 
    IconEdit, 
    IconCheck, 
    IconX, 
    IconDownload,
    IconLoader2,
    IconSearch,
    IconPlus,
    IconArchive,
    IconSend,
    IconMessageChatbot,
    IconVideo,
    IconPhoto,
    IconBrush,
    IconFileText
} from '@tabler/icons-react';

const Vault = ({ token, onUseItem, activeProject, onClose }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editHeading, setEditHeading] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [showToolSelect, setShowToolSelect] = useState(null);

    const [newFile, setNewFile] = useState(null);
    const [newHeading, setNewHeading] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const availableTools = [
        { id: 'ai-chat', title: 'AI Chat', icon: <IconMessageChatbot className="w-3.5 h-3.5" /> },
        { id: 'video-editor', title: 'Video Editor', icon: <IconVideo className="w-3.5 h-3.5" /> },
        { id: 'photo-editor', title: 'Photo Editor', icon: <IconPhoto className="w-3.5 h-3.5" /> },
        { id: 'canvas', title: 'Canvas', icon: <IconBrush className="w-3.5 h-3.5" /> },
        { id: 'writing-area', title: 'Writing Area', icon: <IconFileText className="w-3.5 h-3.5" /> },
    ];

    const fetchVaultItems = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/vault`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching vault items:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchVaultItems();
        }
    }, [token]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!newFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', newFile);
        formData.append('heading', newHeading);
        formData.append('description', newDescription);

        try {
            const response = await fetch(`${API_BASE_URL}/vault`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const newItem = await response.json();
            setItems([newItem, ...items]);
            setShowUploadModal(false);
            setNewFile(null);
            setNewHeading('');
            setNewDescription('');
        } catch (error) {
            console.error('Error uploading to vault:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await fetch(`${API_BASE_URL}/vault/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setItems(items.filter(item => item._id !== id));
        } catch (error) {
            console.error('Error deleting vault item:', error);
        }
    };

    const handleUpdate = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/vault/${id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    heading: editHeading,
                    description: editDescription
                })
            });
            setItems(items.map(item => 
                item._id === id ? { ...item, heading: editHeading, description: editDescription } : item
            ));
            setEditingId(null);
        } catch (error) {
            console.error('Error updating vault item:', error);
        }
    };

    const startEditing = (item) => {
        setEditingId(item._id);
        setEditHeading(item.heading);
        setEditDescription(item.description);
    };

    const filteredItems = items.filter(item => 
        (item.heading || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.fileName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full w-full bg-black/40 border-l border-white/10 overflow-hidden relative">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <IconArchive className="w-5 h-5 text-indigo-400" />
                    <h2 className="font-bold text-sm tracking-tight text-white uppercase">Vault</h2>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <IconX className="w-4 h-4 text-slate-500" />
                    </button>
                )}
            </div>

            <div className="p-4 space-y-4">
                <div className="relative group">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search assets..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-full transition-all"
                    />
                </div>
                <button 
                    onClick={() => setShowUploadModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/10"
                >
                    <IconPlus className="w-3.5 h-3.5" />
                    Upload Asset
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <IconLoader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <IconArchive className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-xs text-slate-500 leading-relaxed">No assets found in your vault</p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div 
                            key={item._id}
                            className="group bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                    <IconFile className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => startEditing(item)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors">
                                        <IconEdit className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(item._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors">
                                        <IconTrash className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {editingId === item._id ? (
                                <div className="space-y-3 mb-3">
                                    <input 
                                        value={editHeading}
                                        onChange={(e) => setEditHeading(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                    />
                                    <textarea 
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 h-16 resize-none"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingId(null)} className="text-[10px] font-bold text-slate-500 hover:text-white px-2 py-1">Cancel</button>
                                        <button onClick={() => handleUpdate(item._id)} className="bg-indigo-600 text-[10px] font-bold text-white px-3 py-1 rounded-md">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <h4 className="font-bold text-white text-sm mb-1 truncate">{item.heading}</h4>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                                </div>
                            )}

                            <div className="relative mb-3">
                                <button 
                                    onClick={() => setShowToolSelect(showToolSelect === item._id ? null : item._id)}
                                    disabled={!activeProject}
                                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border transition-all text-[10px] font-bold ${
                                        activeProject 
                                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white' 
                                        : 'bg-white/5 border-white/10 text-slate-700 cursor-not-allowed'
                                    }`}
                                >
                                    <IconSend className="w-3 h-3" />
                                    {activeProject ? 'SEND TO TOOL' : 'SELECT PROJECT'}
                                </button>

                                <AnimatePresence>
                                    {showToolSelect === item._id && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                                        >
                                            {availableTools.map(tool => (
                                                <button
                                                    key={tool.id}
                                                    onClick={() => {
                                                        onUseItem(item, tool.id);
                                                        setShowToolSelect(null);
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 text-slate-400 hover:text-white transition-colors text-[10px] font-medium border-t border-white/5 first:border-0"
                                                >
                                                    {tool.icon}
                                                    {tool.title}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                <div className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter truncate max-w-[120px]">
                                    {item.fileName}
                                </div>
                                <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[9px] font-bold text-indigo-500 hover:text-indigo-400"
                                >
                                    VIEW FILE
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence mode="wait">
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl flex items-start justify-center z-[100] p-4 overflow-y-auto pt-20 pb-20 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900/90 border border-white/10 rounded-[2.5rem] p-8 md:p-12 w-full max-w-xl relative shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)] overflow-visible my-auto"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                            
                            <button 
                                onClick={() => setShowUploadModal(false)}
                                className="absolute top-6 right-6 p-2.5 hover:bg-white/5 rounded-full border border-white/10 transition-colors z-50 group"
                            >
                                <IconX className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                            </button>

                            <div className="relative z-10">
                                <div className="mb-10">
                                    <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Add to Vault</h3>
                                    <p className="text-slate-400 text-sm">Universal access for all your creative projects</p>
                                </div>
                                
                                <form onSubmit={handleUpload} className="space-y-8">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Display Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Master Logo Pack"
                                                value={newHeading}
                                                onChange={(e) => setNewHeading(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Purpose / Description</label>
                                            <textarea 
                                                placeholder="What is the work of this file? (e.g. Main brand assets for social media)"
                                                value={newDescription}
                                                onChange={(e) => setNewDescription(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-28 resize-none focus:bg-white/10 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Select Asset</label>
                                        <div className="relative group">
                                            <input 
                                                type="file" 
                                                onChange={(e) => setNewFile(e.target.files[0])}
                                                className="hidden" 
                                                id="vault-file-upload-modal"
                                            />
                                            <label 
                                                htmlFor="vault-file-upload-modal"
                                                className="w-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-10 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all cursor-pointer group"
                                            >
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform mb-4">
                                                    <IconUpload className="w-10 h-10 text-slate-500 group-hover:text-indigo-400" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-300">
                                                    {newFile ? newFile.name : 'Choose a file'}
                                                </span>
                                                <span className="text-[10px] text-slate-600 mt-2">Up to 100MB • Images, Videos, PDF, DOCX</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button 
                                            type="submit"
                                            disabled={!newFile || uploading}
                                            className="w-full flex items-center justify-center gap-4 py-5 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg active:scale-[0.98]"
                                        >
                                            {uploading ? (
                                                <>
                                                    <IconLoader2 className="w-6 h-6 animate-spin" />
                                                    Securing Asset...
                                                </>
                                            ) : (
                                                <>
                                                    <IconCheck className="w-6 h-6" />
                                                    Store in Vault
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowUploadModal(false)}
                                            className="w-full mt-4 py-4 text-slate-500 hover:text-slate-300 text-sm font-bold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Vault;
