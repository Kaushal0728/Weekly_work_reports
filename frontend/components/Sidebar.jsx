// frontend/components/Sidebar.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
    const [user, setUser] = useState(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [pathname]);

    if (!user) return null;

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    return (
        <aside className="flex h-screen w-64 flex-col bg-gray-900 text-white shadow-xl">
            {/* Brand Header */}
            <div className="flex h-16 shrink-0 items-center justify-center border-b border-gray-800 px-6">
                <span className="text-xl font-bold tracking-wider text-blue-400">
                    WeeklyReport
                </span>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
                <nav className="flex-1 space-y-2">

                    {/* Links for Managers */}
                    {user.role === 'Manager' && (
                        <>
                            <Link
                                href="/dashboard/manager"
                                className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${pathname === '/dashboard/manager'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                Overview
                            </Link>
                            <Link
                                href="/dashboard/manager/users"
                                className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${pathname.includes('/users')
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                Manage Users
                            </Link>
                            <Link
                                href="/dashboard/manager/teams"
                                className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${pathname.includes('/teams') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                Manage Teams
                            </Link>
                            <Link
                                href="/dashboard/manager/projects"
                                className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${pathname.includes('/projects')
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                Manage Projects
                            </Link>
                            <Link
                                href="/dashboard/manager/analytics"
                                className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${pathname.includes('/analytics') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                Analytics & Insights
                            </Link>
                        </>
                    )}

                    {/* Links for Team Members */}
                    {user.role === 'Team Member' && (
                        <Link
                            href="/dashboard/member"
                            className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${pathname === '/dashboard/member'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            My Dashboard
                        </Link>
                    )}
                </nav>
            </div>

            {/* User Profile & Logout at the bottom */}
            <div className="border-t border-gray-800 p-4">
                <div className="mb-4 px-2">
                    <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
                    <p className="text-xs text-gray-400">{user.role}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full rounded bg-red-600/90 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
                >
                    Log Out
                </button>
            </div>
        </aside>
    );
}