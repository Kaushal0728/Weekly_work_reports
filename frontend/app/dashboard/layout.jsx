// frontend/app/dashboard/layout.jsx
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
    return (
        <div className="flex h-screen w-full bg-gray-50 overflow-hidden">

            {/* The persistent left sidebar */}
            <Sidebar />

            {/* The main content area on the right (scrollable) */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>

        </div>
    );
}