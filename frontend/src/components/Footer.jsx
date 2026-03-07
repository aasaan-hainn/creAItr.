import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Youtube, Instagram, Github, Mail, ArrowUpRight } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerSections = [
        {
            title: "Product",
            links: [
                { label: "Features", href: "/#features" },
                { label: "Trends", href: "/trends" },
                { label: "Calendar", href: "/calendar" },
                { label: "Projects", href: "/my-projects" },
            ]
        },
        {
            title: "Support",
            links: [
                { label: "Help Center", href: "/support" },
                { label: "Community", href: "/support" },
                { label: "Contact Us", href: "/support" },
                { label: "Status", href: "/support" },
            ]
        },
        {
            title: "Company",
            links: [
                { label: "About Us", href: "/" },
                { label: "Careers", href: "/" },
                { label: "Privacy", href: "/" },
                { label: "Terms", href: "/" },
            ]
        }
    ];

    const socialLinks = [
        { icon: <Twitter size={18} />, href: "#", label: "Twitter" },
        { icon: <Youtube size={18} />, href: "#", label: "YouTube" },
        { icon: <Instagram size={18} />, href: "#", label: "Instagram" },
        { icon: <Github size={18} />, href: "#", label: "GitHub" },
    ];

    return (
        <footer className="relative bg-black border-t border-white/5 pt-16 pb-8 px-6 lg:px-12 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent shadow-[0_0_50px_2px_rgba(99,102,241,0.3)]" />
            
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
                {/* Brand Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
                        <img src="/favicon.png" alt="Logo" className="w-10 h-10 rounded-lg border border-white/10" />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">creAItr.</span>
                    </Link>
                    <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                        Empowering creators with AI-driven insights, seamless scheduling, and advanced analytics. Your all-in-one creative workspace.
                    </p>
                    <div className="flex items-center gap-4">
                        {socialLinks.map((social, idx) => (
                            <a
                                key={idx}
                                href={social.href}
                                aria-label={social.label}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300"
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Links Sections */}
                {footerSections.map((section, idx) => (
                    <div key={idx} className="space-y-6">
                        <h4 className="text-white font-semibold text-sm uppercase tracking-wider">{section.title}</h4>
                        <ul className="space-y-4">
                            {section.links.map((link, linkIdx) => (
                                <li key={linkIdx}>
                                    <Link 
                                        to={link.href} 
                                        className="text-slate-400 hover:text-indigo-400 text-sm transition-colors flex items-center group gap-1"
                                    >
                                        {link.label}
                                        <ArrowUpRight size={12} className="opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-slate-500 text-xs">
                    © {currentYear} creAItr. All rights reserved. Built for the future of creation.
                </p>
                <div className="flex items-center gap-8 text-xs text-slate-500">
                    <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-slate-300 transition-colors flex items-center gap-1">
                        <Mail size={12} />
                        hello@creaitr.ai
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
