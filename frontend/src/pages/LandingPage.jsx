
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Zap, Shield, BarChart, Rocket, Layers, Users, Activity, RefreshCcw, Workflow } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent)] selection:text-white overflow-x-hidden">

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[var(--bg-dark)]/80 backdrop-blur-md border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-white font-bold text-xl">
                            M
                        </div>
                        <span className="text-xl font-bold tracking-tight">MailMitra</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-muted)]">
                        <a href="#features" className="hover:text-[var(--accent)] transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-[var(--accent)] transition-colors">Pricing</a>
                        <Link to="/login" className="hover:text-[var(--accent)] transition-colors">Log in</Link>
                        <Link to="/register" className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-[var(--shadow-sm)]">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-semibold uppercase tracking-wide mb-6">
                            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
                            Enterprise SaaS Platform v2.0
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight">
                            The Intelligent <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--cta)]">SaaS</span> for Email Support.
                        </h1>
                        <p className="text-lg text-[var(--text-muted)] mb-8 leading-relaxed max-w-lg">
                            Automate your customer support with MailMitra's AI-driven SaaS. Triage, draft, and analyze emails in real-time, all from one unified dashboard.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-[var(--radius-md)] bg-[var(--cta)] text-white font-semibold hover:bg-[var(--cta-hover)] transition-all shadow-[var(--shadow-lg)] hover:shadow-[var(--cta)]/25 hover:-translate-y-1">
                                Start Free Trial <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-[var(--radius-md)] bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold border border-[var(--border)] hover:bg-[var(--border)]/50 transition-all">
                                Live Demo
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-[var(--accent)] to-[var(--cta)] opacity-20 blur-3xl rounded-full"></div>
                        <div className="relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl p-4 rotate-2 transform hover:rotate-0 transition-transform duration-500 overflow-hidden">
                            {/* Mock UI Header */}
                            <div className="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-2">
                                <div className="flex gap-2 items-center">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-mono ml-2">dashboard.mailmitra.com</div>
                                </div>
                                <div className="h-1.5 w-16 bg-[var(--bg-dark)] rounded-full"></div>
                            </div>

                            <div className="flex gap-4">
                                {/* Mock Sidebar */}
                                <div className="hidden sm:block w-12 space-y-2 pt-1 border-r border-[var(--border)] pr-2">
                                    <div className="h-6 w-8 rounded bg-[var(--accent)]/20 mb-4"></div>
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-6 w-8 rounded bg-[var(--bg-dark)]/50"></div>
                                    ))}
                                </div>

                                {/* Mock Main Content */}
                                <div className="flex-1 space-y-3">
                                    {/* Stats area */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="h-16 rounded bg-[var(--bg-dark)] p-2 border border-[var(--border)]">
                                            <div className="h-2 w-8 bg-[var(--accent)]/50 rounded mb-2"></div>
                                            <div className="h-4 w-6 bg-[var(--text-primary)] rounded"></div>
                                        </div>
                                        <div className="h-16 rounded bg-[var(--bg-dark)] p-2 border border-[var(--border)]">
                                            <div className="h-2 w-8 bg-orange-200 rounded mb-2"></div>
                                            <div className="h-4 w-6 bg-[var(--text-primary)] rounded"></div>
                                        </div>
                                        <div className="h-16 rounded bg-[var(--bg-dark)] p-2 border border-[var(--border)]">
                                            <div className="h-2 w-8 bg-green-200 rounded mb-2"></div>
                                            <div className="h-4 w-6 bg-[var(--text-primary)] rounded"></div>
                                        </div>
                                    </div>

                                    {/* Email List */}
                                    <div className="space-y-2 pt-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="p-2 w-full rounded border border-[var(--border)] bg-white flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[8px]">U{i}</div>
                                                <div className="flex-1">
                                                    <div className="h-2 w-20 bg-[var(--text-primary)]/80 rounded mb-1"></div>
                                                    <div className="h-1.5 w-32 bg-[var(--text-muted)]/30 rounded"></div>
                                                </div>
                                                <div className="px-1.5 py-0.5 rounded bg-green-100 text-[8px] text-green-700">AI Reply</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-[var(--bg-card)] relative">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent"></div>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">Complete Email Intelligence</h2>
                        <p className="text-[var(--text-muted)]">
                            From automated triage to sentiment analysis, MailMitra provides the SaaS tools you need to master your inbox.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Layers className="w-6 h-6 text-[var(--accent)]" />,
                                title: "Smart Clustering",
                                desc: "Automatically group thousands of similar queries into single actionable clusters. Spot outages instantly."
                            },
                            {
                                icon: <Users className="w-6 h-6 text-[var(--accent)]" />,
                                title: "Bulk AI Response",
                                desc: "Draft one response, send to hundreds. Our AI adapts the message for each user automatically."
                            },
                            {
                                icon: <Activity className="w-6 h-6 text-[var(--accent)]" />,
                                title: "Live Sentiment Map",
                                desc: "Track customer happiness (CSAT) in real-time with granular sentiment heatmaps."
                            },
                            {
                                icon: <RefreshCcw className="w-6 h-6 text-[var(--accent)]" />,
                                title: "Seamless Integration",
                                desc: "Connect with Gmail, Outlook, and custom IMAP servers instantly. setup takes less than 2 minutes."
                            },
                            {
                                icon: <Workflow className="w-6 h-6 text-[var(--accent)]" />,
                                title: "Workflow Automation",
                                desc: "Set custom rules for tagging, assigning, and prioritizing tickets based on AI intent detection."
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-dark)] hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-lg)] transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-[var(--text-muted)] leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>




            {/* Pricing Section */}
            <section id="pricing" className="py-24 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
                        <p className="text-[var(--text-muted)]">
                            Choose the perfect plan for your team. Switch or cancel at any time.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Starter",
                                price: "₹0",
                                desc: "Perfect for testing the waters.",
                                features: ["Up to 3 users", "Basic analytics", "24/7 Support", "1GB Storage"],
                                cta: "Start for Free",
                                primary: false
                            },
                            {
                                title: "Pro",
                                price: "₹2,499",
                                desc: "For growing teams and businesses.",
                                features: ["Up to 20 users", "Advanced analytics", "Priority Support", "100GB Storage", "Custom Integrations"],
                                cta: "Get Started",
                                primary: true
                            },
                            {
                                title: "Enterprise",
                                price: "₹8,499",
                                desc: "Maximum power for large scale.",
                                features: ["Unlimited users", "Custom reporting", "Dedicated Manager", "Unlimited Storage", "SLA & SSO"],
                                cta: "Contact Sales",
                                primary: false
                            }
                        ].map((plan, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`
                  relative p - 8 rounded - [var(--radius - lg)] border flex flex - col h - full
                  ${plan.primary
                                        ? 'border-[var(--accent)] bg-[var(--bg-card)] shadow-2xl z-10 scale-100 md:scale-105'
                                        : 'border-[var(--border)] bg-[var(--bg-dark)] shadow-sm hover:shadow-lg hover:border-[var(--border)]/80'
                                    }
transition - all duration - 300
    `}
                            >
                                {plan.primary && (
                                    <div className="absolute top-0 right-0 left-0 flex justify-center -mt-3">
                                        <span className="bg-[var(--accent)] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">Most Popular</span>
                                    </div>
                                )}
                                <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-[var(--text-muted)] text-sm">/month</span>
                                </div>
                                <p className="text-[var(--text-muted)] text-sm mb-6">{plan.desc}</p>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((item, j) => (
                                        <li key={j} className="flex items-start gap-3 text-sm">
                                            <Check className={`w - 5 h - 5 shrink - 0 ${plan.primary ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} `} />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className={`
w - full py - 3 rounded - [var(--radius - md)]font - semibold transition - all mt - auto
                  ${plan.primary
                                        ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-lg hover:shadow-[var(--accent)]/20'
                                        : 'bg-transparent border border-[var(--border)] hover:bg-[var(--border)]/50 text-[var(--text-primary)]'
                                    }
`}>
                                    {plan.cta}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto bg-gradient-to-r from-[var(--gray)] to-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 md:p-12 text-center shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--cta)]"></div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your workflow?</h2>
                    <p className="text-[var(--text-muted)] mb-8 max-w-lg mx-auto">
                        Join thousands of teams who have already switched to MailMitra. Start your free 14-day trial today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register" className="px-8 py-3 rounded-[var(--radius-md)] bg-[var(--cta)] text-white font-semibold hover:bg-[var(--cta-hover)] transition-colors shadow-lg">
                            Get Started Now
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-[var(--border)] bg-[var(--bg-dark)] text-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xs">M</div>
                        <span className="font-semibold text-[var(--text-primary)]">MailMitra</span>
                    </div>
                    <div className="flex gap-8 text-[var(--text-muted)]">
                        <a href="#" className="hover:text-[var(--accent)] transition-colors">Privacy</a>
                        <a href="#" className="hover:text-[var(--accent)] transition-colors">Terms</a>
                        <a href="#" className="hover:text-[var(--accent)] transition-colors">Contact</a>
                    </div>
                    <div className="text-[var(--text-muted)]">
                        © 2024 MailMitra Inc.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
