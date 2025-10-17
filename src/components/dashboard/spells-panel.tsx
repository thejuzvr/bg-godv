
"use client";

import React, { useEffect, useState } from 'react';
import type { Character } from '@/types/character';
import { allSpells } from '@/data/spells';
import { useAuth } from '@/hooks/use-auth';
import { allShouts } from '@/data/shouts';

import * as LucideIcons from "lucide-react";
import { BrainCircuit, Star } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <Star {...props} />;
  }
  return <LucideIcon {...props} />;
};

export const SpellsPanel = ({ character }: { character: Character }) => {
    const knownSpells = character.knownSpells || [];
    const initialShouts = ((character as any).knownShouts as string[] | undefined) || ((character as any).preferences?.knownShouts as string[] | undefined) || [];
    const [knownShouts, setKnownShouts] = useState<string[]>(initialShouts);
    const { user } = useAuth(false);

    useEffect(() => {
        const cid = character?.id || user?.userId;
        if (!cid) return;
        fetch(`/api/shouts/known?characterId=${cid}`)
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data?.shouts)) {
                setKnownShouts(data.shouts.map((s: any) => s.id));
            }
          })
          .catch(() => {});
    }, [character?.id, user?.userId]);
    if (knownSpells.length === 0 && knownShouts.length === 0) {
        return null;
    }

    const learnedSpells = knownSpells.map(spellId => 
        allSpells.find(s => s.id === spellId)
    ).filter((spell): spell is NonNullable<typeof spell> => !!spell);

    const learnedShouts = knownShouts.map(id => allShouts.find(s => s.id === id)).filter(Boolean) as typeof allShouts;

    return (
        <div>
            <Separator />
            {learnedSpells.length > 0 && (
            <div className="pt-4">
                <Label className="text-base font-semibold flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-primary"/> Книга заклинаний</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                    {learnedSpells.map((spell) => (
                         <TooltipProvider key={spell.id}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className="flex items-center justify-center p-2 w-12 h-12 aspect-square rounded-lg border-2 border-primary bg-primary/20 text-primary"
                                    >
                                        <Icon name={spell.icon} className="w-6 h-6" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-bold">{spell.name}</p>
                                    <p className="text-sm text-muted-foreground">{spell.description}</p>
                                    <p className="text-xs text-muted-foreground">Затраты маны: {spell.manaCost}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
            </div>
            )}

            {learnedShouts.length > 0 && (
            <div className="pt-4">
                <Label className="text-base font-semibold flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-primary"/> Крики</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                    {learnedShouts.map((shout) => (
                         <TooltipProvider key={shout.id}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className="flex items-center justify-center p-2 w-12 h-12 aspect-square rounded-lg border-2 border-primary bg-primary/10 text-primary"
                                    >
                                        <Icon name={shout.icon} className="w-6 h-6" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-bold">{shout.name}</p>
                                    <p className="text-sm text-muted-foreground">{shout.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
            </div>
            )}
        </div>
    )
};
