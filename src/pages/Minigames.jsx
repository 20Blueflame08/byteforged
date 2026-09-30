import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MINIGAMES_CONTENT } from '../data/minigamesContent';
import { sounds } from '../lib/soundEngine';
import { supabase } from '../lib/supabaseClient';
import { askAura1Bot, startLiveTranscript, stopLiveTranscript, consumeLiveTranscript } from '../lib/aura';
import {
  Gamepad2, Trophy, Flame, Users, Shield, HelpCircle, RefreshCw,
  Share2, UserPlus, Send, Mic, ChevronDown, ChevronUp,
  RotateCcw, Zap, Trash2, ShieldAlert, Award, Eraser, Lock, Lightbulb, FastForward, LogOut,
  Play, Pause, Volume2, VolumeX, ArrowDown, Square, X, Loader2, AlertTriangle
} from 'lucide-react';

const STORAGE_KEY = 'byteforged_minigames_state_final_v12';
const PERFECT_GAME_SCORE = 115;

// 🔧 Isolated namespace — no collisions with Home or PracticeLab
const MINI_CHAT_TARGET_KEY = 'byteforged_mini_chat_target';
const MINI_BOT_CHAT_KEY = (topic) => `byteforged_mini_bot_chat_${topic}`;
const MAX_PERSISTED_MSGS = 60;

const SELF_ROLES = ['Member', 'Leader'];
const SELF_COLORS = ['BlueTeam', 'RedTeam', 'YellowTeam', 'GreenTeam', 'PurpleTeam', 'OrangeTeam'];
const COLOR_LABEL = c => c.replace('Team', '');
const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

const SQUAD_THEME = {
  BlueTeam: 'blue', RedTeam: 'red', YellowTeam: 'yellow',
  GreenTeam: 'emerald', PurpleTeam: 'purple', OrangeTeam: 'orange',
};

const loadSavedState = (key, fallback) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed[key] !== undefined ? parsed[key] : fallback;
    }
  } catch (e) { console.error('Error loading state:', e); }
  return fallback;
};

