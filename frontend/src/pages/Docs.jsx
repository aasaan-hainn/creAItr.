import React, { useState } from "react";
import Header from "../components/Header";
import { SparklesCore } from "../components/SparklesCore";
import {
  Book,
  Cpu,
  Layout,
  Shield,
  Zap,
  ChevronRight,
  Search,
  Terminal,
  Code2,
  Palette,
  Video,
  FileEdit,
  MousePointer2,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe,
  Database,
  LineChart,
  Calendar as CalendarIcon,
  Archive,
  TrendingUp,
  UserCircle,
  CreditCard,
  History,
  Settings
} from "lucide-react";

const DocSection = ({ id, title, icon: Icon, children }) => (
  <section id={id} className="mb-20 scroll-mt-32">
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_20px_-5px_rgba(99,102,241,0.2)]">
        <Icon className="w-7 h-7 text-indigo-400" />
      </div>
      <h2 className="text-4xl font-bold text-white tracking-tight">{title}</h2>
    </div>
    <div className="space-y-8 text-slate-400 leading-relaxed text-lg">
      {children}
    </div>
  </section>
);

const FeatureCard = ({ title, description, icon: Icon }) => (
  <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all duration-500 group relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <Icon className="w-10 h-10 text-indigo-400 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500" />
    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
      {title}
    </h3>
    <p className="text-slate-400 text-base leading-relaxed">{description}</p>
  </div>
);

