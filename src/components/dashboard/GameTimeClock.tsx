
"use client";

import React from 'react';
import { Calendar, Clock } from 'lucide-react';

// Simplified Tamrielic calendar
const months = [
    "Утренней Звезды", "Восхода Солнца", "Первого зерна", "Руки дождя",
    "Второго зерна", "Середины года", "Высокого солнца", "Последнего зерна",
    "Огня очага", "Начала морозов", "Заката солнца", "Вечерней звезды"
];

const daysOfWeek = ["Морндас", "Тирдас", "Миддас", "Турдас", "Фредас", "Лордас", "Сандас"];

const formatGameDate = (timestamp: number): { date: string, time: string } => {
    const date = new Date(timestamp);
    // In-game year starts from 4E 201 for lore consistency
    const year = 201 + (date.getFullYear() - new Date().getFullYear());

    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const dayOfWeek = daysOfWeek[date.getDay()];

    const formattedDate = `${dayOfWeek}, ${day}-е ${monthName}, 4Э ${year}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    return { date: formattedDate, time: formattedTime };
};

export const GameTimeClock = ({ gameDate }: { gameDate: number }) => {
    const { date, time } = formatGameDate(gameDate);

    return (
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
    );
};
