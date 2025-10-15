
"use client";

import React from 'react';
import { Calendar, Clock, Moon, Sunrise, Sun, Sunset } from 'lucide-react';
import type { TimeOfDay } from '@/types/character';

// Simplified Tamrielic calendar
const months = [
    "Утренней Звезды", "Восхода Солнца", "Первого зерна", "Руки дождя",
    "Второго зерна", "Середины года", "Высокого солнца", "Последнего зерна",
    "Огня очага", "Начала морозов", "Заката солнца", "Вечерней звезды"
];

const daysOfWeek = ["Морндас", "Тирдас", "Миддас", "Турдас", "Фредас", "Лордас", "Сандас"];

const timeOfDayInfo: Record<TimeOfDay, { name: string; icon: React.ComponentType<any>; color: string }> = {
    'night': { name: 'Ночь', icon: Moon, color: 'text-purple-500' },
    'morning': { name: 'Утро', icon: Sunrise, color: 'text-yellow-500' },
    'day': { name: 'День', icon: Sun, color: 'text-blue-500' },
    'evening': { name: 'Вечер', icon: Sunset, color: 'text-orange-500' },
};

const calculateTimeOfDay = (gameDate: number): TimeOfDay => {
    const date = new Date(gameDate);
    const hour = date.getHours();
    
    if (hour >= 21 || hour < 5) return 'night';
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'day';
    return 'evening';
};

const formatGameDate = (timestamp: number): { date: string, time: string, timeOfDay: TimeOfDay } => {
    const date = new Date(timestamp);
    // In-game year starts from 4E 201 for lore consistency
    const year = 201 + (date.getFullYear() - new Date().getFullYear());

    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const dayOfWeek = daysOfWeek[date.getDay()];

    const formattedDate = `${dayOfWeek}, ${day}-е ${monthName}, 4Э ${year}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    const timeOfDay = calculateTimeOfDay(timestamp);

    return { date: formattedDate, time: formattedTime, timeOfDay };
};

export const GameTimeClock = ({ gameDate }: { gameDate: number }) => {
    const { date, time, timeOfDay } = formatGameDate(gameDate);
    const timeInfo = timeOfDayInfo[timeOfDay];
    const TimeIcon = timeInfo.icon;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium capitalize">{date}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm font-mono font-medium">{time}</p>
                </div>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 bg-muted/50 rounded-md">
                <TimeIcon className={`h-4 w-4 ${timeInfo.color}`} />
                <span className={`text-sm font-medium ${timeInfo.color}`}>{timeInfo.name}</span>
            </div>
        </div>
    );
};