function AudioPlayer({ src, initialDuration = 0, theme = 'amber' }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const themeClasses = {
    amber: 'bg-amber-500 hover:bg-amber-400',
    orange: 'bg-orange-500 hover:bg-orange-400',
    purple: 'bg-purple-500 hover:bg-purple-400',
    blue: 'bg-blue-500 hover:bg-blue-400',
    red: 'bg-red-500 hover:bg-red-400',
    yellow: 'bg-yellow-500 hover:bg-yellow-400',
    emerald: 'bg-emerald-500 hover:bg-emerald-400',
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
  const btnClass = themeClasses[theme] || themeClasses.amber;

  return (
    <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-2">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-2">
        <button onClick={togglePlay} className={`p-2 rounded-lg ${btnClass} text-slate-950 transition flex-shrink-0 shadow-md`}>
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1 space-y-1 min-w-0">
          <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-amber-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
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
        className="w-full h-1 accent-amber-400 cursor-pointer"
      />
    </div>
  );
}

const MatchingPairGame = ({ data, onFullyCompleted }) => {
  const [selectedKey, setSelectedKey] = useState(null);
  const [matches, setMatches] = useState({});
  const [localScore, setLocalScore] = useState(PERFECT_GAME_SCORE);
  const totalItems = data.pairs.length;
  const pointsPerItem = PERFECT_GAME_SCORE / totalItems;
  const handleKeyClick = (key) => { if (matches[key]) return; setSelectedKey(key); };
  const handleTargetClick = (target) => {
    if (!selectedKey) return;
    const pair = data.pairs.find(p => p.key === selectedKey);
    if (pair && pair.target === target) {
      const nextMatches = { ...matches, [selectedKey]: target };
      setMatches(nextMatches); setSelectedKey(null);
      if (Object.keys(nextMatches).length === totalItems) onFullyCompleted(localScore);
    } else {
      const newScore = Math.max(0, localScore - pointsPerItem);
      setLocalScore(newScore); setSelectedKey(null);
      if (newScore === 0) onFullyCompleted(0);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <p className="text-slate-200 text-base sm:text-lg font-bold leading-relaxed break-words">{data.instructions}</p>
        <span className="text-xs font-mono font-black text-amber-400 whitespace-nowrap">Potential: {Math.round(localScore)} PTS</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3.5">
          <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Concepts</h4>
          {data.pairs.map(p => (<button key={p.key} onClick={() => handleKeyClick(p.key)} disabled={!!matches[p.key]} className={`w-full text-left p-4 sm:p-5 rounded-2xl border text-sm sm:text-base font-bold transition-all backdrop-blur-sm break-words ${matches[p.key] ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 line-through opacity-60' : selectedKey === p.key ? 'bg-amber-950/80 border-amber-400 text-amber-100 shadow-lg shadow-amber-500/30' : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700'}`}>{p.key}</button>))}
        </div>
        <div className="space-y-3.5">
          <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Definitions</h4>
          {data.pairs.map(p => (<button key={p.target} onClick={() => handleTargetClick(p.target)} disabled={Object.values(matches).includes(p.target)} className={`w-full text-left p-4 sm:p-5 rounded-2xl border text-sm sm:text-base font-bold transition-all backdrop-blur-sm break-words ${Object.values(matches).includes(p.target) ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 opacity-60' : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-amber-500/50'}`}>{p.target}</button>))}
        </div>
      </div>
    </div>
  );
};

const CategoryGame = ({ data, onFullyCompleted }) => {
  const [items] = useState(data.items);
  const [classified, setClassified] = useState({});
  const [localScore, setLocalScore] = useState(PERFECT_GAME_SCORE);
  const totalItems = data.items.length;
  const pointsPerItem = PERFECT_GAME_SCORE / totalItems;
  const handleClassify = (item, targetCat) => {
    if (classified[item.id]) return;
    if (item.category === targetCat) {
      const next = { ...classified, [item.id]: targetCat };
      setClassified(next);
      if (Object.keys(next).length === totalItems) onFullyCompleted(localScore);
    } else {
      const newScore = Math.max(0, localScore - pointsPerItem);
      setLocalScore(newScore);
      if (newScore === 0) onFullyCompleted(0);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <p className="text-slate-200 text-base sm:text-lg font-bold leading-relaxed break-words">{data.instructions}</p>
        <span className="text-xs font-mono font-black text-amber-400 whitespace-nowrap">Potential: {Math.round(localScore)} PTS</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.categories.map(cat => (
          <div key={cat} className="p-5 sm:p-6 bg-slate-950/60 border border-slate-800 rounded-3xl space-y-4 shadow-xl backdrop-blur-sm">
            <h4 className="font-black text-amber-400 text-sm border-b border-slate-800 pb-3 uppercase tracking-widest break-words">{cat}</h4>
            <div className="min-h-[120px] sm:min-h-[160px] space-y-2.5">
              {Object.entries(classified).filter(([_, c]) => c === cat).map(([id]) => {
                const item = items.find(i => i.id === id);
                return <div key={id} className="p-3.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-sm font-bold text-emerald-300 break-words">{item.text}</div>;
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Unclassified Items</h4>
        <div className="flex flex-wrap gap-4">
          {items.filter(i => !classified[i.id]).map(item => (
            <div key={item.id} className="p-4 sm:p-5 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col gap-4 w-full sm:min-w-[220px] sm:w-auto sm:flex-1 shadow-lg backdrop-blur-sm">
              <span className="text-sm font-bold text-slate-200 break-words">{item.text}</span>
              <div className="flex flex-wrap gap-2.5">
                {data.categories.map(cat => (<button key={cat} onClick={() => handleClassify(item, cat)} className="px-3.5 py-2 text-xs bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-300 font-extrabold rounded-xl transition-all">{cat}</button>))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SequenceGame = ({ data, onFullyCompleted }) => {
  const [list, setList] = useState([...data.steps].sort(() => Math.random() - 0.5));
  const [localScore, setLocalScore] = useState(PERFECT_GAME_SCORE);
  const totalItems = data.steps.length;
  const pointsPerItem = PERFECT_GAME_SCORE / totalItems;
  const move = (from, to) => {
    const updated = [...list];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    setList(updated);
  };
  const handleVerify = () => {
    let correct = true;
    for (let i = 0; i < list.length; i++) {
      if (list[i].id !== data.steps[i].id) { correct = false; break; }
    }
    if (correct) onFullyCompleted(localScore);
    else {
      const newScore = Math.max(0, localScore - pointsPerItem);
      setLocalScore(newScore);
      if (newScore === 0) onFullyCompleted(0);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <p className="text-slate-200 text-base sm:text-lg font-bold leading-relaxed break-words">{data.instructions}</p>
        <span className="text-xs font-mono font-black text-amber-400 whitespace-nowrap">Potential: {Math.round(localScore)} PTS</span>
      </div>
      <div className="space-y-3.5">
        {list.map((step, idx) => (
          <div key={step.id} className="flex items-center justify-between gap-3 p-4 sm:p-5 bg-slate-950/60 border border-slate-800 rounded-2xl text-sm sm:text-base font-bold shadow-md backdrop-blur-sm">
            <span className="text-slate-200 break-words"><span className="text-amber-400 font-mono mr-2 sm:mr-3 text-lg">{idx + 1}.</span>{step.text}</span>
            <div className="flex gap-2 flex-shrink-0">
              <button disabled={idx === 0} onClick={() => move(idx, idx - 1)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl text-slate-200 text-base font-black transition-all">↑</button>
              <button disabled={idx === list.length - 1} onClick={() => move(idx, idx + 1)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl text-slate-200 text-base font-black transition-all">↓</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleVerify} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl text-sm sm:text-base transition-all shadow-xl shadow-amber-500/30 uppercase tracking-wider">Verify Order Sequence</button>
    </div>
  );
};

const ScenarioGame = ({ data, onFullyCompleted }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState({});
  const [localScore, setLocalScore] = useState(PERFECT_GAME_SCORE);
  const scenario = data.scenarios[currentIdx];
  const totalItems = data.scenarios.length;
  const pointsPerItem = PERFECT_GAME_SCORE / totalItems;
  const handleSelect = (optionIdx) => {
    if (answered[currentIdx] !== undefined) return;
    const isCorrect = optionIdx === scenario.correct;
    const nextAnswered = { ...answered, [currentIdx]: optionIdx };
    setAnswered(nextAnswered);
    if (isCorrect) {
      if (Object.keys(nextAnswered).length === totalItems) onFullyCompleted(localScore);
      else setTimeout(() => setCurrentIdx(prev => prev + 1), 800);
    } else {
      const newScore = Math.max(0, localScore - pointsPerItem);
      setLocalScore(newScore);
      if (newScore === 0) onFullyCompleted(0);
      else setTimeout(() => { setAnswered(prev => { const n = {...prev}; delete n[currentIdx]; return n; }); }, 800);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <p className="text-slate-200 text-base sm:text-lg font-bold leading-relaxed break-words">{data.instructions}</p>
        <span className="text-xs font-mono font-black text-amber-400 whitespace-nowrap">Potential: {Math.round(localScore)} PTS</span>
      </div>
      <div className="p-5 sm:p-7 bg-slate-950/60 border border-slate-800 rounded-3xl space-y-6 shadow-xl backdrop-blur-sm">
        <div className="flex justify-between items-center text-xs text-amber-400 font-black uppercase tracking-widest"><span>Scenario {currentIdx + 1} of {totalItems}</span></div>
        <p className="text-base sm:text-lg font-bold text-slate-200 leading-snug break-words">{scenario.prompt}</p>
        <div className="space-y-3.5">
          {scenario.options.map((opt, idx) => {
            const isSelected = answered[currentIdx] === idx;
            const isCorrect = idx === scenario.correct;
            let btnStyle = "bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700 backdrop-blur-sm";
            if (answered[currentIdx] !== undefined) {
              if (isCorrect) btnStyle = "bg-emerald-950/70 border-emerald-500 text-emerald-200 font-black";
              else if (isSelected) btnStyle = "bg-rose-950/70 border-rose-500 text-rose-200 font-black";
            }
            return (<button key={idx} onClick={() => handleSelect(idx)} disabled={answered[currentIdx] !== undefined} className={`w-full text-left p-4 sm:p-5 border rounded-2xl text-sm sm:text-base transition-all font-semibold break-words ${btnStyle}`}>{opt}</button>);
          })}
        </div>
      </div>
    </div>
  );
};

const BinaryClassifierGame = ({ data, onFullyCompleted }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [localScore, setLocalScore] = useState(PERFECT_GAME_SCORE);
  const item = data.items[currentIdx];
  const totalItems = data.items.length;
  const pointsPerItem = PERFECT_GAME_SCORE / totalItems;
  const handleVote = (choice) => {
    if (completed) return;
    if (item.type === choice) {
      if (currentIdx < totalItems - 1) setCurrentIdx(prev => prev + 1);
      else { setCompleted(true); onFullyCompleted(localScore); }
    } else {
      const newScore = Math.max(0, localScore - pointsPerItem);
      setLocalScore(newScore);
      if (newScore === 0) { setCompleted(true); onFullyCompleted(0); }
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <p className="text-slate-200 text-base sm:text-lg font-bold leading-relaxed break-words">{data.instructions}</p>
        <span className="text-xs font-mono font-black text-amber-400 whitespace-nowrap">Potential: {Math.round(localScore)} PTS</span>
      </div>
      {!completed ? (
        <div className="p-5 sm:p-9 bg-slate-950/60 border border-slate-800 rounded-3xl space-y-7 text-center shadow-xl backdrop-blur-sm">
          <span className="text-xs text-amber-400 font-black uppercase tracking-widest">Item {currentIdx + 1} of {totalItems}</span>
          <p className="text-lg sm:text-xl font-mono font-bold text-slate-200 p-4 sm:p-7 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-inner break-words">{item.text}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => handleVote('Safe')} className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-black rounded-2xl transition-all shadow-xl shadow-emerald-600/30 uppercase tracking-wider">Mark Safe</button>
            <button onClick={() => handleVote('Threat')} className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-rose-600 hover:bg-rose-500 text-white text-sm sm:text-base font-black rounded-2xl transition-all shadow-xl shadow-rose-600/30 uppercase tracking-wider">Mark Threat</button>
          </div>
        </div>
      ) : <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-lg font-black text-center shadow-lg">Classification Round Complete!</div>}
    </div>
  );
};

const InputSolverGame = ({ data, onFullyCompleted }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [localScore, setLocalScore] = useState(PERFECT_GAME_SCORE);
  const [solvedCount, setSolvedCount] = useState(0);
  const totalItems = data.questions.length;
  const pointsPerItem = PERFECT_GAME_SCORE / totalItems;
  const question = data.questions[currentIdx];
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const isCorrect = inputVal.trim().toLowerCase() === question.answer.toLowerCase();
    if (isCorrect) {
      setFeedback({ type: 'success', msg: 'Correct answer!' });
      const nextCount = solvedCount + 1;
      setSolvedCount(nextCount);
      if (nextCount === totalItems) setTimeout(() => onFullyCompleted(localScore), 800);
      else setTimeout(() => { setFeedback(null); setInputVal(''); setCurrentIdx(prev => prev + 1); }, 800);
    } else {
      const newScore = Math.max(0, localScore - pointsPerItem);
      setLocalScore(newScore);
      setFeedback({ type: 'error', msg: `Incorrect. Expected: ${question.answer}` });
      if (newScore === 0) setTimeout(() => onFullyCompleted(0), 800);
      else setTimeout(() => { setFeedback(null); setInputVal(''); }, 1200);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <p className="text-slate-200 text-base sm:text-lg font-bold leading-relaxed break-words">{data.instructions}</p>
        <span className="text-xs font-mono font-black text-amber-400 whitespace-nowrap">Potential: {Math.round(localScore)} PTS</span>
      </div>
      <div className="p-5 sm:p-7 bg-slate-950/60 border border-slate-800 rounded-3xl space-y-6 shadow-xl backdrop-blur-sm">
        <span className="text-xs text-amber-400 font-black uppercase tracking-widest">Question {currentIdx + 1} of {totalItems}</span>
        <p className="text-base sm:text-lg font-bold text-slate-200 break-words">{question.prompt}</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3.5">
          <input type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)} placeholder="Type your precise answer here..." className="flex-1 w-full bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-4 text-sm sm:text-base font-bold text-slate-200 focus:outline-none focus:border-amber-500 shadow-inner" />
          <button type="submit" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-sm sm:text-base font-black rounded-2xl transition-all shadow-xl uppercase tracking-wider whitespace-nowrap">Submit</button>
        </form>
        {feedback && <div className={`p-4 rounded-2xl text-sm font-black break-words ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'}`}>{feedback.msg}</div>}
      </div>
    </div>
  );
};

export default function Minigames() {
  const { setActiveTab, user, userProfile, botName } = useAppStore();

  const currentUsername = userProfile?.username || user?.username || 'Operative';
  const currentUserAvatar = userProfile?.avatar || '⚡';

  const [gameMode, setGameMode] = useState(() => loadSavedState('gameMode', 'Beginner'));
  const [isTeamMode, setIsTeamMode] = useState(() => loadSavedState('isTeamMode', false));
  const [modeScores, setModeScores] = useState(() => loadSavedState('modeScores', {
    Beginner: 0, Intermediate: 0, Master: 0, God: 0, Go: 0
  }));

  const blankRun = () => ({ activeTopic: 'ict-101', topicScores: {}, completedGames: [], streaks: 0, hintsUsed: 0, skipsUsed: 0 });

  const [modeProgress, setModeProgress] = useState(() => {
    const saved = loadSavedState('modeProgress', null);
    if (saved && typeof saved === 'object') {
      return { Beginner: blankRun(), Intermediate: blankRun(), Master: blankRun(), God: blankRun(), Go: blankRun(), ...saved };
    }
    return {
      Beginner: { activeTopic: loadSavedState('activeTopic', 'ict-101'), topicScores: loadSavedState('topicScores', {}), completedGames: loadSavedState('completedGames', []), streaks: loadSavedState('streaks', 0), hintsUsed: loadSavedState('hintsUsed', 0), skipsUsed: loadSavedState('skipsUsed', 0) },
      Intermediate: blankRun(), Master: blankRun(), God: blankRun(), Go: blankRun(),
    };
  });

  const prog = modeProgress[gameMode] || blankRun();
  const activeTopic = prog.activeTopic;
  const topicScores = prog.topicScores;
  const completedGames = prog.completedGames;
  const streaks = prog.streaks;
  const hintsUsed = prog.hintsUsed;
  const skipsUsed = prog.skipsUsed;

  const patchMode = (patchOrFn) => setModeProgress(prev => {
    const cur = prev[gameMode] || blankRun();
    const patch = typeof patchOrFn === 'function' ? patchOrFn(cur) : patchOrFn;
    return { ...prev, [gameMode]: { ...cur, ...patch } };
  });

  const setActiveTopic = (t) => patchMode({ activeTopic: t });
  const setTopicScores = (u) => patchMode(cur => ({ topicScores: typeof u === 'function' ? u(cur.topicScores) : u }));
  const setCompletedGames = (u) => patchMode(cur => ({ completedGames: typeof u === 'function' ? u(cur.completedGames) : u }));
  const setStreaks = (u) => patchMode(cur => ({ streaks: typeof u === 'function' ? u(cur.streaks) : u }));
  const setHintsUsed = (u) => patchMode(cur => ({ hintsUsed: typeof u === 'function' ? u(cur.hintsUsed) : u }));
  const setSkipsUsed = (u) => patchMode(cur => ({ skipsUsed: typeof u === 'function' ? u(cur.skipsUsed) : u }));

  const [showHint, setShowHint] = useState(false);
  const [isTeamProfileOpen, setIsTeamProfileOpen] = useState(false);
  const [squadName, setSquadName] = useState(() => loadSavedState('squadName', 'Alpha Cyber Squad'));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // 🔧 Isolated chat target key — no collision with Home or PracticeLab
  const [chatTarget, setChatTarget] = useState(() => {
    try {
      return localStorage.getItem(MINI_CHAT_TARGET_KEY) || 'Aura-1 AI';
    } catch (e) {
      console.warn('Failed to load chat target preference:', e);
      return 'Aura-1 AI';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(MINI_CHAT_TARGET_KEY, chatTarget);
    } catch (e) {
      console.warn('Failed to save chat target preference:', e);
    }
  }, [chatTarget]);

  // 🔧 FIXED: Start empty, load in useEffect after activeTopic is stable
  const [botChatMessages, setBotChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

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
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMicRequesting, setIsMicRequesting] = useState(false);
  const [pendingRecording, setPendingRecording] = useState(null);
  const [micError, setMicError] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');

  const recordingTimeRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);

  const [teamRoster, setTeamRoster] = useState([]);
  const [myTeamId, setMyTeamId] = useState(null);
  const [myColor, setMyColor] = useState('BlueTeam');

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  // ============================================================================
  // 🔧 BULLETPROOF BOT CHAT PERSISTENCE (per topic)
  // ============================================================================
  
  // LOAD: Runs once on mount AND whenever topic changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MINI_BOT_CHAT_KEY(activeTopic));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBotChatMessages(cleanMessages(parsed));
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted bot chat:', e);
    }
    // Nothing saved — seed greeting ONLY if chat is empty
    setBotChatMessages(prev => {
      if (prev.length > 0) return prev;
      return [{
        id: 'm1', sender: 'Aura-1 AI', avatar: '🤖',
        text: 'Welcome back to the Cyber Arcade. Continuing exactly where you left off!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
    });
  }, [activeTopic, cleanMessages]);

  // SAVE: Runs whenever messages or topic changes. NEVER saves empty.
  useEffect(() => {
    if (!botChatMessages || botChatMessages.length === 0) return;
    try {
      const clean = cleanMessages(botChatMessages).slice(-MAX_PERSISTED_MSGS);
      localStorage.setItem(MINI_BOT_CHAT_KEY(activeTopic), JSON.stringify(clean));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, truncating');
        try {
          const truncated = cleanMessages(botChatMessages).slice(-30);
          localStorage.setItem(MINI_BOT_CHAT_KEY(activeTopic), JSON.stringify(truncated));
        } catch (e2) {
          console.error('Failed to save even truncated:', e2);
        }
      } else {
        console.warn('Failed to persist bot chat:', e);
      }
    }
  }, [botChatMessages, activeTopic, cleanMessages]);

  const syncRosterFromDB = async () => {
    if (!user?.id) return;
    try {
      const { data: membership, error: mErr } = await supabase
        .from('team_members').select('team_id, role, team_assignment, score').eq('user_id', user.id).limit(1);
      if (mErr) throw mErr;
      if (!membership || membership.length === 0) { setTeamRoster([]); setMyTeamId(null); return; }
      const teamId = membership[0].team_id;
      setMyTeamId(teamId);
      setMyColor(membership[0].team_assignment || 'BlueTeam');

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
      try { sounds?.playClick?.(); } catch {}
    } catch (err) { alert('Failed to update role: ' + err.message); }
  };

  const handleSelectMyColor = async (newColor) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase.from('team_members').update({ team_assignment: newColor }).eq('user_id', user.id);
      if (error) throw error;
      setMyColor(newColor);
      await syncRosterFromDB();
      try { sounds?.playClick?.(); } catch {}
    } catch (err) { alert('Failed to update squad: ' + err.message); }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    try {
      const { error } = await supabase.rpc('leave_team_proper');
      if (error) throw error;
      setTeamRoster([]); setMyTeamId(null);
      setTeamChatMessages([]); setColorChatMessages([]);
      try { sounds?.playClick?.(); } catch {}
    } catch (err) { alert('Failed to leave team: ' + err.message); }
  };

  const [teamChatMessages, setTeamChatMessages] = useState([]);
  const teamRealtimeRef = useRef(null);

  const loadTeamChat = async (teamId) => {
    try {
      const { data, error } = await supabase.from('team_messages').select('*')
        .eq('team_id', teamId).eq('channel', 'team').order('created_at', { ascending: true }).limit(200);
      if (error) throw error;
      setTeamChatMessages((data || []).map(m => ({
        id: m.id, sender: m.sender_username, avatar: m.sender_avatar || '👤',
        text: m.body, audioUrl: m.audio_url, senderId: m.sender_id,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    } catch (err) { console.error('loadTeamChat failed:', err); }
  };

  const subscribeTeamChat = (teamId) => {
    if (teamRealtimeRef.current) supabase.removeChannel(teamRealtimeRef.current);
    const channel = supabase.channel(`mg_team_${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_messages', filter: `team_id=eq.${teamId}` }, () => { loadTeamChat(teamId); })
      .subscribe();
    teamRealtimeRef.current = channel;
  };

  const [colorChatMessages, setColorChatMessages] = useState([]);
  const colorRealtimeRef = useRef(null);

  const loadColorChat = async (teamId, color) => {
    try {
      const { data, error } = await supabase.from('team_messages').select('*')
        .eq('team_id', teamId).eq('channel', color).order('created_at', { ascending: true }).limit(200);
      if (error) throw error;
      setColorChatMessages((data || []).map(m => ({
        id: m.id, sender: m.sender_username, avatar: m.sender_avatar || '👤',
        text: m.body, audioUrl: m.audio_url, senderId: m.sender_id,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    } catch (err) { console.error('loadColorChat failed:', err); }
  };

  const subscribeColorChat = (teamId, color) => {
    if (colorRealtimeRef.current) supabase.removeChannel(colorRealtimeRef.current);
    const channel = supabase.channel(`mg_color_${teamId}_${color}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_messages', filter: `team_id=eq.${teamId}` }, () => { loadColorChat(teamId, color); })
      .subscribe();
    colorRealtimeRef.current = channel;
  };

  useEffect(() => {
    if (user?.id && isTeamMode) syncRosterFromDB();
    return () => {
      if (teamRealtimeRef.current) supabase.removeChannel(teamRealtimeRef.current);
      if (colorRealtimeRef.current) supabase.removeChannel(colorRealtimeRef.current);
    };
  }, [user?.id, isTeamMode]);

  useEffect(() => {
    if (myTeamId && isTeamMode) {
      loadTeamChat(myTeamId);
      subscribeTeamChat(myTeamId);
      const poll = setInterval(() => loadTeamChat(myTeamId), 5000);
      return () => clearInterval(poll);
    } else { setTeamChatMessages([]); }
  }, [myTeamId, isTeamMode]);

  useEffect(() => {
    if (myTeamId && isTeamMode) {
      loadColorChat(myTeamId, myColor);
      subscribeColorChat(myTeamId, myColor);
      const poll = setInterval(() => loadColorChat(myTeamId, myColor), 5000);
      return () => clearInterval(poll);
    } else { setColorChatMessages([]); }
  }, [myTeamId, myColor, isTeamMode]);

  useEffect(() => { if (!isTeamMode) setChatTarget('Aura-1 AI'); }, [isTeamMode]);
  useEffect(() => { setShowHint(false); }, [gameMode]);

  const currentModeScore = modeScores[gameMode] || 0;
  const sortedRoster = [...teamRoster].sort((a, b) => (b.score || 0) - (a.score || 0));

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ gameMode, isTeamMode, modeScores, modeProgress, squadName })); } catch (e) {}
  }, [gameMode, isTeamMode, modeScores, modeProgress, squadName]);

  const unlockedTitle = (modeScores['God'] || 0) >= 3000 ? 'ByteForged Legend' :
                        (modeScores['Master'] || 0) >= 2600 ? 'Netrunner Elite' :
                        (modeScores['Intermediate'] || 0) >= 1600 ? 'Cyber Architect' :
                        (modeScores['Beginner'] || 0) >= 1000 ? 'Systems Operator' : 'Novice Recruit';

  const maxHints = gameMode === 'Beginner' || gameMode === 'Go' ? 26 : gameMode === 'Intermediate' ? 13 : 0;
  const maxSkips = gameMode === 'Beginner' ? 26 : gameMode === 'Intermediate' ? 13 : 0;
  const isModeLocked = (mode) => {
    if (mode === 'Beginner') return false;
    if (mode === 'Intermediate') return (modeScores['Beginner'] || 0) < 1000;
    if (mode === 'Master') return (modeScores['Intermediate'] || 0) < 1600;
    if (mode === 'God') return (modeScores['Master'] || 0) < 2600;
    if (mode === 'Go') return (modeScores['God'] || 0) < 3000;
    return true;
  };

  const displayMessages = chatTarget === 'Aura-1 AI' ? botChatMessages : chatTarget === 'Team Chat' ? teamChatMessages : chatTarget === 'Role Chat' ? colorChatMessages : [];
  const currentMsgCount = displayMessages.length;

  useEffect(() => {
    if (currentMsgCount > prevMsgCount) {
      const lastMsg = displayMessages[currentMsgCount - 1];
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
  }, [currentMsgCount, displayMessages, isNearBottom, currentUsername, prevMsgCount]);

  const jumpToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setHasNewMessages(false);
  };

  const handleFullyCompleted = (earnedScore) => {
    const newModeTotal = (modeScores[gameMode] || 0) + earnedScore;
    setTopicScores(prev => ({ ...prev, [activeTopic]: (prev[activeTopic] || 0) + earnedScore }));
    setModeScores(prev => ({ ...prev, [gameMode]: newModeTotal }));
    setCompletedGames(prev => prev.includes(activeTopic) ? prev : [...prev, activeTopic]);
    setStreaks(prev => prev + 1);
    if (user?.id) {
      supabase.from('team_members').update({ score: newModeTotal }).eq('user_id', user.id).then(() => {
        setTeamRoster(prev => prev.map(m => m.id === user.id ? { ...m, score: newModeTotal } : m));
      });
    }
    try { sounds?.playUnlock?.(); } catch {}
  };

  const handleSkipGame = () => {
    if (skipsUsed >= maxSkips || gameMode === 'Go') return;
    setSkipsUsed(prev => prev + 1);
    handleFullyCompleted(0);
  };

  useEffect(() => {
    if (!completedGames.includes(activeTopic)) return;
    const allKeys = Object.keys(MINIGAMES_CONTENT);
    const isArcadeCleared = completedGames.length === allKeys.length;
    if (isArcadeCleared && gameMode !== 'Go') {
      const timer = setTimeout(() => {
        if (window.confirm(`🏆 Arcade Cleared in ${gameMode} Mode! You earned ${currentModeScore} PTS.\n\nPlay again to reset this mode's run?`)) {
          setTopicScores({}); setCompletedGames([]); setStreaks(0); setHintsUsed(0); setSkipsUsed(0); setActiveTopic(allKeys[0]);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    if (gameMode !== 'Go') {
      let nextTopic = null;
      if (gameMode === 'God') {
        const unplayed = allKeys.filter(k => !completedGames.includes(k));
        if (unplayed.length > 0) nextTopic = unplayed[Math.floor(Math.random() * unplayed.length)];
      } else {
        const idx = allKeys.indexOf(activeTopic);
        if (idx < allKeys.length - 1) nextTopic = allKeys[idx + 1];
      }
      if (nextTopic) {
        const timer = setTimeout(() => { setActiveTopic(nextTopic); setShowHint(false); }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [completedGames, activeTopic, gameMode, currentModeScore]);

  const handleResetActiveGame = () => {
    setTopicScores(prev => ({ ...prev, [activeTopic]: 0 }));
    setCompletedGames(prev => prev.filter(id => id !== activeTopic));
    setStreaks(0); setShowHint(false);
  };

  const handleResetCurrentMode = () => {
    if (window.confirm(`Reset ALL progress for ${gameMode} mode only?`)) {
      patchMode(blankRun());
      setModeScores(prev => ({ ...prev, [gameMode]: 0 }));
      if (user?.id) supabase.from('team_members').update({ score: 0 }).eq('user_id', user.id);
      setShowHint(false);
      try { sounds?.playClick?.(); } catch {}
    }
  };

  const handleResetAllProgress = () => {
    if (window.confirm('Reset ALL arcade progress across ALL modes and 26 topics?')) {
      setModeProgress({ Beginner: blankRun(), Intermediate: blankRun(), Master: blankRun(), God: blankRun(), Go: blankRun() });
      setModeScores({ Beginner: 0, Intermediate: 0, Master: 0, God: 0, Go: 0 });
      if (user?.id) supabase.from('team_members').update({ score: 0 }).eq('user_id', user.id);
      setShowHint(false);
    }
  };

  const uploadVoiceNote = async (blob) => {
    if (!user?.id) return null;
    try {
      const fileName = `mg_voice_${user.id}_${Date.now()}.webm`;
      const { error } = await supabase.storage.from('voice_notes').upload(fileName, blob, { contentType: 'audio/webm', upsert: false });
      if (error) throw error;
      const { data: urlData } = await supabase.storage.from('voice_notes').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err) { console.error('Voice upload failed:', err); return null; }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

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

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

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
        setPendingRecording({ blob, blobUrl: URL.createObjectURL(blob), duration, target: chatTarget });
        try { sounds?.playClick?.(); } catch {}
      } else {
        setMicError('Recording came back empty — tap mic to try again.');
      }
      setIsRecording(false);
    };
    mediaRecorder.onerror = (err) => {
      console.error('MediaRecorder error:', err);
      cleanupStream();
      clearInterval(timerRef.current);
      timerRef.current = null;
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
    consumeLiveTranscript();
    setLiveTranscript('');
    recordingTimeRef.current = 0;
    setRecordingTime(0);
  };

  const handleSendPendingRecording = async () => {
    if (!pendingRecording) return;
    const { blob, blobUrl, duration, target } = pendingRecording;
    setPendingRecording(null);
    userJustSentRef.current = true;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (target === 'Aura-1 AI') {
      setBotChatMessages(prev => [...prev, {
        id: Date.now().toString(), sender: currentUsername, avatar: currentUserAvatar,
        text: '🎙️ Voice Note', audioUrl: blobUrl, duration, time: timeStr
      }]);
      const transcript = consumeLiveTranscript();
      setLiveTranscript('');
      try {
        if (transcript) {
          const aiReply = await askAura1Bot(transcript, MINIGAMES_CONTENT[activeTopic].title, 'Aura-1 AI');
          setBotChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(), sender: 'Aura-1 AI', avatar: '🤖', text: aiReply, time: timeStr
          }]);
        } else {
          setBotChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(), sender: 'Aura-1 AI', avatar: '🤖',
            text: `[Aura-1 Alert]: I couldn't capture live speech text from that recording. Your voice note is saved above — please type your question so I can evaluate it.`,
            time: timeStr
          }]);
        }
      } catch (err) {
        setBotChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), sender: 'Aura-1 AI', avatar: '🤖', text: '[Aura-1 Alert]: Connection error.', time: timeStr
        }]);
      }
    } else if (myTeamId) {
      consumeLiveTranscript();
      setLiveTranscript('');
      const audioUrl = await uploadVoiceNote(blob);
      try { URL.revokeObjectURL(blobUrl); } catch (e) {}
      if (audioUrl) {
        const channel = target === 'Role Chat' ? myColor : 'team';
        await supabase.from('team_messages').insert({
          team_id: myTeamId, channel, sender_id: user.id,
          sender_username: currentUsername, sender_avatar: currentUserAvatar,
          body: '🎙️ Voice Note', audio_url: audioUrl
        });
      }
    }
  };

  const handleSendText = async (e) => {
    if (e) e.preventDefault();
    const body = chatInput.trim();
    if (!body) return;
    setChatInput('');
    userJustSentRef.current = true;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (chatTarget === 'Aura-1 AI') {
      setBotChatMessages(prev => [...prev, {
        id: Date.now().toString(), sender: currentUsername, avatar: currentUserAvatar,
        text: body, time: timeStr
      }]);
      try {
        const aiReply = await askAura1Bot(body, MINIGAMES_CONTENT[activeTopic].title, 'Aura-1 AI');
        setBotChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), sender: 'Aura-1 AI', avatar: '🤖', text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } catch (err) {
        setBotChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), sender: 'Aura-1 AI', avatar: '🤖', text: '[Aura-1 Alert]: Connection error.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
      return;
    }

    if (!myTeamId) { alert('You are not in a team yet.'); return; }
    const channel = chatTarget === 'Role Chat' ? myColor : 'team';
    const { error } = await supabase.from('team_messages').insert({
      team_id: myTeamId, channel, sender_id: user.id,
      sender_username: currentUsername, sender_avatar: currentUserAvatar, body
    });
    if (error) alert('Failed to send: ' + error.message);
  };

  const handleDeleteChatMessage = async (msgId) => {
    if (chatTarget === 'Aura-1 AI') {
      setBotChatMessages(prev => prev.filter(m => m.id !== msgId));
    } else {
      try {
        const { error } = await supabase.from('team_messages').delete().eq('id', msgId);
        if (error) throw error;
        if (chatTarget === 'Team Chat') setTeamChatMessages(prev => prev.filter(m => m.id !== msgId));
        else if (chatTarget === 'Role Chat') setColorChatMessages(prev => prev.filter(m => m.id !== msgId));
      } catch (err) { alert('Failed to delete: ' + err.message); }
    }
  };

  const handleClearAllChat = () => {
    if (chatTarget === 'Aura-1 AI') {
      if (window.confirm('Are you sure you want to delete all workspace messages?')) {
        setBotChatMessages([{ id: Date.now().toString(), sender: botName || 'Aura-1', avatar: '🤖', text: 'Workspace chat cleared.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
    } else if (chatTarget === 'Team Chat' && myTeamId) {
      if (window.confirm('Remove YOUR team messages?')) {
        supabase.from('team_messages').delete().eq('sender_id', user.id).eq('team_id', myTeamId).eq('channel', 'team').then(() => {
          setTeamChatMessages(prev => prev.filter(m => m.senderId !== user.id));
        });
      }
    } else if (chatTarget === 'Role Chat' && myTeamId) {
      if (window.confirm(`Remove YOUR ${COLOR_LABEL(myColor)} squad messages?`)) {
        supabase.from('team_messages').delete().eq('sender_id', user.id).eq('team_id', myTeamId).eq('channel', myColor).then(() => {
          setColorChatMessages(prev => prev.filter(m => m.senderId !== user.id));
        });
      }
    }
  };

  const activeContent = MINIGAMES_CONTENT[activeTopic] || MINIGAMES_CONTENT['ict-101'];
  const chatTabs = isTeamMode && myTeamId ? ['Aura-1 AI', 'Team Chat', 'Role Chat'] : ['Aura-1 AI'];

  const getAudioTheme = (msg) => {
    if (chatTarget === 'Aura-1 AI') return 'amber';
    if (chatTarget === 'Team Chat') return 'purple';
    if (chatTarget === 'Role Chat') return SQUAD_THEME[myColor] || 'amber';
    return 'amber';
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
    <div className="min-h-screen text-slate-100 p-4 md:p-8 font-sans space-y-6 pb-12 relative">
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-yellow-400/5 rounded-full blur-[100px]" />
      </div>

      <div className="bg-slate-900/40 border border-amber-500/20 rounded-3xl p-5 md:p-7 shadow-2xl shadow-amber-500/10 backdrop-blur-2xl flex flex-col gap-6 relative">
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-xl shadow-md flex-shrink-0 self-start sm:self-auto">
            <Gamepad2 className="w-7 h-7 sm:w-9 sm:h-9 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-200 truncate">Cyber Arcade Arena</h1>
              <span className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-black rounded-full flex items-center gap-1 sm:gap-1.5 shadow-md uppercase tracking-wider backdrop-blur-sm whitespace-nowrap">
                <Award className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" /> <span className="truncate max-w-[120px] sm:max-w-none">{unlockedTitle}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm font-mono text-amber-100/60 mt-1 truncate">26 Computing Domains • Per-Mode Progress Saved • Powered by Aura-1 AI</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-wrap items-stretch sm:items-center gap-2 sm:gap-3.5 w-full">
            <button onClick={() => setIsTeamMode(!isTeamMode)} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border shadow-lg backdrop-blur-sm whitespace-nowrap ${isTeamMode ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:text-white'}`}>
              <Users className="w-4 h-4 flex-shrink-0" /> {isTeamMode ? 'TEAM MODE' : 'SOLO MODE'}
            </button>
            
            <div className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-900/60 border border-slate-700 rounded-xl flex items-center justify-between sm:justify-start gap-2 sm:gap-3.5 shadow-md backdrop-blur-sm">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 flex-shrink-0" />
              <div className="text-left min-w-0">
                <span className="block text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-black truncate">{gameMode} Score</span>
                <span className="text-sm sm:text-base font-black text-amber-400 truncate block">{currentModeScore} PTS</span>
              </div>
              <button onClick={handleResetCurrentMode} className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-lg transition flex-shrink-0 ml-1" title={`Reset ${gameMode} mode`}>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-900/60 border border-slate-700 rounded-xl flex items-center justify-between sm:justify-start gap-2 sm:gap-3.5 shadow-md backdrop-blur-sm">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
              <div className="text-left min-w-0">
                <span className="block text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-black">Streak</span>
                <span className="text-sm sm:text-base font-black text-orange-400 truncate block">{streaks}x</span>
              </div>
            </div>

            {isTeamMode && (
              <button onClick={() => setIsTeamProfileOpen(true)} className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 bg-purple-600/80 hover:bg-purple-600 border border-purple-500/50 text-white text-[10px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg uppercase tracking-wider whitespace-nowrap">
                <Users className="w-4 h-4 flex-shrink-0" /> Team Profile
              </button>
            )}
          </div>

          <div className="flex bg-slate-900/60 border border-slate-700 rounded-xl p-1.5 shadow-md backdrop-blur-sm w-full">
            {['Beginner', 'Intermediate', 'Master', 'God', 'Go'].map(mode => {
              const locked = isModeLocked(mode);
              return (
                <button key={mode} onClick={() => !locked && setGameMode(mode)} disabled={locked} className={`flex-1 px-1 sm:px-3 py-2 text-[9px] sm:text-[10px] md:text-xs rounded-lg font-black transition-all uppercase tracking-wider flex items-center justify-center gap-1 ${gameMode === mode ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg' : locked ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-slate-200'}`} title={locked ? `Requires ${mode === 'Intermediate' ? 1000 : mode === 'Master' ? 1600 : mode === 'God' ? 2600 : 3000} PTS in previous mode` : `Resume ${mode}`}>
                  {locked && <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />} <span className="truncate hidden xs:inline sm:inline">{mode}</span><span className="truncate xs:hidden sm:hidden inline">{mode.substring(0,3)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-slate-900/40 border border-amber-500/20 rounded-3xl p-5 md:p-9 shadow-2xl shadow-amber-500/10 backdrop-blur-2xl space-y-6 md:space-y-7 relative">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-5 border-b border-slate-800 pb-5 sm:pb-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2 sm:gap-3.5 flex-wrap">
                  <span className="px-2.5 sm:px-3 py-1 bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-mono font-black rounded-lg uppercase backdrop-blur-sm whitespace-nowrap">{activeTopic}</span>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight break-words">{activeContent.title}</h2>
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-2">Perfect Score: {PERFECT_GAME_SCORE} PTS | Current Run: <span className="text-amber-400 font-extrabold">{topicScores[activeTopic] || 0} PTS</span></p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button onClick={() => { if (hintsUsed < maxHints) { setHintsUsed(p => p + 1); setShowHint(true); } }} disabled={hintsUsed >= maxHints || !activeContent.hint} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md uppercase tracking-wider disabled:opacity-40 backdrop-blur-sm whitespace-nowrap">
                  <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" /> Hint ({hintsUsed}/{maxHints})
                </button>
                <button onClick={handleSkipGame} disabled={skipsUsed >= maxSkips || gameMode === 'Go'} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md uppercase tracking-wider disabled:opacity-40 backdrop-blur-sm whitespace-nowrap">
                  <FastForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" /> Skip ({skipsUsed}/{maxSkips})
                </button>
                <button onClick={handleResetActiveGame} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md uppercase tracking-wider backdrop-blur-sm whitespace-nowrap">
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" /> Reset
                </button>
                <button onClick={() => setIsShareModalOpen(true)} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md uppercase tracking-wider backdrop-blur-sm whitespace-nowrap">
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" /> Share
                </button>
              </div>
            </div>

            {showHint && activeContent.hint && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 sm:p-5 text-sm font-semibold text-amber-300 space-y-1.5 shadow-[0_0_15px_rgba(245,158,11,0.1)] backdrop-blur-sm">
                <p className="font-black text-amber-400 flex items-center gap-2 text-sm sm:text-base"><Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /> Tactical Hint:</p>
                <p className="break-words">{activeContent.hint}</p>
              </div>
            )}

            {gameMode !== 'Master' && gameMode !== 'God' && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 sm:p-5 text-sm font-semibold text-slate-300 space-y-1.5 shadow-inner backdrop-blur-sm">
                <p className="font-black text-amber-400 flex items-center gap-2 text-sm sm:text-base"><HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /> Health Bar Scoring Active:</p>
                <p className="break-words">• You start with 115 potential points. Each wrong attempt deducts points.</p>
                {gameMode === 'Go' && <p className="text-amber-400 break-words">• Go Mode: Manual selection only.</p>}
              </div>
            )}
            {(gameMode === 'Master' || gameMode === 'God') && (
              <div className="bg-rose-950/20 border border-rose-500/40 rounded-xl p-4 sm:p-5 text-sm font-black text-rose-300 flex items-start sm:items-center gap-3 shadow-inner backdrop-blur-sm">
                <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 flex-shrink-0 mt-0.5 sm:mt-0" /> <span className="break-words">{gameMode} Mode: No hints, no skips. {gameMode === 'God' && 'Random auto-advance until all 26 cleared.'}</span>
              </div>
            )}

            <div key={`${gameMode}-${activeTopic}`} className="pt-3">
              {activeContent.type === 'matching' && <MatchingPairGame data={activeContent} onFullyCompleted={handleFullyCompleted} />}
              {activeContent.type === 'category' && <CategoryGame data={activeContent} onFullyCompleted={handleFullyCompleted} />}
              {activeContent.type === 'sequence' && <SequenceGame data={activeContent} onFullyCompleted={handleFullyCompleted} />}
              {activeContent.type === 'scenario' && <ScenarioGame data={activeContent} onFullyCompleted={handleFullyCompleted} />}
              {activeContent.type === 'binary_classifier' && <BinaryClassifierGame data={activeContent} onFullyCompleted={handleFullyCompleted} />}
              {activeContent.type === 'input_solver' && <InputSolverGame data={activeContent} onFullyCompleted={handleFullyCompleted} />}
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="bg-slate-900/40 border border-amber-500/20 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-amber-500/10 backdrop-blur-2xl flex flex-col h-[550px] sm:h-[650px] relative">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            
            <div className="flex border-b border-slate-800 pb-3 sm:pb-4 gap-2 sm:gap-3">
              {chatTabs.map(target => (
                <button key={target} onClick={() => setChatTarget(target)} className={`flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg border transition-all shadow-md backdrop-blur-sm truncate ${chatTarget === target ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20' : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'}`}>
                  {target === 'Role Chat' ? `${COLOR_LABEL(myColor)} Squad` : target}
                </button>
              ))}
            </div>

            <div ref={chatScrollRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto py-3 sm:py-4 space-y-3 sm:space-y-4 pr-1 custom-scrollbar relative min-h-0">
              {chatTarget === 'Role Chat' && (
                <div className="mb-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-lg py-1.5 backdrop-blur-sm truncate px-2">
                  Chatting with your {COLOR_LABEL(myColor)} Squad only
                </div>
              )}
              {displayMessages.length === 0 && chatTarget !== 'Aura-1 AI' && (
                <div className="text-center text-slate-500 text-xs py-8">No messages yet. Start the conversation!</div>
              )}
              {displayMessages.map(msg => (
                <div key={msg.id} className={`p-3 sm:p-4 rounded-xl max-w-[92%] text-sm space-y-2 relative group shadow-md backdrop-blur-sm ${msg.sender === currentUsername ? 'ml-auto bg-amber-500/20 border border-amber-500/40 text-amber-100 font-bold' : 'bg-slate-900/60 border border-slate-700 text-slate-200 font-bold'}`}>
                  <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-400 gap-2">
                    <span className="font-black uppercase tracking-wide text-amber-400 truncate min-w-0">{msg.avatar ? `${msg.avatar} ` : ''}{msg.sender}</span>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className="font-mono whitespace-nowrap">{msg.time}</span>
                      {msg.sender === currentUsername && (
                        <button onClick={() => handleDeleteChatMessage(msg.id)} className="text-rose-400 hover:text-rose-300 transition-all p-1 bg-rose-950/40 rounded-lg border border-rose-500/30 flex-shrink-0"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                      )}
                    </div>
                  </div>
                  {msg.text && <p className="leading-relaxed text-sm sm:text-base font-semibold break-words">{msg.text}</p>}
                  {msg.audioUrl && <AudioPlayer src={msg.audioUrl} initialDuration={msg.duration || 0} theme={getAudioTheme(msg)} />}
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {hasNewMessages && !isNearBottom && (
              <button
                onClick={jumpToBottom}
                className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/40 z-10 transition animate-bounce"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>New Messages</span>
              </button>
            )}

            <div className="space-y-3 pt-3 sm:pt-4 border-t border-slate-800 mt-2">
              {isRecording && (
                <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-xs font-mono text-red-300">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-ping flex-shrink-0"></span>
                      <span className="font-extrabold truncate">● REC {formatTime(recordingTime)}</span>
                    </div>
                    <span className="text-[10px] text-red-400 italic flex-shrink-0 ml-2">Tap mic again to stop</span>
                  </div>
                  {liveTranscript && (
                    <div className="mt-2 text-[10px] text-amber-200/90 font-mono italic truncate">📝 {liveTranscript}</div>
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
                <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 space-y-2 backdrop-blur-sm">
                  <div className="flex justify-between items-center text-[10px] font-mono text-amber-300 font-extrabold uppercase tracking-wider gap-2">
                    <span className="truncate min-w-0">🎙️ Voice Ready — {pendingRecording.target === 'Role Chat' ? `${COLOR_LABEL(myColor)} Squad` : pendingRecording.target}</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full flex-shrink-0 whitespace-nowrap">{formatTime(pendingRecording.duration)}</span>
                  </div>
                  <AudioPlayer src={pendingRecording.blobUrl} initialDuration={pendingRecording.duration} theme={pendingRecording.target === 'Aura-1 AI' ? 'amber' : pendingRecording.target === 'Team Chat' ? 'purple' : SQUAD_THEME[myColor] || 'amber'} />
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSendPendingRecording} className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-500/20">
                      <Send className="w-3 h-3" /> Send
                    </button>
                    <button onClick={handleDiscardRecording} className="px-4 py-2 bg-slate-900/60 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 backdrop-blur-sm flex-shrink-0">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendText} className="flex items-center gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={isRecording ? 'Live recording...' : chatTarget === 'Aura-1 AI' ? 'Ask Aura-1 AI...' : chatTarget === 'Role Chat' ? `Message ${COLOR_LABEL(myColor)} Squad...` : 'Message team...'} className="flex-1 min-w-0 bg-slate-950/60 border border-slate-700 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 placeholder-slate-500 backdrop-blur-sm" />
                <button 
                  type="button" 
                  onClick={toggleRecording} 
                  disabled={micButtonDisabled} 
                  title={micButtonTitle}
                  className={`p-2.5 sm:p-3 rounded-xl border transition flex-shrink-0 ${
                    isRecording
                      ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                      : micButtonDisabled
                      ? 'bg-slate-900/50 border-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-amber-400 border-slate-700 backdrop-blur-sm'
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
                <button type="submit" disabled={!chatInput.trim() || isRecording} className="p-2.5 sm:p-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex-shrink-0 disabled:opacity-50 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </button>
                <button type="button" onClick={handleClearAllChat} className="p-2.5 sm:p-3 bg-slate-900/60 hover:bg-rose-900/50 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 rounded-xl transition-all shadow-md backdrop-blur-sm flex-shrink-0 flex items-center justify-center">
                  <Eraser className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-amber-500/20 rounded-3xl p-5 md:p-6 shadow-2xl shadow-amber-500/10 backdrop-blur-2xl space-y-5 relative">
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-full flex justify-between items-center text-sm sm:text-base font-black text-white border-b border-slate-800 pb-4 uppercase tracking-wider gap-3">
          <span className="flex items-center gap-2 sm:gap-3 min-w-0"><Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 flex-shrink-0" /> <span className="truncate">Computing Suite Menu (26 Topics)</span></span>
          {isMenuOpen ? <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
        </button>
        {isMenuOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 pt-3">
            {Object.entries(MINIGAMES_CONTENT).map(([key, item]) => {
              const score = topicScores[key] || 0;
              const isActive = activeTopic === key;
              const isCompleted = completedGames.includes(key);
              return (
                <button key={key} onClick={() => gameMode === 'Go' && !isCompleted ? setActiveTopic(key) : null} disabled={gameMode !== 'Go' && !isCompleted} className={`p-4 sm:p-5 rounded-xl border text-left flex flex-col justify-between space-y-3.5 transition-all shadow-md backdrop-blur-sm ${isActive ? 'bg-amber-950/70 border-amber-500/50 text-amber-100 shadow-amber-500/20' : isCompleted ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100' : 'bg-slate-950/60 border-slate-700 text-slate-300 hover:border-slate-600 opacity-80'}`}>
                  <div className="min-w-0"><span className="text-[10px] sm:text-xs font-mono font-black text-amber-400 uppercase tracking-widest break-words">{key}</span><h4 className="text-sm font-black text-white line-clamp-1 mt-1.5 break-words">{item.title}</h4></div>
                  <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 border-t border-slate-700/80 pt-3 gap-2"><span className="uppercase tracking-wide truncate">{item.type}</span><span className={`font-black whitespace-nowrap ${isCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>{score} / 115 PTS</span></div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isTeamProfileOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/80 border border-purple-500/30 rounded-3xl p-5 md:p-9 max-w-2xl w-full space-y-6 shadow-2xl shadow-purple-500/20 backdrop-blur-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden relative">
            
            <div className="flex justify-between items-center border-b border-slate-700 pb-4 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 -mx-5 px-5 md:-mx-9 md:px-9 pt-1">
              <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-3 min-w-0">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-purple-400 flex-shrink-0" /> 
                <span className="truncate">Squad & Team Profile</span>
              </h3>
              <button onClick={() => setIsTeamProfileOpen(false)} className="text-slate-400 hover:text-white text-xl font-black flex-shrink-0 p-1">✕</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs text-slate-400 font-black uppercase tracking-widest mb-2">Custom Team Name</label>
                <input type="text" value={squadName} onChange={(e) => setSquadName(e.target.value)} className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-purple-500/50 shadow-inner backdrop-blur-sm" />
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Roster & Live Scores (Sorted by Score)</h4>
                <div className="max-h-64 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {sortedRoster.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-8">No team members yet. Invite friends from the Friends Hub!</p>
                  ) : (
                    sortedRoster.map((m, idx) => {
                      const isMe = m.id === user?.id;
                      return (
                        <div key={m.id} className="flex flex-col gap-4 p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-xs font-bold shadow-md backdrop-blur-sm">
                          
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="font-mono text-slate-500 text-sm flex-shrink-0 w-4 text-center">#{idx + 1}</span>
                              <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-xl border border-slate-700 flex-shrink-0">{m.avatar || '👤'}</div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white text-sm font-black truncate">{m.username}</span>
                                  {m.isLeader && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 flex-shrink-0 font-bold">LEADER</span>}
                                  {isMe && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 flex-shrink-0 font-bold">YOU</span>}
                                </div>
                                <span className="block text-xs text-purple-300 font-extrabold mt-0.5 truncate">{m.role} • {COLOR_LABEL(m.team)} Squad</span>
                              </div>
                            </div>
                            <span className="text-sm font-black text-amber-400 font-mono whitespace-nowrap flex-shrink-0">{m.score || 0} PTS</span>
                          </div>
                          
                          {isMe && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full pl-7">
                              <select value={m.role} onChange={(e) => handleSelectMyRole(e.target.value)} className="w-full sm:w-auto flex-1 bg-slate-950 border border-slate-700 text-white text-[11px] font-black rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50 backdrop-blur-sm appearance-none">
                                {SELF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                              <select value={m.team} onChange={(e) => handleSelectMyColor(e.target.value)} className="w-full sm:w-auto flex-1 bg-slate-950 border border-slate-700 text-white text-[11px] font-black rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50 backdrop-blur-sm appearance-none">
                                {SELF_COLORS.map(c => <option key={c} value={c}>{COLOR_LABEL(c)}</option>)}
                              </select>
                              <button onClick={handleLeaveTeam} className="w-full sm:w-auto py-2 px-4 bg-slate-800 hover:bg-rose-500/20 border border-slate-600 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 flex-shrink-0">
                                <LogOut className="w-3.5 h-3.5" /> Leave
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
              <button onClick={() => { try { sounds?.playClick?.(); } catch {} setIsTeamProfileOpen(false); if (setActiveTab) setActiveTab('friends'); }} className="flex-1 py-3 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-extrabold flex items-center justify-center space-x-2 transition shadow-lg shadow-purple-600/30">
                <UserPlus className="w-4 h-4" /><span>Invite Friends</span>
              </button>
              <button onClick={() => setIsTeamProfileOpen(false)} className="w-full sm:w-auto px-7 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl transition-all uppercase tracking-wider">Save & Close</button>
            </div>
          </div>
        </div>
      )}

      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-5 md:p-9 max-w-md w-full space-y-6 shadow-2xl shadow-amber-500/20 backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4 sticky top-0 bg-slate-900/95 backdrop-blur-md -mx-5 px-5 md:-mx-9 md:px-9 pt-1 z-10">
              <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2.5 min-w-0"><Award className="w-5 h-5 md:w-6 md:h-6 text-amber-400 flex-shrink-0" /> <span className="truncate">Share Score</span></h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-white text-lg font-black flex-shrink-0 p-1">✕</button>
            </div>
            <div className="p-5 sm:p-6 bg-slate-950/60 border border-slate-700 rounded-xl space-y-4 text-center shadow-inner backdrop-blur-sm">
              <span className="text-[10px] sm:text-xs text-amber-400 font-mono font-black uppercase tracking-widest block">ByteForged Academy Certificate</span>
              <h4 className="text-lg sm:text-xl font-black text-white break-words">{MINIGAMES_CONTENT[activeTopic].title}</h4>
              <div className="text-3xl sm:text-4xl font-black text-amber-400">{topicScores[activeTopic] || 0} / 115 PTS</div>
              <p className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider break-words">Mode: {currentModeScore} PTS ({unlockedTitle})</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`I scored ${topicScores[activeTopic] || 0}/115 on ${MINIGAMES_CONTENT[activeTopic].title} in ${gameMode} mode!`); alert('Copied!'); setIsShareModalOpen(false); }} className="w-full py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base rounded-xl transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-wider px-4">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /> <span className="truncate">Copy Credentials</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900/40 border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-xs font-black text-slate-300 shadow-xl uppercase tracking-wider backdrop-blur-2xl text-center sm:text-left">
        <span className="truncate w-full sm:w-auto">Active Topic: <strong className="text-white break-words">{MINIGAMES_CONTENT[activeTopic].title}</strong></span>
        <div className="flex items-center justify-center sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto flex-shrink-0">
          <span className="whitespace-nowrap">Global: <strong className="text-amber-400 text-xs sm:text-sm">{currentModeScore} PTS</strong></span>
          <button onClick={handleResetAllProgress} className="text-rose-400 hover:text-rose-300 underline transition-all font-black whitespace-nowrap">Reset All</button>
        </div>
      </div>
    </div>
  );
}