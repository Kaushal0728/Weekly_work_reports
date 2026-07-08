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

    if (!user || loading) return <div className="p-8 text-center text-gray-600">Loading dashboard...</div>;

    return (
        <div className="p-8">
            <div className="mx-auto max-w-7xl rounded-lg bg-white p-8 shadow-md">

                <header className="mb-8 border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
                    <p className="text-gray-600">Overview and filtering of all team weekly reports</p>
                </header>

                {error && <div className="mb-6 rounded bg-red-100 p-4 text-sm text-red-800">{error}</div>}

                {/* --- Top Stat Cards --- */}
                <div className="mb-6 flex gap-8 rounded-lg bg-gray-50 p-4 border">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                        <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Approved</p>
                        <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Currently Showing</p>
                        <p className="text-3xl font-bold text-blue-600">{filteredReports.length} <span className="text-sm text-gray-500 font-normal">reports</span></p>
                    </div>
                </div>

                {/* --- Advanced Filter Toolbar --- */}
                <div className="mb-6 rounded-lg bg-white p-4 border shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Advanced Filters</h3>
                        <div className="space-x-3">
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
                                Clear Filters
                            </button>
                            <button onClick={exportToCSV} className="rounded bg-gray-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-700 transition">
                                Export to CSV
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded border px-3 py-1.5 text-sm bg-gray-50">
                                <option value="All">All Statuses</option>
                                <option value="submitted">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Team Member</label>
                            <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} className="w-full rounded border px-3 py-1.5 text-sm bg-gray-50">
                                <option value="All">All Members</option>
                                {uniqueMembers.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Project</label>
                            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-full rounded border px-3 py-1.5 text-sm bg-gray-50">
                                <option value="All">All Projects</option>
                                {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">From Date</label>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded border px-3 py-1.5 text-sm bg-gray-50" />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">To Date</label>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded border px-3 py-1.5 text-sm bg-gray-50" />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Team</label>
                        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="w-full rounded border px-3 py-1.5 text-sm bg-gray-50">
                            <option value="All">All Teams</option>
                            {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* --- Reports Table --- */}
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                            <tr>
                                <th className="px-4 py-3">Team Member</th>
                                <th className="px-4 py-3">Team(s)</th>
                                <th className="px-4 py-3">Project</th>
                                <th className="px-4 py-3">Week</th>
                                <th className="px-4 py-3">Completed Tasks</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No reports match your filters.</td>
                                </tr>
                            ) : (
                                filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{report.user?.fullName}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {report.user?.teams?.length > 0
                                                ? report.user.teams.map(t => t.name).join(', ')
                                                : 'Unassigned'}
                                        </td>
                                        <td className="px-4 py-3">{report.project?.name}</td>
                                        <td className="px-4 py-3 text-xs">
                                            {new Date(report.weekStartDate).toLocaleDateString()} - <br />
                                            {new Date(report.weekEndDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 max-w-xs truncate" title={report.tasksCompleted}>{report.tasksCompleted}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${report.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                report.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center space-x-2 whitespace-nowrap">
                                            {report.status !== 'approved' && (
                                                <button onClick={() => handleStatusUpdate(report.id, 'approved')} className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 transition">
                                                    Approve
                                                </button>
                                            )}
                                            {report.status !== 'rejected' && (
                                                <button onClick={() => handleStatusUpdate(report.id, 'rejected')} className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 transition">
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
            </div>
        </div>
    );
}