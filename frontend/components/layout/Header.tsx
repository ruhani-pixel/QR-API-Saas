'use client';

import { useAuth } from '@/hooks/useAuth';
import { LogOut, Bell, Search, Settings, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, role } = useAuth() as any;
  const router = useRouter();

  const handleLogout = async () => {
    document.cookie = 'firebase-token=; path=/; max-age=0';
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <header className="h-20 border-b border-slate-100/50 bg-white/50 backdrop-blur-md flex items-center justify-between px-8 z-40 sticky top-0 transition-all duration-500">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center text-slate-300 group-focus-within:text-[#FF5F38] transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search courses, messages, activities..." 
            className="w-full bg-slate-100/50 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-100 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
           <button className="p-2.5 text-slate-400 hover:text-[#FF5F38] hover:bg-orange-50 rounded-xl transition-all relative">
              <Bell size={20} />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF5F38] border-2 border-white rounded-full" />
           </button>
           <button className="p-2.5 text-slate-400 hover:text-[#FF5F38] hover:bg-orange-50 rounded-xl transition-all">
              <Settings size={20} />
           </button>
        </div>

        <div className="h-8 w-[1px] bg-slate-100 mx-2" />

        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-black text-slate-900 leading-none mb-1">{user?.displayName || 'Admin'}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{role}</span>
          </div>
          <div className="relative">
             {user?.photoURL ? (
               <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-md" />
             ) : (
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-[#FF5F38] flex items-center justify-center border-2 border-white shadow-md text-white text-xs font-bold">
                 {user?.email?.charAt(0).toUpperCase() || 'A'}
               </div>
             )}
             <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
          </div>
          <ChevronDown size={16} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
        </div>
      </div>
    </header>
  );
}
