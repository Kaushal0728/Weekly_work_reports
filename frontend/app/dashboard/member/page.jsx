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

    if (!user) return (
        <div className="flex h-full items-center justify-center">
            <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <p className="text-sm text-slate-500">Loading dashboard...</p>
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
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">My Dashboard</h1>
                        <p className="text-sm text-slate-500">Welcome back, {user.fullName}</p>
                    </div>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Create Weekly Report
                </button>
            </div>

            {statusState.type === 'success' && !isModalOpen && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {statusState.message}
                </div>
            )}

            {/* --- Filter Toolbar --- */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Filter Reports</h3>
                    </div>
                    <button onClick={clearFilters} className="text-sm font-medium text-slate-400 hover:text-slate-600">
                        Clear Filters
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Status</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
                            <option value="All">All Statuses</option>
                            <option value="submitted">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Project</label>
                        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
                            <option value="All">All Projects</option>
                            {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">From Date</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">To Date</label>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                    </div>
                </div>
            </div>

            {/* --- History Table --- */}
            <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-700">
                    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    My Previous Reports
                </h2>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Week</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Project</th>
                                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Status</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-blue-100">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-5 py-12 text-center text-slate-400">
                                        <svg className="mx-auto mb-2 h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        No reports found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-blue-50/30">
                                        <td className="px-5 py-3.5 text-xs text-slate-500">
                                            {new Date(report.weekStartDate).toLocaleDateString()} - {new Date(report.weekEndDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-800">{report.project?.name}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${report.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10' : report.status === 'rejected' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/10' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10'}`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                onClick={() => handleEditClick(report)}
                                                disabled={report.status === 'approved'}
                                                className="rounded-lg px-3 py-1 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent"
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

            {/* --- CREATE / EDIT REPORT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">

                        <div className="flex justify-between items-center mb-6">
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
                                    {editingId ? 'Edit Weekly Report' : 'Submit Weekly Report'}
                                </h3>
                            </div>
                            <button onClick={() => closeModal(true)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {statusState.type === 'error' && (
                            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {statusState.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-600">Project</label>
                                    <select disabled={!!editingId} required value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 focus:border-blue-400 focus:outline-none">
                                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-600">Start Date</label>
                                    <input disabled={!!editingId} type="date" required value={weekStartDate} onChange={(e) => setWeekStartDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 focus:border-blue-400 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-600">End Date</label>
                                    <input disabled={!!editingId} type="date" required value={weekEndDate} onChange={(e) => setWeekEndDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 focus:border-blue-400 focus:outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Tasks Completed</label>
                                <textarea required rows="3" value={tasksCompleted} onChange={(e) => setTasksCompleted(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Tasks Planned for Next Week</label>
                                <textarea required rows="3" value={tasksPlanned} onChange={(e) => setTasksPlanned(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-600">Blockers (Optional)</label>
                                    <textarea rows="2" value={blockers} onChange={(e) => setBlockers(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-600">Hours Worked (Optional)</label>
                                    <input type="number" step="0.5" value={hoursWorked} onChange={(e) => setHoursWorked(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" />
                                </div>
                            </div>

                            <div className="flex gap-3 border-t border-slate-100 pt-5">
                                <button type="button" onClick={() => closeModal(true)} className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:brightness-110" style={{ background: editingId ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
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