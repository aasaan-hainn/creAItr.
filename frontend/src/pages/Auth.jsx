import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BackgroundLines } from '../components/ui/background-lines';
import { useAuth } from '../context/AuthContext';

const SOCIAL_PLATFORMS = [
    { id: 'instagram', label: 'Instagram', icon: '📷' },
    { id: 'youtube', label: 'YouTube', icon: '🎬' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵' },
    { id: 'twitter', label: 'Twitter/X', icon: '𝕏' },
    { id: 'facebook', label: 'Facebook', icon: '📘' },
];

const Auth = () => {
    const navigate = useNavigate();
    const { login, register, isAuthenticated } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [socialAccounts, setSocialAccounts] = useState([]);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/my-projects');
        }
    }, [isAuthenticated, navigate]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const toggleSocialPlatform = (platformId) => {
        const exists = socialAccounts.find(acc => acc.platform === platformId);
        if (exists) {
            setSocialAccounts(socialAccounts.filter(acc => acc.platform !== platformId));
        } else {
            setSocialAccounts([...socialAccounts, { platform: platformId, handle: '' }]);
        }
    };

    const updateSocialHandle = (platformId, handle) => {
        setSocialAccounts(socialAccounts.map(acc =>
            acc.platform === platformId ? { ...acc, handle } : acc
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const result = await login(formData.email, formData.password);
                if (result.success) {
                    navigate('/my-projects');
                } else {
                    setError(result.error);
                }
            } else {
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }

                const result = await register({
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    socialAccounts: socialAccounts.filter(acc => acc.handle.trim() !== '')
                });

                if (result.success) {
                    navigate('/my-projects');
                } else {
                    setError(result.error);
                }
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setFormData({ email: '', password: '', confirmPassword: '' });
        setSocialAccounts([]);
        setError('');
    };

    return (
        <BackgroundLines className="flex items-center justify-center w-full min-h-screen bg-black overflow-hidden">
            <div className="relative z-20 w-full max-w-md px-4" style={{ perspective: '1000px' }}>
                <AnimatePresence mode="wait">
                    {isLogin ? (
                        <motion.div
                            key="login"
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* Login Card */}
                            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                                    <p className="text-slate-400 text-sm">Sign in to continue to your account</p>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                            placeholder="you@example.com"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                            placeholder="••••••••"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </button>
                                </form>

                                <div className="flex items-center my-6">
                                    <div className="flex-1 border-t border-white/10"></div>
                                    <span className="px-4 text-sm text-slate-500">or continue with</span>
                                    <div className="flex-1 border-t border-white/10"></div>
                                </div>

                                <button
                                    type="button"
                                    className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-3 transition-all duration-300"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="text-white font-medium">Sign in with Google</span>
                                </button>

                                <p className="text-center mt-6 text-slate-400 text-sm">
                                    Don't have an account?{' '}
                                    <button onClick={toggleForm} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                                        Sign up
                                    </button>
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="signup"
                            initial={{ rotateY: -90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: 90, opacity: 0 }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* Signup Card */}
                            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
                                <div className="text-center mb-6">
                                    <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                                    <p className="text-slate-400 text-sm">Join us and start your journey</p>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                            placeholder="you@example.com"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Social Media Multi-Select */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-3">
                                            Social Media Platforms
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {SOCIAL_PLATFORMS.map(platform => {
                                                const isSelected = socialAccounts.some(acc => acc.platform === platform.id);
                                                return (
                                                    <button
                                                        key={platform.id}
                                                        type="button"
                                                        onClick={() => toggleSocialPlatform(platform.id)}
                                                        disabled={loading}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${isSelected
                                                                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                                                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        <span>{platform.icon}</span>
                                                        <span>{platform.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Handle inputs for selected platforms */}
                                    <AnimatePresence>
                                        {socialAccounts.length > 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-3 overflow-hidden"
                                            >
                                                {socialAccounts.map(account => {
                                                    const platform = SOCIAL_PLATFORMS.find(p => p.id === account.platform);
                                                    return (
                                                        <div key={account.platform}>
                                                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                                                {platform?.icon} {platform?.label} Handle
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                                                                <input
                                                                    type="text"
                                                                    value={account.handle}
                                                                    onChange={(e) => updateSocialHandle(account.platform, e.target.value)}
                                                                    disabled={loading}
                                                                    className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                                                                    placeholder={`your_${account.platform}_username`}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                            placeholder="••••••••"
                                            required
                                            disabled={loading}
                                            minLength={6}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                            placeholder="••••••••"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Creating Account...' : 'Create Account'}
                                    </button>
                                </form>

                                <div className="flex items-center my-5">
                                    <div className="flex-1 border-t border-white/10"></div>
                                    <span className="px-4 text-sm text-slate-500">or continue with</span>
                                    <div className="flex-1 border-t border-white/10"></div>
                                </div>

                                <button
                                    type="button"
                                    className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-3 transition-all duration-300"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="text-white font-medium">Sign up with Google</span>
                                </button>

                                <p className="text-center mt-5 text-slate-400 text-sm">
                                    Already have an account?{' '}
                                    <button onClick={toggleForm} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                                        Login
                                    </button>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </BackgroundLines>
    );
};

export default Auth;
