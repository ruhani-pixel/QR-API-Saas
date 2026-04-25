'use client';
import { useState, useEffect } from 'react';
import { Message } from '../types/message';

export function useMessages(ownerId: string | undefined, limitCount = 50) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Placeholder for future API connection to new backend
    setMessages([]);
  }, [ownerId, limitCount]);

  return { messages, loading };
}