const Docs = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const sidebarItems = [
    { id: "introduction", label: "Overview", icon: Book },
    { id: "account", label: "Platform & Account", icon: UserCircle },
    { id: "ai-architecture", label: "AI & Intelligence", icon: Cpu },
    { id: "creative-tools", label: "Creative Suite", icon: Palette },
    { id: "project-management", label: "Management", icon: Layout },
    { id: "security", label: "Security & Privacy", icon: Shield },
    { id: "api", label: "Developer API", icon: Terminal },
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans antialiased">
      <Header />

      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-black to-black opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/10 via-black to-black opacity-40" />
        <div className="w-full h-full absolute top-0 left-0">
          <SparklesCore
            id="tsparticlesdocs"
            background="transparent"
            minSize={0.4}
            maxSize={1.2}
            particleDensity={40}
            className="w-full h-full"
            particleColor="#818cf8"
          />
        </div>
      </div>

      <div className="relative z-10 flex max-w-[90rem] mx-auto pt-32 px-6 lg:px-12">
          {/* Fixed Sidebar */}
          <aside className="hidden lg:block w-72 h-fit max-h-[calc(100vh-10rem)] sticky top-32 overflow-y-auto pr-10 border-r border-white/5 custom-scrollbar pb-10">
              <div className="relative mb-10 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                      type="text" 
                      placeholder="Quick search..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.08] transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>

              <nav className="space-y-2">
                  {sidebarItems.map((item) => (
                      <a
                          key={item.id}
                          href={`#${item.id}`}
                          className="flex items-center gap-4 px-5 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group relative overflow-hidden"
                      >
                          <item.icon className="w-5 h-5 group-hover:text-indigo-400 transition-colors shrink-0" />
                          <span className="text-[15px] font-medium tracking-wide">{item.label}</span>
                          <ChevronRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </a>
                  ))}
              </nav>

              <div className="mt-12 p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      v1.2.4 Ready
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                      Latest update includes optimized RAG processing and Kanban drag performance.
                  </p>
              </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 lg:pl-20 pb-60 max-w-4xl">
          <DocSection
            id="introduction"
            title="Digital Intelligence for Human Creativity"
            icon={Book}
          >
            <p className="text-xl text-slate-300 leading-relaxed font-light">
              <span className="text-white font-bold tracking-tight">
                creAItr.
              </span>{" "}
              is not just a platform; it's an immersive ecosystem where advanced
              AI models converge with professional-grade creative tools. Our
              mission is to eliminate the friction between thought and
              production.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <FeatureCard
                icon={Zap}
                title="Zero Latency"
                description="Stream responses instantly using our custom-tuned creAItr AI pipeline."
              />
              <FeatureCard
                icon={Layers}
                title="Deep Context"
                description="Your documents, projects, and ideas are indexed in a local vector space."
              />
            </div>
          </DocSection>

          <DocSection id="account" title="Platform & Account" icon={UserCircle}>
            <p className="text-slate-300">
              creAItr. provides a secure and personalized experience through an advanced account management system.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                <Lock className="w-6 h-6 text-indigo-400 mb-4" />
                <h4 className="text-white font-bold mb-2">Secure Authentication</h4>
                <p className="text-sm text-slate-500">Industry-standard JWT tokens and Bcrypt hashing ensure your data stays protected from unauthorized access.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                <CreditCard className="w-6 h-6 text-indigo-400 mb-4" />
                <h4 className="text-white font-bold mb-2">Credits & Usage</h4>
                <p className="text-sm text-slate-500">Track your AI usage in real-time. Every generation and analysis is accounted for within your monthly credit allowance.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                <History className="w-6 h-6 text-indigo-400 mb-4" />
                <h4 className="text-white font-bold mb-2">Global History</h4>
                <p className="text-sm text-slate-500">Access your past conversations and project drafts across all devices through our persistent storage layer.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                <Settings className="w-6 h-6 text-indigo-400 mb-4" />
                <h4 className="text-white font-bold mb-2">Personalization</h4>
                <p className="text-sm text-slate-500">Customize your workspace theme, notification settings, and AI personality through the Settings dashboard.</p>
              </div>
            </div>
          </DocSection>

          <DocSection id="ai-architecture" title="AI & Intelligence" icon={Cpu}>
            <p className="text-slate-300">
              Our architecture separates raw compute from local knowledge,
              ensuring data privacy while maintaining state-of-the-art
              performance.
            </p>

            <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 my-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px]" />
              <h4 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <Database className="w-6 h-6 text-indigo-400" />
                Intelligence Pipeline
              </h4>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-1.5 h-auto bg-indigo-500/40 rounded-full" />
                  <div>
                    <h5 className="text-white font-bold mb-1 font-mono text-sm tracking-widest uppercase">
                      creAItr AI Reasoning
                    </h5>
                    <p className="text-slate-400 text-base">
                      The core reasoning engine. Unlike standard LLMs, creAItr. displays the AI's internal reasoning process for transparency.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-1.5 h-auto bg-purple-500/40 rounded-full" />
                  <div>
                    <h5 className="text-white font-bold mb-1 font-mono text-sm tracking-widest uppercase">
                      Local RAG (ChromaDB)
                    </h5>
                    <p className="text-slate-400 text-base">
                      Your files stay yours. We index PDFs and News feeds into a local vector database for semantic search and retrieval.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-1.5 h-auto bg-orange-500/40 rounded-full" />
                  <div>
                    <h5 className="text-white font-bold mb-1 font-mono text-sm tracking-widest uppercase">
                      Trend Spotter AI
                    </h5>
                    <p className="text-slate-400 text-base">
                      A specialized agent that analyzes global news and social signals to identify high-velocity creative opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DocSection>

          <DocSection
            id="creative-tools"
            title="Professional Creative Suite"
            icon={Palette}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:border-indigo-500/20 transition-all group">
                <Video className="w-10 h-10 text-indigo-400 mb-6 group-hover:scale-110 transition-transform" />
                <h5 className="text-2xl font-bold text-white mb-3">
                  Cinematic Editor
                </h5>
                <p className="text-slate-400 text-base mb-6 leading-relaxed">
                  Integrated Cloudinary assets for professional video processing and secure cloud storage.
                </p>
              </div>
              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:border-purple-500/20 transition-all group">
                <MousePointer2 className="w-10 h-10 text-purple-400 mb-6 group-hover:scale-110 transition-transform" />
                <h5 className="text-2xl font-bold text-white mb-3">
                  Neural Canvas
                </h5>
                <p className="text-slate-400 text-base mb-6 leading-relaxed">
                  Excalidraw-powered virtual whiteboard for wireframing, diagramming, and freehand sketching.
                </p>
              </div>
              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:border-cyan-500/20 transition-all group">
                <FileEdit className="w-10 h-10 text-cyan-400 mb-6 group-hover:scale-110 transition-transform" />
                <h5 className="text-2xl font-bold text-white mb-3">
                  Writing Studio
                </h5>
                <p className="text-slate-400 text-base mb-6 leading-relaxed">
                  Advanced rich text editor with AI drafting, Markdown support, and real-time word analysis.
                </p>
              </div>
              <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:border-orange-500/20 transition-all group">
                <Archive className="w-10 h-10 text-orange-400 mb-6 group-hover:scale-110 transition-transform" />
                <h5 className="text-2xl font-bold text-white mb-3">
                  Asset Vault
                </h5>
                <p className="text-slate-400 text-base mb-6 leading-relaxed">
                  Central repository for all project assets. Share images, videos, and documents across different tools.
                </p>
              </div>
            </div>
          </DocSection>

          <DocSection
            id="project-management"
            title="Advanced Management"
            icon={Layout}
          >
            <p className="text-slate-300">
              Turn chaos into clarity with our integrated project management and analytics framework.
            </p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-indigo-500/30 transition-all">
                <Layout className="w-8 h-8 text-indigo-400 mb-4" />
                <h5 className="text-xl font-bold text-white mb-2">Global Kanban</h5>
                <p className="text-sm text-slate-500">Manage all your project tasks in one unified drag-and-drop board. Track progress across multiple workstreams simultaneously.</p>
              </div>
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-purple-500/30 transition-all">
                <CalendarIcon className="w-8 h-8 text-purple-400 mb-4" />
                <h5 className="text-xl font-bold text-white mb-2">Content Calendar</h5>
                <p className="text-sm text-slate-500">Plan your production schedule. Sync task deadlines with a visual calendar view for better time management.</p>
              </div>
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-cyan-500/30 transition-all">
                <LineChart className="w-8 h-8 text-cyan-400 mb-4" />
                <h5 className="text-xl font-bold text-white mb-2">YouTube Intelligence</h5>
                <p className="text-sm text-slate-500">Deep integration with YouTube API for real-time channel stats, growth projections, and performance snapshots.</p>
              </div>
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-orange-500/30 transition-all">
                <TrendingUp className="w-8 h-8 text-orange-400 mb-4" />
                <h5 className="text-xl font-bold text-white mb-2">Velocity Tracking</h5>
                <p className="text-sm text-slate-500">Monitor your project completion speed and resource allocation with dynamic charts and progress bars.</p>
              </div>
            </div>
          </DocSection>

          <DocSection id="security" title="Iron-Clad Security" icon={Shield}>
            <div className="p-10 rounded-[3rem] bg-gradient-to-br from-indigo-500/5 to-transparent border border-indigo-500/10 relative overflow-hidden">
              <Lock className="w-16 h-16 text-indigo-500/10 absolute -top-4 -right-4" />
              <p className="text-slate-300 text-lg italic font-light mb-8">
                "We built creAItr. on the principle of data sovereignty. Your
                creative intellectual property should never be a training set
                for someone else's model."
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h6 className="text-white font-bold text-sm mb-2 uppercase tracking-widest">
                    Auth Gateway
                  </h6>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    JWT-secured sessions with bcrypt salted hashing.
                    Multi-layered token validation.
                  </p>
                </div>
                <div>
                  <h6 className="text-white font-bold text-sm mb-2 uppercase tracking-widest">
                    Encryption
                  </h6>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    AES-256 encryption for data at rest. Secure TLS/SSL tunnels
                    for all API traffic.
                  </p>
                </div>
              </div>
            </div>
          </DocSection>

          <DocSection id="api" title="Developer API" icon={Terminal}>
            <p className="text-slate-300 mb-8">
              Integrate creAItr.'s intelligence into your own workflows via our
              robust REST interface.
            </p>
            <div className="bg-[#0f1115] rounded-3xl p-8 font-mono text-[13px] border border-white/10 shadow-2xl relative">
              <div className="flex gap-2 absolute top-6 right-8">
                <div className="w-3 h-3 rounded-full bg-red-500/30" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/30" />
                <div className="w-3 h-3 rounded-full bg-green-500/30" />
              </div>
              <p className="text-slate-500 mb-6">
                // Fetch active project workspace
              </p>
              <div className="space-y-1">
                <p className="text-indigo-400">
                  GET{" "}
                  <span className="text-white">
                    /api/projects/:id/workspace
                  </span>
                </p>
                <p className="text-slate-400 flex gap-4">
                  <span className="text-slate-600">Authorization:</span> Bearer
                  &lt;jwt_token&gt;
                </p>
              </div>
              <p className="text-slate-500 mt-10 mb-6">
                // Stream AI reasoning & response
              </p>
              <div className="space-y-1">
                <p className="text-indigo-400">
                  POST <span className="text-white">/api/chat/stream</span>
                </p>
                <p className="text-slate-600">{`{ "message": "Analyze my local documents", "context_id": "proj_01" }`}</p>
              </div>
            </div>
          </DocSection>
        </main>
      </div>

      <footer className="relative z-10 py-16 border-t border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="Logo"
              className="w-8 h-8 grayscale opacity-50"
            />
            <span className="text-xl font-bold tracking-tighter text-slate-500 uppercase">
              creAItr.
            </span>
          </div>
          <p className="text-slate-500 text-xs tracking-widest uppercase">
            &copy; {new Date().getFullYear()} creAItr.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Docs;
