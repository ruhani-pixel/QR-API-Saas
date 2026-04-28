'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { RecentMessages } from '@/components/dashboard/RecentMessages';
import { useAuth } from '@/hooks/useAuth';
import { Smartphone, Wifi, WifiOff, Inbox, Send, AlertTriangle, Plus } from 'lucide-react';
import { API_URL } from '@/lib/apiConfig';

export default function DashboardPage() {
   const { user } = useAuth();
   const [devices, setDevices] = useState<any[]>([]);
   const [messageStats, setMessageStats] = useState({ inbound: 0, outbound: 0, failed: 0 });

   useEffect(() => {
      const load = async () => {
         try {
            const res = await fetch(`${API_URL}/api/sessions`);
            const data = await res.json();
            setDevices(Array.isArray(data) ? data : []);
         } catch {
            setDevices([]);
         }

         // Optional stats endpoint support (if backend exposes it).
         try {
            const res = await fetch(`${API_URL}/api/stats/dashboard`);
            if (!res.ok) return;
            const data = await res.json();
            setMessageStats({
               inbound: Number(data?.inbound || 0),
               outbound: Number(data?.outbound || 0),
               failed: Number(data?.failed || 0),
            });
         } catch {
            // keep safe zero defaults
         }
      };

      load();
   }, []);

   const onlineDevices = devices.filter((d) => d.status === 'online').length;
   const offlineDevices = Math.max(devices.length - onlineDevices, 0);

   const d = {
      inbound: messageStats.inbound,
      outbound: messageStats.outbound,
      failed: messageStats.failed,
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto px-8 pb-12">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">SaaS Operations Dashboard</h1>
               <p className="text-slate-500 font-semibold text-sm">Only real WhatsApp SaaS metrics and daily operations.</p>
            </div>
            <div className="flex items-center gap-3">
               <Link href="/devices" className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2">
                  <Plus size={14} /> Add Device
               </Link>
               <Link href="/inbox" className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  Open Inbox
               </Link>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Devices" value={devices.length} icon={Smartphone} description="Connected sessions" />
            <StatCard title="Online Devices" value={onlineDevices} icon={Wifi} description="Live sessions" />
            <StatCard title="Offline Devices" value={offlineDevices} icon={WifiOff} description="Needs attention" />
            <StatCard title="Failed Messages" value={d.failed} icon={AlertTriangle} description="Delivery failures" />
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <StatCard title="Today Inbound" value={d.inbound} icon={Inbox} description="Incoming messages" />
                  <StatCard title="Today Outbound" value={d.outbound} icon={Send} description="Sent messages" />
               </div>

               <ActivityChart ownerId={user?.uid} />

               <div className="premium-card p-6 bg-white border-none shadow-[0_8px_40px_rgba(0,0,0,0.02)]">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4">Recent Real Messages</h3>
                  <RecentMessages ownerId={user?.uid} />
               </div>
            </div>

            <div className="xl:col-span-4 space-y-8">
               <div className="premium-card p-6 bg-white border-none shadow-[0_8px_40px_rgba(0,0,0,0.02)]">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4">Device Session Status</h3>
                  {devices.length === 0 ? (
                     <p className="text-sm text-slate-500">No connected sessions yet.</p>
                  ) : (
                     <div className="space-y-3 max-h-[420px] overflow-auto">
                        {devices.map((d) => (
                           <div key={d.sessionId} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                              <div>
                                 <p className="text-sm font-bold text-slate-800">{d.name || d.sessionId}</p>
                                 <p className="text-xs text-slate-400">{d.sessionId}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${d.status === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                 {d.status || 'unknown'}
                              </span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}


