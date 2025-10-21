"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import type { Character, CharacterInventoryItem } from "@/types/character";
import { useToast } from "@/hooks/use-toast";
import { fetchGameData } from "@/services/gameDataService";
import type { NPC } from "@/types/npc";
import type { Location } from "@/types/location";
import { interactWithNPC, tradeWithNPC, giftToNPC } from "@/actions/npc-actions";
import { computeBuyPrice, computeSellPrice, computeBaseValue } from "@/services/pricing";
import { fetchNPCs, fetchLocations, fetchItems } from "@/actions/game-data-actions";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

import * as LucideIcons from "lucide-react";
import { 
  Users, 
  Store, 
  Heart, 
  MapPin, 
  MessageSquare, 
  ShoppingCart, 
  Gift, 
  Coins,
  Loader2,
  Search,
  Globe,
  Info,
  UserPlus,
  Sword,
  Shield as ShieldIcon
} from "lucide-react";
import { ShopManagement } from "@/components/dashboard/shop-management";
import { companionTemplates } from "@/data/companions";
import type { CompanionTemplate } from "@/types/companion";

const Icon = ({ name, ...props }: { name: keyof typeof LucideIcons } & LucideIcons.LucideProps) => {
    const LucideIcon = LucideIcons[name] as React.ElementType;
    if (!LucideIcon) return <LucideIcons.HelpCircle {...props} />;
    return <LucideIcon {...props} />;
};

const relationshipLevelNames: Record<number, string> = {
    0: "Незнакомец",
    1: "Знакомый",
    2: "Друг",
    3: "Близкий друг",
    4: "Лучший друг"
};

const relationshipColors: Record<number, string> = {
    0: "bg-gray-500",
    1: "bg-blue-500",
    2: "bg-green-500",
    3: "bg-purple-500",
    4: "bg-yellow-500"
};

