
"use client";

import { useState, useEffect, useRef } from 'react';
import type { Character } from "@/types/character";
import type { GameData } from "@/services/gameDataService";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import { getOfflineEvents } from "@/actions/offline-events-actions";

const ADVENTURE_LOG_STORAGE_KEY = 'adventureLog';
const POLL_INTERVAL = 3000; // Poll server every 3 seconds

// ==================================
// The Main Game Loop Hook (Polling Version)
// ==================================
// Background Worker handles all game ticks.
// Client only polls for updated state and displays it.

export function useGameLoop(initialCharacter: Character | null, gameData: GameData | null) {
  const [character, setCharacter] = useState<Character | null>(initialCharacter);
  const [adventureLog, setAdventureLog] = useState<{time: string, message: string}[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    const savedLog = localStorage.getItem(ADVENTURE_LOG_STORAGE_KEY);
    try {
      return savedLog ? JSON.parse(savedLog) : [];
    } catch {
      return [];
    }
  });
  const [combatLog, setCombatLog] = useState<string[]>([]);

  // Refs to hold the latest state for the interval closure
  const characterRef = useRef(character);
  const lastSeenTimestampRef = useRef<number>(0);

  useEffect(() => {
    characterRef.current = character;
  }, [character]);

  // Handle initial load
  useEffect(() => {
    if (!initialCharacter) {
      return;
    }
    setCharacter(initialCharacter);
  }, [initialCharacter]);

  // Save adventure log to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(ADVENTURE_LOG_STORAGE_KEY, JSON.stringify(adventureLog));
  }, [adventureLog]);

  // Load offline events on mount
  useEffect(() => {
    if (!initialCharacter) return;

    const loadOfflineEvents = async () => {
      try {
        const events = await getOfflineEvents(initialCharacter.id);
        if (events && events.length > 0) {
          // Separate events by type
          const adventureEvents = events
            .filter((event: any) => event.type === 'system')
            .map((event: any) => ({
              time: new Date(event.timestamp).toLocaleTimeString(),
              message: event.message
            }));
          
          const combatMessages = events
            .filter((event: any) => event.type === 'combat')
            .map((event: any) => event.message);
          
          // Update logs separately
          if (adventureEvents.length > 0) {
            setAdventureLog(prev => [...adventureEvents, ...prev].slice(0, 50));
          }
          
          if (combatMessages.length > 0) {
            setCombatLog(prev => [...combatMessages, ...prev].slice(0, 50));
          }
          
          // Mark last event as seen
          if (events.length > 0) {
            lastSeenTimestampRef.current = new Date(events[0].timestamp).getTime();
          }
        }
      } catch (error) {
        console.error('Error loading offline events:', error);
      }
    };

    loadOfflineEvents();
  }, [initialCharacter]);

  // The main polling interval - fetch updated character state from server
  useEffect(() => {
    if (!gameData || !initialCharacter) return;

    const pollInterval = setInterval(async () => {
        const currentCharacter = characterRef.current;

        if (!currentCharacter) {
            return;
        }

        try {
          // Fetch updated character state from server (processed by Background Worker)
          const updatedCharacter = await fetchCharacter(currentCharacter.id);
          
          if (!updatedCharacter) {
            console.error('Failed to fetch character');
            return;
          }

          // Check if state changed
          const hasStateChanged = 
            currentCharacter.status !== updatedCharacter.status ||
            currentCharacter.currentAction?.name !== updatedCharacter.currentAction?.name ||
            currentCharacter.stats.health.current !== updatedCharacter.stats.health.current ||
            currentCharacter.level !== updatedCharacter.level;

          if (hasStateChanged) {
            // Update local state with server-authoritative data
            setCharacter(updatedCharacter);
            // Note: All logging now handled by Background Worker via offline_events
          }

          // Check for new offline events (if character was processed by worker)
          const newEvents = await getOfflineEvents(currentCharacter.id);
          if (newEvents && newEvents.length > 0) {
            // Filter events that are newer than last seen timestamp
            const unseenEvents = newEvents.filter(e => 
              new Date(e.timestamp).getTime() > lastSeenTimestampRef.current
            );

            if (unseenEvents.length > 0) {
              // Separate events by type
              const adventureEvents = unseenEvents
                .filter(event => event.type === 'system')
                .map(event => ({
                  time: new Date(event.timestamp).toLocaleTimeString(),
                  message: event.message
                }));
              
              const combatMessages = unseenEvents
                .filter(event => event.type === 'combat')
                .map(event => event.message);
              
              // Update logs separately
              if (adventureEvents.length > 0) {
                setAdventureLog(prev => [...adventureEvents, ...prev].slice(0, 50));
              }
              
              if (combatMessages.length > 0) {
                setCombatLog(prev => [...combatMessages, ...prev].slice(0, 50));
              }
              
              // Update last seen timestamp to the newest event
              const newestTimestamp = Math.max(...newEvents.map(e => new Date(e.timestamp).getTime()));
              lastSeenTimestampRef.current = newestTimestamp;
            }
          }

        } catch (error) {
          console.error('Error polling character state:', error);
        }

    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [gameData, initialCharacter]);

  return { character, adventureLog, combatLog, setCharacter };
}
