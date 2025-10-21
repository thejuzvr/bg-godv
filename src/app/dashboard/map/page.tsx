
"use client";

import { WorldMap } from "@/components/world-map";
import { Map as MapIcon } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from "next/navigation";
import type { Character } from "@/types/character";
import { fetchCharacter } from "@/app/dashboard/shared-actions";
import { fetchGameData, type GameData } from "@/services/gameDataService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { suggestTravel } from "../actions";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import type { Location, LocationType } from "@/types/location";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return null;
  }
  return <LucideIcon {...props} />;
};

const locationTypeFilters: { id: LocationType; name: string; icon: string }[] = [
    { id: 'city', name: 'Города', icon: 'Castle' },
    { id: 'town', name: 'Поселения', icon: 'Building2' },
    { id: 'ruin', name: 'Руины', icon: 'TowerControl' },
    { id: 'dungeon', name: 'Подземелья', icon: 'LandPlot' },
    { id: 'camp', name: 'Лагеря', icon: 'Tent' },
];


export default function MapPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);
    const [character, setCharacter] = useState<Character | null>(null);
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<LocationType[]>(['city', 'town', 'ruin', 'dungeon', 'camp']);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [char, gData] = await Promise.all([fetchCharacter(user.userId), fetchGameData()]);
                if (char) {
                    setCharacter(char);
                    setGameData(gData);
                } else {
                    router.push('/create-character');
                }
            } catch (error) {
                console.error("Failed to load map data:", error);
                toast({
                    title: "Ошибка загрузки данных",
                    description: "Не удалось загрузить карту и данные о герое.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, router, toast]);

    const handleMapLocationClick = (locationId: string) => {
        const location = gameData?.locations.find(l => l.id === locationId);
        if (!location) return;
        
        setSelectedLocation(location);
        setIsModalOpen(true);
    };

    const handleTravelNow = async () => {
        if (!character || !user || !selectedLocation || character.location === selectedLocation.id) {
            setIsModalOpen(false);
            return;
        }

        const result = await suggestTravel(user.userId, selectedLocation.id);
        if (result.success) {
            toast({
                title: "Приказ отдан",
                description: `Вы приказали герою отправиться в ${selectedLocation.name}. Он выдвинется, как только закончит текущие дела.`
            });
        } else {
            toast({
                title: "Ошибка",
                description: result.message || "Не удалось отдать приказ.",
                variant: "destructive"
            });
        }
        setIsModalOpen(false);
    };

    const handleSuggestTravel = async () => {
        if (!character || !user || !selectedLocation || character.location === selectedLocation.id) {
            setIsModalOpen(false);
            return;
        }

        // Suggest travel with lower priority (hero can refuse)
        const result = await suggestTravel(user.userId, selectedLocation.id);
        if (result.success) {
            toast({
                title: "Предложение отправлено",
                description: `Вы предложили герою посетить ${selectedLocation.name}. Он учтёт это при выборе следующего действия.`
            });
        } else {
            toast({
                title: "Ошибка",
                description: result.message || "Не удалось отправить предложение.",
                variant: "destructive"
            });
        }
        setIsModalOpen(false);
    };

    const handleFilterToggle = (filter: LocationType) => {
        setActiveFilters(prev => 
            prev.includes(filter)
                ? prev.filter(f => f !== filter)
                : [...prev, filter]
        );
    };

    const filteredLocations = useMemo(() => {
        if (!gameData) return [];
        return gameData.locations.filter(loc => activeFilters.includes(loc.type));
    }, [gameData, activeFilters]);
    
    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-full">
                <div className="font-headline text-xl">Загрузка карты мира...</div>
            </div>
        );
    }
    
    if (!character || !gameData) {
        return <div className="flex items-center justify-center h-full w-full font-headline text-xl text-destructive">Не удалось загрузить данные для карты.</div>;
    }

return (
    <div className="w-full p-4 md:p-6 lg:p-8 space-y-6">
        <header className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <MapIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-headline text-foreground">Карта Скайрима</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Исследуйте мир и отправляйте героя в новые локации
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {locationTypeFilters.map(filterInfo => (
                    <Button
                        key={filterInfo.id}
                        variant={activeFilters.includes(filterInfo.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterToggle(filterInfo.id)}
                        className="transition-all hover:scale-105"
                    >
                        <Icon name={filterInfo.icon} className="mr-2 h-4 w-4" />
                        {filterInfo.name}
                    </Button>
                ))}
            </div>
        </header>

        {/* Контейнер для карты */}
        <div className="w-full flex justify-center">
            <main 
                ref={mapContainerRef} 
                className="w-full max-w-7xl h-[calc(85vh-220px)] relative border-2 border-border rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-background to-muted/20"
            >
                <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={3}
                    limitToBounds={false}
                    doubleClick={{ step: 0.5 }}
                    wheel={{ step: 0.1 }}
                >
                    {({ zoomIn, zoomOut, resetTransform, setTransform }) => {
                        // Эффект для центрирования карты при первой загрузке
                        useEffect(() => {
                            if (character && gameData && mapContainerRef.current) {
                                const currentLocation = gameData.locations.find(loc => loc.id === character.location);
                                if (!currentLocation) return;

                                const mapWidth = 2048; // Ширина SVG из world-map.tsx
                                const mapHeight = 1489; // Высота SVG из world-map.tsx

                                const targetX = mapWidth * (currentLocation.coords.x / 100);
                                const targetY = mapHeight * (currentLocation.coords.y / 100);

                                const containerWidth = mapContainerRef.current.offsetWidth;
                                const containerHeight = mapContainerRef.current.offsetHeight;

                                // Вычисляем смещение, чтобы цель оказалась в центре
                                const positionX = (containerWidth / 2) - targetX;
                                const positionY = (containerHeight / 2) - targetY;

                                // Плавно перемещаем карту
                                setTransform(positionX, positionY, 1, 300, "easeOut");
                            }
                        // eslint-disable-next-line react-hooks/exhaustive-deps
                        }, [character, gameData]); // Запускаем только при появлении данных

                        return (
                            <>
                                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg border border-border shadow-lg">
                                    <Button 
                                        size="icon" 
                                        variant="ghost"
                                        onClick={() => zoomIn()} 
                                        aria-label="Приблизить"
                                        className="hover:bg-primary/10"
                                    >
                                        <LucideIcons.ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="ghost"
                                        onClick={() => zoomOut()} 
                                        aria-label="Отдалить"
                                        className="hover:bg-primary/10"
                                    >
                                        <LucideIcons.ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="ghost"
                                        onClick={() => resetTransform()} 
                                        aria-label="Сбросить"
                                        className="hover:bg-primary/10"
                                    >
                                        <LucideIcons.RotateCcw className="h-4 w-4" />
                                    </Button>
                                </div>

                                <TransformComponent>
                                    <WorldMap
                                        currentCity={character.location}
                                        locations={filteredLocations}
                                        onLocationClick={handleMapLocationClick}
                                    />
                                </TransformComponent>
                            </>
                        );
                    }}
                </TransformWrapper>
            </main>
        </div>

        {/* Location Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
                        <Icon 
                            name={selectedLocation?.type === 'city' ? 'Castle' : 
                                  selectedLocation?.type === 'town' ? 'Building2' :
                                  selectedLocation?.type === 'dungeon' ? 'LandPlot' :
                                  selectedLocation?.type === 'ruin' ? 'TowerControl' :
                                  'Tent'} 
                            className="h-6 w-6 text-primary" 
                        />
                        {selectedLocation?.name}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Детали локации и варианты путешествия
                    </DialogDescription>
                    <div className="mt-4 space-y-4">
                        <div>
                            <div className="font-semibold text-sm text-foreground mb-1">Тип локации</div>
                            <div className="text-sm capitalize text-muted-foreground">
                                {selectedLocation?.type === 'city' ? 'Город' :
                                 selectedLocation?.type === 'town' ? 'Поселение' :
                                 selectedLocation?.type === 'dungeon' ? 'Подземелье' :
                                 selectedLocation?.type === 'ruin' ? 'Руины' :
                                 selectedLocation?.type === 'camp' ? 'Лагерь' : 'Окрестности'}
                            </div>
                        </div>
                        
                        <div>
                            <div className="font-semibold text-sm text-foreground mb-1">Безопасность</div>
                            <div className="text-sm flex items-center gap-2 text-muted-foreground">
                                {selectedLocation?.isSafe ? (
                                    <><Icon name="ShieldCheck" className="h-4 w-4 text-green-500" /> Безопасная зона</>
                                ) : (
                                    <><Icon name="Skull" className="h-4 w-4 text-red-500" /> Опасная территория</>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold text-sm text-foreground mb-1">Описание</div>
                            <div className="text-sm text-muted-foreground">
                                {selectedLocation?.isSafe 
                                    ? `${selectedLocation.name} — место, где можно отдохнуть, пополнить запасы и принять новые задания. Здесь герой в безопасности.`
                                    : `${selectedLocation?.name} — опасное место, полное враждебных существ и ловушек. Герой должен быть готов к бою.`
                                }
                            </div>
                        </div>

                        {character?.location === selectedLocation?.id && (
                            <div className="p-3 bg-accent/10 border border-accent rounded-md">
                                <div className="text-sm text-accent font-semibold flex items-center gap-2">
                                    <Icon name="MapPin" className="h-4 w-4" />
                                    Герой находится здесь сейчас
                                </div>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex gap-3 mt-6">
                    <Button 
                        onClick={handleTravelNow} 
                        className="flex-1"
                        disabled={character?.location === selectedLocation?.id}
                    >
                        <Icon name="Navigation" className="mr-2 h-4 w-4" />
                        Отправиться сейчас
                    </Button>
                    <Button 
                        onClick={handleSuggestTravel} 
                        variant="outline" 
                        className="flex-1"
                        disabled={character?.location === selectedLocation?.id}
                    >
                        <Icon name="Lightbulb" className="mr-2 h-4 w-4" />
                        Направить героя
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
);
}
