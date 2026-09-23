import React, { useState, useEffect, useRef } from 'react';
import TopNav from './components/TopNav';
import Menu from './pages/Menu';

import Profile from './pages/Profile';
import Auth from './pages/Auth';
import PracticeLab from './pages/PracticeLab';
import Minigames from './pages/Minigames';
import FriendsHub from './pages/FriendsHub';
import OnboardingFlow from './components/OnboardingFlow';
import { useAppStore } from './store/useAppStore';
import { supabase } from './lib/supabaseClient';

// ============================================================================
// HEARTBEAT CONSTANTS
// ============================================================================
const HEARTBEAT_INTERVAL_MS = 30000; // Ping every 30 seconds
const IDLE_TIMEOUT_MS = 60000; // Mark offline after 60s tab hidden

export default function App() {
  const { activeTab, isAuthenticated, logoutUser, userProfile } = useAppStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // ============================================================================
  // HEARTBEAT REFS — track session, intervals, and idle timeouts
  // ============================================================================
  const sessionRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const idleTimeoutRef = useRef(null);

  // Helper: get Supabase URL and anon key from env
  const getSupabaseConfig = () => ({
    url: import.meta.env?.VITE_SUPABASE_URL || '',
    key: import.meta.env?.VITE_SUPABASE_ANON_KEY || '',
  });

  // ============================================================================
  // HEARTBEAT: Ping update_heartbeat RPC (sets is_online=true, updates last_seen)
  // ============================================================================
  const pingHeartbeat = async () => {
    try {
      await supabase.rpc('update_heartbeat');
    } catch (err) {
      console.warn('Heartbeat ping failed:', err.message);
    }
  };

  // ============================================================================
  // BEACON: Mark offline via fetch with keepalive:true (survives tab/browser close)
  // ============================================================================
  const markOfflineBeacon = () => {
    const token = sessionRef.current?.access_token;
    if (!token) return;

    const { url, key } = getSupabaseConfig();
    if (!url || !key) {
      console.warn('Beacon skipped: missing Supabase config');
      return;
    }

    fetch(`${url}/rest/v1/rpc/mark_offline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': key,
      },
      body: '{}',
      keepalive: true,
    }).catch(() => {}); // Silently fail — page is closing anyway
  };

  // ============================================================================
  // EFFECT: Start heartbeat when authenticated
  // ============================================================================
  useEffect(() => {
    const initHeartbeat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      sessionRef.current = session;

      if (session && isAuthenticated) {
        await pingHeartbeat(); // Mark online immediately
        if (!heartbeatIntervalRef.current) {
          heartbeatIntervalRef.current = setInterval(pingHeartbeat, HEARTBEAT_INTERVAL_MS);
        }
      }
    };

    if (isAuthenticated) {
      initHeartbeat();
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated]);

  // ============================================================================
  // EFFECT: Listen for auth state changes (sign in / sign out)
  // ============================================================================
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      sessionRef.current = session;

      if (event === 'SIGNED_OUT' || !session) {
        // Mark offline BEFORE clearing local state
        markOfflineBeacon();
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        if (typeof logoutUser === 'function') {
          logoutUser();
        }
      } else if (event === 'SIGNED_IN') {
        // Mark online on sign in
        await pingHeartbeat();
        if (!heartbeatIntervalRef.current) {
          heartbeatIntervalRef.current = setInterval(pingHeartbeat, HEARTBEAT_INTERVAL_MS);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [logoutUser]);

  // ============================================================================
  // EFFECT: Visibility change — pause heartbeat when tab hidden, resume on focus
  // ============================================================================
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Tab hidden — start idle timeout
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = setTimeout(() => {
          markOfflineBeacon();
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
        }, IDLE_TIMEOUT_MS);
      } else {
        // Tab visible again — cancel idle timeout and resume heartbeat
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
        if (sessionRef.current && !heartbeatIntervalRef.current) {
          pingHeartbeat(); // Immediate ping on focus
          heartbeatIntervalRef.current = setInterval(pingHeartbeat, HEARTBEAT_INTERVAL_MS);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ============================================================================
  // EFFECT: Tab/browser close — mark offline via beacon
  // ============================================================================
  useEffect(() => {
    const handleBeforeUnload = () => markOfflineBeacon();
    const handlePageHide = () => markOfflineBeacon(); // More reliable on mobile

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // ============================================================================
  // ONBOARDING: Only check on INITIAL AUTH, not on every profile update
  // ============================================================================
  useEffect(() => {
    if (isAuthenticated && userProfile && !onboardingDismissed) {
      const completed = userProfile.has_completed_onboarding === true || 
                       userProfile.onboardingCompleted === true ||
                       userProfile.onboarding_completed === true;
      
      if (!completed && !showOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, userProfile?.id]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingDismissed(true);
    useAppStore.getState().setActiveTab('home');
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  if (!isAuthenticated) {
    return (
      <Auth
        onAuthSuccess={(isNewUser) => {
          if (isNewUser) {
            setShowOnboarding(true);
            setOnboardingDismissed(false);
          }
        }}
      />
    );
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      <TopNav />
      <main className="flex-1">
        {activeTab === 'menu' && <Menu/>}
        {activeTab === 'home' && <Home/>}
        {activeTab === 'profile' && <Profile/>}
        {activeTab === 'practice' && <PracticeLab/>}
        {activeTab === 'games' && <Minigames/>}
        {activeTab === 'friends' && <FriendsHub/>}
      </main>
    </div>
  );
}
