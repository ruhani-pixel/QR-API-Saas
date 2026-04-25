'use client';
import { useState, useEffect } from 'react';
import { Contact } from '../types/contact';

export function useContacts(ownerId: string | undefined) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Placeholder for future API connection to new backend
    setContacts([]);
  }, [ownerId]);

  return { contacts, loading };
}

