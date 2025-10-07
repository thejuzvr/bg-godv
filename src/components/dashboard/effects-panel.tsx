
"use client";

import React, { useState, useEffect } from 'react';
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveEffect } from '@/types/character';

import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star } from 'lucide-react';

const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <Star {...props} />;
  }
  return <LucideIcon {...props} />;
};

function formatDuration(milliseconds: number): string {
    if (milliseconds <= 0) return "0s";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}

export const EffectsPanel = ({ effects }: { effects: ActiveEffect[] }) => {
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    if (effects.length === 0) {
        return null;
    }

    return (
        <div>
            <Separator />
            <div className="pt-4">
                <Label className="text-base font-semibold">Активные эффекты</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                    {effects.map((effect) => {
                        const remaining = effect.expiresAt - time;
                        if (remaining <= 0) return null;
                        return (
                             <TooltipProvider key={effect.id}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={cn("flex items-center justify-center p-2 w-12 h-12 aspect-square rounded-lg border-2", 
                                            effect.type === 'buff' ? 'border-primary bg-primary/20 text-primary' : 'border-destructive bg-destructive/20 text-destructive'
                                            )}
                                        >
                                            <Icon name={effect.icon} className="w-6 h-6" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-bold">{effect.name}</p>
                                        <p className="text-sm text-muted-foreground">{effect.description}</p>
                                        <p className="text-xs">Осталось: {formatDuration(remaining)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )
                    })}
                </div>
            </div>
        </div>
    )
};
