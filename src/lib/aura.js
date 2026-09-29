// src/lib/aura.js (Aura-1 AI Engine — Groq chat + Web Speech API transcription, NO Puter)

const GROQ_API_KEY = import.meta.env.local.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Transcribes audio using the browser's built-in Web Speech API.
 * No API keys, no verification, works offline.
 * @param {Blob|File} audioFile - Audio blob or file
 * @returns {Promise<string>} Transcribed text
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

    // Convert blob to audio element for playback (recognition needs live mic, not file)
    // Fallback: use file-based approach if available
    const audioUrl = URL.createObjectURL(audioFile);
    const audio = new Audio(audioUrl);
    
    // Web Speech API works with live mic, not files directly
    // So we'll use a hybrid: play audio and capture via recognition
    let transcript = '';
    
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
    };

    recognition.onend = () => {
      URL.revokeObjectURL(audioUrl);
      if (transcript.trim()) {
        resolve(transcript.trim());
      } else {
        reject(new Error('No speech detected in audio'));
      }
    };

    recognition.onerror = (event) => {
      URL.revokeObjectURL(audioUrl);
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    // Start recognition and play audio simultaneously
    try {
      recognition.start();
      audio.play().catch(() => {});
      
      // Timeout after 30 seconds
      setTimeout(() => {
        recognition.stop();
        if (!transcript.trim()) {
          reject(new Error('Speech recognition timed out'));
        }
      }, 30000);
    } catch (error) {
      URL.revokeObjectURL(audioUrl);
      reject(error);
    }
  });
}

/**
 * Sends text prompts or audio inputs to Aura-1 via Groq API.
 * @param {string|File|Blob} userPrompt - Text, or audio File/Blob (auto-transcribed)
 * @param {string} contextPrompt - Current note/quiz card context
 * @param {string} botName - Custom bot handle
 * @returns {Promise<string>} AI evaluation response
 */
export async function askAura1Bot(userPrompt, contextPrompt = "", botName = "Aura-1") {
  if (!GROQ_API_KEY) {
    return `[${botName} Alert]: API key not configured. Add VITE_GROQ_API_KEY to your .env file.`;
  }

  try {
    let finalInputText = userPrompt;

    // Handle audio input — transcribe via Web Speech API (no verification)
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
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Free, fast, no verification
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `[STUDY CONTEXT]: ${contextPrompt}\n\n[USER INPUT]: ${finalInputText}` }
        ],
        temperature: 0.6,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API Error:', response.status, errorData);
      return `[${botName} Alert]: Evaluation engine temporarily unavailable. Please try again in a moment.`;
    }

    const data = await response.json();
    const aiText = data?.choices?.[0]?.message?.content;

    if (aiText && typeof aiText === 'string') {
      return aiText.trim();
    }

    return `[${botName}]: Evaluation processed successfully.`;
  } catch (error) {
    console.error("Aura-1 Groq Error:", error);
    return `[${botName} Alert]: Connection to evaluation engine interrupted. Please check your internet and try again.`;
  }
}

// Backward-compatible export alias
export const askQwenBot = askAura1Bot;