import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { SparklesCore } from '../components/SparklesCore';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    User,
    KeyRound,
    Youtube,
    Palette,
    Shield,
    LogOut,
    Trash2,
    Check,
    AlertTriangle,
    ExternalLink,
    Moon,
    Sun,
    Download,
    ChevronRight
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Settings navigation items
const settingsSections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: KeyRound },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
];

// Sidebar component
const SettingsSidebar = ({ activeSection, setActiveSection }) => (
    <div className="w-full md:w-64 shrink-0">
        <nav className="space-y-1">
            {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                            ? 'bg-indigo-500/20 text-white border border-indigo-500/30'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                            }`}
                    >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                        <span className="font-medium">{section.label}</span>
                        <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isActive ? 'rotate-90 text-indigo-400' : 'text-slate-600'}`} />
                    </button>
                );
            })}
        </nav>
    </div>
);

// Profile Section
const ProfileSection = ({ user, onUserUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        setFullName(user?.fullName || user?.name || '');
    }, [user]);

    const handleSave = async () => {
        if (!fullName.trim()) {
            setMessage({ type: 'error', text: 'Name cannot be empty' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName: fullName.trim() })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setIsEditing(false);
                // Update the user in AuthContext
                if (onUserUpdate && data.user) {
                    onUserUpdate(data.user);
                }
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFullName(user?.fullName || user?.name || '');
        setIsEditing(false);
        setMessage({ type: '', text: '' });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Profile</h2>
                <p className="text-slate-400">Manage your personal information</p>
            </div>

            <CardSpotlight className="p-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md" color="#818cf8">
                <div className="relative z-20 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        {user?.picture ? (
                            <img
                                src={user.picture}
                                alt="Profile"
                                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/30"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
                                {(user?.fullName || user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-semibold text-white">{user?.fullName || user?.name || 'User'}</h3>
                            <p className="text-slate-400 text-sm">{user?.email}</p>
                        </div>
                    </div>

                    {/* Success/Error Message */}
                    {message.text && (
                        <div className={`px-4 py-2 rounded-lg text-sm ${message.type === 'success'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Info Fields */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div>
                            <label className="text-sm text-slate-500 mb-1 block">Full Name</label>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-indigo-500/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                        placeholder="Enter your full name"
                                        maxLength={100}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {saving ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                            Save
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={saving}
                                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-between">
                                    <span>{user?.fullName || user?.name || 'Not set'}</span>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        Edit
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 mb-1 block">Email Address</label>
                            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-between">
                                <span>{user?.email}</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                    Verified
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 mb-1 block">Account Type</label>
                            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white flex items-center gap-2">
                                {user?.provider === 'google' && (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                )}
                                {user?.provider === 'google' ? 'Google Account' : 'Email & Password'}
                            </div>
                        </div>
                    </div>
                </div>
            </CardSpotlight>
        </div>
    );
};

// Account Section
const AccountSection = ({ user, onLogout }) => {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Account</h2>
                <p className="text-slate-400">Manage your account settings and security</p>
            </div>

            {/* Password Section - Only for non-Google users */}
            {user?.provider !== 'google' && (
                <CardSpotlight className="p-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md" color="#818cf8">
                    <div className="relative z-20">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-indigo-400" />
                            Password
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Change your password to keep your account secure.
                        </p>
                        <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all">
                            Change Password
                        </button>
                    </div>
                </CardSpotlight>
            )}

            {/* Sessions */}
            <CardSpotlight className="p-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md" color="#818cf8">
                <div className="relative z-20">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <LogOut className="w-5 h-5 text-indigo-400" />
                        Sessions
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">
                        Log out from your current session or all devices.
                    </p>
                    {!showLogoutConfirm ? (
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                        >
                            Log Out
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                            >
                                Confirm Logout
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </CardSpotlight>
        </div>
    );
};

// YouTube Section
const YouTubeSection = () => {
    const [youtubeChannel, setYoutubeChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [channelInput, setChannelInput] = useState('');

    useEffect(() => {
        fetchYouTubeChannel();
    }, []);

    const fetchYouTubeChannel = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/youtube/channel`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setYoutubeChannel(data.channel_id);
            }
        } catch (error) {
            console.error('Failed to fetch YouTube channel:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveChannel = async () => {
        if (!channelInput.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/youtube/channel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ channel_id: channelInput })
            });
            if (response.ok) {
                setYoutubeChannel(channelInput);
                setChannelInput('');
            }
        } catch (error) {
            console.error('Failed to save YouTube channel:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">YouTube Integration</h2>
                <p className="text-slate-400">Connect your YouTube channel to track analytics</p>
            </div>

            <CardSpotlight className="p-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md" color="#ff0000">
                <div className="relative z-20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <Youtube className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">YouTube Channel</h3>
                            <p className="text-sm text-slate-400">
                                {youtubeChannel ? 'Channel connected' : 'No channel connected'}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
                    ) : youtubeChannel ? (
                        <div className="space-y-4">
                            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                <span className="text-white font-mono text-sm">{youtubeChannel}</span>
                                <a
                                    href={`https://youtube.com/channel/${youtubeChannel}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                            <p className="text-xs text-slate-500">
                                View your analytics in the My Projects dashboard.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={channelInput}
                                    onChange={(e) => setChannelInput(e.target.value)}
                                    placeholder="Enter your YouTube Channel ID"
                                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
                                />
                                <button
                                    onClick={saveChannel}
                                    disabled={!channelInput.trim()}
                                    className="px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500">
                                Find your Channel ID in YouTube Studio under Settings &gt; Channel &gt; Advanced settings.
                            </p>
                        </div>
                    )}
                </div>
            </CardSpotlight>
        </div>
    );
};

// Appearance Section
const AppearanceSection = () => {
    const [theme, setTheme] = useState('dark');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Appearance</h2>
                <p className="text-slate-400">Customize how creAItr looks for you</p>
            </div>

            <CardSpotlight className="p-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md" color="#818cf8">
                <div className="relative z-20">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-indigo-400" />
                        Theme
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setTheme('dark')}
                            className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${theme === 'dark'
                                ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <Moon className="w-8 h-8" />
                            <span className="font-medium">Dark</span>
                            {theme === 'dark' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300">Active</span>
                            )}
                        </button>
                        <button
                            onClick={() => setTheme('light')}
                            disabled
                            className="p-4 rounded-xl border bg-white/5 border-white/10 text-slate-600 flex flex-col items-center gap-3 cursor-not-allowed opacity-50"
                        >
                            <Sun className="w-8 h-8" />
                            <span className="font-medium">Light</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-500">Coming Soon</span>
                        </button>
                    </div>
                </div>
            </CardSpotlight>
        </div>
    );
};

// Privacy Section
const PrivacySection = () => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Privacy & Data</h2>
                <p className="text-slate-400">Manage your data and privacy settings</p>
            </div>

            {/* Export Data */}
            <CardSpotlight className="p-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md" color="#818cf8">
                <div className="relative z-20">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-indigo-400" />
                        Export Your Data
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">
                        Download a copy of all your projects, chats, and settings.
                    </p>
                    <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Request Data Export
                    </button>
                </div>
            </CardSpotlight>

            {/* Delete Account */}
            <CardSpotlight className="p-6 rounded-2xl border border-red-500/20 bg-black/50 backdrop-blur-md" color="#ef4444">
                <div className="relative z-20">
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Danger Zone
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-red-400 text-sm font-medium">
                                Are you absolutely sure? This will permanently delete:
                            </p>
                            <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                                <li>All your projects and their contents</li>
                                <li>All chat histories</li>
                                <li>Your account and profile data</li>
                            </ul>
                            <div className="flex items-center gap-3 pt-2">
                                <button className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all">
                                    Yes, Delete Everything
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </CardSpotlight>
        </div>
    );
};

// Main Settings Component
const Settings = () => {
    const { user, logout, isAuthenticated, loading, updateUser } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('profile');

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/auth');
        }
    }, [isAuthenticated, loading, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleUserUpdate = (updatedUserData) => {
        updateUser(updatedUserData);
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'profile':
                return <ProfileSection user={user} onUserUpdate={handleUserUpdate} />;
            case 'account':
                return <AccountSection user={user} onLogout={handleLogout} />;
            case 'youtube':
                return <YouTubeSection />;
            case 'appearance':
                return <AppearanceSection />;
            case 'privacy':
                return <PrivacySection />;
            default:
                return <ProfileSection user={user} onUserUpdate={handleUserUpdate} />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
            <Header />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />
                <div className="w-full h-full absolute top-0 left-0">
                    <SparklesCore
                        id="tsparticlessettings"
                        background="transparent"
                        minSize={0.4}
                        maxSize={1}
                        particleDensity={30}
                        className="w-full h-full"
                        particleColor="#FFFFFF"
                    />
                </div>
            </div>

            <main className="relative z-10 pt-28 pb-20 px-4 md:px-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">
                        Settings
                    </h1>
                    <p className="text-slate-400">
                        Manage your account preferences and application settings
                    </p>
                </div>

                {/* Settings Layout */}
                <div className="flex flex-col md:flex-row gap-8">
                    <SettingsSidebar
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                    />
                    <div className="flex-1 min-w-0">
                        {renderSection()}
                    </div>
                </div>
            </main>

            <footer className="relative z-10 py-8 text-center text-slate-600 border-t border-white/5 bg-black/40 backdrop-blur-md">
                <p>&copy; {new Date().getFullYear()} creAItr. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Settings;
