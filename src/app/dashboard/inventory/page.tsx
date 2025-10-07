
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Character, CharacterInventoryItem, EquipmentSlot } from '@/types/character';
import { fetchCharacter } from '@/app/dashboard/shared-actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as LucideIcons from 'lucide-react';
import { SwordIcon } from '@/components/icons';
import { equipItem, updateAutoEquipPreference, clearInventory } from './actions';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const inventoryCapacity = 150;

const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <LucideIcons.HelpCircle {...props} />; // Fallback icon
  }
  return <LucideIcon {...props} />;
};

const equipmentSlots: { id: EquipmentSlot; name: string; icon: string }[] = [
    { id: 'head', name: 'Шлем', icon: 'Crown' },
    { id: 'amulet', name: 'Амулет', icon: 'Gem' },
    { id: 'weapon', name: 'Оружие', icon: 'Sword' },
    { id: 'torso', name: 'Броня', icon: 'Shirt' },
    { id: 'ring', name: 'Кольцо', icon: 'Ring' },
    { id: 'hands', name: 'Перчатки', icon: 'Hand' },
    { id: 'feet', name: 'Сапоги', icon: 'Footprints' },
];

const itemTypeFilters = [
    { id: 'all', name: 'Все', icon: 'LayoutGrid' },
    { id: 'weapon', name: 'Оружие', icon: 'Sword' },
    { id: 'armor', name: 'Броня', icon: 'Shield' },
    { id: 'potion', name: 'Зелья', icon: 'FlaskConical' },
    { id: 'spell_tome', name: 'Тома', icon: 'Book' },
    { id: 'learning_book', name: 'Книги', icon: 'BookHeart' },
    { id: 'misc', name: 'Разное', icon: 'Package' },
];

