'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Bot, Smartphone, Save, Play, Send, Sparkles, 
  ChevronRight, Cpu, ShieldCheck, Zap, MessageSquare,
  AlertCircle, CheckCircle2, Loader2, User, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const API_URL = 'http://localhost:3001';

export default function AIConfigPage() {
  const [devices, setDevices] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [originalInstructions, setOriginalInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testChat, setTestChat] = useState([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedNode) {
      setInstructions(selectedNode.aiInstructions || '');
      setOriginalInstructions(selectedNode.aiInstructions || '');
      setAiEnabled(selectedNode.aiEnabled || false);
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
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/api/ai/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: selectedNode.sessionId, 
          aiEnabled, 
          aiInstructions: instructions 
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
        body: JSON.stringify({ instructions, message: msg })
      });
      const data = await res.json();
      setTestChat(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (e) {
      setTestChat(prev => [...prev, { role: 'ai', content: '⚠️ Error connecting to Gemini. Please check your API Key.' }]);
    }
    setIsTesting(false);
  };

  const hasChanges = instructions !== originalInstructions || (selectedNode && aiEnabled !== selectedNode.aiEnabled);

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6 p-2 overflow-hidden font-sans">
      
      {/* SECTION 1: NODE SELECTOR (LEFT) */}
      <div className="w-80 flex flex-col gap-4">
         <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 mb-8 px-2">
               <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Smartphone size={20} />
               </div>
               <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Infrastructure</h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Active Nodes</p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">
               {devices.map(node => (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={node.sessionId}
                    onClick={() => setSelectedNode(node)}
                    className={cn(
                      "w-full p-4 rounded-[1.8rem] transition-all duration-500 text-left relative overflow-hidden group",
                      selectedNode?.sessionId === node.sessionId 
                        ? "bg-slate-900 text-white shadow-2xl shadow-slate-200" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent"
                    )}
                  >
                    <div className="relative z-10">
                       <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-black truncate max-w-[120px]">{node.name}</span>
                          <div className={cn("w-2 h-2 rounded-full", node.status === 'online' ? "bg-emerald-500" : "bg-rose-500")} />
                       </div>
                       <p className={cn("text-[10px] font-bold uppercase tracking-wider opacity-60", selectedNode?.sessionId === node.sessionId ? "text-slate-400" : "text-slate-500")}>
                          {node.sessionId}
                       </p>
                       {node.aiEnabled && (
                          <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                             <Sparkles size={10} className="text-indigo-400" />
                             <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">AI Brain Active</span>
                          </div>
                       )}
                    </div>
                    {selectedNode?.sessionId === node.sessionId && (
                       <motion.div layoutId="activeGlow" className="absolute -inset-2 bg-gradient-to-br from-indigo-500/20 to-transparent blur-2xl" />
                    )}
                  </motion.button>
               ))}
            </div>
         </div>
      </div>

      {/* SECTION 2: BRAIN EDITOR (CENTER) */}
      <div className="flex-1 flex flex-col gap-4">
         <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-10 shadow-2xl shadow-slate-100 border border-slate-50 flex-1 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-5">
               <Brain size={300} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                        <Sparkles size={28} />
                     </div>
                     <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Neural Configuration</h1>
                        <div className="flex items-center gap-2 mt-2">
                           <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Gemini Flash Lite</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-50 rounded-full border border-slate-200">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Auto-Reply</span>
                        <button 
                          onClick={() => setAiEnabled(!aiEnabled)}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all duration-500 relative flex items-center px-1",
                            aiEnabled ? "bg-indigo-600" : "bg-slate-300"
                          )}
                        >
                           <motion.div 
                             animate={{ x: aiEnabled ? 24 : 0 }}
                             className="w-4 h-4 bg-white rounded-full shadow-md" 
                           />
                        </button>
                     </div>
                     <AnimatePresence>
                        {hasChanges && (
                           <motion.button
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: 1, scale: 1 }}
                             exit={{ opacity: 0, scale: 0.9 }}
                             onClick={handleSave}
                             disabled={isSaving}
                             className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                           >
                              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              <span>Push Config</span>
                           </motion.button>
                        )}
                     </AnimatePresence>
                  </div>
               </div>

               <div className="flex-1 flex flex-col relative group">
                  <div className="absolute top-4 left-6 pointer-events-none flex items-center gap-2 text-indigo-400">
                     <Cpu size={14} />
                     <span className="text-[10px] font-black uppercase tracking-widest">System Directive</span>
                  </div>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Example: You are a professional sales assistant for Solid Models. Be helpful, polite, and try to book a call..."
                    className="w-full flex-1 bg-slate-50/50 rounded-[2.5rem] p-12 pt-16 text-slate-700 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 border border-slate-100 transition-all resize-none shadow-inner leading-relaxed"
                  />
                  <div className="absolute bottom-6 right-8 flex items-center gap-6">
                     <div className="flex items-center gap-2 text-slate-300">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">End-to-End Neural Privacy</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* SECTION 3: TEST LAB (RIGHT) */}
      <div className="w-[420px] flex flex-col gap-4">
         <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex-1 flex flex-col overflow-hidden relative">
            {/* iPhone-Style Header */}
            <div className="bg-slate-50/80 backdrop-blur-md p-6 border-b border-slate-100 flex flex-col items-center gap-3">
               <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-2" />
               <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                     <Bot size={20} />
                  </div>
                  <div className="flex-1">
                     <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none">Simulation Lab</h3>
                     <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">Testing: {selectedNode?.name || 'No Node'}</p>
                  </div>
                  <button onClick={() => setTestChat([])} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                     <Zap size={18} />
                  </button>
               </div>
            </div>

            {/* Test Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/30">
               {testChat.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-20 px-10">
                     <MessageSquare size={48} className="mb-4" />
                     <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">
                        Input a message below to test your neural configuration in real-time.
                     </p>
                  </div>
               )}
               {testChat.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
                  >
                     <div className={cn(
                        "max-w-[85%] px-5 py-3.5 rounded-[1.8rem] text-sm font-medium shadow-sm",
                        msg.role === 'user' 
                          ? "bg-slate-900 text-white rounded-tr-none" 
                          : "bg-white text-slate-600 border border-slate-100 rounded-tl-none"
                     )}>
                        {msg.content}
                     </div>
                  </motion.div>
               ))}
               {isTesting && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                     <div className="bg-white px-5 py-3.5 rounded-[1.8rem] rounded-tl-none border border-slate-100 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200" />
                     </div>
                  </motion.div>
               )}
               <div ref={chatEndRef} />
            </div>

            {/* Test Input Area */}
            <div className="p-6 bg-white border-t border-slate-50">
               <div className="relative flex items-center gap-3 bg-slate-50 rounded-full p-2 pl-6 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all border border-transparent focus-within:border-indigo-100">
                  <input 
                    type="text" 
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTest()}
                    placeholder="Ask your AI bot..."
                    className="flex-1 bg-transparent border-none text-sm font-bold focus:outline-none placeholder:text-slate-300"
                  />
                  <button 
                    onClick={handleTest}
                    disabled={isTesting}
                    className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-90"
                  >
                     <Send size={16} />
                  </button>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
