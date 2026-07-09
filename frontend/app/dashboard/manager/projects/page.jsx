'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function ManageProjects() {
    const router = useRouter();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) return router.push('/login');
        if (JSON.parse(storedUser).role !== 'Manager') return router.push('/dashboard/member');

        fetchProjects();
    }, [router]);

    const fetchProjects = async () => {
        try {
            const data = await apiFetch('/projects', { method: 'GET' });
            setProjects(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingId(null);
        setName('');
        setDescription('');
        setStatus({ type: '', message: '' });
        setIsModalOpen(true);
    };

    const handleEditClick = (project) => {
        setEditingId(project.id);
        setName(project.name);
        setDescription(project.description || '');
        setStatus({ type: '', message: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setStatus({ type: '', message: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: editingId ? 'Updating project...' : 'Creating project...' });

        try {
            if (editingId) {
                const response = await apiFetch(`/projects/${editingId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ name, description }),
                });
                setProjects(projects.map(p => p.id === editingId ? response.project : p));
            } else {
                const response = await apiFetch('/projects', {
                    method: 'POST',
                    body: JSON.stringify({ name, description }),
                });
                setProjects([...projects, response.project]);
            }
            closeModal();
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
    };

    // Deletion logic
    const initiateDelete = (project) => setProjectToDelete(project);

    const confirmDelete = async () => {
        if (!projectToDelete) return;
        try {
            await apiFetch(`/projects/${projectToDelete.id}`, { method: 'DELETE' });
            setProjects(projects.filter(p => p.id !== projectToDelete.id));
            setProjectToDelete(null);
        } catch (error) {
            setProjectToDelete(null);
            setStatus({ type: 'error', message: error.message });
        }
    };

    if (loading) return (
        <div className="flex h-full items-center justify-center">
            <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <p className="text-sm text-slate-500">Loading projects...</p>
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
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Project Management</h1>
                            <p className="text-sm text-slate-500">View, edit, and remove active company projects</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110"
                        style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Add New Project
                    </button>
                </div>

                {/* --- Full Width Table --- */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                                <th className="w-20 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">ID</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Project Name</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-blue-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {projects.length === 0 ? (
                                <tr><td colSpan="3" className="px-5 py-12 text-center text-slate-400">
                                    <svg className="mx-auto mb-2 h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                    No projects found.
                                </td></tr>
                            ) : (
                                projects.map((p) => (
                                    <tr key={p.id} className="hover:bg-blue-50/30">
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-600">#{p.id}</span>
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-800">{p.name}</td>
                                        <td className="px-5 py-3.5 text-right space-x-3 whitespace-nowrap">
                                            <button onClick={() => handleEditClick(p)} className="rounded-lg px-3 py-1 text-sm font-semibold text-blue-600 hover:bg-blue-50">Edit</button>
                                            <button onClick={() => initiateDelete(p)} className="rounded-lg px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-50">Delete</button>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">

                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: editingId ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        {editingId ?
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> :
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        }
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {editingId ? 'Edit Project' : 'Add New Project'}
                                </h3>
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

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Project Name</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Description</label>
                                <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                            </div>

                            <div className="flex gap-3 border-t border-slate-100 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110" style={{ background: editingId ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                                    {editingId ? 'Update Project' : 'Create Project'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

            {/* --- CONFIRMATION Modal (Delete) --- */}
            {projectToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-slate-800">Delete Project?</h3>
                        <p className="mb-6 text-sm text-slate-500">Are you sure you want to delete <strong className="text-slate-700">{projectToDelete.name}</strong>? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setProjectToDelete(null)} className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-700">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ERROR Modal --- */}
            {status.type === 'error' && !isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-slate-800">Action Denied</h3>
                            <p className="mb-6 text-sm text-slate-500">{status.message}</p>
                            <button onClick={() => setStatus({ type: '', message: '' })} className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-700">Understood</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}