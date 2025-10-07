
'use server';

export type ChronicleEntryType = 'level_up' | 'quest_complete' | 'unique_kill' | 'death' | 'discovery_city';

export interface ChronicleEntry {
    id: string; // Firestore doc ID
    timestamp: number;
    type: ChronicleEntryType;
    title: string;
    description: string;
    icon: string; // Lucide icon name
    data?: Record<string, any>; // e.g., { level: 5 }, { questId: '...' }
}
