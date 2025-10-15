"use client";

import type { Character, Weather, Season, TimeOfDay, WeatherEffect, TimeOfDayEffect } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to get a Lucide icon by its string name
const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    // Fallback icon, e.g., Sun
    const Fallback = LucideIcons['Sun'];
    return <Fallback {...props} />;
  }
  return <LucideIcon {...props} />;
};

const weatherInfo: Record<Weather, { name: string; icon: string }> = {
    'Clear': { name: 'Ясно', icon: 'Sun' },
    'Cloudy': { name: 'Облачно', icon: 'Cloud' },
    'Rain': { name: 'Дождь', icon: 'CloudRain' },
    'Snow': { name: 'Снег', icon: 'Snowflake' },
    'Fog': { name: 'Туман', icon: 'CloudFog' },
};

const seasonInfo: Record<Season, { name: string; icon: string }> = {
    'Summer': { name: 'Лето', icon: 'Sun' },
    'Autumn': { name: 'Осень', icon: 'Leaf' },
    'Winter': { name: 'Зима', icon: 'Snowflake' },
    'Spring': { name: 'Весна', icon: 'Flower2' },
};

const timeOfDayInfo: Record<TimeOfDay, { name: string; icon: string; color: string }> = {
    'night': { name: 'Ночь', icon: 'Moon', color: 'text-purple-500' },
    'morning': { name: 'Утро', icon: 'Sunrise', color: 'text-yellow-500' },
    'day': { name: 'День', icon: 'Sun', color: 'text-blue-500' },
    'evening': { name: 'Вечер', icon: 'Sunset', color: 'text-orange-500' },
};

// Weather modifier functions (duplicated from game-engine.ts)
function getWeatherModifiers(weather: Weather): WeatherEffect {
    switch (weather) {
        case 'Clear':
            return {
                attackModifier: 0,
                stealthModifier: 0,
                findChanceModifier: 1.0,
                fatigueModifier: 1.0,
                moodModifier: 2,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 }
            };
        case 'Cloudy':
            return {
                attackModifier: 0,
                stealthModifier: 0,
                findChanceModifier: 1.0,
                fatigueModifier: 1.0,
                moodModifier: -1,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 }
            };
        case 'Rain':
            return {
                attackModifier: -2,
                stealthModifier: 0,
                findChanceModifier: 0.9,
                fatigueModifier: 1.1,
                moodModifier: -2,
                regenModifier: { health: 0.8, magicka: 0.9, stamina: 0.9, fatigue: 0.8 }
            };
        case 'Snow':
            return {
                attackModifier: -1,
                stealthModifier: 0,
                findChanceModifier: 0.85,
                fatigueModifier: 1.2,
                moodModifier: -1,
                regenModifier: { health: 0.9, magicka: 0.95, stamina: 0.9, fatigue: 0.9 }
            };
        case 'Fog':
            return {
                attackModifier: -1,
                stealthModifier: 2,
                findChanceModifier: 0.8,
                fatigueModifier: 1.0,
                moodModifier: -1,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 }
            };
        default:
            return {
                attackModifier: 0,
                stealthModifier: 0,
                findChanceModifier: 1.0,
                fatigueModifier: 1.0,
                moodModifier: 0,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 }
            };
    }
}

function getTimeOfDayModifiers(timeOfDay: TimeOfDay): TimeOfDayEffect {
    switch (timeOfDay) {
        case 'night':
            return {
                findChanceModifier: 0.7,
                enemyStrengthModifier: 1.2,
                stealthModifier: 2,
                fleeChanceModifier: 1.1,
                regenModifier: { health: 0.9, magicka: 0.7, stamina: 0.9, fatigue: 0.8 },
                npcAvailability: false
            };
        case 'morning':
            return {
                findChanceModifier: 1.0,
                enemyStrengthModifier: 1.0,
                stealthModifier: 0,
                fleeChanceModifier: 1.0,
                regenModifier: { health: 1.5, magicka: 1.2, stamina: 1.5, fatigue: 1.5 },
                npcAvailability: true
            };
        case 'day':
            return {
                findChanceModifier: 1.0,
                enemyStrengthModifier: 1.0,
                stealthModifier: 0,
                fleeChanceModifier: 1.0,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 },
                npcAvailability: true
            };
        case 'evening':
            return {
                findChanceModifier: 1.1,
                enemyStrengthModifier: 1.0,
                stealthModifier: 0,
                fleeChanceModifier: 1.0,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 },
                npcAvailability: false
            };
        default:
            return {
                findChanceModifier: 1.0,
                enemyStrengthModifier: 1.0,
                stealthModifier: 0,
                fleeChanceModifier: 1.0,
                regenModifier: { health: 1.0, magicka: 1.0, stamina: 1.0, fatigue: 1.0 },
                npcAvailability: true
            };
    }
}


