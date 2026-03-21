
"use client";

import { WorldMap } from "@/components/world-map";
import { Map as MapIcon, Clock, AlertTriangle } from "lucide-react";
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
import { MapWeatherHud } from "@/components/map-weather-hud";
import { calculateTravelTime } from "@/lib/travel-calculator";
import { applyDynamicDangerToLocations } from "@/lib/danger-level-manager";
import { PageContainer } from "@/components/layout/page-container";
import { SectionContainer } from "@/components/layout/section-container";
// Removed parent TransformWrapper to avoid nested transform with WorldMap
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const Icon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const LucideIcon = (LucideIcons as any)[name] as React.ComponentType<LucideIcons.LucideProps>;
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
    { id: 'outskirts', name: 'Окраины', icon: 'LandPlot' },
];


export default function MapPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth(true);
    const [character, setCharacter] = useState<Character | null>(null);
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<LocationType[]>(['city', 'town', 'ruin', 'dungeon', 'camp', 'outskirts']);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [availableHeight, setAvailableHeight] = useState<number>(0);

    useEffect(() => {
        const updateHeight = () => {
            const headerH = headerRef.current?.offsetHeight || 200;
            const viewportH = window.innerHeight;
            const paddingV = 0; // root has pt-4 pb-0; already accounted visually
            const h = Math.max(0, viewportH - headerH - paddingV);
            setAvailableHeight(h);
        };
        updateHeight();
        const ro = new ResizeObserver(updateHeight);
        if (headerRef.current) ro.observe(headerRef.current);
        window.addEventListener('resize', updateHeight);
        return () => { window.removeEventListener('resize', updateHeight); ro.disconnect(); };
    }, []);
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
        
        // Mark location with discovery status
        const isDiscovered = location.isStartingLocation || character?.visitedLocations.includes(locationId) || character?.location === locationId;
        setSelectedLocation({ ...location, isDiscovered });
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

    // Apply dynamic danger levels based on character state
    const locationsWithDynamicDanger = useMemo(() => {
        if (!gameData || !character) return [];
        
        return applyDynamicDangerToLocations(gameData.locations, {
            timeOfDay: character.timeOfDay,
            season: character.season,
            weather: character.weather,
            visitedLocations: character.visitedLocations,
            currentLocation: character.location
        });
    }, [gameData, character]);
    
    const filteredLocations = useMemo(() => {
        return locationsWithDynamicDanger.filter(loc => activeFilters.includes(loc.type));
    }, [locationsWithDynamicDanger, activeFilters]);
    
    // Calculate travel info for selected location
    const travelInfo = useMemo(() => {
        if (!selectedLocation || !character || !gameData) return null;
        
        const originLocation = gameData.locations.find(l => l.id === character.location);
        if (!originLocation) return null;
        
        const isDiscovered = selectedLocation.isStartingLocation || character.visitedLocations.includes(selectedLocation.id);
        
        return calculateTravelTime(
            originLocation,
            selectedLocation,
            character.weather,
            isDiscovered || false
        );
    }, [selectedLocation, character, gameData]);
    
    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-full font-body">
                <div className="font-headline text-xl">Загрузка карты мира...</div>
            </div>
        );
    }
    
    if (!character || !gameData) {
        return <div className="flex items-center justify-center h-full w-full font-headline text-xl text-destructive font-body">Не удалось загрузить данные для карты.</div>;
    }

