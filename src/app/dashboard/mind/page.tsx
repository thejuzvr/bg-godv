
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import type { LucideProps } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGameLoop } from '@/hooks/use-game-loop';
import { useAuth } from "@/hooks/use-auth";

import type { Character, Weather } from "@/types/character";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import { fetchGameData, type GameData } from "@/services/gameDataService";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, BrainCircuit, Eye, Goal, Heart, Target, Cloudy, Sun, Snowflake, Umbrella, MapPin, Smile, Meh, Frown, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';


const PatternChart = ({ value, label, color }: { value: number, label: string, color: string }) => {
  const data = [
    { name: 'value', value, fill: color },
    { name: 'empty', value: 100 - value, fill: 'hsl(var(--card))' },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
        <div className="relative w-24 h-24">
             <ChartContainer
                config={{}}
                className="absolute inset-0 w-full h-full"
            >
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="80%"
                        outerRadius="100%"
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={0}
                        cornerRadius={5}
                    >
                        <Cell key={`cell-0`} fill={data[0].fill} />
                        <Cell key={`cell-1`} fill={data[1].fill} />
                    </Pie>
                </PieChart>
            </ChartContainer>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{value}%</span>
            </div>
        </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
};


const getBehavioralPatterns = (character: Character, gameData: GameData) => {
    let risk = 20;
    let resources = 40;
    let morale = character.mood;
    let social = 30;
    let combat = 20;
    let exploration = 30;

    // Risk
    if (character.stats.health.current / character.stats.health.max > 0.8) risk += 30;
    else if (character.stats.health.current / character.stats.health.max < 0.4) risk -= 20;
    if (character.status === 'in-combat') risk += 50;
    if (character.combat?.fleeAttempted) risk -= 40;

    // Resources
    if (!character.inventory.some(i => i.type === 'potion' && i.effect?.type === 'heal' && i.effect.stat === 'health')) resources += 30;
    const gold = character.inventory.find(i => i.id === 'gold')?.quantity || 0;
    if (gold < 100) resources += 25;
    if (character.currentAction?.type === 'trading') resources += 50;
    const inventoryWeight = character.inventory.reduce((acc, item) => acc + (item.weight * item.quantity), 0);
    const inventoryCapacity = 150 + (character.attributes.strength * 5);
    if (inventoryWeight / inventoryCapacity > 0.9) resources += 20;
    
    // Social
    if (character.currentAction?.type === 'explore' && character.currentAction.name.includes('таверне')) social += 40;
    if (character.currentAction?.type === 'rest') social += 30;
    if (character.location && gameData.locations.find(l => l.id === character.location)?.isSafe) social += 15;


    // Combat
    if (character.status === 'in-combat') combat += 80;
    const currentQuest = character.currentAction?.questId ? gameData.quests.find(q => q.id === character.currentAction!.questId) : null;
    if (currentQuest?.type === 'bounty' || currentQuest?.combatChance) {
        combat += 40;
    }
    if (character.mood > 75) combat += 15;
    if (character.mood < 30) combat -= 15;

    // Exploration
    if (character.currentAction?.type === 'travel') exploration += 60;
    if (character.activeCryptQuest) exploration += 70;
    if (character.currentAction?.type === 'explore') exploration += 40;


    return {
        risk: Math.max(5, Math.min(95, Math.floor(risk))),
        resources: Math.max(5, Math.min(95, Math.floor(resources))),
        morale: Math.max(5, Math.min(95, Math.floor(morale))),
        social: Math.max(5, Math.min(95, Math.floor(social))),
        combat: Math.max(5, Math.min(95, Math.floor(combat))),
        exploration: Math.max(5, Math.min(95, Math.floor(exploration))),
    };
};


const getNeeds = (character: Character) => {
    return [
        { name: 'Здоровье', value: `${((character.stats.health.current / character.stats.health.max) * 100).toFixed(0)}%` },
        { name: 'Энергия', value: `${((character.stats.stamina.current / character.stats.stamina.max) * 100).toFixed(0)}%` },
        { name: 'Магия', value: `${((character.stats.magicka.current / character.stats.magicka.max) * 100).toFixed(0)}%` },
        { name: 'Отдых', value: character.effects.some(e => e.id === 'well_rested') ? '100%' : '20%' },
    ];
};

const getMoodDetails = (mood: number): { description: string, icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>, color: string } => {
    if (mood > 80) return { description: "В восторге", icon: Smile, color: "text-green-400" };
    if (mood > 60) return { description: "В хорошем настроении", icon: Smile, color: "text-green-500" };
    if (mood > 40) return { description: "Нейтральное", icon: Meh, color: "text-yellow-500" };
    if (mood > 20) return { description: "Не в духе", icon: Frown, color: "text-orange-500" };
    return { description: "Подавлен", icon: Frown, color: "text-red-500" };
};


export default function MindPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);

    const [initialCharacter, setInitialCharacter] = useState<Character | null>(null);
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    // Custom hook for the game loop
    const { character } = useGameLoop(initialCharacter, gameData);

    // Data loading effect
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            setDataLoading(true);
            try {
                const char = await fetchCharacter(user.userId);
                if (char) {
                    setInitialCharacter(char);
                    const gData = await fetchGameData();
                    setGameData(gData);
                } else {
                    router.push('/create-character');
                }
            } catch (error) {
                console.error("Failed to load data:", error);
                toast({
                    title: "Ошибка загрузки данных",
                    description: "Не удалось загрузить данные о герое или игровом мире.",
                    variant: "destructive"
                });
            } finally {
                setDataLoading(false);
            }
        };
        loadData();
    }, [user, router, toast]);

    if (authLoading || dataLoading || !character || !gameData) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка сознания героя...</div>;
    }

    const patterns = getBehavioralPatterns(character, gameData);
    const needs = getNeeds(character);
    const currentAction = character.currentAction;
    const moodDetails = getMoodDetails(character.mood);

    const decisionFactorsData = [
        { name: 'Риск', value: patterns.risk },
        { name: 'Цель', value: currentAction ? 90 : 25 },
        { name: 'Адаптация', value: patterns.exploration / 2 + patterns.social / 2 },
    ];
    
    const decisionChartConfig = {
      value: {
        label: "Значение",
      },
      name: {
        label: "Фактор"
      }
    } satisfies ChartConfig

    const moodFactorsData = [];
    if (character.status === 'in-combat') moodFactorsData.push({ name: 'Бой', value: 1, fill: 'hsl(var(--chart-1))' });
    if (character.stats.health.current < character.stats.health.max) moodFactorsData.push({ name: 'Ранения', value: 1, fill: 'hsl(var(--chart-2))' });
    if (character.effects.some(e => e.id === 'well_rested')) moodFactorsData.push({ name: 'Отдых', value: 1, fill: 'hsl(var(--chart-3))' });
    if (character.mood > 80) moodFactorsData.push({ name: 'Эйфория', value: 1, fill: 'hsl(var(--chart-4))' });
    if (moodFactorsData.length === 0) moodFactorsData.push({ name: 'Стабильность', value: 1, fill: 'hsl(var(--chart-5))' });
    
    const moodChartConfig = Object.fromEntries(moodFactorsData.map(f => [f.name, {label: f.name, color: f.fill}])) satisfies ChartConfig;

    const moodFactors = [];
    if (character.status === 'in-combat') moodFactors.push({ name: "В бою", positive: false });
    if (character.stats.health.current < character.stats.health.max) moodFactors.push({ name: "Ранен", positive: false });
    if (character.effects.some(e => e.id === 'well_rested')) moodFactors.push({ name: "Хорошо отдохнул", positive: true });
    if (character.mood > 80) moodFactors.push({ name: "Эйфория", positive: true });


    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 font-body p-4 md:p-8">
            {/* Column 1 */}
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <Activity className="text-primary" />
                            Анализ Поведенческих Паттернов
                        </CardTitle>
                        <CardDescription>Динамические показатели, влияющие на решения героя</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 md:grid-cols-3 gap-y-6 gap-x-2">
                        <PatternChart value={patterns.risk} label="Риск" color="hsl(var(--destructive))" />
                        <PatternChart value={patterns.resources} label="Ресурсы" color="hsl(var(--chart-1))" />
                        <PatternChart value={patterns.morale} label="Мораль" color="hsl(var(--chart-2))" />
                        <PatternChart value={patterns.social} label="Социум" color="hsl(var(--chart-3))" />
                        <PatternChart value={patterns.combat} label="Боевое" color="hsl(var(--chart-4))" />
                        <PatternChart value={patterns.exploration} label="Исследование" color="hsl(var(--chart-5))" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <Goal className="text-primary" />
                            Факторы принятия решений
                        </CardTitle>
                        <CardDescription>Аналитика текущего поведения</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={decisionChartConfig} className="mx-auto aspect-square max-h-[350px]">
                            <RadarChart data={decisionFactorsData} outerRadius="70%">
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <PolarGrid />
                                <PolarAngleAxis dataKey="name" />
                                <Radar
                                    dataKey="value"
                                    fill="hsl(var(--chart-1))"
                                    fillOpacity={0.6}
                                    stroke="hsl(var(--chart-1))"
                                />
                            </RadarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <moodDetails.icon className={moodDetails.color} />
                            Эмоциональное состояние
                        </CardTitle>
                        <CardDescription>Текущее настроение и влияющие на него факторы</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">{moodDetails.description}</span>
                                <span className="text-sm font-mono text-muted-foreground">{character.mood.toFixed(0)} / 100</span>
                            </div>
                            <Progress value={character.mood} className={`[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:via-yellow-500 [&>div]:to-green-500`} />
                        </div>
                         <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-2">Факторы</p>
                            <div className="space-y-2">
                                {moodFactors.length > 0 ? moodFactors.map((factor, i) => (
                                     <div key={i} className="flex items-center text-sm">
                                        {factor.positive ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> : <XCircle className="w-4 h-4 mr-2 text-destructive"/>}
                                        {factor.name}
                                     </div>
                                )) : <p className="text-sm text-muted-foreground">Настроение стабильно.</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <Target className="text-primary" />
                            Текущее решение
                        </CardTitle>
                        <CardDescription>Что сейчас делает герой</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-bold text-lg">{currentAction?.name || character.status}</p>
                            <p className="text-sm text-muted-foreground">{currentAction?.description || "Наблюдает за миром, решая, что делать дальше."}</p>
                        </div>
                        {currentAction && (
                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                                <Clock className="w-4 h-4"/>
                                <span>{((currentAction.duration - (Date.now() - currentAction.startedAt)) / 1000).toFixed(0)}s осталось</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <Eye className="text-primary" />
                            Влияние на настроение
                        </CardTitle>
                        <CardDescription>Что сейчас влияет на эмоции</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center pb-6">
                         <ChartContainer config={moodChartConfig} className="mx-auto aspect-square max-h-[250px]">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie data={moodFactorsData} dataKey="value" nameKey="name" cx="50%" cy="50%">
                                     {moodFactorsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <Heart className="text-primary" />
                            Потребности
                        </CardTitle>
                        <CardDescription>Текущие нужды героя</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            {needs.map((need, index) => (
                                <div key={need.name} className={`p-3 rounded-lg border text-center bg-card-foreground/5`}>
                                    <div className="text-2xl font-bold">{need.value}</div>
                                    <div className="text-xs text-muted-foreground">{need.name}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
