'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, MessageSquare, Building2, 
  Users, ShieldCheck, ChevronRight, 
  ChevronLeft, Play, Clock, AlertTriangle,
  Image as ImageIcon, FileText, Video
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Compose', icon: MessageSquare },
  { id: 2, label: 'Choose SIMs', icon: Building2 },
  { id: 3, label: 'Recipients', icon: Users },
  { id: 4, label: 'Review', icon: ShieldCheck },
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
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <header className="flex flex-col items-center text-center gap-4">
        <div className="p-4 bg-amber-500/10 text-amber-500 rounded-3xl animate-pulse">
          <Zap size={32} />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
            Campaign <span className="text-premium-gold">Wizard</span>
          </h1>
          <p className="text-slate-500 font-medium">Broadcast safely with randomized timing patterns.</p>
        </div>
      </header>

      {/* Stepper */}
      <div className="flex justify-between items-center px-10 relative">
        <div className="absolute left-20 right-20 top-1/2 -translate-y-1/2 h-[2px] bg-slate-900" />
        {STEPS.map((step) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
              currentStep >= step.id ? "premium-gradient text-slate-950 shadow-lg shadow-amber-500/20" : "bg-slate-950 border border-slate-800 text-slate-600"
            )}>
              <step.icon size={20} />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest transition-colors",
              currentStep >= step.id ? "text-amber-500" : "text-slate-700"
            )}>{step.label}</span>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="glass-card p-10 min-h-[450px] flex flex-col">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 flex-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Campaign Identity</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Diwali Offer 2025"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all"
                      value={campaign.name}
                      onChange={e => setCampaign({...campaign, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message Content</label>
                    <textarea 
                      placeholder="Type your broadcast message here..."
                      rows={6}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all"
                      value={campaign.message}
                      onChange={e => setCampaign({...campaign, message: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visual Assets (Optional)</label>
                    <div className="grid grid-cols-3 gap-4">
                      <button className="flex flex-col items-center justify-center gap-2 p-6 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-amber-500 hover:border-amber-500/50 transition-all group">
                        <ImageIcon size={24} />
                        <span className="text-[8px] font-bold uppercase">Image</span>
                      </button>
                      <button className="flex flex-col items-center justify-center gap-2 p-6 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-amber-500 hover:border-amber-500/50 transition-all">
                        <Video size={24} />
                        <span className="text-[8px] font-bold uppercase">Video</span>
                      </button>
                      <button className="flex flex-col items-center justify-center gap-2 p-6 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-amber-500 hover:border-amber-500/50 transition-all">
                        <FileText size={24} />
                        <span className="text-[8px] font-bold uppercase">Doc</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-500">
                      <AlertTriangle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Optimization Tip</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Use personalized variables like <code className="text-amber-400">{"{{name}}"}</code> to make messages more unique and reduce detection risk.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 flex-1"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Select Outbound Nodes</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Choose which SIMs will send this campaign</p>
                </div>
                <button className="text-[10px] font-black text-amber-500 uppercase underline underline-offset-4">Select All Online</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      "flex items-center justify-between p-6 rounded-2xl border transition-all text-left",
                      campaign.selectedSIMs.includes(sim.id) 
                        ? "bg-amber-500/10 border-amber-500/50" 
                        : "bg-slate-950 border-slate-900 hover:border-slate-800",
                      sim.status === 'offline' && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        campaign.selectedSIMs.includes(sim.id) ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-500"
                      )}>
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{sim.name}</h4>
                        <p className="text-[10px] font-medium text-slate-500">{sim.number}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      campaign.selectedSIMs.includes(sim.id) ? "bg-amber-500 border-amber-500 text-slate-950" : "border-slate-800"
                    )}>
                      {campaign.selectedSIMs.includes(sim.id) && <Play size={12} fill="currentColor" />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 flex-1"
            >
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Recipients</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Limit: {campaign.selectedSIMs.length * 120} numbers across {campaign.selectedSIMs.length} SIMs</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                   <button className="flex-1 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-amber-500/30 hover:text-amber-500 transition-all">Upload CSV/Excel</button>
                   <button className="flex-1 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-amber-500/30 hover:text-amber-500 transition-all">Paste Numbers</button>
                </div>
                <textarea 
                  placeholder="Format: 919876543210, 919999999999..."
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-xs text-white font-mono focus:outline-none focus:border-amber-500/50 transition-all"
                  value={campaign.recipients}
                  onChange={e => setCampaign({...campaign, recipients: e.target.value})}
                />
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 flex-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Safety Protocol</h2>
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Anti-Ban Protection: Engaged</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-slate-950 border border-slate-900 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Clock className="text-amber-500" size={18} />
                        <span className="text-xs font-bold text-slate-300">Random Interval</span>
                      </div>
                      <span className="text-xs font-black text-white">20 - 35 sec</span>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-slate-950 border border-slate-900 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Zap className="text-amber-500" size={18} />
                        <span className="text-xs font-bold text-slate-300">Burst Break</span>
                      </div>
                      <span className="text-xs font-black text-white">25 min / 15 msgs</span>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                     <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                       Your campaign will be distributed across <span className="text-white font-bold">{campaign.selectedSIMs.length} SIMs</span>. Each SIM will take approximately <span className="text-white font-bold">6-7 hours</span> to complete the broadcast to ensure safety.
                     </p>
                  </div>
                </div>

                <div className="glass-card p-8 bg-slate-950 border-slate-800 shadow-inner">
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Execution Summary</h3>
                   <div className="space-y-6">
                      <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Campaign</p>
                        <p className="text-sm font-bold text-white">{campaign.name || 'Untitled Campaign'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Recipients</p>
                          <p className="text-xl font-black text-white">{campaign.recipients.split(',').length}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">SIM Nodes</p>
                          <p className="text-xl font-black text-white">{campaign.selectedSIMs.length}</p>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-slate-900">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Message Preview</p>
                        <p className="text-xs text-slate-400 italic line-clamp-3">"{campaign.message}"</p>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="mt-auto pt-10 flex justify-between border-t border-slate-900/50">
          <button 
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white disabled:opacity-0 transition-all"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          {currentStep < 4 ? (
            <button 
              onClick={nextStep}
              className="premium-gradient px-10 py-4 rounded-2xl text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              className="bg-emerald-500 px-10 py-4 rounded-2xl text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Launch Campaign
              <Play size={18} fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
