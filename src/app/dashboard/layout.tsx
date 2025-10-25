'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { RealmProvider } from '@/context/realm-context';
import { TopNavigation } from '@/components/TopNavigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth(true);
  const pathname = usePathname();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  return (
    <RealmProvider>
      <div className="flex min-h-screen w-full flex-col">
        <TopNavigation />
        <main className={pathname?.startsWith('/dashboard/map') ? "flex-1 overflow-hidden" : "flex-1 overflow-auto"}>
          {pathname?.startsWith('/dashboard/mind/editor') || pathname?.startsWith('/dashboard/map') ? (
            <div className={pathname?.startsWith('/dashboard/map') ? "min-w-full h-full" : "min-w-full"}>
              {children}
            </div>
          ) : (
            <div className="origin-top-left scale-[0.75] min-w-[133.333%]">
              {children}
            </div>
          )}
        </main>
      </div>
    </RealmProvider>
  );
}