export default function SocialPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);
    
    const [character, setCharacter] = useState<Character | null>(null);
    const [gameData, setGameData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [npcs, setNpcs] = useState<NPC[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [items, setItems] = useState<CharacterInventoryItem[]>([]);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
    const [isInteracting, setIsInteracting] = useState(false);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                const [char, npcsData, locationsData, itemsData, gData] = await Promise.all([
                    fetchCharacter(user.userId),
                    fetchNPCs(),
                    fetchLocations(),
                    fetchItems(),
                    fetchGameData(),
                ]);
                
                if (char) {
                    setCharacter(char);
                } else {
                    router.push('/create-character');
                }
                
                setNpcs(npcsData);
                setLocations(locationsData);
                setItems(itemsData);
                setGameData(gData);
            } catch (error) {
                console.error('Error loading data:', error);
                toast({
                    title: "Ошибка",
                    description: "Не удалось загрузить данные",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user, router, toast]);

    const getRelationshipLevel = (npcId: string): number => {
        if (!character?.relationships) return 0;
        const rel = character.relationships[npcId];
        return rel?.level || 0;
    };

    const getNPCRole = (npc: NPC): string => {
        if (npc.inventory && npc.inventory.length > 0) return 'merchant';
        if (npc.isCompanion) return 'companion';
        return 'citizen';
    };

    const getNPCRoleLabel = (npc: NPC): string => {
        const role = getNPCRole(npc);
        if (role === 'merchant') return '🛒 Торговец';
        if (role === 'companion') return '⚔️ Компаньон';
        return '👤 Житель';
    };

    const filteredNPCs = useMemo(() => {
        let result = [...npcs];

        if (searchQuery) {
            result = result.filter(npc => 
                npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                npc.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (locationFilter !== "all") {
            result = result.filter(npc => npc.location === locationFilter || npc.location === 'on_road');
        }

        if (typeFilter !== "all") {
            result = result.filter(npc => getNPCRole(npc) === typeFilter);
        }

        return result;
    }, [npcs, searchQuery, locationFilter, typeFilter]);

    const currentLocationNPCs = useMemo(() => {
        if (!character) return [];
        return npcs.filter(npc => npc.location === character.location || npc.location === 'on_road');
    }, [npcs, character]);

    const merchantNPCs = useMemo(() => {
        if (!character) return [];
        return currentLocationNPCs.filter(npc => npc.inventory && npc.inventory.length > 0);
    }, [currentLocationNPCs, character]);

    const companionNPCs = useMemo(() => {
        if (!character) return [];
        return npcs.filter(npc => npc.isCompanion);
    }, [npcs, character]);

    const handleInteract = async (npc: NPC) => {
        if (!character || !user) return;
        
        setIsInteracting(true);
        try {
            const result = await interactWithNPC(user.userId, npc.id);
            if (result.success) {
                const updatedChar = await fetchCharacter(user.userId);
                if (updatedChar) setCharacter(updatedChar);
                
                toast({
                    title: "Взаимодействие успешно",
                    description: result.message,
                });
            } else {
                toast({
                    title: "Ошибка",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось взаимодействовать с NPC",
                variant: "destructive",
            });
        } finally {
            setIsInteracting(false);
        }
    };

    const handleTrade = async (npc: NPC, action: 'buy' | 'sell', itemId: string, quantity: number) => {
        if (!character || !user) return;
        
        setIsInteracting(true);
        try {
            const result = await tradeWithNPC(user.userId, npc.id, action, itemId, quantity);
            if (result.success) {
                const updatedChar = await fetchCharacter(user.userId);
                if (updatedChar) setCharacter(updatedChar);
                
                toast({
                    title: "Торговля успешна",
                    description: result.message,
                });
            } else {
                toast({
                    title: "Ошибка",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось совершить торговлю",
                variant: "destructive",
            });
        } finally {
            setIsInteracting(false);
        }
    };

    const handleGift = async (npc: NPC, itemId: string) => {
        if (!character || !user) return;
        
        setIsInteracting(true);
        try {
            const result = await giftToNPC(user.userId, npc.id, itemId);
            if (result.success) {
                const updatedChar = await fetchCharacter(user.userId);
                if (updatedChar) setCharacter(updatedChar);
                
                toast({
                    title: "Подарок вручён",
                    description: result.message,
                });
            } else {
                toast({
                    title: "Ошибка",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось вручить подарок",
                variant: "destructive",
            });
        } finally {
            setIsInteracting(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!character || !gameData) {
        return null;
    }

    const currentLocation = locations.find(l => l.id === character.location);
    const hasShop = Boolean(character.preferences?.playerShop);
    const playerGold = character.inventory.find(i => i.id === 'gold')?.quantity || 0;

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Социальная Жизнь</h1>
                    <p className="text-muted-foreground">
                        Торговля, общение и взаимодействия с жителями Скайрима
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="text-sm">
                        <MapPin className="mr-1 h-3 w-3" />
                        {currentLocation?.name || character.location}
                    </Badge>
                    <Badge variant="secondary" className="text-sm">
                        <Coins className="mr-1 h-3 w-3" />
                        {playerGold} золота
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="npcs" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="npcs">
                        <Users className="mr-2 h-4 w-4" />
                        NPC ({currentLocationNPCs.length})
                    </TabsTrigger>
                    <TabsTrigger value="merchants">
                        <Store className="mr-2 h-4 w-4" />
                        Торговцы ({merchantNPCs.length})
                    </TabsTrigger>
                    <TabsTrigger value="companions">
                        <Sword className="mr-2 h-4 w-4" />
                        Компаньоны ({companionNPCs.length})
                    </TabsTrigger>
                    <TabsTrigger value="shop">
                        <ShieldIcon className="mr-2 h-4 w-4" />
                        Моя Лавка
                    </TabsTrigger>
                </TabsList>

                {/* NPC Tab */}
                <TabsContent value="npcs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Жители локации</CardTitle>
                            <CardDescription>
                                Взаимодействуйте с местными жителями, чтобы улучшить отношения и получить информацию
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {currentLocationNPCs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">В этой локации нет NPC</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {currentLocationNPCs.map(npc => {
                                        const relLevel = getRelationshipLevel(npc.id);
                                        const relName = relationshipLevelNames[relLevel];
                                        const relColor = relationshipColors[relLevel];

                                        return (
                                            <Card key={npc.id} className="overflow-hidden">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <CardTitle className="text-lg">{npc.name}</CardTitle>
                                                            <CardDescription className="text-sm mt-1">
                                                                {getNPCRoleLabel(npc)}
                                                            </CardDescription>
                                                        </div>
                                                        <Badge className={`${relColor} text-white ml-2`}>
                                                            {relName}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {npc.description}
                                                    </p>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button 
                                                                className="w-full" 
                                                                variant="outline"
                                                                onClick={() => setSelectedNPC(npc)}
                                                            >
                                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                                Взаимодействовать
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>{npc.name}</DialogTitle>
                                                                <DialogDescription>{npc.description}</DialogDescription>
                                                            </DialogHeader>
                                                            <NPCDialogContent 
                                                                npc={npc} 
                                                                character={character}
                                                                relationshipLevel={relLevel}
                                                                onInteract={handleInteract}
                                                                onTrade={handleTrade}
                                                                onGift={handleGift}
                                                                isInteracting={isInteracting}
                                                                locations={locations}
                                                                items={items}
                                                            />
                                                        </DialogContent>
                                                    </Dialog>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Merchants Tab */}
                <TabsContent value="merchants" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Торговцы</CardTitle>
                            <CardDescription>
                                Покупайте и продавайте предметы у местных торговцев
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {merchantNPCs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Store className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">В этой локации нет торговцев</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {merchantNPCs.map((npc) => (
                                        <Card key={npc.id}>
                                            <CardHeader>
                                                <CardTitle className="text-base">{npc.name}</CardTitle>
                                                <CardDescription>{npc.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="space-y-2">
                                                    {(npc.inventory || []).slice(0, 5).map((row, idx) => {
                                                        const base = gameData.items.find((i: any) => i.id === row.itemId);
                                                        const name = base?.name || row.itemId;
                                                        const price = Math.floor((base?.baseValue || 10) * (row.priceModifier || 1));
                                                        return (
                                                            <div key={idx} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                                                                <span>{name}</span>
                                                                <span className="text-muted-foreground font-mono">{price}g</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <Separator />
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button className="w-full" variant="default" onClick={() => setSelectedNPC(npc)}>
                                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                                            Торговать
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>{npc.name}</DialogTitle>
                                                            <DialogDescription>{npc.description}</DialogDescription>
                                                        </DialogHeader>
                                                        <NPCDialogContent 
                                                            npc={npc} 
                                                            character={character}
                                                            relationshipLevel={getRelationshipLevel(npc.id)}
                                                            onInteract={handleInteract}
                                                            onTrade={handleTrade}
                                                            onGift={handleGift}
                                                            isInteracting={isInteracting}
                                                            locations={locations}
                                                            items={items}
                                                        />
                                                    </DialogContent>
                                                </Dialog>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Companions Tab */}
                <TabsContent value="companions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Доступные компаньоны</CardTitle>
                            <CardDescription>
                                Нанимайте спутников для помощи в приключениях. Они помогают в бою, путешествиях и социальных взаимодействиях.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(() => {
                                const availableCompanions = companionTemplates.filter(t => 
                                    t.availableAt.includes(character.location)
                                );
                                
                                if (availableCompanions.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Sword className="h-12 w-12 text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">Нет доступных компаньонов</p>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                В этой локации нет компаньонов для найма. Попробуйте другие города.
                                            </p>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {availableCompanions.map((template) => (
                                            <Card key={template.id} className="hover:shadow-lg transition-shadow">
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                                {template.class === 'warrior' && <Icon name="Swords" className="h-5 w-5" />}
                                                                {template.class === 'mage' && <Icon name="Sparkles" className="h-5 w-5" />}
                                                                {template.class === 'rogue' && <Icon name="Eye" className="h-5 w-5" />}
                                                                {template.class === 'healer' && <Icon name="Heart" className="h-5 w-5" />}
                                                                {template.class === 'ranger' && <Icon name="Crosshair" className="h-5 w-5" />}
                                                                {template.namePool[0]}
                                                            </CardTitle>
                                                            <CardDescription className="capitalize mt-1">
                                                                {template.class === 'warrior' && 'Воин'}
                                                                {template.class === 'mage' && 'Маг'}
                                                                {template.class === 'rogue' && 'Разбойник'}
                                                                {template.class === 'healer' && 'Целитель'}
                                                                {template.class === 'ranger' && 'Следопыт'}
                                                            </CardDescription>
                                                        </div>
                                                        <Badge variant={
                                                            template.rarity === 'legendary' ? 'default' :
                                                            template.rarity === 'rare' ? 'destructive' :
                                                            template.rarity === 'uncommon' ? 'secondary' : 'outline'
                                                        }>
                                                            {template.rarity === 'common' && 'Обычный'}
                                                            {template.rarity === 'uncommon' && 'Необычный'}
                                                            {template.rarity === 'rare' && 'Редкий'}
                                                            {template.rarity === 'legendary' && 'Легендарный'}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <p className="text-sm text-muted-foreground">{template.bio}</p>
                                                    
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Здоровье:</span>
                                                            <span className="font-medium">{template.baseStats.health.max}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Урон:</span>
                                                            <span className="font-medium">{template.baseStats.damage}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Защита:</span>
                                                            <span className="font-medium">{template.baseStats.defense}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <Separator />
                                                    
                                                    <div>
                                                        <p className="text-xs font-semibold mb-2">Способности:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {template.availableAbilities.map((ability) => (
                                                                <TooltipProvider key={ability.id}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <Badge variant="outline" className="text-xs cursor-help">
                                                                                {ability.name}
                                                                            </Badge>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p className="font-semibold">{ability.name}</p>
                                                                            <p className="text-xs max-w-xs">{ability.description}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    <Separator />
                                                    
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-sm">
                                                                <p className="text-muted-foreground">Стоимость найма</p>
                                                                <p className="font-semibold text-amber-600">{template.recruitCost} 🪙</p>
                                                            </div>
                                                            <Button size="sm" disabled>
                                                                <UserPlus className="h-4 w-4 mr-1" />
                                                                Нанять
                                                            </Button>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Содержание: {template.upkeepCost} 🪙/день, {template.foodConsumption} 🍖/день
                                                        </p>
                                                        <p className="text-xs text-muted-foreground italic">
                                                            💡 Функционал найма будет доступен после интеграции с базой данных
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Player Shop Tab */}
                <TabsContent value="shop" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Моя Торговая Лавка</CardTitle>
                            <CardDescription>
                                Откройте свою лавку и продавайте предметы другим героям
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!hasShop ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Store className="h-16 w-16 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">У вас нет лавки</h3>
                                        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                                            Откройте свою торговую лавку, чтобы продавать предметы другим героям и зарабатывать золото, пока вы путешествуете
                                        </p>
                                        <Button 
                                            size="lg"
                                            onClick={async () => {
                                                const csrf = typeof document !== 'undefined' ? (document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '') : '';
                                                const resp = await fetch('/api/shop/purchase', { 
                                                    method: 'POST', 
                                                    headers: { 'content-type': 'application/json', 'x-csrf-token': csrf }, 
                                                    body: JSON.stringify({ characterId: character.id, name: `${character.name} — Лавка` }) 
                                                });
                                                const data = await resp.json();
                                                if (data.ok && data.character) {
                                                    setCharacter(data.character);
                                                    toast({ title: "Лавка открыта!", description: "Теперь вы можете продавать предметы" });
                                                }
                                            }}
                                            disabled={playerGold < 500}
                                        >
                                            <Store className="mr-2 h-4 w-4" />
                                            Купить лавку (500 золота)
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <ShopManagement character={character} gameData={gameData} onUpdated={setCharacter} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// NPC Dialog Content Component
interface NPCDialogContentProps {
    npc: NPC;
    character: Character;
    relationshipLevel: number;
    onInteract: (npc: NPC) => void;
    onTrade: (npc: NPC, action: 'buy' | 'sell', itemId: string, quantity: number) => void;
    onGift: (npc: NPC, itemId: string) => void;
    isInteracting: boolean;
    locations: Location[];
    items: CharacterInventoryItem[];
}

function NPCDialogContent({ npc, character, relationshipLevel, onInteract, onTrade, onGift, isInteracting, locations, items }: NPCDialogContentProps) {
    const [selectedTab, setSelectedTab] = useState<string>("info");
    const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
    const [randomDialogue, setRandomDialogue] = useState<string>("");

    useEffect(() => {
        if (npc.dialogue && npc.dialogue.length > 0) {
            setRandomDialogue(npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)]);
        }
    }, [npc.dialogue]);

    const relName = relationshipLevelNames[relationshipLevel];
    const npcLocation = locations.find(l => l.id === npc.location);
    const isMerchant = npc.inventory && npc.inventory.length > 0;

    const merchantItems = npc.inventory?.map(inv => {
        const item = items.find(i => i.id === inv.itemId);
        return item ? { ...item, stock: inv.stock, priceModifier: inv.priceModifier || 1 } : null;
    }).filter(Boolean) || [];

    const playerItems = character.inventory.filter(inv => inv.id !== 'gold').map(inv => {
        return { ...inv };
    });

    const playerGold = character.inventory.find(i => i.id === 'gold')?.quantity || 0;

    return (
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">
                    <Info className="mr-2 h-4 w-4" />
                    Информация
                </TabsTrigger>
                {isMerchant && (
                    <TabsTrigger value="trade">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Торговля
                    </TabsTrigger>
                )}
                <TabsTrigger value="gift">
                    <Gift className="mr-2 h-4 w-4" />
                    Подарок
                </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
                <div className="space-y-3">
                    <div>
                        <h4 className="font-semibold mb-2">Отношения</h4>
                        <Badge className={`${relationshipColors[relationshipLevel]} text-white`}>
                            {relName} (Уровень {relationshipLevel})
                        </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div>
                        <h4 className="font-semibold mb-2">Локация</h4>
                        <Badge variant="secondary">{npcLocation?.name || npc.location}</Badge>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="font-semibold mb-2">Диалог</h4>
                        <p className="text-sm text-muted-foreground italic">
                            "{randomDialogue}"
                        </p>
                    </div>

                    <Button 
                        onClick={() => onInteract(npc)} 
                        disabled={isInteracting}
                        className="w-full mt-4"
                    >
                        {isInteracting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <MessageSquare className="mr-2 h-4 w-4" />
                        )}
                        Поговорить
                    </Button>
                </div>
            </TabsContent>

            {isMerchant && (
                <TabsContent value="trade" className="space-y-4 mt-4">
                    <div className="flex gap-2 mb-4">
                        <Button
                            variant={tradeAction === 'buy' ? 'default' : 'outline'}
                            onClick={() => setTradeAction('buy')}
                            className="flex-1"
                        >
                            Купить
                        </Button>
                        <Button
                            variant={tradeAction === 'sell' ? 'default' : 'outline'}
                            onClick={() => setTradeAction('sell')}
                            className="flex-1"
                        >
                            Продать
                        </Button>
                    </div>

                    <div className="mb-2">
                        <Badge variant="outline">
                            <Coins className="mr-1 h-3 w-3" />
                            {playerGold} золота
                        </Badge>
                    </div>

                    {tradeAction === 'buy' ? (
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-2">
                                {merchantItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        У торговца нет товаров
                                    </p>
                                ) : (
                                    merchantItems.map((item: any) => {
                                        const unitPrice = computeBuyPrice(character as any, npc as any, item as any, 1);
                                        const base = computeBaseValue(item as any);
                                        const modNote = item.priceModifier && item.priceModifier !== 1 ? ` • модификатор x${item.priceModifier}` : '';
                                        return (
                                            <Card key={item.id} className="p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span>{unitPrice} золота</span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <div className="text-xs space-y-1">
                                                                            <div>База: {base}</div>
                                                                            <div>Редкость: {item.rarity || 'common'}</div>
                                                                            <div>Отношения влияют на цену</div>
                                                                            {modNote && <div>{modNote}</div>}
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onTrade(npc, 'buy', item.id, 1)}
                                                        disabled={isInteracting || playerGold < unitPrice}
                                                    >
                                                        Купить
                                                    </Button>
                                                </div>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    ) : (
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-2">
                                {playerItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        У вас нет предметов для продажи
                                    </p>
                                ) : (
                                    playerItems.map(item => {
                                        const sellPrice = computeSellPrice(character as any, npc as any, item as any, 1);
                                        const base = computeBaseValue(item as any);
                                        return (
                                            <Card key={item.id} className="p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span>{sellPrice} золота • x{item.quantity}</span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <div className="text-xs space-y-1">
                                                                            <div>База: {base}</div>
                                                                            <div>Редкость: {item.rarity || 'common'}</div>
                                                                            <div>Скупочная цена ~40%</div>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onTrade(npc, 'sell', item.id, 1)}
                                                        disabled={isInteracting}
                                                    >
                                                        Продать
                                                    </Button>
                                                </div>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </TabsContent>
            )}

            <TabsContent value="gift" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                    Подарите предмет чтобы улучшить отношения с {npc.name}
                </p>
                <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                        {playerItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                У вас нет предметов для подарка
                            </p>
                        ) : (
                            playerItems.map(item => {
                                return (
                                    <Card key={item.id} className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    x{item.quantity}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => onGift(npc, item.id)}
                                                disabled={isInteracting}
                                            >
                                                <Gift className="mr-1 h-3 w-3" />
                                                Подарить
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
    );
}
