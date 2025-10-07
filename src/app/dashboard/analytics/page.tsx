
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

export default function AnalyticsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);
    const [character, setCharacter] = useState<Character | null>(null);
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                const [char, gData] = await Promise.all([fetchCharacter(user.userId), fetchGameData()]);
                if (char) {
                    setCharacter(char);
                    setGameData(gData);
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
