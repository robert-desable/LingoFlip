import axios from 'axios';

// AI4Bharat Bhashini API endpoints
const BASE_URL = 'https://dhruva-api.bhashini.gov.in';

// NOTE: You will need to replace these with your actual Bhashini API credentials
const API_KEY = process.env.VITE_BHASHINI_API_KEY || 'YOUR_API_KEY';
const USER_ID = process.env.VITE_BHASHINI_USER_ID || 'YOUR_USER_ID';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': API_KEY, // Or whatever auth schema Bhashini requires
});

/**
 * Speech-to-Text (ASR)
 * Converts base64 audio string to text.
 * @param {string} base64Audio - Base64 encoded audio string
 * @param {string} sourceLanguage - Language code (e.g., 'hi', 'sat', 'mun')
 * @returns {Promise<string>} Translated text
 */
export const speechToText = async (base64Audio, sourceLanguage) => {
  try {
    const payload = {
      config: {
        language: {
          sourceLanguage: sourceLanguage
        },
        transcriptionFormat: {
          value: 'transcript'
        },
        audioFormat: 'wav',
        samplingRate: 16000
      },
      audio: [
        {
          audioContent: base64Audio
        }
      ]
    };

    const response = await axios.post(`${BASE_URL}/services/inference/asr`, payload, { headers: getHeaders() });
    
    // Adjust response parsing based on actual AI4Bharat API structure
    if (response.data && response.data.output && response.data.output.length > 0) {
      return response.data.output[0].source;
    }
    return '';
  } catch (error) {
    console.error('STT Error:', error);
    throw error;
  }
};

/**
 * Text Translation
 * Translates text from source language to target language.
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<string>} Translated text
 */
export const translateText = async (text, sourceLang, targetLang) => {
  try {
    const payload = {
      config: {
        language: {
          sourceLanguage: sourceLang,
          targetLanguage: targetLang
        }
      },
      input: [
        {
          source: text
        }
      ]
    };

    const response = await axios.post(`${BASE_URL}/services/inference/translation`, payload, { headers: getHeaders() });
    
    if (response.data && response.data.output && response.data.output.length > 0) {
      return response.data.output[0].target;
    }
    return text; // fallback
  } catch (error) {
    console.error('Translation Error:', error);
    throw error;
  }
};

/**
 * Text-to-Speech (TTS)
 * Converts text to a base64 audio string.
 * @param {string} text - Text to convert to speech
 * @param {string} targetLang - Target language code (e.g., 'sat', 'mun')
 * @param {string} gender - 'male' or 'female' (if supported)
 * @returns {Promise<string>} Base64 audio string
 */
export const textToSpeech = async (text, targetLang, gender = 'female') => {
  try {
    const payload = {
      config: {
        language: {
          sourceLanguage: targetLang
        },
        gender: gender
      },
      input: [
        {
          source: text
        }
      ]
    };

    const response = await axios.post(`${BASE_URL}/services/inference/tts`, payload, { headers: getHeaders() });
    
    if (response.data && response.data.audio && response.data.audio.length > 0) {
      return response.data.audio[0].audioContent;
    }
    return null;
  } catch (error) {
    console.error('TTS Error:', error);
    throw error;
  }
};

/**
 * Combined Pipeline: STT -> Translate -> TTS
 * Convenience function for the full pipeline.
 */
export const processAudioPipeline = async (base64Audio, sourceLang, targetLang) => {
  try {
    // 1. Speech to Text
    const sourceText = await speechToText(base64Audio, sourceLang);
    
    if (!sourceText) return null;

    // 2. Translate Text
    const translatedText = await translateText(sourceText, sourceLang, targetLang);

    // 3. Text to Speech
    const translatedAudioBase64 = await textToSpeech(translatedText, targetLang);

    return {
      originalText: sourceText,
      translatedText: translatedText,
      audioBase64: translatedAudioBase64
    };
  } catch (error) {
    console.error('Pipeline Error:', error);
    throw error;
  }
};
