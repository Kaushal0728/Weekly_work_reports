// frontend/app/dashboard/manager/teams/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function ManageTeams() {
    const router = useRouter();
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) return router.push('/login');
        if (JSON.parse(storedUser).role !== 'Manager') return router.push('/dashboard/member');

        fetchData();
    }, [router]);

    const fetchData = async () => {
        try {
            const [teamsData, usersData] = await Promise.all([
                apiFetch('/teams', { method: 'GET' }),
                apiFetch('/users', { method: 'GET' })
            ]);
            setTeams(teamsData);
            setUsers(usersData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Modal Controls ---
    const handleOpenCreateModal = () => {
        setEditingId(null);
        setName('');
        setDescription('');
        setSelectedMemberIds([]);
        setStatus({ type: '', message: '' });
        setIsModalOpen(true);
    };

    const handleEditClick = (team) => {
        setEditingId(team.id);
        setName(team.name);
        setDescription(team.description || '');
        // Pre-check the boxes for users already in this team
        setSelectedMemberIds(team.members.map(m => m.id));
        setStatus({ type: '', message: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setStatus({ type: '', message: '' });
    };

    // --- Checkbox Logic ---
    const handleCheckboxChange = (e, userId) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            setSelectedMemberIds(prev => [...prev, userId]);
        } else {
            setSelectedMemberIds(prev => prev.filter(id => id !== userId));
        }
    };

    // --- Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: editingId ? 'Updating team...' : 'Creating team...' });

        try {
            if (editingId) {
                const response = await apiFetch(`/teams/${editingId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ name, description, memberIds: selectedMemberIds }),
                });
                setTeams(teams.map(t => t.id === editingId ? response.team : t));
            } else {
                const response = await apiFetch('/teams', {
                    method: 'POST',
                    body: JSON.stringify({ name, description, memberIds: selectedMemberIds }),
                });
                setTeams([...teams, response.team]);
            }
            closeModal();
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
    };

    // --- Deletion Logic ---
    const confirmDelete = async () => {
        if (!teamToDelete) return;
        try {
            await apiFetch(`/teams/${teamToDelete.id}`, { method: 'DELETE' });
            setTeams(teams.filter(t => t.id !== teamToDelete.id));
            setTeamToDelete(null);
        } catch (error) {
            setTeamToDelete(null);
            setStatus({ type: 'error', message: error.message });
        }
    };

    if (loading) return (
        <div className="flex h-full items-center justify-center">
            <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <p className="text-sm text-slate-500">Loading teams...</p>
            </div>
        </div>
    );

    return (
        <>
            <div className="p-8">
                {/* --- Header --- */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Team Management</h1>
                            <p className="text-sm text-slate-500">Create groupings and assign members</p>
                        </div>
                    </div>
                    <button onClick={handleOpenCreateModal} className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Add New Team
                    </button>
                </div>

                {/* --- Teams Table --- */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Team Name</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Members</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-blue-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {teams.length === 0 ? (
                                <tr><td colSpan="3" className="px-5 py-12 text-center text-slate-400">
                                    <svg className="mx-auto mb-2 h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    No teams found.
                                </td></tr>
                            ) : (
                                teams.map((t) => (
                                    <tr key={t.id} className="hover:bg-blue-50/30">
                                        <td className="px-5 py-3.5 font-semibold text-slate-800">{t.name}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {t.members?.length > 0
                                                    ? t.members.map(m => <span key={m.id} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-600/10">{m.fullName}</span>)
                                                    : <span className="text-xs italic text-slate-400">No members assigned</span>
                                                }
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right space-x-3 whitespace-nowrap">
                                            <button onClick={() => handleEditClick(t)} className="rounded-lg px-3 py-1 text-sm font-semibold text-blue-600 hover:bg-blue-50">Edit</button>
                                            <button onClick={() => setTeamToDelete(t)} className="rounded-lg px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-50">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- CREATE / EDIT Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        {editingId ?
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> :
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        }
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Team' : 'Create New Team'}</h3>
                            </div>
                            <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {status.type === 'error' && <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{status.message}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Team Name</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Description</label>
                                <textarea rows="2" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                            </div>

                            {/* Checkbox List for Assigning Users */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-600">Assign Members</label>
                                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                                    {users.map(u => (
                                        <label key={u.id} className="flex items-center gap-3 cursor-pointer rounded-md px-2 py-1 hover:bg-white">
                                            <input
                                                type="checkbox"
                                                value={u.id}
                                                checked={selectedMemberIds.includes(u.id)}
                                                onChange={(e) => handleCheckboxChange(e, u.id)}
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-700">{u.fullName} <span className="text-xs text-slate-400">({u.role?.name})</span></span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 border-t border-slate-100 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>{editingId ? 'Update Team' : 'Create Team'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- CONFIRMATION Modal (Delete) --- */}
            {teamToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-slate-800">Delete Team?</h3>
                        <p className="mb-6 text-sm text-slate-500">Are you sure you want to delete <strong className="text-slate-700">{teamToDelete.name}</strong>? Members will not be deleted, just removed from this grouping.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setTeamToDelete(null)} className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-700">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}