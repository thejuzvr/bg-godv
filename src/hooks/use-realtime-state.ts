"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Character } from '@/types/character';

interface RealtimeStateOptions {
  characterId?: string;
  realmId?: string;
  onEvent?: (eventType: string, data: any) => void;
}

interface GameEventPayload {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * Hook for real-time state management
 * Listens to WebSocket events and automatically updates local state
 */
export function useRealtimeState(
  initialCharacter: Character | null,
  options: RealtimeStateOptions = {}
) {
  // Destructure to primitive values to avoid reconnection loops
  const { characterId, realmId, onEvent } = options;
  
  const [character, setCharacter] = useState(initialCharacter);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; timestamp: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const characterRef = useRef(character);
  const onEventRef = useRef(onEvent);

  // Keep refs in sync
  useEffect(() => {
    characterRef.current = character;
  }, [character]);
  
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // Update character when initialCharacter changes (e.g., from refetch)
  useEffect(() => {
    if (initialCharacter) {
      setCharacter(initialCharacter);
    }
  }, [initialCharacter]);

  // Character stats update handler
  const handleStatsUpdate = useCallback((payload: GameEventPayload) => {
    setCharacter(prev => {
      if (!prev || payload.data.characterId !== prev.id) return prev;
      
      const updates: Partial<Character> = {
        stats: {
          ...prev.stats,
          ...payload.data.stats,
        },
      };
      
      // Handle temple progress and divine favor updates
      if (payload.data.stats.templeProgress !== undefined) {
        updates.templeProgress = payload.data.stats.templeProgress;
      }
      if (payload.data.stats.divineFavor !== undefined) {
        updates.divineFavor = payload.data.stats.divineFavor;
      }
      
      // Handle faction updates
      if (payload.data.stats.factions !== undefined) {
        updates.factions = payload.data.stats.factions;
      }
      
      return {
        ...prev,
        ...updates,
      };
    });
    
    setLastEvent({ type: 'stats', timestamp: payload.timestamp });
  }, []);

  // Character power update handler
  const handlePowerUpdate = useCallback((payload: GameEventPayload) => {
    setCharacter(prev => {
      if (!prev || payload.data.characterId !== prev.id) return prev;
      
      return {
        ...prev,
        interventionPower: payload.data.interventionPower,
      };
    });
    
    setLastEvent({ type: 'power', timestamp: payload.timestamp });
  }, []);

  // Character location change handler
  const handleLocationChange = useCallback((payload: GameEventPayload) => {
    setCharacter(prev => {
      if (!prev || payload.data.characterId !== prev.id) return prev;
      
      return {
        ...prev,
        location: payload.data.newLocation,
      };
    });
    
    setLastEvent({ type: 'location', timestamp: payload.timestamp });
  }, []);

  // Character status change handler
  const handleStatusChange = useCallback((payload: GameEventPayload) => {
    setCharacter(prev => {
      if (!prev || payload.data.characterId !== prev.id) return prev;
      
      return {
        ...prev,
        status: payload.data.newStatus,
      };
    });
    
    setLastEvent({ type: 'status', timestamp: payload.timestamp });
  }, []);

  // Character inventory update handler
  const handleInventoryUpdate = useCallback((payload: GameEventPayload) => {
    setCharacter(prev => {
      if (!prev || payload.data.characterId !== prev.id) return prev;
      
      // Apply inventory changes
      const updatedInventory = [...prev.inventory];
      for (const change of payload.data.changes) {
        const existingIndex = updatedInventory.findIndex(i => i.id === change.itemId);
        
        if (existingIndex >= 0) {
          if (change.newQuantity <= 0) {
            // Remove item
            updatedInventory.splice(existingIndex, 1);
          } else {
            // Update quantity
            updatedInventory[existingIndex] = {
              ...updatedInventory[existingIndex],
              quantity: change.newQuantity,
            };
          }
        } else if (change.newQuantity > 0) {
          // Add new item (need to fetch full item data, for now just add minimal)
          updatedInventory.push({
            id: change.itemId,
            name: change.itemName,
            quantity: change.newQuantity,
          } as any);
        }
      }
      
      return {
        ...prev,
        inventory: updatedInventory,
      };
    });
    
    setLastEvent({ type: 'inventory', timestamp: payload.timestamp });
  }, []);

  // Character level up handler
  const handleLevelUp = useCallback((payload: GameEventPayload) => {
    setCharacter(prev => {
      if (!prev || payload.data.characterId !== prev.id) return prev;
      
      return {
        ...prev,
        level: payload.data.newLevel,
        points: {
          ...prev.points,
          attribute: (prev.points?.attribute || 0) + payload.data.attributePoints,
          skill: (prev.points?.skill || 0) + payload.data.skillPoints,
        },
      };
    });
    
    setLastEvent({ type: 'level-up', timestamp: payload.timestamp });
  }, []);

  // Character effects update handler
  const handleEffectsUpdate = useCallback((payload: GameEventPayload) => {
    setCharacter(prev => {
      if (!prev || payload.data.characterId !== prev.id) return prev;
      
      return {
        ...prev,
        effects: payload.data.effects,
      };
    });
    
    setLastEvent({ type: 'effects', timestamp: payload.timestamp });
  }, []);

  // WebSocket connection setup
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    const wsEnabled = process.env.NEXT_PUBLIC_WS_ENABLED === 'true';

    if (!wsEnabled || !wsUrl || !characterId) {
      setIsConnected(false);
      return;
    }

    console.log('[RealtimeState] Setting up WebSocket connection...', { characterId, realmId });

    try {
      const socket = io(wsUrl, {
        transports: ['websocket'],
        query: {
          realmId: realmId || 'global',
          characterId: characterId,
        },
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[RealtimeState] Connected to WebSocket');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('[RealtimeState] Disconnected from WebSocket');
        setIsConnected(false);
      });

      socket.on('connected', (data: any) => {
        console.log('[RealtimeState] WebSocket handshake complete:', data);
      });

      // Listen to specific event types
      socket.on('character:stats:updated', handleStatsUpdate);
      socket.on('character:power:updated', handlePowerUpdate);
      socket.on('character:location:changed', handleLocationChange);
      socket.on('character:status:changed', handleStatusChange);
      socket.on('character:inventory:updated', handleInventoryUpdate);
      socket.on('character:level:up', handleLevelUp);
      socket.on('character:effects:updated', handleEffectsUpdate);

      // Generic event handler
      socket.on('game:event', (event: GameEventPayload) => {
        console.log('[RealtimeState] Received event:', event.type);
        
        // Use ref to avoid reconnection loop
        if (onEventRef.current) {
          onEventRef.current(event.type, event.data);
        }
      });

      // Legacy tick update support
      socket.on('tick:update', async (data: any) => {
        console.log('[RealtimeState] Tick update received');
        // Full character refresh on tick (legacy)
        if (characterRef.current && data.characterId === characterRef.current.id) {
          try {
            const { fetchCharacter } = await import('@/app/dashboard/shared-actions');
            const updated = await fetchCharacter(data.characterId);
            if (updated) {
              setCharacter(updated);
            }
          } catch (error) {
            console.error('[RealtimeState] Error fetching character:', error);
          }
        }
      });

      return () => {
        console.log('[RealtimeState] Cleaning up WebSocket connection');
        socket.disconnect();
      };
    } catch (error) {
      console.error('[RealtimeState] Error setting up WebSocket:', error);
      setIsConnected(false);
    }
  }, [characterId, realmId]); // Only reconnect if character/realm changes

  return {
    character,
    isConnected,
    lastEvent,
    setCharacter, // Allow manual updates if needed
  };
}

