'use client';
import { useState, useEffect } from 'react';
import { AdminUser, UserRole } from '../types/user';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  
  // Dummy Admin User for UI/UX demonstration
  const [adminData] = useState<AdminUser>({
    uid: 'dummy-uid-123',
    email: 'admin@example.com',
    role: 'admin' as UserRole,
    isApproved: true,
    accountType: 'platform' as any,
    onboardingComplete: true,
    name: 'RD Models Admin',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  } as any);

  return { 
    user: { 
      uid: 'dummy-uid-123', 
      email: 'admin@example.com',
      displayName: 'RD Models Admin',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
    }, 
    role: 'admin' as UserRole, 
    isApproved: true, 
    accountType: 'platform',
    onboardingComplete: true,
    adminData,
    loading 
  };
}

