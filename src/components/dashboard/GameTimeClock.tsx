
"use client";

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Moon, Sunrise, Sun, Sunset } from 'lucide-react';
import type { TimeOfDay } from '@/types/character';
import { getGlobalGameDate } from '@/lib/gameTime';
import { formatTamrielicDate } from '@/lib/tesCalendar';

const timeOfDayInfo: Record<TimeOfDay, { name: string; icon: React.ComponentType<any>; color: string }> = {
    'night': { name: 'Ночь', icon: Moon, color: 'text-purple-500' },
    'morning': { name: 'Утро', icon: Sunrise, color: 'text-yellow-500' },
    'day': { name: 'День', icon: Sun, color: 'text-blue-500' },
    'evening': { name: 'Вечер', icon: Sunset, color: 'text-orange-500' },
};

export const GameTimeClock = ({ gameDate }: { gameDate: number }) => {
    const [now, setNow] = useState<number>(gameDate || getGlobalGameDate());

    useEffect(() => {
        setNow(gameDate || getGlobalGameDate());
    }, [gameDate]);

    useEffect(() => {
        const id = setInterval(() => {
            setNow(getGlobalGameDate());
        }, 5000); // light client timer update every 5s
        return () => clearInterval(id);
    }, []);

    const { dateText, timeText, timeOfDay } = formatTamrielicDate(now);
    const timeInfo = timeOfDayInfo[timeOfDay];
    const TimeIcon = timeInfo.icon;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium capitalize">{dateText}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm font-mono font-medium">{timeText}</p>
                </div>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 bg-muted/50 rounded-md">
                <TimeIcon className={`h-4 w-4 ${timeInfo.color}`} />
                <span className={`text-sm font-medium ${timeInfo.color}`}>{timeInfo.name}</span>
            </div>
        </div>
    );
};
