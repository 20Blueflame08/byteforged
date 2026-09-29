// src/lib/aura.js (Aura-1 AI Engine — Puter Grok 4.7, user-pays, text + speech-to-text only)

let puterReadyPromise = null;

/**
 * Loads Puter.js CDN once and caches the promise.
 */
function loadPuterScript() {
  if (puterReadyPromise) return puterReadyPromise;

  puterReadyPromise = new Promise((resolve, reject) => {
    if (window.puter) { resolve(window.puter); return; }

    const existingScript = document.querySelector('script[src="https://js.puter.com/v2/"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.puter));
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Puter.js SDK')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.onload = () => resolve(window.puter);
    script.onerror = () => reject(new Error('Failed to load Puter.js SDK'));
    document.head.appendChild(script);
  });

  return puterReadyPromise;
}

// 🔧 FIX: Preload the SDK immediately on app start so the sign-in popup
// can open inside the browser's user-gesture window (no more blank popups).
if (typeof window !== 'undefined') {
  loadPuterScript().catch((e) => console.warn('Puter preload failed:', e));
}

/**
 * Checks whether the user is signed in to Puter.
 */
export async function isPuterSignedIn() {
  try {
    const puter = await loadPuterScript();
    return await puter.auth.isSignedIn();
  } catch (e) {
    console.warn('Puter auth check failed:', e);
    return false;
  }
}

/**
 * Opens the Puter sign-in popup explicitly and waits for completion.
 * @returns {Promise<boolean>} true if signed in after the flow
 */
export async function ensurePuterSignIn() {
  try {
    const puter = await loadPuterScript();
    if (await puter.auth.isSignedIn()) return true;
    await puter.auth.signIn();
    return await puter.auth.isSignedIn();
  } catch (e) {
    console.warn('Puter sign-in failed or was cancelled:', e);
    return false;
  }
}

/**
 * Races a promise against a timeout so the UI never hangs forever.
 */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Transcribes audio files (voice notes / mic recordings) using Puter AI
 * @param {Blob|File} audioFile - Audio blob or file
 * @returns {Promise<string>} Transcribed text string
 */
export async function transcribeAudio(audioFile) {
  const puter = await loadPuterScript();
  const transcript = await withTimeout(
    puter.ai.speech2txt(audioFile, { model: "gpt-4o-mini-transcribe" }),
    60000,
    'Speech-to-text'
  );
  return transcript?.text || transcript || "";
}

/**
 * Sends text prompts or audio inputs to Aura-1 via Puter Grok 4.7.
 * Users pay for their own AI usage through their Puter account.
 * @param {string|File|Blob} userPrompt - Text, or audio File/Blob (auto-transcribed)
 * @param {string} contextPrompt - Current note/quiz card context
 * @param {string} botName - Custom bot handle
 * @returns {Promise<string>} AI evaluation response
 */
export async function askAura1Bot(userPrompt, contextPrompt = "", botName = "Aura-1") {
  try {
    const puter = await loadPuterScript();

    // 🔧 AUTH GATE: sign in FIRST with a clear flow, never hang mid-chat
    if (!(await puter.auth.isSignedIn())) {
      const signedIn = await ensurePuterSignIn();
      if (!signedIn) {
        return `[${botName} Alert]: Puter sign-in not completed. A sign-in window was opened — finish it and resend your message. If the window appears blank: allow popups for this site and turn OFF Brave Shields (lion icon) for both this site and puter.com, then retry.`;
      }
    }

    let finalInputText = userPrompt;

    // Handle audio input (voice notes) — transcribe first
    if (userPrompt instanceof Blob || userPrompt instanceof File) {
      finalInputText = await transcribeAudio(userPrompt);
      if (!finalInputText || !finalInputText.trim()) {
        return `[${botName} Alert]: I couldn't understand that audio. Please re-record or type your answer.`;
      }
    }

    const systemInstruction = `You are ${botName}, an expert, witty, and direct CS & ICT AI evaluator for ByteForged Academy. Grade or answer the user's input accurately and concisely (under 100 words). Be encouraging but honest.`;
    const fullPrompt = `${systemInstruction}\n\n[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${finalInputText}`;

    // Query Grok 4.7 with a 90s safety timeout (no more infinite "analyzing...")
    const response = await withTimeout(
      puter.ai.chat(fullPrompt, { model: "x-ai/grok-4.7", temperature: 0.6 }),
      90000,
      'Aura-1 evaluation'
    );

    if (typeof response === 'string') return response;
    if (response?.message?.content) return response.message.content;
    if (response?.text) return response.text;

    return `[${botName}]: Evaluation processed successfully.`;
  } catch (error) {
    console.error("Aura-1 API Error:", error);
    const msg = error?.message || '';
    if (msg.includes('timed out')) {
      return `[${botName} Alert]: The evaluation engine took too long to respond. Please resend your message.`;
    }
    return `[${botName} Alert]: Aura-1 engine connection error. Please try again.`;
  }
}

// Backward-compatible export alias
export const askQwenBot = askAura1Bot;