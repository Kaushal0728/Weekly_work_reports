// frontend/app/register/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [roleName, setRoleName] = useState('Team Member');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // TRIPWIRE 1: Did the button actually trigger the function?
        console.log("1. Button clicked! Attempting to send:", { email, fullName, roleName });

        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, fullName, roleName }),
            });

            // TRIPWIRE 2: Did the backend send a successful response back?
            console.log("2. Success! Backend responded with:", data);

            // Once registered, send them to the login page
            router.push('/login');
        } catch (err) {
            // TRIPWIRE 3: Did the fetch fail or did the backend send an error?
            console.error("3. Frontend caught an error:", err);
            setError(err.message);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Create an Account</h2>

                {error && <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-600">{error}</p>}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                        <select
                            className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none bg-white"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                        >
                            <option value="Team Member">Team Member</option>
                            <option value="Manager">Manager</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 transition"
                    >
                        Register
                    </button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <span className="text-gray-600">Already have an account? </span>
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Log in here
                    </Link>
                </div>
            </div>
        </div>
    );
}