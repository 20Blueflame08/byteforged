import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabaseClient';
import { sounds } from '../lib/soundEngine';
import { PRACTICAL_CONTENT } from '../data/practicalContent';
import { 
  User, Edit3, Save, Check, Trophy, Zap, Clock, Shield, 
  LogOut, Terminal, Sparkles, Award, Cpu, BookOpen, Settings, X,
  Lock, Mail, Key, Trash2, AlertTriangle, RefreshCw, Crown, Info, KeyRound,
  Medal, Star, FlaskConical
} from 'lucide-react';

const AVATAR_PRESETS = [
  { id: 'cyber-1', name: 'Cyber Samurai', icon: '⚔️', bg: 'from-cyan-500 to-blue-600' },
  { id: 'cyber-2', name: 'Net Architect', icon: '⚡', bg: 'from-purple-500 to-indigo-600' },
  { id: 'cyber-3', name: 'Kernel Ghost', icon: '👻', bg: 'from-emerald-500 to-teal-600' },
  { id: 'cyber-4', name: 'Crypto Specialist', icon: '🔐', bg: 'from-amber-500 to-orange-600' },
  { id: 'cyber-5', name: 'System Operator', icon: '🤖', bg: 'from-pink-500 to-rose-600' },
  { id: 'girl-1', name: 'Starry Guide', icon: '✨', bg: 'from-indigo-500 via-purple-500 to-pink-500' },
  { id: 'girl-2', name: 'Pop Step', icon: '🎧', bg: 'from-pink-500 to-rose-500' },
  { id: 'girl-3', name: 'Aura', icon: '🔮', bg: 'from-fuchsia-500 to-violet-600' },
  { id: 'girl-4', name: 'Cyber Siren', icon: '🌌', bg: 'from-violet-500 to-cyan-500' },
  { id: 'boy-1', name: 'SAMYAZA', icon: '👑', bg: 'from-red-600 to-zinc-900' },
  { id: 'boy-2', name: 'Typhoon', icon: '🌀', bg: 'from-teal-500 to-blue-700' },
  { id: 'boy-3', name: 'Blueflames', icon: '🔥', bg: 'from-blue-600 to-cyan-400' },
  { id: 'boy-4', name: 'Devil in Me', icon: '😈', bg: 'from-rose-700 via-red-900 to-black' },
  { id: 'void-1', name: 'Void Voyager', icon: '🕳️', bg: 'from-slate-900 via-purple-950 to-black' },
];

