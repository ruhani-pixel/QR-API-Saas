'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Paperclip, 
  Image as ImageIcon, Video, FileText, 
  MapPin, Mic, Send, MoreVertical, 
  CheckCheck, ChevronLeft, Building2,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InboxPage() {
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  const devices = [
    { id: 'all', name: 'All Devices', count: 47 },
    { id: 'm01-s1', name: 'M-01 SIM1', count: 12 },
    { id: 'm01-s2', name: 'M-01 SIM2', count: 5 },
    { id: 'm02-s1', name: 'M-02 SIM1', count: 30 },
  ];

  const chats = [
    { id: '1', name: 'Rahul Kumar', lastMsg: 'Bhai order kab aayega?', time: '2m', unread: true, device: 'M-01 SIM1', avatar: 'RK' },
    { id: '2', name: 'Priya Sharma', lastMsg: 'Photo bhejo please', time: '5m', unread: false, device: 'M-01 SIM2', avatar: 'PS' },
    { id: '3', name: 'Amit Verma', lastMsg: 'Haan confirm hai, kal milte hain', time: '12m', unread: false, device: 'M-02 SIM1', avatar: 'AV' },
    { id: '4', name: 'Vikas Tech', lastMsg: 'Payment received! ✅', time: '1h', unread: false, device: 'M-01 SIM1', avatar: 'VT' },
  ];

  const messages = [
    { id: '1', text: 'Bhai order kab aayega?', time: '10:23 AM', sender: 'them' },
    { id: '2', text: 'Kal tak ho jaega, tension mat lo.', time: '10:25 AM', sender: 'me', status: 'read' },
    { id: '3', text: 'Okay thanks 🙏', time: '10:26 AM', sender: 'them' },
  ];

  return (
    <div className="h-[calc(100vh-2rem)] m-4 glass-card overflow-hidden flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        
        {/* PANEL 1: DEVICES (FILTER) */}
        <div className="w-20 lg:w-64 border-r border-slate-800/50 flex flex-col bg-slate-950/20">
          <div className="p-6 border-b border-slate-800/50">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] hidden lg:block">Channels</h2>
            <Building2 className="lg:hidden text-slate-500" size={20} />
          </div>
          <div className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-1 custom-scrollbar">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => setSelectedDevice(device.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group",
                  selectedDevice === device.id ? "bg-amber-500/10 text-amber-500" : "text-slate-500 hover:bg-slate-900"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                  selectedDevice === device.id ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20" : "bg-slate-900 border border-slate-800"
                )}>
                  <span className="text-[10px] font-black">{device.id === 'all' ? '∞' : device.id.split('-')[1].toUpperCase()}</span>
                </div>
                <div className="hidden lg:flex flex-col items-start overflow-hidden">
                  <span className="text-xs font-bold truncate w-full">{device.name}</span>
                  <span className="text-[10px] font-medium text-slate-600">{device.count} chats</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PANEL 2: CONVERSATIONS (CHAT LIST) */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r border-slate-800/50 flex flex-col bg-slate-950/10",
          !isMobileListOpen && "hidden md:flex"
        )}>
          <div className="p-6 space-y-4 border-b border-slate-800/50">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Inbox</h2>
              <div className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-1 rounded-lg animate-pulse">47 NEW</div>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-amber-500/30 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => { setSelectedChat(chat); setIsMobileListOpen(false); }}
                className={cn(
                  "w-full p-5 flex gap-4 transition-all hover:bg-slate-900/50 border-b border-slate-900/50 group relative",
                  selectedChat?.id === chat.id && "bg-slate-900/80"
                )}
              >
                {selectedChat?.id === chat.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                )}
                <div className="relative">
                   <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-sm font-black text-white group-hover:bg-slate-700 transition-colors">
                    {chat.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-950 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="flex-1 text-left space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-white">{chat.name}</span>
                    <span className="text-[10px] font-bold text-slate-600">{chat.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate w-48 leading-relaxed">{chat.lastMsg}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">{chat.device}</span>
                    {chat.unread && <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PANEL 3: CHAT WINDOW */}
        <div className={cn(
          "flex-1 flex flex-col bg-slate-950/5",
          isMobileListOpen && "hidden md:flex"
        )}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsMobileListOpen(true)} className="md:hidden p-2 text-slate-500">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
                    {selectedChat.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{selectedChat.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                        <Circle size={6} fill="currentColor" /> Online
                      </span>
                      <span className="text-slate-700">•</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">via {selectedChat.device}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                    <Search size={18} />
                   </button>
                   <button className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                    <MoreVertical size={18} />
                   </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.sender === 'me' ? "ml-auto items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-3xl text-sm leading-relaxed shadow-xl",
                      msg.sender === 'me' 
                        ? "bg-amber-500 text-slate-950 rounded-tr-none font-medium" 
                        : "bg-slate-900 border border-slate-800 text-white rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-2 mt-2 px-2">
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{msg.time}</span>
                      {msg.sender === 'me' && <CheckCheck size={12} className="text-amber-600" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-slate-900/40 border-t border-slate-800/50">
                <div className="flex items-end gap-4 max-w-5xl mx-auto">
                  <div className="flex items-center gap-1 mb-2">
                    <button className="p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all">
                      <Paperclip size={20} />
                    </button>
                    <button className="p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all">
                      <Mic size={20} />
                    </button>
                  </div>
                  
                  <div className="flex-1 relative">
                    <textarea 
                      placeholder="Type your message..."
                      rows={1}
                      className="w-full bg-slate-950 border border-slate-800 rounded-3xl py-4 px-6 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all resize-none overflow-hidden"
                      style={{ minHeight: '52px' }}
                    />
                  </div>

                  <button className="h-[52px] w-[52px] flex-shrink-0 premium-gradient rounded-full flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 active:scale-90 transition-all">
                    <Send size={20} fill="currentColor" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-20">
               <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                 <Inbox size={48} className="text-slate-500" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-black text-white uppercase tracking-tighter">Select a Conversation</h3>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pick a node or chat to start management</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
