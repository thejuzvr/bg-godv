
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import type { Character, CharacterAttributes, CharacterSkills } from "@/types/character";
import { useToast } from "@/hooks/use-toast";
import * as LucideIcons from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { updateStats, updateAutoAssignPreference } from "./actions";
import { allPerks } from "@/data/perks";
import type { Perk } from "@/types/perk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const attributeInfo: Record<keyof CharacterAttributes, { name: string; icon: keyof typeof LucideIcons; description: string }> = {
    strength: { name: "Сила", icon: "Sword", description: "Увеличивает урон в ближнем бою и переносимый вес." },
    agility: { name: "Ловкость", icon: "Feather", description: "Повышает шанс уворота и критического удара." },
    intelligence: { name: "Интеллект", icon: "BrainCircuit", description: "Увеличивает урон от заклинаний и максимальный запас магии." },
    endurance: { name: "Выносливость", icon: "Heart", description: "Повышает максимальный запас здоровья и сопротивляемость." },
};

const skillInfo: Record<keyof CharacterSkills, { name: string; icon: keyof typeof LucideIcons; description: string }> = {
    oneHanded: { name: "Одноручное", icon: "Sword", description: "Эффективность атак одноручным оружием." },
    block: { name: "Блок", icon: "Shield", description: "Уменьшает получаемый урон при блокировании." },
    heavyArmor: { name: "Тяжелая броня", icon: "ShieldCheck", description: "Эффективность ношения тяжелых доспехов." },
    lightArmor: { name: "Легкая броня", icon: "Shirt", description: "Улучшает уворот и эффективность легких доспехов." },
    persuasion: { name: "Убеждение", icon: "MessageSquare", description: "Шанс получить лучшие цены и доступ к уникальным диалогам." },
    alchemy: { name: "Алхимия", icon: "FlaskConical", description: "Усиливает эффекты от выпитых зелий." },
};

const Icon = ({ name, ...props }: { name: keyof typeof LucideIcons } & LucideIcons.LucideProps) => {
    const LucideIcon = LucideIcons[name] as React.ElementType;
    if (!LucideIcon) return <LucideIcons.HelpCircle {...props} />;
    return <LucideIcon {...props} />;
};

