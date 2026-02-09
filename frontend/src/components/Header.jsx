import React from 'react';
import { Bot, LogOut } from 'lucide-react';
import GooeyNav from './GooeyNav';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
    const { isAuthenticated, user, logout, loading } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { label: "Home", href: "/" },
        { label: "My-Projects", href: "/my-projects" },
        { label: "Support", href: "/support" },
        { label: "Settings", href: "/settings" },
    ];

    const location = useLocation();

    const getActiveIndex = () => {
        const path = location.pathname;
        if (path === '/') return 0;
        if (path.startsWith('/my-projects')) return 1;
        if (path.startsWith('/support')) return 2;
        if (path.startsWith('/settings')) return 3;
        return 0;
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Don't render anything while loading auth state
    if (loading) {
        return (
            <header className="flex justify-between items-center p-6 lg:px-12 backdrop-blur-[2px] fixed top-0 w-full z-50 border-b border-white/5">
                <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer">
                    <img src="/favicon.png" alt="Logo" className="w-10 h-10 rounded-lg shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)] border border-indigo-500/20" />
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">creAItr.</span>
                </Link>
                <div className="w-32 h-10 bg-white/5 rounded-full animate-pulse"></div>
            </header>
        );
    }

    return (
        <header className="flex justify-between items-center p-6 lg:px-12 backdrop-blur-[2px] fixed top-0 w-full z-50 border-b border-white/5">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer">
                <img src="/favicon.png" alt="Logo" className="w-10 h-10 rounded-lg shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)] border border-indigo-500/20" />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">creAItr.</span>
            </Link>

            {/* Navigation - Conditional based on auth state */}
            {isAuthenticated ? (
                <div className="flex items-center gap-6">
                    <div className="relative" style={{ height: '40px' }}>
                        <GooeyNav
                            items={navItems}
                            particleCount={15}
                            particleDistances={[50, 5]}
                            particleR={50}
                            initialActiveIndex={getActiveIndex()}
                            animationTime={600}
                            colors={[1, 2, 3]}
                        />
                    </div>
                    {/* User Info & Logout */}
                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                        <span className="text-sm text-slate-400 hidden md:block">
                            {user?.email}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                            title="Logout"
                        >
                            <LogOut size={20} className="text-slate-400 group-hover:text-red-400 transition-colors" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <Link
                        to="/auth"
                        className="px-5 py-2 text-slate-300 hover:text-white transition-colors font-medium"
                    >
                        Login
                    </Link>
                    <Link
                        to="/auth"
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-indigo-500/25"
                    >
                        Sign Up
                    </Link>
                </div>
            )}
        </header>
    );
};

export default Header;
