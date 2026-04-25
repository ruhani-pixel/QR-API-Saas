'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Building2, 
  RefreshCw, Trash2, 
  X, QrCode, MonitorSmartphone,
  ShieldCheck, Info,
  AlertCircle, Loader2
} from 'lucide-react';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);

  useEffect(() => {
    fetchDevices();
    const socket = io(API_URL);
    
    socket.on('device:status', ({ sessionId, status }) => {
      setDevices(prev => prev.map(d => d.sessionId === sessionId ? { ...d, status } : d));
    });

    return () => { socket.disconnect(); };
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions`);
      const data = await res.json();
      setDevices(data);
    } catch (e) {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = () => {
    setDeviceName(`Node-${devices.length + 1}`);
    setShowQR(true);
    setQrCode(null);
    setIsGenerating(false);
  };

  const generateQR = async () => {
    if (!deviceName) return toast.error('Please name your instance');
    setIsGenerating(true);
    const sessionId = `sid_${Date.now()}`;
    setActiveSessionId(sessionId);

    try {
      const res = await fetch(`${API_URL}/api/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name: deviceName })
      });
      
      const socket = io(API_URL);
      socket.on(`qr:${sessionId}`, ({ qr }) => {
        setQrCode(qr);
        setIsGenerating(false);
      });

      socket.on('device:status', ({ sessionId: sid, status }) => {
        if (sid === sessionId && status === 'online') {
          setShowQR(false);
          fetchDevices();
          toast.success('WhatsApp Linked Successfully! ✅');
          socket.disconnect();
        }
      });

    } catch (e) {
      toast.error('Failed to start session');
      setIsGenerating(false);
    }
  };

  const deleteDevice = async (sessionId) => {
    if (!confirm('Are you sure? This will disconnect the WhatsApp session.')) return;
    try {
      await fetch(`${API_URL}/api/session/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      setDevices(prev => prev.filter(d => d.sessionId !== sessionId));
      toast.success('Session deleted');
    } catch (e) {
      toast.error('Delete failed');
    }
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
          { label: 'Total Capacity', value: devices.length, icon: MonitorSmartphone, color: 'bg-slate-900' },
          { label: 'Online Nodes', value: devices.filter(d => d.status === 'online').length, icon: ShieldCheck, color: 'bg-emerald-500' },
          { label: 'Avg Latency', value: '14ms', icon: RefreshCw, color: 'bg-brand-gold' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm group hover:shadow-xl transition-all duration-500">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-widest animate-pulse">Syncing Node Database...</div>
        ) : devices.map((device, i) => (
          <motion.div
            key={device.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-700 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8">
               <div className={cn(
                 "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                 device.status === 'online' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-500 border-rose-100"
               )}>
                 {device.status}
               </div>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:rotate-12",
                  device.status === 'online' ? "bg-slate-900 text-brand-gold shadow-slate-900/20" : "bg-slate-50 text-slate-300"
                )}>
                  <Building2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter">{device.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{device.sessionId}</p>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-slate-50 pt-6">
                <div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Messages Processed</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">0</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setShowQR(true); setActiveSessionId(device.sessionId); setQrCode(null); }}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-brand-gold hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all shadow-sm active:scale-90"
                  >
                    <QrCode size={18} />
                  </button>
                  <button 
                    onClick={() => deleteDevice(device.sessionId)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all shadow-sm active:scale-90"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

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
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Instance Label</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Node-01 SIM-1"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-gold/30 transition-all shadow-sm"
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                      />
                   </div>

                   <button 
                    onClick={generateQR}
                    disabled={isGenerating}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                     {isGenerating ? <Loader2 size={18} className="animate-spin text-brand-gold" /> : <QrCode size={18} className="text-brand-gold" />}
                     Generate QR
                   </button>
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 min-h-[250px]">
                   {qrCode ? (
                     <div className="p-4 bg-white rounded-2xl shadow-xl">
                        <QRCode value={qrCode} size={180} />
                     </div>
                   ) : isGenerating ? (
                      <div className="flex flex-col items-center gap-4">
                         <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-gold rounded-full animate-spin" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waiting for QR...</p>
                      </div>
                   ) : (
                     <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-200">
                           <QrCode size={32} />
                        </div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Click button to generate</p>
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
