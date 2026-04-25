'use client';

import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { RecentMessages } from '@/components/dashboard/RecentMessages';
import { MessageFlow } from '@/components/dashboard/MessageFlow';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Send, AlertTriangle, Users } from 'lucide-react';
import { ExportButton } from '@/components/ui/ExportButton';

export default function DashboardPage() {
  const { user } = useAuth();
  const { dailyStats, totalStats } = useDashboardStats(user?.uid);

  const d = {
    inbound: dailyStats.totalInbound || 0,
    outbound: dailyStats.totalOutbound || 0,
    failed: dailyStats.failedMessages || 0
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-1 uppercase">Control Center</h1>
          <div className="flex items-center gap-3">
             <p className="text-slate-500 font-medium text-[10px] uppercase tracking-widest opacity-70">WhatsApp Management Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={[totalStats]} filename="dashboard_overview_stats" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Messages Today" 
          value={d.inbound + d.outbound} 
          icon={MessageSquare}
          description="Combined traffic"
        />
        <StatCard 
          title="Total Inbound Today" 
          value={d.inbound} 
          icon={Users}
          description="Messages from users"
        />
        <StatCard 
          title="Total Outbound Today" 
          value={d.outbound} 
          icon={Send}
          description="Replies from agents/AI"
        />
        <StatCard 
          title="Failed Messages Today" 
          value={d.failed} 
          icon={AlertTriangle}
          description="System error logs"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ActivityChart ownerId={user?.uid} />
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter">Recent Conversations</h3>
            <RecentMessages ownerId={user?.uid} />
          </div>
        </div>
        
        <div className="space-y-8">
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Real-time Traffic</h3>
            <MessageFlow ownerId={user?.uid} />
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Aggregate Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Total Inbound</span>
                <span className="text-slate-900 font-black font-mono">{totalStats.totalInbound.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Total Outbound</span>
                <span className="text-slate-900 font-black font-mono">{totalStats.totalOutbound.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
