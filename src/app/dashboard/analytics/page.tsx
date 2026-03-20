
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { fetchCharacter } from '@/app/dashboard/shared-actions';
import { fetchGameData } from '@/services/gameDataService';
import type { Character } from '@/types/character';
import type { GameData } from '@/services/gameDataService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Skull, Dices, Users, Rabbit, Swords, ThumbsUp, ThumbsDown, BrainCircuit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AnalyticsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);
    const [character, setCharacter] = useState<Character | null>(null);
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [combatSummary, setCombatSummary] = useState<Record<string, string | number> | null>(null);
    const [recentBattles, setRecentBattles] = useState<Record<string, string | number | string[]>[]>([]);
    const [openLogIndex, setOpenLogIndex] = useState<number | null>(null);
    const [period, setPeriod] = useState<'all' | '24h' | '7d' | '30d'>('all');
    const [resultFilter, setResultFilter] = useState<'all' | 'victory' | 'defeat' | 'fled'>('all');
    const [perEnemy, setPerEnemy] = useState<Record<string, string | number>[]>([]);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                const [char, gData] = await Promise.all<[Character | null, GameData]>([fetchCharacter(user.userId), fetchGameData()]);
                if (char) {
                    setCharacter(char);
                    setGameData(gData);
                    // Fetch combat analytics
                    try {
                        const res = await fetch(`/api/combat-analytics?characterId=${user.userId}`, { cache: 'no-store' });
                        if (res.ok) {
                            const data = await res.json();
                            setCombatSummary(data.summary);
                            setRecentBattles(data.recent || []);
                            setPerEnemy(data.perEnemy || []);
                        }
                    } catch {}
                } else {
                    router.push('/create-character');
                }
            } catch {
                toast({ title: "Ошибка", description: "Не удалось загрузить данные для аналитики.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, router, toast]);

    // Refetch when filters change (must be declared before any early returns to keep hooks order stable)
    useEffect(() => {
        if (!user) return;
        const run = async () => {
            const params = new URLSearchParams({ characterId: user.userId });
            if (period !== 'all') params.set('period', period);
            if (resultFilter !== 'all') params.set('result', resultFilter);
            const res = await fetch(`/api/combat-analytics?${params.toString()}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setCombatSummary(data.summary);
                setRecentBattles(data.recent || []);
                setPerEnemy(data.perEnemy || []);
            }
        };
        run();
    }, [user, period, resultFilter]);

    if (authLoading || isLoading) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl font-body">Загрузка аналитики...</div>;
    }

    if (!character || !gameData) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl font-body">Данные не найдены.</div>;
    }

    const analytics = character.analytics;
    const totalKills = Object.values(analytics.killedEnemies).reduce((a, b) => a + b, 0);
    const totalRolls = analytics.diceRolls.d20.slice(1).reduce((a, b) => a + b, 0);
    const criticalSuccesses = analytics.diceRolls.d20[20];
    const criticalFails = analytics.diceRolls.d20[1];


    const diceChartData = analytics.diceRolls.d20.slice(1).map((count, index) => ({
        name: `${index + 1}`,
        'Броски': count,
    }));
    
    const bestiaryData = analytics.encounteredEnemies.map(enemyId => {
        const enemyInfo = gameData.enemies.find(e => e.id === enemyId);
        return {
            id: enemyId,
            name: enemyInfo?.name || 'Неизвестный враг',
            level: enemyInfo?.level || 1,
            killed: analytics.killedEnemies[enemyId] || 0,
        };
    }).sort((a,b) => b.killed - a.killed);

    

    return (
        <div className="w-full font-body p-4 md:p-8 space-y-8">
            <header className="font-body">
                <h1 className="text-3xl font-headline text-primary flex items-center gap-3 font-body"><LineChart /> Аналитика</h1>
                <p className="text-muted-foreground font-body">Статистика и отчеты о приключениях вашего героя.</p>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 font-body">
                <Card className="font-body">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 font-body">
                        <CardTitle className="text-sm font-medium font-body">Всего убито врагов</CardTitle>
                        <Skull className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="font-body">
                        <div className="text-2xl font-bold font-body">{totalKills}</div>
                        <p className="text-xs text-muted-foreground font-body">поверженных противников</p>
                    </CardContent>
                </Card>
                <Card className="font-body">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 font-body">
                        <CardTitle className="text-sm font-medium font-body">Мысли (последние 20)</CardTitle>
                        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="font-body">
                        <div className="text-2xl font-bold font-body">{analytics.epicPhrases?.length || 0}</div>
                        <p className="text-xs text-muted-foreground font-body">ограничены квотой и кулдауном</p>
                    </CardContent>
                </Card>
                <Card className="font-body">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 font-body">
                        <CardTitle className="text-sm font-medium font-body">Сделано бросков D20</CardTitle>
                        <Dices className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="font-body">
                        <div className="text-2xl font-bold font-body">{totalRolls}</div>
                         <p className="text-xs text-muted-foreground font-body">в пылу сражений</p>
                    </CardContent>
                </Card>
                <Card className="font-body">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 font-body">
                        <CardTitle className="text-sm font-medium font-body">Встречено врагов</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="font-body">
                        <div className="text-2xl font-bold font-body">{analytics.encounteredEnemies.length}</div>
                         <p className="text-xs text-muted-foreground font-body">уникальных типов</p>
                    </CardContent>
                </Card>
                <Card className="font-body">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 font-body">
                        <CardTitle className="text-sm font-medium font-body">Крит. успехов (20)</CardTitle>
                        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="font-body">
                        <div className="text-2xl font-bold font-body">{criticalSuccesses}</div>
                        <p className="text-xs text-muted-foreground font-body">блестящих попаданий</p>
                    </CardContent>
                </Card>
                 <Card className="font-body">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 font-body">
                        <CardTitle className="text-sm font-medium font-body">Крит. неудач (1)</CardTitle>
                        <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="font-body">
                        <div className="text-2xl font-bold font-body">{criticalFails}</div>
                        <p className="text-xs text-muted-foreground font-body">неловких моментов</p>
                    </CardContent>
                </Card>
                 <Card className="font-body">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 font-body">
                        <CardTitle className="text-sm font-medium font-body">Любимая цель</CardTitle>
                        <Rabbit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="font-body">
                        <div className="text-2xl font-bold truncate font-body">{bestiaryData[0]?.name || 'Никто'}</div>
                        <p className="text-xs text-muted-foreground font-body">Убито: {bestiaryData[0]?.killed || 0} раз</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 font-body">
                <Card className="font-body">
                    <CardHeader className="font-body">
                        <CardTitle className="font-headline">Аналитика бросков D20</CardTitle>
                        <CardDescription className="font-body">Как часто выпадают те или иные числа.</CardDescription>
                    </CardHeader>
                    <CardContent className="font-body">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={diceChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                    }}
                                />
                                <Bar dataKey="Броски" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card className="font-body">
                    <CardHeader className="font-body">
                        <CardTitle className="font-headline">Бестиарий</CardTitle>
                        <CardDescription className="font-body">Все враги, которых встретил ваш герой.</CardDescription>
                    </CardHeader>
                    <CardContent className="font-body">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Имя</TableHead>
                                    <TableHead>Уровень</TableHead>
                                    <TableHead className="text-right">Убито</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bestiaryData.map((enemy) => (
                                    <TableRow key={enemy.id}>
                                        <TableCell className="font-medium">{enemy.name}</TableCell>
                                        <TableCell>{enemy.level}</TableCell>
                                        <TableCell className="text-right">{enemy.killed}</TableCell>
                                    </TableRow>
                                ))}
                                {bestiaryData.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">Герой еще не встретил ни одного врага.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            {/* Боевые отчеты */}
            <section className="space-y-4 font-body">
                <div className="flex items-center justify-between gap-4 flex-wrap font-body">
                    <h2 className="text-2xl font-headline flex items-center gap-2 font-body"><Swords /> Боевые отчеты</h2>
                    <div className="flex items-center gap-2 font-body">
                        <select className="border rounded px-2 py-1 bg-background text-foreground font-body" value={period} onChange={(e) => setPeriod(e.target.value as "all" | "24h" | "7d" | "30d")}>
                            <option value="all">За всё время</option>
                            <option value="24h">24 часа</option>
                            <option value="7d">7 дней</option>
                            <option value="30d">30 дней</option>
                        </select>
                        <select className="border rounded px-2 py-1 bg-background text-foreground font-body" value={resultFilter} onChange={(e) => setResultFilter(e.target.value as "all" | "victory" | "defeat" | "fled")}>
                            <option value="all">Все результаты</option>
                            <option value="victory">Победы</option>
                            <option value="defeat">Поражения</option>
                            <option value="fled">Побеги</option>
                        </select>
                    </div>
                </div>

                {/* KPI cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 font-body">
                    <Card className="font-body">
                        <CardHeader className="pb-2 font-body"><CardTitle className="text-sm font-body">Всего боёв</CardTitle></CardHeader>
                        <CardContent className="font-body"><div className="text-2xl font-bold font-body">{combatSummary?.totalBattles ?? 0}</div></CardContent>
                    </Card>
                    <Card className="font-body">
                        <CardHeader className="pb-2 font-body"><CardTitle className="text-sm font-body">Победы</CardTitle></CardHeader>
                        <CardContent className="font-body"><div className="text-2xl font-bold font-body">{combatSummary?.victories ?? 0}</div></CardContent>
                    </Card>
                    <Card className="font-body">
                        <CardHeader className="pb-2 font-body"><CardTitle className="text-sm font-body">Поражения</CardTitle></CardHeader>
                        <CardContent className="font-body"><div className="text-2xl font-bold font-body">{combatSummary?.defeats ?? 0}</div></CardContent>
                    </Card>
                    <Card className="font-body">
                        <CardHeader className="pb-2 font-body"><CardTitle className="text-sm font-body">Побеги</CardTitle></CardHeader>
                        <CardContent className="font-body"><div className="text-2xl font-bold font-body">{combatSummary?.flees ?? 0}</div></CardContent>
                    </Card>
                    <Card className="font-body">
                        <CardHeader className="pb-2 font-body"><CardTitle className="text-sm font-body">Win rate</CardTitle></CardHeader>
                        <CardContent className="font-body"><div className="text-2xl font-bold font-body">{combatSummary ? `${combatSummary.winRate}%` : '0%'}</div></CardContent>
                    </Card>
                    <Card className="font-body">
                        <CardHeader className="pb-2 font-body"><CardTitle className="text-sm font-body">Всего XP</CardTitle></CardHeader>
                        <CardContent className="font-body"><div className="text-2xl font-bold font-body">{combatSummary?.totalXpGained ?? 0}</div></CardContent>
                    </Card>
                    <Card className="font-body">
                        <CardHeader className="pb-2 font-body"><CardTitle className="text-sm font-body">Средн. нанесённый</CardTitle></CardHeader>
                        <CardContent className="font-body"><div className="text-2xl font-bold font-body">{combatSummary?.avgDamageDealt ?? 0}</div></CardContent>
                    </Card>
                    <Card className="font-body">
                        <CardHeader className="pb-2 font-body"><CardTitle className="text-sm font-body">Средн. полученный</CardTitle></CardHeader>
                        <CardContent className="font-body"><div className="text-2xl font-bold font-body">{combatSummary?.avgDamageTaken ?? 0}</div></CardContent>
                    </Card>
                    <Card className="font-body">
                        <CardHeader className="pb-2 font-body"><CardTitle className="text-sm font-body">Средн. раундов</CardTitle></CardHeader>
                        <CardContent className="font-body"><div className="text-2xl font-bold font-body">{combatSummary?.avgRoundsPerBattle ?? 0}</div></CardContent>
                    </Card>
                </div>

                {/* Recent battles table */}
                <Card className="font-body">
                    <CardHeader className="font-body">
                        <CardTitle className="font-headline">Недавние бои</CardTitle>
                        <CardDescription className="font-body">Последние 10 сражений героя.</CardDescription>
                    </CardHeader>
                    <CardContent className="font-body">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Дата</TableHead>
                                    <TableHead>Враг</TableHead>
                                    <TableHead>Уровень</TableHead>
                                    <TableHead>Результат</TableHead>
                                    <TableHead className="text-right">Раунды</TableHead>
                                    <TableHead className="text-right">Нанесено</TableHead>
                                    <TableHead className="text-right">Получено</TableHead>
                                    <TableHead className="text-right">XP</TableHead>
                                    <TableHead className="text-right">Лог</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentBattles.map((b, idx: number) => {
                                    const result = b.fled ? 'Побег' : (b.victory ? 'Победа' : 'Поражение');
                                    const date = new Date(b.timestamp as string).toLocaleString();
                                    return (
                                        <TableRow key={b.id ?? idx}>
                                            <TableCell className="whitespace-nowrap">{date}</TableCell>
                                            <TableCell className="font-medium">{b.enemyName as string}</TableCell>
                                            <TableCell>{b.enemyLevel as number}</TableCell>
                                            <TableCell>{result}</TableCell>
                                            <TableCell className="text-right">{b.roundsCount as number}</TableCell>
                                            <TableCell className="text-right">{b.damageDealt as number}</TableCell>
                                            <TableCell className="text-right">{b.damageTaken as number}</TableCell>
                                            <TableCell className="text-right">{b.xpGained as number}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog open={openLogIndex === idx} onOpenChange={(open) => setOpenLogIndex(open ? idx : null)}>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="outline">Лог</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Лог боя — {b.enemyName as string}</DialogTitle>
                                                        </DialogHeader>
                                                        <pre className="whitespace-pre-wrap text-sm max-h-[60vh] overflow-auto">{(b.combatLog || []).join('\n')}</pre>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {recentBattles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground">Недавних боёв пока нет.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-8 font-body">
                    <Card className="font-body">
                        <CardHeader className="font-body">
                            <CardTitle className="font-headline">Нанесено vs Получено</CardTitle>
                            <CardDescription className="font-body">Последние бои: сравнение урона.</CardDescription>
                        </CardHeader>
                        <CardContent className="font-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={recentBattles.map((b, i) => ({ name: `${i + 1}`, Dealt: b.damageDealt, Taken: b.damageTaken }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                                    <Legend />
                                    <Bar dataKey="Dealt" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                                    <Bar dataKey="Taken" fill="hsl(var(--muted-foreground))" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="font-body">
                        <CardHeader className="font-body">
                            <CardTitle className="font-headline">Раунды в бою</CardTitle>
                            <CardDescription className="font-body">Длительность последних боёв.</CardDescription>
                        </CardHeader>
                        <CardContent className="font-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={recentBattles.map((b, i) => ({ name: `${i + 1}`, Rounds: b.roundsCount }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                                    <Bar dataKey="Rounds" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Per-enemy aggregation */}
                <Card className="font-body">
                    <CardHeader className="font-body">
                        <CardTitle className="font-headline">Сводка по врагам</CardTitle>
                        <CardDescription className="font-body">Винрейт и средние показатели по каждому врагу.</CardDescription>
                    </CardHeader>
                    <CardContent className="font-body">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Враг</TableHead>
                                    <TableHead className="text-right">Бои</TableHead>
                                    <TableHead className="text-right">Winrate</TableHead>
                                    <TableHead className="text-right">Победы</TableHead>
                                    <TableHead className="text-right">Поражения</TableHead>
                                    <TableHead className="text-right">Побеги</TableHead>
                                    <TableHead className="text-right">Ø Нанесено</TableHead>
                                    <TableHead className="text-right">Ø Получено</TableHead>
                                    <TableHead className="text-right">Ø Раундов</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {perEnemy.map((e) => (
                                    <TableRow key={e.enemyId}>
                                        <TableCell className="font-medium">{e.enemyName}</TableCell>
                                        <TableCell className="text-right">{e.battles}</TableCell>
                                        <TableCell className="text-right">{e.winRate}%</TableCell>
                                        <TableCell className="text-right">{e.wins}</TableCell>
                                        <TableCell className="text-right">{e.defeats}</TableCell>
                                        <TableCell className="text-right">{e.flees}</TableCell>
                                        <TableCell className="text-right">{e.avgDealt}</TableCell>
                                        <TableCell className="text-right">{e.avgTaken}</TableCell>
                                        <TableCell className="text-right">{e.avgRounds}</TableCell>
                                    </TableRow>
                                ))}
                                {perEnemy.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground">Нет данных по врагам для выбранных фильтров.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>

            <Card className="font-body">
                <CardHeader className="font-body">
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <BrainCircuit />
                        Мысли героя
                    </CardTitle>
                    <CardDescription className="font-body">
                        Здесь хранятся уникальные мысли и цели, которые герой &quot;придумал&quot; во время своих приключений.
                    </CardDescription>
                </CardHeader>
                <CardContent className="font-body">
                    {analytics.epicPhrases && analytics.epicPhrases.length > 0 ? (
                        <div className="space-y-3">
                            {analytics.epicPhrases.slice().reverse().map((phrase, index) => (
                                <blockquote key={index} className="p-3 border-l-4 border-primary bg-primary/10">
                                    <p className="italic text-foreground">&quot;{phrase}&quot;</p>
                                </blockquote>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">Герой пока ни о чем глубоко не размышлял.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