export default function Profile() {
  const { 
    user, userProfile, updateProfile, logoutUser, 
    getRemainingSeconds, tickActiveTimer, topicProgress, botName, setBotName,
    teamName, setTeamName, activeTopicId, placementScore: storePlacementScore
  } = useAppStore();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(userProfile?.username || user?.username || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(userProfile?.bio || '');
  const [selectedTitle, setSelectedTitle] = useState(userProfile?.title || 'Cyber Initiate');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [isEditingBot, setIsEditingBot] = useState(false);
  const [botInput, setBotInput] = useState(botName || 'Grok-Bot');
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamInput, setTeamInput] = useState(teamName || 'Alpha Squad');

  const [showProModal, setShowProModal] = useState(false);
  const [devCodeInput, setDevCodeInput] = useState('');
  const [devCodeStatus, setDevCodeStatus] = useState({ type: '', msg: '' });
  const [isPro, setIsPro] = useState(userProfile?.isPro || false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [emailGuideAlert, setEmailGuideAlert] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const [practiceProgress, setPracticeProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('byteforged_practical_progress');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    if (userProfile?.username || user?.username) setUsernameInput(userProfile?.username || user?.username || '');
    if (userProfile?.bio !== undefined) setBioInput(userProfile.bio || '');
    if (userProfile?.title !== undefined) setSelectedTitle(userProfile.title || 'Cyber Initiate');
    if (userProfile?.isPro !== undefined) setIsPro(userProfile.isPro);
  }, [userProfile, user]);

  useEffect(() => { if (botName) setBotInput(botName); }, [botName]);
  useEffect(() => { if (teamName) setTeamInput(teamName); }, [teamName]);
  useEffect(() => { if (user?.email) setNewEmail(user.email); }, [user?.email]);

  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    return typeof getRemainingSeconds === 'function' ? Math.max(0, getRemainingSeconds() || 0) : 0;
  });

  useEffect(() => {
    const updateTime = () => {
      if (typeof getRemainingSeconds === 'function') {
        setRemainingSeconds(Math.max(0, getRemainingSeconds() || 0));
      }
    };
    updateTime();
    const timer = setInterval(() => {
      if (typeof tickActiveTimer === 'function') tickActiveTimer();
      updateTime();
    }, 1000);
    const handleVisibilityChange = () => { if (!document.hidden) updateTime(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, getRemainingSeconds, tickActiveTimer]);

  const hoursLeft = Math.floor(remainingSeconds / 3600);
  const minsLeft = Math.floor((remainingSeconds % 3600) / 60);
  const secsLeft = remainingSeconds % 60;

  const allTopicValues = Object.values(topicProgress || {});
  const getUnifiedTopicProgress = (t) => {
    if (!t) return 0;
    if (t.progress !== undefined) return t.progress;
    const quiz = t.quizScore ?? t.score ?? 0;
    const moduleProgress = t.actualProgress ?? t.readingProgress ?? 0;
    return Math.round((quiz + moduleProgress) / 2);
  };

  const unifiedTopicScores = allTopicValues.map(getUnifiedTopicProgress);
  const completedTopics = allTopicValues.filter(t => getUnifiedTopicProgress(t) >= 100).length;
  const activeTopicObj = activeTopicId ? topicProgress?.[activeTopicId] : null;
  
  const currentUnifiedScore = Math.max(
    storePlacementScore || 0, userProfile?.quizScore || 0, userProfile?.placementScore || 0,
    userProfile?.score || 0, getUnifiedTopicProgress(activeTopicObj), ...unifiedTopicScores, 0
  );

  const avgUnifiedProgress = allTopicValues.length > 0 
    ? Math.round(allTopicValues.reduce((acc, t) => acc + getUnifiedTopicProgress(t), 0) / allTopicValues.length)
    : currentUnifiedScore;

  const operativeLevel = Math.max(1, Math.min(10, Math.floor(avgUnifiedProgress / 10) + 1));
  
  const isSystemInitialized = Boolean(
    userProfile?.has_completed_onboarding || 
    userProfile?.hasCompletedOnboarding || 
    userProfile?.onboardingCompleted || 
    userProfile?.onboarding === false
  );

  const isBronzeUnlocked = currentUnifiedScore >= 40;
  const isSilverUnlocked = currentUnifiedScore >= 50;
  const isGoldUnlocked = currentUnifiedScore >= 60;
  const isPlatinumUnlocked = currentUnifiedScore >= 80;
  const isDiamondUnlocked = currentUnifiedScore >= 100;

  // Medal tier colors are SEMANTIC — kept distinct (not page-themed)
  const currentMedalTier = isDiamondUnlocked
    ? { name: 'Diamond Overseer', icon: '💎', color: 'text-cyan-300 border-cyan-400/60 bg-cyan-500/20' }
    : isPlatinumUnlocked ? { name: 'Platinum Sentinel', icon: '🔷', color: 'text-emerald-300 border-emerald-400/60 bg-emerald-500/20' }
    : isGoldUnlocked ? { name: 'Gold Vanguard', icon: '🥇', color: 'text-amber-300 border-amber-500/60 bg-amber-500/20' }
    : isSilverUnlocked ? { name: 'Silver Specialist', icon: '🥈', color: 'text-slate-200 border-slate-400/60 bg-slate-500/20' }
    : isBronzeUnlocked ? { name: 'Bronze Operative', icon: '🥉', color: 'text-amber-600 border-amber-700/60 bg-amber-900/20' }
    : { name: 'Unranked Recruit', icon: '🛡️', color: 'text-slate-400 border-slate-700 bg-slate-900/60' };

  const practiceLabCompletion = useMemo(() => {
    try {
      const saved = localStorage.getItem('byteforged_practical_progress');
      if (!saved) return 0;
      
      const practiceProgress = JSON.parse(saved);
      
      const completedStepsCount = Object.values(practiceProgress).reduce((acc, topicData) => {
        return acc + Object.values(topicData || {}).filter(Boolean).length;
      }, 0);
      
      const totalStepsCount = Object.values(PRACTICAL_CONTENT).reduce((acc, topic) => {
        return acc + (topic?.steps?.length || 0);
      }, 0);
      
      if (totalStepsCount === 0) return 0;
      return Math.round((completedStepsCount / totalStepsCount) * 100);
    } catch {
      return 0;
    }
  }, []);

  const totalArcadeScore = useMemo(() => {
    try {
      const saved = localStorage.getItem('byteforged_minigames_state_final_v12');
      if (saved) {
        const parsed = JSON.parse(saved);
        const modeScores = parsed.modeScores || {};
        return Object.values(modeScores).reduce((acc, score) => acc + (score || 0), 0);
      }
    } catch {}
    return 0;
  }, []);

  const BADGES = [
    { 
      id: 'b1', 
      name: 'System Initialized', 
      desc: 'Completed Operative Onboarding & System Setup', 
      icon: '🚀', 
      unlocked: isSystemInitialized, 
      titleUnlocked: 'System Operator' 
    },
    { 
      id: 'b2', 
      name: 'Byte Master', 
      desc: 'Achieved 100% unified progress on an active module', 
      icon: '⚡', 
      unlocked: Boolean(getUnifiedTopicProgress(activeTopicObj) === 100 || allTopicValues.some(t => getUnifiedTopicProgress(t) === 100)), 
      titleUnlocked: 'Byte Master' 
    },
    { 
      id: 'b4', 
      name: 'Arcade Tactician', 
      desc: 'Earn 15000+ total points across all Minigames modes', 
      icon: '🎮', 
      unlocked: totalArcadeScore >= 15000, 
      titleUnlocked: 'Arcade Tactician' 
    },
    { 
      id: 'lab-runner', 
      name: 'Lab Runner', 
      desc: 'Complete 80%+ of all Practical Lab exercises', 
      icon: '🧪', 
      unlocked: practiceLabCompletion >= 80, 
      titleUnlocked: 'Lab Runner' 
    },
    { 
      id: 'b6', 
      name: 'Cyber Sentinel', 
      desc: 'Earn Platinum Badge on system modules (80%+ unified progress)', 
      icon: '🛡️', 
      unlocked: isPlatinumUnlocked, 
      titleUnlocked: 'Platinum Cyber Sentinel' 
    },
    { id: 'm-bronze', name: 'Bronze Progress Rank', desc: 'Achieve 40%+ unified progress on system modules', icon: '🥉', unlocked: isBronzeUnlocked, titleUnlocked: 'Bronze Operative' },
    { id: 'm-silver', name: 'Silver Progress Rank', desc: 'Achieve 50%+ unified progress (Pass Mark) on system modules', icon: '🥈', unlocked: isSilverUnlocked, titleUnlocked: 'Silver Specialist' },
    { id: 'm-gold', name: 'Gold Progress Rank', desc: 'Achieve 60%+ unified progress on system modules', icon: '🥇', unlocked: isGoldUnlocked, titleUnlocked: 'Gold Vanguard' },
    { id: 'm-platinum', name: 'Platinum Progress Rank', desc: 'Achieve 80%+ unified progress on system modules', icon: '🔷', unlocked: isPlatinumUnlocked, titleUnlocked: 'Platinum Cyber Sentinel' },
    { id: 'm-diamond', name: 'Diamond Progress Rank', desc: 'Achieve a perfect 100% unified progress on system modules', icon: '💎', unlocked: isDiamondUnlocked, titleUnlocked: 'Diamond Overseer' }
  ];

  const unlockedTitles = Array.from(new Set(['Cyber Initiate', ...BADGES.filter(b => b.unlocked && b.titleUnlocked).map(b => b.titleUnlocked)]));

  const handleSaveUsername = async () => {
    sounds?.playClick?.();
    const trimmed = usernameInput.trim();
    if (!trimmed) return;
    try {
      if (updateProfile) await updateProfile({ username: trimmed });
      if (user?.id) {
        const { error } = await supabase.from('profiles').update({ username: trimmed }).eq('id', user.id);
        if (error) throw error;
      }
      setIsEditingUsername(false);
    } catch (err) {
      console.error('Failed to update username:', err);
      alert('Failed to update username: ' + err.message);
    }
  };

  const handleSaveBio = async () => {
    sounds?.playClick?.();
    if (updateProfile) {
      updateProfile({ bio: bioInput.trim(), title: selectedTitle });
    }
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ bio: bioInput.trim(), title: selectedTitle })
          .eq('id', user.id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to save bio/title:', err);
        alert('Failed to save bio/title: ' + err.message);
      }
    }
    setIsEditingBio(false);
  };

  const handleSaveBot = () => {
    sounds?.playClick?.();
    if (setBotName) setBotName(botInput.trim());
    setIsEditingBot(false);
  };

  const handleSaveTeam = () => {
    sounds?.playClick?.();
    if (setTeamName) setTeamName(teamInput.trim());
    setIsEditingTeam(false);
  };

  const handleSelectAvatar = async (preset) => {
    sounds?.playClick?.();
    if (updateProfile) {
      updateProfile({ avatar: preset.icon, avatarBg: preset.bg });
    }
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar: preset.icon, avatar_bg: preset.bg })
          .eq('id', user.id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to save avatar:', err);
        alert('Failed to save avatar: ' + err.message);
      }
    }
    setShowAvatarPicker(false);
  };

  const handleVerifyDevCode = (e) => {
    e.preventDefault();
    sounds?.playClick?.();
    const formattedCode = devCodeInput.trim().toUpperCase();
    const SECRET_PRO_CODES = ['BYTE-PRO-8921-X', 'BYTE-PRO-4410-Z'];
    if (SECRET_PRO_CODES.includes(formattedCode)) {
      setIsPro(true);
      if (updateProfile) updateProfile?.({ isPro: true });
      setDevCodeStatus({ type: 'success', msg: '⚡ PRO Dev Clearance Granted! Access Unlocked.' });
      setDevCodeInput('');
    } else {
      setDevCodeStatus({ type: 'error', msg: '❌ Invalid Dev Code. Verification Failed.' });
    }
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    sounds?.playClick?.();
    setSettingsMessage(''); setSettingsError(''); setEmailGuideAlert(false); setSettingsLoading(true);
    try {
      let isEmailUpdated = false, isPasswordUpdated = false;
      if (newEmail.trim() && newEmail.trim() !== user?.email) {
        if (!currentPassword) throw new Error('Please enter your current password to authorize email change.');
        const { error: authErr } = await supabase.auth.signInWithPassword({ email: user?.email || '', password: currentPassword });
        if (authErr) throw new Error('Current password verification failed. Incorrect password.');
        const { error: emailErr } = await supabase.auth.updateUser({ email: newEmail.trim() });
        if (emailErr) throw emailErr;
        isEmailUpdated = true; setEmailGuideAlert(true);
      }
      if (newPassword) {
        if (!currentPassword) throw new Error('Please enter your current password to authorize password change.');
        if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
        if (newPassword !== confirmNewPassword) throw new Error('New password and confirmation password do not match.');
        const { error: authErr } = await supabase.auth.signInWithPassword({ email: user?.email || '', password: currentPassword });
        if (authErr) throw new Error('Current password verification failed. Incorrect password.');
        const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
        if (passErr) throw passErr;
        isPasswordUpdated = true;
      }
      if (!isEmailUpdated && !isPasswordUpdated) {
        setSettingsMessage('No credential changes detected.');
      } else {
        setSettingsMessage('⚡ Account credentials updated successfully!');
        setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
      }
    } catch (err) {
      setSettingsError(err.message || 'Failed to update credentials.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    sounds?.playClick?.();
    setSettingsError('');
    if (!deletePassword) { setSettingsError('Current password is required to permanently delete your account.'); return; }
    setSettingsLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: user?.email || '', password: deletePassword });
      if (authErr) throw new Error('Incorrect password. Account deletion authorization failed.');
      const confirmed = window.confirm('⚠️ DANGER: Are you sure you want to PERMANENTLY DELETE your account? This purges your email registration completely from system memory.');
      if (!confirmed) { setSettingsLoading(false); return; }
      const { error: rpcErr } = await supabase.rpc('delete_user_account');
      if (rpcErr) {
        console.warn('RPC deletion fallback:', rpcErr.message);
        if (user?.id) await supabase.from('profiles').delete().eq('id', user.id);
      }
      await supabase.auth.signOut();
      if (typeof logoutUser === 'function') logoutUser();
      window.location.reload();
    } catch (err) {
      console.error('Account purge exception:', err);
      setSettingsError(err.message || 'Account purge failed.');
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-6 font-mono space-y-8 animate-fadeIn min-h-screen relative">
      
      {/* Indigo/Blue Background Glows — identity depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-violet-400/5 rounded-full blur-[100px]" />
      </div>

      {/* Profile Header Card — Frosted Glass */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-5">
            <div className="relative group">
              <div className={`w-22 h-22 rounded-2xl bg-gradient-to-br ${userProfile?.avatarBg || 'from-indigo-500 to-blue-600'} flex items-center justify-center text-4xl shadow-xl border-2 border-indigo-400/60 shadow-indigo-500/20`}>
                {userProfile?.avatar || '⚔️'}
              </div>
              <button onClick={() => { sounds?.playClick?.(); setShowAvatarPicker(!showAvatarPicker); }} className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-slate-950/80 border border-indigo-500/40 text-indigo-400 hover:bg-slate-800 transition shadow-lg backdrop-blur-sm" title="Change Avatar">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-3">
                {isEditingUsername ? (
                  <div className="flex items-center space-x-2">
                    <input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="Enter username..." className="bg-slate-950/60 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-1 text-xl font-extrabold text-white focus:outline-none backdrop-blur-sm" />
                    <button onClick={handleSaveUsername} className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-extrabold rounded-xl hover:opacity-90 transition" title="Save Username"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setIsEditingUsername(false)} className="p-2 bg-slate-800 text-slate-300 rounded-xl hover:text-white transition" title="Cancel"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-blue-300 to-slate-200 tracking-wide">{userProfile?.username || user?.username || ''}</h1>
                    <button onClick={() => { sounds?.playClick?.(); setIsEditingUsername(true); }} className="text-slate-400 hover:text-indigo-400 transition" title="Change Username"><Edit3 className="w-4 h-4" /></button>
                  </div>
                )}
                <span className={`text-xs px-3 py-1 rounded-full font-extrabold tracking-wider border ${isPro ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/10' : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-500/10'}`}>
                  {isPro ? 'PRO OPERATIVE' : `OPERATIVE LEVEL ${operativeLevel}`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-extrabold text-indigo-300 bg-indigo-500/10 border border-indigo-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-sm">
                  <Medal className="w-4 h-4 text-indigo-400" /> {selectedTitle}
                </span>
                <span className="text-sm text-slate-300 font-medium">{user?.email || 'operative@byteforged.io'}</span>
              </div>
              <div className="pt-2">
                {isEditingBio ? (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="text" value={bioInput} onChange={(e) => setBioInput(e.target.value)} placeholder="Enter system bio..." className="bg-slate-950/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none w-72 backdrop-blur-sm" />
                      <button onClick={handleSaveBio} className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-extrabold rounded-lg hover:opacity-90" title="Save Bio & Title"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setIsEditingBio(false)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-300 font-extrabold uppercase">Equipped Title:</span>
                      <select value={selectedTitle} onChange={(e) => setSelectedTitle(e.target.value)} className="bg-slate-950/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-bold focus:outline-none backdrop-blur-sm">
                        {unlockedTitles.map((title) => (<option key={title} value={title} className="bg-slate-950 text-white">{title}</option>))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2.5 text-sm text-slate-200 font-medium">
                    <span>{userProfile?.bio || 'No operative bio specified.'}</span>
                    <button onClick={() => { sounds?.playClick?.(); setIsEditingBio(true); }} className="text-slate-400 hover:text-indigo-400 transition" title="Edit Bio and Equipped Title"><Edit3 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <button onClick={() => { sounds?.playClick?.(); setShowProModal(true); }} className={`px-4 py-2.5 rounded-xl border font-black text-xs transition flex items-center space-x-2 shadow-lg group ${isPro ? 'bg-amber-500/20 border-amber-500/60 text-amber-300' : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50 text-amber-300 hover:border-amber-400'}`}>
              <Crown className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" /> <span>{isPro ? 'PRO ACTIVE' : 'PRO CLEARANCE'}</span>
            </button>
            <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-indigo-500/30 text-right backdrop-blur-sm">
              <span className="text-xs uppercase font-extrabold text-slate-300 block">ACTIVE TIMER</span>
              <span className="text-base font-extrabold text-indigo-300">⏳ {hoursLeft}h {minsLeft}m {String(secsLeft).padStart(2, '0')}s</span>
            </div>
            <button onClick={() => { sounds?.playClick?.(); setShowSettingsModal(true); }} className="p-3 rounded-xl bg-slate-950/60 border border-slate-700 text-slate-200 hover:text-indigo-400 hover:border-indigo-500/50 transition shadow-lg backdrop-blur-sm" title="Account Settings"><Settings className="w-5 h-5" /></button>
            <button onClick={() => { sounds?.playClick?.(); logoutUser?.(); }} className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 text-xs font-black transition flex items-center space-x-2 shadow-lg backdrop-blur-sm">
              <LogOut className="w-4 h-4" /> <span>TERMINATE SESSION</span>
            </button>
          </div>
        </div>
        {showAvatarPicker && (
          <div className="mt-6 pt-6 border-t border-indigo-500/20 animate-fadeIn space-y-3">
            <span className="text-xs text-indigo-400 font-extrabold uppercase block tracking-wider">Select Operative Avatar (14 Presets):</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {AVATAR_PRESETS.map((preset) => (
                <button key={preset.id} onClick={() => handleSelectAvatar(preset)} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-700 hover:border-indigo-500/50 flex flex-col items-center justify-center space-y-2 transition text-center group backdrop-blur-sm hover:shadow-md hover:shadow-indigo-500/10">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${preset.bg} flex items-center justify-center text-2xl shadow-lg`}>{preset.icon}</div>
                  <span className="text-xs font-extrabold text-slate-200 group-hover:text-white truncate max-w-full">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid — Frosted Glass */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-indigo-500/20 space-y-2 shadow-lg shadow-indigo-500/5 backdrop-blur-2xl relative">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
          <div className="flex items-center justify-between text-slate-300"><span className="text-sm font-extrabold uppercase tracking-wide">Completed Modules</span><BookOpen className="w-5 h-5 text-indigo-400" /></div>
          <div className="text-3xl font-black text-white">{completedTopics}</div>
          <p className="text-xs text-slate-400 font-medium">Modules hitting 100% unified progress</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-indigo-500/20 space-y-2 shadow-lg shadow-indigo-500/5 backdrop-blur-2xl relative">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
          <div className="flex items-center justify-between text-slate-300"><span className="text-sm font-extrabold uppercase tracking-wide">Progress Rank Badge</span><Medal className="w-5 h-5 text-amber-400" /></div>
          <div className="flex items-center space-x-2">
            <span className="text-3xl">{currentMedalTier.icon}</span>
            <span className={`text-base font-black px-2.5 py-1 rounded-lg border ${currentMedalTier.color}`}>{currentMedalTier.name}</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Peak unified progress: {currentUnifiedScore}%</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-indigo-500/20 space-y-2 shadow-lg shadow-indigo-500/5 backdrop-blur-2xl relative">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-sm font-extrabold uppercase tracking-wide">Active Companion</span>
            <div className="flex items-center space-x-1">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <button onClick={() => { sounds?.playClick?.(); setIsEditingBot(!isEditingBot); }} className="text-slate-400 hover:text-indigo-400 transition ml-1"><Edit3 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          {isEditingBot ? (
            <div className="flex items-center space-x-1 pt-1">
              <input type="text" value={botInput} onChange={(e) => setBotInput(e.target.value)} className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none backdrop-blur-sm" />
              <button onClick={handleSaveBot} className="p-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded hover:opacity-90"><Check className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="text-3xl font-black text-white truncate">{botName || 'Grok-Bot'}</div>
          )}
          <p className="text-xs text-slate-400 font-medium">AI practice assist module</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-indigo-500/20 space-y-2 shadow-lg shadow-indigo-500/5 backdrop-blur-2xl relative">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-sm font-extrabold uppercase tracking-wide">Squad Designation</span>
            <div className="flex items-center space-x-1">
              <Shield className="w-5 h-5 text-amber-400" />
              <button onClick={() => { sounds?.playClick?.(); setIsEditingTeam(!isEditingTeam); }} className="text-slate-400 hover:text-amber-400 transition ml-1"><Edit3 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          {isEditingTeam ? (
            <div className="flex items-center space-x-1 pt-1">
              <input type="text" value={teamInput} onChange={(e) => setTeamInput(e.target.value)} className="w-full bg-slate-950/60 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none backdrop-blur-sm" />
              <button onClick={handleSaveTeam} className="p-1.5 bg-amber-400 text-black rounded hover:opacity-90"><Check className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="text-3xl font-black text-white truncate">{teamName || 'Alpha Squad'}</div>
          )}
          <p className="text-xs text-slate-400 font-medium">Peer practice team hub</p>
        </div>
      </div>

      {/* Badges Card — Frosted Glass */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-indigo-500/20 space-y-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl relative">
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
        
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-400/30">
              <Award className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-blue-300 to-slate-200">System Badges, Medals & Accolades</h2>
              <p className="text-xs font-medium text-slate-300">Progress rank medals unlock match titles for profile customization</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-sm">Unlocked: {BADGES.filter(b => b.unlocked).length} / {BADGES.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGES.map((badge) => (
            <div key={badge.id} className={`p-4 rounded-2xl border flex items-start space-x-3.5 transition shadow-md backdrop-blur-sm ${badge.unlocked ? 'bg-slate-950/60 border-indigo-500/40 text-white shadow-indigo-500/5' : 'bg-slate-950/40 border-slate-700 text-slate-500 opacity-60'}`}>
              <div className="text-3xl p-2.5 rounded-xl bg-slate-800/80 flex-shrink-0">{badge.icon}</div>
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-100">{badge.name}</span>
                  {badge.unlocked ? (
                    <span className="text-[11px] font-extrabold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/40">UNLOCKED</span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/60 flex items-center gap-1"><Lock className="w-3 h-3" /> LOCKED</span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-300 leading-relaxed">{badge.desc}</p>
                {badge.titleUnlocked && badge.unlocked && (
                  <div className="text-[11px] font-extrabold text-indigo-300 pt-1 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-indigo-400" /><span>Title Unlocked: {badge.titleUnlocked}</span></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRO Modal — Frosted Glass */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900/80 border border-amber-500/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-amber-500/20 relative backdrop-blur-2xl">
            <button onClick={() => setShowProModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/80 border border-slate-700 backdrop-blur-sm"><X className="w-5 h-5" /></button>
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-amber-400" />
              <div>
                <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">PRO Operative Clearance</h3>
                <p className="text-xs text-slate-400">Enter authorization key for high-level clearance</p>
              </div>
            </div>
            <form onSubmit={handleVerifyDevCode} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-300 uppercase block mb-1">Clearance Code</label>
                <input type="text" value={devCodeInput} onChange={(e) => setDevCodeInput(e.target.value)} placeholder="e.g. BYTE-PRO-xxxx-x" className="w-full bg-slate-950/60 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white focus:outline-none uppercase backdrop-blur-sm" />
              </div>
              {devCodeStatus.msg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${devCodeStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}`}>{devCodeStatus.msg}</div>
              )}
              <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm transition shadow-lg shadow-amber-500/20">VERIFY CLEARANCE</button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal — Frosted Glass */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900/80 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-indigo-500/20 relative max-h-[90vh] overflow-y-auto backdrop-blur-2xl">
            <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/80 border border-slate-700 backdrop-blur-sm"><X className="w-5 h-5" /></button>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-400/30">
                <Settings className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-blue-300 to-slate-200">Account Credentials & Settings</h3>
                <p className="text-xs text-slate-400">Update security parameters and authentication details</p>
              </div>
            </div>
            {settingsError && <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold backdrop-blur-sm">{settingsError}</div>}
            {settingsMessage && <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold backdrop-blur-sm">{settingsMessage}</div>}
            {emailGuideAlert && <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold backdrop-blur-sm">ℹ️ Check your email inbox to confirm the address change.</div>}
            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-300 uppercase block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-indigo-400/60 absolute left-3.5 top-3.5" />
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none backdrop-blur-sm" />
                </div>
              </div>
              <div className="border-t border-indigo-500/20 pt-4 space-y-3">
                <span className="text-xs font-extrabold text-indigo-300 uppercase block">Security Authorization</span>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Current Password (Required for changes)</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-indigo-400/60 absolute left-3.5 top-3.5" />
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none backdrop-blur-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">New Password (Optional)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-indigo-400/60 absolute left-3.5 top-3.5" />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none backdrop-blur-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-indigo-400/60 absolute left-3.5 top-3.5" />
                    <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none backdrop-blur-sm" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={settingsLoading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-extrabold text-sm transition disabled:opacity-50 shadow-lg shadow-indigo-500/20">{settingsLoading ? 'UPDATING...' : 'SAVE CREDENTIAL CHANGES'}</button>
            </form>
            <div className="border-t border-red-500/20 pt-4 space-y-3">
              <div className="flex items-center space-x-2 text-red-400"><AlertTriangle className="w-4 h-4" /><span className="text-xs font-extrabold uppercase">Danger Zone</span></div>
              <div>
                <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Enter current password to confirm deletion" className="w-full bg-slate-950/60 border border-red-500/30 focus:border-red-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none mb-2 backdrop-blur-sm" />
                <button onClick={handleDeleteAccount} disabled={settingsLoading} className="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 font-extrabold text-xs transition flex items-center justify-center space-x-2 backdrop-blur-sm">
                  <Trash2 className="w-4 h-4" /><span>PERMANENTLY PURGE ACCOUNT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}