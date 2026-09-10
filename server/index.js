require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const {
  olChikiToDevanagari,
  translateHindiToTribal,
  buildMultilingualOutput,
  CLASSROOM_PHRASE_BANK
} = require('./tribalEngine');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8 // 100 MB buffer for audio payloads
});

// Active Bhashini API & Inference Credentials (loaded from .env with default fallback)
let activeBhashiniApiKey = process.env.BHASHINI_API_KEY || '38b9ba42b8-476b-45c7-a124-168ccaca79f5';
let activeBhashiniInferenceKey = process.env.BHASHINI_INFERENCE_KEY || '0J8g7cdRdENu6mribzqO6QNO6TdW3tYYtb897CleY2Bni76UFpQTruuPdCntmGsO';

console.log('[Bhashini Engine] Active Bhashini API and Inference credentials loaded.');

/**
 * High-accuracy offline translations for standard classroom phrases
 */
const OFFLINE_TRANSLATIONS = {
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
 * Normalizes multi-lingual translation object
 */
function normalizeTranslationPayload(raw, hindiText) {
  const normLang = (val, fallback = '') => {
    if (!val) return { text: fallback, phonetic: fallback };
    if (typeof val === 'string') return { text: val.trim(), phonetic: val.trim() };
    const txt = val.text || val.olChiki || val.native || fallback;
    const pho = val.phonetic || val.devanagari || val.hindi || txt;
    return { text: String(txt).trim(), phonetic: String(pho).trim() };
  };

  return {
    hindi: (raw.hindi || hindiText || '').trim(),
    english: (raw.english || '').trim(),
    santhali: normLang(raw.santhali, raw.hindi || hindiText),
    ho: normLang(raw.ho, raw.hindi || hindiText),
    mundari: normLang(raw.mundari, raw.hindi || hindiText)
  };
}

/**
 * Executes a pipeline request to Bhashini Dhruva inference endpoint
 */
async function callBhashiniPipeline(pipelineTasks, inputData) {
  const url = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': activeBhashiniInferenceKey
    },
    body: JSON.stringify({
      pipelineTasks,
      inputData
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Bhashini API error (${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * Transcribes Hindi audio using Bhashini ASR and translates to English & Santhali (Bhashini NMT) + Ho & Mundari
 * @param {string} audioBase64 - Base64 encoded audio bytes (16kHz WAV)
 * @param {string} mimeType - e.g. 'audio/wav'
 */
async function transcribeAndTranslateWithBhashini(audioBase64, mimeType = 'audio/wav') {
  if (!audioBase64) {
    throw new Error('No audio data received');
  }

  // 1. Joint ASR (Hindi) + NMT (English) pipeline call
  const jointRes = await callBhashiniPipeline(
    [
      {
        taskType: 'asr',
        config: {
          language: { sourceLanguage: 'hi' }
        }
      },
      {
        taskType: 'translation',
        config: {
          language: { sourceLanguage: 'hi', targetLanguage: 'en' }
        }
      }
    ],
    {
      audio: [
        { audioContent: audioBase64 }
      ]
    }
  );

  const pipeline = jointRes?.pipelineResponse || [];
  const asrTask = pipeline.find(t => t.taskType === 'asr');
  const transTask = pipeline.find(t => t.taskType === 'translation');

  const recognizedHindi = asrTask?.output?.[0]?.source?.trim() || '';
  const englishTrans = transTask?.output?.[0]?.target?.trim() || '';

  if (!recognizedHindi) {
    throw new Error('No speech recognized in audio');
  }

  // 2. Check offline classroom phrase bank first (0ms instantaneous lookup)
  if (CLASSROOM_PHRASE_BANK[recognizedHindi]) {
    const offline = CLASSROOM_PHRASE_BANK[recognizedHindi];
    return {
      hindi: recognizedHindi,
      english: englishTrans || offline.english,
      santhali: offline.santhali,
      ho: offline.ho,
      mundari: offline.mundari,
      modelUsed: 'Bhashini Dhruva ASR + Tribal Engine'
    };
  }

  // 3. For Santhali, query Bhashini NMT for Ol Chiki translation
  let santhaliOlChiki = '';
  try {
    const satRes = await callBhashiniPipeline(
      [
        {
          taskType: 'translation',
          config: {
            language: { sourceLanguage: 'hi', targetLanguage: 'sat' }
          }
        }
      ],
      {
        input: [
          { source: recognizedHindi }
        ]
      }
    );
    santhaliOlChiki = satRes?.pipelineResponse?.[0]?.output?.[0]?.target?.trim() || '';
  } catch (satErr) {
    console.warn('[Bhashini NMT] Santhali translation note:', satErr.message);
  }

  // 4. Build comprehensive mother tongue output (Santhali phonetics, Ho, Mundari, English)
  const multilingual = buildMultilingualOutput(recognizedHindi, santhaliOlChiki, englishTrans);

  return {
    ...multilingual,
    modelUsed: 'Bhashini Dhruva ASR + NMT & Tribal Engine'
  };
}

/**
 * Translates arbitrary Hindi text into Santhali, Ho, Mundari, and English using Bhashini NMT and tribal dictionary
 */
async function translateTextWithBhashini(hindiText) {
  const trimmed = (hindiText || '').trim();
  if (!trimmed) return null;

  // 1. Direct match in offline classroom phrase dictionary
  if (CLASSROOM_PHRASE_BANK[trimmed]) {
    const offline = CLASSROOM_PHRASE_BANK[trimmed];
    return {
      hindi: trimmed,
      english: offline.english,
      santhali: offline.santhali,
      ho: offline.ho,
      mundari: offline.mundari,
      source: 'offline-cache'
    };
  }

  // 2. Query Bhashini NMT for English and Santhali
  let englishTrans = '';
  let santhaliTrans = '';

  try {
    const [enRes, satRes] = await Promise.allSettled([
      callBhashiniPipeline(
        [{ taskType: 'translation', config: { language: { sourceLanguage: 'hi', targetLanguage: 'en' } } }],
        { input: [{ source: trimmed }] }
      ),
      callBhashiniPipeline(
        [{ taskType: 'translation', config: { language: { sourceLanguage: 'hi', targetLanguage: 'sat' } } }],
        { input: [{ source: trimmed }] }
      )
    ]);

    if (enRes.status === 'fulfilled') {
      englishTrans = enRes.value?.pipelineResponse?.[0]?.output?.[0]?.target?.trim() || '';
    }
    if (satRes.status === 'fulfilled') {
      santhaliTrans = satRes.value?.pipelineResponse?.[0]?.output?.[0]?.target?.trim() || '';
    }
  } catch (err) {
    console.warn('[Bhashini Translation] Error:', err.message);
  }

  // 3. Build comprehensive mother tongue output (Santhali phonetics, Ho, Mundari, English)
  const multilingual = buildMultilingualOutput(trimmed, santhaliTrans, englishTrans);

  return {
    ...multilingual,
    source: 'bhashini-nmt'
  };
}

// ------------------- REST API Endpoints -------------------

// Check current Bhashini API key status
app.get('/api/key-status', (req, res) => {
  return res.json({ success: true, hasKey: true, preview: 'Bhashini Active' });
});

// Update Bhashini API keys dynamically & persist to server/.env
app.post('/api/set-api-key', (req, res) => {
  try {
    const { apiKey, inferenceKey } = req.body;
    if (apiKey) activeBhashiniApiKey = apiKey.trim();
    if (inferenceKey) activeBhashiniInferenceKey = inferenceKey.trim();

    const envPath = path.join(__dirname, '.env');
    const envContent = `# Bhashini (National Language Translation Mission / ULCA / Dhruva) API Keys\nBHASHINI_API_KEY=${activeBhashiniApiKey}\nBHASHINI_INFERENCE_KEY=${activeBhashiniInferenceKey}\nPORT=3001\n`;
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('[Bhashini Engine] API keys updated in server/.env');
    return res.json({ success: true, message: 'Bhashini credentials saved successfully' });
  } catch (err) {
    console.error('[Set API Key Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// HTTP endpoint for translating text to all mother tongues
app.post('/api/translate-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'No text provided' });
    }
    const result = await translateTextWithBhashini(text);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Translate Text Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// HTTP endpoint for audio transcription & translation
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/wav' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: 'No audio data received' });
    }

    const result = await transcribeAndTranslateWithBhashini(audioBase64, mimeType);
    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('[STT HTTP Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// High-fidelity natural voice TTS proxy & in-memory cache
const ttsCache = new Map();

app.get('/api/tts', async (req, res) => {
  try {
    const text = (req.query.text || '').trim();
    const lang = req.query.lang || 'en';
    if (!text) {
      return res.status(400).send('No text provided');
    }

    const cacheKey = `${lang}:${text}`;
    if (ttsCache.has(cacheKey)) {
      res.set({
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      });
      return res.send(ttsCache.get(cacheKey));
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    const upstreamRes = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!upstreamRes.ok) {
      console.warn(`[TTS Upstream] Failed with status ${upstreamRes.status}`);
      return res.status(upstreamRes.status).send('TTS upstream error');
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Keep cache size bounded
    if (ttsCache.size > 200) {
      const firstKey = ttsCache.keys().next().value;
      ttsCache.delete(firstKey);
    }
    ttsCache.set(cacheKey, buffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });
    return res.send(buffer);
  } catch (err) {
    console.error('[TTS Error]', err);
    return res.status(500).send(err.message);
  }
});

// ------------------- Socket.IO Classroom Logic -------------------

const rooms = new Map();
const generateRoomCode = () => Math.floor(1000 + Math.random() * 9000).toString();

io.on('connection', (socket) => {
  console.log(`[+] User connected: ${socket.id}`);

  // 1. Teacher creates a lobby
  socket.on('create-room', ({ teacherName, language = 'hi' }, callback) => {
    const roomCode = generateRoomCode();
    
    rooms.set(roomCode, {
      teacherId: socket.id,
      teacherName,
      language,
      students: [],
      transcriptHistory: []
    });

    socket.join(roomCode);
    console.log(`[Room] ${roomCode} created by Teacher ${teacherName}`);
    
    if (callback) callback({ success: true, roomCode });
  });

  // 2. Student joins a lobby
  socket.on('join-room', ({ roomCode, studentName, motherTongue }, callback) => {
    if (!rooms.has(roomCode)) {
      if (callback) callback({ success: false, message: 'Room not found' });
      return;
    }

    const room = rooms.get(roomCode);
    
    // Deduplicate: remove if this socket or matching student already exists in room
    const existingIndex = room.students.findIndex(s => s.id === socket.id || (s.name === studentName && s.motherTongue === motherTongue));
    if (existingIndex !== -1) {
      room.students.splice(existingIndex, 1);
    }

    const newStudent = {
      id: socket.id,
      name: studentName,
      motherTongue
    };
    
    room.students.push(newStudent);
    socket.join(roomCode);
    
    console.log(`[Room] Student ${studentName} (${motherTongue}) joined ${roomCode}`);

    // Notify teacher of the joined student AND broadcast synchronized active student list
    io.to(room.teacherId).emit('student-joined', newStudent);
    io.to(room.teacherId).emit('update-students', room.students);

    if (callback) {
      callback({ 
        success: true, 
        roomDetails: { teacherName: room.teacherName, students: room.students } 
      });
    }
  });

  // 2b. Student leaves a lobby explicitly
  socket.on('leave-room', ({ roomCode }) => {
    rooms.forEach((room, rCode) => {
      if (roomCode && rCode !== roomCode) return;
      const studentIndex = room.students.findIndex(s => s.id === socket.id);
      if (studentIndex !== -1) {
        const [removedStudent] = room.students.splice(studentIndex, 1);
        socket.leave(rCode);
        console.log(`[Room] Student ${removedStudent.name} (${removedStudent.motherTongue}) explicitly left ${rCode}`);

        io.to(room.teacherId).emit('student-left', removedStudent);
        io.to(room.teacherId).emit('update-students', room.students);
      }
    });
  });

  // 3. Multilingual Speech-to-Text & Translation (Santhali, Ho, Mundari, English)
  socket.on('transcribe-audio', async ({ audioBase64, mimeType = 'audio/webm' }, callback) => {
    try {
      if (!audioBase64) {
        if (callback) callback({ success: false, error: 'No audio data received' });
        return;
      }

      const t0 = Date.now();
      const result = await transcribeAndTranslateWithBhashini(audioBase64, mimeType);
      const latencyMs = Date.now() - t0;
      console.log(`[Bhashini Multilingual STT in ${latencyMs}ms (${result.modelUsed})]:`, result);

      if (callback) {
        callback({
          success: true,
          hindiText: result.hindi,
          text: result.hindi,
          santhali: result.santhali,
          ho: result.ho,
          mundari: result.mundari,
          englishText: result.english,
          model: result.modelUsed,
          latencyMs
        });
      }
    } catch (err) {
      console.error('[Bhashini STT Socket Error]', err.message);
      if (callback) {
        callback({
          success: false,
          error: err.message
        });
      }
    }
  });

  // 4. Handle live transcript broadcast (Broadcasts all tribal translations to students)
  socket.on('send-transcript', ({ roomCode, text, hindiText, santhali, ho, mundari, englishText, timestamp }) => {
    if (!rooms.has(roomCode)) return;
    
    const room = rooms.get(roomCode);
    const sentTime = timestamp || Date.now();
    const hText = (hindiText || text || '').trim();
    const eText = (englishText || '').trim();
    
    const transcriptEntry = {
      id: `${sentTime}-${socket.id}`,
      text: hText,
      hindiText: hText,
      santhali: santhali || { text: hText, phonetic: hText },
      ho: ho || { text: hText, phonetic: hText },
      mundari: mundari || { text: hText, phonetic: hText },
      englishText: eText,
      timestamp: sentTime
    };
    
    room.transcriptHistory.push(transcriptEntry);

    if (room.transcriptHistory.length > 50) {
      room.transcriptHistory.shift();
    }

    // Broadcast to all students in the room
    socket.to(roomCode).emit('receive-transcript', transcriptEntry);
  });

  // 5. The "Interrupt / Doubt" Signal System
  socket.on('raise-doubt', ({ roomCode }) => {
    if (!rooms.has(roomCode)) return;
    
    const room = rooms.get(roomCode);
    const student = room.students.find(s => s.id === socket.id);
    
    if (!student) return;

    const recentContext = room.transcriptHistory.slice(-3);
    console.log(`[Interrupt] Doubt raised by ${student.name} in room ${roomCode}`);

    io.to(room.teacherId).emit('student-doubt', {
      student,
      context: recentContext,
      timestamp: Date.now()
    });
  });

  // 5b. Teacher marks a student's doubt resolved -> notify student to clear button state
  socket.on('resolve-doubt', ({ roomCode, studentId }) => {
    if (!rooms.has(roomCode)) return;
    console.log(`[Interrupt] Doubt resolved by teacher for student ${studentId || 'all'} in room ${roomCode}`);
    if (studentId) {
      io.to(studentId).emit('doubt-resolved', { studentId });
    }
    io.to(roomCode).emit('doubt-resolved', { studentId });
  });

  // 5c. Student cancels doubt / lowers hand voluntarily
  socket.on('cancel-doubt', ({ roomCode }) => {
    if (!rooms.has(roomCode)) return;
    const room = rooms.get(roomCode);
    console.log(`[Interrupt] Doubt cancelled by student ${socket.id} in room ${roomCode}`);
    io.to(room.teacherId).emit('doubt-cancelled', { studentId: socket.id });
  });

  // 6. Teacher explicitly ends the live class
  socket.on('end-room', ({ roomCode }, callback) => {
    if (!rooms.has(roomCode)) {
      if (callback) callback({ success: false, message: 'Room not found' });
      return;
    }

    const room = rooms.get(roomCode);
    if (room.teacherId === socket.id) {
      console.log(`[Room] ${roomCode} ended by Teacher ${room.teacherName}`);
      io.to(roomCode).emit('teacher-disconnected');
      rooms.delete(roomCode);
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ success: false, message: 'Unauthorized' });
    }
  });

  // 7. Handle disconnections
  socket.on('disconnect', () => {
    console.log(`[-] User disconnected: ${socket.id}`);
    
    rooms.forEach((room, roomCode) => {
      if (room.teacherId === socket.id) {
        io.to(roomCode).emit('teacher-disconnected');
        rooms.delete(roomCode);
        console.log(`[Room] ${roomCode} deleted due to teacher disconnect.`);
      } else {
        const studentIndex = room.students.findIndex(s => s.id === socket.id);
        if (studentIndex !== -1) {
          const [removedStudent] = room.students.splice(studentIndex, 1);
          console.log(`[Room] Student ${removedStudent.name} disconnected from ${roomCode}`);
          io.to(room.teacherId).emit('student-left', removedStudent);
          io.to(room.teacherId).emit('update-students', room.students);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] PalashSetu Server listening on port ${PORT}`);
  console.log(`[Server] Multilingual Speech & Mother Tongue Engine Ready (Santhali, Ho, Mundari).`);
});
