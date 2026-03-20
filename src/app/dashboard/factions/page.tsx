
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
import { Shield, Lock, Star, Coins, Loader2, Gift, ShoppingBag, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import * as LucideIcons from "lucide-react";
import type { ReputationTier } from '@/types/faction';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { donateToFaction } from '../actions';
import { PageContainer } from '@/components/layout/page-container';
import { SectionContainer } from '@/components/layout/section-container';


const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as keyof typeof LucideIcons)[name];
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
        } catch {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            // Check for rank up notification
            if (result.message.includes('🎉')) {
                toast({ 
                    title: "🎊 Повышение ранга!", 
                    description: result.message,
                    duration: 6000,
                });
            } else {
                toast({ title: "Пожертвование принято", description: result.message });
            }
            await loadCharacterData(user.userId);
        } else {
            toast({ title: "Ошибка", description: result.message, variant: "destructive" });
        }
        setIsDonating(false);
    };


    if (authLoading || isLoading) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl font-body">Загрузка данных о фракциях...</div>;
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
         <PageContainer maxWidth="container" className="font-body">
            <SectionContainer>
            <header className="flex items-center justify-between">
                <h1 className="text-4xl font-headline text-primary flex items-center gap-3"><Shield className="h-8 w-8" /> Фракции и Божества</h1>
            </header>
            
            <div className="space-y-8">
                {deity && (
                    <Card className="border-2 border-primary/50 font-body">
                         <CardHeader>
                            <CardTitle className="font-headline text-primary flex items-center gap-3">
                                <Icon name={deity.icon} className="h-6 w-6" />
                                Бог-покровитель: {deity.name}
                            </CardTitle>
                            <CardDescription className="font-body">{deity.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 font-body">
                            <div>
                                <h3 className="text-lg font-semibold font-headline mb-2">Постройка Великого Храма</h3>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium font-body">Прогресс Постройки</span>
                                    <span className="text-sm font-mono text-muted-foreground">{templeProgress.toFixed(4)}%</span>
                                </div>
                                <Progress value={templeProgress} className="h-3" />
                                <p className="text-xs text-muted-foreground text-center mt-2 font-body">{character.templeProgress.toLocaleString()} / {TEMPLE_GOAL.toLocaleString()} золота</p>
                            </div>
                             <Separator />
                             <div className="space-y-3 font-body">
                                <p className="text-sm text-muted-foreground font-body">Внесите свой вклад в строительство, чтобы получить вечную славу и божественные дары.</p>
                                <div className="flex gap-2">
                                    <Button 
                                        onClick={() => handleDonation(`deity_${deity.id}`, 50)} 
                                        disabled={isDonating || (character.inventory.find(i => i.id === 'gold')?.quantity || 0) < 50}
                                        variant="outline"
                                        className="flex-1 font-body"
                                    >
                                        {isDonating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Coins className="mr-2 h-4 w-4" />}
                                        50g
                                    </Button>
                                    <Button 
                                        onClick={() => handleDonation(`deity_${deity.id}`, 100)} 
                                        disabled={isDonating || (character.inventory.find(i => i.id === 'gold')?.quantity || 0) < 100}
                                        variant="outline"
                                        className="flex-1 font-body"
                                    >
                                        {isDonating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Coins className="mr-2 h-4 w-4" />}
                                        100g
                                    </Button>
                                    <Button 
                                        onClick={() => handleDonation(`deity_${deity.id}`, 500)} 
                                        disabled={isDonating || (character.inventory.find(i => i.id === 'gold')?.quantity || 0) < 500}
                                        className="flex-1 font-body"
                                    >
                                        {isDonating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Coins className="mr-2 h-4 w-4" />}
                                        500g
                                    </Button>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {allFactions.map((faction, index) => {
                        const reputation = character.factions[faction.id]?.reputation || 0;
                        const isJoinable = !faction.joinRestrictions || !faction.joinRestrictions.includes(character.backstory);
                        const { currentTier, nextTier, progress } = getReputationDetails(reputation, faction.reputationTiers);

                        return (
                            <Card 
                                key={faction.id} 
                                className={cn(
                                    "flex flex-col transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/50",
                                    !isJoinable && "opacity-60",
                                    "animate-in fade-in slide-in-from-bottom-4"
                                )}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            {!isJoinable && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Lock className="w-5 h-5 text-destructive animate-pulse" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Ваша предыстория не позволяет присоединиться к этой фракции.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            <CardTitle className="font-headline text-primary">{faction.name}</CardTitle>
                                        </div>
                                        <Badge variant="outline" className="font-mono text-sm bg-primary/10">{reputation} rep</Badge>
                                    </div>
                                    <CardDescription className="text-base font-body">{faction.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1 flex flex-col font-body">
                                    <div className="space-y-2 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 font-body">
                                        <div className="flex justify-between text-sm font-medium font-body">
                                            <span className="text-primary flex items-center gap-2 font-body">
                                                <Star className="h-4 w-4 fill-primary" />
                                                {currentTier.title}
                                            </span>
                                            {nextTier && <span className="text-muted-foreground text-xs font-body">След: {nextTier.title}</span>}
                                        </div>
                                        <Progress value={progress} className="h-2 bg-primary/10" />
                                        <div className="flex justify-between text-xs font-body">
                                            <span className="text-muted-foreground font-body">{reputation} rep</span>
                                            <span className="text-muted-foreground font-body">{nextTier ? `${nextTier.level} rep` : 'MAX'}</span>
                                        </div>
                                    </div>
                                    
                                    {isJoinable && (
                                        <>
                                            <Separator />
                                            <div className="space-y-2 font-body">
                                                <p className="text-sm font-medium flex items-center gap-2 font-body">
                                                    <Coins className="h-4 w-4 text-amber-500" />
                                                    Быстрое пожертвование
                                                </p>
                                                <div className="flex gap-2 font-body">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => handleDonation(faction.id, 50)}
                                                        disabled={isDonating || (character.inventory.find(i => i.id === 'gold')?.quantity || 0) < 50}
                                                        className="flex-1 hover:bg-primary/10 hover:border-primary transition-all font-body"
                                                    >
                                                        {isDonating ? <Loader2 className="animate-spin h-4 w-4" /> : "+5 rep (50g)"}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => handleDonation(faction.id, 100)}
                                                        disabled={isDonating || (character.inventory.find(i => i.id === 'gold')?.quantity || 0) < 100}
                                                        className="flex-1 hover:bg-primary/10 hover:border-primary transition-all font-body"
                                                    >
                                                        {isDonating ? <Loader2 className="animate-spin h-4 w-4" /> : "+10 rep (100g)"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    
                                    <Accordion type="multiple" className="w-full">
                                    {/* Passive Bonuses Section */}
                                    {faction.passiveBonuses && faction.passiveBonuses.length > 0 && (
                                        <AccordionItem value="bonuses" className="border-none font-body">
                                            <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors font-headline">
                                                <span className="flex items-center gap-2">
                                                    <Zap className="h-4 w-4" />
                                                    Пассивные бонусы
                                                </span>
                                            </AccordionTrigger>
                                            <AccordionContent className="font-body">
                                                <div className="space-y-2 mt-2 font-body">
                                                    {faction.passiveBonuses.map((bonus, idx) => {
                                                        const isUnlocked = reputation >= bonus.requiredRank;
                                                        return (
                                                            <div 
                                                                key={idx}
                                                                className={cn(
                                                                    "p-3 rounded-lg border transition-all font-body",
                                                                    isUnlocked ? "border-green-500/40 bg-green-500/10" : "border-dashed opacity-60"
                                                                )}
                                                            >
                                                                <div className="flex items-start justify-between gap-3 font-body">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1 font-body">
                                                                            {isUnlocked && <Gift className="h-4 w-4 text-green-500" />}
                                                                            <h5 className="font-semibold text-sm font-body">{bonus.name}</h5>
                                                                            {bonus.value && <Badge variant="outline" className="text-xs font-body">+{bonus.value}%</Badge>}
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground font-body">{bonus.description}</p>
                                                                    </div>
                                                                    <Badge variant={isUnlocked ? "default" : "outline"} className="text-xs shrink-0 font-body">
                                                                        {bonus.requiredRank} rep
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}
                                    
                                    <AccordionItem value="item-1" className="border-none font-body">
                                        <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors font-headline">
                                            <span className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                Ранги и награды
                                            </span>
                                        </AccordionTrigger>
                                        <AccordionContent className="font-body">
                                            <div className="space-y-3 mt-2 font-body">
                                                {faction.reputationTiers.map((tier) => {
                                                    const isUnlocked = reputation >= tier.level;
                                                    const isCurrent = currentTier.level === tier.level;
                                                    return (
                                                    <div 
                                                        key={tier.level} 
                                                        className={cn(
                                                            "p-4 rounded-lg border transition-all duration-300 font-body",
                                                            isUnlocked && "border-primary/40 bg-gradient-to-r from-primary/15 to-primary/5 shadow-sm",
                                                            !isUnlocked && "border-dashed border-muted-foreground/30",
                                                            isCurrent && "ring-2 ring-primary/50"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between mb-3 font-body">
                                                            <h4 className={cn(
                                                                "font-bold text-base flex items-center gap-2 font-headline",
                                                                isUnlocked ? "text-primary" : "text-muted-foreground"
                                                            )}>
                                                                {isUnlocked && <Star className="h-4 w-4 fill-primary" />}
                                                                {tier.title}
                                                            </h4>
                                                            <Badge variant={isUnlocked ? "default" : "outline"} className="text-xs font-body">
                                                                {tier.level} rep
                                                            </Badge>
                                                        </div>
                                                        {tier.rewards.length > 0 && (
                                                            <div className="space-y-2 pl-4 border-l-2 border-primary/30 ml-1 font-body">
                                                                {tier.rewards.map((reward) => (
                                                                    <div 
                                                                        key={reward.id} 
                                                                        className={cn(
                                                                            "flex items-start gap-3 text-sm transition-all font-body",
                                                                            !isUnlocked && "opacity-40"
                                                                        )}
                                                                    >
                                                                        <Icon name={reward.icon} className={cn(
                                                                            "h-5 w-5 mt-0.5 shrink-0",
                                                                            isUnlocked && "text-primary"
                                                                        )} />
                                                                        <div className="flex-1 font-body">
                                                                            <p className="font-semibold font-body">{reward.name}</p>
                                                                            <p className="text-xs text-muted-foreground mt-0.5 font-body">{reward.description}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    )
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    
                                    {/* Faction Shop Section */}
                                    {faction.shopItems && faction.shopItems.length > 0 && (
                                        <AccordionItem value="shop" className="border-none font-body">
                                            <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors font-headline">
                                                <span className="flex items-center gap-2">
                                                    <ShoppingBag className="h-4 w-4" />
                                                    Магазин фракции
                                                </span>
                                            </AccordionTrigger>
                                            <AccordionContent className="font-body">
                                                <div className="space-y-2 mt-2 font-body">
                                                    <p className="text-xs text-muted-foreground mb-3 font-body">
                                                        Эксклюзивные товары доступны членам фракции. Цены зависят от вашего ранга.
                                                    </p>
                                                    {faction.shopItems.map((shopItem, idx) => {
                                                        const canPurchase = reputation >= shopItem.requiredRank;
                                                        const discount = shopItem.priceModifier ? Math.round((1 - shopItem.priceModifier) * 100) : 0;
                                                        return (
                                                            <div 
                                                                key={idx}
                                                                className={cn(
                                                                    "p-3 rounded-lg border transition-all font-body",
                                                                    canPurchase ? "border-blue-500/40 bg-blue-500/10" : "border-dashed opacity-60"
                                                                )}
                                                            >
                                                                <div className="flex items-start justify-between gap-3 font-body">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1 font-body">
                                                                            {canPurchase && <ShoppingBag className="h-4 w-4 text-blue-500" />}
                                                                            <h5 className="font-semibold text-sm font-body">{shopItem.itemId}</h5>
                                                                            {discount > 0 && (
                                                                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 font-body">
                                                                                    -{discount}%
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground font-body">
                                                                            {canPurchase ? 'Доступно для покупки' : 'Требуется выше ранг'}
                                                                        </p>
                                                                    </div>
                                                                    <Badge variant={canPurchase ? "default" : "outline"} className="text-xs shrink-0 font-body">
                                                                        {shopItem.requiredRank} rep
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}
                                    </Accordion>

                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
            </SectionContainer>
        </PageContainer>
    );
}
