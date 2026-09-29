// src/lib/aura.js (Aura-1 AI Engine — Grok backend, Puter for voice)

/**
 * Loads Puter.js CDN dynamically if window.puter is not already present
 * (Used ONLY for audio transcription and TTS — NOT for chat anymore)
 */
function loadPuterScript() {
  return new Promise((resolve, reject) => {
    if (window.puter) {
      resolve(window.puter);
      return;
    }

    const existingScript = document.querySelector('script[src="https://js.puter.com/v2/"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.puter));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.onload = () => resolve(window.puter);
    script.onerror = (err) => reject(new Error('Failed to load Puter.js SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Transcribes audio files (voice notes / mic recordings) using Puter AI
 * (Still on Puter — Grok doesn't do speech-to-text)
 * @param {Blob|File} audioFile - Audio blob or file
 * @returns {Promise<string>} Transcribed text string
 */
export async function transcribeAudio(audioFile) {
  try {
    const puter = await loadPuterScript();
    const transcript = await puter.ai.speech2txt(audioFile, {
      model: "gpt-4o-mini-transcribe"
    });
    return transcript?.text || transcript || "";
  } catch (error) {
    console.error("Audio Transcription Error:", error);
    throw new Error("Failed to transcribe audio input.");
  }
}

/**
 * Sends text prompts or audio inputs to Aura-1 via X.AI Grok API
 * (Grok handles reasoning, Puter still handles audio transcription)
 * @param {string|File|Blob} userPrompt - User input text, speech transcript, or audio File/Blob
 * @param {string} contextPrompt - Current note card or quiz card context
 * @param {string} botName - Custom bot handle (display name only)
 * @returns {Promise<string>} AI evaluation response
 */
export async function askAura1Bot(userPrompt, contextPrompt = "", botName = "Aura-1") {
  // ⚠️ API key check — helpful error if not configured
  const apiKey = import.meta.env.VITE_XAI_API_KEY;
  if (!apiKey) {
    console.error("Missing VITE_XAI_API_KEY in .env file");
    return `[${botName} Alert]: API key not configured. Add VITE_XAI_API_KEY to your .env file.`;
  }

  try {
    let finalInputText = userPrompt;

    // Handle audio input directly if userPrompt is a Blob or File (still uses Puter)
    if (userPrompt instanceof Blob || userPrompt instanceof File) {
      finalInputText = await transcribeAudio(userPrompt);
    }

    const systemInstruction = `You are ${botName}, an expert, witty, and direct CS & ICT AI evaluator for ByteForged Academy. Grade or answer the user's input accurately and concisely (under 100 words). Be encouraging but honest.`;
    
    // Call X.AI Grok API (OpenAI-compatible endpoint)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "grok-beta", // Free tier model — upgrade to "grok-4-fast" later if needed
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${finalInputText}` }
        ],
        temperature: 0.6,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Grok API Error:", response.status, errorData);
      return `[${botName} Alert]: Evaluation engine temporarily unavailable (code: ${response.status}). Please try again in a moment.`;
    }

    const data = await response.json();
    const aiText = data?.choices?.[0]?.message?.content;
    
    if (aiText && typeof aiText === 'string') {
      return aiText.trim();
    }

    return `[${botName}]: Evaluation processed successfully.`;
  } catch (error) {
    console.error("Aura-1 Grok Error:", error);
    return `[${botName} Alert]: Connection to evaluation engine interrupted. Please check your internet and try again.`;
  }
}

// Backward-compatible export alias
export const askQwenBot = askAura1Bot;