'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Bot, Zap,
  Download, Settings, BarChart2,
  CreditCard, LogOut, ChevronRight, Building2
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, adminData } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const mainLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/devices', label: 'Devices', icon: Building2 },
    { href: '/inbox', label: 'Unified Inbox', icon: Inbox, badge: 'Live' },
  ];

  const managementLinks = [
    { href: '/ai-config', label: 'AI Control', icon: Bot },
    { href: '/bulk', label: 'Bulk Sender', icon: Zap },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    setSigningOut(true);
    document.cookie = 'firebase-token=; path=/; max-age=0';
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col h-screen z-50 flex-shrink-0">
      {/* Brand Header */}
      <div className="px-6 py-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex-shrink-0">
            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full group-hover:bg-amber-500/40 transition-all duration-500" />
            <div className="relative w-10 h-10 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
               <span className="text-xl font-black text-amber-500">S</span>
            </div>
          </div>
          <div>
            <span className="text-lg font-black text-white tracking-tighter uppercase block leading-none">
              SOLID
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500/80">
              MODELS
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
        {/* Main Section */}
        <div className="space-y-1">
          {mainLinks.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
        </div>

        {/* Management Section */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Management</p>
          {managementLinks.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
        </div>
      </nav>

      {/* Bottom Panel */}
      <div className="p-4 border-t border-slate-900 space-y-4">
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="text-[10px] font-bold text-amber-500">AD</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white truncate w-24">Admin</span>
              <span className="text-[9px] font-medium text-slate-500">Pro Plan</span>
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ href, label, icon: Icon, badge, active }: any) {
  return (
    <Link href={href} className="block relative group">
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
        active ? "text-amber-400" : "text-slate-500 hover:text-slate-200"
      )}>
        <Icon size={18} className={cn("transition-colors", active ? "text-amber-500" : "text-slate-600 group-hover:text-slate-400")} />
        <span className="text-sm font-bold flex-1">{label}</span>
        {badge && (
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-tighter animate-pulse">
            {badge}
          </span>
        )}
        {active && <ChevronRight size={14} className="text-amber-500/50" />}
      </div>
    </Link>
  );
}
