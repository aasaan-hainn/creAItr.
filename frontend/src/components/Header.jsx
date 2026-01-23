import React from 'react';
import { Bot } from 'lucide-react';
import GooeyNav from './GooeyNav';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
    const navItems = [
        { label: "Home", href: "/" },
        { label: "My-Projects", href: "/my-projects" },
        { label: "Support", href: "#" },
        { label: "Settings", href: "#" },
    ];

    const location = useLocation();

    const getActiveIndex = () => {
        const path = location.pathname;
        if (path === '/') return 0;
        if (path.startsWith('/my-projects')) return 1;
        return 0;
    };

    return (
        <header className="flex justify-between items-center p-6 lg:px-12 backdrop-blur-[2px] fixed top-0 w-full z-50 border-b border-white/5">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer">
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-2 rounded-lg backdrop-blur-sm border border-indigo-500/20 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]">
                    <Bot size={28} className="text-indigo-400" />
                </div>
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Creaty</span>
            </Link>

            {/* Navigation */}
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
        </header>
    );
};

export default Header;
