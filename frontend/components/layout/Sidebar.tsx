'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Bot, Zap,
  Settings, BarChart2,
  LogOut, ChevronRight, Building2,
  Bell, HelpCircle
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

export function Sidebar({ isCollapsed }: any) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const mainLinks = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/devices', label: 'Devices', icon: Building2 },
    { href: '/inbox', label: 'Messages', icon: Inbox, badge: 'Live' },
  ];

  const managementLinks = [
    { href: '/ai-config', label: 'AI Setup', icon: Bot },
    { href: '/bulk', label: 'Bulk Sender', icon: Zap },
    { href: '/analytics', label: 'Statistics', icon: BarChart2 },
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
      "bg-white border-r border-slate-100 flex flex-col h-screen z-50 flex-shrink-0 transition-all duration-500 ease-in-out relative",
      "w-60"
    )}>
      {/* Brand Header */}
      <div className="px-6 py-8 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-[#FF7E5F] to-[#FF5F38] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
           <Zap size={20} className="text-white fill-current" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black text-slate-900 tracking-tighter leading-none">SKILL<span className="text-[#FF5F38]">DIZER</span></span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto no-scrollbar pt-4">
        {/* Main Section */}
        <div className="space-y-1">
          {mainLinks.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
        </div>

        {/* Management Section */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Management</p>
          {managementLinks.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
        </div>
      </nav>

      {/* Bottom Panel */}
      <div className="p-4 space-y-2 mt-auto">
        <Link href="/support" className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-slate-600 transition-colors">
           <HelpCircle size={18} />
           <span className="text-xs font-bold">Support</span>
        </Link>
        <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
            <span className="text-[10px] font-black text-[#FF5F38]">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-900 truncate">Admin User</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Pro Plan</p>
          </div>
          <button onClick={handleSignOut} className="text-slate-300 hover:text-rose-500 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ href, label, icon: Icon, badge, active }: any) {
  return (
    <Link href={href} className="block relative group selection:bg-transparent">
      <div className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
        active 
          ? "bg-orange-50 text-[#FF5F38]" 
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
      )}>
        <Icon size={18} className={cn("transition-colors", active ? "text-[#FF5F38]" : "text-slate-300 group-hover:text-slate-400")} />
        <span className="text-[13px] font-bold tracking-tight flex-1">{label}</span>
        {badge && (
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#FF5F38] text-white uppercase tracking-tighter shadow-md">
            {badge}
          </span>
        )}
        {active && <ChevronRight size={14} className="text-[#FF5F38]/40" />}
      </div>
    </Link>
  );
}
