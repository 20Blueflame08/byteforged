// src/lib/aura.js (Aura-1 AI Engine — Google Gemini native API. Zero Puter. Zero verification.)

function getGeminiApiKey() {
  try {
    return import.meta?.env?.VITE_GEMINI_API_KEY || '';
  } catch {
    return '';
  }
}

// Native Gemini endpoint (most stable; works with new AQ.* keys)
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// 2026-stable candidates, fastest first
const GEMINI_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
];

let cachedModel = null;

/**
 * Auto-discover a working model from the key's live model list.
 * Prefers flash-lite → flash → pro → any gemini.
 */
async function discoverModel(apiKey) {
  try {
    const res = await fetch(`${GEMINI_BASE}?pageSize=100`, {
      headers: { 'x-goog-api-key': apiKey },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const names = (data.models || []).map((m) => (m.name || '').replace('models/', ''));
    return (
      names.find((n) => n.includes('flash-lite')) ||
      names.find((n) => n.includes('flash')) ||
      names.find((n) => n.startsWith('gemini')) ||
      names[0] ||
      null
    );
  } catch {
    return null;
  }
}

async function callGemini(systemInstruction, userText, apiKey) {
  // Build the ordered model list: cached → candidates → (discovered if needed)
  let ordered = cachedModel
    ? [cachedModel, ...GEMINI_MODEL_CANDIDATES.filter((m) => m !== cachedModel)]
    : [...GEMINI_MODEL_CANDIDATES];

  let lastStatus = null;
  let lastBody = '';
  let discovered = false;

  for (let attempt = 0; attempt < ordered.length + 1; attempt++) {
    // If we exhausted candidates with 404s, discover a live model once
    if (attempt >= ordered.length) {
      if (discovered) break;
      const found = await discoverModel(apiKey);
      if (!found) break;
      console.info('Aura-1 discovered live model:', found);
      ordered = [found];
      discovered = true;
    }

    const model = ordered[attempt];
    const response = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
      }),
    });

    if (response.ok) {
      cachedModel = model;
      console.info(`Aura-1 engine online via model: ${model}`);
      return { ok: true, response };
    }

    lastStatus = response.status;
    lastBody = await response.text().catch(() => '');

    // 404 = model retired → try next candidate (or discover)
    if (response.status === 404) continue;
    return { ok: false, status: response.status, response: null, body: lastBody };
  }

  return { ok: false, status: lastStatus, response: null, body: lastBody };
}

// ============================================================================
// LIVE TRANSCRIPTION — Web Speech API (browser-native, free, zero services)
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
    const userText = `[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${userPrompt}`;

    const result = await Promise.race([
      callGemini(systemInstruction, userText, apiKey),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini request timed out')), 60000)),
    ]);

    if (!result.ok) {
      console.error('Gemini API Error:', result.status, result.body);
      const snippet = (result.body || '').slice(0, 200);
      if (result.status === 400) return `[${botName} Alert]: Gemini rejected request (400). Raw: ${snippet}`;
      if (result.status === 401 || result.status === 403) return `[${botName} Alert]: Gemini key rejected (${result.status}). Re-copy your active key from aistudio.google.com/apikey and update .env.local + GitHub secret.`;
      if (result.status === 429) return `[${botName} Alert]: Gemini rate limit (429). Wait a moment — free tier: 15 req/min, 1,500/day.`;
      if (result.status === 404) return `[${botName} Alert]: No working Gemini model found even after auto-discovery (404). Raw: ${snippet}`;
      return `[${botName} Alert]: Gemini unavailable (code ${result.status}). Raw: ${snippet}`;
    }

    const data = await result.response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (aiText && typeof aiText === 'string') return aiText.trim();
    return `[${botName}]: Evaluation processed successfully.`;
  } catch (error) {
    console.error("Aura-1 Gemini Error:", error);
    if (error?.message?.includes('timed out')) return `[${botName} Alert]: Gemini took too long. Please resend.`;
    if (error?.message?.includes('fetch')) return `[${botName} Alert]: Browser blocked connection to Gemini (network/CORS).`;
    return `[${botName} Alert]: Connection to evaluation engine interrupted. Check your internet.`;
  }
}

export const askQwenBot = askAura1Bot;