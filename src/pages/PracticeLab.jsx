import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PRACTICAL_CONTENT } from '../data/practicalContent';
import { askAura1Bot, startLiveTranscript, stopLiveTranscript, consumeLiveTranscript } from '../lib/aura';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabaseClient';
import { Users, Mic, Send, Trash2, X, UserPlus, LogOut, Play, Pause, Volume2, VolumeX, ArrowDown, Square, Loader2, AlertTriangle } from 'lucide-react';

const SELF_ROLES = ['Member', 'Leader', 'Contributor', 'Strategist', 'Reviewer'];
const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

// 🔧 Isolated namespace — no collisions with Home or Minigames
const LAB_CHAT_TAB_KEY = 'byteforged_lab_chat_tab';
const LAB_AURA_CHAT_KEY = (topicId) => `byteforged_lab_aura_chat_${topicId}`;
const MAX_PERSISTED_MSGS = 60;

function AudioPlayer({ src, initialDuration = 0, theme = 'emerald' }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const themeClasses = {
    emerald: 'bg-emerald-500 hover:bg-emerald-400 border-emerald-500/40',
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
        <div className="flex-1 space-y-1 min-w-0">
          <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className={`absolute inset-y-0 left-0 ${theme === 'emerald' ? 'bg-emerald-400' : 'bg-purple-400'} rounded-full transition-all`} style={{ width: `${progress}%` }} />
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
        className="w-full h-1 accent-emerald-400 cursor-pointer"
      />
    </div>
  );
}

