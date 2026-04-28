'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Zap, Smartphone, Users, ShieldCheck, Play, Pause, 
  Trash2, FileText, Upload, ChevronRight, ChevronLeft, 
  Loader2, CheckCircle2, Clock, Terminal, AlertCircle,
  Database, Info, Lock, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const API_URL = 'http://localhost:3001';

export default function BulkMessagingPage() {
  const [step, setStep] = useState(1);
  const [view, setView] = useState('wizard'); // wizard | progress
  const [devices, setDevices] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // FORM STATE
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [mediaFile, setMediaFile] = useState(null);
  const [schedMode, setSchedMode] = useState(1); // 1: File, 2: Auto
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    fetchDevices();
    fetchCampaigns();
    const iv = setInterval(() => {
        fetchCampaigns();
        if (activeCampaign) fetchActiveStatus();
    }, 5000);
    return () => clearInterval(iv);
  }, [activeCampaign]);

  const fetchDevices = async () => {
    const res = await fetch(`${API_URL}/api/sessions`);
    const data = await res.json();
    setDevices(data.filter(d => d.status === 'online'));
  };

  const fetchCampaigns = async () => {
    const res = await fetch(`${API_URL}/api/campaigns`);
    const data = await res.json();
    setCampaigns(data);
  };

  const fetchActiveStatus = async () => {
      if (activeCampaign.status === 'active') {
          addLog(`Engine Heartbeat: All nodes active and monitoring window...`, 'i');
      }
  };

  const addLog = (msg, type = '') => {
      const time = new Date().toLocaleTimeString();
      setLogs(prev => [{ time, msg, type }, ...prev].slice(0, 50));
  };

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const lines = evt.target.result.split('\n');
      const data = lines.slice(1).filter(l => l.trim()).map(line => {
        const [num, msg, time, node] = line.split(',');
        return { number: num.trim(), message: msg?.trim() || null, scheduledAt: time?.trim() || null, nodeId: node?.trim() || null };
      });
      setRecipients(data);
      addLog(`Imported ${data.length} recipients from CSV`, 's');
    };
    reader.readAsText(file);
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('message', message);
    if (mediaFile) formData.append('media', mediaFile);
    formData.append('selectedDevices', JSON.stringify(selectedDevices));
    formData.append('recipients', JSON.stringify(recipients));
    formData.append('safetyConfig', JSON.stringify({ schedMode }));

    try {
      const res = await fetch(`${API_URL}/api/campaign/create`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        await fetch(`${API_URL}/api/campaign/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: data.campaignId, status: 'active' }) });
        const camp = { id: data.campaignId, name, status: 'active', totalNumbers: recipients.length, totalSent: 0, totalFailed: 0 };
        setActiveCampaign(camp);
        setView('progress');
        addLog(`Campaign "${name}" launched successfully.`, 's');
      }
    } catch (e) { addLog(`Launch Failed: ${e.message}`, 'e'); }
    setIsLaunching(false);
  };

  const dlTemplate = () => {
    const csv = "number,message,scheduled_time,node_id\n+919876543210,Hello Rahul ji,2025-04-28 10:30,node_1\n+918765432109,Special offer for you,,node_2";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'solid_models_template.csv';
    a.click();
  };

  const steps = [
    { id: 1, label: 'Setup', icon: <Zap size={16}/> },
    { id: 2, label: 'Recipients', icon: <Users size={16}/> },
    { id: 3, label: 'Schedule', icon: <Clock size={16}/> },
    { id: 4, label: 'Review', icon: <ShieldCheck size={16}/> }
  ];

  if (view === 'progress') return <ProgressView campaign={activeCampaign} logs={logs} onNew={() => setView('wizard')} />;

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-6 flex flex-col gap-6 font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#FF5F38] rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-100">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Bulk Engine</h1>
            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest leading-none">Solid Models — Multi-Device v1.0</p>
          </div>
        </div>
        <button onClick={dlTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">
          <FileText size={12} /> Download Template
        </button>
      </div>

      {/* WIZARD CONTAINER */}
      <div className="flex-1 bg-white rounded-[2rem] shadow-md border border-slate-200 flex flex-col overflow-hidden">
        
        {/* STEPS BAR */}
        <div className="px-10 pt-8 pb-4 flex items-center border-b border-slate-100 bg-slate-50/30">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 border-2",
                  step === s.id ? "bg-[#FF5F38] border-[#FF5F38] text-white shadow-md shadow-orange-100" :
                  step > s.id ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-400"
                )}>
                  {step > s.id ? "✓" : s.id}
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-widest", step === s.id ? "text-slate-900" : "text-slate-400")}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && <div className={cn("flex-1 h-[2px] mx-4", step > s.id ? "bg-emerald-500" : "bg-slate-200")} />}
            </div>
          ))}
        </div>

        {/* STEP CONTENT */}
        <div className="flex-1 px-10 py-8 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Campaign Name</label>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Festival Launch" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 focus:border-[#FF5F38] outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Default Message</label>
                      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Type universal message..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 focus:border-[#FF5F38] outline-none transition-all resize-none placeholder:text-slate-300" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Attach Media</label>
                    <div onClick={() => document.getElementById('media-up').click()} className="h-[215px] border-2 border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 hover:border-[#FF5F38] transition-all group">
                       <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#FF5F38] shadow-sm transition-all">
                          <Upload size={24} />
                       </div>
                       <div className="text-center">
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">{mediaFile ? mediaFile.name : 'Click to attach file'}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase">MP4, JPG, PNG — MAX 16MB</p>
                       </div>
                    </div>
                    <input id="media-up" type="file" className="hidden" onChange={e => setMediaFile(e.target.files[0])} />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Smartphone size={12}/> SIM Select Karo <span className="text-slate-400 font-bold lowercase italic">(sirf online nodes dikhenge)</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {devices.map(node => (
                      <button key={node.sessionId} onClick={() => setSelectedDevices(prev => prev.includes(node.sessionId) ? prev.filter(x => x !== node.sessionId) : [...prev, node.sessionId])} className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all duration-200 relative",
                        selectedDevices.includes(node.sessionId) ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-100 hover:border-[#FF5F38]/30"
                      )}>
                        <div className={cn("w-2 h-2 rounded-full absolute top-4 right-4", node.status === 'online' ? "bg-emerald-500" : "bg-rose-500")} />
                        <p className="text-[10px] font-black uppercase tracking-tight mb-0.5">{node.name}</p>
                        <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest font-mono truncate">{node.sessionId}</p>
                        {selectedDevices.includes(node.sessionId) && <CheckCircle2 size={14} className="text-[#FF5F38] mt-2" />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-blue-600 p-5 rounded-xl flex gap-4 text-white">
                  <Info className="shrink-0" size={18} />
                  <p className="text-[10px] font-black uppercase tracking-wide leading-relaxed">
                    CSV Format: <span className="opacity-70">number</span> (required), <span className="opacity-70">message</span>, <span className="opacity-70">scheduled_time</span>. <br/>
                    Aap 700+ numbers ek baar mein upload kar sakte hain.
                  </p>
                </div>
                <div onClick={() => document.getElementById('csv-up').click()} className="py-20 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 hover:border-[#FF5F38] transition-all group">
                   <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-[#FF5F38] shadow-sm transition-all">
                      <FileText size={32} />
                   </div>
                   <div className="text-center">
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">{recipients.length > 0 ? `✅ ${recipients.length} Numbers Loaded` : 'Click to upload CSV'}</h3>
                      <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Excel / CSV Supported</p>
                   </div>
                </div>
                <input id="csv-up" type="file" className="hidden" accept=".csv" onChange={handleCSV} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="bg-amber-500 p-5 rounded-xl flex gap-4 text-white shadow-md">
                   <AlertCircle className="shrink-0" size={18} />
                   <p className="text-[10px] font-black uppercase tracking-wide leading-relaxed">
                     Safety rules <span className="text-slate-900">HARDCODED</span> hain — Engine automatic sab handle karta hai.
                   </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button onClick={() => setSchedMode(1)} className={cn(
                     "p-6 rounded-[1.5rem] border-2 text-left transition-all duration-200",
                     schedMode === 1 ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105" : "bg-white border-slate-100 hover:border-[#FF5F38]/20"
                   )}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", schedMode === 1 ? "bg-[#FF5F38] text-white" : "bg-slate-50 text-slate-400")}>
                         <Calendar size={20} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-tight mb-1">File-based Time</h3>
                      <p className="text-[9px] font-bold opacity-60 uppercase leading-relaxed">CSV timing use hogi. Blank hone par auto-gap lagega.</p>
                   </button>
                   <button onClick={() => setSchedMode(2)} className={cn(
                     "p-6 rounded-[1.5rem] border-2 text-left transition-all duration-200",
                     schedMode === 2 ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105" : "bg-white border-slate-100 hover:border-[#FF5F38]/20"
                   )}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", schedMode === 2 ? "bg-[#FF5F38] text-white" : "bg-slate-50 text-slate-400")}>
                         <Zap size={20} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-tight mb-1">Auto-Gap Only</h3>
                      <p className="text-[9px] font-bold opacity-60 uppercase leading-relaxed">Engine khud sab timing manage karega turant start karke.</p>
                   </button>
                </div>
                
                <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
                   <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Clock size={14}/> 10-Hour Window <span className="px-2 py-0.5 bg-emerald-400/20 rounded text-[7px] font-black border border-emerald-400/30">LOCKED</span>
                      </h4>
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase mb-6">Engine sirf subah 9 baje se shaam 7 baje tak kaam karega. Raat ko sending blocked hai.</p>
                   <div className="h-4 bg-white/5 rounded-full relative overflow-hidden mb-3 border border-white/10">
                      <div className="absolute left-[37.5%] w-[41.7%] h-full bg-emerald-500/30 border-x border-emerald-500" />
                   </div>
                   <div className="flex justify-between px-1 text-[8px] font-bold text-slate-500 uppercase font-mono">
                      <span>12 AM</span><span>6 AM</span><span>9 AM</span><span>12 PM</span><span>3 PM</span><span>7 PM</span><span>12 AM</span>
                   </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                   <StatBox label="Targets" value={recipients.length} color="emerald" />
                   <StatBox label="Nodes" value={selectedDevices.length} color="blue" />
                   <StatBox label="Per Node" value={selectedDevices.length ? Math.ceil(recipients.length / selectedDevices.length) : recipients.length} color="slate" />
                   <StatBox label="Daily Cap" value="150" color="orange" />
                </div>
                <div className="bg-slate-50 rounded-[1.5rem] border border-slate-200 overflow-hidden">
                   <ReviewRow label="Campaign" value={name || 'Untitled'} />
                   <ReviewRow label="Media" value={mediaFile ? mediaFile.name : 'None'} />
                   <ReviewRow label="Scheduling" value={schedMode === 1 ? 'File + Spacer' : 'Engine Auto'} />
                   <ReviewRow label="Window" value="9:00 AM – 7:00 PM" color="amber" icon={<Clock size={12}/>} />
                   <ReviewRow label="Rules" value="HARDCODED ON" color="emerald" icon={<ShieldCheck size={12}/>} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER BAR */}
        <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button disabled={step === 1} onClick={() => setStep(p => p - 1)} className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:opacity-70 disabled:opacity-0 transition-all">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-4">
             {step < 4 ? (
               <button onClick={() => setStep(p => p + 1)} className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all active:scale-95">
                 Next Step <ChevronRight size={16} />
               </button>
             ) : (
               <button onClick={handleLaunch} disabled={isLaunching} className="px-12 py-4 bg-[#FF5F38] text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-orange-100 hover:scale-105 transition-all active:scale-95 flex items-center gap-3">
                 {isLaunching ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} className="fill-current"/>}
                 Launch Campaign
               </button>
             )}
          </div>
        </div>
      </div>

    </div>
  );
}

function ProgressView({ campaign, logs, onNew }) {
    const [stats, setStats] = useState(campaign);
    useEffect(() => {
        const iv = setInterval(async () => {
            const res = await fetch(`${API_URL}/api/campaigns`);
            const data = await res.json();
            const me = data.find(c => c.id === campaign.id);
            if (me) setStats(me);
        }, 5000);
        return () => clearInterval(iv);
    }, [campaign.id]);
    const pct = Math.round((stats.totalSent / stats.totalNumbers) * 100) || 0;

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-6 flex flex-col gap-6 font-sans text-slate-900">
             <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                   <div className="flex items-center gap-3 mb-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{stats.name}</h1>
                   </div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Status: {stats.status} — Safe-Send Engine Active</p>
                </div>
                <div className="flex gap-2">
                   <button className="px-5 py-2.5 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">⏸ Pause</button>
                   <button className="px-5 py-2.5 bg-rose-50 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-100">■ Stop</button>
                </div>
             </div>

             <div className="grid grid-cols-5 gap-4">
                <StatCard label="Total" value={stats.totalNumbers} color="slate" />
                <StatCard label="Sent" value={stats.totalSent} color="emerald" />
                <StatCard label="Fail" value={stats.totalFailed} color="rose" />
                <StatCard label="Pending" value={stats.totalNumbers - stats.totalSent - stats.totalFailed} color="blue" />
                <StatCard label="Gap" value="15-30s" color="amber" />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                   <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-200">
                      <div className="flex justify-between items-center mb-6">
                         <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progress Bar</h4>
                         <span className="text-xl font-black text-[#FF5F38]">{pct}%</span>
                      </div>
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5 mb-6">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-orange-400 to-[#FF5F38] rounded-full shadow-inner" />
                      </div>
                      <div className="h-4 bg-slate-900 rounded-lg relative overflow-hidden">
                         <div className="absolute left-[37.5%] w-[41.7%] h-full bg-emerald-500/20 border-x border-emerald-500/40" />
                         <motion.div initial={{ width: 0 }} animate={{ width: `${pct * 0.417}%` }} className="absolute left-[37.5%] h-full bg-emerald-500/40" />
                      </div>
                   </div>

                   <div className="bg-slate-900 rounded-[2rem] shadow-xl overflow-hidden border-2 border-slate-800">
                      <div className="bg-slate-800 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                         <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Terminal size={12}/> Live Log</h4>
                      </div>
                      <div className="p-6 h-[250px] overflow-y-auto no-scrollbar font-mono text-[11px] leading-relaxed">
                         {logs.map((log, i) => (
                           <div key={i} className="flex gap-4 mb-1.5 group">
                              <span className="text-slate-600 shrink-0">[{log.time}]</span>
                              <span className={cn(
                                log.type === 's' ? "text-emerald-400" : log.type === 'e' ? "text-rose-400" : "text-blue-400"
                              )}>{log.msg}</span>
                           </div>
                         ))}
                         <div className="text-emerald-400 animate-pulse mt-1">_</div>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-200 flex flex-col">
                   <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Node Pulse</h4>
                   <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                      {JSON.parse(stats.selectedDevices || '[]').map(sid => (
                        <div key={sid} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                           <div className="flex justify-between items-start mb-2">
                              <p className="text-[10px] font-black text-slate-900 uppercase truncate">{sid}</p>
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                           </div>
                           <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                           </div>
                        </div>
                      ))}
                   </div>
                   <button onClick={onNew} className="mt-6 w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all">
                     + New Campaign
                   </button>
                </div>
             </div>
        </div>
    );
}

function StatBox({ label, value, color }) {
    const colors = {
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        orange: "bg-orange-50 text-orange-700 border-orange-100",
        slate: "bg-slate-900 text-white border-slate-900"
    };
    return (
        <div className={cn("p-5 rounded-2xl border text-center transition-all", colors[color])}>
           <p className="text-xl font-black mb-0.5 tracking-tight">{value}</p>
           <p className="text-[8px] font-black uppercase tracking-widest opacity-60">{label}</p>
        </div>
    );
}

function StatCard({ label, value, color }) {
    const colors = {
        emerald: "text-emerald-600",
        rose: "text-rose-600",
        blue: "text-blue-600",
        amber: "text-amber-600",
        slate: "text-slate-900"
    };
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 text-center">
           <p className={cn("text-xl font-black mb-0.5", colors[color])}>{value}</p>
           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
    );
}

function ReviewRow({ label, value, color, icon }) {
    const colors = {
        emerald: "text-emerald-600",
        amber: "text-amber-600",
        none: "text-slate-900"
    };
    return (
        <div className="px-6 py-4 border-b border-slate-200 last:border-none flex justify-between items-center">
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
           <span className={cn("text-[10px] font-black uppercase tracking-tight flex items-center gap-2", colors[color || 'none'])}>
              {icon} {value}
           </span>
        </div>
    );
}
