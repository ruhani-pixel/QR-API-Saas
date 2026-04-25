'use client';

import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { RecentMessages } from '@/components/dashboard/RecentMessages';
import { MessageFlow } from '@/components/dashboard/MessageFlow';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/hooks/useAuth';
import { 
  MessageSquare, Send, AlertTriangle, 
  Users, Zap, ShieldCheck, 
  BarChart3, Activity, Globe,
  ArrowUpRight, Clock
} from 'lucide-react';
import { ExportButton } from '@/components/ui/ExportButton';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { dailyStats, totalStats } = useDashboardStats(user?.uid);

  const d = {
    inbound: dailyStats.totalInbound || 0,
    outbound: dailyStats.totalOutbound || 0,
    failed: dailyStats.failedMessages || 0
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-[1600px] mx-auto px-6 lg:px-12 pb-24 selection:bg-brand-gold/20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
             <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800 shadow-xl shadow-slate-900/10 group cursor-default">
                <Globe size={12} className="text-brand-gold animate-spin-slow" />
                <span className="text-brand-gold font-black text-[9px] uppercase tracking-[0.25em]">Global Control Hub</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600 font-black text-[9px] uppercase tracking-widest">Engine Live</span>
             </div>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none">
            Infrastructure <span className="text-brand-gold">Dashboard</span>
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] leading-none opacity-60">Real-time Node Performance & Metrics</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden lg:flex items-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="text-right">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Network Latency</p>
                 <p className="text-sm font-black text-slate-900 tracking-tighter">14ms <span className="text-emerald-500">OPTIMAL</span></p>
              </div>
              <Activity className="text-brand-gold" size={24} />
           </div>
           <ExportButton data={[totalStats]} filename="global_infrastructure_report" />
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Consolidated Traffic" 
          value={d.inbound + d.outbound} 
          icon={MessageSquare}
          description="Total packet exchange"
          trend="up"
        />
        <StatCard 
          title="Inbound Flow" 
          value={d.inbound} 
          icon={Users}
          description="Total received signals"
        />
        <StatCard 
          title="Outbound Pipeline" 
          value={d.outbound} 
          icon={Send}
          description="Signals transmitted"
        />
        <StatCard 
          title="Infrastructure Health" 
          value={d.failed} 
          icon={AlertTriangle}
          description="Packet loss detection"
        />
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Primary Viewport */}
        <div className="xl:col-span-8 space-y-10">
          <div className="relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-brand-gold/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
             <ActivityChart ownerId={user?.uid} />
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                  <Clock size={20} className="text-brand-gold" /> Activity Archive
               </h3>
               <button className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all">View Extended Logs</button>
            </div>
            <RecentMessages ownerId={user?.uid} />
          </div>
        </div>
        
        {/* Secondary Viewport */}
        <div className="xl:col-span-4 space-y-10">
          
          {/* Real-time Traffic */}
          <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8">
               <div className="flex items-center gap-2 px-3 py-1 bg-brand-gold/10 rounded-full border border-brand-gold/10">
                  <div className="w-1 h-1 rounded-full bg-brand-gold animate-ping" />
                  <span className="text-[8px] font-black text-brand-gold uppercase tracking-[0.2em]">Live Stream</span>
               </div>
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-8 uppercase tracking-[0.25em]">Network Flow Monitor</h3>
            <MessageFlow ownerId={user?.uid} />
          </div>

          {/* Aggregate Intelligence */}
          <div className="p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden group min-h-[400px] flex flex-col justify-between">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-gold/20 rounded-full blur-[100px] group-hover:scale-150 transition-all duration-1000" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] group-hover:scale-150 transition-all duration-1000 delay-300" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                 <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-brand-gold shadow-2xl">
                    <BarChart3 size={28} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">System Aggregate</h3>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1 italic">Consolidated Node Metrics</p>
                 </div>
              </div>

              <div className="space-y-8">
                <div className="group/item">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white/40 font-black uppercase tracking-[0.2em] text-[9px] group-hover/item:text-brand-gold transition-colors">Cumulative Inbound</span>
                    <div className="flex items-center gap-2">
                       <ArrowUpRight size={14} className="text-emerald-500" />
                       <span className="text-brand-gold font-black font-mono text-2xl tracking-tighter">{totalStats.totalInbound.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 w-[78%] group-hover/item:w-[85%] transition-all duration-1000" />
                  </div>
                </div>

                <div className="group/item">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white/40 font-black uppercase tracking-[0.2em] text-[9px] group-hover/item:text-brand-gold transition-colors">Cumulative Outbound</span>
                    <div className="flex items-center gap-2">
                       <ArrowUpRight size={14} className="text-blue-500" />
                       <span className="text-brand-gold font-black font-mono text-2xl tracking-tighter">{totalStats.totalOutbound.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-[64%] group-hover/item:w-[72%] transition-all duration-1000" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-10 border-t border-white/5">
               <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Cluster Efficiency</p>
                    <p className="text-4xl font-black text-white tracking-tighter">99.9<span className="text-brand-gold text-lg">%</span></p>
                  </div>
                  <div className="bg-brand-gold text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-gold/20">
                     OPTIMIZED
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