return (
    <>
    <PageContainer className="w-full h-full min-h-0 overflow-hidden flex flex-col pt-4 pb-0 font-body">
        <header ref={headerRef} className="space-y-4 px-4 md:px-6 lg:px-8">
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
            
            <div className="flex flex-wrap gap-2 font-body">
                {locationTypeFilters.map(filterInfo => (
                    <Button
                        key={filterInfo.id}
                        variant={activeFilters.includes(filterInfo.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterToggle(filterInfo.id)}
                        className="transition-all hover:scale-105 font-body"
                    >
                        <Icon name={filterInfo.icon} className="mr-2 h-4 w-4" />
                        {filterInfo.name}
                    </Button>
                ))}
            </div>
        </header>

        {/* Контейнер для карты */}
        <div className="w-full flex-1 min-h-0 flex justify-center mt-3 px-4 md:px-6 lg:px-8">
    <main 
        ref={mapContainerRef} 
                className="w-full max-w-none relative border-2 border-border rounded-xl overflow-hidden overscroll-contain shadow-lg bg-gradient-to-br from-background to-muted/20"
                style={{
                    height: availableHeight ? `${availableHeight}px` : 'calc(100vh - 200px)',
                    maxHeight: availableHeight ? `${availableHeight}px` : 'calc(100vh - 200px)',
                    minHeight: availableHeight ? `${availableHeight}px` : 'calc(100vh - 200px)',
                }}
    >
                {/* WorldMap includes its own zoom/pan and tooltips */}
                <WorldMap
                    currentCity={character.location}
                    locations={filteredLocations}
                    visitedLocations={character.visitedLocations}
                    onLocationClick={handleMapLocationClick}
                />

                {/* Weather HUD */}
                <div className="absolute top-4 right-4 z-10">
                    <MapWeatherHud character={character} />
                </div>

                {/* Легенда уровня опасности */}
                <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-border shadow-lg font-body">
                    <div className="text-xs font-semibold mb-2 font-headline">Уровень опасности</div>
                    <div className="flex items-center gap-2 text-xs font-body"><span className="inline-block w-3 h-3 rounded-full bg-emerald-500" /> Безопасно (0-19%)</div>
                    <div className="flex items-center gap-2 text-xs font-body mt-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-500" /> Умеренная (20-39%)</div>
                    <div className="flex items-center gap-2 text-xs font-body mt-1"><span className="inline-block w-3 h-3 rounded-full bg-orange-500" /> Опасно (40-69%)</div>
                    <div className="flex items-center gap-2 text-xs font-body mt-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500" /> Очень опасно (70-100%)</div>
                </div>
            </main>
        </div>

        {/* Location Details Modal */}
    </PageContainer>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[500px] font-body">
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
                    <DialogDescription className="sr-only font-body">
                        Детали локации и варианты путешествия
                    </DialogDescription>
                    <div className="mt-4 space-y-4 font-body">
                        <div>
                            <div className="font-semibold text-sm text-foreground mb-1 font-body">Тип локации</div>
                            <div className="text-sm capitalize text-muted-foreground font-body">
                                {selectedLocation?.type === 'city' ? 'Город' :
                                 selectedLocation?.type === 'town' ? 'Поселение' :
                                 selectedLocation?.type === 'dungeon' ? 'Подземелье' :
                                 selectedLocation?.type === 'ruin' ? 'Руины' :
                                 selectedLocation?.type === 'camp' ? 'Лагерь' : 'Окрестности'}
                            </div>
                        </div>
                        
                        <div>
                            <div className="font-semibold text-sm text-foreground mb-1 font-body">Опасность</div>
                            <div className="text-sm space-y-2 font-body">
                                {typeof selectedLocation?.dangerLevel === 'number' ? (
                                    <>
                                        <div className="flex items-center gap-2 font-body">
                                            <span className={
                                                selectedLocation.dangerLevel >= 70 ? "text-red-500 font-semibold" :
                                                selectedLocation.dangerLevel >= 40 ? "text-orange-500 font-semibold" :
                                                selectedLocation.dangerLevel >= 20 ? "text-yellow-500" :
                                                "text-green-500"
                                            }>
                                                {selectedLocation.dangerLevel}%
                                            </span>
                                            <span className="text-muted-foreground text-xs font-body">
                                                {selectedLocation.dangerLevel >= 70 ? 'Очень опасно' :
                                                 selectedLocation.dangerLevel >= 40 ? 'Опасно' :
                                                 selectedLocation.dangerLevel >= 20 ? 'Умеренная опасность' : 'Безопасно'}
                                            </span>
                                            {(selectedLocation as unknown as Record<string, string | number>).dangerTrend && (selectedLocation as unknown as Record<string, string | number>).dangerTrend !== 'stable' && (
                                                <span className="text-xs font-body">
                                                    {(selectedLocation as unknown as Record<string, string | number>).dangerTrend === 'increasing' ? '📈' : '📉'}
                                                </span>
                                            )}
                                        </div>
                                        {/* Show base danger if it's different from current */}
                                        {(selectedLocation as unknown as Record<string, string | number>).baseDangerLevel !== undefined &&
                                         (selectedLocation as unknown as Record<string, string | number>).baseDangerLevel !== selectedLocation.dangerLevel && (
                                            <div className="text-xs text-muted-foreground font-body">
                                                Базовый уровень: {(selectedLocation as unknown as Record<string, string | number>).baseDangerLevel}%
                                                {selectedLocation.dangerLevel > (selectedLocation as unknown as Record<string, string | number>).baseDangerLevel ? (
                                                    <span className="text-orange-500 ml-1 font-body">(повышено из-за условий)</span>
                                                ) : (
                                                    <span className="text-green-500 ml-1 font-body">(снижено из-за условий)</span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-muted-foreground font-body">Безопасная зона</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold text-sm text-foreground mb-1 font-body">Описание</div>
                            <div className="text-sm text-muted-foreground font-body">
                                {selectedLocation?.isDiscovered ? (
                                    selectedLocation?.isSafe 
                                        ? `${selectedLocation.name} — место, где можно отдохнуть, пополнить запасы и принять новые задания. Здесь герой в безопасности.`
                                        : `${selectedLocation?.name} — опасное место, полное враждебных существ и ловушек. Герой должен быть готов к бою.`
                                ) : (
                                    "Неизведанная территория. Герой ещё не был здесь, путешествие будет долгим и опасным."
                                )}
                            </div>
                        </div>

                        {/* Travel time and warnings */}
                        {travelInfo && character?.location !== selectedLocation?.id && (
                            <div className="space-y-2 font-body">
                                <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-md font-body">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <div className="text-sm font-semibold text-foreground font-body">
                                            Время в пути: {travelInfo.displayTime}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-body">
                                            {travelInfo.weatherModifier > 1 && "Погода замедляет путешествие"}
                                            {travelInfo.discoveryModifier > 1 && " • Неизведанный путь"}
                                        </div>
                                    </div>
                                </div>
                                
                                {travelInfo.warnings.length > 0 && (
                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md space-y-1 font-body">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-yellow-600 dark:text-yellow-500 font-body">
                                            <AlertTriangle className="h-4 w-4" />
                                            Предупреждения
                                        </div>
                                        {travelInfo.warnings.map((warning, i) => (
                                            <div key={i} className="text-xs text-muted-foreground pl-6 font-body">
                                                • {warning}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {character?.location === selectedLocation?.id && (
                            <div className="p-3 bg-accent/10 border border-accent rounded-md font-body">
                                <div className="text-sm text-accent font-semibold flex items-center gap-2 font-body">
                                    <Icon name="MapPin" className="h-4 w-4" />
                                    Герой находится здесь сейчас
                                </div>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex gap-3 mt-6 font-body">
                    <Button 
                        onClick={handleTravelNow} 
                        className="flex-1 font-body"
                        disabled={character?.location === selectedLocation?.id}
                    >
                        <Icon name="Navigation" className="mr-2 h-4 w-4" />
                        Отправиться сейчас
                    </Button>
                    <Button 
                        onClick={handleSuggestTravel} 
                        variant="outline" 
                        className="flex-1 font-body"
                        disabled={character?.location === selectedLocation?.id}
                    >
                        <Icon name="Lightbulb" className="mr-2 h-4 w-4" />
                        Направить героя
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </>
);
}
