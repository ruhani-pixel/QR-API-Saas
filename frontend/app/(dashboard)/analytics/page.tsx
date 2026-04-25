'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDailyTrend } from '@/hooks/useDailyTrend';
import { useAuth } from '@/hooks/useAuth';
import { ExportButton } from '@/components/ui/ExportButton';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { totalStats } = useDashboardStats(user?.uid);
  const { data: trendData, loading: trendLoading } = useDailyTrend(user?.uid, 7);

  const currentStats = { 
    in: totalStats.totalInbound || 0, 
    out: totalStats.totalOutbound || 0, 
    fail: totalStats.failedMessages || 0 
  };

  const distributionData = [
    { name: 'Delivered', value: Math.max((currentStats.in + currentStats.out) - (currentStats.fail || 0), 1) },
    { name: 'Failed', value: currentStats.fail || 0 },
  ];

  const DIST_COLORS = ['#10b981', '#ef4444'];

  const successRate = currentStats.in + currentStats.out > 0
    ? (((currentStats.in + currentStats.out) - (currentStats.fail || 0)) / (currentStats.in + currentStats.out) * 100).toFixed(1)
    : '100';

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto px-6 lg:px-12 pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Analytics</h1>
           <div className="flex items-center gap-3 mt-1">
             <div className="flex items-center gap-2 px-3 py-1 bg-brand-gold/10 rounded-full border border-brand-gold/20">
                <Activity size={12} className="text-brand-gold" />
                <span className="text-[9px] font-black text-brand-gold uppercase tracking-widest leading-none">Performance Hub</span>
             </div>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-none opacity-70">Infrastructure Intelligence</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           {trendData && trendData.length > 0 && <ExportButton data={trendData} filename="analytics_volume_trend" />}
           <div className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Real-time Sync</span>
           </div>
        </div>
      </div>

      {/* Top Pro Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Inbound Volume', value: currentStats.in.toLocaleString(), sub: 'Customer Traffic', color: 'text-emerald-500', icon: TrendingUp },
          { label: 'Outbound Flow', value: currentStats.out.toLocaleString(), sub: 'Agent Responses', color: 'text-blue-500', icon: BarChart3 },
          { label: 'Success Quality', value: `${successRate}%`, sub: 'Service Reliability', color: 'text-brand-gold', icon: Activity },
        ].map((stat, i) => (
          <Card key={i} className="bg-white border-slate-100 shadow-xl rounded-[2.5rem] p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
             <CardContent className="p-0 flex items-center gap-6">
                <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg", i === 0 ? "bg-emerald-500 shadow-emerald-500/20" : i === 1 ? "bg-blue-500 shadow-blue-500/20" : "bg-brand-gold shadow-brand-gold/20")}>
                   <stat.icon size={32} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</span>
                   <div className={cn("text-4xl font-black tracking-tighter leading-none mb-1", stat.color)}>{stat.value}</div>
                   <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{stat.sub}</span>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Bar Chart Overhaul */}
      <Card className="bg-white border-slate-100 shadow-2xl rounded-[3rem] overflow-hidden">
        <CardHeader className="px-10 py-10 border-b border-slate-50">
           <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">Infrastructure Load</CardTitle>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mt-1 italic">
                  Daily WhatsApp message distribution (7 Days)
                </p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" /><span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Inbound</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20" /><span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Outbound</span></div>
              </div>
           </div>
        </CardHeader>
        <CardContent className="px-10 pb-10 pt-6 h-[450px]">
          {trendLoading ? (
             <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barGap={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 800, fill: '#64748b' }} dy={10} />
                <YAxis stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 800, fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.98)', border: '1px solid #f1f5f9', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '20px' }}
                />
                <Bar 
                  dataKey="inbound" 
                  fill="#10b981" radius={[8, 8, 0, 0]} barSize={32} 
                />
                <Bar 
                  dataKey="outbound" 
                  fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={32} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Grid for Pie and Trend Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <Card className="bg-white border-slate-100 shadow-xl rounded-[3rem] overflow-hidden">
            <CardHeader className="px-10 py-8 border-b border-slate-50 flex flex-row items-center justify-between">
               <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                  <PieChartIcon size={18} className="text-brand-gold" /> Service Distribution
               </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%" cy="50%" innerRadius={100} outerRadius={135} paddingAngle={12}
                      dataKey="value" stroke="none"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DIST_COLORS[index % DIST_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{successRate}%</span>
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mt-1">Operational</span>
               </div>
            </CardContent>
         </Card>

         <Card className="bg-white border-slate-100 shadow-xl rounded-[3rem] overflow-hidden">
            <CardHeader className="px-10 py-8 border-b border-slate-50 flex flex-row items-center justify-between">
               <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                  <Activity size={18} className="text-brand-gold" /> Engagement Trend
               </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] p-10">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 800, fill: '#64748b' }} dy={10} />
                    <YAxis stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 800, fill: '#64748b' }} dx={-10} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: 'rgba(255,255,255,0.98)', border: '1px solid #f1f5f9', borderRadius: '24px', padding: '20px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="inbound" 
                      stroke="#8b5cf6" 
                      strokeWidth={4} 
                      dot={{ fill: '#8b5cf6', strokeWidth: 3, r: 6, stroke: '#fff' }} 
                      activeDot={{ r: 9, strokeWidth: 3, stroke: '#fff' }}
                    />
                  </LineChart>
               </ResponsiveContainer>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
