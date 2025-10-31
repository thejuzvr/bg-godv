export type LocationType = 'city' | 'town' | 'ruin' | 'dungeon' | 'camp' | 'outskirts';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  coords: { x: number; y: number }; // Percentage-based coordinates
  isSafe: boolean;
  dangerLevel?: number; // 0-100, уровень опасности локации (для окраин и опасных зон)
  isStartingLocation?: boolean; // Открыта ли локация с начала игры
  travelDistance?: number; // Базовое расстояние для расчёта времени в пути
  isDiscovered?: boolean; // Открыта ли локация для данного персонажа (вычисляется на клиенте)
}
