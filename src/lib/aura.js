// src/lib/aura.js (Aura-1 AI Engine — Google Gemini, text-to-text only. Zero Puter. Zero verification.)

function getGeminiApiKey() {
  try {
    return import.meta?.env?.VITE_GEMINI_API_KEY || '';
  } catch {
    return '';
  }
}

// OpenAI-compatible endpoint (cleaner than the native Gemini one)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// Stable Gemini models — try fastest first, fall back to older ones
const GEMINI_MODEL_CANDIDATES = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
];

let cachedModel = null;

async function callGemini(messages, apiKey) {
  const ordered = cachedModel
    ? [cachedModel, ...GEMINI_MODEL_CANDIDATES.filter((m) => m !== cachedModel)]
    : [...GEMINI_MODEL_CANDIDATES];

  let lastStatus = null;
  let lastBody = '';

  for (const model of ordered) {
    const response = await fetch(GEMINI_API_URL, {
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
    lastBody = await response.text().catch(() => '');

    // 404 = model not available → try next
    if (response.status === 404) continue;
    return { ok: false, status: response.status, response: null, body: lastBody };
  }

  return { ok: false, status: lastStatus, response: null, body: lastBody };
}

// ============================================================================
// LIVE TRANSCRIPTION — Web Speech API (browser-native, free, zero services)
// Captures words WHILE user records. Team/role voice notes unaffected.
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

export async function transcribeAudio() {
  throw new Error('File transcription removed: use startLiveTranscript/consumeLiveTranscript during recording.');
}

/**
 * Sends text (or live-captured speech) to Aura-1 via Google Gemini.
 * Your key, your monthly quota. No Puter. No sign-in popups. No verification.
 */
export async function askAura1Bot(userPrompt, contextPrompt = "", botName = "Aura-1") {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return `[${botName} Alert]: Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env.local (dev) and GitHub secret (deploy), then rebuild.`;
  }

  if (userPrompt instanceof Blob || userPrompt instanceof File) {
    return `[${botName} Alert]: Voice answers are transcribed live while you record. No speech text captured — please type your answer or re-record in Chrome/Edge.`;
  }

  try {
    const systemInstruction = `You are ${botName}, an expert, witty, and direct CS & ICT AI evaluator for ByteForged Academy. Grade or answer the user's input accurately and concisely (under 100 words). Be encouraging but honest.`;

    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: `[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${userPrompt}` },
    ];

    const result = await Promise.race([
      callGemini(messages, apiKey),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini request timed out')), 60000)),
    ]);

    if (!result.ok) {
      console.error('Gemini API Error:', result.status, result.body);
      const snippet = (result.body || '').slice(0, 200);
      if (result.status === 400) {
        return `[${botName} Alert]: Gemini rejected request (400). Raw: ${snippet}`;
      }
      if (result.status === 401 || result.status === 403) {
        return `[${botName} Alert]: Gemini key rejected (${result.status}). Copy your active key from aistudio.google.com/apikey and update both .env.local and the GitHub secret.`;
      }
      if (result.status === 429) {
        return `[${botName} Alert]: Gemini rate limit reached (429). Wait a moment and try again — free tier: 15 requests/min, 1,500/day.`;
      }
      if (result.status === 404) {
        return `[${botName} Alert]: No valid Gemini model found (404). Update model list in aura.js.`;
      }
      return `[${botName} Alert]: Gemini unavailable (code ${result.status}). Raw: ${snippet}`;
    }

    const data = await result.response.json();
    const aiText = data?.choices?.[0]?.message?.content;

    if (aiText && typeof aiText === 'string') return aiText.trim();
    return `[${botName}]: Evaluation processed successfully.`;
  } catch (error) {
    console.error("Aura-1 Gemini Error:", error);
    if (error?.message?.includes('timed out')) {
      return `[${botName} Alert]: Gemini took too long. Please resend your message.`;
    }
    if (error?.message?.includes('fetch')) {
      return `[${botName} Alert]: Browser blocked connection to Gemini (network/CORS). Check your internet.`;
    }
    return `[${botName} Alert]: Connection to evaluation engine interrupted. Please check your internet.`;
  }
}

export const askQwenBot = askAura1Bot;