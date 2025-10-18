"use client";

import type { ReactNode } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

type MiniMapProps = {
  mapWidth: number;
  mapHeight: number;
  containerWidth: number;
  containerHeight: number;
  // Partial state from react-zoom-pan-pinch
  state?: {
    scale: number;
    positionX: number;
    positionY: number;
  };
  setTransform: ReactZoomPanPinchRef["setTransform"];
};

export default function WorldMapMini({
  mapWidth,
  mapHeight,
  containerWidth,
  containerHeight,
  state,
  setTransform,
}: MiniMapProps) {
  const miniWidth = 220;
  const miniHeight = (mapHeight / mapWidth) * miniWidth;

  // Compute viewport rectangle in minimap space
  const scale = state?.scale ?? 1;
  const posX = state?.positionX ?? 0;
  const posY = state?.positionY ?? 0;
  const viewW = (containerWidth / (mapWidth * scale)) * miniWidth;
  const viewH = (containerHeight / (mapHeight * scale)) * miniHeight;
  const viewX = (-posX / (mapWidth * scale)) * miniWidth;
  const viewY = (-posY / (mapHeight * scale)) * miniHeight;

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const handleMiniClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Center main view on click point
    const targetContentX = (x / miniWidth) * mapWidth - containerWidth / (2 * scale);
    const targetContentY = (y / miniHeight) * mapHeight - containerHeight / (2 * scale);
    const newX = -targetContentX * scale;
    const newY = -targetContentY * scale;
    setTransform(newX, newY, scale, 150, "easeOut");
  };

  return (
    <div
      className="absolute right-3 bottom-3 rounded-md border border-border bg-background/70 backdrop-blur-sm p-2 shadow-md"
      style={{ width: miniWidth }}
      onClick={handleMiniClick}
      role="button"
      aria-label="Мини-карта"
    >
      {/* Use <img> to avoid bundling the SVG twice; it renders from /public */}
      <div className="relative" style={{ width: miniWidth, height: miniHeight }}>
        <img
          src="/images/world-map/SR-map-Skyrim_DE.svg"
          alt="Мини-карта"
          className="w-full h-full pointer-events-none select-none"
          draggable={false}
        />
        <div
          className="absolute border-2 border-accent/80 bg-accent/10"
          style={{
            left: clamp(viewX, 0, miniWidth - viewW),
            top: clamp(viewY, 0, miniHeight - viewH),
            width: clamp(viewW, 12, miniWidth),
            height: clamp(viewH, 12, miniHeight),
          }}
        />
      </div>
    </div>
  );
}


