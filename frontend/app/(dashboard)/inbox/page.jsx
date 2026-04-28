'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, Send, Paperclip, MoreVertical, 
  Smartphone, User, Check, CheckCheck,
  MessageSquare, Plus, Phone, Video, 
  ChevronLeft, Filter, Zap, Smile, Mic,
  MoreHorizontal, Users, Star, MessageSquarePlus,
  ChevronDown, LayoutGrid
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const socket = io('http://localhost:3001');

export default function InboxPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [presences, setPresences] = useState({});
  const messagesEndRef = useRef(null);
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);

  // Fetch all devices on load
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/sessions');
        const data = await res.json();
        setDevices(data);
        // Default to the first online device or the first one available
        if (data.length > 0 && !selectedSessionId) {
          const firstOnline = data.find(d => d.status === 'online');
          setSelectedSessionId(firstOnline?.sessionId || data[0].sessionId);
        }
      } catch (e) {
        console.error('Failed to fetch devices', e);
      }
    };
    fetchDevices();
  }, []);

  // Main data fetching effect
  useEffect(() => {
    if (!selectedSessionId) return;

    fetchChats();

    socket.on('presence-update', (data) => {
      if (data.sessionId === selectedSessionId) {
        setPresences(prev => ({
          ...prev,
          [data.remoteJid]: data.presence
        }));
      }
    });

    socket.on('message:incoming', (data) => {
       if (data.sessionId === selectedSessionId) {
         if (selectedChat?.remoteJid === data.key.remoteJid) {
           setMessages(prev => {
             // Avoid duplicates
             if (prev.find(m => m.whatsappId === data.key.id)) return prev;
             return [...prev, {
               whatsappId: data.key.id,
               sessionId: data.sessionId,
               remoteJid: data.key.remoteJid,
               pushName: data.pushName,
               content: data.message?.conversation || data.message?.extendedTextMessage?.text || '',
               direction: 'inbound',
               status: 'delivered',
               timestamp: new Date()
             }];
           });
         }
         fetchChats();
       }
    });

    return () => {
      socket.off('presence-update');
      socket.off('message:incoming');
    };
  }, [selectedSessionId, selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    if (!selectedSessionId) return;
    const res = await fetch(`http://localhost:3001/api/whatsapp/chats?sessionId=${selectedSessionId}`);
    const data = await res.json();
    setChats(data);
  };

  const loadChatHistory = async (chat) => {
    setSelectedChat(chat);
    const res = await fetch(`http://localhost:3001/api/whatsapp/messages?sessionId=${selectedSessionId}&remoteJid=${chat.id}`);
    const data = await res.json();
    // Transform data to match UI expectations if needed
    setMessages(data);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat || !selectedSessionId) return;

    const payload = {
      sessionId: selectedSessionId,
      to: selectedChat.id,
      text: inputText
    };

    const res = await fetch('http://localhost:3001/api/message/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setInputText('');
      // Optimistically add message or wait for socket
      setMessages(prev => [...prev, {
        whatsappId: `temp-${Date.now()}`,
        sessionId: selectedSessionId,
        remoteJid: selectedChat.id,
        content: inputText,
        direction: 'outbound',
        status: 'pending',
        timestamp: new Date()
      }]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentDevice = devices.find(d => d.sessionId === selectedSessionId);

  return (
    <div className="flex h-full bg-[#F0F2F5] overflow-hidden font-sans">
        {/* Left Panel: Chat List */}
        <div className={cn(
          "w-full md:w-[400px] lg:w-[450px] flex flex-col border-r border-[#D1D7DB] bg-white transition-all duration-500",
          selectedChat && "hidden md:flex"
        )}>
          
          {/* Device Switcher Header */}
          <div className="bg-[#F0F2F5] px-4 py-3 flex items-center justify-between border-b border-[#E9EDEF] relative">
             <div className="relative">
                <button 
                  onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
                  className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 hover:border-[#FF5F38] transition-all group"
                >
                   <div className={cn(
                     "w-2 h-2 rounded-full",
                     currentDevice?.status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                   )} />
                   <span className="text-[13px] font-black text-slate-900 tracking-tight">
                     {currentDevice?.name || 'Select Device'}
                   </span>
                   <ChevronDown size={16} className={cn("text-slate-400 group-hover:text-[#FF5F38] transition-all", isDeviceMenuOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isDeviceMenuOpen && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsDeviceMenuOpen(false)}
                        className="fixed inset-0 z-[60]"
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-[70] overflow-hidden"
                      >
                         <div className="px-4 py-2 mb-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Switch Infrastructure Node</p>
                         </div>
                         <div className="space-y-1">
                            {devices.map(device => (
                              <button
                                key={device.sessionId}
                                onClick={() => {
                                  setSelectedSessionId(device.sessionId);
                                  setSelectedChat(null);
                                  setIsDeviceMenuOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between p-3 rounded-2xl transition-all",
                                  selectedSessionId === device.sessionId 
                                    ? "bg-orange-50 text-[#FF5F38]" 
                                    : "hover:bg-slate-50 text-slate-600"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                   <Smartphone size={18} className={selectedSessionId === device.sessionId ? "text-[#FF5F38]" : "text-slate-400"} />
                                   <div className="text-left">
                                      <p className="text-sm font-bold leading-none mb-1">{device.name}</p>
                                      <p className="text-[10px] opacity-60 font-medium">{device.status === 'online' ? 'Connected' : 'Offline'}</p>
                                   </div>
                                </div>
                                {selectedSessionId === device.sessionId && <Check size={16} />}
                              </button>
                            ))}
                            {devices.length === 0 && (
                              <p className="text-xs text-slate-400 p-4 text-center">No nodes found. Go to Devices to add one.</p>
                            )}
                         </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
             </div>

             <div className="flex items-center gap-2 text-[#54656F]">
                <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><MessageSquarePlus size={20} /></button>
                <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><MoreVertical size={20} /></button>
             </div>
          </div>

          <div className="px-3 py-1.5 bg-white">
            {/* Search Bar */}
            <div className="relative group flex items-center bg-[#F0F2F5] rounded-xl px-3 mt-1">
              <div className="text-[#54656F]">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Search or start a new chat" 
                className="w-full bg-transparent border-none py-2.5 pl-3 pr-2 text-sm text-[#3B4A54] placeholder:text-[#667781] focus:outline-none"
              />
            </div>
            
            {/* Filter Pills */}
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
               {['All', 'Unread', 'Favorites', 'Groups'].map(f => (
                 <button key={f} className={cn(
                   "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border border-transparent",
                   f === 'All' ? "bg-[#D9FDD3] text-[#008069] border-[#D1D7DB]" : "bg-[#F0F2F5] text-[#667781] hover:bg-[#D1D7DB]"
                 )}>
                   {f}
                 </button>
               ))}
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
            <AnimatePresence mode="popLayout">
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40 p-10 text-center">
                   <MessageSquare size={48} className="mb-4" />
                   <p className="text-sm font-bold">No conversations on this node yet.</p>
                </div>
              ) : chats.map((chat, i) => (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => loadChatHistory(chat)}
                  className={cn(
                    "w-full h-[72px] px-3 flex items-center gap-3 transition-colors relative group",
                    selectedChat?.id === chat.id 
                      ? "bg-[#F0F2F5]" 
                      : "hover:bg-[#F5F6F6] bg-white"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#DFE5E7] flex items-center justify-center text-white overflow-hidden">
                      <User size={32} />
                    </div>
                  </div>
                  <div className="flex-1 text-left min-w-0 border-b border-[#F0F2F5] h-full flex flex-col justify-center pr-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[17px] text-[#111B21] truncate font-medium">
                        {chat.name}
                      </span>
                      <span className="text-[11px] font-medium text-[#667781]">
                        {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        {chat.status === 'read' && <CheckCheck size={16} className="text-[#53BDEB] shrink-0" />}
                        <p className="text-[14px] text-[#667781] truncate font-normal">
                          {presences[chat.id]?.lastKnownPresence === 'composing' ? (
                            <span className="text-[#25D366]">typing...</span>
                          ) : chat.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: Conversation */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#EFEAE2]">
          {/* WhatsApp Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }} />

          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
              <div className="w-64 h-64 opacity-20 mb-8">
                 <img src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5yIx.png" alt="WA" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-[32px] font-light text-[#41525D] mb-4">WhatsApp Business on Web</h2>
              <p className="text-[14px] text-[#667781] max-w-sm leading-relaxed font-normal">
                Select a device node to view and manage its communications.<br/>
                Messages are synced in real-time from your linked mobile devices.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full relative z-10">
              {/* Chat Header */}
              <div className="bg-[#F0F2F5] px-4 py-2.5 flex items-center justify-between border-l border-[#D1D7DB]">
                <div className="flex items-center gap-3 cursor-pointer">
                  <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 text-[#54656F]">
                    <ChevronLeft size={24} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-[#DFE5E7] flex items-center justify-center text-white overflow-hidden">
                    <User size={28} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-medium text-[#111B21] leading-tight">{selectedChat.name}</h2>
                    <div className="h-4">
                       {presences[selectedChat.id]?.lastKnownPresence === 'composing' ? (
                         <span className="text-[13px] text-[#008069]">typing...</span>
                       ) : (
                         <span className="text-[13px] text-[#667781]">
                           {presences[selectedChat.id]?.lastKnownPresence === 'available' ? 'online' : ''}
                         </span>
                       )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[#54656F]">
                  <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><Video size={20} /></button>
                  <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><Search size={20} /></button>
                  <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><MoreVertical size={20} /></button>
                </div>
              </div>

              {/* Message Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-1.5">
                {messages.map((msg, i) => {
                  const isOutbound = msg.direction === 'outbound';
                  return (
                    <div key={msg.whatsappId || i} className={cn(
                      "flex w-full",
                      isOutbound ? "justify-end" : "justify-start"
                    )}>
                      <div className={cn(
                        "relative px-2.5 py-1.5 max-w-[65%] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] min-w-[80px]",
                        isOutbound ? "bg-[#D9FDD3] rounded-l-lg rounded-br-lg" : "bg-white rounded-r-lg rounded-bl-lg"
                      )}>
                        <p className="text-[14.2px] text-[#111B21] font-normal leading-relaxed break-words whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <div className="flex items-center justify-end gap-1 -mt-1 ml-4">
                          <span className="text-[11px] text-[#667781] uppercase">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                          {isOutbound && (
                            <div className="flex items-center">
                              {msg.status === 'read' ? (
                                <CheckCheck size={16} className="text-[#53BDEB]" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck size={16} className="text-[#667781]" />
                              ) : (
                                <Check size={16} className="text-[#667781]" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-[#F0F2F5] px-4 py-2.5 flex items-center gap-3">
                <div className="flex items-center gap-2 text-[#54656F]">
                   <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><Smile size={24} /></button>
                   <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><Paperclip size={24} /></button>
                </div>
                <div className="flex-1 bg-white rounded-lg px-3 py-2 shadow-sm">
                   <input 
                     type="text" 
                     placeholder="Type a message"
                     className="w-full bg-transparent border-none text-[15px] text-[#3B4A54] placeholder:text-[#667781] focus:outline-none"
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                   />
                </div>
                <div className="flex items-center text-[#54656F]">
                   {inputText.trim() ? (
                     <button 
                       onClick={handleSendMessage}
                       className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors text-[#54656F]"
                     >
                       <Send size={24} />
                     </button>
                   ) : (
                     <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors">
                       <Mic size={24} />
                     </button>
                   )}
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
