import GooeyNav from '../components/GooeyNav';
import Header from '../components/Header';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Hyperspeed, { hyperspeedPresets } from '../components/Hyperspeed';
import { Bot, Zap, Shield, Globe, Cpu, Radio, ArrowRight, Sparkles } from 'lucide-react';
import { SparklesCore } from '../components/SparklesCore';
import { useAuth } from '../context/AuthContext';

import { CardSpotlight } from '../components/ui/card-spotlight';

const FeatureCard = ({ icon: Icon, title, description }) => (
    <CardSpotlight className="p-6 rounded-2xl border border-white/10 backdrop-blur-md hover:scale-105 transition-all duration-300 group relative z-10" color="#6366f1">
        <div className="relative z-20">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-colors">
                <Icon className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
        </div>
    </CardSpotlight>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [prompt, setPrompt] = useState("");

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleStartChat = (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        
        localStorage.setItem("pending_chat_message", prompt);
        
        if (isAuthenticated) {
            navigate("/chat");
        } else {
            navigate("/auth");
        }
    };

    const navItems = [
        { label: "My-Projects", href: "/my-projects" },
        { label: "Support", href: "#" },
        { label: "Settings", href: "#" },
    ];

    return (
        <div className="relative w-full min-h-screen bg-black text-white selection:bg-indigo-500/30">
            {/* Fixed Background */}
            <div className="fixed -top-[20%] left-0 right-0 bottom-0 z-0">
                <Hyperspeed effectOptions={hyperspeedPresets.one} />
            </div>

            {/* Scrollable Content Overlay */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <Header />

                <main className="flex-1">
                    {/* Hero Section */}
                    <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 relative overflow-hidden">


                        <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
                            <h1 className="text-7xl md:text-9xl font-bold text-white relative z-20 mb-4 tracking-tighter">
                                Creaty
                            </h1>
                            <div className="w-[40rem] h-40 relative">
                                {/* Gradients */}
                                <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
                                <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
                                <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent h-[5px] w-1/4 blur-sm" />
                                <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent h-px w-1/4" />

                                {/* Core component */}
                                <SparklesCore
                                    background="transparent"
                                    minSize={0.4}
                                    maxSize={1}
                                    particleDensity={1200}
                                    className="w-full h-full [mask-image:radial-gradient(350px_200px_at_top,white,transparent)]"
                                    particleColor="#FFFFFF"
                                />

                                {/* Radial Gradient to prevent sharp edges */}

                            </div>
                        </div>

                        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mb-12 leading-relaxed font-light mt-[-8rem] relative z-20">
                            Stop Drafting. Start Dominating.
                        </p>

                        <div className="flex flex-col items-center w-full max-w-xl mx-auto mt-8 z-50">
                            <form onSubmit={handleStartChat} className="w-full relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative flex items-center bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
                                    <div className="pl-4 text-indigo-400">
                                        <Sparkles size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Ask anything... (e.g., 'Draft a marketing plan')"
                                        className="w-full bg-transparent p-4 outline-none text-white placeholder-slate-500"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!prompt.trim()}
                                        className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </form>
                            
                            <div className="flex gap-4 mt-6">
                                <Link to="/chat" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                                    <Zap size={14} /> Skip to Dashboard
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="py-32 px-4 relative">

                        <div className="max-w-7xl mx-auto relative z-10">
                            <div className="text-center mb-20">
                                <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Creaty?</h2>
                                <p className="text-slate-400 max-w-2xl mx-auto">
                                    Built for performance, privacy, and precision. We combine the power of large language models with local retrieval augmented generation.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <FeatureCard
                                    icon={Bot}
                                    title="Qwen 2.5 Powered"
                                    description="Leveraging the massive 72B parameter model for unmatched reasoning and coding capabilities."
                                />
                                <FeatureCard
                                    icon={Globe}
                                    title="Real-time RAG"
                                    description="Instantly access and synthesize information from your local news database with semantic search."
                                />
                                <FeatureCard
                                    icon={Shield}
                                    title="Privacy First"
                                    description="Your data never leaves your infrastructure. All processing happens locally or on your private cloud."
                                />
                                <FeatureCard
                                    icon={Radio}
                                    title="Text-to-Speech"
                                    description="Listen to your briefing on the go with our integrated high-fidelity TTS engine."
                                />
                                <FeatureCard
                                    icon={Zap}
                                    title="Lightning Fast"
                                    description="Optimized for low-latency responses, ensuring you get answers at the speed of thought."
                                />
                                <FeatureCard
                                    icon={Cpu}
                                    title="Context Aware"
                                    description="Maintains deep conversation history to understand the nuances of your specific inquiries."
                                />
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="py-32 px-4 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-purple-900/10 z-0" />
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to dive in?</h2>
                            <p className="text-xl text-slate-400 mb-10">
                                Join the future of intelligence gathering today.
                            </p>
                            <Link to="/chat" className="inline-block px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full font-bold text-xl text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                                Get Started Now
                            </Link>
                        </div>
                    </section>
                </main>

                <footer className="p-8 text-center text-slate-600 border-t border-white/5 bg-black/80 backdrop-blur-md">
                    <div className="flex justify-center gap-6 mb-4">
                        <a href="#" className="hover:text-purple-400 transition-colors">Twitter</a>
                        <a href="#" className="hover:text-purple-400 transition-colors">GitHub</a>
                        <a href="#" className="hover:text-purple-400 transition-colors">Discord</a>
                    </div>
                    <p>&copy; {new Date().getFullYear()} Creaty. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
