'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, Send, Paperclip, MoreVertical, 
  Smartphone, User, Check, CheckCheck,
  MessageSquare, Plus, Phone, Video, 
  ChevronLeft, Filter, Zap, Smile, Mic,
  MoreHorizontal, Users, Star, MessageSquarePlus,
  ChevronDown, LayoutGrid, Image as ImageIcon, FileText, X,
  FileIcon, Download, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

const socket = io('http://localhost:3001');
const API_URL = 'http://localhost:3001';

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
  const fileInputRef = useRef(null);
  
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isMediaMenuOpen, setIsMediaMenuOpen] = useState(false);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [profilePics, setProfilePics] = useState({});

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch(`${API_URL}/api/sessions`);
        const data = await res.json();
        setDevices(data);
        if (data.length > 0 && !selectedSessionId) {
          const firstOnline = data.find(d => d.status === 'online');
          setSelectedSessionId(firstOnline?.sessionId || data[0].sessionId);
        }
      } catch (e) {}
    };
    fetchDevices();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) return;
    fetchChats();

    socket.on('presence-update', (data) => {
      if (data.sessionId === selectedSessionId) {
        setPresences(prev => ({ ...prev, [data.remoteJid]: data.presence }));
      }
    });

    socket.on('message:incoming', (data) => {
       if (data.sessionId === selectedSessionId) {
         if (selectedChat?.id === data.key.remoteJid) fetchChatHistory(selectedChat.id);
         fetchChats();
       }
    });

    socket.on('message:status', (data) => {
       setMessages(prev => prev.map(m => m.whatsappId === data.whatsappId ? { ...m, status: data.status } : m));
    });

    return () => {
      socket.off('presence-update');
      socket.off('message:incoming');
      socket.off('message:status');
    };
  }, [selectedSessionId, selectedChat]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchChats = async () => {
    if (!selectedSessionId) return;
    const res = await fetch(`${API_URL}/api/whatsapp/chats?sessionId=${selectedSessionId}`);
    const data = await res.json();
    setChats(data);
    // Fetch profile pics for visible chats
    data.forEach(chat => { if (!profilePics[chat.id]) fetchProfilePic(chat.id); });
  };

  const fetchProfilePic = async (remoteJid) => {
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/profile-pic?sessionId=${selectedSessionId}&remoteJid=${remoteJid}`);
      const data = await res.json();
      if (data.url) setProfilePics(prev => ({ ...prev, [remoteJid]: data.url }));
    } catch (e) {}
  };

  const fetchChatHistory = async (remoteJid) => {
    const res = await fetch(`${API_URL}/api/whatsapp/messages?sessionId=${selectedSessionId}&remoteJid=${remoteJid}`);
    const data = await res.json();
    setMessages(data);
  };

  const loadChatHistory = async (chat) => {
    setSelectedChat(chat);
    fetchChatHistory(chat.id);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat || !selectedSessionId) return;
    const textToSend = inputText;
    setInputText('');
    setIsEmojiOpen(false);
    try {
      const res = await fetch(`${API_URL}/api/message/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, to: selectedChat.id, text: textToSend })
      });
      if (res.ok) fetchChatHistory(selectedChat.id);
    } catch (e) {}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat || !selectedSessionId) return;
    setIsSendingMedia(true);
    setIsMediaMenuOpen(false);
    const formData = new FormData();
    formData.append('media', file);
    formData.append('sessionId', selectedSessionId);
    formData.append('to', selectedChat.id);
    formData.append('caption', '');
    let type = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    formData.append('type', type);
    try {
      const res = await fetch(`${API_URL}/api/message/send-media`, { method: 'POST', body: formData });
      if (res.ok) fetchChatHistory(selectedChat.id);
    } catch (e) {} finally {
      setIsSendingMedia(false);
      e.target.value = '';
    }
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  const onEmojiClick = (emojiData) => { setInputText(prev => prev + emojiData.emoji); };
  const currentDevice = devices.find(d => d.sessionId === selectedSessionId);

  return (
    <div className="flex h-full bg-[#F0F2F5] overflow-hidden font-sans">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

        <div className={cn("w-full md:w-[400px] lg:w-[450px] flex flex-col border-r border-[#D1D7DB] bg-white transition-all duration-500", selectedChat && "hidden md:flex")}>
          <div className="bg-[#F0F2F5] px-4 py-3 flex items-center justify-between border-b border-[#E9EDEF] relative">
             <div className="relative">
                <button onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)} className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 hover:border-[#FF5F38] transition-all group">
                   <div className={cn("w-2 h-2 rounded-full", currentDevice?.status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                   <span className="text-[13px] font-black text-slate-900 tracking-tight">{currentDevice?.name || 'Select Device'}</span>
                   <ChevronDown size={16} className={cn("text-slate-400 group-hover:text-[#FF5F38] transition-all", isDeviceMenuOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isDeviceMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsDeviceMenuOpen(false)} />
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-[70] overflow-hidden">
                         {devices.map(device => (
                           <button key={device.sessionId} onClick={() => { setSelectedSessionId(device.sessionId); setSelectedChat(null); setIsDeviceMenuOpen(false); }} className={cn("w-full flex items-center justify-between p-3 rounded-2xl transition-all", selectedSessionId === device.sessionId ? "bg-orange-50 text-[#FF5F38]" : "hover:bg-slate-50 text-slate-600")}>
                             <div className="flex items-center gap-3">
                                <Smartphone size={18} className={selectedSessionId === device.sessionId ? "text-[#FF5F38]" : "text-slate-400"} />
                                <div className="text-left"><p className="text-sm font-bold mb-1">{device.name}</p><p className="text-[10px] opacity-60">{device.status === 'online' ? 'Connected' : 'Offline'}</p></div>
                             </div>
                             {selectedSessionId === device.sessionId && <Check size={16} />}
                           </button>
                         ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
             </div>
          </div>

          <div className="px-3 py-1.5 bg-white">
            <div className="relative group flex items-center bg-[#F0F2F5] rounded-xl px-3 mt-1">
              <Search size={16} className="text-[#54656F]" />
              <input type="text" placeholder="Search chats" className="w-full bg-transparent border-none py-2.5 pl-3 pr-2 text-sm text-[#3B4A54] focus:outline-none" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
            {chats.map((chat) => (
              <button key={chat.id} onClick={() => loadChatHistory(chat)} className={cn("w-full h-[72px] px-3 flex items-center gap-3 transition-colors relative group", selectedChat?.id === chat.id ? "bg-[#F0F2F5]" : "hover:bg-[#F5F6F6] bg-white")}>
                <div className="w-12 h-12 rounded-full bg-[#DFE5E7] flex items-center justify-center text-white overflow-hidden shrink-0">
                  {profilePics[chat.id] ? <img src={profilePics[chat.id]} className="w-full h-full object-cover" /> : <User size={32} />}
                </div>
                <div className="flex-1 text-left min-w-0 border-b border-[#F0F2F5] h-full flex flex-col justify-center pr-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[17px] text-[#111B21] truncate font-medium">{chat.name}</span>
                    <span className="text-[11px] font-medium text-[#667781]">{new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[14px] text-[#667781] truncate font-normal">{chat.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#EFEAE2]">
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }} />

          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
              <div className="w-64 h-64 opacity-20 mb-8"><img src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5yIx.png" alt="WA" className="w-full h-full object-contain" /></div>
              <h2 className="text-[32px] font-light text-[#41525D] mb-4">WhatsApp Business</h2>
              <p className="text-[14px] text-[#667781] max-w-sm font-normal">Select a device to sync and manage messages instantly.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full relative z-10">
              <div className="bg-[#F0F2F5] px-4 py-2.5 flex items-center justify-between border-l border-[#D1D7DB]">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 text-[#54656F]"><ChevronLeft size={24} /></button>
                  <div className="w-10 h-10 rounded-full bg-[#DFE5E7] flex items-center justify-center text-white overflow-hidden shrink-0">
                    {profilePics[selectedChat.id] ? <img src={profilePics[selectedChat.id]} className="w-full h-full object-cover" /> : <User size={28} />}
                  </div>
                  <div>
                    <h2 className="text-[16px] font-medium text-[#111B21] leading-tight">{selectedChat.name}</h2>
                    <span className="text-[13px] text-[#667781]">{presences[selectedChat.id]?.lastKnownPresence === 'available' ? 'online' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[#54656F]">
                  <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><Video size={20} /></button>
                  <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><Search size={20} /></button>
                  <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><MoreVertical size={20} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-1.5">
                {messages.map((msg, i) => {
                  const isOutbound = msg.direction === 'outbound';
                  return (
                    <div key={msg.whatsappId || i} className={cn("flex w-full", isOutbound ? "justify-end" : "justify-start")}>
                      <div className={cn("relative px-2.5 py-1.5 max-w-[65%] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] min-w-[80px]", isOutbound ? "bg-[#D9FDD3] rounded-l-lg rounded-br-lg" : "bg-white rounded-r-lg rounded-bl-lg")}>
                        {msg.type === 'image' && <div className="mb-1.5 rounded-lg overflow-hidden border border-black/5 bg-slate-50 min-w-[200px]"><img src={`${API_URL}${msg.mediaPath}`} className="w-full h-auto max-h-[300px] object-cover" /></div>}
                        {msg.type === 'video' && <div className="mb-1.5 rounded-lg overflow-hidden border border-black/5 bg-black min-w-[200px]"><video src={`${API_URL}${msg.mediaPath}`} controls className="w-full h-auto max-h-[300px]" /></div>}
                        {msg.type === 'document' && <div className="mb-1.5 p-3 rounded-lg bg-slate-50 flex items-center gap-3 border border-slate-100 min-w-[200px]"><div className="w-10 h-10 bg-[#FF5F38] text-white rounded-lg flex items-center justify-center shrink-0"><FileText size={24} /></div><div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-700 truncate">{msg.fileName || 'File'}</p><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Document</p></div><a href={`${API_URL}${msg.mediaPath}`} download className="p-2 text-slate-400 hover:text-slate-900"><Download size={18} /></a></div>}
                        <p className="text-[14.2px] text-[#111B21] font-normal leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 -mt-1 ml-4"><span className="text-[11px] text-[#667781] uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>{isOutbound && <div className="flex items-center">{msg.status === 'read' ? <CheckCheck size={16} className="text-[#53BDEB]" /> : msg.status === 'delivered' ? <CheckCheck size={16} className="text-[#667781]" /> : <Check size={16} className="text-[#667781]" />}</div>}</div>
                      </div>
                    </div>
                  );
                })}
                {isSendingMedia && <div className="flex justify-end w-full"><div className="bg-[#D9FDD3] px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm border border-black/5"><Loader2 className="w-4 h-4 text-[#008069] animate-spin" /><span className="text-xs font-bold text-[#008069]">Sending Media...</span></div></div>}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-[#F0F2F5] px-4 py-2.5 flex items-center gap-3 relative">
                <AnimatePresence>{isEmojiOpen && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full left-4 mb-4 z-[100]"><EmojiPicker onEmojiClick={onEmojiClick} /></motion.div>}</AnimatePresence>
                <AnimatePresence>{isMediaMenuOpen && <><div className="fixed inset-0" onClick={() => setIsMediaMenuOpen(false)} /><motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-full left-12 mb-4 bg-white rounded-3xl shadow-2xl p-2 z-[100] border border-slate-100 min-w-[200px]"><button onClick={() => fileInputRef.current.click()} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all"><div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center"><ImageIcon size={20} /></div><span className="text-xs font-bold text-slate-700">Photo & Video</span></button><button onClick={() => fileInputRef.current.click()} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all"><div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center"><FileText size={20} /></div><span className="text-xs font-bold text-slate-700">Document</span></button></motion.div></>}</AnimatePresence>
                <div className="flex items-center gap-1 text-[#54656F]"><button onClick={() => setIsEmojiOpen(!isEmojiOpen)} className={cn("p-2 rounded-full transition-colors", isEmojiOpen ? "bg-[#D9DBDF] text-slate-900" : "hover:bg-[#D9DBDF]")}><Smile size={24} /></button><button onClick={() => setIsMediaMenuOpen(!isMediaMenuOpen)} className={cn("p-2 rounded-full transition-colors", isMediaMenuOpen ? "bg-[#D9DBDF] text-slate-900" : "hover:bg-[#D9DBDF]")}><Paperclip size={24} /></button></div>
                <div className="flex-1 bg-white rounded-lg px-3 py-2 shadow-sm"><input type="text" placeholder="Type a message" className="w-full bg-transparent border-none text-[15px] text-[#3B4A54] focus:outline-none" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} /></div>
                <div className="flex items-center text-[#54656F]">{inputText.trim() ? <button onClick={handleSendMessage} className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors text-[#54656F]"><Send size={24} /></button> : <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><Mic size={24} /></button>}</div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
