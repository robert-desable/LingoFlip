require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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

// Active Gemini API Key (loaded from .env or configured dynamically)
let activeGeminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

if (activeGeminiApiKey) {
  console.log('[Gemini Engine] Loaded Gemini API Key from environment/env.');
} else {
  console.log('[Gemini Engine] No Gemini API Key found. You can set it in server/.env or via the Teacher Dashboard.');
}

/**
 * Transcribes Hindi audio and translates to English in a single turn using Google Gemini
 * @param {string} audioBase64 - Base64 encoded audio bytes
 * @param {string} mimeType - e.g. 'audio/webm' or 'audio/wav'
 * @returns {Promise<{ hindi: string, english: string, modelUsed: string }>}
 */
async function transcribeAndTranslateWithGemini(audioBase64, mimeType = 'audio/webm') {
  if (!activeGeminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please enter your Gemini API key in the Teacher dashboard or server/.env.');
  }

  const prompt = `You are an expert speech-to-text transcriber for Indian school classrooms.
Listen carefully to the audio of a teacher speaking in Hindi.
1. Transcribe the Hindi speech accurately in Devanagari script (e.g., "नमस्ते बच्चों कैसे हो", "किताबें खोलो", "क्या सबको समझ आया").
2. Translate what the teacher said into natural, clear English.

Respond ONLY with valid JSON in this exact structure with no markdown backticks or commentary:
{"hindi": "exact Devanagari transcription", "english": "accurate English translation"}`;

  // Clean mimeType (remove codecs=opus suffix if present)
  const cleanMime = mimeType.split(';')[0].trim() || 'audio/webm';

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: cleanMime,
              data: audioBase64
            }
          },
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  };

  // Priority models: fast 2.5 Flash, 3.5 Flash Lite, 1.5 Flash
  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(activeGeminiApiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini API] Model ${model} returned HTTP ${res.status}:`, errText);
        lastError = new Error(`Gemini ${model} failed (${res.status}): ${errText}`);
        continue;
      }

      const json = await res.json();
      const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidate) {
        throw new Error('Gemini returned an empty candidate part');
      }

      // Clean up markdown formatting if returned
      const cleaned = candidate.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        hindi: (parsed.hindi || '').trim(),
        english: (parsed.english || '').trim(),
        modelUsed: model
      };
    } catch (err) {
      console.warn(`[Gemini STT] Error with ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to transcribe audio with Gemini');
}

// ------------------- REST API Endpoints -------------------

// Check current Gemini API key status
app.get('/api/key-status', (req, res) => {
  const hasKey = Boolean(activeGeminiApiKey && activeGeminiApiKey.trim().length > 10);
  const preview = hasKey
    ? `${activeGeminiApiKey.substring(0, 4)}...${activeGeminiApiKey.slice(-4)}`
    : '';
  return res.json({ success: true, hasKey, preview });
});

// Update Gemini API key dynamically & persist to server/.env
app.post('/api/set-api-key', (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
      return res.status(400).json({ success: false, message: 'Invalid API Key' });
    }

    activeGeminiApiKey = apiKey.trim();
    process.env.GEMINI_API_KEY = activeGeminiApiKey;

    // Write to server/.env
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${activeGeminiApiKey}`);
      } else {
        envContent += `\nGEMINI_API_KEY=${activeGeminiApiKey}\n`;
      }
    } else {
      envContent = `GEMINI_API_KEY=${activeGeminiApiKey}\nPORT=3001\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('[Gemini Engine] API Key successfully updated and saved to server/.env');
    return res.json({ success: true, message: 'Gemini API Key saved successfully' });
  } catch (err) {
    console.error('[Set API Key Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// HTTP endpoint for audio transcription & translation
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: 'No audio data received' });
    }
    if (!activeGeminiApiKey) {
      return res.status(400).json({
        success: false,
        needsApiKey: true,
        error: 'Gemini API Key is not set. Please configure it in the Teacher Dashboard.'
      });
    }

    const result = await transcribeAndTranslateWithGemini(audioBase64, mimeType);
    return res.json({
      success: true,
      text: result.hindi,
      hindiText: result.hindi,
      englishText: result.english,
      model: result.modelUsed
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
    
    const newStudent = {
      id: socket.id,
      name: studentName,
      motherTongue
    };
    
    room.students.push(newStudent);
    socket.join(roomCode);
    
    console.log(`[Room] Student ${studentName} joined ${roomCode}`);

    // Notify teacher
    io.to(room.teacherId).emit('student-joined', newStudent);

    if (callback) {
      callback({ 
        success: true, 
        roomDetails: { teacherName: room.teacherName, students: room.students } 
      });
    }
  });

  // 3. Gemini High-Accuracy Multimodal Speech-to-Text & Translation
  socket.on('transcribe-audio', async ({ audioBase64, mimeType = 'audio/webm' }, callback) => {
    try {
      if (!audioBase64) {
        if (callback) callback({ success: false, error: 'No audio data received' });
        return;
      }

      if (!activeGeminiApiKey) {
        if (callback) {
          callback({
            success: false,
            needsApiKey: true,
            error: 'Gemini API Key is not set. Please click "Set Gemini API Key" in the top bar.'
          });
        }
        return;
      }

      const t0 = Date.now();
      const result = await transcribeAndTranslateWithGemini(audioBase64, mimeType);
      const latencyMs = Date.now() - t0;
      console.log(`[Gemini STT Transcribed in ${latencyMs}ms (${result.modelUsed})]:`, result);

      if (callback) {
        callback({
          success: true,
          text: result.hindi,
          hindiText: result.hindi,
          englishText: result.english,
          model: result.modelUsed,
          latencyMs
        });
      }
    } catch (err) {
      console.error('[Gemini STT Socket Error]', err.message);
      if (callback) {
        callback({
          success: false,
          error: err.message
        });
      }
    }
  });

  // 4. Handle live transcript broadcast (STT output from teacher)
  socket.on('send-transcript', ({ roomCode, text, hindiText, englishText, originalLang = 'hi', targetLang = 'en', timestamp }) => {
    if (!rooms.has(roomCode)) return;
    
    const room = rooms.get(roomCode);
    const sentTime = timestamp || Date.now();
    const hText = (hindiText || text || '').trim();
    const eText = (englishText || '').trim();
    
    const transcriptEntry = {
      id: `${sentTime}-${socket.id}`,
      text: hText,
      hindiText: hText,
      englishText: eText,
      originalLang,
      targetLang,
      timestamp: sentTime
    };
    
    room.transcriptHistory.push(transcriptEntry);

    // Keep history reasonably sized
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
          const student = room.students[studentIndex];
          room.students.splice(studentIndex, 1);
          io.to(room.teacherId).emit('student-left', student);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] PalashSetu Server listening on port ${PORT}`);
  console.log(`[Server] Gemini Speech-to-Text & Translation Engine Ready.`);
});
