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

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'Manager') {
            router.push('/dashboard/member');
            return;
        }

        setUser(parsedUser);
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

    // Handle updating the status of a report dynamically
    const handleStatusUpdate = async (reportId, newStatus) => {
        try {
            await apiFetch(`/reports/${reportId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });

            // Refresh data locally without reloading the full page
            setReports(prevReports =>
                prevReports.map(report =>
                    report.id === reportId ? { ...report, status: newStatus } : report
                )
            );
        } catch (err) {
            alert(`Failed to update status: ${err.message}`);
        }
    };

    if (!user || loading) return <div className="p-8 text-center text-gray-600">Loading dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl rounded-lg bg-white p-8 shadow-md">
                <header className="mb-8 flex items-end justify-between border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
                        <p className="text-gray-600">Overview of all team weekly reports</p>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            router.push('/login');
                        }}
                        className="text-sm font-medium text-red-600 hover:underline"
                    >
                        Log Out
                    </button>
                </header>

                {error && <div className="mb-6 rounded bg-red-100 p-4 text-sm text-red-800">{error}</div>}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                            <tr>
                                <th className="px-4 py-3">Team Member</th>
                                <th className="px-4 py-3">Project</th>
                                <th className="px-4 py-3">Week</th>
                                <th className="px-4 py-3">Completed Tasks</th>
                                <th className="px-4 py-3">Blockers</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No reports submitted yet.</td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{report.user?.fullName}</td>
                                        <td className="px-4 py-3">{report.project?.name}</td>
                                        <td className="px-4 py-3 text-xs">
                                            {new Date(report.weekStartDate).toLocaleDateString()} - <br />
                                            {new Date(report.weekEndDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 max-w-xs truncate" title={report.tasksCompleted}>{report.tasksCompleted}</td>
                                        <td className="px-4 py-3 max-w-xs truncate text-red-600" title={report.blockers}>{report.blockers || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${report.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    report.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center space-x-2 whitespace-nowrap">
                                            {report.status !== 'approved' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(report.id, 'approved')}
                                                    className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 transition"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            {report.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(report.id, 'rejected')}
                                                    className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 transition"
                                                >
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