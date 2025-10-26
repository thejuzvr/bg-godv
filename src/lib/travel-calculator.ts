import type { Location } from "@/types/location";
import type { Weather } from "@/types/character";

/**
 * Calculates travel time based on distance, weather, and location discovery status
 */
export function calculateTravelTime(
  origin: Location,
  destination: Location,
  weather: Weather,
  isDestinationDiscovered: boolean
): {
  estimatedMinutes: number;
  weatherModifier: number;
  discoveryModifier: number;
  displayTime: string;
  warnings: string[];
} {
  const baseDistance = destination.travelDistance || 100;
  
  // Weather modifiers
  const weatherModifiers: Record<Weather, number> = {
    Clear: 1.0,
    Cloudy: 1.0,
    Rain: 1.2,
    Snow: 1.3,
    Fog: 1.25
  };
  
  const weatherModifier = weatherModifiers[weather];
  
  // Discovery modifier - undiscovered locations take much longer
  const discoveryModifier = isDestinationDiscovered ? 1.0 : 2.5;
  
  // Calculate time (1 distance unit = ~1 minute base)
  const baseMinutes = baseDistance;
  const totalMinutes = Math.round(baseMinutes * weatherModifier * discoveryModifier);
  
  // Generate warnings
  const warnings: string[] = [];
  
  if (!isDestinationDiscovered) {
    warnings.push("Неизведанная территория - путь займёт в 2.5 раза больше времени");
    warnings.push("Высокий шанс случайных встреч с врагами и событий");
  }
  
  if (weather === 'Rain') {
    warnings.push("Дождь замедляет путешествие на 20%");
  } else if (weather === 'Snow') {
    warnings.push("Снег замедляет путешествие на 30%");
  } else if (weather === 'Fog') {
    warnings.push("Туман замедляет путешествие на 25%");
  }
  
  if (!destination.isSafe) {
    warnings.push(`Опасная зона: уровень угрозы ${destination.dangerLevel || 0}%`);
  }
  
  // Format display time
  const displayTime = formatTravelTime(totalMinutes);
  
  return {
    estimatedMinutes: totalMinutes,
    weatherModifier,
    discoveryModifier,
    displayTime,
    warnings
  };
}

/**
 * Formats travel time into readable string
 */
function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `~${minutes} мин`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `~${hours} ч`;
  }
  
  return `~${hours} ч ${mins} мин`;
}

/**
 * Determines if a location should be automatically discovered
 * based on proximity to current location or other visited locations
 */
export function shouldAutoDiscover(
  targetLocation: Location,
  currentLocation: string,
  visitedLocations: string[],
  allLocations: Location[]
): boolean {
  // Starting locations are always discovered
  if (targetLocation.isStartingLocation) {
    return true;
  }
  
  // Check if hero is at this location
  if (currentLocation === targetLocation.id) {
    return true;
  }
  
  // Check if already visited
  if (visitedLocations.includes(targetLocation.id)) {
    return true;
  }
  
  // Auto-discover locations very close to visited locations
  const currentLoc = allLocations.find(l => l.id === currentLocation);
  if (currentLoc) {
    const distance = Math.sqrt(
      Math.pow(targetLocation.coords.x - currentLoc.coords.x, 2) +
      Math.pow(targetLocation.coords.y - currentLoc.coords.y, 2)
    );
    
    // Auto-discover if within 5% map distance (very close)
    if (distance < 5) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate encounter chance during travel to undiscovered location
 */
export function calculateEncounterChance(
  destination: Location,
  weather: Weather,
  isDiscovered: boolean
): number {
  let baseChance = 0.2; // 20% base
  
  // Undiscovered locations have higher encounter chance
  if (!isDiscovered) {
    baseChance += 0.3; // +30%
  }
  
  // Dangerous locations increase chance
  if (destination.dangerLevel) {
    baseChance += (destination.dangerLevel / 100) * 0.2; // Up to +20%
  }
  
  // Weather effects
  if (weather === 'Rain' || weather === 'Snow') {
    baseChance += 0.15; // +15%
  } else if (weather === 'Fog') {
    baseChance += 0.1; // +10%
  }
  
  return Math.min(baseChance, 0.85); // Cap at 85%
}

