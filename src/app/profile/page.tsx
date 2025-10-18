
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import type { Character } from "@/types/character";
import { allAchievements } from "@/data/achievements";
import type { Achievement } from "@/types/achievement";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Award, Calendar, Coins, Crown, Heart, Shield, Sword, Skull, Star, User as UserIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Helper to get a Lucide icon by its string name
const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <Star {...props} />; // Fallback icon
  }
  return <LucideIcon {...props} />;
};


// Function to format time alive
function formatTimeAlive(milliseconds: number): string {
    if (milliseconds < 0) return "Только что родился";

    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    hours = hours % 24;
    minutes = minutes % 60;
    seconds = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} д.`);
    if (hours > 0) parts.push(`${hours} ч.`);
    if (minutes > 0) parts.push(`${minutes} м.`);
    if (parts.length < 3) parts.push(`${seconds} с.`);

    return parts.join(' ');
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth(true);
    const [character, setCharacter] = useState<Character | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeAlive, setTimeAlive] = useState('');

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            const char = await fetchCharacter(user.userId);
            if (char) {
                setCharacter(char);
            } else {
                router.push('/create-character');
            }
            setIsLoading(false);
        };
        loadData();
    }, [user, router]);

    useEffect(() => {
        if (character) {
            const interval = setInterval(() => {
                setTimeAlive(formatTimeAlive(Date.now() - character.createdAt));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [character]);

    if (authLoading || isLoading) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка профиля...</div>;
    }

    if (!user || !character) {
        return null;
    }

    const unlocked = new Set(character.unlockedAchievements || []);
    const achievements: Achievement[] = allAchievements.map(a => ({
        ...a,
        isUnlocked: unlocked.has(a.id)
    }));


    return (
        <div className="flex w-full flex-col bg-background font-body p-4 sm:p-6 md:p-8">
            <div className="absolute top-4 left-4">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Назад к игре</Link>
                </Button>
            </div>
            <div className="w-full space-y-8">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-6 space-y-0">
                        <Avatar className="h-24 w-24 border-4 border-primary">
                            <AvatarImage src={`https://placehold.co/128x128.png`} data-ai-hint="fantasy character" />
                            <AvatarFallback className="text-3xl">{character.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <CardTitle className="text-4xl font-headline">{character.name}</CardTitle>
                            <CardDescription className="text-lg text-muted-foreground">{user.email}</CardDescription>
                            <div className="flex items-center gap-2 pt-2">
                                <Button size="sm" disabled>Редактировать профиль</Button>
                                <Button size="sm"
                                    onClick={async () => {
                                        try {
                                            const getCookie = (name: string) => document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1];
                                            let csrf = getCookie('csrf_token');
                                            if (!csrf) {
                                                try { await fetch('/api/ai', { method: 'GET', cache: 'no-store' }); } catch {}
                                                csrf = getCookie('csrf_token');
                                            }
                                            const resp = await fetch('/api/telegram/link', { method: 'POST', headers: csrf ? { 'x-csrf-token': csrf } : {} });
                                            const isJson = resp.headers.get('content-type')?.includes('application/json');
                                            if (!resp.ok) {
                                                const text = isJson ? JSON.stringify(await resp.json()).slice(0, 200) : await resp.text();
                                                console.error('Telegram link failed', resp.status, text);
                                                return;
                                            }
                                            const data = isJson ? await resp.json() : null;
                                            const deepLink = data?.deepLink as string | undefined;
                                            if (deepLink) {
                                                try {
                                                    const u = new URL(deepLink);
                                                    const bot = u.pathname.replace(/^\//, '');
                                                    const token = u.searchParams.get('start') || '';
                                                    const tgUrl = `tg://resolve?domain=${bot}&start=${encodeURIComponent(token)}`;
                                                    const timer = setTimeout(() => {
                                                        window.open(deepLink, '_blank');
                                                    }, 600);
                                                    window.location.href = tgUrl;
                                                    // If Telegram app opens, the page will lose focus; timer fallback is safe
                                                    // If not, web link opens after 600ms
                                                } catch {
                                                    window.open(deepLink, '_blank');
                                                }
                                            }
                                        } catch (e) {
                                            console.error('Telegram link failed', e);
                                        }
                                    }}
                                >Привязать Telegram</Button>
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Уровень {character.level}</span>
                                    <span className="text-muted-foreground">{character.xp.current}/{character.xp.required} XP</span>
                                </div>
                                <Progress value={Math.min(100, (character.xp.current / Math.max(1, character.xp.required)) * 100)} />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="stats" className="w-full">
                    <TabsList>
                        <TabsTrigger value="stats">Статистика</TabsTrigger>
                        <TabsTrigger value="achievements">Достижения</TabsTrigger>
                        <TabsTrigger value="timeline">Хронология</TabsTrigger>
                        <TabsTrigger value="inventory">Инвентарь</TabsTrigger>
                        <TabsTrigger value="skills">Навыки</TabsTrigger>
                        <TabsTrigger value="quests">Квесты</TabsTrigger>
                    </TabsList>

                    <TabsContent value="stats">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline"><Crown /> Статистика героя</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2"><Heart />Время в мире:</span>
                                    <span className="font-semibold">{timeAlive}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2"><Skull />Смертей:</span>
                                    <span className="font-semibold">{character.deaths}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2"><Sword />Убито врагов:</span>
                                    <span className="font-semibold">{Object.values(character.analytics?.killedEnemies || {}).reduce((a: number, b: number) => a + (b || 0), 0)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2"><Coins />Золото:</span>
                                    <span className="font-semibold">{character.inventory.find(i => i.id === 'gold')?.quantity ?? 0}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="achievements">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline"><Award /> Достижения</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {achievements.map((ach) => (
                                        <TooltipProvider key={ach.id}>
                                            <Tooltip delayDuration={180}>
                                                <TooltipTrigger asChild>
                                                    <div className={`flex items-center justify-center p-3 aspect-square rounded-lg border-2 ${ach.isUnlocked ? 'border-primary bg-primary/20 text-primary' : 'border-dashed border-muted-foreground/50 text-muted-foreground/50'}`}>
                                                        <Icon name={ach.icon} className="w-8 h-8" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-bold">{ach.name}</p>
                                                    <p className="text-sm text-muted-foreground">{ach.description}</p>
                                                    {!ach.isUnlocked && <p className="text-xs text-destructive">(Не получено)</p>}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="timeline">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Недавние действия</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {character.actionHistory?.length ? (
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {character.actionHistory.slice(-20).reverse().map((a, idx) => (
                                            <li key={idx} className="flex items-center justify-between">
                                                <span className="capitalize">{a.type}</span>
                                                <span>{new Date(a.timestamp).toLocaleString()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-sm text-muted-foreground">Пока нет записей.</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="inventory">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Инвентарь</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {character.inventory?.length ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {character.inventory.map((item, idx) => (
                                            <div key={idx} className="rounded-md border p-3 text-sm flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="text-muted-foreground">x{item.quantity}</span>
                                                </div>
                                                <div className="text-muted-foreground">{item.type}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">Пусто.</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="skills">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Навыки</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {Object.entries(character.skills).map(([name, value]) => (
                                    <div key={name} className="rounded-md border p-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="capitalize">{name}</span>
                                            <span className="font-semibold">{value as number}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="quests">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Квесты</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {character.completedQuests?.length ? (
                                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                                        {character.completedQuests.map((q) => (
                                            <li key={q}>{q}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-sm text-muted-foreground">Вы ещё не завершили ни одного квеста.</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
