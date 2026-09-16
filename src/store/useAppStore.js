import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient'; // <-- ADDED

// Pre-generated Single-Use Dev Codes for PRO Access
const VALID_DEV_CODES = ['BYTE-PRO-8921-X', 'BYTE-PRO-4410-Z'];

// Helper to derive medal and title rank based on unified progress percentage
const getMedalAndTitle = (progress) => {
  if (progress >= 100) return { medal: 'gold', title: 'Byte Master' };
  if (progress >= 75) return { medal: 'gold', title: 'Gold Specialist' };
  if (progress >= 50) return { medal: 'silver', title: 'Passed' };
  if (progress >= 25) return { medal: 'bronze', title: 'Bronze Explorer' };
  if (progress > 0) return { medal: null, title: 'In Progress' };
  return { medal: null, title: 'Unattempted' };
};

// Helper to safely load persisted chat from storage
const loadInitialChat = () => {
  try {
    const saved = localStorage.getItem('byteforged_team_chat_v1');
    return saved ? JSON.parse(saved) : [
      { id: 'sys-1', sender: 'System AI', text: 'Secure team frequency established. All channels synchronized.', timestamp: new Date().toLocaleTimeString(), type: 'system' }
    ];
  } catch {
    return [];
  }
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ==========================================
      // NAVIGATION & TAB STATE
      // ==========================================
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ==========================================
      // AUTHENTICATION & PROFILE STATE
      // ==========================================
      isAuthenticated: false,
      user: null,
      isPro: false, // Universal PRO Clearance flag
      usedDevCodes: [], // Tracks redeemed single-use Dev Codes
      blacklistedEmails: [], // Stores emails marked for blacklisting upon deletion

      userProfile: {
        username: 'User',
        avatar: '⚔️',
        avatarBg: 'from-cyan-500 to-blue-600',
        title: 'Cyber Initiate',
        bio: '.',
        onboarding: true,
        onboardingCompleted: false,
        has_completed_onboarding: false,
        isPro: false,
        starred_friends: [], // Integrated for bulletproof star/favorite tracking
      },

      loginUser: async (userData) => { // <-- CHANGED TO ASYNC
        set({
          user: userData,
          isAuthenticated: true,
        });
        get().startSessionTimer();
        
        // Set user as online in Supabase
        if (userData?.id) {
          await supabase.from('profiles').update({ is_online: true }).eq('id', userData.id);
        }
      },

      logoutUser: async () => { // <-- CHANGED TO ASYNC
        const { user } = get();
        
        // Set user as offline in Supabase before logging out
        if (user?.id) {
          await supabase.from('profiles').update({ is_online: false }).eq('id', user.id);
        }
        
        get().pauseSessionTimer();
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      updateProfile: (profileData) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...profileData },
        })),

      // Alias method matching FriendsHubPage component requirements
      updateUserProfile: (profileData) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...profileData },
        })),

      blacklistEmail: (email) => {
        if (!email) return;
        const normalized = email.trim().toLowerCase();
        set((state) => ({
          blacklistedEmails: Array.from(new Set([...(state.blacklistedEmails || []), normalized])),
        }));
      },

      removeBlacklistedEmail: (email) => {
        if (!email) return;
        const normalized = email.trim().toLowerCase();
        set((state) => ({
          blacklistedEmails: (state.blacklistedEmails || []).filter((e) => e !== normalized),
        }));
      },

      isEmailBlacklisted: (email) => {
        if (!email) return false;
        return (get().blacklistedEmails || []).includes(email.trim().toLowerCase());
      },

      // ==========================================
      // PRO MODE & DEV CODE REDEMPTION SYSTEM
      // ==========================================
      redeemDevCode: (code) => {
        if (!code) {
          return { success: false, error: 'Please enter a valid Dev Code.' };
        }

        const normalizedCode = code.trim().toUpperCase();
        const { usedDevCodes } = get();

        if (usedDevCodes.includes(normalizedCode)) {
          return { success: false, error: 'This Dev Code has already been redeemed and expired.' };
        }

        if (!VALID_DEV_CODES.includes(normalizedCode)) {
          return { success: false, error: 'Invalid Dev Code. Check format and try again.' };
        }

        set((state) => ({
          isPro: true,
          usedDevCodes: [...state.usedDevCodes, normalizedCode],
          userProfile: {
            ...state.userProfile,
            isPro: true,
          },
        }));

        return {
          success: true,
          message: '⚡ PRO CLEARANCE GRANTED! Universal unlimited privileges unlocked.',
        };
      },

      // ==========================================
      // ACTIVE SESSION WORK TIME TRACKER (COUNT-UP)
      // ==========================================
      activeSessionSeconds: 0,
      isTimerRunning: false,
      lastActiveTimestamp: null,

      getActiveSessionSeconds: () => get().activeSessionSeconds,

      startSessionTimer: () => {
        const { isTimerRunning } = get();
        if (isTimerRunning) return;

        set({
          isTimerRunning: true,
          lastActiveTimestamp: Date.now(),
        });
      },

      pauseSessionTimer: () => {
        const { isTimerRunning, lastActiveTimestamp, activeSessionSeconds } = get();
        if (!isTimerRunning || !lastActiveTimestamp) return;

        const now = Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((now - lastActiveTimestamp) / 1000));

        set({
          activeSessionSeconds: activeSessionSeconds + elapsedSeconds,
          isTimerRunning: false,
          lastActiveTimestamp: null,
        });
      },

      tickSessionTimer: () => {
        const { isTimerRunning, lastActiveTimestamp, activeSessionSeconds } = get();
        if (!isTimerRunning || !lastActiveTimestamp) return;

        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastActiveTimestamp) / 1000);

        if (elapsedSeconds >= 1) {
          set({
            activeSessionSeconds: activeSessionSeconds + elapsedSeconds,
            lastActiveTimestamp: now,
          });
        }
      },

      resetSessionTimer: () =>
        set({
          activeSessionSeconds: 0,
          lastActiveTimestamp: Date.now(),
        }),

      getRemainingSeconds: () => get().activeSessionSeconds,
      tickActiveTimer: () => get().tickSessionTimer(),

      // ==========================================
      // COURSE & TOPIC SELECTION STATE
      // ==========================================
      selectedCourseId: 'ict-fund',
      setSelectedCourse: (id) => set({ selectedCourseId: id }),
      setSelectedCourseId: (id) => set({ selectedCourseId: id }),

      selectedTopicId: 'ict-101',
      activeTopicId: 'ict-101',
      setSelectedTopic: (id) => set({ selectedTopicId: id, activeTopicId: id }),
      setSelectedTopicId: (id) => set({ selectedTopicId: id, activeTopicId: id }),

      setUnlockedFirstTopic: (topicId) =>
        set((state) => ({
          selectedTopicId: topicId,
          activeTopicId: topicId,
          topicProgress: {
            ...state.topicProgress,
            [topicId]: {
              progress: 0,
              actualProgress: 0,
              unlocked: true,
              medal: null,
              title: 'Unlocked',
              quizScore: 0,
              labExecutions: 0,
              gameScore: 0,
              networkUnlocked: false,
              missionCompleted: false,
              isPassed: false,
              isCompleted: false,
            },
          },
        })),

      // ==========================================
      // BOT & SQUAD SETTINGS
      // ==========================================
      botName: 'Aura-1',
      setBotName: (name) => set({ botName: name }),

      isTeamMode: false,
      setIsTeamMode: (mode) => set({ isTeamMode: mode }),

      teamName: 'Alpha Squad',
      setTeamName: (name) => set({ teamName: name }),

      // ==========================================
      // PAGE STATE PERSISTENCE
      // ==========================================
      savedPageStates: {
        home: {},
        menu: {},
        practice:{},
        games: {},
        friends: {},
        profile: {},
      },

      savePageState: (pageKey, stateData) =>
        set((state) => ({
          savedPageStates: {
            ...state.savedPageStates,
            [pageKey]: {
              ...(state.savedPageStates[pageKey] || {}),
              ...stateData,
            },
          },
        })),

      // ==========================================
      // CHAT STATE SLICE (PERSISTED)
      // ==========================================
      STORAGE_KEY_CHAT: 'byteforged_team_chat_v1',
      chatLog: loadInitialChat(),

      addChatMessage: (message) => set((state) => {
        const newMsg = {
          id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          sender: message.sender || 'Operative',
          avatar: message.avatar || '⚔️',
          text: message.text || '',
          audioUrl: message.audioUrl || null,
          timestamp: message.timestamp || new Date().toLocaleTimeString(),
          type: message.type || 'text'
        };
        const updatedLog = [...state.chatLog, newMsg];
        try {
          localStorage.setItem('byteforged_team_chat_v1', JSON.stringify(updatedLog));
        } catch (err) {
          console.warn('Failed to persist chat log to localStorage:', err);
        }
        return { chatLog: updatedLog };
      }),

      clearChatLog: () => {
        try {
          localStorage.removeItem('byteforged_team_chat_v1');
        } catch (err) {
          console.warn('Failed to clear chat storage:', err);
        }
        set({ chatLog: [] });
      },

      deleteChatMessage: (msgId) => set((state) => {
        const updatedLog = state.chatLog.filter(msg => msg.id !== msgId);
        try {
          localStorage.setItem('byteforged_team_chat_v1', JSON.stringify(updatedLog));
        } catch (err) {
          console.warn('Failed to persist chat log deletion:', err);
        }
        return { chatLog: updatedLog };
      }),

      // --- NEW ROLE CHAT STORE SLICE ---
      teamChatLog: [],

      addTeamChatMessage: (message) => set((state) => {
        const newMsg = {
          id: message.id || `team-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          sender: message.sender || 'Operative',
          avatar: message.avatar || '⚔️',
          text: message.text || '',
          audioUrl: message.audioUrl || null,
          duration: message.duration || null,
          timestamp: message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: message.type || 'text',
          teamRole: message.teamRole || 'BlueTeam'
        };
        return { teamChatLog: [...state.teamChatLog, newMsg] };
      }),

      clearTeamChatLog: () => set({ teamChatLog: [] }),

      deleteTeamChatMessage: (id) => set((state) => ({
        teamChatLog: state.teamChatLog.filter(msg => msg.id !== id)
      })),
      // -----------------------------------

      // ==========================================
      // TOPIC PROGRESS & MISSION SYSTEM
      // ==========================================
      topicProgress: {
        'ict-101': {
          progress: 0,
          actualProgress: 0,
          unlocked: true,
          medal: null,
          title: 'Unattempted',
          quizScore: 0,
          labExecutions: 0,
          gameScore: 0,
          networkUnlocked: false,
          missionCompleted: false,
          isPassed: false,
          isCompleted: false,
        },
      },

      updateTopicProgress: (topicId, rawProgress, customMedal = null, customTitle = '', unlocked = true) =>
        set((state) => {
          const currentTopic = state.topicProgress[topicId] || {};
          const quizScore = currentTopic.quizScore || 0;
          const actualProgress = typeof rawProgress === 'number' ? rawProgress : (currentTopic.actualProgress || 0);

          const unifiedProgress = Math.min(100, Math.max(0, Math.round((quizScore + actualProgress) / 2)));
          const dynamicRank = getMedalAndTitle(unifiedProgress);

          const isPassed = unifiedProgress >= 50;
          const isCompleted = unifiedProgress >= 100;

          return {
            topicProgress: {
              ...state.topicProgress,
              [topicId]: {
                ...currentTopic,
                actualProgress,
                progress: unifiedProgress,
                unlocked,
                medal: customMedal || dynamicRank.medal,
                title: customTitle || dynamicRank.title,
                isPassed,
                isCompleted,
                missionCompleted: isCompleted || currentTopic.missionCompleted || false,
              },
            },
          };
        }),

      updateTopicQuizScore: (topicId, score) =>
        set((state) => {
          const currentTopic = state.topicProgress[topicId] || {};
          const actualProgress = currentTopic.actualProgress !== undefined ? currentTopic.actualProgress : (currentTopic.progress || 0);

          const unifiedProgress = Math.min(100, Math.max(0, Math.round((score + actualProgress) / 2)));
          const dynamicRank = getMedalAndTitle(unifiedProgress);

          const isPassed = unifiedProgress >= 50;
          const isCompleted = unifiedProgress >= 100;

          return {
            topicProgress: {
              ...state.topicProgress,
              [topicId]: {
                ...currentTopic,
                quizScore: score,
                actualProgress,
                progress: unifiedProgress,
                medal: dynamicRank.medal,
                title: dynamicRank.title,
                isPassed,
                isCompleted,
                missionCompleted: isCompleted || currentTopic.missionCompleted || false,
              },
            },
          };
        }),

      updateTopicMissionData: (topicId, missionData = {}) =>
        set((state) => {
          const currentTopic = state.topicProgress[topicId] || {};
          const gameScore = Math.max(currentTopic.gameScore || 0, missionData.gameScore || 0);
          const missionCompleted = missionData.missionCompleted ?? currentTopic.missionCompleted ?? false;

          return {
            topicProgress: {
              ...state.topicProgress,
              [topicId]: {
                ...currentTopic,
                gameScore,
                missionCompleted,
              },
            },
          };
        }),
    }),
    {
      name: 'byteforged-app-storage',
      partialize: (state) => ({
        ...state,
        isTimerRunning: false,
        lastActiveTimestamp: null,
      }),
    }
  )
);