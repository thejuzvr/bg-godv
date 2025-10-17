
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useGameLoop } from '@/hooks/use-game-loop';
import { useAuth } from "@/hooks/use-auth";

import type { Character, Weather } from "@/types/character";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import { fetchGameData, type GameData } from "@/services/gameDataService";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from '@/components/ui/button';
import { MapPin, Coins, Skull, Zap, Sparkles, CloudRain, Loader2, BookOpen, Smile, Meh, Frown, Star, Gem, HandHelping, BrainCircuit, Cloud } from "lucide-react";
import type { LucideProps } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { EquipmentPanel } from '@/components/dashboard/equipment-panel';
import { EffectsPanel } from '@/components/dashboard/effects-panel';
import { SpellsPanel } from '@/components/dashboard/spells-panel';
import { ActionProgressPanel, CryptExplorationPanel } from '@/components/dashboard/action-panels';
import { CombatLogPanel, CombatStatusPanel } from '@/components/dashboard/combat-panels';
import { SovngardeStatusPanel, SleepingStatusPanel, SovngardeConditionsPanel, DiseaseStatusPanel } from '@/components/dashboard/status-panels';
import { performIntervention } from "./actions";
import { RealTimeClock } from '@/components/dashboard/RealTimeClock';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeatherPanel } from '@/components/dashboard/weather-panel';
import { GameTimeClock } from '@/components/dashboard/GameTimeClock';
import { allDivinities } from '@/data/divinities';

const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <Star {...props} />; // Fallback icon
  }
  return <LucideIcon {...props} />;
};


const getMoodDetails = (mood: number): { description: string, icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>, color: string } => {
    if (mood > 80) return { description: "В восторге", icon: Smile, color: "text-green-400" };
    if (mood > 60) return { description: "В хорошем настроении", icon: Smile, color: "text-green-500" };
    if (mood > 40) return { description: "Нейтральное", icon: Meh, color: "text-yellow-500" };
    if (mood > 20) return { description: "Не в духе", icon: Frown, color: "text-orange-500" };
    return { description: "Подавлен", icon: Frown, color: "text-red-500" };
};