/**
 * Hook specifically for market real-time updates
 */
export function useRealtimeMarket() {
  const [prices, setPrices] = useState<Map<string, number>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    const wsEnabled = process.env.NEXT_PUBLIC_WS_ENABLED === 'true';

    if (!wsEnabled || !wsUrl) {
      setIsConnected(false);
      return;
    }

    try {
      const socket = io(wsUrl, {
        transports: ['websocket'],
        query: { realmId: 'global' },
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[RealtimeMarket] Connected to WebSocket');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('[RealtimeMarket] Disconnected from WebSocket');
        setIsConnected(false);
      });

      // Listen to market price updates
      socket.on('market:price:updated', (payload: GameEventPayload) => {
        const { itemId, newPrice } = payload.data;
        setPrices(prev => new Map(prev).set(itemId, newPrice));
        console.log(`[RealtimeMarket] Price updated: ${itemId} = ${newPrice}`);
      });

      return () => {
        console.log('[RealtimeMarket] Cleaning up WebSocket connection');
        socket.disconnect();
      };
    } catch (error) {
      console.error('[RealtimeMarket] Error setting up WebSocket:', error);
      setIsConnected(false);
    }
  }, []); // Empty dependencies - connect once on mount

  return {
    prices,
    isConnected,
    getPrice: (itemId: string) => prices.get(itemId),
  };
}

