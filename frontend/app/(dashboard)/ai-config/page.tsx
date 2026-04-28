'use client';

import { Sparkles, Clock, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIConfigPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-8 bg-[#F8FAFC]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-[3rem] p-16 shadow-2xl border border-slate-100 text-center relative overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-60" />

        <div className="relative z-10 space-y-10">
          {/* Icon Section */}
          <div className="relative inline-block">
             <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 animate-pulse">
                <Sparkles size={48} className="fill-current" />
             </div>
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute -inset-4 border-2 border-dashed border-indigo-100 rounded-full"
             />
          </div>

          {/* Text Section */}
          <div className="space-y-4">
             <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                AI Feature <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                   Coming Soon
                </span>
             </h1>
             <p className="text-slate-400 font-bold text-lg max-w-md mx-auto leading-relaxed">
                We're engineering a next-generation neural engine for your WhatsApp nodes. Real-time intelligence is just around the corner.
             </p>
          </div>

          {/* Status Tags */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
             <div className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 rounded-full border border-indigo-100">
                <Clock size={18} className="text-indigo-500" />
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Under Development</span>
             </div>
             <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 rounded-full border border-emerald-100">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Enterprise Ready</span>
             </div>
             <div className="flex items-center gap-2 px-6 py-2.5 bg-amber-50 rounded-full border border-amber-100">
                <Zap size={18} className="text-amber-500" />
                <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Ultra Low Latency</span>
             </div>
          </div>

          <div className="pt-10">
             <div className="h-px bg-slate-100 w-full mb-8" />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                Solid Models AI Infrastructure v2.0
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
