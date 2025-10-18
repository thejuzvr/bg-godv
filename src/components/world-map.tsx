"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Location, LocationType } from "@/types/location";
import { Building2, Castle, Tent, TowerControl, LandPlot, Plus, Minus } from "lucide-react";
import { memo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import WorldMapMini from "@/components/world-map-mini";

type WorldMapProps = {
  currentCity: string;
  locations: Location[];
  onLocationClick: (locationId: string) => void;
};

const LocationIcon = memo(function LocationIcon({ type, className }: { type: LocationType, className?: string }) {
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
});

export function WorldMap({ currentCity, locations, onLocationClick }: WorldMapProps) {
  const MAP_WIDTH = 2048;
  const MAP_HEIGHT = 1489;

  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch("/images/world-map/SR-map-Skyrim_DE.svg");
        const svgText = await response.text();
        setSvgContent(svgText);
      } catch (error) {
        console.error("Failed to load SVG:", error);
      }
    };
    loadSvg();
  }, []);

  const typeLabel: Record<LocationType, string> = useMemo(() => ({
    city: "Город",
    town: "Поселение",
    ruin: "Руины",
    dungeon: "Подземелье",
    camp: "Лагерь",
  }), []);

  return (
    <TooltipProvider>
      <TransformWrapper
        minScale={0.6}
        maxScale={3}
        wheel={{ step: 0.12 }}
        doubleClick={{ step: 0.9 }}
        panning={{ velocityDisabled: false }}
        limitToWrapper={true}
        initialScale={0.9}
        centerOnInit={true}
      >
        {(api) => {
          const s = (api as any)?.state ?? (api as any)?.transformState ?? { scale: 1, positionX: 0, positionY: 0 };
          const { zoomIn, zoomOut, setTransform } = api as any;
          const viewX = -s.positionX / s.scale;
          const viewY = -s.positionY / s.scale;
          const viewW = MAP_WIDTH / s.scale;
          const viewH = MAP_HEIGHT / s.scale;
          const padding = 32; // px padding around viewport
          const visibleLocations = locations.filter((loc) => {
            const xPx = (loc.coords.x / 100) * MAP_WIDTH;
            const yPx = (loc.coords.y / 100) * MAP_HEIGHT;
            return (
              xPx >= viewX - padding &&
              xPx <= viewX + viewW + padding &&
              yPx >= viewY - padding &&
              yPx <= viewY + viewH + padding
            );
          });
          return (
          <div className="relative w-[2048px] h-[1489px] bg-background overflow-hidden">
            {/* Zoom controls */}
            <div className="absolute top-3 right-3 z-10 flex flex-col shadow-sm">
              <button
                className="px-2 py-1 bg-secondary text-foreground rounded-t-md border border-border hover:bg-secondary/80"
                onClick={() => zoomIn(0.15)}
                aria-label="Приблизить"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="px-2 py-1 bg-secondary text-foreground rounded-b-md border-x border-b border-border hover:bg-secondary/80"
                onClick={() => zoomOut(0.15)}
                aria-label="Отдалить"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Mini map */}
            <WorldMapMini
              mapWidth={MAP_WIDTH}
              mapHeight={MAP_HEIGHT}
              containerWidth={MAP_WIDTH}
              containerHeight={MAP_HEIGHT}
              state={s}
              setTransform={setTransform as ReactZoomPanPinchRef["setTransform"]}
            />

            <TransformComponent>
              <div className="relative" style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}>
                {/* Base SVG */}
                <div
                  className="absolute inset-0 w-full h-full select-none"
                  onDragStart={(e) => e.preventDefault()}
                >
                  <div
                    className="[&>svg]:w-full [&>svg]:h-full [&>svg]:pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                </div>

                {/* Markers */}
                {visibleLocations.map((loc) => (
                  <Tooltip key={loc.id}>
                    <TooltipTrigger asChild>
                      <div
                        tabIndex={0}
                        role="button"
                        aria-label={`${loc.name}. ${typeLabel[loc.type]}. Нажмите, чтобы открыть.`}
                        className="absolute flex items-center justify-center w-8 h-8 p-1.5 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 cursor-pointer bg-background/60 backdrop-blur-sm rounded-full border-2 border-primary/30 hover:scale-110 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        style={{
                          top: `${loc.coords.y}%`,
                          left: `${loc.coords.x}%`,
                          // keep marker size roughly constant while zooming
                            transform: `translate(-50%, -50%) scale(${1 / s.scale})`,
                        }}
                        onClick={() => onLocationClick(loc.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onLocationClick(loc.id);
                          }
                        }}
                      >
                        <LocationIcon
                          type={loc.type}
                          className={cn(
                            "text-primary-foreground drop-shadow-lg",
                            loc.id === currentCity && "text-accent animate-pulse"
                          )}
                        />
                        {loc.id === currentCity && (
                          <div className="absolute inset-0 rounded-full ring-2 ring-accent ring-offset-2 ring-offset-background/50" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-headline">{loc.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{typeLabel[loc.type]}</p>
                      {/* Extra meta placeholder */}
                      <div className="mt-1 text-xs text-muted-foreground">Сложность: Средняя</div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TransformComponent>
          </div>
          )
        }}
      </TransformWrapper>
    </TooltipProvider>
  );
}