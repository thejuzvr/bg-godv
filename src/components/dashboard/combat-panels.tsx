
"use client";

import React, { useRef, useEffect } from 'react';
import type { Character, CombatState } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SwordIcon } from '@/components/icons';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dices, Heart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CombatLogPanel = ({ log }: { log: string[] }) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = 0;
            }
        }
    }, [log]);

    return (
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="font-headline text-lg">Журнал Боя</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <ScrollArea className="h-48" ref={scrollAreaRef}>
                    <div className="space-y-2 text-sm">
                        {log.map((message, index) => (
                            <p key={index} className="text-foreground/90">{message}</p>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export const CombatStatusPanel = ({ character, combatState }: { character: Character, combatState: CombatState }) => {
    const enemy = combatState.enemy;
    const lastRoll = combatState.lastRoll;

    return (
        <Card className="border-destructive ring-1 ring-destructive/50">
            <CardHeader className="p-4">
                <div className="flex items-center gap-2">
                    <SwordIcon className="h-5 w-5 text-destructive" />
                    <CardTitle className="font-headline text-lg text-destructive">Бой!</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                 <div className="space-y-1">
                    <h4 className="font-semibold">{character.name}</h4>
                    <div>
                        <div className="flex justify-between items-center mb-1 text-xs">
                            <Label className="flex items-center gap-1 font-semibold"><Heart className="h-3 w-3 text-destructive"/>Здоровье</Label>
                            <span className="font-mono text-muted-foreground">{Math.max(0, character.stats.health.current)} / {character.stats.health.max}</span>
                        </div>
                        <Progress value={(character.stats.health.current / character.stats.health.max) * 100} className="h-2 [&>div]:bg-destructive" />
                    </div>
                </div>

                {lastRoll && (
                    <div className={cn(
                        "p-2 rounded-md text-center text-xs border",
                        lastRoll.actor === 'hero' ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'
                    )}>
                        <p className="font-bold flex items-center justify-center gap-2">
                            <Dices className="h-4 w-4" />
                            {lastRoll.actor === 'hero' ? 'Бросок героя' : 'Бросок врага'}: {lastRoll.action}
                        </p>
                        <p className="font-mono">
                           {lastRoll.roll} (d20) + {lastRoll.bonus} (бонус) = <span className="font-bold">{lastRoll.total}</span> (цель: {lastRoll.target})
                        </p>
                    </div>
                )}


                <div className="space-y-1">
                    <h4 className="font-semibold">{enemy.name}</h4>
                    <div>
                        <div className="flex justify-between items-center mb-1 text-xs">
                            <Label className="flex items-center gap-1 font-semibold"><Heart className="h-3 w-3 text-destructive"/>Здоровье</Label>
                            <span className="font-mono text-muted-foreground">{Math.max(0, enemy.health.current)} / {enemy.health.max}</span>
                        </div>
                        <Progress value={(enemy.health.current / enemy.health.max) * 100} className="h-2 [&>div]:bg-destructive" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
