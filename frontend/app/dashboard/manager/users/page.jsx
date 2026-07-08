'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function ManageUsers() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Form State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleName, setRoleName] = useState('Team Member');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) return router.push('/login');
        if (JSON.parse(storedUser).role !== 'Manager') return router.push('/dashboard/member');

        fetchUsers();
    }, [router]);

    const fetchUsers = async () => {
        try {
            const data = await apiFetch('/users', { method: 'GET' });
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Creating user...' });

        try {
            const newUser = await apiFetch('/users', {
                method: 'POST',
                body: JSON.stringify({ fullName, email, password, roleName }),
            });

            // Update the list immediately
            setUsers([newUser.user, ...users]);

            // Reset form and close modal
            setFullName('');
            setEmail('');
            setPassword('');
            setRoleName('Team Member');
            setStatus({ type: '', message: '' });
            setIsModalOpen(false);

        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setStatus({ type: '', message: '' });
    };

    if (loading) return (
        <div className="flex h-full items-center justify-center">
            <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <p className="text-sm text-slate-500">Loading users...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8">
            {/* --- Header --- */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                        <p className="text-sm text-slate-500">View and manage team members</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Add New User
                </button>
            </div>

            {/* --- Full Width Users List Table --- */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Name</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Email</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Role</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Joined Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-blue-50/30">
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                                            {u.fullName ? u.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                                        </div>
                                        <span className="font-semibold text-slate-800">{u.fullName}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                                <td className="px-5 py-3.5">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role?.name === 'Manager' ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-600/10' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10'}`}>
                                        {u.role?.name}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Create User Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">

                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Add New User</h3>
                            </div>
                            <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {status.message && (
                            <div className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${status.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                                {status.message}
                            </div>
                        )}

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Full Name</label>
                                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Email Address</label>
                                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Temporary Password</label>
                                <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Role</label>
                                <select value={roleName} onChange={e => setRoleName(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
                                    <option value="Team Member">Team Member</option>
                                    <option value="Manager">Manager</option>
                                </select>
                            </div>

                            <div className="flex gap-3 border-t border-slate-100 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                                    Create Account
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}