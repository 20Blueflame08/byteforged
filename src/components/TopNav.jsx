import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { sounds } from '../lib/soundEngine';
import {
  Clock, Crown, Menu, X, Sparkles,
  Home, BookOpen, FlaskConical, Gamepad2, Users, User
} from 'lucide-react';

// Theme map: activeTab → color palette (adaptive glow)
const THEME = {
  home:     { c: 'cyan',    label: 'Home' },
  menu:     { c: 'amber',   label: 'Courses' },
  practice: { c: 'emerald', label: 'Lab' },
  games:    { c: 'orange',  label: 'Arcade' },
  friends:  { c: 'purple',  label: 'Social' },
  profile:  { c: 'indigo',  label: 'Profile' },
};

const themeClasses = (c) => ({
  text: `text-${c}-400`,
  textStrong: `text-${c}-300`,
  bg10: `bg-${c}-500/10`,
  bg20: `bg-${c}-500/20`,
  border30: `border-${c}-500/30`,
  border40: `border-${c}-500/40`,
  shadow: `shadow-${c}-500/20`,
  glow: `via-${c}-400/50`,
});

const navItems = [
  { id: 'home',     label: 'HOME',         icon: Home },
  { id: 'menu',     label: 'COURSES',      icon: BookOpen },
  { id: 'practice', label: 'PRACTICE LAB', icon: FlaskConical },
  { id: 'games',    label: 'MINI-GAMES',   icon: Gamepad2 },
  { id: 'friends',  label: 'FRIENDS',      icon: Users },
  { id: 'profile',  label: 'PROFILE',      icon: User },
];

export default function TopNav() {
  const {
    activeTab, setActiveTab, userProfile, user, isPro,
    getActiveSessionSeconds, getRemainingSeconds,
    tickSessionTimer, tickActiveTimer
  } = useAppStore();

  const getSeconds = getActiveSessionSeconds || getRemainingSeconds || (() => 0);
  const tickTimer = tickSessionTimer || tickActiveTimer;

  const [sessionTime, setSessionTime] = useState(getSeconds());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Auto-close mobile drawer whenever the active tab changes
  useEffect(() => { setIsMobileMenuOpen(false); }, [activeTab]);

  const formatTime = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activeTheme = THEME[activeTab] || THEME.home;
  const tc = themeClasses(activeTheme.c);

  return (
    <header className="w-full bg-slate-950/60 border-b border-white/5 backdrop-blur-2xl px-4 sm:px-6 py-3 font-mono flex flex-col sticky top-0 z-40 relative">
      {/* Bottom edge glow — color-shifts with active page */}
      <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${tc.glow} to-transparent opacity-60 pointer-events-none`} />

      <div className="flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          className="flex items-center space-x-2.5 cursor-pointer shrink-0"
          onClick={() => { try { sounds?.playClick?.(); } catch {} setActiveTab('home'); }}
        >
          <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 shadow-lg`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-sm tracking-[0.2em] text-white">BYTEFORGED</span>
            <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${tc.text} opacity-70`}>
              {activeTheme.label}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Pills (unchanged) */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const itc = themeClasses((THEME[item.id] || THEME.home).c);
            return (
              <button
                key={item.id}
                onClick={() => { try { sounds?.playClick?.(); } catch {} setActiveTab(item.id); }}
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

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Work timer — hidden on smallest screens (also lives in Profile) */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-700 text-xs backdrop-blur-sm">
            <Clock className={`w-3.5 h-3.5 ${tc.text}`} />
            <span className="text-slate-200 font-bold">⏱️ {formatTime(sessionTime)}</span>
          </div>

          {/* Profile button */}
          <button
            onClick={() => { try { sounds?.playClick?.(); } catch {} setActiveTab('profile'); }}
            className={`flex items-center space-x-2 p-1 pr-2 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-sm transition`}
          >
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${userProfile?.avatarBg || 'from-cyan-500 to-blue-600'} flex items-center justify-center text-sm shadow-lg ring-1 ring-white/20`}>
              {userProfile?.avatar || '⚔️'}
            </div>
            <div className="hidden sm:flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-200">
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

          {/* MOBILE HAMBURGER — the fix */}
          <button
            onClick={() => { try { sounds?.playClick?.(); } catch {} setIsMobileMenuOpen(!isMobileMenuOpen); }}
            className={`md:hidden p-2 rounded-xl border transition ${
              isMobileMenuOpen
                ? `${tc.bg20} ${tc.textStrong} ${tc.border40}`
                : 'bg-slate-900/60 border-white/10 text-slate-300'
            }`}
            title="Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER — frosted-glass slide-down with all pages */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl z-50">
          <nav className="flex flex-col p-3 gap-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const itc = themeClasses((THEME[item.id] || THEME.home).c);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { try { sounds?.playClick?.(); } catch {} setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-sm font-bold transition-all ${
                    isActive
                      ? `${itc.bg20} ${itc.textStrong} ${itc.border30} shadow-md ${itc.shadow}`
                      : 'text-slate-300 border-transparent hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? itc.text : 'text-slate-400'}`} />
                  <span className="tracking-wide">{item.label}</span>
                  {isActive && <span className={`ml-auto w-2 h-2 rounded-full ${itc.bg20} ${itc.text}`} />}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}