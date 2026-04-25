'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Search, Paperclip, 
  Mic, Send, MoreVertical, 
  CheckCheck, ChevronLeft, Building2,
  Circle, Inbox, User, Bot,
  Phone, Video, ShieldCheck,
  Filter, Plus, Smile,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

export default function InboxPage() {
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const devices = [
    { id: 'all', name: 'All Clusters', count: 47 },
    { id: 'm01-s1', name: 'M-01 SIM1', count: 12 },
    { id: 'm01-s2', name: 'M-01 SIM2', count: 5 },
    { id: 'm02-s1', name: 'M-02 SIM1', count: 30 },
  ];

  const chats = [
    { id: '1', name: 'Rahul Kumar', lastMsg: 'Bhai order kab aayega?', time: '2m', unread: true, device: 'M-01 SIM1', avatar: 'RK', status: 'online' },
    { id: '2', name: 'Priya Sharma', lastMsg: 'Photo bhejo please', time: '5m', unread: false, device: 'M-01 SIM2', avatar: 'PS', status: 'offline' },
    { id: '3', name: 'Amit Verma', lastMsg: 'Haan confirm hai, kal milte hain', time: '12m', unread: false, device: 'M-02 SIM1', avatar: 'AV', status: 'online' },
    { id: '4', name: 'Vikas Tech', lastMsg: 'Payment received! ✅', time: '1h', unread: false, device: 'M-01 SIM1', avatar: 'VT', status: 'offline' },
    { id: '5', name: 'Suresh Raina', lastMsg: 'Bhai check karo update.', time: '2h', unread: true, device: 'M-02 SIM1', avatar: 'SR', status: 'online' },
  ];

  const messages = [
    { id: '1', text: 'Bhai order kab aayega?', time: '10:23 AM', sender: 'them' },
    { id: '2', text: 'Kal tak ho jaega, tension mat lo. Hamari team kaam kar rahi hai.', time: '10:25 AM', sender: 'me', status: 'read' },
    { id: '3', text: 'Okay thanks 🙏. Best service.', time: '10:26 AM', sender: 'them' },
    { id: '4', text: 'Aur haan, discount code bhi apply kar dena next time.', time: '10:27 AM', sender: 'them' },
    { id: '5', text: 'Sure, hum check karte hain.', time: '10:30 AM', sender: 'me', status: 'delivered' },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat]);

  return (
    <div className="h-screen w-full flex animate-in fade-in zoom-in duration-700 p-2 lg:p-4">
      <div className="flex-1 bg-white border border-slate-100 rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex selection:bg-brand-gold/20">
      
      {/* Left Panel: Chat List */}
      <div className={cn(
        "w-full md:w-[380px] lg:w-[420px] flex flex-col border-r border-slate-50 transition-all duration-500",
        selectedChat && "hidden md:flex"
      )}>
        {/* Chat List Header */}
        <div className="p-8 pb-4 space-y-6">
           <div className="flex items-center justify-between">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Messages</h1>
              <button className="w-10 h-10 rounded-xl bg-slate-900 text-brand-gold flex items-center justify-center shadow-lg shadow-slate-900/10 active:scale-95 transition-all">
                <Plus size={20} />
              </button>
           </div>

           {/* Device Filter Strip */}
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {devices.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDevice(d.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                    selectedDevice === d.id 
                      ? "bg-slate-900 text-brand-gold border-slate-900 shadow-lg shadow-slate-900/10" 
                      : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                  )}
                >
                  {d.name} <span className="opacity-40 ml-1">{d.count}</span>
                </button>
              ))}
           </div>

           {/* Search Bar */}
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-gold transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-brand-gold/30 transition-all shadow-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        {/* Chat List Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-1 custom-scrollbar">
           {chats.map(chat => (
             <button
               key={chat.id}
               onClick={() => setSelectedChat(chat)}
               className={cn(
                 "w-full flex items-center gap-4 p-4 rounded-[2rem] transition-all duration-300 group relative",
                 selectedChat?.id === chat.id 
                   ? "bg-slate-50 shadow-sm" 
                   : "hover:bg-slate-50/50"
               )}
             >
                {selectedChat?.id === chat.id && (
                  <motion.div layoutId="active-chat" className="absolute left-0 w-1.5 h-10 bg-brand-gold rounded-full" />
                )}
                
                <div className="relative shrink-0">
                   <Avatar name={chat.avatar} size="md" className="shadow-md" />
                   <div className={cn(
                     "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                     chat.status === 'online' ? "bg-emerald-500" : "bg-slate-300"
                   )} />
                </div>

                <div className="flex-1 text-left min-w-0">
                   <div className="flex justify-between items-end mb-1">
                      <span className="text-[13px] font-black text-slate-900 truncate tracking-tight">{chat.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{chat.time}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <p className={cn(
                        "text-[11px] truncate leading-tight",
                        chat.unread ? "font-black text-slate-900" : "font-medium text-slate-400"
                      )}>{chat.lastMsg}</p>
                      {chat.unread && (
                        <div className="w-2 h-2 rounded-full bg-brand-gold shadow-lg shadow-brand-gold/40" />
                      )}
                   </div>
                   <div className="flex items-center gap-1.5 mt-1.5">
                      <Building2 size={10} className="text-slate-300" />
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{chat.device}</span>
                   </div>
                </div>
             </button>
           ))}
        </div>
      </div>

      {/* Right Panel: Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-slate-50/20 relative",
        !selectedChat && "hidden md:flex items-center justify-center"
      )}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-6 md:p-8 bg-white border-b border-slate-50 flex items-center justify-between z-10">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-2 text-slate-400 hover:text-slate-900"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="relative">
                    <Avatar name={selectedChat.avatar} size="md" />
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                      selectedChat.status === 'online' ? "bg-emerald-500" : "bg-slate-300"
                    )} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1.5">{selectedChat.name}</h2>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", selectedChat.status === 'online' ? "bg-emerald-500" : "bg-slate-400")} />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedChat.status === 'online' ? 'Active Sync' : 'Last Seen: 2h ago'}</span>
                       </div>
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Via {selectedChat.device}</span>
                    </div>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  {[Phone, Video, Search, MoreVertical].map((Icon, i) => (
                    <button key={i} className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all active:scale-90">
                      <Icon size={20} />
                    </button>
                  ))}
               </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
               {/* Date Separator */}
               <div className="flex items-center justify-center">
                  <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm">Today, April 25</span>
               </div>

               {messages.map((msg, i) => (
                 <div key={i} className={cn(
                   "flex flex-col max-w-[80%] md:max-w-[70%] lg:max-w-[60%]",
                   msg.sender === 'me' ? "ml-auto items-end" : "mr-auto items-start"
                 )}>
                    <div className={cn(
                      "px-6 py-4 text-[13px] font-medium leading-relaxed shadow-sm transition-all duration-300 hover:shadow-md",
                      msg.sender === 'me' 
                        ? "bg-slate-900 text-white rounded-[1.8rem] rounded-tr-none" 
                        : "bg-white border border-slate-100 text-slate-700 rounded-[1.8rem] rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-2 mt-2 px-1">
                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{msg.time}</span>
                       {msg.sender === 'me' && (
                         <CheckCheck size={12} className={cn(msg.status === 'read' ? "text-brand-gold" : "text-slate-300")} />
                       )}
                    </div>
                 </div>
               ))}
               <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="p-8 bg-white border-t border-slate-50">
               <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-2 flex items-center gap-2 group focus-within:border-brand-gold/30 focus-within:bg-white transition-all shadow-sm">
                  <div className="flex items-center">
                     <button className="p-3 text-slate-400 hover:text-brand-gold transition-colors">
                        <Paperclip size={20} />
                     </button>
                     <button className="p-3 text-slate-400 hover:text-brand-gold transition-colors">
                        <Smile size={20} />
                     </button>
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Write a secure message..." 
                    className="flex-1 bg-transparent border-none text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none py-2 px-2"
                  />

                  <div className="flex items-center gap-2 pr-1">
                     <button className="p-3 text-slate-400 hover:text-slate-900 transition-colors">
                        <Mic size={20} />
                     </button>
                     <button className="w-12 h-12 bg-slate-900 text-brand-gold rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20 active:scale-90 transition-all">
                        <Send size={20} />
                     </button>
                  </div>
               </div>
               <div className="flex items-center justify-center mt-4 gap-4 opacity-50">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={10} className="text-emerald-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bot size={10} className="text-brand-gold" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">AI Agent: Engaged</span>
                  </div>
               </div>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6 max-w-sm animate-in fade-in zoom-in duration-700">
             <div className="relative">
                <div className="absolute inset-0 bg-brand-gold/20 blur-3xl rounded-full" />
                <div className="relative w-32 h-32 bg-white border border-slate-100 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl">
                   <Inbox size={48} strokeWidth={1} className="text-slate-200" />
                </div>
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Cluster Hub</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                   Select a conversation from your connected <span className="text-brand-gold">SIM Nodes</span> to start secure communication.
                </p>
             </div>
             <div className="flex flex-wrap justify-center gap-2 pt-4">
                {['Direct Reply', 'AI Assistant', 'Bulk Response'].map(f => (
                  <span key={f} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">{f}</span>
                ))}
             </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
