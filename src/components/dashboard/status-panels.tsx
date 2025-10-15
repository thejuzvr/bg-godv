
"use client";

import React, { useState, useEffect } from 'react';
import type { Character } from '@/types/character';
import type { GameData } from '@/services/gameDataService';
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Bed, Infinity, Sparkles } from 'lucide-react';
import { ActionProgressPanel } from './action-panels';

export const SovngardeStatusPanel = ({ character, gameData }: { character: Character, gameData: GameData }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!character.respawnAt) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, character.respawnAt! - now);
            const minutes = Math.floor((remaining / 1000 / 60));
            const seconds = Math.floor((remaining / 1000) % 60);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [character.respawnAt]);

    const totalDuration = character.respawnAt && character.deathOccurredAt 
        ? character.respawnAt - character.deathOccurredAt 
        : 0;
    
    const remainingDuration = character.respawnAt ? Math.max(0, character.respawnAt - Date.now()) : 0;

    const progressValue = totalDuration > 0 ? ((totalDuration - remainingDuration) / totalDuration) * 100 : 0;
    
    return (
        <Card className="border-primary ring-2 ring-primary/50">
            <CardHeader className="text-center">
                 <CardTitle className="font-headline text-primary">Совнгард</CardTitle>
                 <CardDescription>Душа героя отдыхает в Залах доблести, ожидая искупления.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                 <Image src="https://placehold.co/400x200.png" data-ai-hint="heavenly hall" alt="Sovngarde" width={400} height={200} className="rounded-lg object-cover mx-auto" />
                 
                 <div className="space-y-2 text-left">
                    <p className="font-semibold text-center">Возрождение через: {timeLeft}</p>
                    <Progress value={progressValue} className="w-full" />
                 </div>
                 
                 <Separator />

                 <div>
                    <h4 className="font-headline text-lg text-primary mb-2">Дела в Зале Доблести</h4>
                    {character.currentAction?.type === 'sovngarde_quest' ? (
                       <ActionProgressPanel character={character} gameData={gameData} />
                    ) : (
                        <p className="text-sm text-muted-foreground p-3 rounded-lg bg-secondary/50">Герой ищет, чем бы заняться, чтобы скоротать вечность.</p>
                    )}
                 </div>
            </CardContent>
        </Card>
    );
};

export const SleepingStatusPanel = ({ character }: { character: Character }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!character.sleepUntil) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, character.sleepUntil! - now);
            const minutes = Math.floor((remaining / 1000 / 60) % 60);
            const seconds = Math.floor((remaining / 1000) % 60);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [character.sleepUntil]);
    
    const totalDuration = 5 * 60 * 1000;
    const remainingDuration = character.sleepUntil ? Math.max(0, character.sleepUntil - Date.now()) : 0;
    const progressValue = totalDuration > 0 ? ((totalDuration - remainingDuration) / totalDuration) * 100 : 0;


    return (
        <Card className="border-secondary ring-2 ring-secondary/50">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Bed className="h-6 w-6 text-secondary-foreground" />
                    <CardTitle className="font-headline text-secondary-foreground">Сон</CardTitle>
                </div>
                <CardDescription>Герой крепко спит в таверне, восстанавливая силы.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <p className="text-muted-foreground text-center">"Тсс... не будите спящего драконорожденного."</p>
                 <p className="font-semibold text-center">Проснется через: {timeLeft}</p>
                 <Progress value={progressValue} className="w-full mt-4" />
            </CardContent>
        </Card>
    );
};


export const SovngardeConditionsPanel = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Атмосфера Совнгарда
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium">Состояние</p>
                    </div>
                    <p className="text-sm font-semibold">Легендарное</p>
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <Infinity className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium">Время</p>
                    </div>
                    <p className="text-sm font-semibold">Вечность</p>
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground text-center">Воздух пропитан историями о доблести и чести.</p>
            </CardContent>
        </Card>
    );
};

export const DiseaseStatusPanel = ({ character }: { character: Character }) => {
    const disease = character.effects.find(e => e.id === 'disease_vampirism' || e.id === 'disease_lycanthropy');
    if (!disease) return null;
    const isVampire = disease.id === 'disease_vampirism';
    const hunger = disease.data?.hungerLevel || 0;
    const isDay = character.timeOfDay === 'day';
    const status = isVampire ? (isDay ? 'Дневная слабость' : 'Ночная терпимость') : (character.timeOfDay === 'night' ? 'Ночная сила' : 'Дневное спокойствие');
    const hungerText = ['Сыт', 'Лёгкий голод', 'Голод', 'Сильный голод'][Math.min(3, hunger)];
    return (
        <Card className="border-destructive/50 ring-2 ring-destructive/30">
            <CardHeader>
                <CardTitle className="font-headline text-lg">
                    {isVampire ? 'Вампиризм' : 'Ликантропия'}
                </CardTitle>
                <CardDescription>{status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="text-sm">
                    <div className="flex justify-between"><span>Сытость:</span><span className="font-mono">{hungerText}</span></div>
                </div>
                {character.currentAction?.name && (character.currentAction.name === 'Лечение болезни' || character.currentAction.name === 'Охота за кровью' || character.currentAction.name === 'Охота на зверя') && (
                    <div>
                        <ActionProgressPanel character={character} gameData={{} as any} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
