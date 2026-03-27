
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string; // Icon name from lucide-react or a path to an SVG
    isUnlocked: boolean; // This will be determined by user's progress
}
