import axios from 'axios';

// ------------------- Warang Chiti Transliteration (Ho Script) -------------------

const WC_VOWELS = {
  'अ': '𑣁', 'आ': '𑣁', 'इ': '𑣆', 'ई': '𑣆', 'उ': '𑣇', 'ऊ': '𑣇',
  'ए': '𑣈', 'ऐ': '𑣁𑣆', 'ओ': '𑣉', 'औ': '𑣁𑣇', 'अं': '𑣀', 'अः': '𑣙'
};

const WC_MATRAS = {
  'ा': '𑣁', 'ि': '𑣆', 'ी': '𑣆', 'ु': '𑣇', 'ू': '𑣇',
  'े': '𑣈', 'ै': '𑣁𑣆', 'ो': '𑣉', 'ौ': '𑣁𑣇'
};

const WC_CONSONANTS = {
  'क': '𑣌', 'ख': '𑣌𑣙', 'ग': '𑣋', 'घ': '𑣋𑣙', 'ङ': '𑣀',
  'च': '𑣏', 'छ': '𑣏𑣙', 'ज': '𑢱', 'झ': '𑢱𑣙', 'ञ': '𑣍',
  'ट': '𑣒', 'ठ': '𑣒𑣙', 'ड': '𑣑', 'ढ': '𑣑𑣙', 'ण': '𑣐',
  'त': '𑣕', 'थ': '𑣕𑣙', 'द': '𑣔', 'ध': '𑣔𑣙', 'न': '𑣓',
  'प': '𑣘', 'फ': '𑣘𑣙', 'ब': '𑣗', 'भ': '𑣗𑣙', 'म': '𑣖',
  'य': '𑣄', 'र': '𑣜', 'ल': '𑣚', 'व': '𑣂',
  'श': '𑣞', 'ष': '𑣞', 'स': '𑣞', 'ह': '𑢹',
  'ड़': '𑣛', 'ढ़': '𑣛𑣙', 'ज़': '𑢱', 'फ़': '𑣘'
};

const WC_DIGITS = {
  '0': '𑣠', '1': '𑣡', '2': '𑣢', '3': '𑣣', '4': '𑣤',
  '5': '𑣥', '6': '𑣦', '7': '𑣧', '8': '𑣨', '9': '𑣩',
  '०': '𑣠', '१': '𑣡', '२': '𑣢', '३': '𑣣', '४': '𑣤',
  '५': '𑣥', '६': '𑣦', '७': '𑣧', '८': '𑣨', '९': '𑣩'
};

export function devanagariToWarangChiti(rawText) {
  if (!rawText) return '';
  if (/[\u{118A0}-\u{118FF}]/u.test(rawText)) return rawText;

  const text = rawText
    .replace(/ड[\u093C़]/g, 'ड़')
    .replace(/ढ[\u093C़]/g, 'ढ़')
    .replace(/ज[\u093C़]/g, 'ज़')
    .replace(/फ[\u093C़]/g, 'फ़')
    .replace(/[\u093C़]/g, '');

  let out = '';
  const len = text.length;
  let i = 0;

  while (i < len) {
    const ch = text[i];
    const next = text[i + 1];

    if (WC_DIGITS[ch]) {
      out += WC_DIGITS[ch];
      i++;
    } else if (WC_VOWELS[ch]) {
      out += WC_VOWELS[ch];
      i++;
    } else if (WC_CONSONANTS[ch]) {
      out += WC_CONSONANTS[ch];
      if (next === '्') {
        i += 2;
      } else if (WC_MATRAS[next]) {
        out += WC_MATRAS[next];
        i += 2;
      } else if (next === 'ं' || next === 'ँ') {
        out += '𑣀';
        i += 2;
      } else if (next === 'ः') {
        out += '𑣙';
        i += 2;
      } else {
        i++;
      }
    } else if (ch === 'ः') {
      out += '𑣙';
      i++;
    } else if (ch === 'ं' || ch === 'ँ') {
      out += '𑣀';
      i++;
    } else if (WC_MATRAS[ch]) {
      out += WC_MATRAS[ch];
      i++;
    } else if (ch === '्') {
      i++;
    } else {
      out += ch;
      i++;
    }
  }

  return out;
}

