'use client';
import { useState, useEffect } from 'react';

export function useWebhookLogs(ownerId: string | undefined, limitCount = 10) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ownerId) return;

    setLoading(true);
    // Generate mock logs
    const mockLogs = Array.from({ length: limitCount }).map((_, i) => ({
      id: `log-${i}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      event: i % 2 === 0 ? 'message.received' : 'message.sent',
      status: 'success',
      details: `Processed message from +91987654321${i}`,
    }));

    setLogs(mockLogs);
    setLoading(false);
  }, [ownerId, limitCount]);

  return { logs, loading };
}
