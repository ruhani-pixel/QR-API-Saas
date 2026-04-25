'use client';
import { motion } from 'framer-motion';
import { 
  Building2, CheckCircle2, XCircle, 
  Send, Users, Zap, 
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { label: 'Total Devices', value: '47', sub: '+3 this week', icon: Building2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Online Now', value: '42', sub: '92% uptime', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Offline', value: '5', sub: 'Requires action', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label: 'Msgs Sent Today', value: '1,247', sub: '+12% from yesterday', icon: Send, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-white tracking-tighter">
          COMMAND <span className="text-premium-gold">CENTER</span>
        </h1>
        <p className="text-slate-500 font-medium">Monitoring your 50+ WhatsApp nodes in real-time.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 group hover:border-slate-700/50 transition-all duration-500"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                <ArrowUpRight size={12} />
                LIVE
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</h3>
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-xs font-medium text-slate-600">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Device Status Grid */}
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-white">Live Status Feed</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Device Nodes M01 - M50</p>
            </div>
            <button className="text-xs font-bold text-amber-500 hover:text-amber-400 underline underline-offset-4">Refresh All</button>
          </div>
          
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.1 }}
                className={`h-10 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-1 bg-slate-900/50 relative group cursor-help`}
              >
                <span className="text-[8px] font-black text-slate-500">M{String(i + 1).padStart(2, '0')}</span>
                <div className={`w-2 h-2 rounded-full ${i % 12 === 0 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`} />
                
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap">
                  Node M{String(i + 1).padStart(2, '0')}: {i % 12 === 0 ? 'Offline' : 'Online'}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">45 Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">5 Faulty</span>
            </div>
          </div>
        </div>

        {/* Active Campaign Card */}
        <div className="glass-card p-8 bg-gradient-to-br from-slate-900/50 to-amber-500/5 border-amber-500/10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Active Campaign</h2>
              <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Running via CronEngine</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-slate-400">Diwali Offer 2025</span>
                <span className="text-amber-500">47%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full premium-gradient" 
                  initial={{ width: 0 }}
                  animate={{ width: '47%' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/50 border border-slate-800/50 p-3 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Sent</p>
                <p className="text-xl font-black text-white">56/120</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/50 p-3 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Speed</p>
                <p className="text-xl font-black text-white">28s gap</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase">Safe Mode: Active</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-500/70">Anti-Ban Layer ON</span>
            </div>

            <button className="w-full glass-button p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-slate-800 transition-all">
              View History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
