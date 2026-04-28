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

import { API_URL } from '@/lib/apiConfig';

export default function BulkMessagingPage() {
  const [step, setStep] = useState(1);
  const [view, setView] = useState('wizard'); 
  const [devices, setDevices] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // FORM STATE
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [mediaFile, setMediaFile] = useState(null);
  const [schedMode, setSchedMode] = useState(1); 
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    fetchDevices();
    const iv = setInterval(() => {
        if (activeCampaign && activeCampaign.status === 'active') fetchActiveStatus();
    }, 5000);
    return () => clearInterval(iv);
  }, [activeCampaign]);

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions`);
      const data = await res.json();
      setDevices(data.filter(d => d.status === 'online'));
    } catch(e) {}
  };

  const fetchActiveStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/campaigns`);
      const data = await res.json();
      const me = data.find(c => c.id === activeCampaign.id);
      if (me) setActiveCampaign(me);
    } catch(e) {}
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
      const data = lines.slice(1).filter(l => l.trim()).map((line, idx) => {
        const [num, msg, time] = line.split(',');
        return { 
          id: idx,
          number: num?.trim(), 
          message: msg?.trim() || null, 
          scheduledAt: time?.trim() || null,
          nodeId: selectedDevices[idx % selectedDevices.length] || 'Auto'
        };
      });
      setRecipients(data);
      addLog(`Imported ${data.length} recipients`, 's');
    };
    reader.readAsText(file);
  };

  const handleLaunch = async () => {
    if (!name || !selectedDevices.length || !recipients.length) return;
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
        setActiveCampaign({ id: data.campaignId, name, status: 'active', totalNumbers: recipients.length, totalSent: 0, totalFailed: 0, selectedDevices: JSON.stringify(selectedDevices) });
        setView('progress');
      }
    } catch (e) {}
    setIsLaunching(false);
  };

  const dlTemplate = () => {
    const csv = "number,message,scheduled_time\n+919876543210,Hello,";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'template.csv'; a.click();
  };

  const estHours = Math.ceil(recipients.length * 30 / 3600);

  if (view === 'progress') return <ProgressView campaign={activeCampaign} logs={logs} onNew={() => setView('wizard')} />;

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-6 flex flex-col font-sans text-slate-900">
      
      {/* COMPACT WRAPPER */}
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        
        {/* HEADER */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FF5F38] rounded-lg flex items-center justify-center text-white">
              <Zap size={18} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">Bulk Engine</h1>
              <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Solid Models v1.0</p>
            </div>
          </div>
          <button onClick={dlTemplate} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
            Template
          </button>
        </div>

        {/* WIZARD */}
        <div className="bg-white rounded-[2rem] shadow-md border border-slate-200 flex flex-col overflow-hidden min-h-[600px]">
          
          {/* STEPS BAR (COMPACT) */}
          <div className="px-8 pt-6 pb-4 flex items-center bg-slate-50/50 border-b border-slate-100">
            {[1,2,3,4].map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all",
                    step === s ? "bg-[#FF5F38] border-[#FF5F38] text-white" :
                    step > s ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-400"
                  )}>
                    {step > s ? "✓" : s}
                  </div>
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", step === s ? "text-slate-900" : "text-slate-400")}>
                    {['Setup', 'List', 'Schedule', 'Final'][s-1]}
                  </span>
                </div>
                {i < 3 && <div className={cn("flex-1 h-[1px] mx-4", step > s ? "bg-emerald-500" : "bg-slate-200")} />}
              </div>
            ))}
          </div>

          {/* STEP CONTENT (SCROLLABLE AREA) */}
          <div className="flex-1 px-8 py-6 overflow-y-auto max-h-[500px] no-scrollbar">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Campaign Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Diwali 2025" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold outline-none focus:border-[#FF5F38]" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Message</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Namaste..." className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold outline-none resize-none focus:border-[#FF5F38]" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Media</label>
                      <div onClick={() => document.getElementById('m-up').click()} className="h-[175px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all">
                         <Upload size={20} className="text-slate-300" />
                         <p className="text-[10px] font-black uppercase text-center px-4">{mediaFile ? mediaFile.name : 'Photo/Video'}</p>
                      </div>
                      <input id="m-up" type="file" className="hidden" onChange={e => setMediaFile(e.target.files[0])} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <Smartphone size={12}/> Nodes Infrastructure
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {devices.map(node => (
                        <button key={node.sessionId} onClick={() => setSelectedDevices(prev => prev.includes(node.sessionId) ? prev.filter(x => x !== node.sessionId) : [...prev, node.sessionId])} className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all relative",
                          selectedDevices.includes(node.sessionId) ? "bg-orange-50 border-[#FF5F38]" : "bg-white border-slate-100 hover:border-[#FF5F38]/20"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full absolute top-4 right-4", node.status === 'online' ? "bg-emerald-500" : "bg-rose-500")} />
                          <p className={cn("text-[10px] font-black uppercase truncate pr-4", selectedDevices.includes(node.sessionId) ? "text-[#FF5F38]" : "text-slate-900")}>{node.name}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[7px] font-bold opacity-60 uppercase"><span>0/150</span><span>150 left</span></div>
                            <div className="h-0.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className={cn("h-full", selectedDevices.includes(node.sessionId) ? "bg-[#FF5F38]" : "bg-emerald-500")} style={{ width: '0%' }} />
                            </div>
                          </div>
                          {selectedDevices.includes(node.sessionId) && <CheckCircle2 size={12} className="absolute bottom-4 right-4 text-[#FF5F38]" />}
                        </button>
                      ))}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg flex gap-6 text-[8px] font-black text-slate-500 uppercase border border-slate-100">
                      <span>Selected: <strong className="text-emerald-600">{selectedDevices.length}</strong></span>
                      <span>Capacity: <strong className="text-slate-900">{selectedDevices.length * 150}</strong></span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-blue-600 p-4 rounded-xl flex gap-3 text-white">
                    <Info size={16} className="shrink-0" />
                    <p className="text-[9px] font-black uppercase tracking-tight leading-tight">
                      CSV: <strong>number</strong>, <strong>message</strong>, <strong>time</strong>. <br/>
                      Max 700+ rows supported.
                    </p>
                  </div>
                  <div onClick={() => document.getElementById('csv-u').click()} className="py-16 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-all">
                     <FileText size={32} className="text-slate-200" />
                     <h3 className="text-base font-black text-slate-900 uppercase">{recipients.length > 0 ? `${recipients.length} Loaded` : 'Upload CSV'}</h3>
                  </div>
                  <input id="csv-u" type="file" className="hidden" accept=".csv" onChange={handleCSV} />
                  
                  {recipients.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <tr><th className="px-4 py-2">Number</th><th className="px-4 py-2">Message</th><th className="px-4 py-2">Time</th></tr>
                         </thead>
                         <tbody className="text-[9px] font-bold text-slate-700">
                            {recipients.slice(0, 5).map((r, i) => (
                              <tr key={i} className="border-b border-slate-50 last:border-none">
                                 <td className="px-4 py-2.5 font-mono text-blue-600">{r.number}</td>
                                 <td className="px-4 py-2.5 truncate max-w-[200px]">{r.message || '—'}</td>
                                 <td className="px-4 py-2.5 text-amber-500">{r.scheduledAt || 'Auto'}</td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => setSchedMode(1)} className={cn("p-5 rounded-2xl border-2 text-left transition-all", schedMode === 1 ? "bg-orange-50 border-[#FF5F38]" : "bg-white border-slate-100 hover:border-[#FF5F38]/30")}>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", schedMode === 1 ? "bg-[#FF5F38] text-white" : "bg-slate-50 text-slate-400")}><Calendar size={16}/></div>
                        <h3 className={cn("text-xs font-black uppercase mb-0.5", schedMode === 1 ? "text-[#FF5F38]" : "text-slate-900")}>File Time</h3>
                        <p className="text-[8px] font-bold opacity-50 uppercase">Use CSV timing.</p>
                     </button>
                     <button onClick={() => setSchedMode(2)} className={cn("p-5 rounded-2xl border-2 text-left transition-all", schedMode === 2 ? "bg-orange-50 border-[#FF5F38]" : "bg-white border-slate-100 hover:border-[#FF5F38]/30")}>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", schedMode === 2 ? "bg-[#FF5F38] text-white" : "bg-slate-50 text-slate-400")}><Zap size={16}/></div>
                        <h3 className={cn("text-xs font-black uppercase mb-0.5", schedMode === 2 ? "text-[#FF5F38]" : "text-slate-900")}>Auto Gap</h3>
                        <p className="text-[8px] font-bold opacity-50 uppercase">Immediate start.</p>
                     </button>
                  </div>
                  
                  <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
                     <h4 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-3"><Clock size={12}/> 9AM–7PM Window <span className="opacity-40 font-mono">LOCKED</span></h4>
                     <div className="h-4 bg-white/5 rounded-full relative overflow-hidden mb-2">
                        <div className="absolute left-[37.5%] w-[41.7%] h-full bg-emerald-500/20 border-x border-emerald-500/40" />
                     </div>
                     <div className="flex justify-between text-[7px] font-black text-slate-500 uppercase font-mono px-1">
                        <span>12AM</span><span>9AM</span><span>7PM</span><span>12AM</span>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                     <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Hardcoded Rules</h4>
                     <div className="grid grid-cols-2 gap-2">
                        {[
                          ['Daily Max', '150'], ['Min/Max', '3-5/min'],
                          ['Gap', '15–35s'], ['Window', '9AM-7PM']
                        ].map(([k, v]) => (
                          <div key={k} className="p-2.5 bg-white border border-slate-100 rounded-lg flex justify-between items-center text-[9px] font-bold uppercase">
                             <span className="text-slate-400">{k}</span>
                             <span className="text-slate-900">{v}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  <div className="grid grid-cols-4 gap-3">
                     <StatBoxCompact label="Total" value={recipients.length} color="slate" />
                     <StatBoxCompact label="Nodes" value={selectedDevices.length} color="blue" />
                     <StatBoxCompact label="Per Node" value={selectedDevices.length ? Math.ceil(recipients.length / selectedDevices.length) : 0} color="emerald" />
                     <StatBoxCompact label="Duration" value={`${estHours}h`} color="orange" />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-left">
                     <ReviewRowSmall label="Campaign" value={name || '—'} />
                     <ReviewRowSmall label="Media" value={mediaFile ? 'Attached' : 'None'} />
                     <ReviewRowSmall label="Window" value="9AM-7PM" color="emerald" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FOOTER (STUCK TO BOTTOM) */}
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button disabled={step === 1} onClick={() => setStep(p => p - 1)} className="text-slate-900 font-black text-[9px] uppercase tracking-widest disabled:opacity-0">
              ← Back
            </button>
            <div className="flex items-center gap-4">
               {step < 4 ? (
                 <button onClick={() => setStep(p => p + 1)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">
                   Next Step →
                 </button>
               ) : (
                 <button onClick={handleLaunch} disabled={isLaunching} className="px-10 py-3.5 bg-[#FF5F38] text-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl shadow-orange-100 flex items-center gap-2">
                   {isLaunching ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="fill-current"/>}
                   Launch
                 </button>
               )}
            </div>
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
        <div className="min-h-screen bg-[#F1F5F9] p-6 flex flex-col font-sans text-slate-900">
             <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <h1 className="text-base font-black uppercase truncate max-w-[200px]">{stats.name}</h1>
                   </div>
                   <div className="flex gap-2">
                      <button className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black uppercase border border-amber-100">⏸ Pause</button>
                      <button className="px-4 py-2 bg-rose-50 text-rose-500 rounded-lg text-[8px] font-black uppercase border border-rose-100">■ Stop</button>
                   </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                   <StatCardCompact label="Total" value={stats.totalNumbers} color="slate" />
                   <StatCardCompact label="Sent" value={stats.totalSent} color="emerald" />
                   <StatCardCompact label="Fail" value={stats.totalFailed} color="rose" />
                   <StatCardCompact label="Next" value="15-35s" color="amber" />
                   <StatCardCompact label="Done" value={`${pct}%`} color="blue" />
                </div>

                <div className="grid grid-cols-3 gap-6">
                   <div className="col-span-2 space-y-6">
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                         <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-5"><motion.div animate={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-orange-400 to-[#FF5F38]" /></div>
                         <div className="h-4 bg-slate-900 rounded-lg relative overflow-hidden">
                            <div className="absolute left-[37.5%] w-[41.7%] h-full bg-emerald-500/20" />
                            <motion.div animate={{ width: `${pct * 0.417}%` }} className="absolute left-[37.5%] h-full bg-emerald-500/40" />
                         </div>
                      </div>

                      <div className="bg-slate-900 rounded-[2rem] overflow-hidden border-2 border-slate-800">
                         <div className="bg-slate-800 px-6 py-2 border-b border-white/5 flex justify-between items-center"><h4 className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-2"><Terminal size={10}/> Live Log</h4></div>
                         <div className="p-6 h-[200px] overflow-y-auto no-scrollbar font-mono text-[10px] leading-relaxed">
                            {logs.map((log, i) => (
                              <div key={i} className="flex gap-3 mb-1.5"><span className="text-slate-600">[{log.time}]</span><span className={cn(log.type === 's' ? "text-emerald-400" : log.type === 'e' ? "text-rose-400" : "text-blue-400")}>{log.msg}</span></div>
                            ))}
                            <div className="text-emerald-400 animate-pulse">_</div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col h-full">
                      <h4 className="text-[8px] font-black text-slate-400 uppercase mb-5">Nodes Pulse</h4>
                      <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                         {JSON.parse(stats.selectedDevices || '[]').map(sid => (
                           <div key={sid} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-[9px] font-black text-slate-800 uppercase mb-2 truncate">{sid}</p>
                              <div className="h-1 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                           </div>
                         ))}
                      </div>
                      <button onClick={onNew} className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">+ New Campaign</button>
                   </div>
                </div>
             </div>
        </div>
    );
}

function StatBoxCompact({ label, value, color }) {
    const colors = { emerald: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", orange: "bg-orange-50 text-orange-700", slate: "bg-slate-900 text-white" };
    return (
        <div className={cn("p-4 rounded-2xl text-center", colors[color])}>
           <p className="text-lg font-black">{value}</p>
           <p className="text-[7px] font-black uppercase opacity-60">{label}</p>
        </div>
    );
}

function StatCardCompact({ label, value, color }) {
    const colors = { emerald: "text-emerald-600", rose: "text-rose-600", blue: "text-blue-600", amber: "text-amber-600", slate: "text-slate-900" };
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
           <p className={cn("text-lg font-black", colors[color])}>{value}</p>
           <p className="text-[7px] font-black text-slate-400 uppercase">{label}</p>
        </div>
    );
}

function ReviewRowSmall({ label, value, color }) {
    const colors = { emerald: "text-emerald-600", none: "text-slate-900" };
    return (
        <div className="px-6 py-3.5 border-b border-slate-50 last:border-none flex justify-between items-center">
           <span className="text-[8px] font-black text-slate-400 uppercase">{label}</span>
           <span className={cn("text-[9px] font-black uppercase", colors[color || 'none'])}>{value}</span>
        </div>
    );
}
