
"use client";

import React from 'react';
import type { Character, EquipmentSlot } from '@/types/character';

import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { SwordIcon } from '@/components/icons';
import { Crown, Shirt, Footprints, Hand, Star, Gem, ShieldCheck, Wand, Heart, Zap, Coins, Skull } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const EquipmentPanel = ({ character }: { character: Character }) => {
    const slots: EquipmentSlot[] = ['weapon', 'head', 'torso', 'legs', 'hands', 'feet', 'amulet', 'ring'];
    const slotIcons: Record<EquipmentSlot, React.ElementType> = {
        weapon: SwordIcon,
        head: Crown,
        torso: Shirt,
        legs: Footprints,
        hands: Hand,
        feet: Footprints,
        amulet: Gem,
        ring: Star,
    };
    const slotNames: Record<EquipmentSlot, string> = {
        weapon: "Оружие",
        head: "Голова",
        torso: "Торс",
        legs: "Поножи",
        hands: "Руки",
        feet: "Ботинки",
        amulet: "Амулет",
        ring: "Кольцо",
    };

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
    const totalAttack = equippedWeapon?.damage || 1; // Base unarmed damage

    return (
      <>
        <div>
            <div className="flex justify-between items-center mb-1">
                <Label className="flex items-center gap-2 font-semibold"><Heart className="text-destructive"/>Здоровье</Label>
                <span className="text-sm font-mono text-muted-foreground">{character.stats.health.current} / {character.stats.health.max}</span>
            </div>
            <Progress value={(character.stats.health.current / character.stats.health.max) * 100} className="h-3 [&>div]:bg-destructive" />
        </div>
        <div>
            <div className="flex justify-between items-center mb-1">
                <Label className="flex items-center gap-2 font-semibold"><Wand className="text-primary"/>Магия</Label>
                <span className="text-sm font-mono text-muted-foreground">{character.stats.magicka.current} / {character.stats.magicka.max}</span>
            </div>
            <Progress value={(character.stats.magicka.current / character.stats.magicka.max) * 100} className="h-3" />
        </div>
        <div>
            <div className="flex justify-between items-center mb-1">
                <Label className="flex items-center gap-2 font-semibold"><Zap className="text-secondary-foreground/80"/>Запас сил</Label>
                <span className="text-sm font-mono text-muted-foreground">{character.stats.stamina.current} / {character.stats.stamina.max}</span>
            </div>
            <Progress value={(character.stats.stamina.current / character.stats.stamina.max) * 100} className="h-3 [&>div]:bg-secondary-foreground/80" />
        </div>
        <Separator/>
        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Coins/>Золото</span>
                <span className="font-semibold">{character.inventory.find(i => i.id === 'gold')?.quantity || 0}</span>
            </div>
                <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Skull/>Смертей</span>
                <span className="font-semibold">{character.deaths}</span>
            </div>
        </div>
        <Separator />
        <div className="pt-4">
            <Label className="text-base font-semibold flex items-center gap-2 mb-2"><ShieldCheck className="w-5 h-5 text-primary"/> Снаряжение</Label>
             <div className="flex items-center justify-between text-sm mb-4">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <SwordIcon className="h-4 w-4" />
                                <span>Урон: {totalAttack}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Урон от оружия</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ShieldCheck size={16} />
                                <span>Броня: {totalArmor}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Общий класс брони</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="space-y-3 text-sm">
                {slots.map(slot => {
                    const item = getEquippedItem(slot);
                    const Icon = slotIcons[slot];
                    let details = 'Пусто';
                    if (item) {
                         if (slot === 'weapon') {
                            details = `${item.name} (Урон: ${item.damage ?? 0})`;
                        } else if (item.armor !== undefined) {
                            details = `${item.name} (Броня: ${item.armor})`;
                        } else {
                            details = item.name;
                        }
                    }

                    return (
                        <div key={slot} className="flex items-center gap-3">
                             <Icon className="w-5 h-5 text-primary-foreground/70"/>
                            <div>
                                <p className="font-semibold">{slotNames[slot]}</p>
                                <p className="text-xs text-muted-foreground">{details}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      </>
    );
}
