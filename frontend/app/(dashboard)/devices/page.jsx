'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Building2, 
  RefreshCw, Trash2, 
  X, QrCode, MonitorSmartphone,
  ShieldCheck, Info,
  AlertCircle
} from 'lucide-react';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';

export default function DevicesPage() {
  const [devices, setDevices] = useState([
    { id: '1', name: 'Mobile-01 SIM-1', number: '+91-98765-12345', status: 'online', msgsToday: 47 },
    { id: '2', name: 'Mobile-01 SIM-2', number: '+91-98765-67890', status: 'online', msgsToday: 23 },
    { id: '3', name: 'Mobile-02 SIM-1', number: '+91-88888-11111', status: 'offline', lastSeen: '2h ago', msgsToday: 0 },
  ]);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock Socket Connection
  useEffect(() => {
    const socket = io('http://localhost:3001');
    socket.on('device:status', ({ sessionId, status }) => {
      setDevices(prev => prev.map(d => d.id === sessionId ? { ...d, status } : d));
    });
    return () => { socket.disconnect(); };
  }, []);

  const handleAddDevice = () => {
    setIsGenerating(true);
    setShowQR(true);
    setTimeout(() => {
      setQrCode('MOCK_QR_DATA');
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto px-6 lg:px-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">
            Device <span className="text-brand-gold">Nodes</span>
          </h1>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Active Clusters</span>
             </div>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-none opacity-70">Infrastructure Management</p>
          </div>
        </div>
        <button 
          onClick={handleAddDevice}
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-900/10 group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-brand-gold/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus size={20} className="text-brand-gold relative z-10" />
          <span className="text-[11px] font-black uppercase tracking-widest relative z-10">Provision New Node</span>
        </button>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Total Instances', value: '47', sub: 'Linked Numbers', color: 'text-slate-900' },
           { label: 'Active Sync', value: '42', sub: 'Nodes Online', color: 'text-emerald-500' },
           { label: 'Faulty Nodes', value: '05', sub: 'Requires Scan', color: 'text-rose-500' },
         ].map((s, i) => (
           <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col items-center text-center space-y-1">
              <span className={cn("text-4xl font-black tracking-tighter", s.color)}>{s.value}</span>
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{s.label}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{s.sub}</span>
           </div>
         ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-gold transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search infrastructure by name or number..." 
            className="w-full bg-slate-50 border border-transparent rounded-[2rem] py-5 pl-14 pr-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-brand-gold/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
           {['All Nodes', 'Online', 'Offline'].map((f, i) => (
             <button key={i} className={cn(
               "px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
               i === 0 ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-slate-50 text-slate-400 hover:text-slate-600"
             )}>
               {f}
             </button>
           ))}
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {devices.map((device, i) => (
          <motion.div
            key={device.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col justify-between group relative overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
          >
            {/* Background Decorative */}
            <div className={cn(
              "absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-10 transition-all duration-700",
              device.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
            )} />

            <div className="relative">
              <div className="flex justify-between items-start mb-8">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110",
                  device.status === 'online' ? 'bg-slate-900 text-brand-gold shadow-slate-900/10' : 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none'
                )}>
                  <MonitorSmartphone size={28} />
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm",
                  device.status === 'online' ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                )}>
                  <div className={cn("w-2 h-2 rounded-full", device.status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", device.status === 'online' ? "text-emerald-600" : "text-rose-600")}>
                    {device.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1 mb-10">
                <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{device.name}</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-brand-gold" /> {device.number}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-end border-t border-slate-50 pt-6">
                <div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Messages Processed</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{device.msgsToday || 0}</p>
                </div>
                <div className="flex gap-3">
                  <button className="p-3 bg-slate-50 text-slate-400 hover:text-brand-gold hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all shadow-sm active:scale-90">
                    <RefreshCw size={18} />
                  </button>
                  <button className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all shadow-sm active:scale-90">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add Skeleton */}
        <button 
          onClick={handleAddDevice}
          className="border-2 border-dashed border-slate-100 bg-slate-50/30 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-6 text-slate-300 hover:border-brand-gold/30 hover:text-brand-gold hover:bg-white transition-all group shadow-sm hover:shadow-xl hover:shadow-slate-100 duration-500"
        >
          <div className="w-20 h-20 rounded-[2rem] border-2 border-dashed border-slate-200 group-hover:border-brand-gold/50 flex items-center justify-center transition-all duration-500 group-hover:rotate-12">
            <Plus size={32} />
          </div>
          <div className="text-center space-y-1">
             <span className="text-xs font-black uppercase tracking-widest block">Provision Node</span>
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Click to scan QR</span>
          </div>
        </button>
      </div>

      {/* QR MODAL */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQR(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] p-12 overflow-hidden shadow-2xl border border-slate-100"
            >
              {/* Decorative Blur */}
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-brand-gold/10 rounded-full blur-[100px]" />

              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Link <span className="text-brand-gold">Instance</span></h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1">Infrastructure Provisioning</p>
                </div>
                <button onClick={() => setShowQR(false)} className="p-3 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Info size={14} className="text-brand-gold" />
                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Instance Label</label>
                      </div>
                      <input 
                        type="text" 
                        placeholder="e.g. Node-01 SIM-1"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-brand-gold/30 focus:bg-white transition-all shadow-sm"
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                      />
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <AlertCircle size={14} className="text-brand-gold" />
                         <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Instructions</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                        {[
                          'Open WhatsApp on your mobile phone',
                          'Navigate to Linked Devices in Settings',
                          'Link a Device and point camera at the QR'
                        ].map((step, i) => (
                          <div key={i} className="flex gap-4 items-start">
                             <div className="w-5 h-5 rounded-lg bg-slate-900 text-brand-gold flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                             <p className="text-[11px] font-medium text-slate-600 leading-tight">{step}</p>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="aspect-square bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative overflow-hidden group shadow-xl shadow-slate-200/30">
                     {isGenerating ? (
                       <div className="flex flex-col items-center gap-4 text-slate-900 text-center">
                         <RefreshCw className="animate-spin text-brand-gold" size={40} />
                         <div className="space-y-1">
                            <span className="text-[11px] font-black uppercase tracking-widest">Syncing Nodes...</span>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Handshaking with WA Servers</p>
                         </div>
                       </div>
                     ) : qrCode ? (
                       <div className="w-full h-full flex flex-col items-center justify-center">
                         <QrCode size={240} className="text-slate-900" />
                         <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-widest">Live QR</div>
                       </div>
                     ) : (
                       <button className="flex flex-col items-center gap-4 text-slate-300 group-hover:text-brand-gold transition-colors">
                         <QrCode size={64} strokeWidth={1} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Click to Start Sync</span>
                       </button>
                     )}
                   </div>
                   <div className="flex items-center justify-center gap-4">
                      <div className="h-2 flex-1 bg-slate-50 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: "100%" }}
                           animate={{ width: "0%" }}
                           transition={{ duration: 60, ease: "linear" }}
                           className="h-full bg-brand-gold"
                         />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-right">0:59</span>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
