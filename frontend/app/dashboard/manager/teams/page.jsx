// frontend/app/dashboard/manager/teams/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function ManageTeams() {
    const router = useRouter();
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]); // Needed to populate the checkbox list
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
        setSelectedMemberIds([]); // Clear selections
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

    if (loading) return <div className="p-8 text-center">Loading teams...</div>;

    return (
        <>
            <div className="p-8">
                <div className="mx-auto max-w-6xl rounded-lg bg-white p-8 shadow-md">

                    <header className="mb-8 border-b pb-4 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Team Management</h1>
                            <p className="text-gray-600">Create groupings and assign members</p>
                        </div>
                        <button onClick={handleOpenCreateModal} className="rounded bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition">
                            + Add New Team
                        </button>
                    </header>

                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Team Name</th>
                                    <th className="px-4 py-3">Members</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {teams.length === 0 ? (
                                    <tr><td colSpan="3" className="px-4 py-8 text-center">No teams found.</td></tr>
                                ) : (
                                    teams.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {t.members?.length > 0
                                                        ? t.members.map(m => <span key={m.id} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{m.fullName}</span>)
                                                        : <span className="text-gray-400 italic text-xs">No members assigned</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-4">
                                                <button onClick={() => handleEditClick(t)} className="font-medium text-blue-600 hover:underline">Edit</button>
                                                <button onClick={() => setTeamToDelete(t)} className="font-medium text-red-600 hover:underline">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- CREATE / EDIT Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl my-8">
                        <h3 className="mb-4 text-xl font-bold text-gray-900">{editingId ? 'Edit Team' : 'Create New Team'}</h3>

                        {status.type === 'error' && <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-800">{status.message}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Team Name</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                                <textarea rows="2" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" />
                            </div>

                            {/* Checkbox List for Assigning Users */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Assign Members</label>
                                <div className="max-h-40 overflow-y-auto rounded border bg-gray-50 p-3 space-y-2">
                                    {users.map(u => (
                                        <label key={u.id} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                value={u.id}
                                                checked={selectedMemberIds.includes(u.id)}
                                                onChange={(e) => handleCheckboxChange(e, u.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-800">{u.fullName} <span className="text-xs text-gray-500">({u.role?.name})</span></span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={closeModal} className="flex-1 rounded bg-gray-200 py-2 text-sm font-bold text-gray-700">Cancel</button>
                                <button type="submit" className="flex-1 rounded bg-blue-600 py-2 text-sm font-bold text-white">{editingId ? 'Update Team' : 'Create Team'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- CONFIRMATION Modal (Delete) --- */}
            {teamToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                        <h3 className="mb-2 text-xl font-bold text-gray-900">Delete Team?</h3>
                        <p className="mb-6 text-gray-600">Are you sure you want to delete <strong>{teamToDelete.name}</strong>? Members will not be deleted, just removed from this grouping.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setTeamToDelete(null)} className="flex-1 rounded bg-gray-200 py-2.5 font-bold text-gray-800">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 rounded bg-red-600 py-2.5 font-bold text-white">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}