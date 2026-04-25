'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Send, Paperclip, 
  MoreVertical, Phone, Video,
  Check, CheckCheck, User,
  MessageSquare, Loader2, Bot,
  ShieldCheck, Smartphone, Zap, Plus
} from 'lucide-react';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function InboxPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDevices();
    const socket = io(API_URL);

    socket.on('message:incoming', (msg) => {
      // If message is for current chat, add it
      if (selectedChat && msg.key.remoteJid === selectedChat.remoteJid) {
        const formattedMsg = {
          id: msg.key.id,
          content: msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Media]',
          direction: msg.key.fromMe ? 'outbound' : 'inbound',
          timestamp: new Date(),
          status: 'delivered'
        };
        setMessages(prev => [...prev, formattedMsg]);
      }
      // Refresh chat list to show latest message
      fetchChats();
    });

    return () => { socket.disconnect(); };
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions`);
      const data = await res.json();
      setDevices(data);
      if (data.length > 0) {
        setActiveDevice(data[0]);
        fetchChats();
      }
    } catch (e) {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    if (!activeDevice) return;
    try {
      const res = await fetch(`${API_URL}/api/messages?sessionId=${activeDevice.sessionId}`);
      const data = await res.json();
      
      const grouped = {};
      data.forEach(m => {
        if (!grouped[m.remoteJid]) {
          grouped[m.remoteJid] = {
            id: m.remoteJid,
            remoteJid: m.remoteJid,
            pushName: m.pushName || 'WhatsApp User',
            lastMessage: m.content,
            timestamp: m.timestamp,
            unread: 0
          };
        }
      });
      setChats(Object.values(grouped));
    } catch (e) {
      console.error('Fetch chats failed', e);
    }
  };

  const loadChatHistory = async (chat) => {
    setSelectedChat(chat);
    try {
      const res = await fetch(`${API_URL}/api/messages?remoteJid=${chat.remoteJid}`);
      const data = await res.json();
      // Reverse because we fetch desc but display asc
      setMessages(data.reverse());
    } catch (e) {
      toast.error('Failed to load history');
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat || !activeDevice) return;
    
    const textToSend = inputText.trim();
    setInputText('');
    
    const tempMsg = {
      id: Date.now().toString(),
      content: textToSend,
      direction: 'outbound',
      timestamp: new Date(),
      status: 'pending'
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch(`${API_URL}/api/message/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeDevice.sessionId,
          to: selectedChat.remoteJid,
          text: textToSend
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      // Update the temp message to sent status
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, status: 'sent' } : m));
      // Refresh chats to show the new message as last message
      fetchChats();
    } catch (e) {
      toast.error('Failed to send: ' + e.message);
      // Mark as failed
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, status: 'failed' } : m));
    }
  };

  const startNewChat = () => {
    const number = prompt("Enter phone number with country code (e.g. 918302806913):");
    if (!number) return;
    
    // Clean up the number to only digits
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length < 10) return toast.error("Invalid phone number");

    const remoteJid = `${cleanNumber}@s.whatsapp.net`;
    const newChat = {
      id: remoteJid,
      remoteJid: remoteJid,
      pushName: `+${cleanNumber}`,
      lastMessage: 'Start of conversation',
      timestamp: new Date(),
      unread: 0
    };
    
    setChats(prev => [newChat, ...prev.filter(c => c.remoteJid !== remoteJid)]);
    loadChatHistory(newChat);
  };

  return (
    <div className="h-screen w-full flex animate-in fade-in zoom-in duration-700 p-2 lg:p-4 selection:bg-brand-gold/20">
      <div className="flex-1 bg-white border border-slate-100 rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex">
      
        {/* Left Panel: Chat List */}
        <div className={cn(
          "w-full md:w-[400px] lg:w-[450px] flex flex-col border-r border-slate-50 transition-all duration-500",
          selectedChat && "hidden md:flex"
        )}>
          {/* List Header */}
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
               <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Messages</h1>
               <div className="p-3 bg-slate-900 text-brand-gold rounded-2xl shadow-xl shadow-slate-900/10">
                  <MessageSquare size={20} />
               </div>
            </div>

            {/* Device Filter */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
               {devices.map(dev => (
                 <button 
                  key={dev.id}
                  onClick={() => setActiveDevice(dev)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
                    activeDevice?.sessionId === dev.sessionId 
                      ? "bg-slate-900 border-slate-900 text-brand-gold shadow-lg" 
                      : "bg-slate-50 border-slate-100 text-slate-400 hover:border-brand-gold/30"
                  )}
                 >
                   {dev.name}
                 </button>
               ))}
            </div>

            {/* Search and New Chat */}
            <div className="flex gap-2 items-center">
              <div className="relative group flex-1">
                <div className="absolute inset-y-0 left-5 flex items-center text-slate-300 group-focus-within:text-brand-gold transition-colors">
                  <Search size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-brand-gold/30 focus:bg-white transition-all shadow-sm"
                />
              </div>
              <button 
                onClick={startNewChat}
                className="bg-slate-900 hover:bg-slate-800 text-brand-gold p-4 rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-95 group"
                title="New Chat"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </div>

          {/* Chat Scroller */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-8">
            <div className="space-y-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => loadChatHistory(chat)}
                  className={cn(
                    "w-full p-6 rounded-[2rem] flex items-center gap-4 transition-all duration-300 group relative overflow-hidden",
                    selectedChat?.id === chat.id 
                      ? "bg-slate-900 shadow-2xl shadow-slate-900/20" 
                      : "hover:bg-slate-50 border border-transparent hover:border-slate-100"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg",
                      selectedChat?.id === chat.id ? "bg-brand-gold text-slate-900" : "bg-slate-100 text-slate-400 group-hover:bg-white"
                    )}>
                      {chat.pushName?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn("text-sm font-black tracking-tight", selectedChat?.id === chat.id ? "text-white" : "text-slate-900")}>
                        {chat.pushName}
                      </span>
                      <span className={cn("text-[9px] font-bold uppercase", selectedChat?.id === chat.id ? "text-slate-500" : "text-slate-300")}>
                        {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={cn("text-[11px] font-medium line-clamp-1", selectedChat?.id === chat.id ? "text-slate-400" : "text-slate-500")}>
                      {chat.lastMessage}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Chat Window */}
        <div className={cn(
          "flex-1 flex flex-col bg-white transition-all duration-500",
          !selectedChat && "hidden md:flex"
        )}>
          {selectedChat ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedChat.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col"
              >
                {/* Chat Header */}
                <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900">
                       <Smartphone size={20} />
                    </button>
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-brand-gold shadow-lg shadow-slate-900/10">
                       <User size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-1">{selectedChat.pushName}</h2>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedChat.remoteJid}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-3 text-slate-300 hover:text-brand-gold transition-colors"><Phone size={20} /></button>
                    <button className="p-3 text-slate-300 hover:text-brand-gold transition-colors"><Video size={20} /></button>
                    <button className="p-3 text-slate-300 hover:text-brand-gold transition-colors"><MoreVertical size={20} /></button>
                  </div>
                </div>

                {/* Message Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-6 bg-slate-50/30">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "flex flex-col max-w-[80%] md:max-w-[70%]",
                        msg.direction === 'outbound' ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className={cn(
                        "p-5 rounded-[2rem] text-sm font-medium shadow-sm relative group",
                        msg.direction === 'outbound' 
                          ? "bg-slate-900 text-white rounded-tr-none shadow-xl shadow-slate-900/10" 
                          : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                      )}>
                        {msg.content}
                        <div className={cn(
                          "flex items-center gap-1 mt-2",
                          msg.direction === 'outbound' ? "justify-end text-slate-500" : "text-slate-300"
                        )}>
                          <span className="text-[9px] font-bold uppercase">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.direction === 'outbound' && (
                            <CheckCheck size={12} className={msg.status === 'read' ? "text-brand-gold" : "text-slate-500"} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 md:p-8 bg-white border-t border-slate-50">
                  <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-2 flex items-center gap-2 group focus-within:border-brand-gold/30 transition-all shadow-inner">
                    <button className="p-4 text-slate-300 hover:text-brand-gold transition-colors">
                      <Paperclip size={22} />
                    </button>
                    <input 
                      type="text" 
                      placeholder="Type your response here..."
                      className="flex-1 bg-transparent border-none py-4 px-2 text-sm font-bold text-slate-900 focus:outline-none placeholder:text-slate-300"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="bg-slate-900 text-brand-gold p-4 rounded-full shadow-2xl shadow-slate-900/20 active:scale-90 transition-all group"
                    >
                      <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50/30 text-center space-y-8 animate-in fade-in duration-1000">
              <div className="relative">
                 <div className="absolute inset-0 bg-brand-gold/20 blur-[60px] rounded-full animate-pulse" />
                 <div className="relative w-32 h-32 bg-white rounded-[3.5rem] shadow-2xl flex items-center justify-center text-slate-200 border border-slate-50">
                    <MessageSquare size={48} />
                 </div>
              </div>
              <div className="max-w-xs space-y-4">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Unified Hub</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Select a secure conversation from your linked SIM nodes to begin synchronized communication.
                </p>
              </div>
              <div className="flex gap-4">
                 <div className="px-5 py-2 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Zap size={14} className="text-brand-gold" /> AI Assistant
                 </div>
                 <div className="px-5 py-2 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" /> Encrypted
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
