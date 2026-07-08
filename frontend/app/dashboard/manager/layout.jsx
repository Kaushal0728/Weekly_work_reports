import AIChatWidget from '@/components/AIChatWidget';

export default function ManagerLayout({ children }) {
    return (
        <div className="relative min-h-screen">

            {/* This renders the manager's specific pages (Overview, Teams, Analytics, etc.) */}
            {children}

            {/* This ensures ONLY the manager sees the AI widget */}
            <AIChatWidget />

        </div>
    );
}