const TempleProgressPanel = ({ character }: { character: Character }) => {
    const deity = allDivinities.find(d => d.id === character.patronDeity);
    if (!deity) return null;

    const TEMPLE_GOAL = 2000000;
    const progress = (character.templeProgress / TEMPLE_GOAL) * 100;

    return (
        <div>
            <Separator />
            <div className="pt-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                    <Icon name={deity.icon} className="h-5 w-5 text-primary" />
                    Храм Покровителя
                </Label>
                <div className="mt-2">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Прогресс</span>
                        <span className="text-sm font-mono text-muted-foreground">{progress.toFixed(4)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <p className="text-xs text-muted-foreground text-center mt-2">{character.templeProgress.toLocaleString()} / {TEMPLE_GOAL.toLocaleString()} золота</p>
                </div>
            </div>
        </div>
    );
};

const DivineFavorPanel = ({ character }: { character: Character }) => {
    const deity = allDivinities.find(d => d.id === character.patronDeity);
    if (!deity) return null;

    const progress = character.divineFavor || 0;

    return (
        <div>
            <Separator />
            <div className="pt-4">
                 <Label className="text-base font-semibold flex items-center gap-2">
                    <HandHelping className="h-5 w-5 text-primary" />
                    Божественное Благоволение
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Накопите 100 очков, чтобы получить благословение.</p>
                <div className="mt-2">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Прогресс</span>
                        <span className="text-sm font-mono text-muted-foreground">{progress} / 100</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                </div>
            </div>
        </div>
    );
};


export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth(true);
  
  const [initialCharacter, setInitialCharacter] = useState<Character | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isIntervening, setIsIntervening] = useState(false);
  const [logLimit, setLogLimit] = useState<number>(10);

  // Load saved log limit from localStorage on mount
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('adventureLogLimit') : null;
      if (saved) {
        const n = Number(saved);
        if (n === 5 || n === 10 || n === 40) setLogLimit(n);
      }
    } catch {}
  }, []);
  
  // Custom hook for the game loop
  const { character, adventureLog, combatLog, setCharacter, refreshOfflineEvents } = useGameLoop(initialCharacter, gameData, { adventureLimit: logLimit });

  const processedAdventureLog = useMemo(() => {
    if (!adventureLog) return [];
    // Sort strictly by timestamp desc and dedupe by id
    const sorted = [...adventureLog].sort((a: any, b: any) => b.timestamp - a.timestamp);
    const seen = new Set<string>();
    const deduped = [] as any[];
    for (const item of sorted) {
      const key = (item as any).id ?? `${(item as any).timestamp}-${(item as any).message}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }
    return deduped.slice(0, logLimit);
  }, [adventureLog, logLimit]);

  const adventureLogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (adventureLogRef.current) {
        const viewport = adventureLogRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = 0;
        }
    }
  }, [adventureLog]);

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
                description: "Не удалось загрузить данные о герое или игровом мире. Проверьте консоль.",
                variant: "destructive"
            });
        } finally {
            setDataLoading(false);
        }
    };
    loadData();
  }, [user, router, toast]);

  const handleIntervention = async (type: 'bless' | 'punish') => {
    if (!character || !user) return;
    const INTERVENTION_COST = 50;

    if (character.interventionPower.current < INTERVENTION_COST) {
      toast({
        title: "Недостаточно силы",
        description: `Высшим силам нужно больше мощи для вмешательства. Текущая сила: ${character.interventionPower.current}/${character.interventionPower.max}.`,
        variant: "destructive",
      });
      return;
    }

    setIsIntervening(true);
    const result = await performIntervention(user.userId, type);

    if (result.success && result.character) {
      setCharacter(result.character);
      // Immediately refresh logs so the message appears without full page reload
      refreshOfflineEvents();
      toast({
        title: "Вмешательство удалось!",
        description: `Герой подумал: "${result.message}"`
      });
    } else {
      toast({
        title: "Ошибка вмешательства",
        description: result.message,
        variant: "destructive",
      });
    }

    setIsIntervening(false);
  };

  if (authLoading || dataLoading || !character || !gameData) {
    return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка данных о герое и мире...</div>;
  }
    
  const raceName = {
    'nord': 'Норд', 'dunmer': 'Данмер', 'altmer': 'Альтмер',
    'bosmer': 'Босмер', 'khajiit': 'Каджит', 'argonian': 'Аргонианин'
  }[character.race] || character.race;
  const locationName = gameData.locations.find(l => l.id === character.location)?.name || character.location;
  const goldAmount = character.inventory.find(i => i.id === 'gold')?.quantity || 0;
  const isEffectivelyDead = character.status === 'dead' || (character.respawnAt && character.respawnAt > Date.now());
  const moodDetails = getMoodDetails(character.mood);


  const statusTranslations: Record<Character['status'], string> = {
    'idle': 'Бездействует',
    'in-combat': 'Сражается',
    'dead': 'В Совнгарде',
    'sleeping': 'Спит',
    'busy': character.currentAction?.type === 'travel' ? 'Путешествует' : 'Занят делом',
    'exploring': 'Исследует склеп',
  };
  const characterStatus = statusTranslations[character.status];

  const handleLogLimitChange = (value: string) => {
    const n = Number(value);
    setLogLimit(n);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('adventureLogLimit', String(n));
      }
    } catch {}
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8 p-4 md:p-8">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-4 md:gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                         <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="viking warrior" />
                         <AvatarFallback>{character.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                         <CardTitle className="font-headline text-2xl">{character.name}</CardTitle>
                         <CardDescription>Уровень {character.level} {raceName}</CardDescription>
                         <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4"/>
                            <span>{locationName}</span>
                         </div>
                         <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <moodDetails.icon className={`h-4 w-4 ${moodDetails.color}`}/>
                            <span className={moodDetails.color}>{moodDetails.description}</span>
                         </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-sm text-center bg-secondary/50 p-2 rounded-md">
                        <span className="font-bold text-primary">{characterStatus}</span>
                        {character.currentAction && ` (${character.currentAction.name})`}
                     </p>
                    <EquipmentPanel character={character} />
                    <EffectsPanel effects={character.effects} />
                    <SpellsPanel character={character} />
                    <TempleProgressPanel character={character} />
                    <DivineFavorPanel character={character} />
                </CardContent>
            </Card>
        </div>

        {/* Center Column */}
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-8">
            {isEffectivelyDead ? (
                <SovngardeStatusPanel character={character} gameData={gameData} />
            ) : character.status === 'exploring' && character.activeCryptQuest ? (
                <CryptExplorationPanel character={character} />
            ) : character.currentAction ? (
                <ActionProgressPanel character={character} gameData={gameData} />
            ) : character.status === 'in-combat' && character.combat ? (
                 <div className="grid md:grid-cols-2 gap-4">
                    <CombatStatusPanel character={character} combatState={character.combat} />
                    <CombatLogPanel log={combatLog} />
                </div>
            ) : character.status === 'sleeping' ? (
                <SleepingStatusPanel character={character} />
            ) : null}

            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <CardTitle className="font-headline">Журнал приключений</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="log-limit" className="text-xs text-muted-foreground whitespace-nowrap">Показывать:</Label>
                            <Select value={String(logLimit)} onValueChange={handleLogLimitChange}>
                                <SelectTrigger id="log-limit" className="h-8 w-[70px]">
                                    <SelectValue placeholder="Limit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="40">40</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <CardDescription>
                    Хроника путешествий, мыслей и деяний вашего героя.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                    <ScrollArea className="h-72 w-full flex-1" ref={adventureLogRef}>
                      <div className="space-y-4 pr-4">
                        {processedAdventureLog.map((log: any, index) => {
                          const msg: string = String(log.message || "");
                          const time = new Date(log.timestamp).toLocaleTimeString();
                          let text = msg;
                          let icon: React.ReactNode | null = null;
                          // Thoughts
                          if (text.startsWith('У героя родилась мысль:')) {
                            icon = <BrainCircuit className="h-4 w-4" />;
                            text = text.replace(/^У героя родилась мысль:\s*/u, '').replace(/^"|"$/g, '');
                          } else if (text.startsWith('🎭 Мысли героя:')) {
                            icon = <BrainCircuit className="h-4 w-4" />;
                            text = text.replace(/^🎭 Мысли героя:\s*/u, '').replace(/^"|"$/g, '');
                          }
                          // Weather changes/effects
                          if (text.startsWith('Погода изменилась:')) {
                            icon = <Cloud className="h-4 w-4" />;
                            text = text.replace(/^Погода изменилась:\s*/u, '');
                          } else if (!icon && /\bпогода\b/i.test(text)) {
                            icon = <Cloud className="h-4 w-4" />;
                          }
                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="font-mono text-muted-foreground mt-0.5">[{time}]</span>
                                {icon ? (
                                  <div className="mt-0.5 text-primary">{icon}</div>
                                ) : null}
                                <p className="text-sm text-foreground/90 flex-1">{text}</p>
                              </div>
                              { index < processedAdventureLog.length - 1 && <Separator /> }
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col gap-4 md:gap-8">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Игровое время</CardTitle>
                </CardHeader>
                <CardContent>
                    <GameTimeClock gameDate={character.gameDate} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Реальное время</CardTitle>
                </CardHeader>
                <CardContent>
                     <RealTimeClock />
                </CardContent>
            </Card>
             {isEffectivelyDead ? (
                <SovngardeConditionsPanel />
             ) : (
                <WeatherPanel character={character} />
             )}
             <DiseaseStatusPanel character={character} />
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Пульт Вмешательства
                    </CardTitle>
                    <CardDescription>
                        Направляйте своего героя или просто наблюдайте. Каждое действие тратит 50 ед. силы.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                         <div className="flex justify-between items-center mb-1">
                            <Label className="font-semibold">Сила Вмешательства</Label>
                            <span className="text-sm font-mono text-muted-foreground">{character.interventionPower.current} / {character.interventionPower.max}</span>
                        </div>
                        <Progress value={(character.interventionPower.current / character.interventionPower.max) * 100} className="h-3" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Button onClick={() => handleIntervention('bless')} disabled={isIntervening || character.interventionPower.current < 50}>
                            {isIntervening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4"/>}
                            Благословить
                        </Button>
                        <Button variant="destructive" onClick={() => handleIntervention('punish')} disabled={isIntervening || character.interventionPower.current < 50}>
                            {isIntervening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudRain className="mr-2 h-4 w-4"/>}
                            Покарать
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
