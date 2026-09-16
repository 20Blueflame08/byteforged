import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { sounds } from '../lib/soundEngine';
import { Clock, Shield, Award, Sparkles, User, Crown } from 'lucide-react';

// Theme map: activeTab → color palette
const THEME = {
  home:     { c: 'cyan',    label: 'Home' },
  menu:     { c: 'amber',   label: 'Courses' },
  practice: { c: 'emerald', label: 'Lab' },
  games:    { c: 'orange',  label: 'Arcade' },
  friends:  { c: 'purple',  label: 'Social' },
  profile:  { c: 'indigo',  label: 'Profile' },
};

// Tailwind class builders — avoids dynamic class concatenation issues
const themeClasses = (c) => ({
  text: `text-${c}-400`,
  textStrong: `text-${c}-300`,
  bg10: `bg-${c}-500/10`,
  bg20: `bg-${c}-500/20`,
  border30: `border-${c}-500/30`,
  border40: `border-${c}-500/40`,
  shadow: `shadow-${c}-500/20`,
  ring: `ring-${c}-500/30`,
  glow: `via-${c}-400/50`,
});

export default function TopNav() {
  const { 
    activeTab, setActiveTab, userProfile, user, isPro,
    getActiveSessionSeconds, getRemainingSeconds,
    tickSessionTimer, tickActiveTimer 
  } = useAppStore();

  const getSeconds = getActiveSessionSeconds || getRemainingSeconds || (() => 0);
  const tickTimer = tickSessionTimer || tickActiveTimer;

  const [sessionTime, setSessionTime] = useState(getSeconds());

  useEffect(() => {
    setSessionTime(getSeconds());
    const timer = setInterval(() => {
      if (typeof tickTimer === 'function') tickTimer();
      setSessionTime(getSeconds());
    }, 1000);
    const handleVisibilityChange = () => {
      if (!document.hidden) setSessionTime(getSeconds());
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, getSeconds, tickTimer]);

  const formatTime = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const navItems = [
    { id: 'home', label: 'HOME' },
    { id: 'menu', label: 'COURSES' },
    { id: 'practice', label: 'PRACTICE LAB' },
    { id: 'games', label: 'MINI-GAMES' },
    { id: 'friends', label: 'FRIENDS' },
    { id: 'profile', label: 'PROFILE' },
  ];

  const activeTheme = THEME[activeTab] || THEME.home;
  const tc = themeClasses(activeTheme.c);

  return (
    <header className="w-full bg-slate-950/60 border-b border-white/5 backdrop-blur-2xl px-4 sm:px-6 py-3 font-mono flex items-center justify-between sticky top-0 z-40 relative">
      
      {/* Bottom edge glow — color-shifts with active page */}
      <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${tc.glow} to-transparent opacity-60 pointer-events-none`} />
      
      {/* Brand Logo */}
      <div 
        className="flex items-center space-x-3 cursor-pointer group" 
        onClick={() => { sounds?.playClick?.(); setActiveTab('home'); }}
      >
        <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 group-hover:${tc.text} group-hover:${tc.border30} transition-all shadow-lg`}>
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-sm tracking-[0.2em] text-white">BYTEFORGED</span>
          <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${tc.text} opacity-70`}>
            {activeTheme.label}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="hidden md:flex items-center space-x-1 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const itemTheme = THEME[item.id];
          const itc = themeClasses(itemTheme.c);
          return (
            <button
              key={item.id}
              onClick={() => {
                sounds?.playClick?.();
                setActiveTab(item.id);
              }}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? `${itc.bg20} ${itc.textStrong} ${itc.border30} border shadow-md ${itc.shadow}`
                  : `text-slate-400 hover:text-white hover:bg-white/5 border border-transparent`
              }`}
            >
              {isActive && (
                <span className={`absolute inset-0 rounded-xl ${itc.bg10} animate-pulse pointer-events-none`} />
              )}
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Nav Indicator — shows current section */}
      <div className="md:hidden flex items-center">
        <div className={`px-3 py-1 rounded-lg ${tc.bg10} border ${tc.border30}`}>
          <span className={`text-[10px] font-black uppercase tracking-wider ${tc.textStrong}`}>
            {activeTheme.label}
          </span>
        </div>
      </div>

      {/* Status Bar & Profile Indicator */}
      <div className="flex items-center space-x-3">
        
        {/* Count-Up Session Work Tracker */}
        <div 
          className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/60 backdrop-blur-sm border ${tc.border30} text-xs transition-all`}
          title="Total Active Session Work Time"
        >
          <Clock className={`w-3.5 h-3.5 ${tc.text}`} />
          <span className="text-slate-200 font-bold font-mono">
            <span className="text-slate-500 text-[10px] mr-1">⏱️</span>
            {formatTime(sessionTime)}
          </span>
        </div>

        {/* Profile Avatar Button */}
        <button
          onClick={() => {
            sounds?.playClick?.();
            setActiveTab('profile');
          }}
          className={`flex items-center space-x-2.5 p-1 pr-2 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-white/10 hover:${tc.border40} hover:${tc.bg10} transition-all relative group`}
        >
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${userProfile?.avatarBg || 'from-cyan-500 to-blue-600'} flex items-center justify-center text-sm shadow-lg ring-1 ring-white/20 group-hover:${tc.ring} transition-all`}>
            {userProfile?.avatar || '⚔️'}
          </div>
          
          <div className="flex items-center space-x-1.5 hidden sm:flex">
            <span className="text-xs font-bold text-slate-200 group-hover:text-white transition">
              {userProfile?.username || user?.username || 'Operative'}
            </span>

            {(isPro || userProfile?.isPro) && (
              <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-extrabold flex items-center space-x-0.5">
                <Crown className="w-2.5 h-2.5" />
                <span>PRO</span>
              </span>
            )}
          </div>
        </button>

      </div>
    </header>
  );
}