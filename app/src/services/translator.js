import axios from 'axios';

/**
 * Clean HTML entities and normalize punctuation in translations
 */
function cleanTranslation(str) {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Common classroom phrases dictionary for instant offline fallback
 */
const OFFLINE_DICTIONARY = {
  'नमस्ते बच्चों': 'Hello children',
  'नमस्ते बच्चों!': 'Hello children!',
  'नमस्ते': 'Hello',
  'किताबें खोलें': 'Open your books',
  'किताबें खोलें।': 'Open your books.',
  'किताब खोलो': 'Open the book',
  'आज हम विज्ञान पढ़ेंगे': 'Today we will study science',
  'आज हम विज्ञान पढ़ेंगे।': 'Today we will study science.',
  'आज हम गणित पढ़ेंगे': 'Today we will study mathematics',
  'क्या सबको समझ आया?': 'Did everyone understand?',
  'क्या सबको समझ आया': 'Did everyone understand?',
  'अपना हाथ उठाएं': 'Raise your hand',
  'अपना हाथ उठाएं।': 'Raise your hand.',
  'ध्यान से सुनें': 'Listen carefully',
  'ध्यान से सुनें।': 'Listen carefully.',
  'शाबाश': 'Well done',
  'बहुत अच्छा': 'Very good',
  'धन्यवाद': 'Thank you',
  'शुभ प्रभात': 'Good morning',
  'बैठ जाइए': 'Please sit down',
  'शांत रहें': 'Please remain quiet',
  'बोर्ड पर देखें': 'Look at the board',
  'प्रश्न पूछें': 'Ask questions',
  'कोई सवाल है?': 'Do you have any questions?',
  'गृहकार्य लिख लें': 'Write down the homework',
  'कल मिलते हैं': 'See you tomorrow'
};

/**
 * Translates Hindi text to English in real time (< 200ms typical latency).
 * Uses multi-tier fallback:
 *   Tier 1: Google GTX public API (~120ms)
 *   Tier 2: MyMemory API (~250ms)
 *   Tier 3: Offline Classroom Phrase Dictionary (0ms)
 * 
 * @param {string} hindiText
 * @returns {Promise<{ originalText: string, translatedText: string, latencyMs: number, source: string }>}
 */
export async function translateHindiToEnglish(hindiText) {
  const startTime = Date.now();
  const trimmed = (hindiText || '').trim();

  if (!trimmed) {
    return { originalText: '', translatedText: '', latencyMs: 0, source: 'empty' };
  }

  // 1. Direct match in offline dictionary (instant 0ms)
  if (OFFLINE_DICTIONARY[trimmed]) {
    return {
      originalText: trimmed,
      translatedText: OFFLINE_DICTIONARY[trimmed],
      latencyMs: Date.now() - startTime,
      source: 'offline-cache'
    };
  }

  // 2. Try Google GTX API (Fastest public endpoint, sub-200ms)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=hi&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`;
    const response = await axios.get(url, { timeout: 2500 });
    
    if (response.data && Array.isArray(response.data[0])) {
      const translated = response.data[0].map((item) => item[0]).join('').trim();
      const cleaned = cleanTranslation(translated);
      if (cleaned) {
        return {
          originalText: trimmed,
          translatedText: cleaned,
          latencyMs: Date.now() - startTime,
          source: 'google-gtx'
        };
      }
    }
  } catch (err) {
    console.warn('Google GTX translation failed or timed out, trying secondary fallback:', err.message);
  }

  // 3. Try MyMemory API fallback
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=hi|en`;
    const response = await axios.get(url, { timeout: 2500 });
    
    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      const translated = cleanTranslation(response.data.responseData.translatedText);
      if (translated) {
        return {
          originalText: trimmed,
          translatedText: translated,
          latencyMs: Date.now() - startTime,
          source: 'mymemory'
        };
      }
    }
  } catch (err) {
    console.warn('MyMemory translation failed:', err.message);
  }

  // 4. Offline Partial Phrase Match Fallback
  for (const [hiPhrase, enPhrase] of Object.entries(OFFLINE_DICTIONARY)) {
    if (trimmed.includes(hiPhrase)) {
      return {
        originalText: trimmed,
        translatedText: enPhrase,
        latencyMs: Date.now() - startTime,
        source: 'offline-partial'
      };
    }
  }

  // Final Fallback: Return original text if unresolvable
  return {
    originalText: trimmed,
    translatedText: trimmed,
    latencyMs: Date.now() - startTime,
    source: 'raw-fallback'
  };
}
