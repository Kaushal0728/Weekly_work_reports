// frontend/app/dashboard/manager/analytics/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';

export default function AnalyticsDashboard() {
    const router = useRouter();
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Filter States ---
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [teamFilter, setTeamFilter] = useState('All');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) return router.push('/login');
        if (JSON.parse(storedUser).role !== 'Manager') return router.push('/dashboard/member');

        fetchData();
    }, [router]);

    const fetchData = async () => {
        try {
            const [reportsData, usersData] = await Promise.all([
                apiFetch('/reports', { method: 'GET' }),
                apiFetch('/users', { method: 'GET' })
            ]);
            setReports(reportsData);
            setUsers(usersData.filter(u => u.role?.name === 'Team Member'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setTeamFilter('All');
    };

    if (loading) return <div className="p-8 text-center text-gray-600">Loading analytics...</div>;

    // --- 1. Extract Unique Teams From Loaded Data ---
    const uniqueTeams = [...new Set(reports.flatMap(r => r.user?.teams?.map(t => t.name) || []))];

    // --- 2. Multi-Parameter Filtering Logic ---
    const filteredReports = reports.filter(r => {
        let keep = true;

        // Date Range Checks
        if (dateFrom && new Date(r.weekStartDate) < new Date(dateFrom)) keep = false;
        if (dateTo && new Date(r.weekEndDate) > new Date(dateTo)) keep = false;

        // Team Assignment Check
        if (teamFilter !== 'All') {
            const userTeams = r.user?.teams?.map(t => t.name) || [];
            if (!userTeams.includes(teamFilter)) keep = false;
        }

        return keep;
    });

    // --- 3. Process Summary Metrics Using Filtered Data ---
    const totalReports = filteredReports.length;
    const reportsWithBlockers = filteredReports.filter(r => r.blockers && r.blockers.trim() !== '').length;

    // Calculate Compliance Rate based on active matching participants
    const complianceRate = users.length > 0
        ? Math.round((new Set(filteredReports.map(r => r.userId)).size / users.length) * 100)
        : 0;

    // --- 4. Process Chart Visualizations Using Filtered Data ---

    // Chart A: Workload Distribution by Project 
    const projectMap = {};
    filteredReports.forEach(r => {
        const pName = r.project?.name || 'Unknown';
        projectMap[pName] = (projectMap[pName] || 0) + 1;
    });
    const projectData = Object.keys(projectMap).map(key => ({ name: key, count: projectMap[key] }));

    // Chart B: Report Status Distribution 
    const statusMap = { approved: 0, submitted: 0, rejected: 0 };
    filteredReports.forEach(r => { if (statusMap[r.status] !== undefined) statusMap[r.status]++; });
    const statusData = [
        { name: 'Approved', value: statusMap.approved, color: '#16a34a' },
        { name: 'Pending', value: statusMap.submitted, color: '#ca8a04' },
        { name: 'Rejected', value: statusMap.rejected, color: '#dc2626' }
    ].filter(d => d.value > 0);

    // Chart C: Submissions Over Time 
    const dateMap = {};
    filteredReports.forEach(r => {
        const date = new Date(r.weekStartDate).toLocaleDateString();
        dateMap[date] = (dateMap[date] || 0) + 1;
    });
    const timelineData = Object.keys(dateMap)
        .sort((a, b) => new Date(a) - new Date(b))
        .map(key => ({ date: key, submissions: dateMap[key] }));

    return (
        <div className="p-8">
            <div className="mx-auto max-w-7xl">

                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Analytics & Insights</h1>
                    <p className="text-gray-600">High-level overview of team performance and project health</p>
                </header>

                {/* --- Advanced Analytics Filters --- */}
                <div className="mb-8 rounded-lg bg-white p-4 border shadow-sm flex flex-wrap items-end gap-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">Filter by Team</label>
                        <select
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                            className="rounded border px-3 py-1.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-500 min-w-[150px]"
                        >
                            <option value="All">All Teams</option>
                            {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">From Date</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded border px-3 py-1.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">To Date</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded border px-3 py-1.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {(dateFrom || dateTo || teamFilter !== 'All') && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:underline"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* --- Metrics Dashboard Summaries --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Submissions</p>
                        <p className="text-4xl font-extrabold text-blue-600 mt-2">{totalReports}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Compliance Rate</p>
                        <p className="text-4xl font-extrabold text-green-600 mt-2">{complianceRate}%</p>
                        <p className="text-xs text-gray-400 mt-1">of expected group submitted</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Open Blockers</p>
                        <p className="text-4xl font-extrabold text-red-500 mt-2">{reportsWithBlockers}</p>
                        <p className="text-xs text-gray-400 mt-1">active team challenges identified</p>
                    </div>
                </div>

                {/* --- Charts Section --- */}
                {filteredReports.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                        No reporting data available matching your selected parameters.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Project Workload Distribution */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-700 mb-6">Workload Distribution by Project</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={projectData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                        <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Approval Status Matrix */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-700 mb-6">Report Approval Status</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Performance Timeline Submissions Trend */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                            <h3 className="text-lg font-bold text-gray-700 mb-6">Submission Trend Over Time</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={timelineData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                        <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Line type="monotone" dataKey="submissions" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}