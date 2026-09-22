import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { topicContent } from '../data/topicContent';
import { askAura1Bot } from '../lib/aura';
import { sounds } from '../lib/soundEngine';
import { supabase } from '../lib/supabaseClient';
import confetti from 'canvas-confetti';
import { 
  Users, Bot, Edit3, Send, Mic, Square, ArrowRight, ArrowLeft, 
  Share2, Menu, Sparkles, UserCheck, Shield,
  UserPlus, ChevronDown, Lock, AlertTriangle,
  Trophy, RotateCcw, X, Play, Pause, Volume2, VolumeX, Lightbulb, RefreshCw, Trash2, LogOut, ArrowDown, Loader2
} from 'lucide-react';

const EARNABLE_TITLES = {
  'ict-101': 'Digital Pioneer', 'ict-102': 'Silicon Architect', 'ict-103': 'Interface Maestro',
  'ict-104': 'Memory Warden', 'ict-105': 'Kernel Commander', 'ict-106': 'Workflow Virtuoso',
  'ict-107': 'Network Navigator', 'ict-108': 'Web Sentinel', 'ict-109': 'Cyber Guardian',
  'ict-110': 'File System Overseer', 'ict-111': 'Multimedia Virtuoso', 'ict-112': 'Database Strategist',
  'ict-113': 'Systems Architect', 'ict-114': 'Ethical Tech Steward', 'cs-201': 'Algorithmic Mastermind',
  'cs-202': 'Binary Whisperer', 'cs-203': 'Circuit Weaver', 'cs-204': 'Boolean Virtuoso',
  'cs-205': 'Pseudocode Architect', 'cs-206': 'Variable Virtuoso', 'cs-207': 'Branch Navigator',
  'cs-208': 'Loop Sovereign', 'cs-209': 'Array Strategist', 'cs-210': 'Scope Governor',
  'cs-211': 'Search & Sort Specialist', 'cs-212': 'Bug Slayer'
};

const SELF_ROLES = ['Member', 'Leader', 'Contributor', 'Strategist', 'Reviewer'];
const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

const getFallbackTopicData = (topicId) => {
  const cleanTitle = (topicId || 'ict-101').replace('-', ' ').toUpperCase();
  const notes = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1, title: `${cleanTitle} - Note #${i + 1}`,
    front: `Core Concept #${i + 1}: Fundamentals of ${cleanTitle}.`,
    frontSummary: `Core Concept #${i + 1}: Fundamentals of ${cleanTitle}.`,
    back: `Technical Breakdown #${i + 1}: Specifications and mechanics for ${cleanTitle}.`,
    backBreakdown: `Technical Breakdown #${i + 1}: Specifications and mechanics for ${cleanTitle}.`,
    coolFact: `Trivia #${i + 1}: Modular design in ${cleanTitle} optimizes system performance across nodes!`,
  }));
  const quizzes = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1, question: `Assessment Q${i + 1}: What primary mechanism governs ${cleanTitle} (Phase ${i < 7 ? 'Midpoint' : 'Final'})?`,
    answer: `Official Answer Key #${i + 1}: Standard system protocol governed by logical gate sequence ${i + 1}.`,
  }));
  return { notes, quizzes };
};

