'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Building2, 
  RefreshCw, Trash2, 
  X, QrCode, MonitorSmartphone,
  ShieldCheck, Info,
  AlertCircle, Loader2,
  Download, ChevronRight, CheckCircle2,
  Sparkles, Smartphone, Laptop, Zap,
  Link2, Link2Off, LogOut, AlertTriangle
} from 'lucide-react';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState('name'); // 'name', 'qr', 'success'
  const [qrCode, setQrCode] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [deviceName, setDeviceName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Confirmation state
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'unlink' | 'delete', id: string, name: string }
  
  const socketRef = useRef(null);
  const activeSessionIdRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    fetchDevices();
    
    const socket = io(API_URL, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('qr', (data) => {
      const incomingSid = String(data?.sessionId || '').toLowerCase();
      const currentSid = String(activeSessionIdRef.current || '').toLowerCase();
      if (incomingSid === currentSid) {
        setQrCode(data?.qr);
        setIsGenerating(false);
        setCountdown(60);
        
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              setQrCode(null);
              setIsGenerating(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    });

    socket.on('device:status', ({ sessionId, status }) => {
      const incomingSid = String(sessionId || '').toLowerCase();
      const currentSid = String(activeSessionIdRef.current || '').toLowerCase();
      console.log(`[SOCKET] Status: ${status}, Incoming SID: ${incomingSid}, Active SID: ${currentSid}`);
      
      setDevices(prev => prev.map(d => String(d.sessionId).toLowerCase() === incomingSid ? { ...d, status } : d));
      
      if (status === 'online' && incomingSid === currentSid) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setModalStep('success');
        fetchDevices();
      }
    });

    return () => { 
      socket.disconnect(); 
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

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

  const handleStartProvisioning = () => {
    const newId = `sid_${Math.floor(Math.random() * 1000000)}`;
    setActiveSessionId(newId);
    activeSessionIdRef.current = newId;
    setDeviceName('');
    setQrCode(null);
    setCountdown(60);
    setModalStep('name');
    setShowModal(true);
  };

  const generateQR = async () => {
    if (!deviceName) return toast.error('Please name your node');
    setModalStep('qr');
    setIsGenerating(true);
    setQrCode(null);
    setCountdown(60);

    try {
      await fetch(`${API_URL}/api/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionIdRef.current, name: deviceName })
      });
    } catch (e) {
      toast.error('Connection error');
      setIsGenerating(false);
    }
  };

  const handleReLink = (device) => {
    setActiveSessionId(device.sessionId);
    activeSessionIdRef.current = device.sessionId;
    setDeviceName(device.name);
    
    if (device.status === 'online') {
      setModalStep('success');
      setShowModal(true);
      return;
    }

    setQrCode(null);
    setCountdown(60);
    setModalStep('qr');
    setShowModal(true);
    generateQR();
  };

  const handleUnlink = async () => {
    if (!confirmAction?.id) return;
    try {
      await fetch(`${API_URL}/api/session/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: confirmAction.id })
      });
      setDevices(prev => prev.map(d => d.sessionId === confirmAction.id ? { ...d, status: 'offline' } : d));
      toast.success('Device Unlinked Successfully');
      setConfirmAction(null);
    } catch (e) {
      toast.error('Failed to unlink');
    }
  };

  const handleDelete = async () => {
    if (!confirmAction?.id) return;
    try {
      await fetch(`${API_URL}/api/session/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: confirmAction.id })
      });
      setDevices(prev => prev.filter(d => d.sessionId !== confirmAction.id));
      toast.success('Node Deleted Permanently');
      setConfirmAction(null);
    } catch (e) {
      toast.error('Failed to delete node');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 max-w-[1600px] mx-auto px-8 pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            Infrastructure <span className="text-[#FF5F38]">Nodes</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm tracking-tight">Manage and provision your WhatsApp communication nodes.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-50">
              <div className={cn("w-2 h-2 rounded-full", socketConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine {socketConnected ? 'Live' : 'Offline'}</span>
           </div>
           <button 
             onClick={handleStartProvisioning}
             className="accent-button flex items-center gap-3"
           >
             <Plus size={20} />
             <span>Provision New Node</span>
           </button>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array.from({length: 4}).map((_, i) => (
            <div key={i} className="premium-card h-48 bg-slate-50/50 animate-pulse border-none" />
          ))
        ) : devices.length === 0 ? (
          <div className="col-span-full py-24 text-center premium-card bg-white border-none">
             <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-6">
                <Smartphone size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">No active nodes</h3>
             <p className="text-slate-400 text-sm mb-8">Start by provisioning your first communication instance.</p>
             <button onClick={handleStartProvisioning} className="accent-button inline-flex items-center gap-2">
                <Plus size={18} /> Provision Now
             </button>
          </div>
        ) : devices.map((device, i) => (
          <motion.div
            key={device.sessionId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="premium-card p-6 bg-white border-none group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
               <div className={cn(
                 "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                 device.status === 'online' ? "bg-emerald-500" : "bg-slate-200"
               )}>
                 <Zap size={24} className={device.status === 'online' ? "fill-current" : ""} />
               </div>
               <div className="flex items-center gap-2">
                  {device.status === 'online' && (
                    <button 
                      onClick={() => setConfirmAction({ type: 'unlink', id: device.sessionId, name: device.name })} 
                      className="p-2.5 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" 
                      title="Unlink Device (Logout)"
                    >
                       <LogOut size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => setConfirmAction({ type: 'delete', id: device.sessionId, name: device.name })} 
                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" 
                    title="Delete Node Permanently"
                  >
                     <Trash2 size={18} />
                  </button>
               </div>
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1 group-hover:text-[#FF5F38] transition-colors">{device.name}</h3>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
               <div className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", device.status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {device.status === 'online' ? 'Live Link' : 'Pending Link'}
                  </span>
               </div>
               
               {device.status === 'online' ? (
                 <div className="flex items-center gap-1.5 text-emerald-500">
                    <ShieldCheck size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
                 </div>
               ) : (
                 <button 
                  onClick={() => handleReLink(device)}
                  className="flex items-center gap-1.5 text-[#FF5F38] hover:underline"
                 >
                   <Link2 size={14} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Link Now</span>
                 </button>
               )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Step-by-Step Provisioning Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              {/* Close Button */}
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors">
                <X size={24} />
              </button>

              <AnimatePresence mode="wait">
                {modalStep === 'name' && (
                  <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="text-center">
                       <div className="w-16 h-16 bg-orange-50 text-[#FF5F38] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                          <MonitorSmartphone size={32} />
                       </div>
                       <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Name your Node</h2>
                       <p className="text-slate-400 text-sm font-medium">Give your instance a unique label to identify it easily.</p>
                    </div>
                    
                    <div className="space-y-4">
                       <input 
                         autoFocus
                         value={deviceName}
                         onChange={e => setDeviceName(e.target.value)}
                         placeholder="e.g. Sales Team Alpha"
                         className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 ring-orange-100 outline-none transition-all"
                         onKeyPress={e => e.key === 'Enter' && generateQR()}
                       />
                       <button 
                         onClick={generateQR}
                         className="accent-button w-full flex items-center justify-center gap-2"
                       >
                         Generate Link <ChevronRight size={18} />
                       </button>
                    </div>
                  </motion.div>
                )}

                {modalStep === 'qr' && (
                  <motion.div key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="text-center">
                       <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Scan QR Code</h2>
                       <p className="text-slate-400 text-sm font-medium">Open WhatsApp on your phone and link this device.</p>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-slate-50 rounded-[2.5rem] p-10 min-h-[300px] border border-slate-100 relative group">
                       {qrCode ? (
                         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
                            <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-50">
                               <img 
                                 src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=200x200&bgcolor=ffffff&color=1e293b&margin=10`} 
                                 alt="QR"
                                 className="w-[200px] h-[200px] rounded-xl"
                               />
                            </div>
                            <div className={cn(
                              "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                              countdown < 10 ? "bg-rose-50 text-rose-500" : "bg-orange-50 text-[#FF5F38]"
                            )}>
                               <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", countdown < 10 ? "bg-rose-500" : "bg-[#FF5F38]")} />
                               Expires in {countdown}s
                            </div>
                         </motion.div>
                       ) : (
                         <div className="flex flex-col items-center gap-4">
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-12 h-12 text-[#FF5F38] animate-spin" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Provisioning Node...</p>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-12 h-12 text-rose-500" />
                                <p className="text-xs font-black text-rose-500 uppercase tracking-widest">QR Expired</p>
                                <button 
                                  onClick={generateQR} 
                                  className="accent-button mt-4 flex items-center gap-2"
                                >
                                   <RefreshCw size={16} /> Regenerate QR
                                </button>
                              </>
                            )}
                         </div>
                       )}
                    </div>
                    
                    <p className="text-[10px] text-slate-400 font-bold text-center px-8 leading-relaxed uppercase tracking-widest">
                       Instance ID: <span className="text-slate-900">{activeSessionId}</span>
                    </p>
                  </motion.div>
                )}

                {modalStep === 'success' && (
                  <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-8 py-4">
                    <div className="relative inline-block">
                       <motion.div 
                         initial={{ scale: 0 }} 
                         animate={{ scale: 1 }} 
                         transition={{ type: "spring", damping: 12, stiffness: 200 }}
                         className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200"
                       >
                          <CheckCircle2 size={48} />
                       </motion.div>
                       <motion.div 
                         animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }} 
                         transition={{ repeat: Infinity, duration: 2 }}
                         className="absolute -inset-4 border-4 border-emerald-500 rounded-full" 
                       />
                       <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-bounce" size={24} />
                    </div>

                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-slate-900 tracking-tight">Connected!</h2>
                       <p className="text-slate-400 text-sm font-medium">Your WhatsApp node <span className="text-[#FF5F38] font-bold">{deviceName}</span> is now active.</p>
                    </div>

                    <button 
                      onClick={() => setShowModal(false)}
                      className="accent-button w-full bg-slate-900 from-slate-900 to-slate-800 shadow-slate-900/20"
                    >
                      Go to Dashboard
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal (Dynamic for Unlink or Delete) */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmAction(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center">
               <div className={cn(
                 "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
                 confirmAction.type === 'delete' ? "bg-rose-50 text-rose-500" : "bg-orange-50 text-orange-500"
               )}>
                  {confirmAction.type === 'delete' ? <Trash2 size={32} /> : <LogOut size={32} />}
               </div>
               <h3 className="text-xl font-black text-slate-900 mb-2">
                 {confirmAction.type === 'delete' ? 'Delete Node?' : 'Unlink Device?'}
               </h3>
               <p className="text-slate-400 text-sm font-medium mb-8">
                 {confirmAction.type === 'delete' 
                   ? `This will permanently remove "${confirmAction.name}" and all its history from the platform.` 
                   : `This will log out the WhatsApp session for "${confirmAction.name}". The node will remain in your list.`}
               </p>
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmAction.type === 'delete' ? handleDelete : handleUnlink} 
                    className={cn(
                      "w-full py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95",
                      confirmAction.type === 'delete' ? "bg-rose-500 shadow-rose-200" : "bg-orange-500 shadow-orange-200"
                    )}
                  >
                     {confirmAction.type === 'delete' ? 'Yes, Delete Permanently' : 'Yes, Unlink Now'}
                  </button>
                  <button onClick={() => setConfirmAction(null)} className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-100">
                     Cancel
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
