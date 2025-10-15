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
  Backpack,
  BookMarked,
  BookOpen,
  BrainCircuit,
  LayoutDashboard,
  LogOut,
  Map,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Users,
  LineChart,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { DragonIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { logout } from '@/services/authService';
import { RealmProvider, useRealm } from '@/context/realm-context';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { href: '/dashboard/character', icon: UserIcon, label: 'Персонаж' },
  { href: '/dashboard/analytics', icon: LineChart, label: 'Аналитика' },
  { href: '/dashboard/map', icon: Map, label: 'Карта Мира' },
  { href: '/dashboard/mind', icon: BrainCircuit, label: 'Сознание' },
  { href: '/dashboard/inventory', icon: Backpack, label: 'Инвентарь' },
  { href: '/dashboard/quests', icon: BookOpen, label: 'Журнал Заданий' },
  { href: '/dashboard/factions', icon: Shield, label: 'Фракции' },
  { href: '/dashboard/society', icon: Users, label: 'Общество' },
  { href: '/dashboard/chronicle', icon: BookMarked, label: 'Летопись' },
];

function RealmSelector() {
  const { realmId, setRealmId } = useRealm();
  const [options, setOptions] = useState<Array<{ id: string; name: string }>>([{ id: 'global', name: 'Global' }]);
  useEffect(() => {
    fetch('/api/admin/realms')
      .then(r => r.json())
      .then(list => {
        if (Array.isArray(list) && list.length > 0) setOptions(list);
      })
      .catch(() => {});
  }, []);
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground hidden md:block">Realm</label>
      <select
        className="border rounded px-2 py-1 bg-background"
        value={realmId}
        onChange={(e) => setRealmId(e.target.value)}
      >
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  );
}

function MainSidebar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();
  const { isMobile, state, toggleSidebar } = useSidebar();
  const { user } = useAuth(true);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
      toast({ title: 'Выход', description: 'Ваше путешествие завершено. До новых встреч.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось выйти.' });
    }
  };

  return (
    <Sidebar collapsible={isMobile ? 'offcanvas' : 'icon'}>
      <SidebarContent>
        <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary">
                <DragonIcon className="h-7 w-7" />
                <span className="group-data-[collapsible=icon]:hidden">ElderScrollsIdle</span>
            </Link>
        </SidebarHeader>
        <SidebarMenu className="flex-1 p-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
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
                 {user?.isAdmin && (
                    <SidebarMenuButton size="sm" asChild tooltip={{ children: 'Админ-панель' }} isActive={pathname.startsWith('/admin')}>
                        <Link href="/admin"><ShieldCheck /></Link>
                    </SidebarMenuButton>
                )}
                <SidebarMenuButton size="sm" asChild tooltip={{ children: 'Профиль' }} isActive={pathname.startsWith('/profile')}>
                    <Link href="/profile"><UserIcon /></Link>
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth(true);
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  return (
    <SidebarProvider>
      <RealmProvider>
        <div className="flex min-h-screen w-full">
          <MainSidebar />
          <SidebarInset className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-card px-4">
              <div className="flex items-center gap-2 md:hidden">
                <SidebarTrigger>
                    <PanelLeft/>
                </SidebarTrigger>
                 <Link href="/dashboard" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary">
                    <DragonIcon className="h-6 w-6" />
                </Link>
              </div>
              <div className="hidden md:flex" />
              <RealmSelector />
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </RealmProvider>
    </SidebarProvider>
  );
}
