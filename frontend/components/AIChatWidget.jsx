'use client';

import { useState } from 'react';
import { apiFetch } from '@/utils/api';

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! I am your AI Reporting Assistant. Ask me about your team\'s recent work, blockers, or to summarize the week!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInput('');
        setIsLoading(true);

        try {
            const data = await apiFetch('/chat', {
                method: 'POST',
                body: JSON.stringify({ message: userMessage })
            });
            setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error connecting to my brain.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* The Chat Window */}
            {isOpen && (
                <div className="mb-4 flex h-[440px] w-[340px] flex-col overflow-hidden rounded-2xl shadow-2xl border border-slate-200/50" style={{ background: '#ffffff' }}>
                    {/* Header */}
                    <div className="relative px-5 py-4 text-white" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.772.136a24.994 24.994 0 01-8.726 0l-.772-.136c-1.717-.293-2.3-2.379-1.067-3.61L10 15.5" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold">AI Assistant</h3>
                                <p className="text-[10px] text-blue-200/60">Powered by Gemini</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f8fafc' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'rounded-br-md text-white shadow-md'
                                        : 'rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-sm'
                                }`} style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #2563eb, #3b82f6)' } : {}}>
                                    {/* Using basic pre-wrap to handle basic formatting */}
                                    <span className="whitespace-pre-wrap">{msg.text}</span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="dot-pulse flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-5 py-3 shadow-sm">
                                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="border-t border-slate-100 bg-white p-3 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your team..."
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md disabled:shadow-none disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* The Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 ml-auto"
                style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                )}
            </button>
        </div>
    );
}