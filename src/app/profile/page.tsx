
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { fetchCharacter, fetchAllItems } from "@/app/dashboard/shared-actions";
import type { Character, CharacterInventoryItem } from "@/types/character";
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
import { PageContainer } from "@/components/layout/page-container";
import { SectionContainer } from "@/components/layout/section-container";

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
    const [allItems, setAllItems] = useState<CharacterInventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeAlive, setTimeAlive] = useState('');

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            const [char, items] = await Promise.all<[Character | null, CharacterInventoryItem[]]>([
                fetchCharacter(user.userId),
                fetchAllItems()
            ]);
            if (char) {
                setCharacter(char);
                setAllItems(items);
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

    // Получить актуальное название предмета из БД
    const getItemName = (itemId: string, fallbackName?: string): string => {
        const dbItem = allItems.find(i => i.id === itemId);
        return dbItem?.name || fallbackName || itemId;
    };

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
        <PageContainer maxWidth="container" className="font-body">
            <div className="absolute top-4 left-4 font-body">
                <Button variant="ghost" asChild className="font-body">
                    <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Назад к игре</Link>
                </Button>
            </div>
            <SectionContainer className="font-body">
                <Card className="border-border/40 bg-card/60 backdrop-blur-sm font-body">
                    <CardHeader className="flex flex-col md:flex-row items-center gap-6 space-y-0 font-body">
                        <Avatar className="h-24 w-24 border-4 border-primary font-body">
                            <AvatarImage src={`https://placehold.co/128x128.png`} data-ai-hint="fantasy character" />
                            <AvatarFallback className="text-3xl font-headline">{character.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1 text-center md:text-left flex-1 font-body">
                            <CardTitle className="text-4xl font-headline">{character.name}</CardTitle>
                            <CardDescription className="text-lg text-muted-foreground font-body">{user.email}</CardDescription>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2 font-body">
                                <Button size="sm" disabled className="font-body">Редактировать профиль</Button>
                                <Button size="sm" className="font-body"
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
                            <div className="mt-4 w-full max-w-md mx-auto md:mx-0">
                                <div className="flex items-center justify-between text-sm mb-1 font-body">
                                    <span className="text-muted-foreground">Уровень {character.level}</span>
                                    <span className="text-muted-foreground">{character.xp.current}/{character.xp.required} XP</span>
                                </div>
                                <Progress value={Math.min(100, (character.xp.current / Math.max(1, character.xp.required)) * 100)} className="h-2" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="stats" className="w-full font-body">
                    <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-4 font-body">
                        <TabsTrigger value="stats" className="font-body">Статистика</TabsTrigger>
                        <TabsTrigger value="achievements" className="font-body">Достижения</TabsTrigger>
                        <TabsTrigger value="timeline" className="font-body">Хронология</TabsTrigger>
                        <TabsTrigger value="inventory" className="font-body">Инвентарь</TabsTrigger>
                        <TabsTrigger value="skills" className="font-body">Навыки</TabsTrigger>
                        <TabsTrigger value="quests" className="font-body">Квесты</TabsTrigger>
                    </TabsList>

                    <TabsContent value="stats" className="font-body">
                        <Card className="border-border/40 font-body">
                            <CardHeader className="font-body">
                                <CardTitle className="flex items-center gap-2 font-headline"><Crown className="text-primary" /> Статистика героя</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 font-body">
                                <div className="flex justify-between items-center font-body">
                                    <span className="text-muted-foreground flex items-center gap-2 font-body"><Heart className="h-4 w-4" />Время в мире:</span>
                                    <span className="font-semibold font-body">{timeAlive}</span>
                                </div>
                                <Separator className="bg-border/40" />
                                <div className="flex justify-between items-center font-body">
                                    <span className="text-muted-foreground flex items-center gap-2 font-body"><Skull className="h-4 w-4" />Смертей:</span>
                                    <span className="font-semibold font-body">{character.deaths}</span>
                                </div>
                                <Separator className="bg-border/40" />
                                <div className="flex justify-between items-center font-body">
                                    <span className="text-muted-foreground flex items-center gap-2 font-body"><Sword className="h-4 w-4" />Убито врагов:</span>
                                    <span className="font-semibold font-body">{Object.values(character.analytics?.killedEnemies || {}).reduce((a: number, b: number) => a + (b || 0), 0)}</span>
                                </div>
                                <Separator className="bg-border/40" />
                                <div className="flex justify-between items-center font-body">
                                    <span className="text-muted-foreground flex items-center gap-2 font-body"><Coins className="h-4 w-4" />Золото:</span>
                                    <span className="font-semibold font-body">{character.inventory.find(i => i.id === 'gold')?.quantity ?? 0}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="achievements" className="font-body">
                        <Card className="border-border/40 font-body">
                            <CardHeader className="font-body">
                                <CardTitle className="flex items-center gap-2 font-headline"><Award className="text-primary" /> Достижения</CardTitle>
                            </CardHeader>
                            <CardContent className="font-body">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 font-body">
                                    {achievements.map((ach) => (
                                        <TooltipProvider key={ach.id}>
                                            <Tooltip delayDuration={180}>
                                                <TooltipTrigger asChild>
                                                    <div className={`flex flex-col items-center justify-center p-4 aspect-square rounded-lg border-2 transition-all ${ach.isUnlocked ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.2)]' : 'border-dashed border-muted-foreground/30 text-muted-foreground/30 grayscale'}`}>
                                                        <Icon name={ach.icon} className="w-10 h-10 mb-2" />
                                                        <span className="text-[10px] text-center font-semibold uppercase tracking-wider">{ach.name}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="font-body">
                                                    <p className="font-bold">{ach.name}</p>
                                                    <p className="text-sm text-muted-foreground">{ach.description}</p>
                                                    {!ach.isUnlocked && <p className="text-xs text-destructive mt-1">(Не получено)</p>}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="timeline" className="font-body">
                        <Card className="border-border/40 font-body">
                            <CardHeader className="font-body">
                                <CardTitle className="font-headline">Недавние действия</CardTitle>
                            </CardHeader>
                            <CardContent className="font-body">
                                {character.actionHistory?.length ? (
                                    <ul className="space-y-2 text-sm text-muted-foreground font-body">
                                        {character.actionHistory.slice(-20).reverse().map((a, idx) => (
                                            <li key={idx} className="flex items-center justify-between font-body py-1 border-b border-border/20 last:border-0">
                                                <span className="capitalize">{a.type}</span>
                                                <span className="font-mono">{new Date(a.timestamp).toLocaleString()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-sm text-muted-foreground font-body">Пока нет записей.</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="inventory" className="font-body">
                        <Card className="border-border/40 font-body">
                            <CardHeader className="font-body">
                                <CardTitle className="font-headline">Инвентарь</CardTitle>
                            </CardHeader>
                            <CardContent className="font-body">
                                {character.inventory?.length ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 font-body">
                                        {character.inventory.map((item, idx) => (
                                            <div key={idx} className="rounded-md border border-border/40 bg-secondary/20 p-3 text-sm flex flex-col gap-1 transition-colors hover:bg-secondary/30">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold font-body">{getItemName(item.id, item.name)}</span>
                                                    <span className="text-primary font-mono font-bold">x{item.quantity}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground font-body capitalize">{item.type}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground font-body">Пусто.</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="skills" className="font-body">
                        <Card className="border-border/40 font-body">
                            <CardHeader className="font-body">
                                <CardTitle className="font-headline">Навыки</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 font-body">
                                {character.skills && Object.entries(character.skills).map(([name, value]) => (
                                    <div key={name} className="rounded-md border border-border/40 bg-secondary/20 p-3 flex flex-col items-center justify-center text-center transition-colors hover:bg-secondary/30 font-body">
                                        <div className="text-xs text-muted-foreground font-body uppercase tracking-tighter mb-1">{name}</div>
                                        <div className="text-2xl font-bold font-headline text-primary">{value as number}</div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="quests" className="font-body">
                        <Card className="border-border/40 font-body">
                            <CardHeader className="font-body">
                                <CardTitle className="font-headline">Квесты</CardTitle>
                            </CardHeader>
                            <CardContent className="font-body">
                                {character.completedQuests?.length ? (
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 font-body">
                                        {character.completedQuests.map((q) => (
                                            <li key={q} className="flex items-center gap-2 font-body p-2 rounded-md bg-secondary/20">
                                                <Award className="h-4 w-4 text-primary" />
                                                {q}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-sm text-muted-foreground font-body">Вы ещё не завершили ни одного квеста.</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </SectionContainer>
        </PageContainer>
    );
}
