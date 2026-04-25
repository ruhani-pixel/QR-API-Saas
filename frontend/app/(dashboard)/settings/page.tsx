'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Shield, 
  Lock, 
  Clock, 
  Zap, 
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Activity,
  User,
  Settings as SettingsIcon
} from 'lucide-react';

export default function SettingsPage() {
  const { role, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'safety' | 'account'>('safety');

  if (role === 'agent') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Lock className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-black text-slate-900 uppercase">Access Restricted</h2>
        <p className="text-slate-400 text-sm text-center max-w-md">Only Administrator can view system settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Settings</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">System Guard & Safety Protocols</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
          <Shield className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Anti-Ban Shield Active</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'safety' ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Shield className="w-4 h-4" /> Safety Protocols
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'account' ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <User className="w-4 h-4" /> Account
        </button>
      </div>

      {activeTab === 'safety' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-slate-200 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-500" /> Hardcoded Safety Guards
                  </CardTitle>
                  <p className="text-xs text-slate-500 font-medium">These settings are non-bypassable and fixed for maximum account safety.</p>
                </div>
                <div className="bg-amber-500/10 text-amber-600 p-3 rounded-2xl">
                   <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Limits Column */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Message Limits</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Max Messages per Day</span>
                      <span className="text-sm font-black text-slate-900">120 / SIM</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Burst Size Limit</span>
                      <span className="text-sm font-black text-slate-900">10-15 Msgs</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Active Sim Workers</span>
                      <span className="text-sm font-black text-slate-900">Unlimited</span>
                    </div>
                  </div>
                </div>

                {/* Timing Column */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-gold flex items-center justify-center text-white shadow-lg shadow-brand-gold/20">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Timing Rules</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Between Messages Gap</span>
                      <span className="text-sm font-black text-slate-900">20-35 Sec</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Burst Break Duration</span>
                      <span className="text-sm font-black text-slate-900">25-35 Min</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Workday Window</span>
                      <span className="text-sm font-black text-slate-900">7 Hours Max</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bot Behavior Grid */}
              <div className="mt-12 pt-8 border-t border-slate-50">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-gold" /> Anti-Detection Logic
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Typing Indicator', desc: 'Simulated human typing delay', status: 'Always ON' },
                    { label: 'Read Receipts', desc: 'Natural pattern message reads', status: 'Normal' },
                    { label: 'Micro-Variation', desc: 'Auto variations in intervals', status: 'Active' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-5 rounded-3xl border border-slate-100 bg-white shadow-sm group hover:border-brand-gold/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-xs font-bold text-slate-900">{item.status}</p>
                      <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tight mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning Banner */}
          <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
               <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight">Enterprise Safety Mode</h4>
              <p className="text-xs text-slate-400 font-medium">To protect your WhatsApp accounts from bans, we do not allow changing these core intervals. For custom settings, please contact Enterprise Support.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-slate-200 shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
             <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Profile Details</CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-900 border border-slate-200">
                     {user?.email?.charAt(0).toUpperCase()}
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900">{user?.displayName || 'Admin User'}</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{user?.email}</p>
                      <div className="pt-2 flex gap-2">
                        <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-[9px] font-black uppercase tracking-widest rounded-lg border border-brand-gold/20">
                          {role || 'Administrator'}
                        </span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                          Pro Plan
                        </span>
                      </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 opacity-60">
                      {user?.email}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Organization ID</label>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 opacity-60 font-mono">
                      SOLID-MODELS-HQ
                    </div>
                  </div>
                </div>
             </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
