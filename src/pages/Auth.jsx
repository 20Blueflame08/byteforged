import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabaseClient';
import { sounds } from '../lib/soundEngine';
import { 
  Terminal, Mail, Lock, User, 
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck
} from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState('form');
  const [isLoading, setIsLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [identifier, setIdentifier] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const { loginUser } = useAppStore();

  const handleToggleMode = () => {
    sounds?.playClick?.();
    setIsSignUp(!isSignUp);
    setStep('form');
    setErrorMessage('');
    setInfoMessage('');
  };

  const formatAuthError = (err) => {
    if (!err) return '🚨 Unknown system authentication error occurred.';
    if (typeof err === 'string') return err;
    if (err.message && err.message !== '{}') return err.message;
    if (err.error_description) return err.error_description;
    return '🚨 Authentication Gateway Error. Please check your credentials or network connection.';
  };

  const completeLogin = (user, hasCompletedOnboarding) => {
    loginUser({
      id: user.id,
      email: user.email || email,
      username: user.user_metadata?.username || username || user.email?.split('@')[0] || identifier,
      created_at: user.created_at,
      hasCompletedOnboarding,
    });

    if (onAuthSuccess) {
      onAuthSuccess(!hasCompletedOnboarding);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    sounds?.playClick?.();
    setErrorMessage('');
    setInfoMessage('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim() || username.trim().length < 3) {
          throw new Error('🚨 Username must be at least 3 characters long.');
        }
        if (!email.trim()) {
          throw new Error('🚨 Email address field cannot be empty.');
        }
        if (password.length < 6) {
          throw new Error('🚨 Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('🚨 Passwords do not match.');
        }

        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              username: username.trim(),
              has_completed_onboarding: false,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData?.user && !signUpData?.session) {
          setStep('email_sent');
        } else if (signUpData?.session) {
          completeLogin(signUpData.user, false);
        }

      } else {
        if (!identifier.trim() || !password.trim()) {
          throw new Error('🚨 Please enter your Email and Password.');
        }

        const cleanEmail = identifier.trim();

        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            throw new Error('🚨 Email Unverified: Confirm your email link sent to your inbox or spam folder.');
          }
          throw error;
        }

        const user = data.user;
        const hasCompletedOnboarding = user?.user_metadata?.has_completed_onboarding === true;
        completeLogin(user, hasCompletedOnboarding);
      }
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Rose Gold Background Glows — primary theme */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/15 rounded-full blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-amber-400/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(244,63,94,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(244,63,94,0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Frosted Glass Auth Card */}
      <div className="w-full max-w-md bg-slate-900/40 border border-rose-500/20 rounded-3xl p-8 shadow-2xl shadow-rose-500/10 backdrop-blur-2xl relative z-10 space-y-6">
        
        {/* Subtle top glow accent */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-rose-400/60 to-transparent" />
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-400/30 text-rose-300 shadow-lg shadow-rose-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-mono font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-400 to-amber-200">
            BYTEFORGED
          </h1>
          <p className="text-xs font-mono text-rose-200/60 uppercase tracking-[0.2em]">
            {isSignUp ? '◈ Operative Registration Gateway' : '◈ System Authentication Gate'}
          </p>
        </div>

        {/* Notifications */}
        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-400/40 text-rose-300 text-xs font-mono font-bold flex items-start space-x-2 backdrop-blur-sm">
            <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{infoMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-mono font-bold flex items-start space-x-2 animate-shake backdrop-blur-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: FORM INPUTS */}
        {step === 'form' && (
          <form onSubmit={handleAuthSubmit} className="space-y-3.5 font-mono">
            
            {isSignUp ? (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] text-rose-200/70 uppercase font-bold tracking-wider">Username</label>
                  <div className="relative group">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300/60 group-focus-within:text-rose-300 transition" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Vols_BluePyre"
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-rose-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-rose-200/70 uppercase font-bold tracking-wider">Email Address</label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300/60 group-focus-within:text-rose-300 transition" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operative@byteforged.io"
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-rose-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-rose-200/70 uppercase font-bold tracking-wider">Password</label>
                    <div className="relative group">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rose-300/60 group-focus-within:text-rose-300 transition" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-rose-400 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-rose-200/70 uppercase font-bold tracking-wider">Confirm</label>
                    <div className="relative group">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rose-300/60 group-focus-within:text-rose-300 transition" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-rose-400 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] text-rose-200/70 uppercase font-bold tracking-wider">Email Address</label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300/60 group-focus-within:text-rose-300 transition" />
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="operative@byteforged.io"
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-rose-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition backdrop-blur-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-rose-200/70 uppercase font-bold tracking-wider">Password</label>
                  <div className="relative group">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300/60 group-focus-within:text-rose-300 transition" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-rose-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition backdrop-blur-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 hover:from-rose-400 hover:via-pink-400 hover:to-rose-300 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-500/30 hover:shadow-rose-400/50 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>{isSignUp ? 'CREATE ACCOUNT & VERIFY' : 'AUTHENTICATE & ENTER'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              {isSignUp ? 'Already registered?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={handleToggleMode}
                className="text-rose-300 font-bold hover:text-rose-200 hover:underline transition"
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: EMAIL SENT NOTICE */}
        {step === 'email_sent' && (
          <div className="space-y-4 font-mono">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-500/5 border border-rose-400/40 space-y-3 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-rose-300">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold text-sm">Confirmation Email Sent!</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Check your inbox at <span className="text-rose-300 font-bold">{email}</span> to confirm your email address and authorize your clearance.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed flex items-start space-x-2.5 backdrop-blur-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong className="text-amber-200">OPERATIVE DIRECTIVE:</strong> If the email hasn't landed in your Primary Inbox, inspect your <strong>Spam / Junk folder</strong> and mark it as <em>"Not Spam"</em>.
              </span>
            </div>

            <button
              onClick={handleToggleMode}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 hover:from-rose-400 hover:via-pink-400 hover:to-rose-300 text-white font-extrabold text-xs tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>RETURN TO SIGN IN</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}