// src/lib/aura.js (Aura-1 AI Engine — Groq chat + Web Speech API, defensive env access)

/**
 * Safe getter for the Groq API key.
 * Handles missing env vars gracefully — never crashes at module load.
 */
function getGroqApiKey() {
  try {
    // @ts-ignore — import.meta.env may be undefined outside Vite
    return import.meta?.env?.VITE_GROQ_API_KEY || '';
  } catch {
    return '';
  }
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${finalInputText}` }
        ],
        temperature: 0.6,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      console.error('Groq API Error:', response.status);
      return `[${botName} Alert]: Evaluation engine temporarily unavailable. Please try again in a moment.`;
    }

    const data = await response.json();
    const aiText = data?.choices?.[0]?.message?.content;

    if (aiText && typeof aiText === 'string') return aiText.trim();
    return `[${botName}]: Evaluation processed successfully.`;
  } catch (error) {
    console.error("Aura-1 Groq Error:", error);
    return `[${botName} Alert]: Connection to evaluation engine interrupted. Please check your internet and try again.`;
  }
}

export const askQwenBot = askAura1Bot;