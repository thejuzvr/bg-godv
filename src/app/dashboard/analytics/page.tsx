
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
import { LineChart, Skull, Dices, Users, Rabbit, Swords, ThumbsUp, ThumbsDown, Bot, BrainCircuit } from 'lucide-react';
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
    const [combatSummary, setCombatSummary] = useState<any | null>(null);
    const [recentBattles, setRecentBattles] = useState<any[]>([]);
    const [openLogIndex, setOpenLogIndex] = useState<number | null>(null);
    const [period, setPeriod] = useState<'all' | '24h' | '7d' | '30d'>('all');
    const [resultFilter, setResultFilter] = useState<'all' | 'victory' | 'defeat' | 'fled'>('all');
    const [perEnemy, setPerEnemy] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                const [char, gData] = await Promise.all([fetchCharacter(user.userId), fetchGameData()]);
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
            } catch (error) {
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
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка аналитики...</div>;
    }

    if (!character || !gameData) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Данные не найдены.</div>;
    }

    const analytics = character.analytics!;
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
            <header>
                <h1 className="text-3xl font-headline text-primary flex items-center gap-3"><LineChart /> Аналитика</h1>
                <p className="text-muted-foreground">Статистика и отчеты о приключениях вашего героя.</p>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Всего убито врагов</CardTitle>
                        <Skull className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalKills}</div>
                        <p className="text-xs text-muted-foreground">поверженных противников</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Мысли (последние 20)</CardTitle>
                        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.epicPhrases?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">ограничены квотой и кулдауном</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Сделано бросков D20</CardTitle>
                        <Dices className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRolls}</div>
                         <p className="text-xs text-muted-foreground">в пылу сражений</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Встречено врагов</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.encounteredEnemies.length}</div>
                         <p className="text-xs text-muted-foreground">уникальных типов</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Крит. успехов (20)</CardTitle>
                        <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{criticalSuccesses}</div>
                        <p className="text-xs text-muted-foreground">блестящих попаданий</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Крит. неудач (1)</CardTitle>
                        <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{criticalFails}</div>
                        <p className="text-xs text-muted-foreground">неловких моментов</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Любимая цель</CardTitle>
                        <Rabbit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">{bestiaryData[0]?.name || 'Никто'}</div>
                        <p className="text-xs text-muted-foreground">Убито: {bestiaryData[0]?.killed || 0} раз</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Аналитика бросков D20</CardTitle>
                        <CardDescription>Как часто выпадают те или иные числа.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={diceChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
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
                 <Card>
                    <CardHeader>
                        <CardTitle>Бестиарий</CardTitle>
                        <CardDescription>Все враги, которых встретил ваш герой.</CardDescription>
                    </CardHeader>
                    <CardContent>
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
            <section className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-2xl font-headline flex items-center gap-2"><Swords /> Боевые отчеты</h2>
                    <div className="flex items-center gap-2">
                        <select className="border rounded px-2 py-1" value={period} onChange={(e) => setPeriod(e.target.value as any)}>
                            <option value="all">За всё время</option>
                            <option value="24h">24 часа</option>
                            <option value="7d">7 дней</option>
                            <option value="30d">30 дней</option>
                        </select>
                        <select className="border rounded px-2 py-1" value={resultFilter} onChange={(e) => setResultFilter(e.target.value as any)}>
                            <option value="all">Все результаты</option>
                            <option value="victory">Победы</option>
                            <option value="defeat">Поражения</option>
                            <option value="fled">Побеги</option>
                        </select>
                    </div>
                </div>

                {/* KPI cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Всего боёв</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{combatSummary?.totalBattles ?? 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Победы</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{combatSummary?.victories ?? 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Поражения</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{combatSummary?.defeats ?? 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Побеги</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{combatSummary?.flees ?? 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Win rate</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{combatSummary ? `${combatSummary.winRate}%` : '0%'}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Всего XP</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{combatSummary?.totalXpGained ?? 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Средн. нанесённый</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{combatSummary?.avgDamageDealt ?? 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Средн. полученный</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{combatSummary?.avgDamageTaken ?? 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Средн. раундов</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{combatSummary?.avgRoundsPerBattle ?? 0}</div></CardContent>
                    </Card>
                </div>

                {/* Recent battles table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Недавние бои</CardTitle>
                        <CardDescription>Последние 10 сражений героя.</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                {recentBattles.map((b, idx) => {
                                    const result = b.fled ? 'Побег' : (b.victory ? 'Победа' : 'Поражение');
                                    const date = new Date(b.timestamp).toLocaleString();
                                    return (
                                        <TableRow key={b.id ?? idx}>
                                            <TableCell className="whitespace-nowrap">{date}</TableCell>
                                            <TableCell className="font-medium">{b.enemyName}</TableCell>
                                            <TableCell>{b.enemyLevel}</TableCell>
                                            <TableCell>{result}</TableCell>
                                            <TableCell className="text-right">{b.roundsCount}</TableCell>
                                            <TableCell className="text-right">{b.damageDealt}</TableCell>
                                            <TableCell className="text-right">{b.damageTaken}</TableCell>
                                            <TableCell className="text-right">{b.xpGained}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog open={openLogIndex === idx} onOpenChange={(open) => setOpenLogIndex(open ? idx : null)}>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="outline">Лог</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Лог боя — {b.enemyName}</DialogTitle>
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
                <div className="grid lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Нанесено vs Получено</CardTitle>
                            <CardDescription>Последние бои: сравнение урона.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={recentBattles.map((b, i) => ({ name: `${i + 1}`, Dealt: b.damageDealt, Taken: b.damageTaken }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                                    <Legend />
                                    <Bar dataKey="Dealt" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                                    <Bar dataKey="Taken" fill="hsl(var(--muted-foreground))" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Раунды в бою</CardTitle>
                            <CardDescription>Длительность последних боёв.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={recentBattles.map((b, i) => ({ name: `${i + 1}`, Rounds: b.roundsCount }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                                    <Bar dataKey="Rounds" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Per-enemy aggregation */}
                <Card>
                    <CardHeader>
                        <CardTitle>Сводка по врагам</CardTitle>
                        <CardDescription>Винрейт и средние показатели по каждому врагу.</CardDescription>
                    </CardHeader>
                    <CardContent>
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BrainCircuit />
                        Мысли героя
                    </CardTitle>
                    <CardDescription>
                        Здесь хранятся уникальные мысли и цели, которые герой "придумал" во время своих приключений.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {analytics.epicPhrases && analytics.epicPhrases.length > 0 ? (
                        <div className="space-y-3">
                            {analytics.epicPhrases.slice().reverse().map((phrase, index) => (
                                <blockquote key={index} className="p-3 border-l-4 border-primary bg-primary/10">
                                    <p className="italic text-foreground">"{phrase}"</p>
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
