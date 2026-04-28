'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, Send, Paperclip, MoreVertical, 
  Smartphone, User, Check, CheckCheck,
  MessageSquare, Plus, Phone, Video, 
  ChevronLeft, Filter, Zap, Smile, Mic,
  MoreHorizontal, Users, Star, MessageSquarePlus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const socket = io('http://localhost:3001');

export default function InboxPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [presences, setPresences] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();

    socket.on('presence-update', (data) => {
      setPresences(prev => ({
        ...prev,
        [data.remoteJid]: data.presence
      }));
    });

    socket.on('message-update', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.whatsappId === data.whatsappId ? { ...msg, status: data.status } : msg
      ));
    });

    socket.on('new-message', (data) => {
       if (selectedChat?.remoteJid === data.remoteJid) {
         setMessages(prev => [...prev, data]);
       }
       fetchChats();
    });

    return () => {
      socket.off('presence-update');
      socket.off('message-update');
      socket.off('new-message');
    };
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    const res = await fetch(`http://localhost:3001/api/whatsapp/chats?ownerId=${user?.uid}`);
    const data = await res.json();
    setChats(data);
  };

  const loadChatHistory = async (chat) => {
    setSelectedChat(chat);
    const res = await fetch(`http://localhost:3001/api/whatsapp/messages?ownerId=${user?.uid}&remoteJid=${chat.remoteJid}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat) return;

    const payload = {
      sessionId: selectedChat.sessionId,
      to: selectedChat.remoteJid,
      message: inputText,
      ownerId: user?.uid
    };

    const res = await fetch('http://localhost:3001/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setInputText('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex h-full bg-[#F0F2F5] overflow-hidden font-sans">
        {/* Left Panel: Chat List */}
        <div className={cn(
          "w-full md:w-[400px] lg:w-[450px] flex flex-col border-r border-[#D1D7DB] bg-white transition-all duration-500",
          selectedChat && "hidden md:flex"
        )}>
          {/* List Header */}
          <div className="bg-[#F0F2F5] px-4 py-2.5 flex items-center justify-between">
             <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center overflow-hidden">
                <User size={24} className="text-white" />
             </div>
             <div className="flex items-center gap-2 text-[#54656F]">
                <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><Users size={20} /></button>
                <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><Zap size={20} /></button>
                <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><MessageSquarePlus size={20} /></button>
                <button className="p-2 hover:bg-[#D9DBDF] rounded-full transition-colors"><MoreVertical size={20} /></button>
             </div>
          </div>

          <div className="px-3 py-1.5">
            {/* Search Bar */}
            <div className="relative group flex items-center bg-[#F0F2F5] rounded-lg px-3">
              <div className="text-[#54656F]">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Search or start a new chat" 
                className="w-full bg-transparent border-none py-1.5 pl-3 pr-2 text-sm text-[#3B4A54] placeholder:text-[#667781] focus:outline-none"
              />
            </div>
            
            {/* Filter Pills */}
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
               {['All', 'Unread', 'Favorites', 'Groups'].map(f => (
                 <button key={f} className={cn(
                   "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                   f === 'All' ? "bg-[#D9FDD3] text-[#008069]" : "bg-[#F0F2F5] text-[#667781] hover:bg-[#D1D7DB]"
                 )}>
                   {f}
                 </button>
               ))}
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChatHistory(chat)}
                className={cn(
                  "w-full h-[72px] px-3 flex items-center gap-3 transition-colors relative group",
                  selectedChat?.id === chat.id 
                    ? "bg-[#EBEBEB]" 
                    : "hover:bg-[#F5F6F6]"
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#DFE5E7] flex items-center justify-center text-white overflow-hidden">
                    <User size={32} />
                  </div>
                </div>
                <div className="flex-1 text-left min-w-0 border-b border-[#F0F2F5] h-full flex flex-col justify-center pr-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[17px] text-[#111B21] truncate font-normal">
                      {chat.pushName}
                    </span>
                    <span className={cn(
                      "text-xs font-normal",
                      selectedChat?.id === chat.id ? "text-[#667781]" : "text-[#667781]"
                    )}>
                      {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      {chat.lastMessageDirection === 'outbound' && (
                         <CheckCheck size={16} className="text-[#53BDEB] shrink-0" />
                      )}
                      <p className="text-[14px] text-[#667781] truncate font-normal">
                        {presences[chat.remoteJid]?.lastKnownPresence === 'composing' ? (
                          <span className="text-[#25D366]">typing...</span>
                        ) : chat.lastMessage}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-[#25D366] rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
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
                Grow, organise and manage your business account.<br/>
                Your personal messages are end-to-end encrypted.
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
                    <h2 className="text-[16px] font-medium text-[#111B21] leading-tight">{selectedChat.pushName}</h2>
                    <div className="h-4">
                       {presences[selectedChat.remoteJid]?.lastKnownPresence === 'composing' ? (
                         <span className="text-[13px] text-[#008069]">typing...</span>
                       ) : (
                         <span className="text-[13px] text-[#667781]">
                           {presences[selectedChat.remoteJid]?.lastKnownPresence === 'available' ? 'online' : ''}
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
