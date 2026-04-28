'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Bot, Smartphone, Save, Play, Send, Sparkles, 
  ChevronRight, Cpu, ShieldCheck, Zap, MessageSquare,
  AlertCircle, CheckCircle2, Loader2, User, Brain,
  Users, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import { API_URL } from '@/lib/apiConfig';

// UNIFIED BRAND COLORS
const BRAND = {
  primary: '#FF5F38',
  primaryLight: '#FF7E5F',
  accent: '#FF5F38',
  bg: '#F8FAFC',
  slate900: '#0F172A'
};

interface Device {
  sessionId: string;
  name?: string;
  status?: string;
  aiEnabled?: boolean;
  aiInstructions?: string;
  aiReplyNewUsers?: boolean;
  aiReplyExistingUsers?: boolean;
}

export default function AIConfigPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedNode, setSelectedNode] = useState<Device | null>(null);
  const [instructions, setInstructions] = useState('');
  const [originalInstructions, setOriginalInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testChat, setTestChat] = useState<any[]>([]);
  
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiReplyNewUsers, setAiReplyNewUsers] = useState(true);
  const [aiReplyExistingUsers, setAiReplyExistingUsers] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedNode) {
      setInstructions(selectedNode.aiInstructions || '');
      setOriginalInstructions(selectedNode.aiInstructions || '');
      setAiEnabled(selectedNode.aiEnabled || false);
      setAiReplyNewUsers(selectedNode.aiReplyNewUsers ?? true);
      setAiReplyExistingUsers(selectedNode.aiReplyExistingUsers ?? true);
    }
  }, [selectedNode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testChat]);

  const fetchDevices = async () => {
    const res = await fetch(`${API_URL}/api/sessions`);
    const data = await res.json();
    setDevices(data);
    if (data.length > 0 && !selectedNode) setSelectedNode(data[0]);
  };

  const handleSave = async () => {
    if (!selectedNode) return;
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/api/ai/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: selectedNode.sessionId, 
          aiEnabled, 
          aiInstructions: instructions,
          aiReplyNewUsers,
          aiReplyExistingUsers
        })
      });
      setOriginalInstructions(instructions);
      fetchDevices();
    } catch (e) { console.error(e); }
    setIsSaving(false);
  };

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    const msg = testMessage;
    setTestMessage('');
    setTestChat(prev => [...prev, { role: 'user', content: msg }]);
    setIsTesting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/ai/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           instructions, 
           message: msg,
           history: testChat.slice(-10)
        })
      });
      const data = await res.json();
      setTestChat(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (e) {
      setTestChat(prev => [...prev, { role: 'ai', content: '⚠️ Error connecting to Gemini.' }]);
    }
    setIsTesting(false);
  };

  const hasChanges = instructions !== originalInstructions || 
                     (selectedNode && (
                        aiEnabled !== selectedNode.aiEnabled ||
                        aiReplyNewUsers !== (selectedNode.aiReplyNewUsers ?? true) ||
                        aiReplyExistingUsers !== (selectedNode.aiReplyExistingUsers ?? true)
                     ));

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 p-4 overflow-hidden font-sans">
      
      {/* SECTION 1: NODE SELECTOR (LEFT) */}
      <div className="w-80 flex flex-col gap-4">
         <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 mb-8 px-2">
               <div className="w-10 h-10 bg-gradient-to-br from-[#FF7E5F] to-[#FF5F38] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                  <Smartphone size={20} />
               </div>
               <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Nodes</h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Connected Accounts</p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
               {devices.map(node => (
                  <button
                    key={node.sessionId}
                    onClick={() => setSelectedNode(node)}
                    className={cn(
                      "w-full p-4 rounded-2xl transition-all duration-300 text-left relative overflow-hidden group border",
                      selectedNode?.sessionId === node.sessionId 
                        ? "bg-slate-900 text-white shadow-xl shadow-slate-200 border-slate-900" 
                        : "bg-white text-slate-500 hover:bg-slate-50 border-slate-100"
                    )}
                  >
                    <div className="relative z-10">
                       <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-black truncate max-w-[120px]">{node.name}</span>
                          <div className={cn("w-1.5 h-1.5 rounded-full", node.status === 'online' ? "bg-emerald-500" : "bg-rose-500")} />
                       </div>
                       <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{node.sessionId}</p>
                    </div>
                  </button>
               ))}
            </div>
         </div>
      </div>

      {/* SECTION 2: BRAIN EDITOR (CENTER) */}
      <div className="flex-1 flex flex-col gap-4">
         <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-100 border border-slate-50 flex-1 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-[0.02]">
               <Brain size={400} className="text-[#FF5F38]" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-gradient-to-br from-[#FF7E5F] to-[#FF5F38] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-100">
                        <Sparkles size={28} />
                     </div>
                     <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Neural Engine</h1>
                        <div className="flex items-center gap-3 mt-3">
                           <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gemini 1.5 Flash</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <AnimatePresence>
                        {hasChanges && (
                           <motion.button
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: 10 }}
                             onClick={handleSave}
                             disabled={isSaving}
                             className="flex items-center gap-2 px-8 py-3 bg-[#FF5F38] text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-orange-100 hover:bg-[#e04a2a] transition-all disabled:opacity-50"
                           >
                              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              <span>Save Brain</span>
                           </motion.button>
                        )}
                     </AnimatePresence>
                  </div>
               </div>

               {/* Master Controls */}
               <div className="grid grid-cols-3 gap-4 mb-8">
                  <ControlCard 
                    icon={<Zap size={18} />} 
                    title="Master" 
                    desc="Overall AI" 
                    active={aiEnabled} 
                    onToggle={() => setAiEnabled(!aiEnabled)}
                    color="text-[#FF5F38]"
                    activeBg="bg-[#FF5F38]"
                  />
                  <ControlCard 
                    icon={<UserPlus size={18} />} 
                    title="New Users" 
                    desc="First Chats" 
                    active={aiReplyNewUsers} 
                    onToggle={() => setAiReplyNewUsers(!aiReplyNewUsers)}
                    color="text-emerald-500"
                    activeBg="bg-emerald-500"
                  />
                  <ControlCard 
                    icon={<Users size={18} />} 
                    title="Old Users" 
                    desc="Existing" 
                    active={aiReplyExistingUsers} 
                    onToggle={() => setAiReplyExistingUsers(!aiReplyExistingUsers)}
                    color="text-blue-500"
                    activeBg="bg-blue-500"
                  />
               </div>

               <div className="flex-1 flex flex-col relative group">
                  <div className="absolute top-4 left-6 pointer-events-none flex items-center gap-2 text-[#FF5F38]/40">
                     <Cpu size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Personality Directives</span>
                  </div>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Describe how the AI should talk..."
                    className="w-full flex-1 bg-slate-50/50 rounded-3xl p-10 pt-16 text-slate-700 text-base font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/5 border border-slate-100 transition-all resize-none leading-relaxed"
                  />
               </div>
            </div>
         </div>
      </div>

      {/* SECTION 3: SIMULATION LAB (RIGHT) */}
      <div className="w-[400px] flex flex-col gap-4">
         <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 flex-1 flex flex-col overflow-hidden relative">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center gap-4">
               <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#FF5F38]">
                  <Bot size={20} />
               </div>
               <div className="flex-1">
                  <h3 className="text-xs font-black text-slate-900 tracking-widest uppercase">Simulation Lab</h3>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Test Environment</p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/20">
               {testChat.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                     <div className={cn(
                        "max-w-[85%] px-5 py-3 rounded-2xl text-[13px] font-bold shadow-sm",
                        msg.role === 'user' 
                          ? "bg-slate-900 text-white rounded-tr-none" 
                          : "bg-white text-slate-600 border border-slate-100 rounded-tl-none"
                     )}>
                        {msg.content}
                     </div>
                  </div>
               ))}
               {isTesting && (
                  <div className="flex justify-start">
                     <div className="bg-white px-4 py-2 rounded-full border border-slate-100 flex gap-1">
                        <div className="w-1.5 h-1.5 bg-[#FF5F38] rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-[#FF5F38] rounded-full animate-bounce delay-75" />
                        <div className="w-1.5 h-1.5 bg-[#FF5F38] rounded-full animate-bounce delay-150" />
                     </div>
                  </div>
               )}
               <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-50">
               <div className="relative flex items-center gap-3 bg-slate-50 rounded-2xl p-1.5 pl-5 border border-slate-100">
                  <input 
                    type="text" 
                    value={testMessage} 
                    onChange={(e) => setTestMessage(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleTest()} 
                    placeholder="Type to test..." 
                    className="flex-1 bg-transparent border-none text-[13px] font-bold focus:outline-none placeholder:text-slate-300" 
                  />
                  <button onClick={handleTest} disabled={isTesting} className="w-9 h-9 bg-[#FF5F38] text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-[#e04a2a] transition-all active:scale-90">
                     <Send size={16} />
                  </button>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}

function ControlCard({ icon, title, desc, active, onToggle, color, activeBg }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
       <div className="flex items-center justify-between">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50", color)}>
             {icon}
          </div>
          <button 
            onClick={onToggle}
            className={cn("w-10 h-5 rounded-full relative flex items-center px-1 transition-all duration-500", active ? activeBg : "bg-slate-200")}
          >
             <motion.div animate={{ x: active ? 20 : 0 }} className="w-3 h-3 bg-white rounded-full shadow-sm" />
          </button>
       </div>
       <div>
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{title}</h3>
          <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">{desc}</p>
       </div>
    </div>
  );
}
