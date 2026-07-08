// frontend/src/app/login/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            // Save token and user info to local storage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === 'Manager') {
                router.push('/dashboard/manager');
            } else {
                router.push('/dashboard/member');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)' }}>
            {/* Decorative Background Shapes */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}></div>
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }}></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Glass Card */}
                <div className="rounded-2xl border border-white/10 p-8 shadow-2xl" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)' }}>

                    {/* Brand Header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white">WeeklyReport</h1>
                        <p className="mt-1 text-sm text-blue-200/70">Sign in to your workspace</p>
                    </div>

                    {error && (
                        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-blue-200/60">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-blue-200/30 focus:border-blue-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-blue-200/60">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-blue-200/30 focus:border-blue-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-lg py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
                            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                        >
                            Sign In
                        </button>
                    </form>

                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-blue-200/30">
                    Weekly Report Management System
                </p>
            </div>
        </div>
    );
}