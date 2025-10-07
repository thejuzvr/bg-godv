
"use client";

import React from 'react';
import type { Character } from '@/types/character';
import { allSpells } from '@/data/spells';

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
    if (!character.knownSpells || character.knownSpells.length === 0) {
        return null;
    }

    const learnedSpells = character.knownSpells.map(spellId => 
        allSpells.find(s => s.id === spellId)
    ).filter((spell): spell is NonNullable<typeof spell> => !!spell);

    if (learnedSpells.length === 0) {
        return null;
    }

    return (
        <div>
            <Separator />
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
        </div>
    )
};
