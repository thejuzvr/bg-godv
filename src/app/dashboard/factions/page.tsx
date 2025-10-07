
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Character } from '@/types/character';
import { fetchCharacter } from '@/app/dashboard/shared-actions';
import { useToast } from '@/hooks/use-toast';
import { allFactions } from '@/data/factions';
import { allDivinities } from '@/data/divinities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Star, Coins, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import * as LucideIcons from "lucide-react";
import type { ReputationTier } from '@/types/faction';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { donateToFaction } from '../actions';


const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <Star {...props} />; // Fallback icon
  }
  return <LucideIcon {...props} />;
};


export default function FactionsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);
    const [character, setCharacter] = useState<Character | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDonating, setIsDonating] = useState(false);

    const loadCharacterData = async (userId: string) => {
        try {
            const char = await fetchCharacter(userId);
            if (char) {
                setCharacter(char);
            } else {
                router.push('/create-character');
            }
        } catch (error) {
            toast({ title: "Ошибка", description: "Не удалось загрузить данные героя.", variant: "destructive" });
        }
    }

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            await loadCharacterData(user.userId);
            setIsLoading(false);
        };
        loadData();
    }, [user, router, toast]);
    
    const handleDonation = async (factionId: string, amount: number) => {
        if (!user || !character) return;
        
        const goldAmount = character.inventory.find(i => i.id === 'gold')?.quantity || 0;
        if (goldAmount < amount) {
            toast({ title: "Недостаточно золота", description: `У героя нет ${amount} золота для пожертвования. Есть: ${goldAmount}`, variant: "destructive" });
            return;
        }

        setIsDonating(true);
        const result = await donateToFaction(user.userId, factionId, amount);
        if(result.success) {
            toast({ title: "Пожертвование принято", description: result.message });
            await loadCharacterData(user.userId);
        } else {
            toast({ title: "Ошибка", description: result.message, variant: "destructive" });
        }
        setIsDonating(false);
    };


    if (authLoading || isLoading) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка данных о фракциях...</div>;
    }

    if (!character) {
        return null;
    }

    const getReputationDetails = (reputation: number, tiers: ReputationTier[]): { currentTier: ReputationTier, nextTier: ReputationTier | null, progress: number } => {
        const sortedTiers = [...tiers].sort((a, b) => a.level - b.level);
        let currentTier = sortedTiers[0];
        let nextTier = null;

        for (let i = 0; i < sortedTiers.length; i++) {
            if (reputation >= sortedTiers[i].level) {
                currentTier = sortedTiers[i];
                if (i + 1 < sortedTiers.length) {
                    nextTier = sortedTiers[i+1];
                } else {
                    nextTier = null; // Max tier reached
                }
            } else {
                if(!nextTier) nextTier = sortedTiers[i];
                break;
            }
        }
        
        const tierStart = currentTier.level;
        const tierEnd = nextTier ? nextTier.level : tierStart;
        const progress = tierEnd > tierStart ? ((reputation - tierStart) / (tierEnd - tierStart)) * 100 : 100;

        return { currentTier, nextTier, progress };
    };
    
    const deity = allDivinities.find(d => d.id === character.patronDeity);
    const TEMPLE_GOAL = 2000000;
    const templeProgress = (character.templeProgress / TEMPLE_GOAL) * 100;

    return (
         <div className="w-full font-body p-4 md:p-8">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-headline text-primary flex items-center gap-3"><Shield /> Фракции и Божества</h1>
            </header>
            
            <div className="space-y-8">
                {deity && (
                    <Card className="border-2 border-primary/50">
                         <CardHeader>
                            <CardTitle className="font-headline text-primary flex items-center gap-3">
                                <Icon name={deity.icon} className="h-6 w-6" />
                                Бог-покровитель: {deity.name}
                            </CardTitle>
                            <CardDescription>{deity.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Постройка Великого Храма</h3>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium">Прогресс Постройки</span>
                                    <span className="text-sm font-mono text-muted-foreground">{templeProgress.toFixed(4)}%</span>
                                </div>
                                <Progress value={templeProgress} className="h-3" />
                                <p className="text-xs text-muted-foreground text-center mt-2">{character.templeProgress.toLocaleString()} / {TEMPLE_GOAL.toLocaleString()} золота</p>
                            </div>
                             <Separator />
                             <div className="flex items-center justify-between gap-4">
                                <p className="text-sm text-muted-foreground">Внесите свой вклад в строительство, чтобы получить вечную славу и божественные дары.</p>
                                <Button onClick={() => handleDonation(`deity_${deity.id}`, 100)} disabled={isDonating || (character.inventory.find(i => i.id === 'gold')?.quantity || 0) < 100}>
                                    {isDonating ? <Loader2 className="animate-spin mr-2" /> : <Coins className="mr-2 h-4 w-4" />}
                                    Пожертвовать 100
                                </Button>
                             </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {allFactions.map((faction) => {
                        const reputation = character.factions[faction.id]?.reputation || 0;
                        const isJoinable = !faction.joinRestrictions || !faction.joinRestrictions.includes(character.backstory);
                        const { currentTier, nextTier, progress } = getReputationDetails(reputation, faction.reputationTiers);

                        return (
                            <Card key={faction.id} className={cn("flex flex-col", !isJoinable && "opacity-60")}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            {!isJoinable && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Lock className="w-5 h-5 text-destructive" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Ваша предыстория не позволяет присоединиться к этой фракции.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            <CardTitle className="font-headline text-primary">{faction.name}</CardTitle>
                                        </div>
                                        <Badge variant="outline" className="font-mono text-sm">{reputation} rep</Badge>
                                    </div>
                                    <CardDescription>{faction.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1 flex flex-col">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-primary">{currentTier.title}</span>
                                            {nextTier && <span className="text-muted-foreground">След. ранг: {nextTier.title} ({nextTier.level} rep)</span>}
                                        </div>
                                        <Progress value={progress} />
                                    </div>
                                    
                                    <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger>Ранги и награды</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-3">
                                                {faction.reputationTiers.map((tier) => {
                                                    const isUnlocked = reputation >= tier.level;
                                                    return (
                                                    <div key={tier.level} className={cn("p-3 rounded-lg border", isUnlocked ? "border-primary/30 bg-primary/10" : "border-dashed")}>
                                                        <h4 className={cn("font-bold", isUnlocked ? "text-primary" : "text-muted-foreground")}>{tier.title} <span className="text-xs font-normal">({tier.level} rep)</span></h4>
                                                        <div className="mt-2 space-y-2 pl-4 border-l ml-2">
                                                        {tier.rewards.map((reward) => (
                                                            <div key={reward.id} className={cn("flex items-start gap-3 text-sm", !isUnlocked && "opacity-50")}>
                                                                <Icon name={reward.icon} className="h-4 w-4 mt-1 shrink-0" />
                                                                <div>
                                                                    <p className="font-semibold">{reward.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{reward.description}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        </div>
                                                    </div>
                                                    )
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    </Accordion>

                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
