'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Building2, 
  RefreshCw, Trash2, 
  X, QrCode, MonitorSmartphone,
  ShieldCheck, Info,
  AlertCircle, Loader2,
  Download
} from 'lucide-react';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
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
  const [selectedDevices, setSelectedDevices] = useState(new Set());
  const activeSessionIdRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const socketRef = useRef(null);

  useEffect(() => {
    fetchDevices();
    
    const socket = io(API_URL, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket Connected ✅');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket Disconnected ❌');
      setSocketConnected(false);
    });

    socket.on('qr', (data) => {
      console.log('GLOBAL QR EVENT:', data);
      const incomingSid = String(data?.sessionId || '').toLowerCase();
      const currentSid = String(activeSessionIdRef.current || '').toLowerCase();
      const qrString = data?.qr;
      
      console.log(`Comparing SIDs: Incoming [${incomingSid}] vs Current [${currentSid}]`);
      
      if (incomingSid === currentSid) {
        setQrCode(qrString);
        setIsGenerating(false);
        toast.success('QR Code Received!');
      }
    });

    socket.on('device:status', ({ sessionId, status }) => {
      setDevices(prev => prev.map(d => d.sessionId === sessionId ? { ...d, status } : d));
      if (status === 'online') {
        fetchDevices();
        setShowQR(false);
        toast.success('Device Connected Successfully! 🎉');
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  // Polling fallback - pulls from DB every 2 seconds
  useEffect(() => {
    let interval;
    if (showQR && !qrCode) {
      interval = setInterval(forceFetchQR, 2000);
    }
    return () => clearInterval(interval);
  }, [showQR, qrCode]);

  const forceFetchQR = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions`);
      const data = await res.json();
      const currentSid = String(activeSessionIdRef.current || '').toLowerCase();
      const current = data.find(d => String(d.sessionId).toLowerCase() === currentSid);
      if (current?.currentQR) {
        setQrCode(current.currentQR);
        setIsGenerating(false);
      }
    } catch (e) {
      console.error('Manual fetch failed', e);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions`);
      const data = await res.json();
      setDevices(data);
    } catch (e) {
      console.error('Fetch devices failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = () => {
    const newId = `sid_${Math.floor(Math.random() * 1000000)}`;
    setActiveSessionId(newId);
    activeSessionIdRef.current = newId;
    setDeviceName(`Node-${devices.length + 1}`);
    setShowQR(true);
    setQrCode(null);
    setIsGenerating(false);

    if (socketRef.current) {
      socketRef.current.off(`qr:${newId}`);
      socketRef.current.on(`qr:${newId}`, (data) => {
        const qr = typeof data === 'string' ? data : data?.qr;
        setQrCode(qr);
        setIsGenerating(false);
      });
    }
  };

  const generateQR = async () => {
    if (!deviceName) return toast.error('Please name your instance');
    setIsGenerating(true);
    setQrCode(null);

    try {
      const res = await fetch(`${API_URL}/api/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionIdRef.current, name: deviceName })
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Failed to start');
        setIsGenerating(false);
      }
    } catch (e) {
      toast.error('Network Error - Check if server is running');
      setIsGenerating(false);
    }
  };

  const deleteDevice = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await fetch(`${API_URL}/api/session/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      setDevices(prev => prev.filter(d => d.sessionId !== sessionId));
      setSelectedDevices(prev => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
      toast.success('Device Session Deleted');
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDevices.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedDevices.size} session(s)?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/session/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds: Array.from(selectedDevices) })
      });
      if (res.ok) {
        setDevices(prev => prev.filter(d => !selectedDevices.has(d.sessionId)));
        setSelectedDevices(new Set());
        toast.success(`Deleted ${selectedDevices.size} devices.`);
      } else {
        toast.error('Failed to perform bulk delete');
      }
    } catch (e) {
      toast.error('Network error during bulk delete');
    }
  };

  const toggleDeviceSelection = (sessionId) => {
    setSelectedDevices(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const toggleAllDevices = () => {
    if (selectedDevices.size === devices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(devices.map(d => d.sessionId)));
    }
  };


  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto px-6 lg:px-12 pb-24">
      {/* Status Bar */}
      <div className="flex items-center gap-2 justify-end">
         <div className={cn("w-2 h-2 rounded-full", socketConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
           Server Connection: {socketConnected ? 'ONLINE' : 'OFFLINE'}
         </span>
      </div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">
              Device <span className="text-brand-gold">Nodes</span>
            </h1>
            {devices.length > 0 && (
              <button
                onClick={toggleAllDevices}
                className="mt-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest border border-slate-200 px-3 py-1 rounded-lg bg-white"
              >
                {selectedDevices.size === devices.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-none opacity-70">Solid Models WhatsApp Infrastructure</p>
        </div>
        <div className="flex items-center gap-4">
          {selectedDevices.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-500 hover:text-white px-6 py-4 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <Trash2 size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">Delete ({selectedDevices.size})</span>
            </button>
          )}
          <button 
            onClick={handleAddDevice}
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-xl group"
          >
            <Plus size={20} className="text-brand-gold" />
            <span className="text-[11px] font-black uppercase tracking-widest">Provision New Node</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
             <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
             <p className="font-black uppercase tracking-widest text-slate-300">Syncing Matrix...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
             <Building2 className="w-12 h-12 text-slate-100 mx-auto mb-4" />
             <p className="font-black uppercase tracking-widest text-slate-300">No active nodes found.</p>
          </div>
        ) : devices.map((device, i) => (
          <motion.div
            key={device.id || device.sessionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "bg-white border rounded-[3rem] p-10 shadow-sm transition-all duration-700 group relative",
              selectedDevices.has(device.sessionId) ? "border-brand-gold ring-4 ring-brand-gold/10" : "border-slate-100 hover:shadow-2xl"
            )}
            onClick={() => toggleDeviceSelection(device.sessionId)}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-6 right-6">
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                selectedDevices.has(device.sessionId) ? "bg-brand-gold border-brand-gold text-white" : "border-slate-200 bg-slate-50"
              )}>
                {selectedDevices.has(device.sessionId) && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
              </div>
            </div>

            <div className="flex items-center gap-6 mb-8 mt-2">
              <div className={cn(
                "w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500",
                device.status === 'online' ? "bg-slate-900 text-brand-gold" : "bg-slate-50 text-slate-200"
              )}>
                <Building2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter">{device.name}</h3>
                <div className="flex items-center gap-2">
                   <div className={cn("w-1.5 h-1.5 rounded-full", device.status === 'online' ? "bg-emerald-500" : "bg-slate-300")} />
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{device.status}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => { setActiveSessionId(device.sessionId); activeSessionIdRef.current = device.sessionId; setDeviceName(device.name); setShowQR(true); setQrCode(device.currentQR || null); setIsGenerating(false); }}
                className="p-3 bg-slate-50 text-slate-400 hover:text-brand-gold hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all shadow-sm"
              >
                <QrCode size={18} />
              </button>
              <button 
                onClick={() => deleteDevice(device.sessionId)}
                className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all shadow-sm"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQR(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100 overflow-hidden">
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                   <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Link <span className="text-brand-gold">Instance</span></h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SID: {activeSessionId}</p>
                </div>
                <button onClick={() => setShowQR(false)} className="p-4 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all"><X size={24} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Name</label>
                      <input 
                        value={deviceName} 
                        onChange={e => setDeviceName(e.target.value)} 
                        placeholder="Enter Label..."
                        className="w-full bg-white border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:outline-none focus:border-brand-gold/30 transition-all shadow-sm" 
                      />
                    </div>
                    <button 
                      onClick={generateQR} 
                      disabled={isGenerating} 
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 size={18} className="animate-spin text-brand-gold" /> : <QrCode size={18} className="text-brand-gold" />}
                      Generate New QR
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                     <button 
                       onClick={forceFetchQR}
                       className="w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                     >
                        <RefreshCw size={14} /> Force Sync From Database
                     </button>
                     <p className="text-[9px] text-slate-300 font-bold uppercase text-center px-4 leading-relaxed">
                        If the QR doesn't show automatically, use the Force Sync button to pull directly from the server.
                     </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden min-h-[350px]">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(197,160,89,0.1)_0%,_transparent_70%)]" />
                   
                   {qrCode ? (
                     <div className="flex flex-col items-center gap-8 relative z-10 animate-in zoom-in duration-500">
                        <div className="p-6 bg-white rounded-[2rem] shadow-2xl shadow-brand-gold/10">
                           {/* ATOMIC FIX: Using direct image rendering from public API for 100% reliability */}
                           <img 
                             src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=200x200&bgcolor=ffffff&color=0f172a&margin=10`} 
                             alt="WhatsApp QR Code"
                             className="w-[200px] h-[200px] rounded-lg"
                           />
                        </div>
                        <div className="text-center space-y-2">
                           <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em]">Code Ready</p>
                           <p className="text-[8px] text-slate-500 font-mono break-all max-w-[180px] opacity-50 uppercase tracking-tighter">DATA: {qrCode.substring(0, 40)}...</p>
                        </div>
                     </div>
                   ) : isGenerating ? (
                      <div className="flex flex-col items-center gap-6 relative z-10">
                         <div className="w-16 h-16 border-4 border-white/5 border-t-brand-gold rounded-full animate-spin" />
                         <div className="text-center">
                            <p className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-1">Provisioning Node</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Requesting Neural Link...</p>
                         </div>
                      </div>
                   ) : (
                     <div className="flex flex-col items-center gap-4 relative z-10 opacity-20">
                        <QrCode size={64} className="text-white" />
                        <p className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Matrix Standby</p>
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