/**
 * Standard classroom phrases with multi-target translations for Jharkhand tribal education
 */
export const OFFLINE_TRANSLATIONS = {
  'नमस्ते बच्चों!': {
    santhali: { text: 'ᱥᱟᱹᱜᱩᱱ ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ!', phonetic: 'सागुन जोहार गिद्रा को!' },
    ho: { text: devanagariToWarangChiti('जोहार गिदराको!'), phonetic: 'जोहार गिदराको!' },
    mundari: { text: 'जोहार होनको!', phonetic: 'जोहार होनको!' },
    english: 'Hello children!'
  },
  'नमस्ते बच्चों': {
    santhali: { text: 'ᱥᱟᱹᱜᱩᱱ ᱡᱚᱦᱟᱨ ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ', phonetic: 'सागुन जोहार गिद्रा को' },
    ho: { text: devanagariToWarangChiti('जोहार गिदराको'), phonetic: 'जोहार गिदराको' },
    mundari: { text: 'जोहार होनको', phonetic: 'जोहार होनको' },
    english: 'Hello children'
  },
  'किताबें खोलें।': {
    santhali: { text: 'ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱯᱮ᱾', phonetic: 'पुथी झिज पे।' },
    ho: { text: devanagariToWarangChiti('पुथी ओलोपे।'), phonetic: 'पुथी ओलोपे।' },
    mundari: { text: 'पुथी उगुइपे।', phonetic: 'पुथी उगुइपे।' },
    english: 'Open your books.'
  },
  'किताबें खोलें': {
    santhali: { text: 'ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱯᱮ', phonetic: 'पुथी झिज पे' },
    ho: { text: devanagariToWarangChiti('पुथी ओलोपे'), phonetic: 'पुथी ओलोपे' },
    mundari: { text: 'पुथी उगुइपे', phonetic: 'पुथी उगुइपे' },
    english: 'Open your books'
  },
  'आज हम विज्ञान पढ़ेंगे।': {
    santhali: { text: 'ᱛᱮᱦᱮᱧ ᱵᱤᱜᱽᱭᱟᱱ ᱵᱚᱱ ᱯᱟᱲᱦᱟᱣᱟ᱾', phonetic: 'तेहेंगे बिग्यान बोन पाढ़ावा।' },
    ho: { text: devanagariToWarangChiti('तिसिंग बिग्यान पाढ़ाव ओवा।'), phonetic: 'तिसिंग बिग्यान पाढ़ाव ओवा।' },
    mundari: { text: 'तिसिंग आबु बिग्यान पाढ़ावइया।', phonetic: 'तिसिंग आबु बिग्यान पाढ़ावइया।' },
    english: 'Today we will study science.'
  },
  'क्या सबको समझ आया?': {
    santhali: { text: 'ᱡᱚᱛᱚ ᱦᱚᱲ ᱵᱩᱡᱷᱟᱹᱣ ᱮᱱᱟ?', phonetic: 'जोतो होड़ बुझाव एना?' },
    ho: { text: devanagariToWarangChiti('सोबेनको समझायोवा?'), phonetic: 'सोबेनको समझायोवा?' },
    mundari: { text: 'सबेनको समझायना?', phonetic: 'सबेनको समझायना?' },
    english: 'Did everyone understand?'
  },
  'अपना हाथ उठाएं।': {
    santhali: { text: 'ᱟᱯᱱᱟᱨ ᱛᱤ ᱛᱩᱞ ᱯᱮ᱾', phonetic: 'आपणार ती तुल पे।' },
    ho: { text: devanagariToWarangChiti('ती तुलपे।'), phonetic: 'ती तुलपे।' },
    mundari: { text: 'ती तुलपे।', phonetic: 'ती तुलपे।' },
    english: 'Raise your hand.'
  },
  'शांत रहें और ध्यान से सुनें।': {
    santhali: { text: 'ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱯᱮ ᱟᱨ ᱟᱸᱡᱚᱢ ᱯᱮ᱾', phonetic: 'थीर ताहेन पे आर आंजोम पे।' },
    ho: { text: devanagariToWarangChiti('थिर ताकेन आंजोमपे।'), phonetic: 'थिर ताकेन आंजोमपे।' },
    mundari: { text: 'थिर ताकेन आंजोमपे।', phonetic: 'थिर ताकेन आंजोमपे।' },
    english: 'Please remain quiet and listen carefully.'
  },
  'आप कैसे हैं?': {
    santhali: { text: 'ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?', phonetic: 'आम चेद लेका मेनामा?' },
    ho: { text: devanagariToWarangChiti('आम चिकना मेनामा?'), phonetic: 'आम चिकना मेनामा?' },
    mundari: { text: 'अम चिलिका मेनामा?', phonetic: 'अम चिलिका मेनामा?' },
    english: 'How are you?'
  },
  'तुम कैसे हो?': {
    santhali: { text: 'ᱟᱢ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?', phonetic: 'आम चेद लेका मेनामा?' },
    ho: { text: devanagariToWarangChiti('आम चिकना मेनामा?'), phonetic: 'आम चिकना मेनामा?' },
    mundari: { text: 'अम चिलिका मेनामा?', phonetic: 'अम चिलिका मेनामा?' },
    english: 'How are you?'
  },
  'यहाँ आओ।': {
    santhali: { text: 'ᱱᱚᱰᱮ ᱦᱤᱡᱩᱜ ᱢᱮ᱾', phonetic: 'नोडे हिजुग् मे।' },
    ho: { text: devanagariToWarangChiti('नेनताः हिजुमे।'), phonetic: 'नेनताः हिजुमे।' },
    mundari: { text: 'नेतरे हिजुमे।', phonetic: 'नेतरे हिजुमे।' },
    english: 'Come here.'
  },
  'यहाँ बैठ जाओ।': {
    santhali: { text: 'ᱱᱚᱰᱮ ᱫᱩᱲᱩᱵ ᱢᱮ᱾', phonetic: 'नोडे दुड़ुब मे।' },
    ho: { text: devanagariToWarangChiti('नेनताः दुबुमे।'), phonetic: 'नेनताः दुबुमे।' },
    mundari: { text: 'नेतरे दुबमे।', phonetic: 'नेतरे दुबमे।' },
    english: 'Sit down here.'
  },
  'ताली बजाओ!': {
    santhali: { text: 'ᱛᱟᱞᱤ ᱠᱷᱩᱵ ᱮᱢ ᱢᱮ!', phonetic: 'ताली खुब एम मे!' },
    ho: { text: devanagariToWarangChiti('ताली सारेयेपे!'), phonetic: 'ताली सारेयेपे!' },
    mundari: { text: 'ताली सारेयेपे!', phonetic: 'ताली सारेयेपे!' },
    english: 'Clap your hands!'
  },
  'गिनती करो।': {
    santhali: { text: 'ᱞᱮᱠᱷᱟᱭ ᱢᱮ᱾', phonetic: 'लेखाय मे।' },
    ho: { text: devanagariToWarangChiti('लेखाएमे।'), phonetic: 'लेखाएमे।' },
    mundari: { text: 'लेखाएमे।', phonetic: 'लेखाएमे।' },
    english: 'Count.'
  },
  'मुझे पानी पीना है।': {
    santhali: { text: 'ᱤᱧ ᱫᱟᱜ ᱧᱩ ᱥᱟᱱᱟᱭᱮᱫᱤᱧᱟ᱾', phonetic: 'इञ दाग ञु सानायेदिञा।' },
    ho: { text: devanagariToWarangChiti('आइञ दाः नुई सानांगिया।'), phonetic: 'आइञ दाः नुई सानांगिया।' },
    mundari: { text: 'आइञ दाः नुई सानांगिया।', phonetic: 'आइञ दाः नुई सानांगिया।' },
    english: 'I want to drink water.'
  },
  'सभी बच्चे अपनी किताबें निकालें।': {
    santhali: { text: 'ᱡᱚᱛᱚ ᱜᱤᱫᱽᱨᱟᱹ ᱟᱯᱱᱟᱨ ᱯᱚᱛᱚᱵ ᱩᱰᱩᱠ ᱯᱮ᱾', phonetic: 'जोतो गिद्राः आपनार पोतोब उडुक पे।' },
    ho: { text: devanagariToWarangChiti('सोबेन होनको आपन पुथि ओडोंपे।'), phonetic: 'सोबेन होनको आपन पुथि ओडोंपे।' },
    mundari: { text: 'सोबेन होनको आपन पुथि उरुंगपे।', phonetic: 'सोबेन होनको आपन पुथि उरुंगपे।' },
    english: 'All children take out your books.'
  },
  'क्या सभी कक्षा में सही तरफ से बैठे हैं?': {
    santhali: { text: 'ᱪᱮᱫ ᱡᱚᱛᱚ ᱦᱚᱲ ᱠᱞᱟᱥ ᱨᱮ ᱵᱩᱜᱤ ᱛᱮ ᱫᱩᱲᱩᱵ ᱟᱠᱟᱱᱟ ᱠᱚ?', phonetic: 'चेद जोतो होड़ क्लास रे बुगि ते दुड़ुब आकाना को?' },
    ho: { text: devanagariToWarangChiti('चिकना सोबेन क्लास रे बुगि लेकाते दुबअकानाको?'), phonetic: 'चिकना सोबेन क्लास रे बुगि लेकाते दुबअकानाको?' },
    mundari: { text: 'चिमता सोबेन क्लास रे बुगि लेकाते दुबअकानाको?', phonetic: 'चिमता सोबेन क्लास रे बुगि लेकाते दुबअकानाको?' },
    english: 'Is everyone seated properly in the classroom?'
  },
  'क्या सभी कक्षा में सही तरफ से बैठे हैं': {
    santhali: { text: 'ᱪᱮᱫ ᱡᱚᱛᱚ ᱦᱚᱲ ᱠᱞᱟᱥ ᱨᱮ ᱵᱩᱜᱤ ᱛᱮ ᱫᱩᱲᱩᱵ ᱟᱠᱟᱱᱟ ᱠᱚ', phonetic: 'चेद जोतो होड़ क्लास रे बुगि ते दुड़ुब आकाना को' },
    ho: { text: devanagariToWarangChiti('चिकना सोबेन क्लास रे बुगि लेकाते दुबअकानाको'), phonetic: 'चिकना सोबेन क्लास रे बुगि लेकाते दुबअकानाको' },
    mundari: { text: 'चिमता सोबेन क्लास रे बुगि लेकाते दुबअकानाको', phonetic: 'चिमता सोबेन क्लास रे बुगि लेकाते दुबअकानाको' },
    english: 'Is everyone seated properly in the classroom'
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
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const res = await axios.post(`${BACKEND_URL}/api/translate-text`, {
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

  // 3. Fallback: Check normalized matching against offline classroom dictionary
  const norm = trimmed.replace(/[।!?.॥,\s]+$/, '').trim();
  for (const [key, val] of Object.entries(OFFLINE_TRANSLATIONS)) {
    if (key.replace(/[।!?.॥,\s]+$/, '').trim() === norm) {
      return {
        hindi: trimmed,
        santhali: val.santhali,
        ho: val.ho,
        mundari: val.mundari,
        english: val.english,
        latencyMs: Date.now() - startTime
      };
    }
  }

  return {
    hindi: trimmed,
    santhali: { text: trimmed, phonetic: trimmed },
    ho: { text: devanagariToWarangChiti(`${trimmed} (काजी)`), phonetic: `${trimmed} (काजी)` },
    mundari: { text: `${trimmed} (काजी)`, phonetic: `${trimmed} (काजी)` },
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
