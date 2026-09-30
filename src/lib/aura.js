// src/lib/aura.js (Aura-1 AI Engine — Groq chat + Web Speech API, self-healing model chain)

/**
 * Safe getter for the Groq API key — never crashes at module load.
 */
function getGroqApiKey() {
  try {
    return import.meta?.env?.VITE_GROQ_API_KEY || '';
  } catch {
    return '';
  }
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// 🔧 Model fallback chain: Aura-1 tries these in order and caches the winner.
// If Groq retires a model, the next candidate takes over automatically.
const GROQ_MODEL_CANDIDATES = [
  'openai/gpt-oss-20b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

let cachedModel = null;

/**
 * Calls Groq, walking the model chain on 404 (model retired).
 * @returns {Promise<{ok: boolean, status?: number, response?: Response}>}
 */
async function callGroq(messages, apiKey) {
  const ordered = cachedModel
    ? [cachedModel, ...GROQ_MODEL_CANDIDATES.filter((m) => m !== cachedModel)]
    : [...GROQ_MODEL_CANDIDATES];

  let lastStatus = null;

  for (const model of ordered) {
    const response = await fetch(GROQ_API_URL, {
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
      cachedModel = model; // remember the winner for next time
      console.info(`Aura-1 engine online via model: ${model}`);
      return { ok: true, response };
    }

    lastStatus = response.status;

    // 404 = model doesn't exist → try the next candidate
    if (response.status === 404) continue;

    // Any other failure (401 bad key, 429 rate limit, 5xx outage) → stop here
    return { ok: false, status: response.status, response };
  }

  return { ok: false, status: lastStatus, response: null };
}

/**
 * Transcribes audio using the browser's built-in Web Speech API.
 * No API keys, no verification, works offline.
 */
export async function transcribeAudio(audioFile) {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Speech recognition not supported in this browser'));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    const audioUrl = URL.createObjectURL(audioFile);
    const audio = new Audio(audioUrl);
    let transcript = '';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
    };

    recognition.onend = () => {
      URL.revokeObjectURL(audioUrl);
      if (transcript.trim()) resolve(transcript.trim());
      else reject(new Error('No speech detected in audio'));
    };

    recognition.onerror = (event) => {
      URL.revokeObjectURL(audioUrl);
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    try {
      recognition.start();
      audio.play().catch(() => {});
      setTimeout(() => {
        recognition.stop();
        if (!transcript.trim()) reject(new Error('Speech recognition timed out'));
      }, 30000);
    } catch (error) {
      URL.revokeObjectURL(audioUrl);
      reject(error);
    }
  });
}

/**
 * Sends text or audio to Aura-1 via Groq API.
 */
export async function askAura1Bot(userPrompt, contextPrompt = "", botName = "Aura-1") {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    return `[${botName} Alert]: API key not configured. Please wait for the next deployment build to complete, then refresh the page.`;
  }

  try {
    let finalInputText = userPrompt;

    if (userPrompt instanceof Blob || userPrompt instanceof File) {
      finalInputText = await transcribeAudio(userPrompt);
      if (!finalInputText || !finalInputText.trim()) {
        return `[${botName} Alert]: I couldn't understand that audio. Please re-record or type your answer.`;
      }
    }

    const systemInstruction = `You are ${botName}, an expert, witty, and direct CS & ICT AI evaluator for ByteForged Academy. Grade or answer the user's input accurately and concisely (under 100 words). Be encouraging but honest.`;

    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: `[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${finalInputText}` },
    ];

    const result = await callGroq(messages, apiKey);

    if (!result.ok) {
      console.error('Groq API Error:', result.status);
      if (result.status === 401) {
        return `[${botName} Alert]: API key rejected (401). The key may be invalid or revoked — regenerate it in the Groq console and update the GitHub secret.`;
      }
      if (result.status === 429) {
        return `[${botName} Alert]: Rate limit reached (429). Give it a minute and resend — the free tier refreshes quickly.`;
      }
      if (result.status === 404) {
        return `[${botName} Alert]: No available AI model found (404). All candidate models are retired — update the model list in aura.js.`;
      }
      return `[${botName} Alert]: Evaluation engine temporarily unavailable (code ${result.status}). Please try again in a moment.`;
    }

    const data = await result.response.json();
    const aiText = data?.choices?.[0]?.message?.content;

    if (aiText && typeof aiText === 'string') return aiText.trim();
    return `[${botName}]: Evaluation processed successfully.`;
  } catch (error) {
    console.error("Aura-1 Groq Error:", error);
    return `[${botName} Alert]: Connection to evaluation engine interrupted. Please check your internet and try again.`;
  }
}

export const askQwenBot = askAura1Bot;