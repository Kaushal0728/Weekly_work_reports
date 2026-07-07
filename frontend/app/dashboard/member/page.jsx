// frontend/app/dashboard/member/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/api';

export default function MemberDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);

    // Form State
    const [projectId, setProjectId] = useState('1'); // Defaults to the project we just created
    const [weekStartDate, setWeekStartDate] = useState('');
    const [weekEndDate, setWeekEndDate] = useState('');
    const [tasksCompleted, setTasksCompleted] = useState('');
    const [tasksPlanned, setTasksPlanned] = useState('');
    const [blockers, setBlockers] = useState('');
    const [hoursWorked, setHoursWorked] = useState('');
    const [notes, setNotes] = useState('');

    const [status, setStatus] = useState({ type: '', message: '' });

    // 1. Protect the route: Check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            router.push('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
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
        </div>
    );
}