export default function InventoryPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);
    const [character, setCharacter] = useState<Character | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                const char = await fetchCharacter(user.userId);
                if (char) {
                    setCharacter(char);
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
    
    const handleEquipItem = async (item: CharacterInventoryItem) => {
        if (!user || !character || !item.equipmentSlot) return;
        setIsSaving(true);

        const result = await equipItem(user.userId, item.id, item.equipmentSlot);
        if (result.success && result.character) {
            setCharacter(result.character);
            toast({
                title: "Снаряжение обновлено",
                description: `Герой надел: ${item.name}.`
            });
        } else {
             toast({
                title: "Ошибка",
                description: result.message,
                variant: "destructive"
            });
        }
        setIsSaving(false);
    };
    
    const handleClearInventory = async () => {
        if (!user || !character) return;
        setIsSaving(true);
        const result = await clearInventory(user.userId);
         if (result.success && result.character) {
            setCharacter(result.character);
            toast({
                title: "Инвентарь очищен",
                description: result.message
            });
        } else {
             toast({
                title: "Ошибка",
                description: result.message,
                variant: "destructive"
            });
        }
        setIsSaving(false);
    }

    const handleAutoEquipToggle = async (enabled: boolean) => {
        if (!user || !character) return;
        
        const currentPrefs = character.preferences || {};
        setCharacter({
            ...character,
            preferences: { ...currentPrefs, autoEquip: enabled }
        });

        const result = await updateAutoEquipPreference(user.userId, enabled);
        toast({
            title: result.success ? "Настройка сохранена" : "Ошибка",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка инвентаря...</div>;
    }

    if (!character) {
        return null;
    }

    const inventoryWeight = character.inventory.reduce((acc, item) => acc + (item.weight * item.quantity), 0);
    const goldAmount = character.inventory.find(i => i.id === 'gold')?.quantity || 0;
    
    const getEquippedItem = (slot: EquipmentSlot) => {
        const itemId = character.equippedItems[slot];
        return itemId ? character.inventory.find(i => i.id === itemId) : null;
    };
    
    const totalArmor = 5 + Object.entries(character.equippedItems)
        .filter(([slot, itemId]) => ['head', 'torso', 'legs', 'hands', 'feet'].includes(slot as EquipmentSlot) && itemId)
        .reduce((sum, [, itemId]) => {
            const item = character.inventory.find(i => i.id === itemId);
            return sum + (item?.armor || 0);
        }, 0);

    const equippedWeapon = getEquippedItem('weapon');
    const totalDamage = equippedWeapon?.damage || 1;
    
    const filteredInventory = character.inventory
        .filter(item => {
            if (item.type === 'gold') return false;
            const matchesFilter = filter === 'all' || item.type === filter;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesSearch;
        })
        .sort((a,b) => a.name.localeCompare(b.name));
    
    const isAutoEquipEnabled = character.preferences?.autoEquip ?? false;

    return (
        <div className="w-full font-body p-4 md:p-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-headline text-primary">Управление инвентарем</h1>
                    <p className="text-muted-foreground">Организуйте предметы и экипировку вашего персонажа</p>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Экипировка</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                                {equipmentSlots.map((slot) => {
                                    const item = getEquippedItem(slot.id);
                                    return (
                                        <TooltipProvider key={slot.id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="aspect-square p-2 border rounded-lg flex flex-col items-center justify-center gap-1 bg-secondary/30">
                                                        { slot.icon === 'Sword' ? <SwordIcon className="w-5 h-5 text-muted-foreground" /> : <Icon name={slot.icon} className="w-5 h-5 text-muted-foreground" /> }
                                                        <span className="text-xs text-muted-foreground">{slot.name}</span>
                                                        <span className="text-xs font-semibold text-center truncate w-full">{item?.name || 'Пусто'}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {item ? (
                                                        <div>
                                                            <p className="font-bold">{item.name}</p>
                                                            {item.damage && <p>Урон: {item.damage}</p>}
                                                            {item.armor && <p>Броня: {item.armor}</p>}
                                                        </div>
                                                    ) : <p>{slot.name}</p> }
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                })}
                                 <div className="aspect-square p-2 border rounded-lg flex flex-col items-center justify-center gap-1 bg-secondary/30 opacity-50">
                                     <Icon name="Shield" className="w-5 h-5 text-muted-foreground" />
                                     <span className="text-xs text-muted-foreground">Щит</span>
                                     <span className="text-xs font-semibold text-center truncate w-full">Пусто</span>
                                 </div>
                            </div>
                            <div className="mt-4 text-sm text-muted-foreground space-y-1">
                                <div className="flex justify-between"><span>Защита:</span> <span className="font-semibold text-foreground">{totalArmor}</span></div>
                                <div className="flex justify-between"><span>Урон:</span> <span className="font-semibold text-foreground">{totalDamage}</span></div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Статистика и Управление</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-2"><Icon name="Weight" className="w-4 h-4"/>Нагрузка:</span>
                                <span className="font-semibold">{inventoryWeight.toFixed(1)} / {inventoryCapacity} кг</span>
                            </div>
                            <div className="p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex justify-between items-center">
                                <span className="font-semibold text-yellow-300">Золото персонажа</span>
                                <span className="font-bold text-lg text-yellow-300 flex items-center gap-1">{goldAmount} <Icon name="Coins" className="w-4 h-4"/></span>
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <Switch
                                    id="auto-equip"
                                    checked={isAutoEquipEnabled}
                                    onCheckedChange={handleAutoEquipToggle}
                                />
                                <Label htmlFor="auto-equip">Авто-экипировка</Label>
                            </div>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full" disabled={isSaving}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Очистить инвентарь
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Это действие необратимо. Все предметы в инвентаре, кроме золота, будут удалены. Вся экипировка будет снята.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClearInventory} disabled={isSaving}>
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Очистить"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Right Column */}
                <div className="lg:col-span-3">
                    <Card>
                        <CardContent className="p-4 space-y-4">
                             <div className="relative">
                                <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Поиск предметов..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {itemTypeFilters.map((type) => (
                                     <Button key={type.id} variant={filter === type.id ? "default" : "secondary"} size="sm" onClick={() => setFilter(type.id)}>
                                        <Icon name={type.icon} className="mr-2 w-4 h-4"/>
                                        {type.name}
                                     </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="mt-8">
                        {filteredInventory.length === 0 ? (
                            <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                                <Icon name="Box" className="w-16 h-16 mx-auto text-muted-foreground/50"/>
                                <h3 className="mt-4 text-lg font-semibold">Инвентарь пуст</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Отправляйтесь в приключения, чтобы найти предметы.</p>
                            </div>
                        ) : (
                             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredInventory.map((item, i) => (
                                    <Card key={item.id + i} className="hover:border-primary/50 transition-colors flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="text-base font-semibold truncate">{item.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                                            <p className="text-sm text-muted-foreground">Кол-во: {item.quantity}</p>
                                            {item.damage != null && <p className="text-sm text-muted-foreground">Урон: {item.damage}</p>}
                                            {item.armor != null && <p className="text-sm text-muted-foreground">Броня: {item.armor}</p>}
                                        </CardContent>
                                        {!isAutoEquipEnabled && item.equipmentSlot && (
                                            <CardFooter>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="w-full"
                                                    onClick={() => handleEquipItem(item)}
                                                    disabled={isSaving || character.equippedItems[item.equipmentSlot] === item.id}
                                                >
                                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    {character.equippedItems[item.equipmentSlot] === item.id ? 'Надето' : 'Надеть'}
                                                </Button>
                                            </CardFooter>
                                        )}
                                    </Card>
                                ))}
                             </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
