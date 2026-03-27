import { browser } from '$app/environment';
import { io, Socket } from 'socket.io-client';
import { writable } from 'svelte/store';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5050';

export interface GameEvent {
	type: string;
	data: any;
	timestamp: number;
}

export const realtimeEvents = writable<GameEvent[]>([]);
export const isConnected = writable(false);
export const connectionError = writable<string | null>(null);

class RealtimeService {
	private socket: Socket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;

	connect(realmId: string, characterId?: string) {
		if (!browser) return;
		if (this.socket?.connected) return;

		console.log('[Realtime] Connecting to', WS_URL);

		this.socket = io(WS_URL, {
			query: { realmId, characterId },
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			reconnectionAttempts: this.maxReconnectAttempts
		});

		this.socket.on('connected', (data) => {
			console.log('[Realtime] Connected:', data);
			isConnected.set(true);
			connectionError.set(null);
			this.reconnectAttempts = 0;
		});

		this.socket.on('game:event', (event: GameEvent) => {
			console.log('[Realtime] Game event:', event.type);
			realtimeEvents.update((events) => [...events.slice(-99), event]); // Keep last 100 events
		});

		// Legacy tick:update support
		this.socket.on('tick:update', (data: any) => {
			console.log('[Realtime] Tick update');
			realtimeEvents.update((events) => [
				...events.slice(-99),
				{
					type: 'tick:update',
					data,
					timestamp: Date.now()
				}
			]);
		});

		this.socket.on('disconnect', (reason) => {
			console.log('[Realtime] Disconnected:', reason);
			isConnected.set(false);
		});

		this.socket.on('connect_error', (error) => {
			console.error('[Realtime] Connection error:', error);
			this.reconnectAttempts++;
			connectionError.set(
				`Connection failed (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
			);

			if (this.reconnectAttempts >= this.maxReconnectAttempts) {
				connectionError.set('Failed to connect to realtime server. Please refresh the page.');
			}
		});
	}

	subscribe(eventType: string) {
		this.socket?.emit('subscribe', eventType);
	}

	unsubscribe(eventType: string) {
		this.socket?.emit('unsubscribe', eventType);
	}

	disconnect() {
		this.socket?.disconnect();
		this.socket = null;
		isConnected.set(false);
	}

	// Listen to specific event types
	on(eventType: string, callback: (data: any) => void) {
		if (!this.socket) {
			console.warn('[Realtime] Socket not connected');
			return;
		}
		this.socket.on(eventType, callback);
	}

	off(eventType: string, callback: (data: any) => void) {
		if (!this.socket) return;
		this.socket.off(eventType, callback);
	}
}

export const realtime = new RealtimeService();
