import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabaseClient';
import { sounds } from '../lib/soundEngine';
import { 
  Sparkles, ArrowRight, Check, Terminal, Zap, RefreshCw, Leaf
} from 'lucide-react';

const AVATAR_PRESETS = [
  { id: 'p1', icon: '⚔️', bg: 'from-cyan-500 to-blue-600', label: 'Cyber Samurai' },
  { id: 'p2', icon: '⚡', bg: 'from-purple-500 to-indigo-600', label: 'Net Architect' },
  { id: 'p3', icon: '👻', bg: 'from-emerald-500 to-teal-600', label: 'Kernel Ghost' },
  { id: 'p4', icon: '🔐', bg: 'from-amber-500 to-orange-600', label: 'Crypto Guard' },
  { id: 'p5', icon: '🤖', bg: 'from-pink-500 to-rose-600', label: 'System Operator' },
];

const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: 'What is your primary operative objective in ByteForged?',
    options: [
      { id: 'dev', text: 'Software Engineering & Game Development', icon: '💻' },
      { id: 'net', text: 'Computer Networking & Cisco Systems', icon: '📡' },
      { id: 'sec', text: 'Cybersecurity & Packet Inspection', icon: '🛡️' },
      { id: 'gen', text: 'General ICT & System Fundamentals', icon: '🚀' },
    ]
  },
  {
    id: 'q2',
    question: 'Select your preferred technical mastery focus:',
    options: [
      { id: 'godot', text: '2D/3D Engine Architecture (Godot/QBasic)', icon: '🎮' },
      { id: 'linux', text: 'Linux Systems & Shell Customization', icon: '🐧' },
      { id: 'web', text: 'Full-Stack Web & Supabase Backend', icon: '🌐' },
      { id: 'hardware', text: 'Hardware Protocols & Network Routing', icon: '⚡' },
    ]
  }
];

export default function OnboardingFlow({ onComplete }) {
  const { user, userProfile, updateProfile } = useAppStore();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedAvatar, setSelectedAvatar] = useState(
    AVATAR_PRESETS.find(a => a.icon === userProfile?.avatar) || AVATAR_PRESETS[0]
  );
  const [bio, setBio] = useState(userProfile?.bio || 'Initial Operative online and ready for deployment.');

  const [answers, setAnswers] = useState({});

  const handleNextStep = () => {
    sounds?.playClick?.();
    setStep((prev) => prev + 1);
  };

  const handleOptionSelect = (qId, optionId) => {
    sounds?.playClick?.();
    setAnswers(prev => ({ ...prev, [qId]: optionId }));
  };

  const handleFinishOnboarding = async () => {
    sounds?.playClick?.();
    setIsSubmitting(true);

    try {
      await supabase.auth.updateUser({
        data: {
          has_completed_onboarding: true,
          avatar: selectedAvatar.icon,
          avatar_bg: selectedAvatar.bg,
          bio: bio.trim(),
        }
      });

      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            avatar: selectedAvatar.icon,
            avatar_bg: selectedAvatar.bg,
            bio: bio.trim(),
            has_completed_onboarding: true,
            onboarding_completed: true,
          })
          .eq('id', user.id);
      }

      updateProfile({
        avatar: selectedAvatar.icon,
        avatarBg: selectedAvatar.bg,
        bio: bio.trim(),
        placementResults: answers,
        hasCompletedOnboarding: true,
        has_completed_onboarding: true,
        onboarding_completed: true,
      });

      if (onComplete) onComplete();
    } catch (err) {
      console.error('Failed to save onboarding metadata:', err);
      if (onComplete) onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-white flex items-center justify-center p-4 font-mono relative overflow-hidden">
      
      {/* Emerald Mint Background Glows — fresh start theme */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-emerald-500/15 rounded-full blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/3 w-[300px] h-[300px] bg-lime-400/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Frosted Glass Onboarding Card */}
      <div className="w-full max-w-2xl bg-slate-900/40 border border-emerald-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl relative z-10 space-y-8">
        
        {/* Top edge glow accent */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
        
        {/* Progress Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Leaf className="w-4 h-4" />
            <span>OPERATIVE INITIALIZATION :: STEP {step} OF 3</span>
          </div>
          <div className="flex space-x-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step ? 'w-12 bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : s < step ? 'w-8 bg-emerald-500/40' : 'w-8 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide">
                <span className="text-white">WELCOME TO BYTEFORGED, </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-lime-200">{user?.username || 'OPERATIVE'}</span>
                <span className="text-white">!</span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/60 max-w-md mx-auto leading-relaxed">
                Email verification confirmed. Let's calibrate your profile badge and complete your interest placement assessment.
              </p>
            </div>

            <button
              onClick={handleNextStep}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-300 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 flex items-center justify-center space-x-2"
            >
              <span>INITIALIZE PROFILE CONFIGURATION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: AVATAR & BIO */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 tracking-wide">Operative Avatar & Status Bio</h2>
              <p className="text-xs text-emerald-100/60 mt-1">Set your visual identifier badge and system profile bio.</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-emerald-200/70 uppercase font-bold tracking-wider">Select Preset Identifier</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => { sounds?.playClick?.(); setSelectedAvatar(preset); }}
                    className={`p-3 rounded-2xl border flex flex-col items-center space-y-2 transition-all ${
                      selectedAvatar.id === preset.id
                        ? 'bg-emerald-500/10 border-emerald-400 text-white scale-105 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:bg-slate-900/60 backdrop-blur-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${preset.bg} flex items-center justify-center text-xl shadow-md`}>
                      {preset.icon}
                    </div>
                    <span className="text-[10px] font-bold truncate w-full text-center">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-emerald-200/70 uppercase font-bold tracking-wider">Operative Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter status bio..."
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-400 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition resize-none backdrop-blur-sm"
              />
            </div>

            <button
              onClick={handleNextStep}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-300 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 flex items-center justify-center space-x-2"
            >
              <span>PROCEED TO PLACEMENT QUIZ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: QUIZ */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 tracking-wide">Skill Placement Assessment</h2>
              <p className="text-xs text-emerald-100/60 mt-1">Complete these questions to calibrate your operative track.</p>
            </div>

            <div className="space-y-6">
              {QUIZ_QUESTIONS.map((q) => (
                <div key={q.id} className="space-y-3">
                  <span className="text-xs font-bold text-emerald-100">{q.question}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleOptionSelect(q.id, opt.id)}
                          className={`p-3.5 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                            isSelected 
                              ? 'bg-emerald-500/10 border-emerald-400 text-white shadow-md shadow-emerald-500/20' 
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:bg-slate-900/60 backdrop-blur-sm'
                          }`}
                        >
                          <span className="text-lg">{opt.icon}</span>
                          <span className="text-xs font-bold flex-1">{opt.text}</span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-300" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinishOnboarding}
              disabled={Object.keys(answers).length < QUIZ_QUESTIONS.length || isSubmitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-300 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>FINALIZE ONBOARDING & LAUNCH DASHBOARD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}