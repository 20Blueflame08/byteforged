// src/lib/aura.js (Aura-1 AI Engine — Puter Grok 4.7 + browser-native live transcript)

let puterReadyPromise = null;

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

if (typeof window !== 'undefined') {
  loadPuterScript().catch((e) => console.warn('Puter preload failed:', e));
}

export async function isPuterSignedIn() {
  try {
    const puter = await loadPuterScript();
    return await puter.auth.isSignedIn();
  } catch (e) {
    return false;
  }
}

export async function ensurePuterSignIn() {
  try {
    const puter = await loadPuterScript();
    if (await puter.auth.isSignedIn()) return true;
    await puter.auth.signIn();
    return await puter.auth.isSignedIn();
  } catch (e) {
    return false;
  }
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Transcribes audio via Puter speech2txt (xAI provider, verification-free path)
 */
export async function transcribeAudio(audioFile) {
  const puter = await loadPuterScript();

  try {
    const transcript = await withTimeout(
      puter.ai.speech2txt({ file: audioFile, provider: 'xai', language: 'en', format: true }),
      60000,
      'Speech-to-text'
    );
    if (typeof transcript === 'string') return transcript;
    if (transcript?.text) return transcript.text;
  } catch (e) {
    console.warn('xAI speech2txt (object form) failed:', e);
  }

  const transcript = await withTimeout(
    puter.ai.speech2txt(audioFile, { provider: 'xai', language: 'en', format: true }),
    60000,
    'Speech-to-text'
  );
  if (typeof transcript === 'string') return transcript;
  return transcript?.text || '';
}

// ============================================================================
// LIVE TRANSCRIPTION — Web Speech API (browser-native, free, no Puter needed)
// Home.jsx uses these to show live preview during recording
// ============================================================================
let recognitionInstance = null;
let liveTranscriptBuffer = '';

export function isLiveTranscriptionSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startLiveTranscript(onUpdate) {
  stopLiveTranscript();
  liveTranscriptBuffer = '';
  const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  if (!SR) return false;

  try {
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      let chunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) chunk += e.results[i][0].transcript + ' ';
      }
      if (chunk) {
        liveTranscriptBuffer += chunk;
        if (onUpdate) onUpdate(liveTranscriptBuffer.trim());
      }
    };
    rec.onerror = (e) => console.warn('Live transcription error:', e?.error);
    rec.start();
    recognitionInstance = rec;
    return true;
  } catch (e) {
    console.warn('Could not start live transcription:', e);
    return false;
  }
}

export function stopLiveTranscript() {
  if (recognitionInstance) {
    try { recognitionInstance.stop(); } catch (e) {}
    recognitionInstance = null;
  }
  return liveTranscriptBuffer.trim();
}

export function consumeLiveTranscript() {
  const t = liveTranscriptBuffer.trim();
  liveTranscriptBuffer = '';
  return t;
}

/**
 * Sends text or audio to Aura-1 via Puter Grok 4.7
 */
export async function askAura1Bot(userPrompt, contextPrompt = "", botName = "Aura-1") {
  try {
    const puter = await loadPuterScript();

    if (!(await puter.auth.isSignedIn())) {
      const signedIn = await ensurePuterSignIn();
      if (!signedIn) {
        return `[${botName} Alert]: Puter sign-in not completed. Please finish the sign-in window and resend.`;
      }
    }

    let finalInputText = userPrompt;

    // If audio blob, try live transcript first, fall back to Puter transcription
    if (userPrompt instanceof Blob || userPrompt instanceof File) {
      const liveText = consumeLiveTranscript();
      if (liveText) {
        finalInputText = liveText;
      } else {
        try {
          finalInputText = await transcribeAudio(userPrompt);
        } catch (e) {
          return `[${botName} Alert]: Voice transcription unavailable. Please type your answer instead.`;
        }
      }
      if (!finalInputText || !finalInputText.trim()) {
        return `[${botName} Alert]: I couldn't understand that audio. Please re-record or type your answer.`;
      }
    }

    const systemInstruction = `You are ${botName}, an expert, witty, and direct CS & ICT AI evaluator for ByteForged Academy. Grade or answer the user's input accurately and concisely (under 100 words). Be encouraging but honest.`;
    const fullPrompt = `${systemInstruction}\n\n[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${finalInputText}`;

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
    return `[${botName} Alert]: Aura-1 engine connection error. Please try again.`;
  }
}

export const askQwenBot = askAura1Bot;