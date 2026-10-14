import SideNav from '../component/navigation/SideNav';
import TopBar from '../component/navigation/TopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-100 flex font-sans text-zinc-900">
      <SideNav />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-100">
          {children}
        </main>
      </div>
    </div>
  );
}
