'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { SaaSQuotaModal } from '@/components/modals/SaaSQuotaModal';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const isInbox = pathname === '/inbox';

  // Auto-collapse sidebar when entering inbox
  useEffect(() => {
    if (isInbox) setIsCollapsed(true);
  }, [isInbox]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-50 bg-grid-pattern overflow-hidden">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-500">
          {!isInbox && <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}
          <main className={cn(
            "flex-1 overflow-y-auto scroll-smooth no-scrollbar",
            isInbox ? "p-0" : "p-6"
          )}>
            {children}
          </main>
        </div>
      </div>
      <SaaSQuotaModal />
    </ProtectedRoute>
  );
}
