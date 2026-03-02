import React, { useState } from 'react';
import Header from '../components/Header';
import { SparklesCore } from '../components/SparklesCore';
import { ChevronDown, ChevronUp, Mail, MessageCircle, FileText, HelpCircle } from 'lucide-react';
import { CardSpotlight } from '../components/ui/card-spotlight';

const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
                <span className="font-semibold text-slate-200">{question}</span>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-indigo-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
            </button>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="px-6 pb-6 pt-2 text-slate-400 leading-relaxed border-t border-white/5">
                    {answer}
                </div>
            </div>
        </div>
    );
};

const ContactCard = ({ icon: Icon, title, description, action, link }) => (
    <CardSpotlight className="p-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md group h-full flex flex-col" color="#818cf8">
        <div className="relative z-20 flex-1 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                <Icon className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm mb-6">{description}</p>
            <a 
                href={link}
                className="mt-auto px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-white transition-all text-sm font-medium text-slate-300"
            >
                {action}
            </a>
        </div>
    </CardSpotlight>
);

const Support = () => {
    const faqs = [
        {
            question: "How do I start a new project?",
            answer: "Navigate to the 'My Projects' page and click on the 'New Project' button in the sidebar. Give your project a name, and you're ready to start creating with our AI tools."
        },
        {
            question: "Is my data private?",
            answer: "Yes, absolutely. We prioritize privacy. Your data is processed locally where possible, and any cloud processing is done via secure, private channels. We do not use your data to train our public models."
        },
        {
            question: "How does the AI credits system work?",
            answer: "Each generation consumes credits based on the complexity of the task. You receive a monthly allowance of credits with your subscription. You can view your usage in the Settings page."
        },
        {
            question: "Can I export my work?",
            answer: "Yes! You can export your writings as Markdown, your images as PNG/JPG, and your diagrams as SVG or PNG files directly from the tool interface."
        },
        {
            question: "What specific AI models do you use?",
            answer: "We utilize state-of-the-art large language models for text generation and coding tasks, ensuring superior reasoning capabilities. For image and visual content generation, we use high-performance, custom-tuned generative models."
        }
    ];

    return (
        <div className="relative min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
            <Header />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />
                <div className="w-full h-full absolute top-0 left-0">
                   <SparklesCore
                        id="tsparticlesfullpage"
                        background="transparent"
                        minSize={0.6}
                        maxSize={1.4}
                        particleDensity={50}
                        className="w-full h-full"
                        particleColor="#FFFFFF"
                    />
                </div>
            </div>

            <main className="relative z-10 pt-32 pb-20 px-4 md:px-6 max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500 mb-6">
                        How can we help?
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Find answers to common questions or get in touch with our support team. We're here to ensure your experience is seamless.
                    </p>
                </div>

                {/* Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    <ContactCard
                        icon={MessageCircle}
                        title="Live Chat"
                        description="Chat with our AI assistant for instant answers to technical questions."
                        action="Start Chat"
                        link="/chat"
                    />
                    <ContactCard
                        icon={Mail}
                        title="Email Support"
                        description="For billing inquiries or complex issues, reach out to our human team."
                        action="support@creaitr.com"
                        link="mailto:support@creaitr.com"
                    />
                    <ContactCard
                        icon={FileText}
                        title="Documentation"
                        description="Browse detailed guides and API references for advanced usage."
                        action="View Docs"
                        link="#"
                    />
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-8 justify-center md:justify-start">
                        <HelpCircle className="w-6 h-6 text-indigo-400" />
                        <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
                    </div>
                    
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <FaqItem key={index} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </div>
            </main>

            <footer className="relative z-10 py-8 text-center text-slate-600 border-t border-white/5 bg-black/40 backdrop-blur-md">
                <p>&copy; {new Date().getFullYear()} creAItr. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Support;
