
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Character } from '@/types/character';
import type { GameData } from '@/services/gameDataService';
import { fetchCharacter } from '@/app/dashboard/shared-actions';
import { fetchGameData } from '@/services/gameDataService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { allFactions } from '@/data/factions';

export default function QuestsPage() {
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
                toast({ title: "Ошибка", description: "Не удалось загрузить данные.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, router, toast]);
    
    if (authLoading || isLoading) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка журнала заданий...</div>;
    }

    if (!character || !gameData) {
        return null;
    }

    const locationName = gameData.locations.find(l => l.id === character.location)?.name || character.location;
    const currentQuest = character.currentAction?.type === 'quest' && character.currentAction.questId
        ? gameData.quests.find(q => q.id === character.currentAction!.questId) || null
        : null;

    const availableQuests = gameData.quests.filter(
        q => q.location === character.location && 
        q.status === 'available' && 
        q.id !== character.currentAction?.questId &&
        !character.completedQuests.includes(q.id)
    );

    const completedQuests = gameData.quests.filter(q => character.completedQuests.includes(q.id));

    return (
        <div className="w-full font-body p-4 md:p-8">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-headline text-primary flex items-center gap-3"><BookOpen /> Журнал Заданий</h1>
            </header>
            
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-primary">Текущее задание</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {currentQuest ? (
                                <div className="p-4 rounded-lg bg-secondary/50 border border-secondary">
                                    <p className="font-semibold text-lg">{currentQuest.title}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{currentQuest.description}</p>
                                    <p className="text-xs text-primary-foreground/60 mt-2">Награда: {currentQuest.reward.gold} золота, {currentQuest.reward.xp} опыта.</p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground p-3 rounded-lg bg-secondary/50">Сейчас у вас нет активных заданий.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-primary">Доступно в {locationName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ScrollArea className="h-96">
                                {availableQuests.length > 0 ? (
                                    <div className="space-y-4 pr-4">
                                        {availableQuests.map((quest) => {
                                            const meetsLevelReq = character.level >= quest.requiredLevel;
                                            const faction = quest.requiredFaction ? allFactions.find(f => f.id === quest.requiredFaction!.id) : null;
                                            const meetsFactionReq = !quest.requiredFaction || (character.factions[quest.requiredFaction.id]?.reputation || 0) >= quest.requiredFaction.reputation;
                                            const isAvailable = meetsLevelReq && meetsFactionReq;

                                            return (
                                                <div key={quest.id} className={`p-4 rounded-lg bg-secondary/50 border border-border ${!isAvailable && 'opacity-60'}`}>
                                                    <p className="font-semibold">{quest.title}</p>
                                                    <div className="flex flex-wrap gap-2 my-2">
                                                        <Badge variant={meetsLevelReq ? 'outline' : 'destructive'}>Уровень: {quest.requiredLevel}</Badge>
                                                        {faction && (
                                                            <Badge variant={meetsFactionReq ? 'default' : 'destructive'} className="gap-1">
                                                                <Shield className="h-3 w-3" />
                                                                {faction?.name}: {quest.requiredFaction!.reputation}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{quest.description}</p>
                                                    <p className="text-xs text-primary-foreground/60 mt-2">Награда: {quest.reward.gold} золота, {quest.reward.xp} опыта.</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-secondary/50">В этой локации нет доступных заданий.</p>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-2">
                    <Card>
                         <CardHeader>
                            <CardTitle className="font-headline text-primary">Выполненные задания</CardTitle>
                        </CardHeader>
                         <CardContent>
                             <ScrollArea className="h-[70vh]">
                                <div className="space-y-4 pr-4">
                                    {completedQuests.length > 0 ? completedQuests.map(quest => (
                                        <div key={quest.id} className="p-4 rounded-lg bg-secondary/30 border border-border/50 opacity-70">
                                            <p className="font-semibold text-muted-foreground line-through">{quest.title}</p>
                                            <p className="text-sm text-muted-foreground/80 mt-1">{quest.description}</p>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-muted-foreground p-3">Вы еще не выполнили ни одного задания.</p>
                                    )}
                                </div>
                             </ScrollArea>
                         </CardContent>
                    </Card>
                 </div>
            </div>
        </div>
    );
}