export default function CharacterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);
    const [character, setCharacter] = useState<Character | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // State for interactive stat/skill allocation
    const [tempAttributes, setTempAttributes] = useState<CharacterAttributes | null>(null);
    const [tempSkills, setTempSkills] = useState<CharacterSkills | null>(null);
    const [attrPoints, setAttrPoints] = useState(0);
    const [skillPoints, setSkillPoints] = useState(0);
    const [isAutoAssignEnabled, setIsAutoAssignEnabled] = useState(false);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                const char = await fetchCharacter(user.userId);
                if (char) {
                    setCharacter(char);
                    setTempAttributes(char.attributes);
                    setTempSkills(char.skills);
                    setAttrPoints(char.points.attribute);
                    setSkillPoints(char.points.skill);
                    setIsAutoAssignEnabled(char.preferences?.autoAssignPoints ?? true);
                } else {
                    router.push('/create-character');
                }
            } catch (error) {
                toast({ title: "Ошибка", description: "Не удалось загрузить данные героя.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, router, toast]);
    
    const handleAttributeChange = (key: keyof CharacterAttributes, delta: 1 | -1) => {
        if (!tempAttributes || !character) return;
        
        if (delta === 1 && attrPoints > 0) {
            setTempAttributes({ ...tempAttributes, [key]: tempAttributes[key] + 1 });
            setAttrPoints(attrPoints - 1);
        } else if (delta === -1 && tempAttributes[key] > character.attributes[key]) {
            setTempAttributes({ ...tempAttributes, [key]: tempAttributes[key] - 1 });
            setAttrPoints(attrPoints + 1);
        }
    };

    const handleSkillChange = (key: keyof CharacterSkills, delta: 1 | -1) => {
        if (!tempSkills || !character) return;

        if (delta === 1 && skillPoints > 0) {
            setTempSkills({ ...tempSkills, [key]: tempSkills[key] + 1 });
            setSkillPoints(skillPoints - 1);
        } else if (delta === -1 && tempSkills[key] > character.skills[key]) {
            setTempSkills({ ...tempSkills, [key]: tempSkills[key] - 1 });
            setSkillPoints(skillPoints + 1);
        }
    };

    const handleAutoAssignToggle = async (enabled: boolean) => {
        if (!user) return;
        setIsAutoAssignEnabled(enabled);
        const result = await updateAutoAssignPreference(user.userId, enabled);
        toast({
            title: result.success ? "Настройка сохранена" : "Ошибка",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });
    };

    const handleConfirmChanges = async () => {
        if (!user || !character || !tempAttributes || !tempSkills) return;
        setIsSaving(true);
        const pointsSpent = {
            attribute: character.points.attribute - attrPoints,
            skill: character.points.skill - skillPoints,
        };
        const result = await updateStats(user.userId, tempAttributes, tempSkills, pointsSpent);
        toast({
            title: result.success ? "Герой стал сильнее!" : "Ошибка",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });

        if (result.success) {
            // Optimistically update character state
             const char = await fetchCharacter(user.userId);
             if(char) setCharacter(char);
        }
        setIsSaving(false);
    };

    const hasChanges = useMemo(() => {
        if (!character) return false;
        return attrPoints !== character.points.attribute || skillPoints !== character.points.skill;
    }, [attrPoints, skillPoints, character]);

    const perksByCategory = useMemo(() => {
        const grouped: Record<string, Perk[]> = {
            combat: allPerks.filter(p => p.category === 'combat'),
            crafting: allPerks.filter(p => p.category === 'crafting'),
            magic: allPerks.filter(p => p.category === 'magic'),
            social: allPerks.filter(p => p.category === 'social'),
        };
        return grouped;
    }, []);
    
    const categoryInfo: Record<string, { name: string; description: string; icon: string }> = {
        combat: { name: 'Боевое', description: 'Улучшения в бою и владении оружием', icon: 'Swords' },
        crafting: { name: 'Крафт', description: 'Создание и улучшение предметов', icon: 'Hammer' },
        magic: { name: 'Магия', description: 'Зачарование и алхимические умения', icon: 'Sparkles' },
        social: { name: 'Социальные', description: 'Убеждение и взаимодействие с миром', icon: 'Users' },
    };


    if (isLoading || !character || !tempAttributes || !tempSkills) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка данных персонажа...</div>;
    }

    return (
        <div className="w-full font-body space-y-8 p-4 md:p-8">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-headline text-primary flex items-center gap-3"><Icon name="User" /> Персонаж</h1>
            </header>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Очки для распределения</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold">Характеристики:</span>
                                <Badge variant="default" className="text-lg">{attrPoints}</Badge>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold">Навыки:</span>
                                <Badge variant="secondary" className="text-lg">{skillPoints}</Badge>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between pt-2">
                                <Label htmlFor="auto-assign" className="flex flex-col space-y-1">
                                    <span>Автоматически распределять очки</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        Позволить герою самому решать, как стать сильнее.
                                    </span>
                                </Label>
                                <Switch
                                    id="auto-assign"
                                    checked={isAutoAssignEnabled}
                                    onCheckedChange={handleAutoAssignToggle}
                                />
                            </div>
                            <Button className="w-full" onClick={handleConfirmChanges} disabled={!hasChanges || isAutoAssignEnabled || isSaving}>
                                {isSaving ? <LucideIcons.Loader2 className="animate-spin" /> : "Подтвердить"}
                            </Button>
                            {isAutoAssignEnabled && <p className="text-xs text-center text-muted-foreground">Ручное распределение отключено.</p>}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Характеристики</CardTitle>
                            <CardDescription>Основные атрибуты, определяющие боевые и жизненные показатели вашего героя.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(tempAttributes).map(([key, value]) => {
                                const info = attributeInfo[key as keyof CharacterAttributes];
                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Icon name={info.icon} className="w-6 h-6 text-primary" />
                                            <div>
                                                <p className="font-semibold">{info.name}</p>
                                                <p className="text-xs text-muted-foreground">{info.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAttributeChange(key as keyof CharacterAttributes, -1)} disabled={value <= character.attributes[key as keyof CharacterAttributes] || isAutoAssignEnabled}>-</Button>
                                            <span className="text-lg font-bold w-8 text-center">{value}</span>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAttributeChange(key as keyof CharacterAttributes, 1)} disabled={attrPoints === 0 || isAutoAssignEnabled}>+</Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Навыки</CardTitle>
                             <CardDescription>Специализированные умения, которые улучшаются с практикой.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {Object.entries(tempSkills).map(([key, value]) => {
                                const info = skillInfo[key as keyof CharacterSkills];
                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Icon name={info.icon} className="w-6 h-6 text-secondary-foreground" />
                                            <div>
                                                <p className="font-semibold">{info.name}</p>
                                                <p className="text-xs text-muted-foreground">{info.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleSkillChange(key as keyof CharacterSkills, -1)} disabled={value <= character.skills[key as keyof CharacterSkills] || isAutoAssignEnabled}>-</Button>
                                            <span className="text-lg font-bold w-10 text-center">{value}</span>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleSkillChange(key as keyof CharacterSkills, 1)} disabled={skillPoints === 0 || isAutoAssignEnabled}>+</Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                </div>

            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Перки</CardTitle>
                    <CardDescription>Особые таланты, которые открываются по мере совершенствования навыков.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="combat" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                            {Object.keys(perksByCategory).map((categoryKey) => {
                                const info = categoryInfo[categoryKey];
                                return (
                                    <TabsTrigger key={categoryKey} value={categoryKey} className="flex items-center gap-2">
                                        <Icon name={info.icon as keyof typeof LucideIcons} className="h-4 w-4" />
                                        <span className="hidden md:inline">{info.name}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                        {Object.entries(perksByCategory).map(([categoryKey, perks]) => (
                            <TabsContent key={categoryKey} value={categoryKey}>
                                <div className="mb-4">
                                    <h4 className="font-semibold text-lg">{categoryInfo[categoryKey].name}</h4>
                                    <p className="text-sm text-muted-foreground">{categoryInfo[categoryKey].description}</p>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {perks.map((perk) => {
                                        const isUnlocked = (character.unlockedPerks?.includes(perk.id) ?? false) || ((character.skills as any)[perk.skill] >= perk.requiredSkillLevel);
                                        return (
                                            <TooltipProvider key={perk.id}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className={`flex flex-col gap-3 p-4 rounded-lg border-2 transition-all hover:shadow-md ${isUnlocked ? 'border-primary/80 bg-primary/10' : 'border-dashed border-muted-foreground/30'}`}>
                                                            <div className="flex items-start gap-3">
                                                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${isUnlocked ? 'bg-primary/20 text-primary' : 'bg-muted/50'}`}>
                                                                    <Icon name={perk.icon as keyof typeof LucideIcons} className="h-7 w-7" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-semibold text-sm leading-tight">{perk.name}</p>
                                                                    {isUnlocked ? (
                                                                        <p className="text-xs text-emerald-500 mt-1">✓ Открыт</p>
                                                                    ) : (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {skillInfo[perk.skill as keyof CharacterSkills].name} {perk.requiredSkillLevel}
                                                                        </p>
                                                                    )}
                                                                    {perk.maxRank && (
                                                                        <div className="mt-2 flex items-center gap-1">
                                                                            {Array.from({ length: perk.maxRank }).map((_, idx) => (
                                                                                <div 
                                                                                    key={idx} 
                                                                                    className={`h-1.5 w-full rounded-full ${idx < (perk.currentRank || 0) ? 'bg-primary' : 'bg-muted'}`}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{perk.description}</p>
                                                            {perk.nextRankRequirement && !isUnlocked && (
                                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                                    💡 {perk.nextRankRequirement}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p className="font-bold">{perk.name}</p>
                                                        <p className="text-sm mt-1">{perk.description}</p>
                                                        {perk.nextRankRequirement && (
                                                            <p className="text-xs text-amber-400 mt-2">{perk.nextRankRequirement}</p>
                                                        )}
                                                        {!isUnlocked && (
                                                            <p className="text-destructive text-xs mt-2">
                                                                Требуется: {skillInfo[perk.skill as keyof CharacterSkills].name} {perk.requiredSkillLevel}
                                                            </p>
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    })}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

    