// ============================================================================
// CUSTOM AUDIO PLAYER â€” volume, speed, duration badge
// ============================================================================
function AudioPlayer({ src, initialDuration = 0, theme = 'cyan' }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const themeClasses = {
    cyan: 'bg-cyan-500 hover:bg-cyan-400 border-cyan-500/40',
    purple: 'bg-purple-500 hover:bg-purple-400 border-purple-500/40',
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || initialDuration);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [src, initialDuration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cycleSpeed = () => {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackRate);
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
    if (audioRef.current) audioRef.current.playbackRate = next;
    setPlaybackRate(next);
  };

  const formatTime = (s) => {
    if (isNaN(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-2">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-2">
        <button onClick={togglePlay} className={`p-2 rounded-lg ${themeClasses[theme]} text-slate-950 transition flex-shrink-0 shadow-md`}>
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1 space-y-1">
          <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className={`absolute inset-y-0 left-0 ${theme === 'cyan' ? 'bg-cyan-400' : 'bg-purple-400'} rounded-full transition-all`} style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <button onClick={toggleMute} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex-shrink-0">
          {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <button onClick={cycleSpeed} className="px-1.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-black transition flex-shrink-0 min-w-[32px]">
          {playbackRate}x
        </button>
      </div>
      <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (audioRef.current) { audioRef.current.volume = v; audioRef.current.muted = v === 0; }
          setVolume(v); setIsMuted(v === 0);
        }}
        className="w-full h-1 accent-cyan-400 cursor-pointer"
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Home() {
  const { 
    botName, setBotName, isTeamMode, setIsTeamMode, teamName, setTeamName,
    selectedTopicId, updateTopicProgress, setActiveTab, savedPageStates, savePageState,
    user, userProfile
  } = useAppStore();

  const currentUsername = userProfile?.username || user?.username || 'Operative';
  const currentUserAvatar = userProfile?.avatar || 'âš¡';

  const activeTopicKey = selectedTopicId || 'ict-101';
  const rawDeck = (topicContent && topicContent[activeTopicKey]) || getFallbackTopicData(activeTopicKey);
  const deck = {
    notes: rawDeck.notes && rawDeck.notes.length ? rawDeck.notes : getFallbackTopicData(activeTopicKey).notes,
    quizzes: (rawDeck.tests || rawDeck.quizzes) && (rawDeck.tests || rawDeck.quizzes).length 
      ? (rawDeck.tests || rawDeck.quizzes) : getFallbackTopicData(activeTopicKey).quizzes
  };

  const topicSavedState = (savedPageStates && savedPageStates[activeTopicKey]) || {};
  const [noteIndex, setNoteIndex] = useState(topicSavedState.noteIndex || 0); 
  const [quizIndex, setQuizIndex] = useState(topicSavedState.quizIndex || 0); 
  const [isQuizMode, setIsQuizMode] = useState(topicSavedState.isQuizMode || false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answeredQuizSet, setAnsweredQuizSet] = useState(new Set(topicSavedState.answeredQuizSet || []));
  const [quizScores, setQuizScores] = useState(topicSavedState.quizScores || {});
  const [lockWarning, setLockWarning] = useState('');
  const [earnedMedal, setEarnedMedal] = useState(topicSavedState.earnedMedal || null);
  const [earnedTitle, setEarnedTitle] = useState(topicSavedState.earnedTitle || '');

  const [chatTab, setChatTab] = useState(() => localStorage.getItem('byteforged_chat_tab') || 'bot');
  useEffect(() => { localStorage.setItem('byteforged_chat_tab', chatTab); }, [chatTab]);
  useEffect(() => {
    if (!isTeamMode && chatTab !== 'bot') setChatTab('bot');
  }, [isTeamMode]);
  
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const initialBotChatState = [{
    id: 'bot-init-1', sender: botName || 'Aura-1', avatar: 'ðŸ¤–',
    text: `System online. I am ${botName || 'Aura-1'}, your CS & ICT evaluator. Need help or code breakdown for this step?`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'system'
  }];
  const [botChatMessages, setBotChatMessages] = useState(initialBotChatState);

  const [teamChatMessages, setTeamChatMessages] = useState([]);
  const [myTeamId, setMyTeamId] = useState(null);
  const [myMemberData, setMyMemberData] = useState(null);
  const realtimeChannelRef = useRef(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [prevMsgCount, setPrevMsgCount] = useState(0);
  const chatScrollRef = useRef(null);
  const chatBottomRef = useRef(null);
  
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);
  
  const userJustSentRef = useRef(false);

  const handleChatScroll = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const threshold = 150;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsNearBottom(nearBottom);
    if (nearBottom) setHasNewMessages(false);
  }, []);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMicRequesting, setIsMicRequesting] = useState(false);
  const recordingTimeRef = useRef(0);
  const [pendingRecording, setPendingRecording] = useState(null);
  const [micError, setMicError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);

  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [tempBotName, setTempBotName] = useState(botName || 'Aura-1');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [tempTeamName, setTempTeamName] = useState(teamName || 'Alpha Squad');
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [teamRoster, setTeamRoster] = useState([]);

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  const syncRosterFromDB = async () => {
    if (!user?.id) return;
    try {
      const { data: membership, error: mErr } = await supabase
        .from('team_members').select('team_id, role, team_assignment, score')
        .eq('user_id', user.id).limit(1);
      if (mErr) throw mErr;
      if (!membership || membership.length === 0) {
        setTeamRoster([]); setMyTeamId(null); setMyMemberData(null);
        return;
      }
      const teamId = membership[0].team_id;
      setMyTeamId(teamId); setMyMemberData(membership[0]);
      const { data: members, error: memErr } = await supabase
        .from('team_members')
        .select('user_id, role, team_assignment, score, profiles(id, username, avatar)')
        .eq('team_id', teamId);
      if (memErr) throw memErr;
      if (members) {
        setTeamRoster(members.map(m => ({
          id: m.user_id, username: m.profiles?.username || 'Unknown',
          avatar: m.profiles?.avatar || 'ðŸ‘¤', role: m.role || 'Member',
          team: m.team_assignment || 'BlueTeam', score: m.score || 0,
          isLeader: m.role === 'Leader'
        })));
      }
    } catch (err) { console.error('Roster sync failed:', err); }
  };

  const handleSelectMyRole = async (newRole) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase.from('team_members').update({ role: newRole }).eq('user_id', user.id);
      if (error) throw error;
      await syncRosterFromDB();
      try { sounds?.playClick?.(); } catch {}
    } catch (err) { alert('Failed to update role: ' + err.message); }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    try {
      const { error } = await supabase.rpc('leave_team_proper');
      if (error) throw error;
      setTeamRoster([]); setMyTeamId(null); setMyMemberData(null); setTeamChatMessages([]);
      try { sounds?.playClick?.(); } catch {}
    } catch (err) { alert('Failed to leave team: ' + err.message); }
  };

  const loadTeamChatHistory = async (teamId) => {
    try {
      const { data, error } = await supabase.from('team_messages').select('*')
        .eq('team_id', teamId).eq('channel', 'team')
        .order('created_at', { ascending: true }).limit(100);
      if (error) throw error;
      setTeamChatMessages((data || []).map(m => ({
        id: m.id, sender: m.sender_username, avatar: m.sender_avatar || 'ðŸ‘¤',
        text: m.body, audioUrl: m.audio_url,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderId: m.sender_id
      })));
    } catch (err) { console.error('Failed to load team chat history:', err); }
  };

  const subscribeToTeamChat = (teamId) => {
    if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
    const channel = supabase.channel(`team_chat_${teamId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'team_messages', filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new?.channel === 'team') {
            setTeamChatMessages(prev => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, {
                id: payload.new.id, sender: payload.new.sender_username,
                avatar: payload.new.sender_avatar || 'ðŸ‘¤', text: payload.new.body,
                audioUrl: payload.new.audio_url,
                time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                senderId: payload.new.sender_id
              }];
            });
          } else if (payload.eventType === 'DELETE') {
            setTeamChatMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    realtimeChannelRef.current = channel;
  };

  useEffect(() => {
    if (user?.id && isTeamMode) syncRosterFromDB();
    else if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [user?.id, isTeamMode]);

  useEffect(() => {
    if (myTeamId && isTeamMode) {
      loadTeamChatHistory(myTeamId);
      subscribeToTeamChat(myTeamId);
      const poll = setInterval(() => loadTeamChatHistory(myTeamId), 5000);
      return () => clearInterval(poll);
    } else { setTeamChatMessages([]); }
  }, [myTeamId, isTeamMode]);

  const sortedRoster = [...teamRoster].sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0));
  const currentNote = deck.notes[noteIndex] || { front: 'No note available', back: '' };
  const currentQuiz = deck.quizzes[quizIndex] || { question: 'No quiz available', answer: '' };

  const displayedMessages = chatTab === 'bot' ? botChatMessages : teamChatMessages;
  const currentMsgCount = displayedMessages.length;

  useEffect(() => {
    if (currentMsgCount > prevMsgCount) {
      const lastMsg = displayedMessages[currentMsgCount - 1];
      const isOwnMessage = lastMsg?.sender === currentUsername;
      if (userJustSentRef.current || isOwnMessage) {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        userJustSentRef.current = false;
      } else if (isNearBottom) {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        setHasNewMessages(true);
      }
    }
    setPrevMsgCount(currentMsgCount);
  }, [currentMsgCount, displayedMessages, isNearBottom, currentUsername, prevMsgCount]);

  const jumpToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setHasNewMessages(false);
  };

  useEffect(() => {
    if (savePageState) {
      savePageState(activeTopicKey, { noteIndex, quizIndex, isQuizMode, answeredQuizSet: Array.from(answeredQuizSet), quizScores, earnedMedal, earnedTitle });
    }
  }, [noteIndex, quizIndex, isQuizMode, answeredQuizSet, quizScores, earnedMedal, earnedTitle, activeTopicKey, savePageState]);

  const isMidpointQuizComplete = () => { for (let i = 0; i < 7; i++) { if (!answeredQuizSet.has(i)) return false; } return true; };
  const isFinalQuizComplete = () => { for (let i = 7; i < 15; i++) { if (!answeredQuizSet.has(i)) return false; } return true; };

  const calculateRewardTier = (scoresObj) => {
    const scoreValues = Object.values(scoresObj);
    if (scoreValues.length === 0) return { medal: 'Bronze', title: '', totalPoints: 0, averagePct: 0 };
    const totalPoints = scoreValues.reduce((acc, curr) => acc + curr, 0);
    const averagePct = Math.round((totalPoints / 150) * 100);
    let medal = 'Bronze';
    if (averagePct === 100) medal = 'Diamond';
    else if (averagePct >= 80) medal = 'Platinum';
    else if (averagePct >= 60) medal = 'Gold';
    else if (averagePct >= 50) medal = 'Silver';
    const title = averagePct === 100 ? (EARNABLE_TITLES[activeTopicKey] || 'Master Technologist') : '';
    return { medal, title, totalPoints, averagePct };
  };

  const calculateGlobalProgress = () => {
    if (!isQuizMode) return Math.round(((noteIndex + 1) / 30) * 100);
    const answeredCount = answeredQuizSet.size;
    const quizProg = Math.round((answeredCount / 15) * 100);
    return Math.max(quizIndex < 7 ? 50 : 90, quizProg);
  };
  const globalProgress = calculateGlobalProgress();

  useEffect(() => {
    if (globalProgress === 100) {
      const topicTitle = EARNABLE_TITLES[activeTopicKey] || 'Master Technologist';
      if (earnedTitle !== topicTitle) {
        setEarnedTitle(topicTitle); setEarnedMedal('Diamond');
        try { sounds?.playUnlock?.(); } catch {}
        confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#00f0ff', '#7000ff', '#ffffff'] });
        confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#00f0ff', '#7000ff', '#ffffff'] });
      }
    }
  }, [globalProgress, activeTopicKey, earnedTitle]);

  useEffect(() => {
    if (updateTopicProgress) updateTopicProgress(activeTopicKey, globalProgress, earnedMedal, earnedTitle);
  }, [noteIndex, quizIndex, isQuizMode, answeredQuizSet.size, earnedMedal, earnedTitle, globalProgress]);

  useEffect(() => {
    const handleBlur = () => { if (isRecordingRef.current) stopRecording(); };
    const handleVisibility = () => { if (document.hidden && isRecordingRef.current) stopRecording(); };
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const uploadVoiceNote = async (blob) => {
    if (!user?.id) return null;
    try {
      const fileName = `team_voice_${user.id}_${Date.now()}.webm`;
      const { error } = await supabase.storage
        .from('voice_notes').upload(fileName, blob, { contentType: 'audio/webm', upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('voice_notes').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Voice upload failed:', err);
      return URL.createObjectURL(blob);
    }
  };

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (e) {}
    cleanupStream();
    clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRecording(false);
  };

  const toggleRecording = async () => {
    if (isRecordingRef.current) {
      stopRecording();
      return;
    }

    if (pendingRecording) return;

    setMicError('');
    setIsMicRequesting(true);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setMicError('Microphone not supported (requires HTTPS).');
      setIsMicRequesting(false);
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      setMicError('Voice recording not supported in this browser.');
      setIsMicRequesting(false);
      return;
    }

    let stream = null;
    try {
      stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ audio: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Mic request timed out')), 6000))
      ]);
      streamRef.current = stream;
    } catch (err) {
      console.error('getUserMedia error:', err);
      setIsMicRequesting(false);
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setMicError('ðŸš« Microphone permission denied. Allow access in browser settings.');
      } else if (err?.name === 'NotFoundError') {
        setMicError('ðŸŽ™ï¸ No microphone detected.');
      } else if (err?.name === 'NotReadableError') {
        setMicError('ðŸ”’ Microphone is in use by another app.');
      } else {
        setMicError(`Mic error: ${err?.message || 'Could not access microphone.'}`);
      }
      return;
    }

    let mimeType = '';
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/mpeg'];
    for (const c of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(c)) { mimeType = c; break; }
      } catch {}
    }

    let mediaRecorder;
    try {
      const options = mimeType ? { mimeType } : {};
      mediaRecorder = new MediaRecorder(stream, options);
    } catch (err) {
      console.error('MediaRecorder constructor error:', err);
      cleanupStream();
      setIsMicRequesting(false);
      setMicError(`Recorder init failed: ${err?.message || 'unsupported format'}`);
      return;
    }
    mediaRecorderRef.current = mediaRecorder;

    audioChunksRef.current = [];
    recordingTimeRef.current = 0;
    setRecordingTime(0);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const duration = recordingTimeRef.current;
      const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
      cleanupStream();

      if (blob.size > 0) {
        setPendingRecording({
          blob,
          blobUrl: URL.createObjectURL(blob),
          duration,
          target: chatTab
        });
        try { sounds?.playClick?.(); } catch {}
      } else {
        setMicError('Recording came back empty â€” tap mic to try again.');
      }
      setIsRecording(false);
    };

    mediaRecorder.onerror = (err) => {
      console.error('MediaRecorder error:', err);
      cleanupStream();
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsRecording(false);
      setMicError('Recording interrupted â€” tap mic to retry.');
    };

    try {
      mediaRecorder.start(250);
    } catch (err) {
      console.error('MediaRecorder.start error:', err);
      cleanupStream();
      setIsMicRequesting(false);
      setMicError(`Could not start recorder: ${err?.message || 'format error'}`);
      return;
    }

    setIsRecording(true);
    setIsMicRequesting(false);
    try { sounds?.playUnlock?.(); } catch {}

    timerRef.current = setInterval(() => {
      recordingTimeRef.current += 1;
      setRecordingTime(recordingTimeRef.current);
    }, 1000);
  };

  const handleDiscardRecording = () => {
    if (pendingRecording?.blobUrl) {
      try { URL.revokeObjectURL(pendingRecording.blobUrl); } catch (e) {}
    }
    setPendingRecording(null);
    recordingTimeRef.current = 0;
    setRecordingTime(0);
  };

  const handleSendPendingRecording = async () => {
    if (!pendingRecording) return;
    const { blob, blobUrl, duration, target } = pendingRecording;
    setPendingRecording(null);
    userJustSentRef.current = true;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (target === 'bot') {
      setBotChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: currentUsername,
        avatar: currentUserAvatar,
        text: 'ðŸŽ™ï¸ Voice Note',
        audioUrl: blobUrl,
        duration,
        time: timeStr
      }]);
      await processAiSubmission(blob);
    } else if (target === 'team' && myTeamId) {
      const audioUrl = await uploadVoiceNote(blob);
      try { URL.revokeObjectURL(blobUrl); } catch (e) {}
      if (audioUrl) {
        await supabase.from('team_messages').insert({
          team_id: myTeamId, channel: 'team',
          sender_id: user.id, sender_username: currentUsername,
          sender_avatar: currentUserAvatar, body: 'ðŸŽ™ï¸ Voice Note', audio_url: audioUrl
        });
      }
    }
  };

  const processAiSubmission = async (userSubmissionInput) => {
    setIsThinking(true);
    let contextInfo = isQuizMode 
      ? `Evaluating Quiz Card #${quizIndex + 1}: "${currentQuiz.question}". Canonical Answer: "${currentQuiz.answer}". Evaluate accuracy and assign a score from 0 to 10 points.`
      : `Note Card #${noteIndex + 1}: "${currentNote.frontSummary || currentNote.front}"`;

    const aiReply = await askAura1Bot(userSubmissionInput, contextInfo, botName);
    
    if (isQuizMode) {
      let extractedScore = 8;
      const matchScoreTen = aiReply.match(/(\d{1,2})\s*\/\s*10/);
      if (matchScoreTen) extractedScore = Math.min(10, Math.max(0, parseInt(matchScoreTen[1], 10)));
      else { const standaloneScore = aiReply.match(/\b([0-9]|10)\b/); if (standaloneScore) extractedScore = parseInt(standaloneScore[1], 10); }
      const updatedScores = { ...quizScores, [quizIndex]: extractedScore };
      setQuizScores(updatedScores);
      setAnsweredQuizSet((prev) => new Set(prev).add(quizIndex));
      setLockWarning('');
      if (Object.keys(updatedScores).length === 15) {
        const { medal, title, totalPoints, averagePct } = calculateRewardTier(updatedScores);
        setEarnedMedal(medal); setEarnedTitle(title);
        try { sounds?.playUnlock?.(); } catch {}
        setLockWarning(`TOPIC COMPLETED! Score: ${totalPoints}/150 pts (${averagePct}%) | Badge: ${medal.toUpperCase()} ${title ? `| Title: ${title}` : ''}`);
      }
    }
    setBotChatMessages(prev => [...prev, {
      id: Date.now().toString(), sender: botName || 'Aura-1', avatar: 'ðŸ¤–',
      text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'ai'
    }]);
    setIsThinking(false);
  };

  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    try { sounds?.playClick?.(); } catch {}
    const userText = inputText.trim();
    setInputText('');
    userJustSentRef.current = true;

    if (chatTab === 'bot') {
      setBotChatMessages(prev => [...prev, {
        id: Date.now().toString(), sender: currentUsername, avatar: currentUserAvatar,
        text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      await processAiSubmission(userText);
    } else if (myTeamId) {
      await supabase.from('team_messages').insert({
        team_id: myTeamId, channel: 'team',
        sender_id: user.id, sender_username: currentUsername,
        sender_avatar: currentUserAvatar, body: userText
      });
    }
  };

  const handleDeleteTeamMessage = async (msgId) => {
    try {
      const { error } = await supabase.from('team_messages').delete().eq('id', msgId);
      if (error) throw error;
      setTeamChatMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) { alert('Failed to delete: ' + err.message); }
  };

  const handleCardTap = () => {
    if (isQuizMode && !answeredQuizSet.has(quizIndex)) {
      try { sounds?.playClick?.(); } catch {}
      setLockWarning("Flip Locked: Submit an answer to Aura-1 to unlock the canonical solution!");
      return;
    }
    try { sounds?.playClick?.(); } catch {}
    setIsFlipped(!isFlipped);
  };

  const handlePrev = () => {
    try { sounds?.playClick?.(); } catch {}
    setIsFlipped(false); setLockWarning('');
    if (!isQuizMode) setNoteIndex((prev) => Math.max(0, prev - 1));
    else {
      if (quizIndex > 0 && quizIndex <= 6) setQuizIndex((prev) => prev - 1);
      else if (quizIndex === 0) { if (isMidpointQuizComplete()) { setIsQuizMode(false); setNoteIndex(14); } else { setLockWarning("Previous Locked: Complete all 7 midpoint quiz cards before returning to Note 15!"); } }
      else if (quizIndex > 7 && quizIndex <= 14) setQuizIndex((prev) => prev - 1);
      else if (quizIndex === 7) { if (isFinalQuizComplete()) { setIsQuizMode(false); setNoteIndex(29); } else { setLockWarning("Previous Locked: Complete all 8 final quiz cards before returning to Note 30!"); } }
    }
  };

  const handleNext = () => {
    try { sounds?.playClick?.(); } catch {}
    setIsFlipped(false); setLockWarning('');
    if (!isQuizMode) {
      if (noteIndex === 14 && !isMidpointQuizComplete()) { setIsQuizMode(true); setQuizIndex(0); return; }
      if (noteIndex === 29) { setIsQuizMode(true); setQuizIndex(7); return; }
      setNoteIndex((prev) => Math.min(29, prev + 1));
    } else {
      if (quizIndex < 6) setQuizIndex((prev) => prev + 1);
      else if (quizIndex === 6) { if (isMidpointQuizComplete()) { setIsQuizMode(false); setNoteIndex(15); } else { setLockWarning("Checkpoint Gate Locked: Answer all 7 midpoint quiz cards to unlock Note 16!"); } }
      else if (quizIndex < 14) setQuizIndex((prev) => prev + 1);
      else if (quizIndex === 14) {
        if (isFinalQuizComplete()) {
          const { medal, title, totalPoints, averagePct } = calculateRewardTier(quizScores);
          setEarnedMedal(medal); setEarnedTitle(title); updateTopicProgress(activeTopicKey, 100, medal, title);
          try { sounds?.playUnlock?.(); } catch {}
          setLockWarning(`TOPIC MASTERED! Score: ${totalPoints}/150 pts (${averagePct}%) | Badge: ${medal.toUpperCase()} ${title ? `| Title: ${title}` : ''}`);
        } else { setLockWarning("Final Checkpoint Gate Locked: Answer all 8 final quiz cards to complete this topic!"); }
      }
    }
  };

  const handleResetTopic = () => {
    try { sounds?.playClick?.(); } catch {}
    setNoteIndex(0); setQuizIndex(0); setIsQuizMode(false); setIsFlipped(false);
    setAnsweredQuizSet(new Set()); setQuizScores({}); setLockWarning('');
    setEarnedMedal(null); setEarnedTitle('');
    setBotChatMessages([{ id: 'sys-reset', sender: botName || 'Aura-1', avatar: '', text: `âœ¨ System reset complete. Hi, I'm ${botName || 'Aura-1'}! Ready to evaluate your progress with care (0â€“10 pts per card).`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'system' }]);
    if (updateTopicProgress) updateTopicProgress(activeTopicKey, 0, null, '');
  };

  const handleClearChat = () => {
    if (chatTab === 'bot') {
      if (window.confirm('Are you sure you want to delete all workspace messages?')) {
        setBotChatMessages([{ id: 'bot-clear-1', sender: botName || 'Aura-1', avatar: 'ðŸ¤–', text: 'Workspace chat cleared. How can I assist you with this step?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'system' }]);
      }
    } else if (myTeamId) {
      if (window.confirm('Delete YOUR team messages?')) {
        supabase.from('team_messages').delete().eq('sender_id', user.id).eq('team_id', myTeamId).then(() => {
          setTeamChatMessages(prev => prev.filter(m => m.senderId !== user.id));
        });
      }
    }
  };

  const getMedalColor = (medal) => {
    switch (medal) {
      case 'Diamond': return 'text-cyan-300 border-cyan-400/50 bg-cyan-400/15 shadow-cyan-400/10 shadow-lg';
      case 'Platinum': return 'text-purple-300 border-purple-400/50 bg-purple-400/15 shadow-purple-400/10 shadow-lg';
      case 'Gold': return 'text-amber-300 border-amber-400/50 bg-amber-400/15 shadow-amber-400/10 shadow-lg';
      case 'Silver': return 'text-slate-200 border-slate-400/50 bg-slate-400/15 shadow-slate-400/10 shadow-lg';
      case 'Bronze': return 'text-orange-300 border-orange-400/50 bg-orange-400/15 shadow-orange-400/10 shadow-lg';
      default: return 'text-cyan-400 border-cyan-500/50 bg-cyan-500/15 shadow-cyan-500/10 shadow-lg';
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const micButtonDisabled = !!pendingRecording || isMicRequesting;
  const micButtonTitle = isRecording
    ? 'Stop Recording'
    : pendingRecording
    ? 'Send or cancel current note first'
    : isMicRequesting
    ? 'Requesting mic access...'
    : 'Record Voice Note';

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 font-sans space-y-6 min-h-screen relative">
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-400/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* ðŸ”§ FIX: Added z-30 to lift header layer above cards */}
      <div className="bg-slate-900/40 border border-cyan-500/20 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl relative z-30">
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-400/30 text-cyan-300 shadow-lg shadow-cyan-500/20">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-mono font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-blue-300">{activeTopicKey.toUpperCase()} MASTERY</h1>
              <button onClick={() => { setTempBotName(botName); setIsBotModalOpen(true); }} title="Rename Assistant Bot" className="text-slate-400 hover:text-cyan-300 transition p-1">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm font-mono text-cyan-100/60 font-medium">AI Engine: <span className="text-cyan-300 font-bold">{botName || 'Aura-1'}</span></p>
          </div>
        </div>

        {(earnedMedal || earnedTitle) && (
          <div className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl border font-mono text-sm font-bold ${getMedalColor(earnedMedal || 'Diamond')} backdrop-blur-sm`}>
            <Trophy className="w-5 h-5" />
            <span className="font-extrabold text-base">{(earnedMedal || 'DIAMOND').toUpperCase()}</span>
            {earnedTitle && (<><span className="text-slate-500">|</span><span className="text-white font-bold">ðŸ† {earnedTitle}</span></>)}
          </div>
        )}

        <div className="flex flex-wrap items-center space-x-3 gap-y-2">
          <button onClick={handleResetTopic} title="Reset Topic Progress" className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-sm font-mono text-slate-300 hover:text-red-400 hover:border-red-500/50 transition font-bold shadow-md backdrop-blur-sm">
            <RotateCcw className="w-4 h-4" /><span>Reset Topic</span>
          </button>

          isTeamMode && (
            <>
              <div className="flex items-center bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2 space-x-3 shadow-md backdrop-blur-sm">
                <Users className="w-5 h-5 text-purple-400" />
                <div className="text-xs font-mono">
                  <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Team Profile</span>
                  <span className="text-white font-extrabold text-sm">{teamName || 'Alpha Squad'}</span>
                </div>
                <button onClick={() => { setTempTeamName(teamName || 'Alpha Squad'); setIsTeamModalOpen(true); }} className="p-1 rounded-md text-slate-400 hover:text-purple-400 transition">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <button onClick={() => setShowTeamMembers(!showTeamMembers)} className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-sm font-mono text-slate-200 hover:text-white transition font-bold shadow-md backdrop-blur-sm">
                  <UserCheck className="w-4 h-4 text-cyan-400" /><span>Roster ({sortedRoster.length})</span><ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                </button>

                {showTeamMembers && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl shadow-cyan-500/20 z-50 space-y-3 font-mono text-xs backdrop-blur-2xl">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                      <span className="text-xs text-slate-300 font-extrabold uppercase tracking-wider">Active Team Roster</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {sortedRoster.map((m) => {
                        const isMe = m.id === user?.id;
                        return (
                          <div key={m.id} className="flex flex-col space-y-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-lg border border-slate-700">{m.avatar || 'ðŸ‘¤'}</div>
                                <span className="text-slate-100 font-extrabold text-sm flex items-center gap-1">
                                  {m.username}
                                  {m.isLeader && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">LEADER</span>}
                                </span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border ${isMe ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'text-purple-300 border-slate-600'}`}>
                                {isMe ? 'You' : m.role}
                              </span>
                            </div>
                            {isMe && (
                              <>
                                <select value={m.role} onChange={(e) => handleSelectMyRole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-cyan-400 uppercase tracking-wider">
                                  {SELF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <button onClick={handleLeaveTeam} className="w-full py-1.5 bg-slate-700 hover:bg-rose-500/20 border border-slate-600 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 rounded text-[10px] font-bold transition flex items-center justify-center gap-1">
                                  <LogOut className="w-3 h-3" /> Leave Team
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => { try { sounds?.playClick?.(); } catch {} setShowTeamMembers(false); if (setActiveTab) setActiveTab('friends'); }} className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-extrabold flex items-center justify-center space-x-2 transition shadow-lg">
                      <UserPlus className="w-4 h-4" /><span>Invite Friends</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <button onClick={() => { try { sounds?.playClick?.(); } catch {} setIsTeamMode(!isTeamMode); }} className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs font-mono font-extrabold transition shadow-md backdrop-blur-sm ${isTeamMode ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:text-white'}`}>
            <Shield className="w-4 h-4" /><span>{isTeamMode ? 'TEAM MODE' : 'SOLO MODE'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/40 border border-cyan-500/20 rounded-3xl p-6 relative overflow-hidden shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl flex flex-col justify-between min-h-[540px]">
            <div className="space-y-3 border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button className="p-2.5 rounded-xl bg-slate-900/60 text-slate-200 hover:text-white border border-slate-700 backdrop-blur-sm">
                    <Menu className="w-4 h-4" />
                  </button>
                  <div className="font-mono">
                    <span className="text-xs text-cyan-300/70 font-extrabold uppercase tracking-widest block">SYSTEM ARCHITECTURE</span>
                    <span className="text-base font-extrabold text-white">{activeTopicKey.toUpperCase()} DECK</span>
                  </div>
                </div>
                <button className="p-2.5 rounded-xl bg-slate-900/60 text-slate-200 hover:text-white border border-slate-700 backdrop-blur-sm">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-cyan-200/70 text-xs font-extrabold uppercase tracking-wider">UNIFIED MODULE PROGRESS</span>
                  <span className="text-cyan-300 text-sm font-black">{globalProgress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-800/60 rounded-full overflow-hidden p-0.5 border border-cyan-500/20">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: `${globalProgress}%` }}></div>
                </div>
              </div>
            </div>

            <div className="py-6 flex-1 flex flex-col justify-center">
              {!isQuizMode ? (
                <div onClick={handleCardTap} className={`w-full min-h-[300px] bg-slate-900/50 border ${isFlipped ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.25)]' : 'border-slate-700/60'} rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 shadow-xl flex flex-col justify-between relative group backdrop-blur-sm`}>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="bg-slate-950/80 px-3 py-1 rounded-full border border-cyan-500/30 font-extrabold text-cyan-300">NOTE #{noteIndex + 1} / 30</span>
                    <span className="flex items-center space-x-1.5 text-slate-400 group-hover:text-cyan-300 transition"><RefreshCw className="w-3.5 h-3.5" /><span>Tap to {isFlipped ? 'Show Front' : 'Flip for Breakdown'}</span></span>
                  </div>
                  <div className="my-6">
                    <h2 className="text-lg sm:text-xl font-mono font-bold leading-relaxed text-white">{isFlipped ? (currentNote.back || currentNote.backBreakdown) : (currentNote.frontSummary || currentNote.front)}</h2>
                  </div>
                  {currentNote.coolFact && isFlipped && (
                    <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3.5 text-xs font-mono text-amber-300 flex items-start space-x-2.5 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
                      <span>{currentNote.coolFact}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 text-xs font-mono text-slate-500">
                    <span>Topic ID: {activeTopicKey}</span><span className="text-cyan-400 font-bold">Status: Synchronized</span>
                  </div>
                </div>
              ) : (
                <div className="w-full min-h-[300px] bg-slate-900/50 border border-purple-500/40 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-between relative backdrop-blur-sm">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-full font-extrabold">QUIZ #{quizIndex + 1} / 15 {quizIndex < 7 ? '(Midpoint)' : '(Final)'}</span>
                    <span className="text-purple-400 font-bold">Score: {quizScores[quizIndex] !== undefined ? `${quizScores[quizIndex]}/10 pts` : 'Unanswered'}</span>
                  </div>
                  <div className="my-6 space-y-4">
                    <h2 className="text-lg sm:text-xl font-mono font-bold leading-relaxed text-white">{currentQuiz.question}</h2>
                    {answeredQuizSet.has(quizIndex) ? (
                      <div className="bg-emerald-500/15 border border-emerald-500/50 rounded-xl p-4 text-sm font-mono text-emerald-300 space-y-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <span className="font-extrabold block text-emerald-400 text-xs uppercase tracking-wider">Canonical Answer Key:</span>
                        <p className="font-bold leading-relaxed">{currentQuiz.answer}</p>
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs font-mono text-amber-300 flex items-center space-x-2">
                        <Lock className="w-4 h-4 flex-shrink-0 text-amber-400" /><span>Submit your answer via Voice or Text chat to evaluate and unlock!</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 text-xs font-mono text-slate-500">
                    <span>Evaluation Weight: 10 Pts</span><span className="text-purple-400 font-bold">{answeredQuizSet.has(quizIndex) ? 'Evaluated' : 'Pending Submission'}</span>
                  </div>
                </div>
              )}
              {lockWarning && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 font-mono text-xs flex items-center space-x-2 animate-pulse">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" /><span>{lockWarning}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button onClick={handlePrev} className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 font-mono text-xs font-bold transition border border-slate-700 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4" /><span>Previous</span>
              </button>
              <span className="text-xs font-mono text-slate-400 font-extrabold">{!isQuizMode ? `Note ${noteIndex + 1} of 30` : `Quiz ${quizIndex + 1} of 15`}</span>
          
