"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import type { Character } from "@/types/character";
import { useToast } from "@/hooks/use-toast";
import * as LucideIcons from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { NPC } from "@/types/npc";
import type { Location } from "@/types/location";
import type { CharacterInventoryItem } from "@/types/character";
import { interactWithNPC, tradeWithNPC, giftToNPC } from "@/actions/npc-actions";
import { computeBuyPrice, computeSellPrice, computeBaseValue } from "@/services/pricing";
import { fetchNPCs, fetchLocations, fetchItems } from "@/actions/game-data-actions";

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

export default function SocietyPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);
    const [character, setCharacter] = useState<Character | null>(null);
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
                const [char, npcsData, locationsData, itemsData] = await Promise.all([
                    fetchCharacter(user.userId),
                    fetchNPCs(),
                    fetchLocations(),
                    fetchItems(),
                ]);
                
                if (char) {
                    setCharacter(char);
                } else {
                    router.push('/create-character');
                }
                
                setNpcs(npcsData);
                setLocations(locationsData);
                setItems(itemsData);
            } catch (error) {
                console.error('Error loading character:', error);
                toast({
                    title: "Ошибка",
                    description: "Не удалось загрузить персонажа",
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
            <div className="flex items-center justify-center h-full">
                <LucideIcons.Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!character) {
        return null;
    }

    const currentLocation = locations.find(l => l.id === character.location);

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Общество</h1>
                    <p className="text-muted-foreground">
                        Взаимодействуйте с жителями Скайрима
                    </p>
                </div>
                <Badge variant="outline" className="text-sm">
                    <LucideIcons.MapPin className="mr-1 h-3 w-3" />
                    {currentLocation?.name || character.location}
                </Badge>
            </div>

            <Tabs defaultValue="current" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="current">
                        <LucideIcons.Users className="mr-2 h-4 w-4" />
                        Здесь ({currentLocationNPCs.length})
                    </TabsTrigger>
                    <TabsTrigger value="all">
                        <LucideIcons.Globe className="mr-2 h-4 w-4" />
                        Все NPC ({npcs.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="space-y-4">
                    {currentLocationNPCs.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <LucideIcons.User className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">В этой локации нет NPC</p>
                            </CardContent>
                        </Card>
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
                                                        <LucideIcons.MessageSquare className="mr-2 h-4 w-4" />
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
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Поиск по имени или описанию..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Локация" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Все локации</SelectItem>
                                            {locations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.id}>
                                                    {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Тип" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Все типы</SelectItem>
                                            <SelectItem value="merchant">Торговцы</SelectItem>
                                            <SelectItem value="companion">Компаньоны</SelectItem>
                                            <SelectItem value="citizen">Жители</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {filteredNPCs.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <LucideIcons.Search className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Ничего не найдено</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredNPCs.map(npc => {
                                const relLevel = getRelationshipLevel(npc.id);
                                const relName = relationshipLevelNames[relLevel];
                                const relColor = relationshipColors[relLevel];
                                const npcLocation = locations.find(l => l.id === npc.location);

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
                                            <Badge variant="secondary" className="text-xs">
                                                {npcLocation?.name || npc.location}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

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
                    <LucideIcons.Info className="mr-2 h-4 w-4" />
                    Информация
                </TabsTrigger>
                {isMerchant && (
                    <TabsTrigger value="trade">
                        <LucideIcons.ShoppingCart className="mr-2 h-4 w-4" />
                        Торговля
                    </TabsTrigger>
                )}
                <TabsTrigger value="gift">
                    <LucideIcons.Gift className="mr-2 h-4 w-4" />
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
                            <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <LucideIcons.MessageSquare className="mr-2 h-4 w-4" />
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
                            <LucideIcons.Coins className="mr-1 h-3 w-3" />
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
                                        const modNote = item.priceModifier && item.priceModifier !== 1 ? ` • модификатор торговца x${item.priceModifier}` : '';
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
                                                                            <div>Отношения/красноречие: скидка применяется</div>
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
                                                                            <div>Скупочная цена ~40% от покупки</div>
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
                                                <LucideIcons.Gift className="mr-1 h-3 w-3" />
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
