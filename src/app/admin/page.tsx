"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Sword, 
  Database, 
  MessageSquare, 
  Activity,
  TrendingUp,
  UserPlus,
  Skull,
  Crown
} from "lucide-react";
import { fetchAdminStats, type AdminStats } from "./actions";
import { PageContainer } from "@/components/layout/page-container";
import { SectionContainer } from "@/components/layout/section-container";

export default function AdminDashboard() {
  const { user, loading } = useAuth(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!loading && user?.isAdmin) {
        setIsLoading(true);
        try {
          const result = await fetchAdminStats();
          if (result.success && result.stats) {
            setStats(result.stats);
          } else {
            console.error('Failed to load stats:', result.error);
          }
        } catch (error) {
          console.error('Error loading stats:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadStats();
    // Обновляем статистику каждые 30 секунд
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loading, user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка...</div>;
  }

  if (!user || !user.isAdmin) {
    return (
      <PageContainer centered maxWidth="4xl">
        <Card className="w-full max-w-md border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Доступ запрещён</CardTitle>
            <CardDescription className="font-body">У вас нет прав для доступа к этой странице.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full font-body">
              <Link href="/dashboard">Вернуться на дашборд</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="container">
      <SectionContainer>
        {/* Header */}
        <header>
          <h1 className="text-4xl font-headline text-primary">Панель администратора</h1>
          <p className="text-lg text-muted-foreground mt-2 font-body">Добро пожаловать, {user.email}</p>
        </header>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Activity className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <>
            {/* Main Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/40 transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium font-body uppercase tracking-wider text-muted-foreground">Всего пользователей</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-headline">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    <span className="text-green-500 font-bold">+{stats.activeUsers}</span> активных
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/40 transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium font-body uppercase tracking-wider text-muted-foreground">Всего героев</CardTitle>
                  <Sword className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-headline">{stats.totalCharacters}</div>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Сред. уровень: <span className="text-primary font-bold">{stats.avgLevel}</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/40 transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium font-body uppercase tracking-wider text-muted-foreground">Telegram подписки</CardTitle>
                  <MessageSquare className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-headline">{stats.telegramSubs}</div>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    <span className="text-blue-500 font-bold">{stats.activeTelegramSubs}</span> активных
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/40 transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium font-body uppercase tracking-wider text-muted-foreground">Игровые события</CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-headline">{stats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    За последние 24ч
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium font-body uppercase tracking-wider text-muted-foreground">Смертей</CardTitle>
                  <Skull className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-headline">{stats.totalDeaths}</div>
                  <p className="text-xs text-muted-foreground font-body mt-1">За всё время</p>
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium font-body uppercase tracking-wider text-muted-foreground">Сражений</CardTitle>
                  <Sword className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-headline">{stats.totalCombats}</div>
                  <p className="text-xs text-muted-foreground font-body mt-1">За последние 7 дней</p>
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium font-body uppercase tracking-wider text-muted-foreground">Макс. уровень</CardTitle>
                  <Crown className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-headline">{stats.maxLevel}</div>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    {stats.maxLevelCharacter}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Последняя активность
                </CardTitle>
                <CardDescription className="font-body">10 последних созданных героев</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentCharacters.map((char, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-border/20 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold font-body">{char.name}</p>
                        <p className="text-sm text-muted-foreground font-body">
                          Уровень {char.level} • {char.race}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground font-mono">
                          {new Date(char.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive font-headline">⚠️ Не удалось загрузить статистику</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-body">
              <p className="text-muted-foreground">
                Возможные причины:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                <li>Проблемы с подключением к базе данных</li>
                <li>Redis в режиме read-only (проверьте логи)</li>
                <li>Недостаточно прав доступа</li>
              </ul>
              <div className="pt-4">
                <Button onClick={() => window.location.reload()} variant="outline" className="font-body">
                  Перезагрузить страницу
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-border/40 hover:border-primary/40 group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline group-hover:text-primary transition-colors">
                <Database className="h-5 w-5" />
                Менеджер данных
              </CardTitle>
              <CardDescription className="font-body">Управление пользователями, героями и статистикой</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full font-body">
                <Link href="/admin/data-manager">Открыть</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all cursor-pointer border-border/40 hover:border-primary/40 group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline group-hover:text-primary transition-colors">
                <MessageSquare className="h-5 w-5" />
                Telegram Bot
              </CardTitle>
              <CardDescription className="font-body">Настройки и управление telegram-ботом</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full font-body">
                <Link href="/admin/telegram">Открыть</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all cursor-pointer border-border/40 hover:border-primary/40 group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline group-hover:text-primary transition-colors">
                <Database className="h-5 w-5 text-purple-500" />
                Drizzle Studio
              </CardTitle>
              <CardDescription className="font-body">Продвинутый редактор базы данных</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full font-body" variant="outline">
                <Link href="/admin/drizzle-studio">Открыть</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </SectionContainer>
    </PageContainer>
  );
}
