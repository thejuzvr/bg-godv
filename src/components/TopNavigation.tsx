'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Backpack,
  BookMarked,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Map,
  Shield,
  User as UserIcon,
  Users,
  Hammer,
  Pickaxe,
  Store,
  Brain,
  ChartNetwork,
  ShieldBanIcon,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { DragonIcon } from '@/components/icons';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRealm } from '@/context/realm-context';
import { logout } from '@/services/authService';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
      <label className="text-sm text-muted-foreground hidden lg:block">Realm</label>
      <select
        className="border rounded px-2 py-1 bg-background text-sm"
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

export function TopNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
      toast({ title: 'Выход', description: 'Ваше путешествие завершено. До новых встреч.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось выйти.' });
    }
  };

  const isActiveCategory = (items: typeof navCategories[0]['items']) => {
    return items.some(item => pathname === item.href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 font-headline text-lg font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <DragonIcon className="h-7 w-7" />
              <span className="hidden lg:inline">ElderScrollsIdle</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {navCategories.map((category) => (
                <DropdownMenu key={category.title}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`flex items-center gap-1 ${isActiveCategory(category.items) ? 'bg-accent text-accent-foreground' : ''}`}
                    >
                      {category.title}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {category.items.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link 
                          href={item.href}
                          className={`flex items-center gap-2 w-full cursor-pointer ${pathname === item.href ? 'bg-accent' : ''}`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <RealmSelector />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user?.isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                          <ShieldBanIcon className="h-4 w-4" />
                          Админ-панель
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <UserIcon className="h-4 w-4" />
                      Профиль
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Выход
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 font-headline text-lg font-semibold text-primary"
          >
            <DragonIcon className="h-6 w-6" />
          </Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t bg-card">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navCategories.map((category) => (
                <div key={category.title}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {category.title}
                  </h3>
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                          pathname === item.href
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* User Links */}
              <div className="pt-4 border-t">
                {user?.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/50"
                  >
                    <ShieldBanIcon className="h-4 w-4" />
                    Админ-панель
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/50"
                >
                  <UserIcon className="h-4 w-4" />
                  Профиль
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/50 text-destructive w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Выход
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

