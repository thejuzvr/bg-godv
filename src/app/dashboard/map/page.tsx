
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
    <div className="w-full p-4 md:p-6 lg:p-8">
        <header className="mb-4">
            <div className="flex items-center gap-2">
                <MapIcon className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-headline">Карта Мира</h1>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
                Прикажите герою отправиться в путь, выбрав точку на карте. Используйте фильтры для отображения локаций.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
                {locationTypeFilters.map(filterInfo => (
                    <Button
                        key={filterInfo.id}
                        variant={activeFilters.includes(filterInfo.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterToggle(filterInfo.id)}
                    >
                        <Icon name={filterInfo.icon} className="mr-2 h-4 w-4" />
                        {filterInfo.name}
                    </Button>
                ))}
            </div>
        </header>

        {/* Контейнер для центрирования карты */}
        <div className="w-full flex justify-left">
            <main ref={mapContainerRef} className="w-[70%] h-[calc(80vh-180px)] relative border rounded-lg overflow-hidden">
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
                                <div className="absolute top-4 right-4 z-10 flex gap-2">
                                    <Button size="icon" onClick={() => zoomIn()} aria-label="Приблизить"><LucideIcons.ZoomIn className="h-4 w-4" /></Button>
                                    <Button size="icon" onClick={() => zoomOut()} aria-label="Отдалить"><LucideIcons.ZoomOut className="h-4 w-4" /></Button>
                                    <Button size="icon" onClick={() => resetTransform()} aria-label="Сбросить"><LucideIcons.RotateCcw className="h-4 w-4" /></Button>
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
                    <DialogDescription>
                        <div className="mt-4 space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm text-foreground mb-1">Тип локации</h4>
                                <p className="text-sm capitalize">
                                    {selectedLocation?.type === 'city' ? 'Город' :
                                     selectedLocation?.type === 'town' ? 'Поселение' :
                                     selectedLocation?.type === 'dungeon' ? 'Подземелье' :
                                     selectedLocation?.type === 'ruin' ? 'Руины' :
                                     selectedLocation?.type === 'camp' ? 'Лагерь' : 'Окрестности'}
                                </p>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-sm text-foreground mb-1">Безопасность</h4>
                                <p className="text-sm flex items-center gap-2">
                                    {selectedLocation?.isSafe ? (
                                        <><Icon name="ShieldCheck" className="h-4 w-4 text-green-500" /> Безопасная зона</>
                                    ) : (
                                        <><Icon name="Skull" className="h-4 w-4 text-red-500" /> Опасная территория</>
                                    )}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-sm text-foreground mb-1">Описание</h4>
                                <p className="text-sm text-muted-foreground">
                                    {selectedLocation?.isSafe 
                                        ? `${selectedLocation.name} — место, где можно отдохнуть, пополнить запасы и принять новые задания. Здесь герой в безопасности.`
                                        : `${selectedLocation?.name} — опасное место, полное враждебных существ и ловушек. Герой должен быть готов к бою.`
                                    }
                                </p>
                            </div>

                            {character?.location === selectedLocation?.id && (
                                <div className="p-3 bg-accent/10 border border-accent rounded-md">
                                    <p className="text-sm text-accent font-semibold flex items-center gap-2">
                                        <Icon name="MapPin" className="h-4 w-4" />
                                        Герой находится здесь сейчас
                                    </p>
                                </div>
                            )}
                        </div>
                    </DialogDescription>
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
