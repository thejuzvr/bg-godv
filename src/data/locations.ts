import type { Location } from "@/types/location";

export const initialLocations: Location[] = [
  // Major Cities
  { id: 'solitude', name: 'Солитьюд', type: 'city', coords: { x: 25, y: 20 }, isSafe: true },
  { id: 'windhelm', name: 'Виндхельм', type: 'city', coords: { x: 82, y: 38 }, isSafe: true },
  { id: 'whiterun', name: 'Вайтран', type: 'city', coords: { x: 50, y: 52 }, isSafe: true },
  { id: 'markarth', name: 'Маркарт', type: 'city', coords: { x: 18, y: 58 }, isSafe: true },
  { id: 'riften', name: 'Рифтен', type: 'city', coords: { x: 85, y: 80 }, isSafe: true },

  // Minor Cities (represented as towns)
  { id: 'dawnstar', name: 'Данстар', type: 'town', coords: { x: 50, y: 15 }, isSafe: true },
  { id: 'winterhold', name: 'Винтерхолд', type: 'town', coords: { x: 72, y: 22 }, isSafe: true },
  { id: 'morthal', name: 'Морфал', type: 'town', coords: { x: 38, y: 30 }, isSafe: true },
  { id: 'falkreath', name: 'Фолкрит', type: 'town', coords: { x: 44, y: 82 }, isSafe: true },
  
  // Villages
  { id: 'riverwood', name: 'Ривервуд', type: 'town', coords: { x: 52, y: 68 }, isSafe: true },
  { id: 'ivarstead', name: 'Айварстед', type: 'town', coords: { x: 73, y: 69 }, isSafe: true },
  { id: 'rorikstead', name: 'Рорикстед', type: 'town', coords: { x: 35, y: 55 }, isSafe: true },

  // Notable Ruins
  { id: 'bleak_falls_barrow', name: 'Ветреный пик', type: 'ruin', coords: { x: 48, y: 65 }, isSafe: false },
  { id: 'forgotten_crypt', name: 'Забытый Склеп', type: 'dungeon', coords: { x: 65, y: 85 }, isSafe: false },
];
