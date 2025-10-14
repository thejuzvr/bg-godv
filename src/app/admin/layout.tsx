'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { DragonIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { logout } from '@/services/authService';

const adminNavItems = [
  { href: '/admin', icon: ShieldCheck, label: 'Админ-панель' },
  { href: '/admin/data', icon: Database, label: 'Данные' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
];

function AdminSidebar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();
  const { isMobile, state, toggleSidebar } = useSidebar();
  const { user } = useAuth(true);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
      toast({ title: 'Выход', description: 'Сессия завершена.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось выйти.' });
    }
  };

  return (
    <Sidebar collapsible={isMobile ? 'offcanvas' : 'icon'}>
      <SidebarContent>
        <SidebarHeader className="p-4">
          <Link href="/admin" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary">
            <DragonIcon className="h-7 w-7" />
            <span className="group-data-[collapsible=icon]:hidden">Админка</span>
          </Link>
        </SidebarHeader>
        <SidebarMenu className="flex-1 p-2">
          {adminNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={{ children: item.label }}>
                <Link href={item.href}>
                  <item.icon />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarMenu className="p-2 mt-auto">
          <div className="flex justify-around items-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
            <SidebarMenuButton size="sm" asChild tooltip={{ children: 'Дашборд' }} isActive={pathname.startsWith('/dashboard')}>
              <Link href="/dashboard"><LayoutDashboard /></Link>
            </SidebarMenuButton>
            <SidebarMenuButton size="sm" onClick={handleSignOut} tooltip={{ children: 'Выход' }}>
              <LogOut />
            </SidebarMenuButton>
          </div>
        </SidebarMenu>
        <SidebarFooter className="p-2 hidden md:flex">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => toggleSidebar()}>
            {state === 'expanded' ? <PanelLeftClose /> : <PanelLeftOpen />}
            <span className="group-data-[collapsible=icon]:hidden">Свернуть</span>
          </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth(true);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-start gap-4 border-b bg-card px-4 md:hidden">
            <SidebarTrigger>
              <PanelLeft />
            </SidebarTrigger>
            <Link href="/admin" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary">
              <DragonIcon className="h-6 w-6" />
            </Link>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


