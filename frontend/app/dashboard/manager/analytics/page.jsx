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

    if (loading) return (
        <div className="flex h-full items-center justify-center">
            <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <p className="text-sm text-slate-500">Loading analytics...</p>
            </div>
        </div>
    );

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
        { name: 'Approved', value: statusMap.approved, color: '#10b981' },
        { name: 'Pending', value: statusMap.submitted, color: '#f59e0b' },
        { name: 'Rejected', value: statusMap.rejected, color: '#ef4444' }
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

                {/* Page Header */}
                <div className="mb-8 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Analytics & Insights</h1>
                        <p className="text-sm text-slate-500">High-level overview of team performance and project health</p>
                    </div>
                </div>

                {/* --- Advanced Analytics Filters --- */}
                <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap items-end gap-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Filter by Team</label>
                        <select
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                            className="min-w-[150px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                        >
                            <option value="All">All Teams</option>
                            {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">From Date</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-400">To Date</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                        />
                    </div>

                    {(dateFrom || dateTo || teamFilter !== 'All') && (
                        <button
                            onClick={clearFilters}
                            className="text-sm font-medium text-slate-400 hover:text-slate-600"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* --- Metrics Dashboard Summaries --- */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Submissions</p>
                            <p className="text-2xl font-bold text-blue-600">{totalReports}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Compliance Rate</p>
                            <p className="text-2xl font-bold text-emerald-600">{complianceRate}%</p>
                            <p className="text-[10px] text-slate-400">of expected group submitted</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50">
                            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Blockers</p>
                            <p className="text-2xl font-bold text-red-500">{reportsWithBlockers}</p>
                            <p className="text-[10px] text-slate-400">active team challenges identified</p>
                        </div>
                    </div>
                </div>

                {/* --- Charts Section --- */}
                {filteredReports.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <svg className="mx-auto mb-3 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <p className="text-slate-400">No reporting data available matching your selected parameters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                        {/* Project Workload Distribution */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-6 flex items-center gap-2 text-base font-bold text-slate-700">
                                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                Workload Distribution by Project
                            </h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={projectData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} />
                                        <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Approval Status Matrix */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-6 flex items-center gap-2 text-base font-bold text-slate-700">
                                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                                Report Approval Status
                            </h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Performance Timeline Submissions Trend */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                            <h3 className="mb-6 flex items-center gap-2 text-base font-bold text-slate-700">
                                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                Submission Trend Over Time
                            </h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={timelineData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} />
                                        <Line type="monotone" dataKey="submissions" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
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