export default function PracticeLab() {
  const { 
    isTeamMode, setIsTeamMode, teamName, setTeamName, activeTab,
    user, userProfile
  } = useAppStore();

  const currentUsername = userProfile?.username || user?.username || 'Operative';
  const currentUserAvatar = userProfile?.avatar || '';

  const topicKeys = Object.keys(PRACTICAL_CONTENT);

  const [selectedTopicId, setSelectedTopicId] = useState(() => {
    try {
      const saved = localStorage.getItem('byteforged_practical_last_state');
      if (saved) {
        const { topicId } = JSON.parse(saved);
        if (topicId && PRACTICAL_CONTENT[topicId]) return topicId;
      }
    } catch (e) { console.error('Failed to parse last topic state:', e); }
    return topicKeys[0] || 'ict-101';
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    try {
      const saved = localStorage.getItem('byteforged_practical_last_state');
      if (saved) {
        const { stepIndex } = JSON.parse(saved);
        if (typeof stepIndex === 'number') return stepIndex;
      }
    } catch (e) { console.error('Failed to parse last step state:', e); }
    return 0;
  });

  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('byteforged_practical_progress');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { console.error('Failed to parse progress from localStorage:', e); return {}; }
  });

  // 🔧 FIXED: Start empty, load in useEffect after selectedTopicId is stable
  const [chatMessages, setChatMessages] = useState([]);
  
  // Helper: strip dead blob URLs from persisted messages
  const cleanMessages = useCallback((msgs) => {
    if (!Array.isArray(msgs)) return [];
    return msgs.map(m => {
      if (m.audioUrl && m.audioUrl.startsWith('blob:')) {
        const { audioUrl, duration, ...rest } = m;
        return rest;
      }
      return m;
    });
  }, []);

  const [userInputText, setUserInputText] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // 🔧 Isolated chat tab key — no collision with Home or Minigames
  const [chatTab, setChatTab] = useState(() => {
    try {
      return localStorage.getItem(LAB_CHAT_TAB_KEY) || 'aura';
    } catch (e) {
      console.warn('Failed to load chat tab preference:', e);
      return 'aura';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LAB_CHAT_TAB_KEY, chatTab);
    } catch (e) {
      console.warn('Failed to save chat tab preference:', e);
    }
  }, [chatTab]);
  
  const [isTeamProfileOpen, setIsTeamProfileOpen] = useState(false);
  const [teamRoster, setTeamRoster] = useState([]);
  const [myTeamId, setMyTeamId] = useState(null);
  const [teamInputText, setTeamInputText] = useState('');

  const [teamChatMessages, setTeamChatMessages] = useState([]);
  const realtimeChannelRef = useRef(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [prevMsgCount, setPrevMsgCount] = useState(0);
  const chatScrollRef = useRef(null);
  const chatBottomRef = useRef(null);
  const userJustSentRef = useRef(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const handleChatScroll = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const threshold = 150;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsNearBottom(nearBottom);
    if (nearBottom) setHasNewMessages(false);
  }, []);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isMicRequesting, setIsMicRequesting] = useState(false);
  const [pendingRecording, setPendingRecording] = useState(null);
  const [micError, setMicError] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');

  const recordingDurationRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  // ============================================================================
  // 🔧 BULLETPROOF CHAT PERSISTENCE
  // ============================================================================
  
  // LOAD: Runs once on mount AND whenever topic changes.
  // Never wipes existing messages — just loads what's saved.
  // If nothing saved, adds the greeting only if chat is currently empty.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAB_AURA_CHAT_KEY(selectedTopicId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(cleanMessages(parsed));
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted Aura chat:', e);
    }
    // Nothing saved for this topic — seed greeting ONLY if chat is empty
    setChatMessages(prev => {
      if (prev.length > 0) return prev;
      return [{
        sender: 'Aura-1', avatar: '🤖',
        text: 'System online. I am Aura-1, your CS & ICT evaluator. Need help or code breakdown for this step?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
    });
  }, [selectedTopicId, cleanMessages]);

  // SAVE: Runs whenever messages or topic changes.
  // NEVER overwrites with empty data — that was the wipe-on-reload bug.
  useEffect(() => {
    if (!chatMessages || chatMessages.length === 0) return; // 🔑 CRITICAL: never save empty
    try {
      const clean = cleanMessages(chatMessages).slice(-MAX_PERSISTED_MSGS);
      localStorage.setItem(LAB_AURA_CHAT_KEY(selectedTopicId), JSON.stringify(clean));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, truncating');
        try {
          const truncated = cleanMessages(chatMessages).slice(-30);
          localStorage.setItem(LAB_AURA_CHAT_KEY(selectedTopicId), JSON.stringify(truncated));
        } catch (e2) {
          console.error('Failed to save even truncated:', e2);
        }
      } else {
        console.warn('Failed to persist Aura chat:', e);
      }
    }
  }, [chatMessages, selectedTopicId, cleanMessages]);

  const syncRosterFromDB = async () => {
    if (!user?.id) return;
    try {
      const { data: membership, error: mErr } = await supabase
        .from('team_members').select('team_id')
        .eq('user_id', user.id).limit(1);
      if (mErr) throw mErr;
      if (!membership || membership.length === 0) {
        setTeamRoster([]); setMyTeamId(null);
        return;
      }
      const teamId = membership[0].team_id;
      setMyTeamId(teamId);
      const { data: members, error: memErr } = await supabase
        .from('team_members')
        .select('user_id, role, team_assignment, score, profiles(id, username, avatar)')
        .eq('team_id', teamId);
      if (memErr) throw memErr;
      if (members) {
        setTeamRoster(members.map(m => ({
          id: m.user_id, username: m.profiles?.username || 'Unknown',
          avatar: m.profiles?.avatar || '👤', role: m.role || 'Member',
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
    } catch (err) { alert('Failed to update role: ' + err.message); }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    try {
      const { error } = await supabase.rpc('leave_team_proper');
      if (error) throw error;
      setTeamRoster([]); setMyTeamId(null); setTeamChatMessages([]);
    } catch (err) { alert('Failed to leave team: ' + err.message); }
  };

  const loadTeamChatHistory = async (teamId) => {
    try {
      const { data, error } = await supabase
        .from('team_messages').select('*')
        .eq('team_id', teamId).eq('channel', 'team')
        .order('created_at', { ascending: true }).limit(100);
      if (error) throw error;
      setTeamChatMessages((data || []).map(m => ({
        id: m.id, sender: m.sender_username, avatar: m.sender_avatar || '👤',
        text: m.body, audioUrl: m.audio_url,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderId: m.sender_id
      })));
    } catch (err) { console.error('Failed to load team chat:', err); }
  };

  const subscribeToTeamChat = (teamId) => {
    if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
    const channel = supabase.channel(`lab_team_chat_${teamId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'team_messages', filter: `team_id=eq.${teamId}` },
        () => { loadTeamChatHistory(teamId); }
      )
      .subscribe();
    realtimeChannelRef.current = channel;
  };

  useEffect(() => {
    if (user?.id && isTeamMode) syncRosterFromDB();
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

  useEffect(() => {
    if (!isTeamMode && chatTab === 'team') setChatTab('aura');
  }, [isTeamMode, chatTab]);

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
      return null;
    }
  };

  const activeTopic = PRACTICAL_CONTENT[selectedTopicId] || PRACTICAL_CONTENT[topicKeys[0]] || {};
  const steps = activeTopic?.steps || [];

  useEffect(() => {
    if (steps.length > 0 && currentStepIndex >= steps.length) setCurrentStepIndex(0);
  }, [selectedTopicId, steps.length, currentStepIndex]);

  const activeStep = steps[currentStepIndex] || steps[0] || {};

  useEffect(() => {
    try {
      localStorage.setItem('byteforged_practical_last_state', JSON.stringify({ topicId: selectedTopicId, stepIndex: currentStepIndex }));
    } catch (e) { console.error('Failed to save active location state:', e); }
  }, [selectedTopicId, currentStepIndex]);

  const displayedMessages = chatTab === 'aura' ? chatMessages : teamChatMessages;
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

  useEffect(() => { setSelectedOption(null); setIsAnswerSubmitted(false); setShowHint(false); }, [selectedTopicId, currentStepIndex]);
  
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (!activeStep?.options) return;
      const keyNum = parseInt(e.key, 10);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= activeStep.options.length) {
        if (!isAnswerSubmitted) setSelectedOption(keyNum - 1);
      }
      if (e.key === 'Enter') {
        if (!isAnswerSubmitted && selectedOption !== null) handleSubmitAnswer();
        else if (isAnswerSubmitted && currentStepIndex < steps.length - 1) setCurrentStepIndex((prev) => prev + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswerSubmitted, selectedOption, activeStep, currentStepIndex, steps.length]);

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

  const handleSelectOption = (index) => { if (isAnswerSubmitted) return; setSelectedOption(index); };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === activeStep.correctAnswer) {
      const updatedProgress = { ...completedSteps, [selectedTopicId]: { ...(completedSteps[selectedTopicId] || {}), [activeStep.id]: true } };
      setCompletedSteps(updatedProgress);
      try { localStorage.setItem('byteforged_practical_progress', JSON.stringify(updatedProgress)); } catch (e) { console.error('Failed to save progress:', e); }
    }
  };

  // 🔧 Topic reset: clears persisted chat + progress for THIS topic
  const handleResetActiveTopicProgress = () => {
    const topicTitle = activeTopic.title || selectedTopicId;
    if (!window.confirm(`Are you sure you want to reset all progress for "${topicTitle}"?`)) return;
    const updatedProgress = { ...completedSteps };
    delete updatedProgress[selectedTopicId];
    setCompletedSteps(updatedProgress);
    try { localStorage.setItem('byteforged_practical_progress', JSON.stringify(updatedProgress)); } catch (e) {}
    setSelectedOption(null); setIsAnswerSubmitted(false); setShowHint(false); setCurrentStepIndex(0);
    // Clear chat for this topic — intentional reset
    setChatMessages([{
      sender: 'Aura-1', avatar: '🤖',
      text: `Topic reset. Ready to help with ${topicTitle}.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    try { localStorage.removeItem(LAB_AURA_CHAT_KEY(selectedTopicId)); } catch {}
  };

  const handleDeleteSingleMessage = (indexToDelete) => { setChatMessages((prev) => prev.filter((_, idx) => idx !== indexToDelete)); };

  const handleDeleteTeamMessage = async (msgId) => {
    try {
      const { error } = await supabase.from('team_messages').delete().eq('id', msgId);
      if (error) throw error;
      setTeamChatMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) { alert('Failed to delete: ' + err.message); }
  };

  // 🔧 Manual clear — ONLY way to clear Aura chat besides topic reset
  const handleClearChat = () => {
    if (chatTab === 'aura') {
      if (window.confirm('Are you sure you want to delete all workspace messages?')) {
        setChatMessages([{ sender: 'Aura-1', avatar: '🤖', text: 'Workspace chat cleared. How can I assist you with this step?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
    } else {
      if (window.confirm('Remove YOUR team messages from this lab chat?')) {
        supabase.from('team_messages').delete().eq('sender_id', user.id).eq('team_id', myTeamId).then(() => {
          setTeamChatMessages(prev => prev.filter(m => m.senderId !== user.id));
        });
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
    stopLiveTranscript();
    cleanupStream();
    clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
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
        setMicError('🚫 Microphone permission denied. Allow access in browser settings.');
      } else if (err?.name === 'NotFoundError') {
        setMicError('🎙️ No microphone detected.');
      } else if (err?.name === 'NotReadableError') {
        setMicError('🔒 Microphone is in use by another app.');
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
    recordingDurationRef.current = 0;
    setRecordingDuration(0);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const duration = recordingDurationRef.current;
      const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
      cleanupStream();
      if (blob.size > 0) {
        setPendingRecording({ blob, blobUrl: URL.createObjectURL(blob), duration, target: chatTab });
      } else {
        setMicError('Recording came back empty — tap mic to try again.');
      }
      setIsRecording(false);
    };
    mediaRecorder.onerror = (err) => {
      console.error('MediaRecorder error:', err);
      cleanupStream();
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
      setIsRecording(false);
      setMicError('Recording interrupted — tap mic to retry.');
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
    startLiveTranscript((t) => setLiveTranscript(t));
    recordingTimerRef.current = setInterval(() => {
      recordingDurationRef.current += 1;
      setRecordingDuration(recordingDurationRef.current);
    }, 1000);
  };

  const handleDiscardRecording = () => {
    if (pendingRecording?.blobUrl) {
      try { URL.revokeObjectURL(pendingRecording.blobUrl); } catch (e) {}
    }
    setPendingRecording(null);
    consumeLiveTranscript();
    setLiveTranscript('');
    recordingDurationRef.current = 0;
    setRecordingDuration(0);
  };

  const handleSendPendingRecording = async () => {
    if (!pendingRecording) return;
    const { blob, blobUrl, duration, target } = pendingRecording;
    setPendingRecording(null);
    userJustSentRef.current = true;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (target === 'aura') {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(), sender: currentUsername, avatar: currentUserAvatar,
        text: '🎙️ Voice Note', audioUrl: blobUrl, duration, time: timeStr
      }]);
      const transcript = consumeLiveTranscript();
      setLiveTranscript('');
      const contextPrompt = `Topic: ${activeTopic.title || ''} (${activeTopic.subtitle || ''})\nStep: ${activeStep.title || ''}\nInstruction: ${activeStep.instruction || ''}\nCode/Snippet:\n${activeStep.codeSnippet || 'None'}\nOptions: ${activeStep.options?.join(' | ') || 'N/A'}`;
      try {
        setIsAiThinking(true);
        if (transcript) {
          const aiReply = await askAura1Bot(transcript, contextPrompt, 'Aura-1');
          setChatMessages(prev => [...prev, {
            sender: 'Aura-1', avatar: '🤖', text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        } else {
          setChatMessages(prev => [...prev, {
            sender: 'Aura-1', avatar: '🤖',
            text: `[Aura-1 Alert]: I couldn't capture live speech text from that recording. Your voice note is saved above — please type your question so I can evaluate it.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      } catch (err) {
        setChatMessages(prev => [...prev, {
          sender: 'Aura-1', avatar: '🤖', text: '[Aura-1 Alert]: Query dispatch error.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } finally { setIsAiThinking(false); }
    } else if (target === 'team' && myTeamId) {
      consumeLiveTranscript();
      setLiveTranscript('');
      const audioUrl = await uploadVoiceNote(blob);
      try { URL.revokeObjectURL(blobUrl); } catch (e) {}
      if (audioUrl) {
        await supabase.from('team_messages').insert({
          team_id: myTeamId, channel: 'team',
          sender_id: user.id, sender_username: currentUsername,
          sender_avatar: currentUserAvatar, body: '🎙️ Voice Note', audio_url: audioUrl
        });
        loadTeamChatHistory(myTeamId);
      }
    }
  };

  const handleSendText = async () => {
    const text = chatTab === 'aura' ? userInputText.trim() : teamInputText.trim();
    if (!text) return;
    if (chatTab === 'aura') setUserInputText('');
    else setTeamInputText('');
    userJustSentRef.current = true;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (chatTab === 'aura') {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(), sender: currentUsername, avatar: currentUserAvatar,
        text, time: timeStr
      }]);
      const contextPrompt = `Topic: ${activeTopic.title || ''} (${activeTopic.subtitle || ''})\nStep: ${activeStep.title || ''}\nInstruction: ${activeStep.instruction || ''}\nCode/Snippet:\n${activeStep.codeSnippet || 'None'}\nOptions: ${activeStep.options?.join(' | ') || 'N/A'}`;
      try {
        setIsAiThinking(true);
        const aiReply = await askAura1Bot(text, contextPrompt, 'Aura-1');
        setChatMessages(prev => [...prev, {
          sender: 'Aura-1', avatar: '🤖', text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } catch (err) {
        setChatMessages(prev => [...prev, {
          sender: 'Aura-1', avatar: '🤖', text: '[Aura-1 Alert]: Query dispatch error.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } finally { setIsAiThinking(false); }
    } else if (myTeamId) {
      await supabase.from('team_messages').insert({
        team_id: myTeamId, channel: 'team',
        sender_id: user.id, sender_username: currentUsername,
        sender_avatar: currentUserAvatar, body: text
      });
      loadTeamChatHistory(myTeamId);
    }
  };

  const sortedRoster = [...teamRoster].sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0));

  const { totalStepsInApp, completedStepsCount, overallPercentage } = useMemo(() => {
    const total = Object.values(PRACTICAL_CONTENT).reduce((acc, t) => acc + (t.steps?.length || 0), 0);
    const completed = Object.values(completedSteps).reduce((acc, stepsObj) => acc + Object.values(stepsObj || {}).filter(Boolean).length, 0);
    const percentage = Math.round((completed / Math.max(total, 1)) * 100);
    return { totalStepsInApp: total, completedStepsCount: completed, overallPercentage: percentage };
  }, [completedSteps]);

  const { topicPercentage } = useMemo(() => {
    const count = activeTopic?.steps?.length || 1;
    const doneCount = Object.values(completedSteps[selectedTopicId] || {}).filter(Boolean).length;
    const pct = Math.round((doneCount / count) * 100);
    return { topicPercentage: pct };
  }, [activeTopic, completedSteps, selectedTopicId]);

  const micButtonDisabled = !!pendingRecording || isMicRequesting;
  const micButtonTitle = isRecording
    ? 'Stop Recording'
    : pendingRecording
    ? 'Send or cancel current note first'
    : isMicRequesting
    ? 'Requesting mic access...'
    : 'Record Voice Note';

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-slate-100 space-y-7 min-h-screen relative selection:bg-emerald-500 selection:text-slate-950">
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-400/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-lime-400/5 rounded-full blur-[100px]" />
      </div>

      <div className="bg-slate-900/40 border border-emerald-500/20 rounded-3xl p-5 md:p-7 flex flex-col gap-6 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl relative">
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl">💻</span>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-lime-200">PRACTICAL LAB</h1>
            <span className="px-3 py-1 text-[10px] md:text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-lg shadow-sm backdrop-blur-sm">v2.0 Dual-Pane</span>
          </div>
          <p className="text-sm text-emerald-100/60 font-sans font-medium">Hands-On System Diagnostics, Logic Verification & AI Evaluation</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
          <div className="w-full sm:w-80 bg-slate-900/60 border border-emerald-500/20 p-4 rounded-xl shadow-inner backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs font-mono mb-2.5">
              <span className="text-emerald-200/70 font-bold uppercase tracking-wider">LAB MASTERY</span>
              <span className="text-emerald-300 font-extrabold text-sm">{completedStepsCount} / {totalStepsInApp} ({overallPercentage}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-800/60 rounded-full overflow-hidden p-0.5 border border-emerald-500/20">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${overallPercentage}%` }} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
            <button onClick={() => setIsTeamMode(!isTeamMode)} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border shadow-lg whitespace-nowrap backdrop-blur-sm ${isTeamMode ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:text-white'}`}>
              <Users className="w-4 h-4" /> {isTeamMode ? 'TEAM MODE' : 'SOLO MODE'}
            </button>
            
            {isTeamMode && (
              <button onClick={() => setIsTeamProfileOpen(true)} className="flex-1 sm:flex-none px-4 py-2.5 bg-purple-600/80 hover:bg-purple-600 border border-purple-500/50 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg uppercase tracking-wider whitespace-nowrap">
                <Users className="w-4 h-4" /> Team Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {topicKeys.map((key) => {
          const item = PRACTICAL_CONTENT[key];
          const isSelected = key === selectedTopicId;
          const isDone = Object.values(completedSteps[key] || {}).filter(Boolean).length === item?.steps?.length;
          return (
            <button key={key} onClick={() => { setSelectedTopicId(key); setCurrentStepIndex(0); }} className={`px-5 py-3 rounded-xl text-xs md:text-sm font-mono font-bold whitespace-nowrap transition-all border backdrop-blur-sm ${isSelected ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'}`}>
              {isDone && <span className="mr-2 text-emerald-400 font-bold">✓</span>}
              {key.toUpperCase()}: {item?.title?.split('&')[0]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        
        <div className="lg:col-span-7 xl:col-span-8 bg-slate-900/40 border border-emerald-500/20 rounded-3xl p-5 md:p-7 space-y-6 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl relative">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          
          <div className="border-b border-slate-800 pb-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="min-w-0">
                <span className="text-xs font-mono text-emerald-400 font-bold tracking-widest uppercase break-words">{activeTopic.topicId} • {activeTopic.subtitle}</span>
                <h2 className="text-xl md:text-3xl font-extrabold text-white mt-1 break-words">{activeTopic.title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-mono font-bold px-3 py-1.5 bg-slate-900/60 text-slate-200 rounded-lg border border-slate-700 backdrop-blur-sm whitespace-nowrap">Topic Progress: {topicPercentage}%</span>
                <button onClick={handleResetActiveTopicProgress} title="Reset progress on this active topic" className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800/70 transition flex items-center gap-1.5 shadow-sm active:scale-95 backdrop-blur-sm whitespace-nowrap">
                  <span className="text-sm">↺</span> Reset Topic
                </button>
              </div>
            </div>
            <p className="text-sm md:text-base text-slate-300 mt-3 leading-relaxed font-sans">{activeTopic.overview}</p>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {steps.map((s, idx) => {
              const isStepCompleted = completedSteps[selectedTopicId]?.[s.id];
              const isCurrent = idx === currentStepIndex;
              return (
                <button key={s.id || idx} onClick={() => setCurrentStepIndex(idx)} className={`px-4 py-2 rounded-lg text-xs md:text-sm font-mono flex items-center gap-2 transition whitespace-nowrap ${isCurrent ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-500/20' : isStepCompleted ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 font-bold' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-sm'}`}>
                  {isStepCompleted && <span className="font-bold">✓</span>}
                  <span>Step {idx + 1}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-6 bg-slate-900/50 border border-slate-700 p-4 md:p-6 rounded-2xl shadow-inner backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-base md:text-lg font-extrabold text-emerald-400 font-mono tracking-wide break-words">TASK: {activeStep.title || 'Diagnostic Challenge'}</h3>
              <button onClick={() => setShowHint(!showHint)} className="text-xs md:text-sm font-mono font-bold text-amber-400 hover:text-amber-300 underline transition whitespace-nowrap self-start sm:self-auto">{showHint ? 'Hide Hint' : '💡 Show Hint'}</button>
            </div>

            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-sans font-normal break-words">{activeStep.instruction}</p>

            {showHint && activeStep.hint && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 text-xs md:text-sm text-amber-300 font-mono leading-relaxed shadow-[0_0_15px_rgba(245,158,11,0.1)] break-words">
                💡 <span className="font-bold">HINT:</span> {activeStep.hint}
              </div>
            )}

            {activeStep.codeSnippet && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 md:p-5 font-mono text-xs md:text-sm text-emerald-400 overflow-x-auto relative shadow-2xl max-w-full">
                <div className="absolute top-2.5 right-3.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold pointer-events-none">CONSOLE / CODE</div>
                <pre className="whitespace-pre-wrap leading-relaxed break-words">{activeStep.codeSnippet}</pre>
              </div>
            )}

            {activeStep.options && activeStep.options.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold block mb-2">Select correct diagnostic output (Press 1-{activeStep.options.length}):</span>
                {activeStep.options.map((opt, oIdx) => {
                  const isSelected = selectedOption === oIdx;
                  const isCorrect = oIdx === activeStep.correctAnswer;
                  let buttonStyle = 'bg-slate-950/60 border-slate-700 text-slate-200 hover:border-slate-600 hover:bg-slate-900/80 backdrop-blur-sm';
                  if (isAnswerSubmitted) {
                    if (isCorrect) buttonStyle = 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 font-bold';
                    else if (isSelected && !isCorrect) buttonStyle = 'bg-rose-950/90 border-rose-500/50 text-rose-300';
                  } else if (isSelected) {
                    buttonStyle = 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 font-bold ring-1 ring-emerald-500/50';
                  }
                  return (
                    <button key={oIdx} onClick={() => handleSelectOption(oIdx)} disabled={isAnswerSubmitted} className={`w-full text-left p-4 rounded-xl text-xs md:text-sm font-sans border transition-all flex items-start gap-3.5 ${buttonStyle}`}>
                      <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 text-xs font-mono font-bold border border-slate-700 flex-shrink-0">{oIdx + 1}</span>
                      <span className="flex-1 leading-relaxed break-words">{opt}</span>
                      {isAnswerSubmitted && isCorrect && <span className="text-emerald-400 font-mono font-bold text-xs flex-shrink-0">✓ Correct</span>}
                      {isAnswerSubmitted && isSelected && !isCorrect && <span className="text-rose-400 font-mono font-bold text-xs flex-shrink-0">✕ Incorrect</span>}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-700 gap-4">
              {!isAnswerSubmitted ? (
                <button onClick={handleSubmitAnswer} disabled={selectedOption === null} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-mono font-bold text-xs md:text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95">Verify Answer [Enter]</button>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:justify-between">
                  <span className={`text-xs md:text-sm font-mono font-bold text-center sm:text-left ${selectedOption === activeStep.correctAnswer ? 'text-emerald-400' : 'text-rose-400'}`}>{selectedOption === activeStep.correctAnswer ? '✓ VERIFICATION PASSED' : '✕ VERIFICATION FAILED'}</span>
                  {currentStepIndex < steps.length - 1 ? (
                    <button onClick={() => setCurrentStepIndex((prev) => prev + 1)} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-mono font-bold text-xs md:text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95">Next Step → [Enter]</button>
                  ) : (<span className="text-xs md:text-sm font-mono text-emerald-400 font-bold text-center sm:text-left">🎉 Topic Completed!</span>)}
                </div>
              )}
            </div>

            {isAnswerSubmitted && activeStep.explanation && (
              <div className="bg-slate-950/80 border-l-4 border-emerald-500 p-4 rounded-r-xl space-y-2 text-xs md:text-sm font-sans mt-5 backdrop-blur-sm">
                <span className="font-mono font-bold text-emerald-400 block">EXPLANATION:</span>
                <p className="text-slate-200 leading-relaxed break-words">{activeStep.explanation}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 bg-slate-900/40 border border-emerald-500/20 rounded-3xl p-4 md:p-6 flex flex-col h-[600px] lg:h-[680px] shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl relative">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          
          <div className="flex border-b border-slate-800 pb-3.5 mb-3.5 gap-2">
            <button onClick={() => setChatTab('aura')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg border transition-all shadow-md backdrop-blur-sm ${chatTab === 'aura' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20' : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'}`}>Aura-1 AI</button>
            {isTeamMode && myTeamId && (
              <button onClick={() => setChatTab('team')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg border transition-all shadow-md backdrop-blur-sm ${chatTab === 'team' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/20' : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'}`}>Team Chat</button>
            )}
          </div>

          {/* 🔧 TTS toggle removed — cleaner header */}
          <div className="flex items-center justify-end mb-3.5 gap-2">
            <button onClick={handleClearChat} title="Clear Chat History" className="px-2 py-1 text-[11px] font-mono font-bold rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/70 transition flex items-center gap-1 active:scale-95 backdrop-blur-sm whitespace-nowrap"><span>Clear All</span></button>
          </div>

          {chatTab === 'aura' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
              <button onClick={() => { userJustSentRef.current = true; setUserInputText('Explain this practical step in simple terms.'); setTimeout(() => handleSendText(), 0); }} disabled={isAiThinking} className="px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-[11px] font-mono text-slate-200 whitespace-nowrap border border-slate-700 transition backdrop-blur-sm flex-shrink-0">❓ Explain Step</button>
              <button onClick={() => { userJustSentRef.current = true; setUserInputText('Why is the correct option right?'); setTimeout(() => handleSendText(), 0); }} disabled={isAiThinking} className="px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-[11px] font-mono text-slate-200 whitespace-nowrap border border-slate-700 transition backdrop-blur-sm flex-shrink-0"> Deep Dive</button>
            </div>
          )}

          <div ref={chatScrollRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto space-y-3.5 pr-1 font-sans text-xs md:text-sm scrollbar-thin scrollbar-thumb-slate-800 relative min-h-0">
            {chatTab === 'team' && teamChatMessages.length === 0 && (
              <div className="text-center text-slate-500 text-xs py-8">No team messages yet. Start the conversation!</div>
            )}
            {displayedMessages.map((msg, index) => {
              const isAura = msg.sender === 'Aura-1';
              const isSystem = msg.sender === 'System AI';
              const isOwnMessage = msg.sender === currentUsername;
              let bubbleStyle = 'bg-slate-900/60 border border-slate-700 text-slate-200 mr-auto shadow-sm backdrop-blur-sm';
              if (isOwnMessage) bubbleStyle = 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/40 rounded-tr-sm ml-auto shadow-sm backdrop-blur-sm';
              if (isSystem) bubbleStyle = 'bg-slate-900/60 border border-slate-700 text-slate-400 mx-auto text-center italic shadow-sm backdrop-blur-sm';
              return (
                <div key={msg.id || index} className={`p-3.5 rounded-xl max-w-[92%] leading-relaxed group relative transition-all ${bubbleStyle}`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5 text-[10px] font-mono">
                    <span className={`font-bold truncate ${isAura ? 'text-emerald-400' : isSystem ? 'text-slate-500' : 'text-slate-300'}`}>{msg.avatar ? `${msg.avatar} ` : ''}{msg.sender}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-slate-500">{msg.timestamp || msg.time}</span>
                      {isOwnMessage && (
                        <button onClick={() => { if (chatTab === 'aura') { handleDeleteSingleMessage(index); } else if (msg.id) { handleDeleteTeamMessage(msg.id); } }} title="Delete this message" className="text-slate-500 hover:text-rose-400 text-[11px] p-0.5 rounded transition opacity-80 hover:opacity-100 active:scale-90">🗑️</button>
                      )}
                    </div>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  {(msg.audio || msg.audioUrl) && (
                    <AudioPlayer src={msg.audio || msg.audioUrl} initialDuration={msg.duration || 0} theme={chatTab === 'team' ? 'purple' : 'emerald'} />
                  )}
                </div>
              );
            })}
            {isAiThinking && chatTab === 'aura' && (
              <div className="p-3.5 bg-slate-900/60 border border-slate-700 rounded-xl mr-auto text-slate-400 text-xs font-mono flex items-center gap-2 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce flex-shrink-0"></span>
                <span>Aura-1 processing context...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {hasNewMessages && !isNearBottom && (
            <button
              onClick={jumpToBottom}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/40 z-10 transition animate-bounce"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>New Messages</span>
            </button>
          )}

          <div className="space-y-3 pt-3 border-t border-slate-800 mt-2">
            {isRecording && (
              <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs font-mono text-red-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping flex-shrink-0"></span>
                    <span className="font-extrabold">● REC {formatTime(recordingDuration)}</span>
                  </div>
                  <span className="text-[10px] text-red-400 italic">Tap mic again to stop</span>
                </div>
                {liveTranscript && (
                  <div className="mt-2 text-[10px] text-emerald-200/90 font-mono italic truncate">📝 {liveTranscript}</div>
                )}
              </div>
            )}

            {micError && (
              <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-2.5 text-[11px] font-mono text-rose-300 flex items-center space-x-2 backdrop-blur-sm">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="flex-1 break-words">{micError}</span>
                <button onClick={() => setMicError('')} className="text-rose-400 hover:text-white flex-shrink-0"><X className="w-3 h-3" /></button>
              </div>
            )}

            {pendingRecording && (
              <div className={`${chatTab === 'aura' ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-purple-500/10 border-purple-500/40'} border rounded-xl p-3 space-y-2 backdrop-blur-sm`}>
                <div className="flex justify-between items-center text-[10px] font-mono text-emerald-300 font-extrabold uppercase tracking-wider gap-2">
                  <span className="truncate">🎙️ Voice Note Ready — {pendingRecording.target === 'team' ? 'Team' : 'Aura-1 AI'}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex-shrink-0">{formatTime(pendingRecording.duration)}</span>
                </div>
                <AudioPlayer src={pendingRecording.blobUrl} initialDuration={pendingRecording.duration} theme={pendingRecording.target === 'team' ? 'purple' : 'emerald'} />
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSendPendingRecording} className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-500/20">
                    <Send className="w-3 h-3" /> Send
                  </button>
                  <button onClick={handleDiscardRecording} className="px-4 py-2 bg-slate-900/60 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 backdrop-blur-sm">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={chatTab === 'aura' ? userInputText : teamInputText} 
                onChange={(e) => chatTab === 'aura' ? setUserInputText(e.target.value) : setTeamInputText(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }} 
                placeholder={isRecording ? 'Live recording...' : chatTab === 'aura' ? 'Ask Aura-1 or record voice...' : 'Message team...'} 
                disabled={isAiThinking && chatTab === 'aura'} 
                className={`flex-1 min-w-0 bg-slate-950/60 border rounded-xl px-3.5 py-2.5 text-xs md:text-sm font-mono text-white focus:outline-none placeholder-slate-500 transition backdrop-blur-sm ${isRecording ? 'border-red-500/80 ring-1 ring-red-500/50 bg-red-950/20' : 'border-slate-700 focus:border-emerald-500/50'}`} 
              />
              <button 
                onClick={toggleRecording} 
                disabled={micButtonDisabled} 
                title={micButtonTitle}
                className={`p-2.5 rounded-xl border font-mono text-xs transition flex items-center justify-center active:scale-95 flex-shrink-0 ${
                  isRecording
                    ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                    : micButtonDisabled
                    ? 'bg-slate-900/50 border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-emerald-400 border-slate-700 backdrop-blur-sm'
                }`}
              >
                {isMicRequesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
              <button 
                onClick={handleSendText} 
                disabled={(chatTab === 'aura' && !userInputText.trim()) || (chatTab === 'team' && !teamInputText.trim()) || isRecording || (isAiThinking && chatTab === 'aura')} 
                className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-mono font-bold rounded-xl transition shadow-md shadow-emerald-500/20 active:scale-95 flex-shrink-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isTeamProfileOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/80 border border-purple-500/30 rounded-3xl p-5 md:p-9 max-w-2xl w-full space-y-6 shadow-2xl shadow-purple-500/20 backdrop-blur-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden relative">
            
            <div className="flex justify-between items-center border-b border-slate-700 pb-4 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 -mx-5 px-5 md:-mx-9 md:px-9 pt-1">
              <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-3">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-purple-400 flex-shrink-0" /> 
                <span className="truncate">Team Profile Manager</span>
              </h3>
              <button onClick={() => setIsTeamProfileOpen(false)} className="text-slate-400 hover:text-white text-xl font-black flex-shrink-0 p-1">✕</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs text-slate-400 font-black uppercase tracking-widest mb-2">Custom Team Name</label>
                <input 
                  type="text" 
                  value={teamName} 
                  onChange={(e) => setTeamName(e.target.value)} 
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-purple-500/50 shadow-inner backdrop-blur-sm" 
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Roster & Self-Selected Roles</h4>
                <div className="max-h-64 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {sortedRoster.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-8">No team members yet. Invite friends from the Friends Hub!</p>
                  ) : (
                    sortedRoster.map((m, idx) => {
                      const isMe = m.id === user?.id;
                      return (
                        <div key={m.id} className="flex flex-col gap-4 p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-xs font-bold shadow-md backdrop-blur-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-slate-500 text-sm flex-shrink-0 w-4 text-center">{idx + 1}</span>
                            <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-xl border border-slate-700 flex-shrink-0">
                              {m.avatar || '👤'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white text-sm font-black truncate">{m.username}</span>
                                {m.isLeader && (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 flex-shrink-0 font-bold">LEADER</span>
                                )}
                                {isMe && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40 flex-shrink-0 font-bold">YOU</span>
                                )}
                              </div>
                              <span className="block text-xs text-purple-300 font-extrabold mt-0.5 truncate">{m.role}</span>
                            </div>
                          </div>
                          
                          {isMe && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full pl-7">
                              <select 
                                value={m.role} 
                                onChange={(e) => handleSelectMyRole(e.target.value)} 
                                className="w-full sm:w-auto flex-1 bg-slate-950 border border-slate-700 text-white text-[11px] font-black rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50 uppercase tracking-wider backdrop-blur-sm appearance-none"
                              >
                                {SELF_ROLES.map(role => (<option key={role} value={role}>{role}</option>))}
                              </select>
                              <button 
                                onClick={handleLeaveTeam} 
                                className="w-full sm:w-auto py-2 px-4 bg-slate-800 hover:bg-rose-500/20 border border-slate-600 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 flex-shrink-0"
                              >
                                <LogOut className="w-3.5 h-3.5" /> Leave Team
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-slate-900/95 backdrop-blur-md -mx-5 px-5 md:-mx-9 md:px-9 pb-1">
              <button 
                onClick={() => { setIsTeamProfileOpen(false); useAppStore.getState().setActiveTab('friends'); }} 
                className="flex-1 py-3 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-extrabold flex items-center justify-center space-x-2 transition shadow-lg shadow-purple-600/30"
              >
                <UserPlus className="w-4 h-4" /><span>Invite Friends</span>
              </button>
              <button 
                onClick={() => setIsTeamProfileOpen(false)} 
                className="w-full sm:w-auto px-7 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl transition-all uppercase tracking-wider"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}