import AIChatWidget from '@/components/AIChatWidget';

export default function ManagerLayout({ children }) {
    return (
        <div className="relative min-h-screen">

            {children}


            <AIChatWidget />

        </div>
    );
}