import type { Location } from "@/types/location";

export const initialLocations: Location[] = [
  // Major Cities (all starting locations)
  { id: 'solitude', name: 'Солитьюд', type: 'city', coords: { x: 25, y: 20 }, isSafe: true, isStartingLocation: true, travelDistance: 150 },
  { id: 'windhelm', name: 'Виндхельм', type: 'city', coords: { x: 82, y: 38 }, isSafe: true, isStartingLocation: true, travelDistance: 180 },
  { id: 'whiterun', name: 'Вайтран', type: 'city', coords: { x: 50, y: 52 }, isSafe: true, isStartingLocation: true, travelDistance: 120 },
  { id: 'markarth', name: 'Маркарт', type: 'city', coords: { x: 18, y: 58 }, isSafe: true, isStartingLocation: true, travelDistance: 200 },
  { id: 'riften', name: 'Рифтен', type: 'city', coords: { x: 85, y: 80 }, isSafe: true, isStartingLocation: true, travelDistance: 170 },

  // City outskirts (local activity hubs) - zones with varying danger levels (need to be discovered)
  { id: 'whiterun_outskirts', name: 'Окрестности Вайтрана', type: 'outskirts', coords: { x: 49, y: 58 }, isSafe: false, dangerLevel: 25, isStartingLocation: false, travelDistance: 60 },
  { id: 'solitude_outskirts', name: 'Окрестности Солитьюда', type: 'outskirts', coords: { x: 23, y: 24 }, isSafe: false, dangerLevel: 20, isStartingLocation: false, travelDistance: 50 },
  { id: 'windhelm_outskirts', name: 'Окрестности Виндхельма', type: 'outskirts', coords: { x: 80, y: 42 }, isSafe: false, dangerLevel: 30, isStartingLocation: false, travelDistance: 70 },
  { id: 'riften_outskirts', name: 'Окрестности Рифтена', type: 'outskirts', coords: { x: 83, y: 84 }, isSafe: false, dangerLevel: 35, isStartingLocation: false, travelDistance: 65 },
  { id: 'markarth_outskirts', name: 'Окрестности Маркарта', type: 'outskirts', coords: { x: 20, y: 62 }, isSafe: false, dangerLevel: 40, isStartingLocation: false, travelDistance: 80 },

  // Town outskirts (need to be discovered)
  { id: 'dawnstar_outskirts', name: 'Окрестности Данстара', type: 'outskirts', coords: { x: 50, y: 12 }, isSafe: false, dangerLevel: 45, isStartingLocation: false, travelDistance: 90 },
  { id: 'winterhold_outskirts', name: 'Окрестности Винтерхолда', type: 'outskirts', coords: { x: 74, y: 20 }, isSafe: false, dangerLevel: 50, isStartingLocation: false, travelDistance: 100 },
  { id: 'morthal_outskirts', name: 'Окрестности Морфала', type: 'outskirts', coords: { x: 36, y: 28 }, isSafe: false, dangerLevel: 35, isStartingLocation: false, travelDistance: 75 },
  { id: 'falkreath_outskirts', name: 'Окрестности Фолкрита', type: 'outskirts', coords: { x: 42, y: 85 }, isSafe: false, dangerLevel: 30, isStartingLocation: false, travelDistance: 70 },

  // Minor Cities (starting locations for nearby areas)
  { id: 'dawnstar', name: 'Данстар', type: 'town', coords: { x: 50, y: 15 }, isSafe: true, isStartingLocation: true, travelDistance: 140 },
  { id: 'winterhold', name: 'Винтерхолд', type: 'town', coords: { x: 72, y: 22 }, isSafe: true, isStartingLocation: true, travelDistance: 160 },
  { id: 'morthal', name: 'Морфал', type: 'town', coords: { x: 38, y: 30 }, isSafe: true, isStartingLocation: true, travelDistance: 130 },
  { id: 'falkreath', name: 'Фолкрит', type: 'town', coords: { x: 44, y: 82 }, isSafe: true, isStartingLocation: true, travelDistance: 140 },
  
  // Villages (need to be discovered)
  { id: 'riverwood', name: 'Ривервуд', type: 'town', coords: { x: 52, y: 68 }, isSafe: true, isStartingLocation: false, travelDistance: 80 },
  { id: 'ivarstead', name: 'Айварстед', type: 'town', coords: { x: 73, y: 69 }, isSafe: true, isStartingLocation: false, travelDistance: 90 },
  { id: 'rorikstead', name: 'Рорикстед', type: 'town', coords: { x: 35, y: 55 }, isSafe: true, isStartingLocation: false, travelDistance: 85 },

  // Notable Ruins (need to be discovered)
  { id: 'bleak_falls_barrow', name: 'Ветреный пик', type: 'ruin', coords: { x: 48, y: 65 }, isSafe: false, isStartingLocation: false, travelDistance: 110, dangerLevel: 60 },
  { id: 'forgotten_crypt', name: 'Забытый Склеп', type: 'dungeon', coords: { x: 65, y: 85 }, isSafe: false, isStartingLocation: false, travelDistance: 120, dangerLevel: 70 },
];
