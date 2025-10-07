
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, Clock } from 'lucide-react';

export const RealTimeClock = () => {
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = format(date, 'HH:mm:ss');
    const formattedDate = format(date, 'EEEE, d MMMM yyyy г.', { locale: ru });

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium capitalize">{formattedDate}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-mono font-medium">{formattedTime}</p>
            </div>
        </div>
    );
};
