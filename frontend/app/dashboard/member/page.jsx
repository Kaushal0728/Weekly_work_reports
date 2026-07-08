'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function MemberDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [myReports, setMyReports] = useState([]);

    // UI & Filter State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusState, setStatusState] = useState({ type: '', message: '' });

    const [statusFilter, setStatusFilter] = useState('All');
    const [projectFilter, setProjectFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [projectId, setProjectId] = useState('');
    const [weekStartDate, setWeekStartDate] = useState('');
    const [weekEndDate, setWeekEndDate] = useState('');
    const [tasksCompleted, setTasksCompleted] = useState('');
    const [tasksPlanned, setTasksPlanned] = useState('');
    const [blockers, setBlockers] = useState('');
    const [hoursWorked, setHoursWorked] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) return router.push('/login');
        setUser(JSON.parse(storedUser));

        const fetchProjects = async () => {
            try {
                const data = await apiFetch('/projects', { method: 'GET' });
                setProjects(data);
                if (data.length > 0) setProjectId(data[0].id.toString());
            } catch (err) { console.error(err); }
        };

        const fetchMyReports = async () => {
            try {
                const data = await apiFetch('/reports/me', { method: 'GET' });
                setMyReports(data);
            } catch (err) { console.error(err); }
        };

        fetchProjects();
        fetchMyReports();
    }, [router]);

    // --- Filtering Logic ---
    const uniqueProjects = [...new Set(myReports.map(r => r.project?.name).filter(Boolean))];

    const filteredReports = myReports.filter(r => {
        let keep = true;
        if (statusFilter !== 'All' && r.status !== statusFilter) keep = false;
        if (projectFilter !== 'All' && r.project?.name !== projectFilter) keep = false;
        if (dateFrom && new Date(r.weekStartDate) < new Date(dateFrom)) keep = false;
        if (dateTo && new Date(r.weekEndDate) > new Date(dateTo)) keep = false;
        return keep;
    });

    const clearFilters = () => {
        setStatusFilter('All');
        setProjectFilter('All');
        setDateFrom('');
        setDateTo('');
    };

    // --- Modal & Form Logic ---
    const handleOpenCreateModal = () => {
        setEditingId(null);
        setProjectId(projects.length > 0 ? projects[0].id.toString() : '');
        setWeekStartDate('');
        setWeekEndDate('');
        setTasksCompleted('');
        setTasksPlanned('');
        setBlockers('');
        setHoursWorked('');
        setStatusState({ type: '', message: '' });
        setIsModalOpen(true);
    };

    const handleEditClick = (report) => {
        if (report.status === 'approved') {
            alert("You cannot edit an approved report.");
            return;
        }
        setEditingId(report.id);
        setProjectId(report.projectId.toString());
        setWeekStartDate(new Date(report.weekStartDate).toISOString().split('T')[0]);
        setWeekEndDate(new Date(report.weekEndDate).toISOString().split('T')[0]);
        setTasksCompleted(report.tasksCompleted);
        setTasksPlanned(report.tasksPlanned);
        setBlockers(report.blockers || '');
        setHoursWorked(report.hoursWorked ? report.hoursWorked.toString() : '');
        setStatusState({ type: '', message: '' });
        setIsModalOpen(true);
    };

    const closeModal = (resetStatus = true) => {
        setIsModalOpen(false);
        if (resetStatus) setStatusState({ type: '', message: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusState({ type: 'loading', message: editingId ? 'Updating report...' : 'Submitting report...' });

        try {
            if (editingId) {
                await apiFetch(`/reports/${editingId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ tasksCompleted, tasksPlanned, blockers, hoursWorked }),
                });
            } else {
                await apiFetch('/reports', {
                    method: 'POST',
                    body: JSON.stringify({ projectId: parseInt(projectId), weekStartDate, weekEndDate, tasksCompleted, tasksPlanned, blockers, hoursWorked }),
                });
            }

            const updatedReports = await apiFetch('/reports/me', { method: 'GET' });
            setMyReports(updatedReports);
            setStatusState({ type: 'success', message: editingId ? 'Report updated successfully!' : 'Report submitted successfully!' });
            closeModal(false);
        } catch (error) {
            setStatusState({ type: 'error', message: error.message });
        }
    };

    if (!user) return <div className="p-8 text-center text-gray-600">Loading dashboard...</div>;

    return (
        <div className="p-8">
            <div className="mx-auto max-w-6xl rounded-lg bg-white p-8 shadow-md">

                {/* --- Header --- */}
                <header className="mb-8 border-b pb-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
                        <p className="text-gray-600">Welcome back, {user.fullName}</p>
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="rounded bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition"
                    >
                        + Create Weekly Report
                    </button>
                </header>

                {statusState.type === 'success' && !isModalOpen && (
                    <div className="mb-6 rounded bg-green-100 p-4 text-sm text-green-800">
                        {statusState.message}
                    </div>
                )}

                {/* --- Filter Toolbar --- */}
                <div className="mb-6 rounded-lg bg-gray-50 p-4 border shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Filter Reports</h3>
                        <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
                            Clear Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded border px-3 py-1.5 text-sm bg-white">
                                <option value="All">All Statuses</option>
                                <option value="submitted">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Project</label>
                            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-full rounded border px-3 py-1.5 text-sm bg-white">
                                <option value="All">All Projects</option>
                                {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">From Date</label>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded border px-3 py-1.5 text-sm bg-white" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">To Date</label>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded border px-3 py-1.5 text-sm bg-white" />
                        </div>
                    </div>
                </div>

                {/* --- History Table --- */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-gray-700">My Previous Reports</h2>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Week</th>
                                    <th className="px-4 py-3">Project</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                            No reports found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-xs">
                                                {new Date(report.weekStartDate).toLocaleDateString()} - {new Date(report.weekEndDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{report.project?.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${report.status === 'approved' ? 'bg-green-100 text-green-800' : report.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleEditClick(report)}
                                                    disabled={report.status === 'approved'}
                                                    className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline font-medium"
                                                >
                                                    {report.status === 'approved' ? 'Locked' : 'Edit'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- CREATE / EDIT REPORT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity overflow-y-auto">
                    <div className="w-full max-w-2xl scale-100 rounded-xl bg-white p-6 shadow-2xl transition-transform my-8">

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingId ? 'Edit Weekly Report' : 'Submit Weekly Report'}
                            </h3>
                            <button onClick={() => closeModal(true)} className="text-gray-400 hover:text-gray-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {statusState.type === 'error' && (
                            <div className="mb-6 rounded bg-red-100 p-4 text-sm text-red-800">
                                {statusState.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Project</label>
                                    <select disabled={!!editingId} required value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded border px-3 py-2 text-sm bg-white disabled:bg-gray-100 focus:border-blue-500 focus:outline-none">
                                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
                                    <input disabled={!!editingId} type="date" required value={weekStartDate} onChange={(e) => setWeekStartDate(e.target.value)} className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100 focus:border-blue-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
                                    <input disabled={!!editingId} type="date" required value={weekEndDate} onChange={(e) => setWeekEndDate(e.target.value)} className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-100 focus:border-blue-500 focus:outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Tasks Completed</label>
                                <textarea required rows="3" value={tasksCompleted} onChange={(e) => setTasksCompleted(e.target.value)} className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Tasks Planned for Next Week</label>
                                <textarea required rows="3" value={tasksPlanned} onChange={(e) => setTasksPlanned(e.target.value)} className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Blockers (Optional)</label>
                                    <textarea rows="2" value={blockers} onChange={(e) => setBlockers(e.target.value)} className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Hours Worked (Optional)</label>
                                    <input type="number" step="0.5" value={hoursWorked} onChange={(e) => setHoursWorked(e.target.value)} className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4 border-t">
                                <button type="button" onClick={() => closeModal(true)} className="flex-1 rounded-lg bg-gray-200 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-300 transition">
                                    Cancel
                                </button>
                                <button type="submit" className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {editingId ? 'Update Report' : 'Submit Report'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}