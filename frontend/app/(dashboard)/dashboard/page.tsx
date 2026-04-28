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
  ArrowUpRight, Clock, Calendar, MoreHorizontal, ChevronRight, ChevronDown
} from 'lucide-react';
import { ExportButton } from '@/components/ui/ExportButton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  const { dailyStats, totalStats } = useDashboardStats(user?.uid);

  const d = {
    inbound: dailyStats.totalInbound || 0,
    outbound: dailyStats.totalOutbound || 0,
    failed: dailyStats.failedMessages || 0
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 max-w-[1600px] mx-auto px-8 pb-12">
      
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            Welcome back, <span className="text-[#FF5F38]">{user?.displayName?.split(' ')[0] || 'Admin'}</span> 👋
          </h1>
          <p className="text-slate-400 font-bold text-sm tracking-tight">Monitor your WhatsApp infrastructure and communication flow.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm">
                   <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-4 border-white bg-orange-50 flex items-center justify-center text-[10px] font-black text-[#FF5F38] shadow-sm">
                 198+
              </div>
           </div>
           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Online Now</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={d.inbound + d.outbound} 
          icon={Users}
          description="Consolidated traffic"
          trend="up"
        />
        <StatCard 
          title="Active Tutors" 
          value={d.inbound} 
          icon={MessageSquare}
          description="Inbound signals"
        />
        <StatCard 
          title="Courses Sent" 
          value={d.outbound} 
          icon={Send}
          description="Outbound signals"
        />
        <StatCard 
          title="System Health" 
          value="99.9" 
          icon={Zap}
          description="Infrastructure status"
        />
      </div>

      {/* Analytics Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Main Chart Area */}
        <div className="xl:col-span-8 space-y-8">
          <div className="premium-card p-8 bg-white border-none shadow-[0_8px_40px_rgba(0,0,0,0.02)]">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Average Sales</h3>
                   <p className="text-xs font-bold text-slate-400">Total revenue generated per node</p>
                </div>
                <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:ring-2 ring-orange-100 outline-none">
                   <option>Overall</option>
                   <option>Weekly</option>
                   <option>Monthly</option>
                </select>
             </div>
             <ActivityChart ownerId={user?.uid} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="premium-card p-6 bg-white border-none shadow-[0_8px_40px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-black text-slate-900 tracking-tight">Today's Transactions</h3>
                   <button className="text-[10px] font-black text-[#FF5F38] uppercase tracking-widest hover:underline">View All</button>
                </div>
                <RecentMessages ownerId={user?.uid} limit={3} />
             </div>
             <div className="premium-card p-6 bg-white border-none shadow-[0_8px_40px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-black text-slate-900 tracking-tight">Top Performing Node</h3>
                   <MoreHorizontal size={20} className="text-slate-300" />
                </div>
                <div className="space-y-4">
                   {[
                     { name: 'Joshua Ashiru', points: '9.6/10', color: 'bg-yellow-400' },
                     { name: 'Adeola Ayo', points: '9.1/10', color: 'bg-slate-400' },
                     { name: 'Olawuyi Tobi', points: '8.5/10', color: 'bg-orange-400' }
                   ].map((item, idx) => (
                     <div key={idx} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs", item.color)}>
                           {item.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                           <p className="text-sm font-black text-slate-900 leading-none mb-1 group-hover:text-[#FF5F38] transition-colors">{item.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.points} Points</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-100 group-hover:text-[#FF5F38] transition-all">
                           <ArrowUpRight size={14} />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
        
        {/* Sidebar Widgets Area */}
        <div className="xl:col-span-4 space-y-8">
           {/* Calendar Widget Mockup */}
           <div className="premium-card p-8 bg-white border-none shadow-[0_8px_40px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-black text-slate-900 tracking-tight">My Progress</h3>
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
                    FEB 2023 <ChevronDown size={12} />
                 </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center mb-4">
                 {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                   <span key={d} className="text-[10px] font-black text-slate-300 uppercase">{d}</span>
                 ))}
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                 {Array.from({length: 31}).map((_, i) => (
                   <div key={i} className={cn(
                     "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer",
                     i + 1 === 10 ? "bg-blue-500 text-white shadow-lg shadow-blue-200" :
                     i + 1 === 13 ? "bg-[#FF5F38] text-white shadow-lg shadow-orange-200" :
                     i + 1 === 18 ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" :
                     "text-slate-600 hover:bg-slate-50"
                   )}>
                      {i + 1}
                   </div>
                 ))}
              </div>
           </div>

           {/* Upcoming Activities Widget */}
           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-lg font-black text-slate-900 tracking-tight">Upcoming Activities</h3>
                 <button className="text-[10px] font-black text-[#FF5F38] uppercase tracking-widest hover:underline">See All</button>
              </div>
              <div className="space-y-4">
                 {[
                   { title: 'Islamic Studies Tutorial', time: '8th - 10th Mar 2023', color: 'bg-blue-500' },
                   { title: 'Social Insurance Test', time: '13th Mar 2023', color: 'bg-rose-500' }
                 ].map((act, idx) => (
                   <div key={idx} className="premium-card p-5 flex items-center gap-5 group cursor-pointer hover:-translate-y-1 transition-all">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg", act.color)}>
                         <Calendar size={20} />
                      </div>
                      <div className="flex-1">
                         <h4 className="text-sm font-black text-slate-900 leading-tight mb-1 group-hover:text-[#FF5F38] transition-colors">{act.title}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{act.time}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-200 group-hover:text-[#FF5F38] transition-colors" />
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}


