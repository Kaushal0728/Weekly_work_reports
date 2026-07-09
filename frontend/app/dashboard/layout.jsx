// frontend/app/dashboard/layout.jsx
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
    return (
        <div className="flex h-screen w-full overflow-hidden" style={{ background: '#f1f5f9' }}>

            {/* The persistent left sidebar */}
            <Sidebar />

            {/* The main content area on the right (scrollable) */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>

        </div>
    );
}