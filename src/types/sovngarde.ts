export interface SovngardeQuest {
    id: string;
    title: string;
    description: string;
    timeReduction: number; // in milliseconds
    duration: number; // in milliseconds
}

export interface ActiveSovngardeQuest {
    questId: string;
    startedAt: number;
}
