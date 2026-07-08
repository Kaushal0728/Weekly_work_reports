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

    if (loading) return <div className="p-8 text-center">Loading users...</div>;

    return (
        <div className="p-8">
            <div className="mx-auto max-w-6xl rounded-lg bg-white p-8 shadow-md">

                {/* --- Header with Top-Right Action Button --- */}
                <header className="mb-8 border-b pb-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                        <p className="text-gray-600">View and manage team members</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="rounded bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition"
                    >
                        + Add New User
                    </button>
                </header>

                {/* --- Full Width Users List Table --- */}
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                                    <td className="px-4 py-3">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role?.name === 'Manager' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {u.role?.name}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Create User Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-md scale-100 rounded-xl bg-white p-6 shadow-2xl transition-transform">

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Add New User</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {status.message && (
                            <div className={`mb-4 rounded p-3 text-sm ${status.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {status.message}
                            </div>
                        )}

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
                                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Temporary Password</label>
                                <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                                <select value={roleName} onChange={e => setRoleName(e.target.value)} className="w-full rounded border bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                                    <option value="Team Member">Team Member</option>
                                    <option value="Manager">Manager</option>
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={closeModal} className="flex-1 rounded bg-gray-200 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300 transition">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 rounded bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 transition">
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