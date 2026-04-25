'use client';
import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';

export function useDailyTrend(ownerId: string | undefined, days = 7) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ownerId) return;

    setLoading(true);
    const trendData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dayLabel = format(d, 'EEE'); 
      
      trendData.push({
        day: dayLabel,
        inbound: Math.floor(Math.random() * 200) + 50,
        outbound: Math.floor(Math.random() * 150) + 30,
        waIn: Math.floor(Math.random() * 100),
        waOut: Math.floor(Math.random() * 80),
        wbIn: Math.floor(Math.random() * 50),
        wbOut: Math.floor(Math.random() * 40),
        date: format(d, 'yyyyMMdd')
      });
    }

    setData(trendData);
    setLoading(false);
  }, [ownerId, days]);

  return { data, loading };
}
