// frontend/app/dashboard/manager/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function ManagerDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Advanced Filter States ---
    const [statusFilter, setStatusFilter] = useState('All');
    const [memberFilter, setMemberFilter] = useState('All');
    const [projectFilter, setProjectFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [teamFilter, setTeamFilter] = useState('All');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) return router.push('/login');
        if (JSON.parse(storedUser).role !== 'Manager') return router.push('/dashboard/member');

        setUser(JSON.parse(storedUser));
        fetchReports();
    }, [router]);

    const fetchReports = async () => {
        try {
            const data = await apiFetch('/reports', { method: 'GET' });
            setReports(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (reportId, newStatus) => {
        try {
            await apiFetch(`/reports/${reportId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            setReports(prevReports =>
                prevReports.map(report =>
                    report.id === reportId ? { ...report, status: newStatus } : report
                )
            );
        } catch (err) {
            alert(`Failed to update status: ${err.message}`);
        }
    };

    const handleViewReport = (report) => {
        setSelectedReport(report);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedReport(null);
        setIsModalOpen(false);
    };

    // --- Dynamic Dropdown Options ---
    // Extract unique members, projects, AND teams
    const uniqueMembers = [...new Set(reports.map(r => r.user?.fullName).filter(Boolean))];
    const uniqueProjects = [...new Set(reports.map(r => r.project?.name).filter(Boolean))];

    // Flatten the arrays of teams from all reports to get unique team names
    const uniqueTeams = [...new Set(reports.flatMap(r => r.user?.teams?.map(t => t.name) || []))];

    // --- Analytics & Filtering Logic ---
    const pendingCount = reports.filter(r => r.status === 'submitted').length;
    const approvedCount = reports.filter(r => r.status === 'approved').length;

    const filteredReports = reports.filter(r => {
        let keep = true;
        if (statusFilter !== 'All' && r.status !== statusFilter) keep = false;
        if (memberFilter !== 'All' && r.user?.fullName !== memberFilter) keep = false;
        if (projectFilter !== 'All' && r.project?.name !== projectFilter) keep = false;

        // NEW: Check if the user belongs to the selected team
        if (teamFilter !== 'All') {
            const userTeams = r.user?.teams?.map(t => t.name) || [];
            if (!userTeams.includes(teamFilter)) keep = false;
        }

        if (dateFrom && new Date(r.weekStartDate) < new Date(dateFrom)) keep = false;
        if (dateTo && new Date(r.weekEndDate) > new Date(dateTo)) keep = false;

        return keep;
    });

    const exportToCSV = () => {
        if (filteredReports.length === 0) {
            alert("No reports to export!");
            return;
        }

        // Updated headers to include Team(s)
        const headers = ['Team Member', 'Team(s)', 'Project', 'Week Start', 'Week End', 'Tasks Completed', 'Blockers', 'Hours', 'Status'];

        const csvRows = filteredReports.map(report => {
            const teams = report.user?.teams?.length > 0 ? report.user.teams.map(t => t.name).join(', ') : 'Unassigned';
            return [
                `"${report.user?.fullName || ''}"`,
                `"${teams}"`,
                `"${report.project?.name || ''}"`,
                `"${new Date(report.weekStartDate).toLocaleDateString()}"`,
                `"${new Date(report.weekEndDate).toLocaleDateString()}"`,
                `"${(report.tasksCompleted || '').replace(/"/g, '""')}"`, // Escape quotes inside text
                `"${(report.blockers || '').replace(/"/g, '""')}"`,
                `"${report.hoursWorked || ''}"`,
                `"${report.status}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `filtered_reports_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const clearFilters = () => {
        setStatusFilter('All');
        setMemberFilter('All');
        setProjectFilter('All');
        setTeamFilter('All');
        setDateFrom('');
        setDateTo('');
    };

    if (!user || loading) return (
        <div className="flex h-full items-center justify-center">
            <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <p className="text-sm text-slate-500">Loading dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Manager Dashboard</h1>
                        <p className="text-sm text-slate-500">Overview and filtering of all team weekly reports</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            {/* --- Top Stat Cards --- */}
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                        <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Approvals</p>
                        <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                        <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Approved</p>
                        <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Currently Showing</p>
                        <p className="text-2xl font-bold text-blue-600">{filteredReports.length} <span className="text-sm font-normal text-slate-400">reports</span></p>
                    </div>
                </div>
            </div>

            {/* --- Advanced Filter Toolbar --- */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Advanced Filters</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={clearFilters} className="text-sm font-medium text-slate-400 hover:text-slate-600">
                            Clear Filters
                        </button>
                        <button onClick={exportToCSV} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Team Member</label>
                        <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
                            <option value="All">All Members</option>
                            {uniqueMembers.map(m => <option key={m} value={m}>{m}</option>)}
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
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Team</label>
                        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
                            <option value="All">All Teams</option>
                            {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
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

            {/* --- Reports Table --- */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Team Member</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Team(s)</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Project</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Week</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Completed Tasks</th>
                            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-blue-100">Status</th>
                            <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-blue-100">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredReports.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                                    <svg className="mx-auto mb-2 h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    No reports match your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredReports.map((report) => (
                                <tr key={report.id} className="hover:bg-blue-50/30">
                                    <td className="px-5 py-3.5 font-semibold text-slate-800">{report.user?.fullName}</td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500">
                                        {report.user?.teams?.length > 0
                                            ? report.user.teams.map(t => t.name).join(', ')
                                            : 'Unassigned'}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600">{report.project?.name}</td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500">
                                        {new Date(report.weekStartDate).toLocaleDateString()} - <br />
                                        {new Date(report.weekEndDate).toLocaleDateString()}
                                    </td>
                                    <td className="max-w-xs truncate px-5 py-3.5 text-slate-600" title={report.tasksCompleted}>{report.tasksCompleted}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${report.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10' :
                                            report.status === 'rejected' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/10' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10'
                                            }`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-center space-x-2 whitespace-nowrap">
                                        <button
                                            onClick={() => handleViewReport(report)}
                                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            View
                                        </button>
                                        {report.status !== 'approved' && (
                                            <button onClick={() => handleStatusUpdate(report.id, 'approved')} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 hover:shadow-md">
                                                Approve
                                            </button>
                                        )}
                                        {report.status !== 'rejected' && (
                                            <button onClick={() => handleStatusUpdate(report.id, 'rejected')} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                                                Reject
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* --- REPORT DETAILS MODAL --- */}
            {isModalOpen && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                Weekly Report Details
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Modal Body  */}
                        <div className="p-6 overflow-y-auto space-y-6">

                            {/* Top Meta Data */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Team Member</p>
                                    <p className="font-semibold text-gray-900">{selectedReport.user?.fullName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Project</p>
                                    <p className="font-semibold text-gray-900">{selectedReport.project?.name || 'Unassigned'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Time Logged</p>
                                    <p className="font-semibold text-gray-900">{selectedReport.hoursWorked ? `${selectedReport.hoursWorked} Hours` : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Current Status</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${selectedReport.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                        selectedReport.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-amber-100 text-amber-800'
                                        }`}>
                                        {selectedReport.status}
                                    </span>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Task Data */}
                            <div>
                                <p className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-2">Completed Tasks</p>
                                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm whitespace-pre-wrap border border-gray-100">
                                    {selectedReport.tasksCompleted || 'No tasks listed.'}
                                </div>
                            </div>

                            <div>
                                <p className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-2">Planned for Next Week</p>
                                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm whitespace-pre-wrap border border-gray-100">
                                    {selectedReport.tasksPlanned || 'Nothing planned.'}
                                </div>
                            </div>

                            {/* Blockers */}
                            <div>
                                <p className="text-red-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    Blockers & Issues
                                </p>
                                <div className="bg-red-50 p-4 rounded-lg text-red-900 text-sm whitespace-pre-wrap border border-red-100">
                                    {selectedReport.blockers ? selectedReport.blockers : <span className="text-red-400 italic">No blockers reported.</span>}
                                </div>
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={handleCloseModal}
                                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Close Report
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}