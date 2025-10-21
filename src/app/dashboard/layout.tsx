'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
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
  ShieldCheck,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  User as UserIcon,
  Users,
  LineChart,
  Hammer,
  Axe,
  Pickaxe,
  Swords,
  Store,
  Brain,
  ChartNetwork,
  Speech,
  ShieldBanIcon,
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

const navCategories = [
  {
    title: 'Основное',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
      { href: '/dashboard/character', icon: UserIcon, label: 'Персонаж' },
      { href: '/dashboard/inventory', icon: Backpack, label: 'Инвентарь' },
    ]
  },
  {
    title: 'Приключения',
    items: [
      { href: '/dashboard/quests', icon: BookOpen, label: 'Задания' },
      { href: '/dashboard/map', icon: Map, label: 'Карта' },
      { href: '/dashboard/society', icon: Users, label: 'Общество' },
      { href: '/dashboard/factions', icon: Shield, label: 'Фракции' },
    ]
  },
  {
    title: 'Экономика',
    items: [
      { href: '/dashboard/market', icon: Store, label: 'Рынок' },
      { href: '/dashboard/crafting', icon: Hammer, label: 'Крафт' },
      { href: '/dashboard/gathering', icon: Pickaxe, label: 'Добыча' },
    ]
  },
  {
    title: 'Система',
    items: [
      { href: '/dashboard/chronicle', icon: BookMarked, label: 'Летопись' },
      { href: '/dashboard/mind', icon: Brain, label: 'Сознание' },
      { href: '/dashboard/analytics', icon: ChartNetwork, label: 'Аналитика' },
    ]
  }
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
        <SidebarHeader className="p-4 border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary hover:text-primary/80 transition-colors">
                <DragonIcon className="h-7 w-7" />
                <span className="group-data-[collapsible=icon]:hidden">ElderScrollsIdle</span>
            </Link>
        </SidebarHeader>
        
        <div className="flex-1 overflow-auto">
          {navCategories.map((category, index) => (
            <SidebarGroup key={category.title}>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">
                {category.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {category.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={{ children: item.label }}
                      >
                        <Link href={item.href} className="gap-3">
                          <item.icon className="h-4 w-4" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
              {index < navCategories.length - 1 && <SidebarSeparator />}
            </SidebarGroup>
          ))}
        </div>

        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className="flex justify-around items-center p-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
                {user?.isAdmin && (
                  <SidebarMenuButton size="sm" asChild tooltip={{ children: 'Админ-панель' }} isActive={pathname.startsWith('/admin')}>
                    <Link href="/admin"><ShieldBanIcon className="h-4 w-4" /></Link>
                  </SidebarMenuButton>
                )}
                <SidebarMenuButton size="sm" asChild tooltip={{ children: 'Профиль' }} isActive={pathname.startsWith('/profile')}>
                  <Link href="/profile"><UserIcon className="h-4 w-4" /></Link>
                </SidebarMenuButton>
                <SidebarMenuButton size="sm" onClick={handleSignOut} tooltip={{ children: 'Выход' }}>
                  <LogOut className="h-4 w-4" />
                </SidebarMenuButton>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarFooter className="p-2 hidden md:flex border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => toggleSidebar()}>
            {state === 'expanded' ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            <span className="group-data-[collapsible=icon]:hidden">Свернуть</span>
          </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth(true);
  const pathname = usePathname();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  return (
    <SidebarProvider>
      <RealmProvider>
        <div className="flex min-h-screen w-full">
          <MainSidebar />
          <SidebarInset className="flex-1 flex flex-col">
            {/* Mobile-only header */}
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 md:hidden">
              <div className="flex items-center gap-2">
                <SidebarTrigger>
                    <PanelLeft/>
                </SidebarTrigger>
                 <Link href="/dashboard" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary">
                    <DragonIcon className="h-6 w-6" />
                </Link>
              </div>
              <RealmSelector />
            </header>
            <main className="flex-1 overflow-auto">
              {pathname?.startsWith('/dashboard/mind/editor') ? (
                <div className="min-w-full">
                  {children}
                </div>
              ) : (
                <div className="origin-top-left scale-[0.75] min-w-[133.333%]">
                  {children}
                </div>
              )}
            </main>
          </SidebarInset>
        </div>
      </RealmProvider>
    </SidebarProvider>
  );
}
