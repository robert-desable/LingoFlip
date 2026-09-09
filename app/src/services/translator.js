import axios from 'axios';

/**
 * Standard classroom phrases with multi-target translations for Jharkhand tribal education
 */
export const OFFLINE_TRANSLATIONS = {
  'नमस्ते बच्चों!': {
    santhali: { text: 'ᱥᱟᱹᱜᱩᱱ ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ!', phonetic: 'सागुन जोहार गिद्रा को!' },
    ho: { text: '𑢹𑣉𑣉 ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹᱠᱳ!', phonetic: 'जोहार गिदराको!' },
    mundari: { text: 'जोहार होनको!', phonetic: 'जोहार होनको!' },
    english: 'Hello children!'
  },
  'नमस्ते बच्चों': {
    santhali: { text: 'ᱥᱟᱹᱜᱩᱱ ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ', phonetic: 'सागुन जोहार गिद्रा को' },
    ho: { text: '𑢹𑣉𑣉 ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹᱠᱳ', phonetic: 'जोहार गिदराको' },
    mundari: { text: 'जोहार होनको', phonetic: 'जोहार होनको' },
    english: 'Hello children'
  },
  'किताबें खोलें।': {
    santhali: { text: 'ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱯᱮ᱾', phonetic: 'पुथी झिज पे।' },
    ho: { text: 'ᱯᱩᱛᱷᱤ ᱚᱞᱳᱯᱮ᱾', phonetic: 'पुथी ओलोपे।' },
    mundari: { text: 'पुथी उगुइपे।', phonetic: 'पुथी उगुइपे।' },
    english: 'Open your books.'
  },
  'किताबें खोलें': {
    santhali: { text: 'ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱯᱮ', phonetic: 'पुथी झिज पे' },
    ho: { text: 'ᱯᱩᱛᱷᱤ ᱚᱞᱳᱯᱮ', phonetic: 'पुथी ओलोपे' },
    mundari: { text: 'पुथी उगुइपे', phonetic: 'पुथी उगुइपे' },
    english: 'Open your books'
  },
  'आज हम विज्ञान पढ़ेंगे।': {
    santhali: { text: 'ᱛᱮᱦᱮᱧ ᱵᱤᱜᱽᱭᱟᱱ ᱵᱚᱱ ᱯᱟᱲᱦᱟᱣᱟ᱾', phonetic: 'तेहेंगे बिग्यान बोन पाढ़ावा।' },
    ho: { text: 'ᱛᱤᱥᱤᱝ ᱵᱤᱜᱽᱭᱟᱱ ᱯᱟᱲᱦᱟᱣ ᱚᱣᱟ᱾', phonetic: 'तिसिंग बिग्यान पाढ़ाव ओवा।' },
    mundari: { text: 'तिसिंग आबु बिग्यान पाढ़ावइया।', phonetic: 'तिसिंग आबु बिग्यान पाढ़ावइया।' },
    english: 'Today we will study science.'
  },
  'क्या सबको समझ आया?': {
    santhali: { text: 'ᱡᱚᱛᱚ ᱦᱚᱲ ᱵᱩᱡᱷᱟᱹᱣ ᱮᱱᱟ?', phonetic: 'जोतो होड़ बुझाव एना?' },
    ho: { text: 'ᱥᱟᱵᱩᱭ ᱠᱳ ᱥᱟᱢᱡᱷᱟᱣ ᱮᱱᱟ?', phonetic: 'सबुइको समझायोवा?' },
    mundari: { text: 'सबेनको समझायना?', phonetic: 'सबेनको समझायना?' },
    english: 'Did everyone understand?'
  },
  'अपना हाथ उठाएं।': {
    santhali: { text: 'ᱟᱯᱱᱟᱨ ᱛᱤ ᱛᱩᱞ ᱯᱮ᱾', phonetic: 'आपणार ती तुल पे।' },
    ho: { text: 'ᱛᱤ ᱛᱩᱞ ᱯᱮ᱾', phonetic: 'ती तुलपे।' },
    mundari: { text: 'ती तुलपे।', phonetic: 'ती तुलपे।' },
    english: 'Raise your hand.'
  },
  'शांत रहें और ध्यान से सुनें।': {
    santhali: { text: 'ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱯᱮ ᱟᱨ ᱟᱸᱡᱚᱢ ᱯᱮ᱾', phonetic: 'थीर ताहेन पे आर आंजोम पे।' },
    ho: { text: 'ᱛᱷᱤᱨ ᱠᱳ ᱛᱟᱠᱮᱱ ᱟᱸᱡᱳᱢ ᱯᱮ᱾', phonetic: 'थिरको ताकेन आंजोमपे।' },
    mundari: { text: 'थिर ताकेन आंजोमपे।', phonetic: 'थिर ताकेन आंजोमपे।' },
    english: 'Please remain quiet and listen carefully.'
  }
};

/**
 * Translates arbitrary Hindi text into Santhali, Ho, Mundari, and English
 * @param {string} hindiText
 * @returns {Promise<{ hindi: string, santhali: { text: string, phonetic: string }, ho: { text: string, phonetic: string }, mundari: { text: string, phonetic: string }, english: string, latencyMs: number }>}
 */
export async function translateHindiToAll(hindiText) {
  const startTime = Date.now();
  const trimmed = (hindiText || '').trim();

  if (!trimmed) {
    return {
      hindi: '',
      santhali: { text: '', phonetic: '' },
      ho: { text: '', phonetic: '' },
      mundari: { text: '', phonetic: '' },
      english: '',
      latencyMs: 0
    };
  }

  // 1. Check offline dictionary match
  if (OFFLINE_TRANSLATIONS[trimmed]) {
    const offline = OFFLINE_TRANSLATIONS[trimmed];
    return {
      hindi: trimmed,
      santhali: offline.santhali,
      ho: offline.ho,
      mundari: offline.mundari,
      english: offline.english,
      latencyMs: Date.now() - startTime
    };
  }

  // 2. Query server AI translation endpoint
  try {
    const res = await axios.post('http://localhost:3001/api/translate-text', {
      text: trimmed
    }, { timeout: 3500 });

    if (res.data && res.data.success && res.data.data) {
      const d = res.data.data;
      return {
        hindi: trimmed,
        santhali: d.santhali || { text: trimmed, phonetic: trimmed },
        ho: d.ho || { text: trimmed, phonetic: trimmed },
        mundari: d.mundari || { text: trimmed, phonetic: trimmed },
        english: d.english || trimmed,
        latencyMs: Date.now() - startTime
      };
    }
  } catch (err) {
    console.warn('[Translator] Server translate-text error, using fallback:', err.message);
  }

  // 3. Fallback: return trimmed input as phonetics
  return {
    hindi: trimmed,
    santhali: { text: trimmed, phonetic: trimmed },
    ho: { text: trimmed, phonetic: trimmed },
    mundari: { text: trimmed, phonetic: trimmed },
    english: trimmed,
    latencyMs: Date.now() - startTime
  };
}

/**
 * Backwards compatibility helper for English-only callers
 */
export async function translateHindiToEnglish(hindiText) {
  const res = await translateHindiToAll(hindiText);
  return {
    originalText: hindiText,
    translatedText: res.english,
    latencyMs: res.latencyMs
  };
}
