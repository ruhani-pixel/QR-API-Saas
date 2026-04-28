'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, Send, MoreVertical, Smartphone, Check, CheckCheck, 
  Users, MessageSquarePlus, ChevronDown, Image as ImageIcon, 
  FileText, X, Download, Loader2, Camera, UserCircle2, 
  ShieldCheck, Music, Play, Mic, Plus, Smile, Trash2,
  ChevronLeft, Video
} from 'lucide-react';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

const socket = io('http://localhost:3001');
const API_URL = 'http://localhost:3001';

// PREMIUM COLOR TOKENS
const THEME = {
  primary: '#008069',
  bg: '#F0F2F5',
  border: '#D1D7DB',
  text: '#111B21',
  textSecondary: '#667781',
  bubbleOut: '#D9FDD3',
  bubbleIn: '#FFFFFF'
};

export default function InboxPage() {
  const [devices, setDevices] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [presences, setPresences] = useState({});
  const [profilePics, setProfilePics] = useState({});
  
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isMediaMenuOpen, setIsMediaMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingMedia, setIsSendingMedia] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/sessions`).then(r => r.json()).then(data => {
      setDevices(data);
      if (data.length > 0) setSelectedSessionId(data[0].sessionId);
    });
  }, []);

  useEffect(() => {
    if (!selectedSessionId) return;
    fetchChats();
    socket.on('message:incoming', (data) => { if (data.sessionId === selectedSessionId) { if (selectedChat?.id === data.key.remoteJid) fetchChatHistory(selectedChat.id); fetchChats(); } });
    socket.on('history:synced', (data) => { if (data.sessionId === selectedSessionId) fetchChats(); });
    return () => { socket.off('message:incoming'); socket.off('history:synced'); };
  }, [selectedSessionId, selectedChat]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredChats(chats.filter(c => c.name.toLowerCase().includes(q)));
  }, [searchQuery, chats]);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const fetchChats = async () => {
    const res = await fetch(`${API_URL}/api/whatsapp/chats?sessionId=${selectedSessionId}`);
    const data = await res.json();
    setChats(data);
    setFilteredChats(data);
  };

  const fetchChatHistory = async (remoteJid) => {
    const res = await fetch(`${API_URL}/api/whatsapp/messages?sessionId=${selectedSessionId}&remoteJid=${remoteJid}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat) return;
    const text = inputText; setInputText(''); setIsEmojiOpen(false);
    await fetch(`${API_URL}/api/message/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: selectedSessionId, to: selectedChat.id, text })
    });
    fetchChatHistory(selectedChat.id);
  };

  const handleMediaUpload = async (file) => {
    if (!file || !selectedChat) return;
    setIsSendingMedia(true);
    const formData = new FormData();
    formData.append('media', file);
    formData.append('sessionId', selectedSessionId);
    formData.append('to', selectedChat.id);
    let type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document';
    formData.append('type', type);
    await fetch(`${API_URL}/api/message/send-media`, { method: 'POST', body: formData });
    setIsSendingMedia(false);
    fetchChatHistory(selectedChat.id);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => handleMediaUpload(new File([new Blob(chunks)], "voice.ogg", { type: 'audio/ogg' }));
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
  };

  const stopRecording = (send = true) => {
    clearInterval(recordingIntervalRef.current);
    if (!send) mediaRecorderRef.current.onstop = null;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    setIsRecording(false);
  };

  const Ticks = ({ status }) => (
    <div className="flex">
      {status === 'read' ? <CheckCheck size={15} className="text-[#53BDEB]" /> : 
       status === 'delivered' ? <CheckCheck size={15} className="text-[#667781]" /> : 
       <Check size={15} className="text-[#667781]" />}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F0F2F5] text-[#111B21] overflow-hidden font-sans antialiased">
        <input type="file" ref={fileInputRef} className="hidden" onChange={e => handleMediaUpload(e.target.files[0])} />

        {/* CHAT LIST */}
        <div className={cn("w-full md:w-[420px] flex flex-col bg-white border-r border-[#D1D7DB] z-20", selectedChat && "hidden md:flex")}>
          <div className="bg-[#F0F2F5] h-[59px] px-4 flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-[#DFE5E7] flex items-center justify-center overflow-hidden border border-white cursor-pointer"><UserCircle2 size={42} className="text-[#AEBAC1]" /></div>
            <div className="flex items-center gap-6 text-[#54656F]">
               <button className="hover:bg-[#D9DBDF] p-2 rounded-full transition-colors"><Users size={22} /></button>
               <button className="hover:bg-[#D9DBDF] p-2 rounded-full transition-colors"><MessageSquarePlus size={22} /></button>
               <button className="hover:bg-[#D9DBDF] p-2 rounded-full transition-colors"><MoreVertical size={22} /></button>
            </div>
          </div>

          <div className="p-3">
             <div className="flex items-center bg-[#F0F2F5] rounded-lg px-4 focus-within:bg-white focus-within:shadow-sm border border-transparent focus-within:border-[#008069] transition-all">
                <Search size={18} className="text-[#54656F]" />
                <input type="text" placeholder="Search or start a new chat" className="w-full bg-transparent border-none py-2 pl-4 text-[15px] focus:outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.map(chat => (
              <button key={chat.id} onClick={() => { setSelectedChat(chat); fetchChatHistory(chat.id); }} className={cn("w-full h-18 px-3 flex items-center gap-3 hover:bg-[#F5F6F6] transition-colors border-b border-[#F0F2F5]", selectedChat?.id === chat.id && "bg-[#F0F2F5]")}>
                <div className="w-12 h-12 rounded-full bg-[#DFE5E7] flex items-center justify-center overflow-hidden shrink-0">
                  {chat.profilePic ? <img src={chat.profilePic} className="w-full h-full object-cover" /> : <UserCircle2 size={48} className="text-[#AEBAC1]" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                   <div className="flex justify-between items-center"><span className="text-[17px] font-medium truncate">{chat.name}</span><span className="text-[12px] text-[#667781]">{new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                   <div className="flex items-center gap-1"><p className="text-[14px] text-[#667781] truncate">{chat.lastMessage}</p></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CONVERSATION AREA */}
        <div className="flex-1 flex flex-col relative bg-[#EFEAE2] z-10 shadow-xl">
           <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }} />
           
           {!selectedChat ? (
             <div className="flex-1 flex flex-col items-center justify-center bg-[#F0F2F5] p-10 text-center relative z-10">
                <img src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5yIx.png" className="w-64 h-64 mb-10 opacity-60 grayscale" />
                <h2 className="text-[32px] font-light text-[#41525D] mb-4">WhatsApp Web</h2>
                <p className="text-[14px] text-[#667781] max-w-sm">Send and receive messages without keeping your phone online. Use WhatsApp on up to 4 linked devices at the same time.</p>
                <div className="mt-20 flex items-center gap-2 text-[#8696a0] text-[12px] uppercase tracking-widest"><ShieldCheck size={16} /><span>End-to-end encrypted</span></div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col h-full relative z-10">
                <div className="bg-[#F0F2F5] h-[59px] px-4 flex items-center justify-between border-l border-[#D1D7DB] z-30">
                   <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedChat(null)} className="md:hidden p-2"><ChevronLeft size={24} /></button>
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white shrink-0">
                         {selectedChat?.profilePic ? <img src={selectedChat.profilePic} /> : <UserCircle2 size={40} className="text-[#AEBAC1]" />}
                      </div>
                      <div className="flex flex-col">
                         <h2 className="text-[16px] font-medium leading-tight">{selectedChat.name}</h2>
                         <span className="text-[12px] text-[#667781]">{selectedChat.isGroup ? 'Group' : 'online'}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-6 text-[#54656F]">
                      <button><Video size={22} /></button><button><Search size={22} /></button><button><MoreVertical size={22} /></button>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-2 no-scrollbar bg-[#EFEAE2]/60">
                   <div className="flex justify-center mb-6"><div className="bg-[#FFF9C4] px-4 py-2 rounded-lg text-[12.5px] text-[#54656f] text-center shadow-sm max-w-[500px]">Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.</div></div>
                   
                   {messages.map((msg, i) => {
                     const isOut = msg.direction === 'outbound';
                     if (msg.type === 'sticker') return (
                        <div key={msg.id || i} className={cn("flex w-full mb-4", isOut ? "justify-end" : "justify-start")}>
                           <div className="flex items-end gap-2">
                              <img src={`${API_URL}${msg.mediaPath}`} className="w-40 h-40 object-contain" />
                              <span className="text-[10px] text-[#667781] font-medium">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </div>
                     );
                     return (
                        <div key={msg.id || i} className={cn("flex w-full", isOut ? "justify-end" : "justify-start")}>
                           <div className={cn(
                              "relative max-w-[65%] min-w-[80px] shadow-[0_1px_1px_rgba(0,0,0,0.1)] px-2 py-1.5",
                              isOut ? "bg-[#D9FDD3] rounded-l-lg rounded-br-lg" : "bg-white rounded-r-lg rounded-bl-lg",
                              (msg.type === 'image' || msg.type === 'video') && "p-0 overflow-hidden"
                           )}>
                              {msg.type === 'image' && <img src={`${API_URL}${msg.mediaPath}`} className="w-full h-auto max-h-[400px] object-cover" />}
                              {msg.type === 'video' && <video src={`${API_URL}${msg.mediaPath}`} className="w-full h-auto max-h-[400px] object-cover" />}
                              {msg.type === 'audio' && (
                                <div className="p-3 flex items-center gap-3 min-w-[240px]">
                                   <div className="w-10 h-10 bg-[#008069] text-white rounded-full flex items-center justify-center shrink-0"><Play size={20} className="ml-1 fill-current" /></div>
                                   <div className="flex-1 h-3 flex items-center gap-0.5">{[...Array(20)].map((_, i) => <div key={i} className="w-0.5 h-full bg-[#008069]/20 rounded-full" />)}</div>
                                </div>
                              )}
                              {msg.type === 'document' && (
                                <div className="p-3 flex items-center gap-3 min-w-[240px] bg-white rounded-md m-1">
                                   <div className="w-10 h-10 bg-[#FF5F38] rounded-lg flex items-center justify-center shrink-0"><FileText className="text-white" /></div>
                                   <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{msg.fileName}</p><p className="text-[11px] text-[#667781] uppercase">PDF • 2 MB</p></div>
                                   <Download size={20} className="text-[#667781]" />
                                </div>
                              )}

                              {msg.content && <p className="text-[14.2px] px-1 py-0.5 leading-relaxed break-words">{msg.content}</p>}
                              
                              <div className="flex items-center justify-end gap-1 mt-0.5 px-1">
                                 <span className="text-[10px] text-[#667781] uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                 {isOut && <Ticks status={msg.status} />}
                              </div>
                           </div>
                        </div>
                     );
                   })}
                   <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* PILL INPUT */}
                <div className="bg-[#F0F2F5] min-h-[62px] px-4 py-2 flex items-center gap-4 relative z-40">
                   <AnimatePresence>{isEmojiOpen && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-4 mb-4"><EmojiPicker onEmojiClick={d => setInputText(p => p + d.emoji)} width={350} height={400} /></motion.div>}</AnimatePresence>
                   
                   <div className="flex-1 bg-white h-[46px] rounded-full px-2 flex items-center gap-1 shadow-sm">
                      {isRecording ? (
                        <div className="flex-1 flex items-center justify-between px-4">
                           <div className="flex items-center gap-3"><div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" /><span className="text-sm font-medium">{Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2,'0')}</span></div>
                           <div className="flex items-center gap-4"><button onClick={() => stopRecording(false)} className="text-rose-500"><Trash2 size={20} /></button><button onClick={() => stopRecording(true)} className="text-[#008069]"><Send size={20} /></button></div>
                        </div>
                      ) : (
                        <>
                           <button onClick={() => setIsEmojiOpen(!isEmojiOpen)} className="text-[#54656F] p-2 hover:bg-slate-100 rounded-full"><Smile size={24} /></button>
                           <button onClick={() => fileInputRef.current.click()} className="text-[#54656F] p-2 hover:bg-slate-100 rounded-full"><Plus size={24} /></button>
                           <input type="text" placeholder="Type a message" className="flex-1 bg-transparent border-none text-[15px] focus:outline-none px-2" value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
                           <div className="w-10 h-10 flex items-center justify-center">
                              {inputText.trim() ? <button onClick={handleSendMessage} className="text-[#008069]"><Send size={24} /></button> : <button onClick={startRecording} className="text-[#54656F]"><Mic size={24} /></button>}
                           </div>
                        </>
                      )}
                   </div>
                </div>
             </div>
           )}
        </div>
    </div>
  );
}
