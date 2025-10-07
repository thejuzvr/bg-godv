
"use client";

import React, { useState, useEffect } from 'react';
import type { Character } from '@/types/character';
import type { GameData } from '@/services/gameDataService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Clock, Beer, KeyRound } from 'lucide-react';

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

export const ActionProgressPanel = ({ character, gameData }: { character: Character, gameData: GameData }) => {
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState("");

    const activeAction = character.currentAction;

    useEffect(() => {
        if (!activeAction || activeAction.duration <= 0) {
            setProgress(0);
            setTimeLeft("");
            return;
        }

        const totalDuration = activeAction.originalDuration || activeAction.duration;

        const intervalId = setInterval(() => {
            const now = Date.now();
            const elapsedSinceResume = now - activeAction.startedAt;
            const remainingDuration = Math.max(0, activeAction.duration - elapsedSinceResume);
            
            const totalElapsed = totalDuration - remainingDuration;

            setProgress(Math.min(100, (totalElapsed / totalDuration) * 100));
            setTimeLeft(formatDuration(remainingDuration));
        }, 1000);
        
        // Immediately set initial state to avoid flicker
        const now = Date.now();
        const elapsedSinceResume = now - activeAction.startedAt;
        const remainingDuration = Math.max(0, activeAction.duration - elapsedSinceResume);
        const totalElapsed = totalDuration - remainingDuration;
        setProgress(Math.min(100, (totalElapsed / totalDuration) * 100));
        setTimeLeft(formatDuration(remainingDuration));


        return () => clearInterval(intervalId);

    }, [activeAction]);

    if (!activeAction) {
        return null;
    }
    
    let rewards = null;
    if (activeAction.type === 'quest' && activeAction.questId) {
        const quest = gameData.quests.find(q => q.id === activeAction.questId);
        if (quest) {
            rewards = (
                 <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{quest.reward.xp} опыта</Badge>
                    <Badge variant="outline">{quest.reward.gold} золота</Badge>
                    {quest.reward.items && quest.reward.items.map(itemReward => {
                        const itemInfo = gameData.items.find(i => i.id === itemReward.id);
                        return itemInfo ? (
                            <Badge key={itemReward.id} variant="outline">{itemInfo.name}</Badge>
                        ) : null;
                    })}
                 </div>
            );
        }
    }
    
    let icon = <Clock className="w-5 h-5 text-primary" />;
    if (activeAction.type === 'rest') {
        icon = <Beer className="w-5 h-5 text-primary" />
    }

    return (
        <Card className="border-primary ring-2 ring-primary/50">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-lg flex items-center gap-2">
                             {icon}
                             {activeAction.name}
                        </CardTitle>
                        <CardDescription>{activeAction.description}</CardDescription>
                    </div>
                     <p className="text-sm font-semibold text-primary">{timeLeft}</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <Label>Прогресс</Label>
                        <span className="text-sm font-mono text-muted-foreground">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} />
                </div>
                {rewards && (
                    <div>
                         <Label className="font-semibold mb-2 block">Возможные награды</Label>
                         {rewards}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export const CryptExplorationPanel = ({ character }: { character: Character }) => {
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState("");

    const activeCryptQuest = character.activeCryptQuest;

    useEffect(() => {
        if (!activeCryptQuest || activeCryptQuest.duration <= 0) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - activeCryptQuest.startedAt;
            const remaining = activeCryptQuest.duration - elapsed;

            setProgress(Math.min(100, (elapsed / activeCryptQuest.duration) * 100));
            setTimeLeft(formatDuration(remaining));
        }, 1000);

        return () => clearInterval(interval);

    }, [activeCryptQuest]);

    if (!activeCryptQuest) {
        return null;
    }

    return (
        <Card className="border-primary ring-2 ring-primary/50">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-lg flex items-center gap-2">
                             <KeyRound className="w-5 h-5 text-primary" />
                             {activeCryptQuest.stageName}
                        </CardTitle>
                        <CardDescription>{activeCryptQuest.stageDescription}</CardDescription>
                    </div>
                     <p className="text-sm font-semibold text-primary">{timeLeft}</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <Label>Прогресс этапа</Label>
                        <span className="text-sm font-mono text-muted-foreground">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} />
                </div>
                 <div>
                    <Label className="font-semibold mb-2 block">Ключ</Label>
                    <p className="text-sm text-muted-foreground">Используется: {character.inventory.find(i => i.id === activeCryptQuest.clawId)?.name}</p>
                </div>
            </CardContent>
        </Card>
    );
};
