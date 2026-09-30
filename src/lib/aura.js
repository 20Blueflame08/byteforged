// src/lib/aura.js (Aura-1 AI Engine — X.AI Console Grok direct API + graceful voice handling)

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

// 🔧 Self-healing model chain: if Groq-style retirement happens here too,
// Aura-1 walks the list and caches whichever model answers.
const XAI_MODEL_CANDIDATES = [
  'grok-4-fast',
  'grok-4',
  'grok-3-mini',
  'grok-3',
];

let cachedModel = null;

/**
 * Calls the X.AI console API, walking the model chain on 404.
 */
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
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
        max_tokens: 400,
      }),
    });

    if (response.ok) {
      cachedModel = model;
      console.info(`Aura-1 engine online via model: ${model}`);
      return { ok: true, response };
    }

    lastStatus = response.status;
    if (response.status === 404) continue; // retired/unknown model → try next
    return { ok: false, status: response.status, response };
  }

  return { ok: false, status: lastStatus, response: null };
}

/**
 * Loads Puter.js lazily — used ONLY for speech-to-text fallback, never for chat.
 */
function loadPuterScript() {
  return new Promise((resolve, reject) => {
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
}

/**
 * Transcribes audio via Puter speech2txt (xAI provider).
 * Throws on failure so the caller can degrade gracefully.
 */
export async function transcribeAudio(audioFile) {
  const puter = await loadPuterScript();

  try {
    const transcript = await puter.ai.speech2txt({
      file: audioFile,
      provider: 'xai',
      language: 'en',
      format: true,
    });
    if (typeof transcript === 'string') return transcript;
    if (transcript?.text) return transcript.text;
  } catch (e) {
    console.warn('xAI speech2txt (object form) failed, trying positional form:', e);
  }

  const transcript = await puter.ai.speech2txt(audioFile, {
    provider: 'xai',
    language: 'en',
    format: true,
  });
  if (typeof transcript === 'string') return transcript;
  return transcript?.text || '';
}

/**
 * Sends text or audio to Aura-1 via X.AI Console Grok.
 * Your key, your quota (~1,440 req/month free tier) — no Puter involved in chat.
 */
export async function askAura1Bot(userPrompt, contextPrompt = "", botName = "Aura-1") {
  const apiKey = getXaiApiKey();

  if (!apiKey) {
    return `[${botName} Alert]: X.AI API key not configured. Add VITE_XAI_API_KEY to .env.local (dev) and to the GitHub Actions secret (deploy), then rebuild.`;
  }

  try {
    let finalInputText = userPrompt;

    // Voice input → transcribe; degrade gracefully if unavailable
    if (userPrompt instanceof Blob || userPrompt instanceof File) {
      try {
        finalInputText = await transcribeAudio(userPrompt);
      } catch (e) {
        console.warn('Voice transcription unavailable:', e);
        return `[${botName} Alert]: Voice transcription is unavailable right now. Please type your answer instead — text evaluation works perfectly.`;
      }
      if (!finalInputText || !finalInputText.trim()) {
        return `[${botName} Alert]: I couldn't understand that audio. Please re-record or type your answer.`;
      }
    }

    const systemInstruction = `You are ${botName}, an expert, witty, and direct CS & ICT AI evaluator for ByteForged Academy. Grade or answer the user's input accurately and concisely (under 100 words). Be encouraging but honest.`;

    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: `[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${finalInputText}` },
    ];

    const result = await callXai(messages, apiKey);

    if (!result.ok) {
      console.error('X.AI API Error:', result.status);
      if (result.status === 401) return `[${botName} Alert]: X.AI key rejected (401). Regenerate the key in console.x.ai and update the secret + .env.local.`;
      if (result.status === 429) return `[${botName} Alert]: Monthly quota reached (429). Your free X.AI tier resets next cycle — text me later or upgrade in console.x.ai.`;
      if (result.status === 404) return `[${botName} Alert]: No valid Grok model found (404). Update the model list in aura.js from console.x.ai/docs/models.`;
      return `[${botName} Alert]: Evaluation engine temporarily unavailable (code ${result.status}). Please try again in a moment.`;
    }

    const data = await result.response.json();
    const aiText = data?.choices?.[0]?.message?.content;

    if (aiText && typeof aiText === 'string') return aiText.trim();
    return `[${botName}]: Evaluation processed successfully.`;
  } catch (error) {
    console.error("Aura-1 X.AI Error:", error);
    // "Failed to fetch" usually means network or CORS blocking the browser call
    if (error?.message?.includes('fetch')) {
      return `[${botName} Alert]: Browser blocked the connection to api.x.ai (network/CORS). Tell Luna — we'll add a tiny proxy if X.AI restricts browser calls.`;
    }
    return `[${botName} Alert]: Connection to evaluation engine interrupted. Please check your internet and try again.`;
  }
}

// Backward-compatible export alias
export const askQwenBot = askAura1Bot;