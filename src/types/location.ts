export type LocationType = 'city' | 'town' | 'ruin' | 'dungeon' | 'camp' | 'outskirts';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  coords: { x: number; y: number }; // Percentage-based coordinates
  isSafe: boolean;
  dangerLevel?: number; // 0-100, уровень опасности локации (для окраин и опасных зон)
}
