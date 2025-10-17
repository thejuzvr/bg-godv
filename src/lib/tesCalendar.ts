import type { TimeOfDay } from '@/types/character';
import { getGlobalGameDate } from './gameTime';

// TES months and days (RU), aligned to JS Date.getDay() where 0 is Sunday
export const TES_MONTHS_RU = [
  'Утренней Звезды',
  'Восхода Солнца',
  'Первого Зерна',
  'Руки Дождя',
  'Второго Зерна',
  'Середины Года',
  'Высокого Солнца',
  'Последнего Зерна',
  'Огня Очага',
  'Начала Морозов',
  'Заката Солнца',
  'Вечерней Звезды',
];

export const TES_DAYS_RU = [
  'Сандас', // Sunday
  'Морндас',
  'Тирдас',
  'Миддас',
  'Турдас',
  'Фредас',
  'Лордас',
];

export function calculateTimeOfDay(gameDate: number): TimeOfDay {
  const date = new Date(gameDate);
  const hour = date.getHours();
  if (hour >= 21 || hour < 5) return 'night';
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'day';
  return 'evening';
}

export function formatTamrielicDate(gameDateMs: number): { dateText: string; timeText: string; timeOfDay: TimeOfDay } {
  const date = new Date(gameDateMs);
  const year4E = 201 + (date.getFullYear() - 2025);
  const monthName = TES_MONTHS_RU[date.getMonth()];
  const day = date.getDate();
  const dayOfWeek = TES_DAYS_RU[date.getDay()];
  const timeText = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  const timeOfDay = calculateTimeOfDay(gameDateMs);
  const dateText = `${dayOfWeek}, ${day}-е ${monthName}, 4Э ${year4E}`;
  return { dateText, timeText, timeOfDay };
}

export function getLiveTamrielicNow(): { dateText: string; timeText: string; timeOfDay: TimeOfDay; gameDateMs: number } {
  const gameDateMs = getGlobalGameDate();
  const { dateText, timeText, timeOfDay } = formatTamrielicDate(gameDateMs);
  return { dateText, timeText, timeOfDay, gameDateMs };
}


