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
        setIsModalOpen(true); // Open modal in edit mode
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
            closeModal(); // Close on success
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

    if (loading) return <div className="p-8 text-center">Loading projects...</div>;

    return (
        <>
            <div className="p-8">
                <div className="mx-auto max-w-6xl rounded-lg bg-white p-8 shadow-md">

                    {/* --- Header with Top-Right Action Button --- */}
                    <header className="mb-8 border-b pb-4 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Project Management</h1>
                            <p className="text-gray-600">View, edit, and remove active company projects</p>
                        </div>
                        <button
                            onClick={handleOpenCreateModal}
                            className="rounded bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition"
                        >
                            + Add New Project
                        </button>
                    </header>

                    {/* --- Full Width Table --- */}
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                                <tr>
                                    <th className="px-4 py-3 w-20">ID</th>
                                    <th className="px-4 py-3">Project Name</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {projects.length === 0 ? (
                                    <tr><td colSpan="3" className="px-4 py-8 text-center">No projects found.</td></tr>
                                ) : (
                                    projects.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">#{p.id}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                                            <td className="px-4 py-3 text-right space-x-4">
                                                <button onClick={() => handleEditClick(p)} className="font-medium text-blue-600 hover:underline">Edit</button>
                                                <button onClick={() => initiateDelete(p)} className="font-medium text-red-600 hover:underline">Delete</button>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-md scale-100 rounded-xl bg-white p-6 shadow-2xl transition-transform">

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingId ? 'Edit Project' : 'Add New Project'}
                            </h3>
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

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Project Name</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                                <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={closeModal} className="flex-1 rounded bg-gray-200 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300 transition">
                                    Cancel
                                </button>
                                <button type="submit" className={`flex-1 rounded py-2 text-sm font-bold text-white transition ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {editingId ? 'Update Project' : 'Create Project'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

            {/* --- CONFIRMATION Modal (Delete) --- */}
            {projectToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-md scale-100 rounded-xl bg-white p-6 shadow-2xl transition-transform">
                        <h3 className="mb-2 text-xl font-bold text-gray-900">Delete Project?</h3>
                        <p className="mb-6 text-gray-600">Are you sure you want to delete <strong>{projectToDelete.name}</strong>? This action cannot be undone.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setProjectToDelete(null)} className="flex-1 rounded-lg bg-gray-200 px-4 py-2.5 font-bold text-gray-800 hover:bg-gray-300">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-bold text-white hover:bg-red-700">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ERROR Modal --- */}
            {status.type === 'error' && !isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-md scale-100 rounded-xl bg-white p-6 shadow-2xl transition-transform">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-gray-900">Action Denied</h3>
                            <p className="mb-6 text-gray-600">{status.message}</p>
                            <button onClick={() => setStatus({ type: '', message: '' })} className="w-full rounded-lg bg-red-600 px-4 py-2.5 font-bold text-white hover:bg-red-700">Understood</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}