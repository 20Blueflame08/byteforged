// src/lib/aura.js (Aura-1 AI Engine — Puter Grok 4.7 with Speech-to-Text)

/**
 * Loads Puter.js CDN dynamically if window.puter is not already present
 * Users sign in via Puter popup — they pay for their own AI usage
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
 * Sends text prompts or audio inputs to Aura-1 via Puter Grok 4.7
 * Users pay for their own AI usage through their Puter account
 * @param {string|File|Blob} userPrompt - User input text, speech transcript, or audio File/Blob
 * @param {string} contextPrompt - Current note card or quiz card context
 * @param {string} botName - Custom bot handle
 * @returns {Promise<string>} AI evaluation response
 */
export async function askAura1Bot(userPrompt, contextPrompt = "", botName = "Aura-1") {
  try {
    const puter = await loadPuterScript();
    let finalInputText = userPrompt;

    // Handle audio input directly if userPrompt is a Blob or File
    if (userPrompt instanceof Blob || userPrompt instanceof File) {
      finalInputText = await transcribeAudio(userPrompt);
    }

    const systemInstruction = `You are ${botName}, an expert, witty, and direct CS & ICT AI evaluator for ByteForged Academy. Grade or answer the user's input accurately and concisely (under 100 words). Be encouraging but honest.`;
    const fullPrompt = `${systemInstruction}\n\n[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${finalInputText}`;

    // Query Aura-1 engine via Puter Grok 4.7
    const response = await puter.ai.chat(fullPrompt, {
      model: "x-ai/grok-4.7",
      temperature: 0.6
    });

    if (typeof response === 'string') {
      return response;
    }
    if (response?.message?.content) {
      return response.message.content;
    }
    if (response?.text) {
      return response.text;
    }

    return `[${botName}]: Evaluation processed successfully.`;
  } catch (error) {
    console.error("Aura-1 API Error:", error);
    return `[${botName} Alert]: Aura-1 engine connection error. Please try again.`;
  }
}

// Backward-compatible export alias
export const askQwenBot = askAura1Bot;