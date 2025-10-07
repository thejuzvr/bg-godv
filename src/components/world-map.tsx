"use client";

import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Location, LocationType } from "@/types/location";
import { Building2, Castle, Tent, TowerControl, LandPlot } from "lucide-react";

type WorldMapProps = {
  currentCity: string;
  locations: Location[];
  onLocationClick: (locationId: string) => void;
};

function LocationIcon({ type, className }: { type: LocationType, className?: string }) {
  const commonClasses = "w-full h-full";
  const finalClassName = cn(commonClasses, className);

  switch (type) {
    case 'city':
      return <Castle className={finalClassName} />;
    case 'town':
      return <Building2 className={finalClassName} />;
    case 'dungeon':
       return <LandPlot className={finalClassName} />;
    case 'ruin':
      return <TowerControl className={finalClassName} />;
    case 'camp':
      return <Tent className={finalClassName} />;
    default:
      return <div className="w-2 h-2 rounded-full bg-white" />;
  }
}

export function WorldMap({ currentCity, locations, onLocationClick }: WorldMapProps) {
  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch("/images/world-map/SR-map-Skyrim_DE.svg"); // ❗ Проверьте правильность имени файла
        const svgText = await response.text();
        setSvgContent(svgText);
      } catch (error) {
        console.error("Failed to load SVG:", error);
      }
    };
    loadSvg();
  }, []);

  const [svgContent, setSvgContent] = useState<string>("");

  return (
    <TooltipProvider>
      {/* Этот контейнер теперь будет растягиваться благодаря TransformWrapper */}
      <div className="relative w-[2048px] h-[1489px] bg-background">
        <div
          className="w-full h-full relative" // Убедимся, что внутренний контейнер тоже растягивается
        >
          {/* 🖼️ SVG карта */}
          <div
            className="absolute inset-0 w-full h-full"
            onDragStart={(e) => e.preventDefault()}
          >
            <div
              // Добавляем стили для SVG, чтобы он корректно отображался
              className="[&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>

          {/* 📍 Метки локаций */}
          {locations.map((loc) => (
            <Tooltip key={loc.id}>
              <TooltipTrigger asChild>
                <div
                  className="absolute flex items-center justify-center w-8 h-8 p-1.5 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-pointer bg-background/60 backdrop-blur-sm rounded-full border-2 border-primary/30 hover:!scale-[1.75] hover:border-accent"
                  style={{
                    top: `${loc.coords.y}%`,
                    left: `${loc.coords.x}%`,
                  }}
                  onClick={() => onLocationClick(loc.id)}
                >
                  <LocationIcon
                    type={loc.type}
                    className={cn(
                      "text-primary-foreground drop-shadow-lg",
                      loc.id === currentCity &&
                        "text-accent animate-pulse"
                    )}
                  />
                  {loc.id === currentCity && (
                    <div className="absolute inset-0 rounded-full ring-2 ring-accent ring-offset-2 ring-offset-background/50" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-headline">{loc.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{
                  {
                    city: "Город",
                    town: "Поселение",
                    ruin: "Руины",
                    dungeon: "Подземелье",
                    camp: "Лагерь"
                  }[loc.type]
                }</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}