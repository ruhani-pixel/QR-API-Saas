'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Building2, 
  MoreVertical, RefreshCw, Trash2, 
  X, QrCode, MonitorSmartphone
} from 'lucide-react';
import { io } from 'socket.io-client';

export default function DevicesPage() {
  const [devices, setDevices] = useState([
    { id: '1', name: 'Mobile-01 SIM-1', number: '+91-98765-12345', status: 'online', msgsToday: 47 },
    { id: '2', name: 'Mobile-01 SIM-2', number: '+91-98765-67890', status: 'online', msgsToday: 23 },
    { id: '3', name: 'Mobile-02 SIM-1', number: '+91-88888-11111', status: 'offline', lastSeen: '2h ago' },
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
    return () => socket.disconnect();
  }, []);

  const handleAddDevice = () => {
    setIsGenerating(true);
    setShowQR(true);
    // Real implementation would call /api/session/start
    setTimeout(() => {
      setQrCode('MOCK_QR_DATA');
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
            Device <span className="text-premium-gold">Nodes</span>
          </h1>
          <p className="text-slate-500 font-medium">Provision and manage your physical WhatsApp instances.</p>
        </div>
        <button 
          onClick={handleAddDevice}
          className="premium-gradient p-[1px] rounded-2xl group active:scale-95 transition-all shadow-xl shadow-amber-500/20"
        >
          <div className="bg-slate-950 px-6 py-3 rounded-2xl flex items-center gap-2 group-hover:bg-transparent transition-all">
            <Plus size={18} className="text-amber-500 group-hover:text-white" />
            <span className="text-xs font-black text-white uppercase tracking-widest">Add New Device</span>
          </div>
        </button>
      </header>

      {/* Filter & Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or number..." 
            className="w-full bg-slate-900/50 border border-slate-800/50 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
        <select className="bg-slate-900/50 border border-slate-800/50 rounded-2xl px-6 text-xs font-bold text-slate-400 focus:outline-none focus:border-amber-500/50 uppercase tracking-widest">
          <option>All Status</option>
          <option>Online</option>
          <option>Offline</option>
        </select>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {devices.map((device, i) => (
          <motion.div
            key={device.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-6 flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] transition-all duration-700 ${device.status === 'online' ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-rose-500/10 group-hover:bg-rose-500/20'}`} />

            <div className="relative">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${device.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                  <MonitorSmartphone size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${device.status === 'online' ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {device.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1 mb-8">
                <h3 className="text-lg font-black text-white truncate">{device.name}</h3>
                <p className="text-xs font-medium text-slate-500">{device.number}</p>
              </div>
            </div>

            <div className="relative space-y-4">
              <div className="flex justify-between items-end border-t border-slate-800/50 pt-4">
                <div>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Messages Today</p>
                  <p className="text-xl font-black text-white">{device.msgsToday || 0}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all">
                    <RefreshCw size={14} />
                  </button>
                  <button className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add Skeleton */}
        <button 
          onClick={handleAddDevice}
          className="border-2 border-dashed border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-slate-600 hover:border-amber-500/50 hover:text-amber-500 hover:bg-amber-500/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-800 group-hover:border-amber-500/50 flex items-center justify-center transition-all">
            <Plus size={24} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Connect New SIM</span>
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
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card p-10 overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]" />

              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Link <span className="text-premium-gold">Device</span></h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Scan with WhatsApp</p>
                </div>
                <button onClick={() => setShowQR(false)} className="p-2 text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Device Label</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mobile-03 SIM-1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                  />
                </div>

                <div className="aspect-square bg-white rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_0_50px_rgba(251,191,36,0.1)]">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-4 text-slate-950">
                      <RefreshCw className="animate-spin" size={32} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Generating Code...</span>
                    </div>
                  ) : qrCode ? (
                    <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center border-4 border-slate-100">
                      <QrCode size={200} className="text-slate-950" />
                    </div>
                  ) : (
                    <button className="flex flex-col items-center gap-4 text-slate-950">
                      <QrCode size={48} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Click to Generate</span>
                    </button>
                  )}
                  
                  {/* Overlay for expiration */}
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                     <p className="text-amber-500 font-black text-4xl">59s</p>
                     <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Expires Soon</p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4">
                   <ol className="text-[10px] font-bold text-slate-500 space-y-2">
                      <li className="flex gap-2"><span className="text-amber-500">1.</span> Open WhatsApp on your phone</li>
                      <li className="flex gap-2"><span className="text-amber-500">2.</span> Tap Menu or Settings and select Linked Devices</li>
                      <li className="flex gap-2"><span className="text-amber-500">3.</span> Tap on Link a Device and point your camera here</li>
                   </ol>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
