
"use client";

import { useState, useEffect, useRef } from 'react';
import type { Character } from "@/types/character";
import type { GameData } from "@/services/gameDataService";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import { getOfflineEvents, getRecentEvents, markEventsRead } from "@/actions/offline-events-actions";

const POLL_INTERVAL = 3000; // Poll server every 3 seconds

// ==================================
// The Main Game Loop Hook (Polling Version)
// ==================================
// Background Worker handles all game ticks.
// Client only polls for updated state and displays it.

export function useGameLoop(initialCharacter: Character | null, gameData: GameData | null, options?: { adventureLimit?: number }) {
  const [character, setCharacter] = useState<Character | null>(initialCharacter);
  type AdventureLogItem = { id: string; timestamp: number; type: string; message: string };
  const [adventureLog, setAdventureLog] = useState<AdventureLogItem[]>([]);
  const [combatLog, setCombatLog] = useState<string[]>([]);

  // Refs to hold the latest state for the interval closure
  const characterRef = useRef(character);
  const lastSeenTimestampRef = useRef<number>(0);
  const failureCountRef = useRef<number>(0);

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

  // Load recent offline events on mount and when limit changes
  useEffect(() => {
    if (!initialCharacter) return;

    const loadOfflineEvents = async () => {
      try {
        const limit = options?.adventureLimit ?? 40;
        const events = await getRecentEvents(initialCharacter.id, limit);
        if (events && events.length > 0) {
          // Build structured adventure items from 'system' events
          const adventureItems = events
            .filter((event: any) => event.type === 'system')
            .map((event: any) => ({
              id: event.id,
              timestamp: new Date(event.timestamp).getTime(),
              type: event.type,
              message: event.message,
            } as AdventureLogItem));

          const combatMessages = events
            .filter((event: any) => event.type === 'combat')
            .map((event: any) => event.message);

          if (adventureItems.length > 0) {
            setAdventureLog(prev => {
              const byId = new Map<string, AdventureLogItem>(prev.map(e => [e.id, e]));
              for (const item of adventureItems) byId.set(item.id, item);
              return Array.from(byId.values())
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 50);
            });
          }

          if (combatMessages.length > 0) {
            setCombatLog(prev => [...combatMessages, ...prev].slice(0, 50));
          }

          // Update last seen and mark events as read so they won't reappear on refresh
          const newestTs = Math.max(...events.map((e: any) => new Date(e.timestamp).getTime()));
          if (Number.isFinite(newestTs)) {
            lastSeenTimestampRef.current = newestTs;
          }
          // Do not mark read here (recent includes read+unread). We'll mark read only for unread fetches in polling
        }
      } catch (error) {
        console.error('Error loading offline events:', error);
      }
    };

    loadOfflineEvents();
  }, [initialCharacter, options?.adventureLimit]);

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
            failureCountRef.current += 1;
            if (failureCountRef.current % 10 === 0) {
              console.warn('Character fetch returned null repeatedly. Retrying...');
            }
            return;
          }

          // Reset failure counter on success
          failureCountRef.current = 0;

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

          // Refresh the latest 40 events (read+unread) every poll
          const latestEvents = await getOfflineEvents(currentCharacter.id);
          if (latestEvents && latestEvents.length > 0) {
            const adventureItems = latestEvents
              .filter(event => event.type === 'system')
              .map(event => ({
                id: event.id,
                timestamp: new Date(event.timestamp).getTime(),
                type: event.type,
                message: event.message,
              } as AdventureLogItem));

            const combatMessages = latestEvents
              .filter(event => event.type === 'combat')
              .map(event => event.message);

            if (adventureItems.length > 0) {
              setAdventureLog(adventureItems
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 50));
            }

            if (combatMessages.length > 0) {
              setCombatLog(prev => [...combatMessages, ...prev].slice(0, 50));
            }

            const newestTimestamp = Math.max(...latestEvents.map(e => new Date(e.timestamp).getTime()));
            if (Number.isFinite(newestTimestamp)) {
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
