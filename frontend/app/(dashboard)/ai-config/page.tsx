'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Bot, Key, Cpu, Zap, Settings2, Sliders, 
  Sparkles, Loader2, Save, MessageSquare, 
  Send, BarChart3, PieChart, History, 
  TrendingUp, RefreshCcw, Wallet, Phone, 
  MessageCircle, ShieldCheck, Activity,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AIConfigPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [stats, setStats] = useState({
    last1h: 0,
    today: 0,
    last7: 0,
    last30: 0,
    allTime: 0,
    lastSynced: null,
    tokens: { total: 0, today: 0 },
    pricing: {} as any,
    breakdown: {
      inputCostToday: 0,
      outputCostToday: 0,
      inputTokensToday: 0,
      outputTokensToday: 0,
      totalInput: 0,
      totalOutput: 0
    }
  });

  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [testingAi, setTestingAi] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState({
    ai_provider: 'openai' as 'openai' | 'google',
    ai_api_key: '',
    ai_model: 'gpt-4o',
    ai_system_prompt: '',
    ai_temperature: 0.7,
    ai_max_tokens: 1000,
    ai_spend_limit: 10.0,
    ai_default_enabled: true,
    ai_source_mode: 'saas_ai' as 'own_api' | 'saas_ai',
    ai_own_enabled: false,
    ai_saas_enabled: true,
    saas_free_replies_used: 0,
    saas_free_replies_limit: 10,
    saas_wallet_balance_inr: 0,
    saas_wallet_currency: 'INR' as 'INR',
    saas_block_reason: null as string | null,
  });

  const [payuModalOpen, setPayuModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(99);
  const [customRechargeAmount, setCustomRechargeAmount] = useState<string>('');

  const isSaasMode = config.ai_source_mode === 'saas_ai';
  const freeLimit = Number(config.saas_free_replies_limit || 10);
  const freeUsed = Number(config.saas_free_replies_used || 0);
  const freeExhausted = isSaasMode && freeUsed >= freeLimit;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages, testingAi]);

  useEffect(() => {
    async function loadConfig() {
      if (!user) return;
      try {
        const res = await fetch(`/api/user/update-ai-config?uid=${user.uid}`);
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();

        setConfig(prev => ({
          ...prev,
          ai_provider: data.ai_provider || 'openai',
          ai_api_key: data.ai_api_key || '',
          ai_model: data.ai_model || (data.ai_provider === 'google' ? 'gemini-2.0-flash' : 'gpt-4o'),
          ai_system_prompt: data.ai_system_prompt || 'You are a CEO of a modern tech agency. Your tone is bold and direct. Focus on helping clients with effective solutions. You represent the brand "Solid Models".',
          ai_temperature: data.ai_temperature || 0.7,
          ai_max_tokens: data.ai_max_tokens || 1000,
          ai_spend_limit: data.ai_spend_limit || 10.0,
          ai_default_enabled: data.ai_default_enabled ?? true,
          ai_source_mode: data.ai_source_mode || 'saas_ai',
          ai_own_enabled: data.ai_own_enabled ?? !!data.ai_api_key,
          ai_saas_enabled: data.ai_saas_enabled ?? true,
          saas_free_replies_used: data.saas_free_replies_used || 0,
          saas_free_replies_limit: data.saas_free_replies_limit || 10,
          saas_wallet_balance_inr: data.saas_wallet_balance_inr || 0,
          saas_wallet_currency: data.saas_wallet_currency || 'INR',
          saas_block_reason: data.saas_block_reason || null,
        }));
      } catch (error) {
        console.error('Config load failed:', error);
      } finally {
        setFetching(false);
      }
    }
    loadConfig();
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (freeExhausted && Number(config.saas_wallet_balance_inr || 0) <= 0) {
      setPayuModalOpen(true);
    }
  }, [freeExhausted, config.saas_wallet_balance_inr]);

  async function fetchStats() {
    if (!user) return;
    try {
      const res = await fetch('/api/user/billing-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    if (config.ai_source_mode === 'own_api' && !config.ai_api_key?.trim()) {
      toast.error('Own API selected but API Key is missing!');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user/update-ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, ...config })
      });
      if (!res.ok) throw new Error('Failed to update config');
      toast.success('AI Brain updated successfully! 🧠');
    } catch (error) {
      toast.error('Failed to save AI settings.');
    } finally {
      setLoading(false);
    }
  };

  const applyQuickRecharge = (amount: number) => {
    setRechargeAmount(amount);
    setCustomRechargeAmount('');
  };

  const applyCustomRecharge = () => {
    const parsed = Number(customRechargeAmount);
    if (!parsed || parsed < 99) {
      toast.error('Minimum recharge is ₹99.');
      return;
    }
    setRechargeAmount(parsed);
  };

  const openPayUComingSoon = async () => {
    if (!user) return;
    if (!rechargeAmount || rechargeAmount < 99) {
      toast.error('Recharge amount minimum ₹99.');
      return;
    }
    setPayuModalOpen(true);
  };

  const handleSyncPrices = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch('/api/user/sync-pricing', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      toast.success(data.message || 'Prices updated! 🚀');
      fetchStats();
    } catch (e) {
      toast.error('Sync failed.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !testInput.trim()) return;

    const newMessage = { role: 'user' as const, content: testInput };
    setTestMessages(prev => [...prev, newMessage]);
    setTestInput('');
    setTestingAi(true);

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid,
          provider: config.ai_provider,
          apiKey: config.ai_api_key,
          model: config.ai_model,
          systemPrompt: config.ai_system_prompt,
          temperature: config.ai_temperature,
          maxTokens: config.ai_max_tokens,
          messages: testMessages,
          input: newMessage.content,
          sourceMode: config.ai_source_mode
        })
      });

      setTimeout(fetchStats, 2000);

      const data = await res.json();
      if (!res.ok || data.ok === false || data.error) throw new Error(data.error || 'API Request Failed');

      setTestMessages(prev => [...prev, { role: 'ai', content: data.text }]);
    } catch (error: any) {
      setTestMessages(prev => [...prev, { role: 'ai', content: `[ERROR] ${error.message}` }]);
    } finally {
      setTestingAi(false);
    }
  };

  if (fetching) return <div className="h-full flex items-center justify-center"><Loader2 className="w-12 h-12 text-brand-gold animate-spin" /></div>;

  return (
    <div className="max-w-[1600px] mx-auto w-full lg:px-12 h-full animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col space-y-10 pb-20">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            AI <span className="text-brand-gold">Config</span>
          </h1>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                <Cpu size={12} className="text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Processor Online</span>
             </div>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] opacity-70">Neural Infrastructure Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <Button
             variant="brand"
             onClick={handleSave}
             disabled={loading}
             className="h-14 px-10 rounded-[1.8rem] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[11px] gap-3 shadow-2xl shadow-slate-900/10 transition-all active:scale-95 group"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />}
             Commit Changes
           </Button>
        </div>
      </div>

      {/* Source Banner */}
      <div className={cn(
        'w-full rounded-[2rem] border px-8 py-5 flex flex-wrap items-center justify-between gap-4 transition-all duration-500',
        isSaasMode ? 'bg-blue-50/50 border-blue-100 shadow-sm' : 'bg-emerald-50/50 border-emerald-100 shadow-sm'
      )}>
        <div className="flex items-center gap-6">
           <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", isSaasMode ? "bg-blue-500" : "bg-emerald-500")}>
              {isSaasMode ? <Zap size={24} /> : <ShieldCheck size={24} />}
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-900 mb-0.5">
               {isSaasMode ? 'SaaS Managed Intelligence (Active)' : 'Enterprise API Node (Active)'}
             </p>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
               {isSaasMode
                 ? `Engine: Google • Mode: Multi-Cluster • Free: ${freeUsed}/${freeLimit} • Balance: ₹${Number(config.saas_wallet_balance_inr || 0).toFixed(2)}`
                 : `Provider: ${config.ai_provider} • Model: ${config.ai_model} • User-Controlled API Node.`}
             </p>
           </div>
        </div>
        {freeExhausted && Number(config.saas_wallet_balance_inr || 0) <= 0 && (
          <Button type="button" variant="brand" onClick={() => setPayuModalOpen(true)} className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-brand-gold shadow-lg shadow-slate-900/20">
            Recharge Wallet
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left Column: ALL Settings */}
        <div className="lg:col-span-8 flex flex-col gap-8 overflow-y-auto pr-2 pb-12 custom-scrollbar">

          {/* Billing & Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 shrink-0">
            {[
              { label: 'Hour Window', value: stats.last1h, icon: History, color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: 'Today Total', value: stats.today, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: 'Weekly Cycle', value: stats.last7, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Monthly Cycle', value: stats.last30, icon: PieChart, color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { label: 'Total Volume', value: stats.allTime, icon: Activity, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col items-center text-center space-y-1 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-100 transition-all duration-500">
                 <div className={cn("absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-20 transition-all duration-700 group-hover:scale-150", item.bg)} />
                 <item.icon className={cn("w-4 h-4 mb-2", item.color)} />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.label}</span>
                 <span className="text-xl font-black text-slate-900 tracking-tighter leading-none pt-1">
                   ${item.value.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                 </span>
              </div>
            ))}
          </div>

          {/* Pricing & Sync */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
            <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center justify-between group">
               <div className="flex items-center gap-6">
                 <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-brand-gold transition-colors duration-500">
                    <Zap size={28} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pricing / 1M Tokens</p>
                    <div className="flex items-center gap-3">
                       <p className="text-lg font-black text-slate-900">In: <span className="text-brand-gold">${stats.pricing?.[config.ai_model.replace('models/', '')]?.prompt || '0.00'}</span></p>
                       <div className="w-1 h-1 rounded-full bg-slate-200" />
                       <p className="text-lg font-black text-slate-900">Out: <span className="text-brand-gold">${stats.pricing?.[config.ai_model.replace('models/', '')]?.completion || '0.00'}</span></p>
                    </div>
                 </div>
               </div>
               <button 
                onClick={handleSyncPrices}
                disabled={syncLoading}
                className="p-4 bg-slate-50 text-slate-400 hover:text-brand-gold hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all shadow-sm active:scale-90"
               >
                 {syncLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw size={20} />}
               </button>
            </div>

            <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl flex items-center justify-between text-white relative overflow-hidden">
               <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-gold/10 rounded-full blur-3xl" />
               <div className="flex items-center gap-6 relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-brand-gold">
                    <Bot size={28} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Active Neural Engine</p>
                    <p className="text-lg font-black text-white uppercase tracking-tighter">{config.ai_provider} <span className="text-brand-gold">Online</span></p>
                 </div>
               </div>
               <div className="text-right relative z-10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Lifetime Activity</p>
                  <p className="text-base font-black text-slate-300 tracking-tighter">{((stats.breakdown.totalInput + stats.breakdown.totalOutput) / 1000).toFixed(1)}k Tokens</p>
               </div>
            </div>
          </div>

          {/* Intelligence Provider Card */}
          <Card className="border-slate-100 shadow-xl rounded-[3rem] shrink-0 overflow-hidden bg-white">
            <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between border-b border-slate-50">
               <div className="space-y-1">
                  <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                    <Cpu className="w-6 h-6 text-brand-gold" /> Intelligence Matrix
                  </CardTitle>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Core Engine Provider</p>
               </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'openai', name: 'OpenAI Enterprise', icon: Sparkles, color: 'bg-slate-900', text: 'text-brand-gold' },
                  { id: 'google', name: 'Google Deepmind', icon: Zap, color: 'bg-blue-600', text: 'text-white' }
                ].map((p) => (
                  <button
                    key={p.id}
                    disabled={isSaasMode}
                    onClick={() => setConfig({
                      ...config,
                      ai_provider: p.id as any,
                      ai_model: p.id === 'openai' ? 'gpt-4o' : 'gemini-2.0-flash'
                    })}
                    className={cn(
                      "p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col items-center gap-4 group relative overflow-hidden",
                      config.ai_provider === p.id
                        ? "border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/20"
                        : "border-slate-100 bg-slate-50/50 hover:border-brand-gold/30",
                      isSaasMode && 'opacity-40 cursor-not-allowed grayscale'
                    )}
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-6",
                      config.ai_provider === p.id ? "bg-white/10 text-brand-gold" : "bg-white text-slate-300"
                    )}>
                      <p.icon size={32} />
                    </div>
                    <span className={cn(
                      "text-[11px] font-black uppercase tracking-[0.2em] transition-colors",
                      config.ai_provider === p.id ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                    )}>{p.name}</span>
                  </button>
                ))}
              </div>

              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-10", isSaasMode && "opacity-40 pointer-events-none")}>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <Key className="w-4 h-4 text-brand-gold" />
                     <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Authentication Node</label>
                  </div>
                  <div className="relative group">
                    <Input
                      type="password"
                      placeholder={isSaasMode ? 'System Managed Key' : 'Enter API Node Key...'}
                      className="h-16 pl-6 pr-6 bg-slate-50 border-slate-100 rounded-[1.5rem] font-mono text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-gold/30 transition-all shadow-sm"
                      value={config.ai_api_key}
                      disabled={isSaasMode}
                      onChange={(e) => setConfig({ ...config, ai_api_key: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <Settings2 className="w-4 h-4 text-brand-gold" />
                     <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Neural Persona / Instructions</label>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="e.g. You are a CEO of a modern tech agency..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] p-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-brand-gold/30 outline-none transition-all resize-none shadow-sm leading-relaxed"
                    value={config.ai_system_prompt}
                    onChange={(e) => setConfig({ ...config, ai_system_prompt: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Source & Wallet Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0">
             {/* Source Control */}
             <Card className="border-slate-100 shadow-xl rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                   <CardTitle className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-brand-gold" /> Source Protocol
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                   <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setConfig({ ...config, ai_source_mode: 'own_api', ai_own_enabled: true })}
                        className={cn(
                          'p-6 rounded-[1.5rem] border text-left transition-all duration-300 flex items-center gap-4',
                          config.ai_source_mode === 'own_api' ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'border-slate-100 bg-slate-50/50 hover:border-brand-gold/30'
                        )}
                      >
                        <ShieldCheck size={20} className={config.ai_source_mode === 'own_api' ? "text-brand-gold" : "text-slate-300"} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Direct API Node</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Use your own private keys</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, ai_source_mode: 'saas_ai', ai_saas_enabled: true })}
                        className={cn(
                          'p-6 rounded-[1.5rem] border text-left transition-all duration-300 flex items-center gap-4',
                          config.ai_source_mode === 'saas_ai' ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'border-slate-100 bg-slate-50/50 hover:border-brand-gold/30'
                        )}
                      >
                        <Zap size={20} className={config.ai_source_mode === 'saas_ai' ? "text-brand-gold" : "text-slate-300"} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Managed Cluster</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Solid Models infrastructure</p>
                        </div>
                      </button>
                   </div>
                </CardContent>
             </Card>

             {/* Wallet & Recharge */}
             <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[3rem] space-y-6 relative overflow-hidden group shadow-sm flex flex-col justify-between">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-200/20 blur-[100px] group-hover:scale-150 transition-all duration-700" />
                <div className="space-y-4 relative z-10">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Wallet size={20} className="text-emerald-600" />
                         <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">SaaS Credits</span>
                      </div>
                      <span className="text-[9px] font-black text-emerald-700 uppercase">Min Recharge ₹99</span>
                   </div>
                   <div className="flex gap-2">
                      {[99, 299, 999].map(amt => (
                        <button key={amt} onClick={() => applyQuickRecharge(amt)} className="flex-1 py-3 bg-white border border-emerald-100 rounded-xl text-[10px] font-black text-emerald-600 uppercase transition-all active:scale-95 shadow-sm hover:border-emerald-300">₹{amt}</button>
                      ))}
                   </div>
                   <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="Custom..." 
                        value={customRechargeAmount} 
                        onChange={e => setCustomRechargeAmount(e.target.value)} 
                        className="h-12 bg-white rounded-xl text-xs font-black" 
                      />
                      <button onClick={applyCustomRecharge} className="px-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Apply</button>
                   </div>
                </div>
                <Button onClick={openPayUComingSoon} className="h-14 w-full bg-slate-900 hover:bg-slate-800 text-brand-gold font-black uppercase tracking-widest text-[11px] rounded-[1.5rem] relative z-10 shadow-2xl shadow-emerald-500/10">
                   Top Up Wallet (₹{rechargeAmount})
                </Button>
             </div>
          </div>
        </div>

        {/* Right Column: Embedded Simulator */}
        <div className="lg:col-span-4 h-full hidden lg:flex flex-col bg-white border border-slate-100 shadow-2xl rounded-[3rem] overflow-hidden sticky top-8">
          {/* Header */}
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-brand-gold shadow-lg shadow-slate-900/10">
                <Bot size={24} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Neural Simulator</h4>
                <div className="flex items-center gap-2 mt-0.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Active Debug Mode</p>
                </div>
              </div>
            </div>
            <button className="p-2 bg-white text-slate-300 hover:text-slate-900 transition-colors">
               <Info size={18} />
            </button>
          </div>

          {/* Chat Window */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20 custom-scrollbar">
            {testMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300">
                  <MessageSquare size={32} />
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Embedded Sandbox</p>
                   <p className="text-[11px] font-medium text-slate-500 max-w-[180px]">Test your persona changes in real-time before saving.</p>
                </div>
              </div>
            ) : (
              testMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "px-6 py-4 rounded-[1.8rem] text-[13px] font-medium leading-relaxed shadow-sm max-w-[85%]",
                    msg.role === 'user'
                      ? "bg-slate-900 text-white rounded-br-none"
                      : "bg-white border border-slate-100 text-slate-700 rounded-bl-none",
                  )}>
                    <MarkdownText content={msg.content} />
                  </div>
                </div>
              ))
            )}
            {testingAi && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce delay-150"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce delay-300"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-8 bg-white shrink-0 border-t border-slate-50">
            <form onSubmit={handleTestSubmit} className="relative flex items-center gap-3">
              <input
                type="text"
                placeholder="Message Neural Simulator..."
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                className="flex-1 h-16 pl-6 pr-14 bg-slate-50 border border-slate-100 focus:bg-white focus:border-brand-gold/30 rounded-[1.5rem] text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none transition-all shadow-sm"
                disabled={testingAi}
              />
              <button
                type="submit"
                disabled={!testInput.trim() || testingAi}
                className="absolute right-2 w-12 h-12 bg-slate-900 text-brand-gold rounded-2xl flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-800 transition-all active:scale-90 shadow-xl shadow-slate-900/20"
              >
                <Send size={20} />
              </button>
            </form>
            <p className="text-[8px] font-black text-slate-300 uppercase text-center mt-4 tracking-widest">Responses are generated using {config.ai_model}</p>
          </div>
        </div>
      </div>

      {/* PayU Modal */}
      {payuModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 space-y-8"
          >
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500">
                  <ShieldCheck size={40} />
               </div>
               <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Secure Payment</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Feature implementation in progress</p>
               </div>
            </div>
            
            <div className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100">
               <p className="text-xs font-bold text-slate-600 text-center">Contact support for manual recharge during beta.</p>
               <div className="grid grid-cols-2 gap-3">
                  <a href="tel:8302806913" className="h-14 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95">
                    <Phone size={14} /> Call Hub
                  </a>
                  <a href="https://wa.me/918302806913" target="_blank" rel="noreferrer" className="h-14 rounded-2xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all active:scale-95">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
               </div>
            </div>

            <Button type="button" variant="secondary" onClick={() => setPayuModalOpen(false)} className="h-14 w-full rounded-2xl text-[11px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 border-none">
              Dismiss
            </Button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
