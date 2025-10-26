"use client";

import { Cloud, CloudRain, CloudSnow, CloudFog, Sun, Wind } from "lucide-react";
import type { Character, Weather } from "@/types/character";
import { cn } from "@/lib/utils";

type WeatherInfo = {
  name: string;
  icon: React.ReactNode;
  description: string;
  travelEffect: string;
  color: string;
};

const weatherData: Record<Weather, WeatherInfo> = {
  Clear: {
    name: "Ясно",
    icon: <Sun className="h-5 w-5" />,
    description: "Отличная погода для путешествий",
    travelEffect: "Нормальная скорость",
    color: "text-yellow-500"
  },
  Cloudy: {
    name: "Облачно",
    icon: <Cloud className="h-5 w-5" />,
    description: "Комфортная погода",
    travelEffect: "Нормальная скорость",
    color: "text-gray-400"
  },
  Rain: {
    name: "Дождь",
    icon: <CloudRain className="h-5 w-5" />,
    description: "Мокро и скользко",
    travelEffect: "Замедление на 20%",
    color: "text-blue-400"
  },
  Snow: {
    name: "Снег",
    icon: <CloudSnow className="h-5 w-5" />,
    description: "Холодно и снежно",
    travelEffect: "Замедление на 30%",
    color: "text-cyan-300"
  },
  Fog: {
    name: "Туман",
    icon: <CloudFog className="h-5 w-5" />,
    description: "Плохая видимость",
    travelEffect: "Замедление на 25%",
    color: "text-gray-300"
  }
};

type MapWeatherHudProps = {
  character: Character;
  className?: string;
};

export function MapWeatherHud({ character, className }: MapWeatherHudProps) {
  const weather = weatherData[character.weather];

  return (
    <div className={cn(
      "bg-background/85 backdrop-blur-md border border-border rounded-lg shadow-xl p-4 min-w-[240px]",
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-md bg-muted/40", weather.color)}>
          {weather.icon}
        </div>
        <div>
          <div className="font-headline text-lg text-foreground">{weather.name}</div>
          <div className="text-xs text-muted-foreground">{weather.description}</div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Влияние на путешествие:</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="h-3 w-3 text-muted-foreground" />
          <span className={cn(
            "font-medium",
            character.weather === 'Clear' || character.weather === 'Cloudy' 
              ? "text-green-500" 
              : "text-orange-500"
          )}>
            {weather.travelEffect}
          </span>
        </div>
      </div>

      {/* Additional conditions */}
      {(character.weather === 'Rain' || character.weather === 'Snow') && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="text-yellow-500">⚠</span>
            <span>Больше шансов на случайные встречи</span>
          </div>
        </div>
      )}
    </div>
  );
}