export const WeatherPanel = ({ character }: { character: Character }) => {
    const currentSeason = seasonInfo[character.season];
    const currentWeather = weatherInfo[character.weather];
    const currentTimeOfDay = timeOfDayInfo[character.timeOfDay];
    const weatherEffect = getWeatherModifiers(character.weather);
    const timeOfDayEffect = getTimeOfDayModifiers(character.timeOfDay);

    const getModifierText = (modifier: number, type: string) => {
        if (modifier === 0) return null;
        const sign = modifier > 0 ? '+' : '';
        const color = modifier > 0 ? 'text-green-500' : 'text-red-500';
        return (
            <span className={`text-xs ${color}`}>
                {type}: {sign}{modifier}
            </span>
        );
    };

    const getMultiplierText = (multiplier: number, type: string) => {
        if (multiplier === 1.0) return null;
        const percent = Math.round((multiplier - 1) * 100);
        const sign = percent > 0 ? '+' : '';
        const color = percent > 0 ? 'text-green-500' : 'text-red-500';
        return (
            <span className={`text-xs ${color}`}>
                {type}: {sign}{percent}%
            </span>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Icon name={currentSeason.icon} className="h-5 w-5 text-primary" />
                    Мировые условия
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icon name={currentTimeOfDay.icon} className={`h-5 w-5 ${currentTimeOfDay.color}`} />
                        <p className="text-sm font-medium">Время суток</p>
                    </div>
                    <p className={`text-sm font-semibold ${currentTimeOfDay.color}`}>{currentTimeOfDay.name}</p>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icon name={currentSeason.icon} className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium">Время года</p>
                    </div>
                    <p className="text-sm font-semibold">{currentSeason.name}</p>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icon name={currentWeather.icon} className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium">Погода</p>
                    </div>
                    <p className="text-sm font-semibold">{currentWeather.name}</p>
                </div>
                
                {/* Active Modifiers */}
                <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Активные эффекты:</p>
                    <div className="space-y-1">
                        {getModifierText(weatherEffect.attackModifier, 'Атака') && (
                            <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">Боевые действия:</span>
                                {getModifierText(weatherEffect.attackModifier, 'Атака')}
                            </div>
                        )}
                        {getModifierText(weatherEffect.stealthModifier + timeOfDayEffect.stealthModifier, 'Скрытность') && (
                            <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">Скрытность:</span>
                                {getModifierText(weatherEffect.stealthModifier + timeOfDayEffect.stealthModifier, 'Скрытность')}
                            </div>
                        )}
                        {getMultiplierText(weatherEffect.findChanceModifier * timeOfDayEffect.findChanceModifier, 'Поиск предметов') && (
                            <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">Поиск предметов:</span>
                                {getMultiplierText(weatherEffect.findChanceModifier * timeOfDayEffect.findChanceModifier, 'Поиск предметов')}
                            </div>
                        )}
                        {getMultiplierText(weatherEffect.fatigueModifier, 'Усталость') && (
                            <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">Усталость:</span>
                                {getMultiplierText(weatherEffect.fatigueModifier, 'Усталость')}
                            </div>
                        )}
                        {!timeOfDayEffect.npcAvailability && (
                            <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">NPC:</span>
                                <span className="text-xs text-red-500">Недоступны</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
