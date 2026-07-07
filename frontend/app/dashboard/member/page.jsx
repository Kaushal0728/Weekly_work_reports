// frontend/app/dashboard/member/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function MemberDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);

    // Form State
    const [weekStartDate, setWeekStartDate] = useState('');
    const [weekEndDate, setWeekEndDate] = useState('');
    const [tasksCompleted, setTasksCompleted] = useState('');
    const [tasksPlanned, setTasksPlanned] = useState('');
    const [blockers, setBlockers] = useState('');
    const [hoursWorked, setHoursWorked] = useState('');
    const [notes, setNotes] = useState('');
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState('');
    const [myReports, setMyReports] = useState([]);

    const [status, setStatus] = useState({ type: '', message: '' });

    // 1. Protect the route: Check if user is logged in
    // 1. Protect the route and fetch initial data
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        // Step A: Kick them out immediately if they aren't logged in
        if (!token || !storedUser) {
            router.push('/login');
            return;
        }

        // Step B: If they are logged in, set the user state
        setUser(JSON.parse(storedUser));

        // Step C: Define the fetch functions BEFORE calling them
        const fetchProjects = async () => {
            try {
                const data = await apiFetch('/projects', { method: 'GET' });
                setProjects(data);
                if (data.length > 0) setProjectId(data[0].id.toString());
            } catch (err) {
                console.error("Failed to load projects:", err);
            }
        };

        const fetchMyReports = async () => {
            try {
                const data = await apiFetch('/reports/me', { method: 'GET' });
                setMyReports(data);
            } catch (err) {
                console.error("Failed to load history:", err);
            }
        };

        // Step D: Now that they are defined, it is safe to call them!
        fetchProjects();
        fetchMyReports();
    }, [router]);

    // 2. Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Submitting report...' });

        try {
            await apiFetch('/reports', {
                method: 'POST',
                body: JSON.stringify({
                    projectId: parseInt(projectId),
                    weekStartDate,
                    weekEndDate,
                    tasksCompleted,
                    tasksPlanned,
                    blockers,
                    hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
                    notes,
                }),
            });

            setStatus({ type: 'success', message: 'Report submitted successfully!' });

            // Clear the form after success
            setTasksCompleted('');
            setTasksPlanned('');
            setBlockers('');
            setHoursWorked('');
            setNotes('');
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        }
        const updatedReports = await apiFetch('/reports/me', { method: 'GET' });
        setMyReports(updatedReports);
    };

    if (!user) return <div className="p-8 text-center">Loading dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow-md">
                <header className="mb-8 border-b pb-4 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Team Member Dashboard</h1>
                        <p className="text-gray-600">Welcome back, {user.fullName}</p>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            router.push('/login');
                        }}
                        className="text-sm text-red-600 hover:underline"
                    >
                        Log Out
                    </button>
                </header>

                <h2 className="mb-6 text-xl font-semibold text-gray-700">Submit Weekly Report</h2>

                {status.message && (
                    <div className={`mb-6 rounded p-4 text-sm ${status.type === 'success' ? 'bg-green-100 text-green-800' :
                        status.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Project</label>
                            <select
                                required
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
                            >
                                {projects.length === 0 ? (
                                    <option value="">Loading...</option>
                                ) : (
                                    projects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Week Start Date</label>
                            <input type="date" required value={weekStartDate} onChange={(e) => setWeekStartDate(e.target.value)} className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Week End Date</label>
                            <input type="date" required value={weekEndDate} onChange={(e) => setWeekEndDate(e.target.value)} className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Tasks Completed</label>
                        <textarea required rows="3" value={tasksCompleted} onChange={(e) => setTasksCompleted(e.target.value)} className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="What did you finish this week?" />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Tasks Planned for Next Week</label>
                        <textarea required rows="3" value={tasksPlanned} onChange={(e) => setTasksPlanned(e.target.value)} className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="What is on the agenda for next week?" />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Blockers / Challenges (Optional)</label>
                        <textarea rows="2" value={blockers} onChange={(e) => setBlockers(e.target.value)} className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="Is anything slowing you down?" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Hours Worked (Optional)</label>
                            <input type="number" step="0.5" value={hoursWorked} onChange={(e) => setHoursWorked(e.target.value)} className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="e.g. 40" />
                        </div>
                    </div>

                    <button type="submit" className="w-full rounded bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700">
                        Submit Report
                    </button>
                </form>
            </div>
            {/* --- History Table Section --- */}
            <div className="mt-12 border-t pt-8">
                <h2 className="mb-4 text-xl font-semibold text-gray-700">My Previous Reports</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                            <tr>
                                <th className="px-4 py-3">Week</th>
                                <th className="px-4 py-3">Project</th>
                                <th className="px-4 py-3">Tasks Completed</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myReports.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-4 py-6 text-center text-gray-500">
                                        You haven't submitted any reports yet.
                                    </td>
                                </tr>
                            ) : (
                                myReports.map((report) => (
                                    <tr key={report.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 text-xs">
                                            {new Date(report.weekStartDate).toLocaleDateString()} - <br />
                                            {new Date(report.weekEndDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{report.project?.name}</td>
                                        <td className="px-4 py-3 max-w-xs truncate" title={report.tasksCompleted}>
                                            {report.tasksCompleted}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${report.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                report.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {report.status}
                                            </span>
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