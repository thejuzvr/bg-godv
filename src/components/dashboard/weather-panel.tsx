"use client";

import type { Character, Weather, Season } from '@/types/character';
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


export const WeatherPanel = ({ character }: { character: Character }) => {
    const currentSeason = seasonInfo[character.season];
    const currentWeather = weatherInfo[character.weather];

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
            </CardContent>
        </Card>
    );
};
