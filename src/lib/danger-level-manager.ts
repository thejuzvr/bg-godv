/**
 * Менеджер динамического изменения уровня опасности локаций
 * 
 * Логика:
 * - Уровень опасности меняется со временем
 * - Зависит от времени суток, сезона, погоды
 * - Влияет на шанс встреч и сложность врагов
 * - Визуально отображается на карте
 */

import type { Location } from "@/types/location";
import type { Season, TimeOfDay, Weather } from "@/types/character";

export interface DangerModifiers {
  timeOfDay: number;      // -10 до +20
  season: number;         // -5 до +15
  weather: number;        // -5 до +20
  playerActivity: number; // -20 до +10 (активность игрока в зоне снижает опасность)
}

export interface DynamicDangerInfo {
  baseDanger: number;           // Базовый уровень из БД
  currentDanger: number;        // Текущий с модификаторами
  modifiers: DangerModifiers;
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Рассчитывает модификатор опасности для времени суток
 */
function getTimeOfDayModifier(timeOfDay: TimeOfDay): number {
  switch (timeOfDay) {
    case 'night':
      return 20; // Ночью опаснее
    case 'evening':
      return 10; // Вечером тоже
    case 'morning':
      return -5; // Утром спокойнее
    case 'day':
      return -10; // Днем безопаснее
    default:
      return 0;
  }
}

/**
 * Рассчитывает модификатор опасности для сезона
 */
function getSeasonModifier(season: Season): number {
  switch (season) {
    case 'Winter':
      return 15; // Зимой опаснее (голодные звери)
    case 'Autumn':
      return 5; // Осенью немного опаснее
    case 'Spring':
      return -5; // Весной спокойнее
    case 'Summer':
      return 0; // Летом нормально
    default:
      return 0;
  }
}

/**
 * Рассчитывает модификатор опасности для погоды
 */
function getWeatherModifier(weather: Weather): number {
  switch (weather) {
    case 'Snow':
      return 20; // Метель - очень опасно
    case 'Fog':
      return 15; // Туман - опасно
    case 'Rain':
      return 5; // Дождь - немного опаснее
    case 'Cloudy':
      return 0;
    case 'Clear':
      return -5; // Ясная погода - безопаснее
    default:
      return 0;
  }
}

/**
 * Рассчитывает модификатор на основе активности игрока
 * Если герой часто посещает локацию - она становится безопаснее
 */
function getPlayerActivityModifier(
  locationId: string,
  visitedLocations: string[],
  currentLocation: string,
  lastVisitTimestamp?: number
): number {
  // Если герой сейчас здесь - безопаснее
  if (currentLocation === locationId) {
    return -20;
  }

  // Если локация посещена
  if (visitedLocations.includes(locationId)) {
    // Недавнее посещение (меньше 1 игрового дня) - безопаснее
    if (lastVisitTimestamp && (Date.now() - lastVisitTimestamp) < 24 * 60 * 60 * 1000) {
      return -15;
    }
    // Посещали, но давно - немного безопаснее
    return -5;
  }

  // Неизвестная локация - опаснее
  return 10;
}

/**
 * Рассчитывает динамический уровень опасности локации
 */
export function calculateDynamicDanger(
  location: Location,
  context: {
    timeOfDay: TimeOfDay;
    season: Season;
    weather: Weather;
    visitedLocations: string[];
    currentLocation: string;
    lastVisitTimestamp?: number;
  }
): DynamicDangerInfo {
  const baseDanger = location.dangerLevel || 0;

  // Только для опасных зон (outskirts, ruins, dungeons)
  if (location.isSafe || !['outskirts', 'ruin', 'dungeon'].includes(location.type)) {
    return {
      baseDanger,
      currentDanger: baseDanger,
      modifiers: { timeOfDay: 0, season: 0, weather: 0, playerActivity: 0 },
      trend: 'stable'
    };
  }

  const modifiers: DangerModifiers = {
    timeOfDay: getTimeOfDayModifier(context.timeOfDay),
    season: getSeasonModifier(context.season),
    weather: getWeatherModifier(context.weather),
    playerActivity: getPlayerActivityModifier(
      location.id,
      context.visitedLocations,
      context.currentLocation,
      context.lastVisitTimestamp
    )
  };

  // Суммируем все модификаторы
  const totalModifier = 
    modifiers.timeOfDay + 
    modifiers.season + 
    modifiers.weather + 
    modifiers.playerActivity;

  // Рассчитываем текущую опасность
  let currentDanger = baseDanger + totalModifier;
  
  // Ограничиваем диапазон 0-100
  currentDanger = Math.max(0, Math.min(100, currentDanger));

  // Определяем тренд
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (totalModifier > 5) {
    trend = 'increasing';
  } else if (totalModifier < -5) {
    trend = 'decreasing';
  }

  return {
    baseDanger,
    currentDanger,
    modifiers,
    trend
  };
}

/**
 * Применяет динамическую опасность ко всем локациям
 */
export function applyDynamicDangerToLocations(
  locations: Location[],
  context: {
    timeOfDay: TimeOfDay;
    season: Season;
    weather: Weather;
    visitedLocations: string[];
    currentLocation: string;
  }
): Location[] {
  return locations.map(location => {
    const dangerInfo = calculateDynamicDanger(location, context);
    
    return {
      ...location,
      dangerLevel: dangerInfo.currentDanger,
      // Добавляем метаданные для отображения
      baseDangerLevel: dangerInfo.baseDanger,
      dangerTrend: dangerInfo.trend,
      dangerModifiers: dangerInfo.modifiers
    } as Location & {
      baseDangerLevel?: number;
      dangerTrend?: 'increasing' | 'decreasing' | 'stable';
      dangerModifiers?: DangerModifiers;
    };
  });
}

/**
 * Получает цветовую схему для уровня опасности
 */
export function getDangerColor(dangerLevel: number): {
  fill: string;
  stroke: string;
  text: string;
  label: string;
} {
  if (dangerLevel >= 70) {
    return {
      fill: 'rgba(239,68,68,0.18)',
      stroke: 'rgba(239,68,68,0.55)',
      text: 'text-red-500',
      label: 'Очень опасно'
    };
  } else if (dangerLevel >= 40) {
    return {
      fill: 'rgba(249,115,22,0.18)',
      stroke: 'rgba(249,115,22,0.55)',
      text: 'text-orange-500',
      label: 'Опасно'
    };
  } else if (dangerLevel >= 20) {
    return {
      fill: 'rgba(234,179,8,0.18)',
      stroke: 'rgba(234,179,8,0.55)',
      text: 'text-yellow-500',
      label: 'Умеренная опасность'
    };
  } else {
    return {
      fill: 'rgba(34,197,94,0.18)',
      stroke: 'rgba(34,197,94,0.55)',
      text: 'text-green-500',
      label: 'Относительно безопасно'
    };
  }
}

/**
 * Форматирует описание модификаторов для UI
 */
export function formatDangerModifiers(modifiers: DangerModifiers): string[] {
  const descriptions: string[] = [];

  if (modifiers.timeOfDay > 0) {
    descriptions.push(`Время суток: +${modifiers.timeOfDay}% опасности`);
  } else if (modifiers.timeOfDay < 0) {
    descriptions.push(`Время суток: ${modifiers.timeOfDay}% опасности`);
  }

  if (modifiers.season > 0) {
    descriptions.push(`Сезон: +${modifiers.season}% опасности`);
  } else if (modifiers.season < 0) {
    descriptions.push(`Сезон: ${modifiers.season}% опасности`);
  }

  if (modifiers.weather > 0) {
    descriptions.push(`Погода: +${modifiers.weather}% опасности`);
  } else if (modifiers.weather < 0) {
    descriptions.push(`Погода: ${modifiers.weather}% опасности`);
  }

  if (modifiers.playerActivity > 0) {
    descriptions.push(`Неизвестная зона: +${modifiers.playerActivity}% опасности`);
  } else if (modifiers.playerActivity < 0) {
    descriptions.push(`Знакомая территория: ${modifiers.playerActivity}% опасности`);
  }

  return descriptions;
}

