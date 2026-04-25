'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Bot, Zap,
  Settings, BarChart2,
  LogOut, ChevronRight, Building2,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

export function Sidebar({ isCollapsed, setIsCollapsed }: any) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const mainLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/devices', label: 'Devices', icon: Building2 },
    { href: '/inbox', label: 'Unified Inbox', icon: Inbox, badge: 'Live' },
  ];

  const managementLinks = [
    { href: '/ai-config', label: 'AI Setup', icon: Bot },
    { href: '/bulk', label: 'Bulk Sender', icon: Zap },
    { href: '/analytics', label: 'Performance', icon: BarChart2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    setSigningOut(true);
    document.cookie = 'firebase-token=; path=/; max-age=0';
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <aside className={cn(
      "bg-white border-r border-slate-100 flex flex-col h-screen z-50 flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-500 ease-in-out relative",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Brand Header */}
      <div className={cn("px-6 py-10 flex items-center justify-between", isCollapsed && "px-4")}>
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-3 group animate-in fade-in duration-500">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 bg-brand-gold/20 blur-xl rounded-full group-hover:bg-brand-gold/40 transition-all duration-500" />
              <div className="relative w-10 h-10 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-slate-900/20">
                 <span className="text-xl font-black text-brand-gold">S</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900 tracking-tighter uppercase block leading-none">SOLID</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">MODELS</span>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 mx-auto">
             <span className="text-sm font-black text-brand-gold">S</span>
          </div>
        )}
      </div>

      {/* Toggle Button Inside Sidebar (Floating) */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-md hover:shadow-lg transition-all z-[60]"
      >
        {isCollapsed ? <PanelLeftOpen size={12} /> : <PanelLeftClose size={12} />}
      </button>

      {/* Navigation */}
      <nav className={cn("flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar", isCollapsed && "px-2")}>
        {/* Main Section */}
        <div className="space-y-1">
          {mainLinks.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} isCollapsed={isCollapsed} />
          ))}
        </div>

        {/* Management Section */}
        <div className="space-y-1">
          {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 animate-in slide-in-from-left-4 duration-500">Management System</p>}
          {managementLinks.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} isCollapsed={isCollapsed} />
          ))}
        </div>
      </nav>

      {/* Bottom Panel */}
      <div className={cn("p-4 border-t border-slate-50 space-y-4 bg-slate-50/50", isCollapsed && "p-2")}>
        <div className={cn("p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between", isCollapsed && "p-2 justify-center")}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 shrink-0">
              <span className="text-[10px] font-black text-brand-gold uppercase">AD</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in duration-500">
                <span className="text-xs font-black text-slate-900 truncate w-24">Admin User</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Pro Enterprise</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={handleSignOut} className="p-2 text-slate-300 hover:text-rose-500 transition-colors animate-in fade-in duration-500">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavLink({ href, label, icon: Icon, badge, active, isCollapsed }: any) {
  return (
    <Link href={href} className="block relative group selection:bg-transparent">
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 bg-slate-50 border border-slate-100 rounded-2xl"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
        active ? "text-slate-900" : "text-slate-400 hover:text-slate-700",
        isCollapsed && "px-3 justify-center"
      )}>
        <Icon size={18} className={cn("transition-colors shrink-0", active ? "text-brand-gold" : "text-slate-300 group-hover:text-slate-500")} />
        
        {!isCollapsed && (
          <>
            <span className="text-sm font-black tracking-tight flex-1 animate-in fade-in duration-300">{label}</span>
            {badge && (
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-brand-gold text-white uppercase tracking-tighter shadow-sm">
                {badge}
              </span>
            )}
            {active && <ChevronRight size={14} className="text-brand-gold/40" />}
          </>
        )}
      </div>
    </Link>
  );
}
