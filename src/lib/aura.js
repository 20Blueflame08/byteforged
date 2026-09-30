// src/lib/aura.js (Aura-1 AI Engine — X.AI Console Grok ONLY. No Puter anywhere.)

/**
 * Safe getter for the X.AI API key — never crashes at module load.
 */
function getXaiApiKey() {
  try {
    return import.meta?.env?.VITE_XAI_API_KEY || '';
  } catch {
    return '';
  }
}

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

// Self-healing model chain: retired models are skipped automatically.
const XAI_MODEL_CANDIDATES = [
  'grok-4-fast',
  'grok-4',
  'grok-3-mini',
  'grok-3',
];

let cachedModel = null;

async function callXai(messages, apiKey) {
  const ordered = cachedModel
    ? [cachedModel, ...XAI_MODEL_CANDIDATES.filter((m) => m !== cachedModel)]
    : [...XAI_MODEL_CANDIDATES];

  let lastStatus = null;

  for (const model of ordered) {
    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: 400 }),
    });

    if (response.ok) {
      cachedModel = model;
      console.info(`Aura-1 engine online via model: ${model}`);
      return { ok: true, response };
    }

    lastStatus = response.status;
    if (response.status === 404) continue;
    return { ok: false, status: response.status, response };
  }

  return { ok: false, status: lastStatus, response: null };
}

// ============================================================================
// LIVE TRANSCRIPTION — Web Speech API (free, browser-native, no Puter, no keys)
// Captures words WHILE the user records. Team/role voice notes still send
// audio blobs to Supabase as before — only Aura-1 evaluation uses the text.
// ============================================================================
let recognitionInstance = null;
let liveTranscriptBuffer = '';

export function isLiveTranscriptionSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Starts live speech capture. Call when recording starts.
 * @param {(text: string) => void} onUpdate - optional live preview callback
 */
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

/**
 * Stops live capture. Keeps the buffer until consumed.
 */
export function stopLiveTranscript() {
  if (recognitionInstance) {
    try { recognitionInstance.stop(); } catch (e) {}
    recognitionInstance = null;
  }
  return liveTranscriptBuffer.trim();
}

/**
 * Returns captured text and clears the buffer.
 */
export function consumeLiveTranscript() {
  const t = liveTranscriptBuffer.trim();
  liveTranscriptBuffer = '';
  return t;
}

/**
 * Legacy export kept so older imports don't break the build.
 * File-blob transcription is gone — voice is captured live during recording.
 */
export async function transcribeAudio() {
  throw new Error('File transcription removed: use startLiveTranscript/consumeLiveTranscript during recording.');
}

/**
 * Sends text to Aura-1 via X.AI Console Grok.
 * @param {string|Blob|File} userPrompt - text expected; blobs get a graceful guide message
 * @param {string} contextPrompt - current note/quiz context
 * @param {string} botName - custom bot handle
 */
export async function askAura1Bot(userPrompt, contextPrompt = "", botName = "Aura-1") {
  const apiKey = getXaiApiKey();

  if (!apiKey) {
    return `[${botName} Alert]: X.AI API key not configured. Add VITE_XAI_API_KEY to .env.local (dev) and the GitHub Actions secret (deploy), then rebuild.`;
  }

  if (userPrompt instanceof Blob || userPrompt instanceof File) {
    return `[${botName} Alert]: Voice answers are now transcribed live while you record. No speech text was captured for this note — please type your answer or re-record in Chrome/Edge.`;
  }

  try {
    const systemInstruction = `You are ${botName}, an expert, witty, and direct CS & ICT AI evaluator for ByteForged Academy. Grade or answer the user's input accurately and concisely (under 100 words). Be encouraging but honest.`;

    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: `[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${userPrompt}` },
    ];

    const result = await Promise.race([
      callXai(messages, apiKey),
      new Promise((_, reject) => setTimeout(() => reject(new Error('X.AI request timed out')), 90000)),
    ]);

    if (!result.ok) {
      console.error('X.AI API Error:', result.status);
      if (result.status === 401) return `[${botName} Alert]: X.AI key rejected (401). Regenerate the key in console.x.ai and update the secret + .env.local.`;
      if (result.status === 429) return `[${botName} Alert]: Monthly quota reached (429). Your free X.AI allocation resets next cycle.`;
      if (result.status === 404) return `[${botName} Alert]: No valid Grok model found (404). Update the model list in aura.js from console.x.ai/docs/models.`;
      return `[${botName} Alert]: Evaluation engine temporarily unavailable (code ${result.status}). Please try again in a moment.`;
    }

    const data = await result.response.json();
    const aiText = data?.choices?.[0]?.message?.content;

    if (aiText && typeof aiText === 'string') return aiText.trim();
    return `[${botName}]: Evaluation processed successfully.`;
  } catch (error) {
    console.error("Aura-1 X.AI Error:", error);
    if (error?.message?.includes('timed out')) {
      return `[${botName} Alert]: The evaluation engine took too long to respond. Please resend your message.`;
    }
    if (error?.message?.includes('fetch')) {
      return `[${botName} Alert]: Browser blocked the connection to api.x.ai (network/CORS). Tell Luna — we'll add a tiny proxy if needed.`;
    }
    return `[${botName} Alert]: Connection to evaluation engine interrupted. Please check your internet and try again.`;
  }
}

// Backward-compatible export alias
export const askQwenBot = askAura1Bot;