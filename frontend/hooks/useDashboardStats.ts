'use client';
import { useState, useEffect } from 'react';
import { DashboardStats, DailyStats } from '../types/message';

export function useDashboardStats(ownerId: string | undefined) {
  const [dailyStats, setDailyStats] = useState<DailyStats>({ 
    totalInbound: 1247, 
    totalOutbound: 850, 
    failedMessages: 12 
  });
  const [totalStats, setTotalStats] = useState<DashboardStats>({ 
    totalInbound: 15420, 
    totalOutbound: 12300, 
    totalContacts: 450, 
    totalConversations: 1200, 
    failedMessages: 45 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock loading delay
    if (ownerId) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ownerId]);

  return { dailyStats, totalStats, loading };
}
