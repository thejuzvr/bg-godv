"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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

type WorldMapProps = {
  currentCity: string;
  locations: Location[];
  visitedLocations: string[];
  onLocationClick: (locationId: string) => void;
  // Debug controls (optional)
  debugMode?: boolean;
  debugMarkers?: Array<{ id: string; x: number; y: number }>;
  onDebugAdd?: (x: number, y: number) => void;
  onDebugUpdate?: (id: string, x: number, y: number) => void;
  onDebugDelete?: (id: string) => void;
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
    case 'outskirts':
      return <LandPlot className={finalClassName} />;
    default:
      return <div className="w-2 h-2 rounded-full bg-white" />;
  }
});

export function WorldMap({
  currentCity,
  locations,
  visitedLocations,
  onLocationClick,
  debugMode = false,
  debugMarkers = [],
  onDebugAdd,
  onDebugUpdate,
  onDebugDelete,
}: WorldMapProps) {
  const MAP_WIDTH = 2048;
  const MAP_HEIGHT = 1489;

  const [svgContent, setSvgContent] = useState<string>("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState<number>(1);
  const [dragging, setDragging] = useState<{
    id: string;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);

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
    outskirts: "Окраины",
  }), []);

  // Recompute scale-to-fit on resize
  useEffect(() => {
    const updateFit = () => {
      const w = wrapperRef.current?.clientWidth || 1;
      const h = wrapperRef.current?.clientHeight || 1;
      const scale = Math.min(w / MAP_WIDTH, h / MAP_HEIGHT);
      const rounded = Math.max(0.001, Number(scale.toFixed(5)));
      setFitScale(rounded);
    };
    updateFit();
    const ro = new ResizeObserver(updateFit);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener('resize', updateFit);
    return () => {
      window.removeEventListener('resize', updateFit);
      ro.disconnect();
    };
  }, []);

  return (
    <TooltipProvider>
      <TransformWrapper
        wrapperClass="w-full h-full overflow-hidden"
        minScale={fitScale}
        initialScale={fitScale}
        maxScale={3}
        wheel={{ step: 0.12 }}
        doubleClick={{ step: 0.9 }}
        panning={{ velocityDisabled: false }}
        limitToBounds={true}
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
          // Drag handler bindings for debug markers
          useEffect(() => {
            if (!dragging) return;
            const handleMove = (e: MouseEvent) => {
              const dx = e.clientX - dragging.startClientX;
              const dy = e.clientY - dragging.startClientY;
              const newX = Math.max(0, Math.min(100, dragging.startX + (dx / s.scale) / MAP_WIDTH * 100));
              const newY = Math.max(0, Math.min(100, dragging.startY + (dy / s.scale) / MAP_HEIGHT * 100));
              onDebugUpdate?.(dragging.id, newX, newY);
            };
            const handleUp = () => setDragging(null);
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp, { once: true });
            return () => {
              window.removeEventListener('mousemove', handleMove);
              window.removeEventListener('mouseup', handleUp);
            };
          }, [dragging, s.scale]);
          // Center content when fitScale changes
          useEffect(() => {
            const w = wrapperRef.current?.clientWidth || 0;
            const h = wrapperRef.current?.clientHeight || 0;
            const x = (w - MAP_WIDTH * fitScale) / 2;
            const y = (h - MAP_HEIGHT * fitScale) / 2;
            if (!Number.isNaN(x) && !Number.isNaN(y)) setTransform(x, y, fitScale, 0);
          }, [fitScale, setTransform]);

          return (
          <div ref={wrapperRef} className="relative w-full h-full bg-background overflow-hidden" style={{ touchAction: 'none' }}>
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
              {debugMode && (
                <button
                  className="mt-2 px-2 py-1 bg-accent text-accent-foreground rounded-md border border-border hover:bg-accent/80"
                  onClick={() => {
                    const centerX = ((viewX + viewW / 2) / MAP_WIDTH) * 100;
                    const centerY = ((viewY + viewH / 2) / MAP_HEIGHT) * 100;
                    onDebugAdd?.(Number(centerX.toFixed(3)), Number(centerY.toFixed(3)));
                  }}
                  aria-label="Добавить маркер в центр"
                  title="Добавить маркер в центр видимой области"
                >
                  + Маркер
                </button>
              )}
            </div>

            {/* Mini map removed by request */}

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

                {/* Danger zone overlays for outskirts */}
                {visibleLocations.filter((l) => l.type === 'outskirts').map((loc) => {
                  const diameter = 260; // px on base map canvas
                  const color = loc.dangerLevel !== undefined && loc.dangerLevel >= 70
                    ? { fill: 'rgba(239,68,68,0.18)', stroke: 'rgba(239,68,68,0.55)' }
                    : loc.dangerLevel !== undefined && loc.dangerLevel >= 40
                    ? { fill: 'rgba(249,115,22,0.18)', stroke: 'rgba(249,115,22,0.55)' }
                    : loc.dangerLevel !== undefined && loc.dangerLevel >= 20
                    ? { fill: 'rgba(234,179,8,0.18)', stroke: 'rgba(234,179,8,0.55)' }
                    : { fill: 'rgba(34,197,94,0.18)', stroke: 'rgba(34,197,94,0.55)' };
                  return (
                    <div
                      key={`${loc.id}-zone`}
                      className="absolute rounded-full"
                      style={{
                        top: `${loc.coords.y}%`,
                        left: `${loc.coords.x}%`,
                        width: `${diameter}px`,
                        height: `${diameter}px`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: color.fill,
                        boxShadow: `0 0 0 2px ${color.stroke}`,
                        zIndex: 1,
                        pointerEvents: 'none',
                      }}
                    />
                  );
                })}

                {/* Markers */}
                {visibleLocations.map((loc) => {
                  // Check if location is discovered
                  const isDiscovered = loc.isStartingLocation || visitedLocations.includes(loc.id) || loc.id === currentCity;
                  const isUndiscovered = !isDiscovered;
                  
                  return (
                  <Tooltip key={loc.id}>
                    <TooltipTrigger asChild>
                      <div
                        tabIndex={0}
                        role="button"
                        aria-label={`${isUndiscovered ? '???' : loc.name}. ${typeLabel[loc.type]}. Нажмите, чтобы открыть.`}
                        className={cn(
                          "absolute flex items-center justify-center w-8 h-8 p-1.5 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 cursor-pointer backdrop-blur-sm rounded-full border-2 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          // Undiscovered locations are faded and have special styling
                          isUndiscovered ? "bg-background/30 border-dashed border-muted-foreground/30 opacity-60 hover:opacity-80" : "bg-background/60 hover:border-accent",
                          // Danger level border color (only for discovered locations)
                          !isUndiscovered && loc.dangerLevel !== undefined && loc.dangerLevel >= 70 ? "border-red-500/50" :
                          !isUndiscovered && loc.dangerLevel !== undefined && loc.dangerLevel >= 40 ? "border-orange-500/50" :
                          !isUndiscovered && loc.dangerLevel !== undefined && loc.dangerLevel >= 20 ? "border-yellow-500/50" :
                          !isUndiscovered && loc.dangerLevel !== undefined ? "border-green-500/50" :
                          !isUndiscovered ? "border-primary/30" : ""
                        )}
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
                        {isUndiscovered ? (
                          <div className="text-muted-foreground text-xl font-bold">?</div>
                        ) : (
                          <LocationIcon
                            type={loc.type}
                            className={cn(
                              "text-primary-foreground drop-shadow-lg",
                              loc.id === currentCity && "text-accent animate-pulse"
                            )}
                          />
                        )}
                        {loc.id === currentCity && (
                          <div className="absolute inset-0 rounded-full ring-2 ring-accent ring-offset-2 ring-offset-background/50" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-headline">{isUndiscovered ? '???' : loc.name}</p>
                      {isUndiscovered ? (
                        <p className="text-xs text-muted-foreground">Неизведанная территория</p>
                      ) : (
                        <p className="text-xs text-muted-foreground capitalize">{typeLabel[loc.type]}</p>
                      )}
                      {/* Danger level indicator for outskirts and dangerous zones (only for discovered) */}
                      {!isUndiscovered && loc.dangerLevel !== undefined && (
                        <div className="mt-1 text-xs">
                          <span className="text-muted-foreground">Опасность: </span>
                          <span className={
                            loc.dangerLevel >= 70 ? "text-red-500 font-semibold" :
                            loc.dangerLevel >= 40 ? "text-orange-500 font-semibold" :
                            loc.dangerLevel >= 20 ? "text-yellow-500" :
                            "text-green-500"
                          }>
                            {loc.dangerLevel}%
                          </span>
                          <span className="ml-1 text-muted-foreground">
                            {loc.dangerLevel >= 70 ? '— Очень опасно' :
                             loc.dangerLevel >= 40 ? '— Опасно' :
                             loc.dangerLevel >= 20 ? '— Умеренная' : '— Безопасно'}
                          </span>
                        </div>
                      )}
                      {!isUndiscovered && !loc.dangerLevel && (
                        <div className="mt-1 text-xs text-muted-foreground">Безопасная зона</div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                  );
                })}

                {/* Debug markers */}
                {debugMode && (debugMarkers || []).map((m) => (
                  <div
                    key={m.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      top: `${m.y}%`,
                      left: `${m.x}%`,
                      transform: `translate(-50%, -50%) scale(${1 / s.scale})`,
                      zIndex: 50,
                    }}
                  >
                    <div
                      className="relative flex items-center gap-1"
                      onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        e.preventDefault();
                        setDragging({
                          id: m.id,
                          startClientX: e.clientX,
                          startClientY: e.clientY,
                          startX: m.x,
                          startY: m.y,
                        });
                      }}
                    >
                      <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow cursor-move" title={`${m.x.toFixed(2)} | ${m.y.toFixed(2)}`} />
                      <span className="px-1 py-0.5 text-[10px] font-mono bg-background/80 border rounded">
                        {m.id}: {m.x.toFixed(2)} | {m.y.toFixed(2)}
                      </span>
                      <button
                        className="ml-1 px-1 text-[10px] bg-destructive text-destructive-foreground rounded border border-destructive/60"
                        onClick={(e) => { e.stopPropagation(); onDebugDelete?.(m.id); }}
                        title="Удалить маркер"
                      >
                        ×
                      </button>
                    </div>
                  </div>
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