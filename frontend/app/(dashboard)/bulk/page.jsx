'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, MessageSquare, Building2, 
  Users, ShieldCheck, ChevronRight, 
  ChevronLeft, Play, Clock, AlertTriangle,
  Image as ImageIcon, FileText, Video,
  Rocket, Sparkles, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Compose', icon: MessageSquare, description: 'Write your content' },
  { id: 2, label: 'Nodes', icon: Building2, description: 'Select your SIMs' },
  { id: 3, label: 'Audience', icon: Users, description: 'Import recipients' },
  { id: 4, label: 'Review', icon: ShieldCheck, description: 'Safety check' },
];

export default function BulkPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaign, setCampaign] = useState({
    name: '',
    message: '',
    media: null,
    selectedSIMs: [],
    recipients: '',
  });

  const sims = [
    { id: 'm01-s1', name: 'Mobile-01 SIM1', number: '+91-98765-12345', status: 'online' },
    { id: 'm01-s2', name: 'Mobile-01 SIM2', number: '+91-98765-67890', status: 'online' },
    { id: 'm02-s1', name: 'Mobile-02 SIM1', number: '+91-88888-11111', status: 'offline' },
    { id: 'm03-s1', name: 'Mobile-03 SIM1', number: '+91-55555-55555', status: 'online' },
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
           <div className="absolute inset-0 bg-brand-gold/20 blur-2xl rounded-full" />
           <div className="relative w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-brand-gold shadow-2xl shadow-slate-900/20">
             <Zap size={36} fill="currentColor" />
           </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Campaign <span className="text-brand-gold">Wizard</span>
          </h1>
          <div className="flex items-center justify-center gap-3 mt-2">
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Safe Broadcast Active</span>
             </div>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] opacity-70">Solid Models Infrastructure</p>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="flex justify-between items-center px-16 relative py-4">
        <div className="absolute left-24 right-24 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100" />
        {STEPS.map((step) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-4 group">
            <div className={cn(
              "w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-700 relative",
              currentStep === step.id 
                ? "bg-slate-900 text-brand-gold shadow-2xl shadow-slate-900/20 scale-110" 
                : currentStep > step.id 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/10" 
                : "bg-white border border-slate-100 text-slate-300 group-hover:border-brand-gold/30"
            )}>
              {currentStep > step.id ? <ShieldCheck size={24} /> : <step.icon size={24} />}
              {currentStep === step.id && (
                 <motion.div 
                   layoutId="active-glow"
                   className="absolute inset-0 bg-brand-gold/20 blur-xl rounded-full -z-10"
                 />
              )}
            </div>
            <div className="text-center">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] block mb-0.5",
                currentStep === step.id ? "text-slate-900" : "text-slate-400"
              )}>{step.label}</span>
              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter hidden lg:block">{step.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white border border-slate-100 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.05)] p-12 min-h-[500px] flex flex-col relative overflow-hidden selection:bg-brand-gold/20">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 flex-1"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-brand-gold" />
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Campaign Identity</label>
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. Diwali Special Offer 2025"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-brand-gold/30 transition-all shadow-sm"
                      value={campaign.name}
                      onChange={e => setCampaign({...campaign, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <MessageSquare className="w-4 h-4 text-brand-gold" />
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Message Content</label>
                    </div>
                    <textarea 
                      placeholder="Type your broadcast message here..."
                      rows={8}
                      className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-6 px-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-brand-gold/30 transition-all shadow-sm leading-relaxed"
                      value={campaign.message}
                      onChange={e => setCampaign({...campaign, message: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-10">
                   <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <Rocket className="w-4 h-4 text-brand-gold" />
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Visual Assets (Optional)</label>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: ImageIcon, label: 'Image' },
                        { icon: Video, label: 'Video' },
                        { icon: FileText, label: 'Doc' },
                      ].map((asset, i) => (
                        <button key={i} className="flex flex-col items-center justify-center gap-3 p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-slate-400 hover:text-brand-gold hover:bg-white hover:border-brand-gold/30 transition-all group shadow-sm">
                          <asset.icon size={28} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{asset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-8 bg-brand-gold/5 border border-brand-gold/10 rounded-[2.5rem] space-y-4 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-brand-gold/10 blur-2xl group-hover:scale-150 transition-all duration-700" />
                    <div className="flex items-center gap-3 text-brand-gold">
                      <AlertTriangle size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Optimization Strategy</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
                      Use personalized variables like <code className="text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-md">{"{{name}}"}</code> to make each message unique. This significantly reduces detection risk on WhatsApp servers.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 flex-1"
            >
              <div className="flex justify-between items-end pb-4 border-b border-slate-50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Outbound Infrastructure</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Select SIM nodes for campaign distribution</p>
                </div>
                <button className="text-[10px] font-black text-brand-gold uppercase tracking-widest hover:underline decoration-2 underline-offset-8">Select All Active</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sims.map((sim) => (
                  <button
                    key={sim.id}
                    disabled={sim.status === 'offline'}
                    onClick={() => {
                      const selected = campaign.selectedSIMs.includes(sim.id);
                      if (selected) setCampaign({...campaign, selectedSIMs: campaign.selectedSIMs.filter(id => id !== sim.id)});
                      else setCampaign({...campaign, selectedSIMs: [...campaign.selectedSIMs, sim.id]});
                    }}
                    className={cn(
                      "flex items-center justify-between p-8 rounded-[2rem] border transition-all duration-500 text-left relative overflow-hidden group",
                      campaign.selectedSIMs.includes(sim.id) 
                        ? "bg-slate-900 border-slate-800 shadow-2xl shadow-slate-900/20" 
                        : "bg-white border-slate-100 hover:border-brand-gold/30 shadow-sm",
                      sim.status === 'offline' && "opacity-40 cursor-not-allowed grayscale"
                    )}
                  >
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                        campaign.selectedSIMs.includes(sim.id) ? "bg-brand-gold text-slate-900" : "bg-slate-50 text-slate-300 group-hover:bg-brand-gold/10 group-hover:text-brand-gold"
                      )}>
                        <Building2 size={32} />
                      </div>
                      <div>
                        <h4 className={cn("text-base font-black tracking-tight", campaign.selectedSIMs.includes(sim.id) ? "text-white" : "text-slate-900")}>{sim.name}</h4>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest", campaign.selectedSIMs.includes(sim.id) ? "text-slate-500" : "text-slate-400")}>{sim.number}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-500 relative z-10",
                      campaign.selectedSIMs.includes(sim.id) ? "bg-brand-gold border-brand-gold text-slate-900" : "border-slate-100 bg-slate-50 group-hover:border-brand-gold/30"
                    )}>
                      {campaign.selectedSIMs.includes(sim.id) && <Play size={16} fill="currentColor" className="ml-0.5" />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 flex-1"
            >
              <div className="flex justify-between items-end pb-4 border-b border-slate-50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Target Audience</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">SIM Cluster Limit: {campaign.selectedSIMs.length * 120} Recipients</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <button className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col items-center gap-4 group hover:bg-white hover:border-brand-gold/30 transition-all shadow-sm">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-brand-gold shadow-sm transition-all">
                        <FileText size={28} />
                      </div>
                      <div className="text-center">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest block">Upload CSV/Excel</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Format: Number, Name</span>
                      </div>
                   </button>
                   <button className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col items-center gap-4 group hover:bg-white hover:border-brand-gold/30 transition-all shadow-sm">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-brand-gold shadow-sm transition-all">
                        <Users size={28} />
                      </div>
                      <div className="text-center">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest block">Select from Contacts</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">From your existing database</span>
                      </div>
                   </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4 text-brand-gold" />
                     <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Manual Entry (Pasted List)</label>
                  </div>
                  <textarea 
                    placeholder="919876543210, 919999999999, 910000000000..."
                    rows={8}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] py-8 px-8 text-xs font-mono font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-brand-gold/30 transition-all shadow-sm leading-loose"
                    value={campaign.recipients}
                    onChange={e => setCampaign({...campaign, recipients: e.target.value})}
                  />
                  <div className="flex justify-between items-center px-4">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Format: Country Code + Number (comma separated)</span>
                     <span className="text-[9px] font-black text-brand-gold uppercase tracking-widest">{campaign.recipients.split(',').filter(x => x.trim()).length} Detected</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 flex-1"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <div className="pb-4 border-b border-slate-50">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Safety Protocol</h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1 italic">Anti-Ban Engine Ready</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col gap-4 group hover:bg-white transition-all shadow-sm">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-gold shadow-sm">
                         <Clock size={24} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Random Interval</p>
                          <p className="text-xl font-black text-slate-900 tracking-tight">20 - 35 Sec</p>
                       </div>
                    </div>
                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col gap-4 group hover:bg-white transition-all shadow-sm">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-gold shadow-sm">
                         <Zap size={24} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Burst Break</p>
                          <p className="text-xl font-black text-slate-900 tracking-tight">25 Min / Cycle</p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] relative overflow-hidden group shadow-sm">
                     <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-200/20 blur-2xl group-hover:scale-150 transition-all duration-700" />
                     <div className="flex items-center gap-3 text-emerald-600 mb-3">
                        <ShieldCheck size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Deployment Logic</span>
                     </div>
                     <p className="text-[11px] text-emerald-600 font-bold leading-relaxed uppercase tracking-tight opacity-80">
                       Distributed across <span className="text-emerald-700 font-black">{campaign.selectedSIMs.length} Nodes</span>. Target completion window: <span className="text-emerald-700 font-black">6-8 Hours</span> to ensure human-like behavior.
                     </p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                   <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-gold/10 blur-[100px]" />
                   <div className="relative z-10 h-full flex flex-col">
                     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10 border-b border-white/5 pb-4">Deployment Summary</h3>
                     <div className="space-y-8 flex-1">
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Campaign Identity</p>
                          <p className="text-xl font-black text-white tracking-tight">{campaign.name || 'Untitled Campaign'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Recipients</p>
                            <p className="text-4xl font-black text-brand-gold tracking-tighter">{campaign.recipients.split(',').filter(x => x.trim()).length}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">SIM Nodes</p>
                            <p className="text-4xl font-black text-brand-gold tracking-tighter">{campaign.selectedSIMs.length}</p>
                          </div>
                        </div>
                        <div className="pt-8 border-t border-white/5">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <MessageSquare size={12} /> Message Preview
                          </p>
                          <div className="bg-white/5 rounded-2xl p-6 italic text-[13px] text-slate-300 leading-relaxed border border-white/5">
                             "{campaign.message || 'No message content provided yet...'}"
                          </div>
                        </div>
                     </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="mt-auto pt-12 flex justify-between items-center">
          <button 
            onClick={prevStep}
            className={cn(
              "flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 hover:bg-slate-50 transition-all duration-300",
              currentStep === 1 && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft size={20} />
            Prev Step
          </button>

          {currentStep < 4 ? (
            <button 
              onClick={nextStep}
              className="bg-slate-900 hover:bg-slate-800 text-white px-12 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-slate-900/20 active:scale-95 transition-all group"
            >
              Continue
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button 
              className="bg-brand-gold hover:bg-brand-gold/90 text-slate-900 px-12 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-brand-gold/20 active:scale-95 transition-all group"
            >
              Launch Broadcast
              <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
