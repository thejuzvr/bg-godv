
"use client";

import { useState, useEffect, useRef } from 'react';
import type { Character } from "@/types/character";
import type { GameData } from "@/services/gameDataService";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import { getOfflineEvents, getRecentEvents } from "@/actions/offline-events-actions";
import { getWelcomeMessage, shouldShowWelcomeMessage, markWelcomeMessageSeen } from "@/data/welcomeMessages";
import { useRealm } from "@/context/realm-context";
import { io, Socket } from "socket.io-client";

const POLL_INTERVAL = 3000; // Poll server every 3 seconds

// ==================================
// The Main Game Loop Hook (WS + Poll Fallback)
// ==================================
// Background Worker handles all game ticks.
// Client subscribes to WS if enabled, else polls for updates.

export function useGameLoop(initialCharacter: Character | null, gameData: GameData | null, options?: { adventureLimit?: number }) {
  const [character, setCharacter] = useState<Character | null>(initialCharacter);
  type AdventureLogItem = { id: string; timestamp: number; type: string; message: string };
  const [adventureLog, setAdventureLog] = useState<AdventureLogItem[]>([]);
  const [combatLog, setCombatLog] = useState<string[]>([]);

  // Refs to hold the latest state for the interval closure
  const characterRef = useRef(character);
  const lastSeenTimestampRef = useRef<number>(0);
  const failureCountRef = useRef<number>(0);

  const { realmId } = useRealm();
  const socketRef = useRef<Socket | null>(null);
  const wsEnabled = String(process.env.NEXT_PUBLIC_FEATURE_WEBSOCKETS || process.env.FEATURE_WEBSOCKETS || '').toLowerCase() === 'true';
  const wsUrl = (process.env.WS_URL as string) || '';

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
        if (shouldShowWelcomeMessage(initialCharacter)) {
          const welcomeMessage = getWelcomeMessage(initialCharacter);
          const welcomeItem: AdventureLogItem = {
            id: 'welcome-' + initialCharacter.id,
            timestamp: initialCharacter.createdAt,
            type: 'system',
            message: welcomeMessage
          };
          setAdventureLog(prev => [welcomeItem, ...prev].slice(0, limit));
          const updatedCharacter = markWelcomeMessageSeen(initialCharacter);
          setCharacter(updatedCharacter);
        }
        if (events && events.length > 0) {
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
          const newestTs = Math.max(...events.map((e: any) => new Date(e.timestamp).getTime()));
          if (Number.isFinite(newestTs)) {
            lastSeenTimestampRef.current = newestTs;
          }
        }
      } catch (error) {
        console.error('Error loading offline events:', error);
      }
    };

    loadOfflineEvents();
  }, [initialCharacter, options?.adventureLimit]);

  // WebSocket subscription
  useEffect(() => {
    if (!wsEnabled || !wsUrl || !initialCharacter) return;

    try {
      const s = io(wsUrl, {
        transports: ['websocket'],
        query: { realmId, characterId: initialCharacter.id },
      });
      socketRef.current = s;

      s.on('connected', () => {
        // no-op
      });

      s.on('tick:update', async () => {
        const currentCharacter = characterRef.current;
        if (!currentCharacter) return;
        try {
          const updatedCharacter = await fetchCharacter(currentCharacter.id);
          if (updatedCharacter) {
            setCharacter(updatedCharacter);
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
            }
          }
        } catch (e) {
          console.error('WS tick handler failed, falling back to current state', e);
        }
      });

      return () => {
        s.disconnect();
        socketRef.current = null;
      };
    } catch (e) {
      console.error('Failed to init WebSocket, will use polling', e);
    }
  }, [wsEnabled, wsUrl, realmId, initialCharacter]);

  // The main polling interval - fetch updated character state from server (fallback or alongside WS)
  useEffect(() => {
    if (!gameData || !initialCharacter) return;
    if (wsEnabled && wsUrl) return; // if WS is on, skip polling

    const pollInterval = setInterval(async () => {
        const currentCharacter = characterRef.current;
        if (!currentCharacter) {
            return;
        }
        try {
          const updatedCharacter = await fetchCharacter(currentCharacter.id);
          if (!updatedCharacter) {
            failureCountRef.current += 1;
            if (failureCountRef.current % 10 === 0) {
              console.warn('Character fetch returned null repeatedly. Retrying...');
            }
            return;
          }
          failureCountRef.current = 0;
          const hasStateChanged = 
            currentCharacter.status !== updatedCharacter.status ||
            currentCharacter.currentAction?.name !== updatedCharacter.currentAction?.name ||
            currentCharacter.stats.health.current !== updatedCharacter.stats.health.current ||
            currentCharacter.level !== updatedCharacter.level;
          if (hasStateChanged) {
            setCharacter(updatedCharacter);
          }
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
  }, [gameData, initialCharacter, wsEnabled, wsUrl]);

  return { character, adventureLog, combatLog, setCharacter };
}
