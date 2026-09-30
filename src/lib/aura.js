// src/lib/aura.js (Aura-1 — Google Gemini native API, self-healing + self-diagnosing)

function getGeminiApiKey() {
  try { return import.meta?.env?.VITE_GEMINI_API_KEY || ''; } catch { return ''; }
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const GEMINI_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
];

let cachedModel = null;

/** Fetch the live list of model names this key can use. */
async function fetchModelList(apiKey) {
  try {
    const res = await fetch(`${GEMINI_BASE}?key=${encodeURIComponent(apiKey)}&pageSize=200`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m) => (m.name || '').replace('models/', ''));
  } catch { return []; }
}

function pickBest(names) {
  return (
    names.find((n) => n.includes('flash-lite')) ||
    names.find((n) => n.includes('flash')) ||
    names.find((n) => n.startsWith('gemini')) ||
    names[0] || null
  );
}

async function generate(model, systemInstruction, userText, apiKey) {
  return fetch(`${GEMINI_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
    }),
  });
}

async function callGemini(systemInstruction, userText, apiKey) {
  let ordered = cachedModel
    ? [cachedModel, ...GEMINI_MODEL_CANDIDATES.filter((m) => m !== cachedModel)]
    : [...GEMINI_MODEL_CANDIDATES];

  let lastStatus = null;
  let lastBody = '';

  for (const model of ordered) {
    const response = await generate(model, systemInstruction, userText, apiKey);
    if (response.ok) {
      cachedModel = model;
      console.info(`Aura-1 engine online via model: ${model}`);
      return { ok: true, response };
    }
    lastStatus = response.status;
    lastBody = await response.text().catch(() => '');
    if (response.status === 404) continue; // retired model → next
    return { ok: false, status: response.status, body: lastBody, models: [] };
  }

  // All candidates 404'd → discover what's actually live and try once more
  const names = await fetchModelList(apiKey);
  console.info('Aura-1 live model list:', names);
  const found = pickBest(names);
  if (found) {
    const response = await generate(found, systemInstruction, userText, apiKey);
    if (response.ok) {
      cachedModel = found;
      console.info(`Aura-1 engine online via discovered model: ${found}`);
      return { ok: true, response };
    }
    lastStatus = response.status;
    lastBody = await response.text().catch(() => '');
  }

  // Fail with the live list attached so we can see exactly what exists
  return { ok: false, status: lastStatus, body: lastBody, models: names };
}

// ============ LIVE TRANSCRIPTION (browser-native, free) ============
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
    rec.continuous = true; rec.interimResults = false; rec.lang = 'en-US';
    rec.onresult = (e) => {
      let chunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) chunk += e.results[i][0].transcript + ' ';
      if (chunk) { liveTranscriptBuffer += chunk; if (onUpdate) onUpdate(liveTranscriptBuffer.trim()); }
    };
    rec.onerror = (e) => console.warn('Live transcription error:', e?.error);
    rec.start(); recognitionInstance = rec; return true;
  } catch { return false; }
}
export function stopLiveTranscript() {
  if (recognitionInstance) { try { recognitionInstance.stop(); } catch {} recognitionInstance = null; }
  return liveTranscriptBuffer.trim();
}
export function consumeLiveTranscript() {
  const t = liveTranscriptBuffer.trim(); liveTranscriptBuffer = ''; return t;
}
export async function transcribeAudio() {
  throw new Error('Use live transcription helpers instead.');
}

// ============ MAIN ENTRY ============
export async function askAura1Bot(userPrompt, contextPrompt = "", botName = "Aura-1") {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return `[${botName} Alert]: Gemini key missing. Set VITE_GEMINI_API_KEY in .env.local + GitHub secret, rebuild.`;
  if (userPrompt instanceof Blob || userPrompt instanceof File) {
    return `[${botName} Alert]: Voice is transcribed live while recording. No text captured — please type your answer.`;
  }

  try {
    const systemInstruction = `You are ${botName}, an expert, witty, and direct CS & ICT AI evaluator for ByteForged Academy. Grade or answer the user's input accurately and concisely (under 100 words). Be encouraging but honest.`;
    const userText = `[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${userPrompt}`;

    const result = await Promise.race([
      callGemini(systemInstruction, userText, apiKey),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 60000)),
    ]);

    if (!result.ok) {
      console.error('Gemini error:', result.status, result.body, 'live models:', result.models);
      const snippet = (result.body || '').slice(0, 150);
      if (result.status === 401 || result.status === 403)
        return `[${botName} Alert]: Key rejected (${result.status}). Re-copy active key from aistudio.google.com/apikey → update .env.local + GitHub secret → rebuild.`;
      if (result.status === 429)
        return `[${botName} Alert]: Rate limit (429). Wait a moment — free tier 15 req/min.`;
      if (result.status === 404) {
        const list = (result.models || []).slice(0, 8).join(', ') || 'none returned';
        return `[${botName} Alert]: 404. Google's live models for this key: [${list}]. Paste this list to Luna.`;
      }
      return `[${botName} Alert]: Gemini error ${result.status}. Raw: ${snippet}`;
    }

    const data = await result.response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (aiText && typeof aiText === 'string') return aiText.trim();
    return `[${botName}]: Evaluation processed successfully.`;
  } catch (error) {
    console.error('Aura-1 error:', error);
    if (error?.message?.includes('timeout')) return `[${botName} Alert]: Gemini timed out. Resend.`;
    return `[${botName} Alert]: Connection interrupted. Check internet.`;
  }
}

export const askQwenBot = askAura1Bot;