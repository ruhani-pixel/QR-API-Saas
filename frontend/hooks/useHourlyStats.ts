'use client';
import { useState, useEffect } from 'react';

export function useHourlyStats(ownerId: string | undefined) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ownerId) return;
    
    setLoading(true);
    // Generate mock hourly data
    const chartData = [];
    for (let i = 0; i < 24; i++) {
      const hourLabel = i.toString().padStart(2, '0');
      chartData.push({
        time: `${hourLabel}:00`,
        messages: Math.floor(Math.random() * 50) + 10,
        outbound: Math.floor(Math.random() * 40) + 5,
      });
    }
    setData(chartData);
    setLoading(false);
  }, [ownerId]);

  return { data, loading };
}
