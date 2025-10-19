
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
                        <Dialog key={spell.id}>
                            <DialogTrigger asChild>
                                <button
                                    className="flex items-center justify-center p-2 w-12 h-12 aspect-square rounded-lg border-2 border-primary bg-primary/20 text-primary"
                                    aria-label={spell.name}
                                >
                                    <Icon name={spell.icon} className="w-6 h-6" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>{spell.name}</DialogTitle>
                                    <DialogDescription>
                                        <span className="text-sm text-muted-foreground">Заклинание</span>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2">
                                    <p className="text-sm whitespace-pre-wrap break-words">{spell.description}</p>
                                    <p className="text-xs text-muted-foreground">Затраты маны: {spell.manaCost}</p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </div>
            )}

            {learnedShouts.length > 0 && (
            <div className="pt-4">
                <Label className="text-base font-semibold flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-primary"/> Крики</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                    {learnedShouts.map((shout) => (
                        <Dialog key={shout.id}>
                            <DialogTrigger asChild>
                                <button
                                    className="flex items-center justify-center p-2 w-12 h-12 aspect-square rounded-lg border-2 border-primary bg-primary/10 text-primary"
                                    aria-label={shout.name}
                                >
                                    <Icon name={shout.icon} className="w-6 h-6" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>{shout.name}</DialogTitle>
                                    <DialogDescription>
                                        <span className="text-sm text-muted-foreground">Крик</span>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2">
                                    <p className="text-sm whitespace-pre-wrap break-words">{shout.description}</p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </div>
            )}
        </div>
    )
};
