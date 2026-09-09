import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  Users, 
  Mic, 
  Square, 
  Hand, 
  AlertCircle, 
  PhoneOff, 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Volume2, 
  Zap, 
  CheckCircle2,
  Radio,
  Loader2,
  AlertTriangle,
  Key,
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { translateHindiToAll } from '../services/translator';
import { startRecording, stopRecording } from '../services/audioRecorder';
import ThemeToggle from './ThemeToggle';

const socket = io('http://localhost:3001');

const LANG_MAP = {
  sat: { name: 'Santhali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', hindi: 'संथाली', font: 'font-ol-chiki' },
  hoc: { name: 'Ho', native: '𑢹𑣉𑣉', hindi: 'हो', font: 'font-warang-chiti' },
  mun: { name: 'Mundari', native: 'मुण्डारी', hindi: 'मुण्डारी', font: 'font-devanagari' }
};

const QUICK_PHRASES = [
  { hi: 'नमस्ते बच्चों!', en: 'Hello children!' },
  { hi: 'किताबें खोलें।', en: 'Open your books.' },
  { hi: 'आज हम विज्ञान पढ़ेंगे।', en: 'Today we will study science.' },
  { hi: 'क्या सबको समझ आया?', en: 'Did everyone understand?' },
  { hi: 'अपना हाथ उठाएं।', en: 'Raise your hand.' },
  { hi: 'शांत रहें और ध्यान से सुनें।', en: 'Please remain quiet and listen carefully.' }
];

function TeacherDashboard() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(null);
  const [students, setStudents] = useState([]);
  const [doubts, setDoubts] = useState([]);

  // Voice recording & transcription states
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Transmission results (multilingual mother tongue routing)
  const [hindiTranscript, setHindiTranscript] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [santhaliTranslation, setSanthaliTranslation] = useState(null);
  const [hoTranslation, setHoTranslation] = useState(null);
  const [mundariTranslation, setMundariTranslation] = useState(null);
  const [latency, setLatency] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [customText, setCustomText] = useState('');

  // Gemini API Key Management
  const [hasApiKey, setHasApiKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveSuccess, setKeySaveSuccess] = useState('');

  // Timer & click locks
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const isActionInProgressRef = useRef(false);

  // Fetch initial API key status and sync with localStorage
  const checkApiKeyStatus = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/key-status');
      if (res.ok) {
        const data = await res.json();
        if (data.hasKey) {
          setHasApiKey(true);
          setKeyPreview(data.preview || '');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not check server API key status:', e);
    }

    // Check local storage fallback
    const savedLocalKey = localStorage.getItem('palash_gemini_key');
    if (savedLocalKey && savedLocalKey.length > 8) {
      try {
        const syncRes = await fetch('http://localhost:3001/api/set-api-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: savedLocalKey })
        });
        if (syncRes.ok) {
          setHasApiKey(true);
          setKeyPreview(`${savedLocalKey.substring(0, 4)}...${savedLocalKey.slice(-4)}`);
        }
      } catch (err) {}
    }
  };

  useEffect(() => {
    checkApiKeyStatus();

    socket.on('student-joined', (student) => {
      setStudents((prev) => [...prev, student]);
    });

    socket.on('student-left', (student) => {
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    });

    socket.on('student-doubt', (data) => {
      setDoubts((prev) => [...prev, data]);
    });

    return () => {
      socket.off('student-joined');
      socket.off('student-left');
      socket.off('student-doubt');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleSaveApiKey = async (e) => {
    e?.preventDefault();
    const key = apiKeyInput.trim();
    if (!key) return;

    setIsSavingKey(true);
    setKeySaveSuccess('');

    try {
      const res = await fetch('http://localhost:3001/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('palash_gemini_key', key);
        setHasApiKey(true);
        setKeyPreview(`${key.substring(0, 4)}...${key.slice(-4)}`);
        setKeySaveSuccess('Gemini API Key saved successfully! Speech recognition is ready.');
        setTimeout(() => {
          setShowKeyModal(false);
          setKeySaveSuccess('');
          setApiKeyInput('');
        }, 1500);
      } else {
        alert(data.message || 'Failed to save key');
      }
    } catch (err) {
      alert('Error saving API Key: ' + err.message);
    } finally {
      setIsSavingKey(false);
    }
  };

  const createRoom = () => {
    socket.emit('create-room', { teacherName: 'Teacher', language: 'hi' }, (res) => {
      if (res.success) {
        setRoomCode(res.roomCode);
      }
    });
  };

  const endClass = async () => {
    const confirmEnd = window.confirm(
      'Are you sure you want to end this live class? All connected students will be disconnected.'
    );
    if (!confirmEnd) return;

    if (isRecording) {
      await stopRecording();
      setIsRecording(false);
      setAudioLevel(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    socket.emit('end-room', { roomCode }, (res) => {
      console.log('Class ended response:', res);
    });

    setRoomCode(null);
    setStudents([]);
    setHindiTranscript('');
    setEnglishTranslation('');
    setSanthaliTranslation(null);
    setHoTranslation(null);
    setMundariTranslation(null);
    setStatusMessage('');
    setLatency(null);
    setDoubts([]);
  };

  /**
   * Translates Hindi speech to all student mother tongues (Santhali, Ho, Mundari) + English in real time
   */
  const handleProcessHindiSpeech = async (hindiText, startTime = null) => {
    const text = (hindiText || '').trim();
    if (!text || !roomCode) return;

    setIsTranslating(true);
    setHindiTranscript(text);
    setStatusMessage('');

    const t0 = startTime || Date.now();
    try {
      const res = await translateHindiToAll(text);
      const elapsed = Date.now() - t0;

      setEnglishTranslation(res.english);
      setSanthaliTranslation(res.santhali);
      setHoTranslation(res.ho);
      setMundariTranslation(res.mundari);
      setLatency(elapsed);
      setIsTranslating(false);

      // Emit to students with full multilingual payload
      socket.emit('send-transcript', {
        roomCode,
        hindiText: text,
        santhali: res.santhali,
        ho: res.ho,
        mundari: res.mundari,
        englishText: res.english,
        text: text,
        originalLang: 'hi',
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Translation error:', err);
      setIsTranslating(false);
    }
  };

  /**
   * Starts or stops live microphone recording with precise wall-clock timer & Gemini STT
   */
  const toggleRecording = async () => {
    if (isActionInProgressRef.current) return;
    isActionInProgressRef.current = true;

    if (!isRecording) {
      // Check if API key is configured before starting
      if (!hasApiKey) {
        setShowKeyModal(true);
        setStatusMessage('Google Gemini API Key आवश्यक है। कृपया अपनी Key दर्ज करें।');
        isActionInProgressRef.current = false;
        return;
      }

      try {
        setStatusMessage('');
        setRecordingSeconds(0);
        startTimeRef.current = Date.now();

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Start native MediaRecorder with volume meter
        await startRecording({
          onAudioLevel: (level) => {
            setAudioLevel(level);
          }
        });

        setIsRecording(true);

        // Precise wall-clock elapsed timer
        timerRef.current = setInterval(() => {
          if (startTimeRef.current > 0) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setRecordingSeconds(elapsed);
          }
        }, 150);
      } catch (err) {
        console.error('Failed to access microphone:', err);
        setStatusMessage('माइक चालू नहीं हो सका। कृपया माइक्रोफ़ोन की अनुमति दें। (Could not access microphone.)');
        setIsRecording(false);
      } finally {
        isActionInProgressRef.current = false;
      }
    } else {
      // Teacher stopped speaking -> finalize recording
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      setAudioLevel(0);
      setIsTranscribing(true);

      const captureStartTime = Date.now();

      try {
        const audioResult = await stopRecording();

        if (!audioResult || !audioResult.base64) {
          setIsTranscribing(false);
          setStatusMessage('रिकॉर्डिंग बहुत छोटी थी। कृपया बटन दबाकर पूरा वाक्य बोलें। (Recording was too short.)');
          setTimeout(() => setStatusMessage(''), 4000);
          isActionInProgressRef.current = false;
          return;
        }

        console.log(`[Audio Captured]: ${audioResult.durationSec}s, ${audioResult.mimeType}, base64 len: ${audioResult.base64.length}`);

        // Send recorded audio to Gemini STT & Translation
        socket.emit(
          'transcribe-audio',
          { audioBase64: audioResult.base64, mimeType: audioResult.mimeType },
          async (sttRes) => {
            setIsTranscribing(false);

            if (sttRes?.needsApiKey) {
              setHasApiKey(false);
              setShowKeyModal(true);
              setStatusMessage('Gemini API Key आवश्यक है। कृपया अपनी Key दर्ज करें।');
              return;
            }

            if (sttRes && sttRes.success && sttRes.hindiText) {
              const recognizedHindi = sttRes.hindiText.trim();
              const englishTrans = (sttRes.englishText || '').trim();
              const satTrans = sttRes.santhali;
              const hoTrans = sttRes.ho;
              const munTrans = sttRes.mundari;
              const elapsedMs = sttRes.latencyMs || (Date.now() - captureStartTime);

              console.log('[Gemini STT Multilingual Output]:', {
                hindi: recognizedHindi,
                santhali: satTrans,
                ho: hoTrans,
                mundari: munTrans,
                english: englishTrans
              });

              setHindiTranscript(recognizedHindi);
              setStatusMessage('');

              if (satTrans || hoTrans || munTrans || englishTrans) {
                // Direct joint transcription + multi-target mother tongue translation from Gemini!
                setEnglishTranslation(englishTrans);
                setSanthaliTranslation(satTrans);
                setHoTranslation(hoTrans);
                setMundariTranslation(munTrans);
                setLatency(elapsedMs);

                socket.emit('send-transcript', {
                  roomCode,
                  hindiText: recognizedHindi,
                  santhali: satTrans,
                  ho: hoTrans,
                  mundari: munTrans,
                  englishText: englishTrans,
                  text: recognizedHindi,
                  originalLang: 'hi',
                  timestamp: Date.now()
                });
              } else {
                // Fallback translation if needed
                await handleProcessHindiSpeech(recognizedHindi, captureStartTime);
              }
            } else {
              const detail = sttRes?.error ? ` (${sttRes.error})` : '';
              setStatusMessage(`आवाज़ साफ़ नहीं पहचानी गई। कृपया माइक के पास दोबारा बोलें।${detail}`);
              setTimeout(() => setStatusMessage(''), 5000);
            }
          }
        );
      } catch (err) {
        console.error('Error stopping audio:', err);
        setIsTranscribing(false);
        setStatusMessage('ऑडियो प्रोसेस करने में समस्या आई। (Error processing audio.)');
      } finally {
        isActionInProgressRef.current = false;
      }
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customText.trim()) return;
    handleProcessHindiSpeech(customText.trim());
    setCustomText('');
  };

  if (!roomCode) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative transition-colors duration-200">
        <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
          {/* Gemini Key Config in Lobby */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hasApiKey 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 animate-pulse'
            }`}
          >
            {hasApiKey ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <Key className="w-4 h-4 text-amber-600" />}
            <span>{hasApiKey ? `Gemini Active (${keyPreview})` : 'Set Gemini API Key'}</span>
          </button>
          <ThemeToggle showLabel />
        </div>

        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-slate-950/60 p-8 text-center border border-transparent dark:border-slate-800 transition-colors">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
            <Users className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 transition-colors">Teacher Mode</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 transition-colors">Start a new class lobby and share the code with your students.</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={createRoom}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white rounded-2xl text-xl font-bold transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-950/40 cursor-pointer"
            >
              Create Class Room
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-3 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Role Selection</span>
            </button>
          </div>
        </div>

        {/* Gemini API Key Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
              <button 
                onClick={() => setShowKeyModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Google Gemini API Key</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Required for high-accuracy Hindi voice recognition</p>
                </div>
              </div>

              {keySaveSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{keySaveSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveApiKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={hasApiKey ? `Key configured (${keyPreview}) - Paste new key to update` : "Paste AIzaSy... here"}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Don't have a Gemini API key?</p>
                  <p>Get a 100% free key with no credit card required:</p>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-1"
                  >
                    <span>Get Free Key from Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingKey || !apiKeyInput.trim()}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-200 dark:shadow-emerald-950/40 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSavingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>Save Key</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex flex-col md:flex-row gap-6 transition-colors duration-200">
      {/* Left Column - Main Controls */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm dark:shadow-slate-950/50 flex items-center justify-between border-2 border-emerald-100 dark:border-slate-800 flex-wrap gap-4 transition-colors">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Live Class</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 transition-colors">
              Speaking in Hindi (hi-IN) • Real-time English translation via Gemini AI
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Gemini API Key Status Badge */}
            <button
              onClick={() => setShowKeyModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                hasApiKey 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 animate-pulse hover:bg-amber-100'
              }`}
              title="Configure Google Gemini API Key"
            >
              {hasApiKey ? <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> : <Key className="w-3.5 h-3.5 text-amber-600" />}
              <span>{hasApiKey ? 'Gemini AI Active' : 'Set Gemini Key'}</span>
            </button>

            <div className="text-center">
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Room Code</p>
              <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-widest bg-emerald-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 px-4 py-2 rounded-xl transition-colors">
                {roomCode}
              </div>
            </div>

            <ThemeToggle />

            <button
              onClick={endClass}
              className="flex items-center gap-2 px-5 py-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 dark:shadow-rose-950/50 hover:shadow-xl transition-all duration-200 cursor-pointer"
              title="End this live class"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End Class</span>
            </button>
          </div>
        </div>

        {/* Microphone & Live Translation Control */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-slate-950/50 flex flex-col items-center border-2 border-slate-100 dark:border-slate-800 transition-colors">
          
          {/* Status Badge */}
          <div className="mb-4">
            {isRecording ? (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider animate-pulse">
                <Radio className="w-4 h-4" /> 🔴 Recording Voice ({recordingSeconds}s) • Tap to Finish
              </span>
            ) : isTranscribing ? (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-wider animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" /> Gemini Recognizing Hindi & Translating...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Mic className="w-4 h-4" /> Ready • Tap to Speak in Hindi
              </span>
            )}
          </div>

          {/* Big Mic Button with Dynamic Scale and Ring */}
          <button 
            onClick={toggleRecording}
            disabled={isTranscribing}
            className={`w-40 h-40 md:w-44 md:h-44 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 cursor-pointer select-none relative ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 ring-8 ring-red-300 dark:ring-red-950/70 scale-105' 
                : isTranscribing
                  ? 'bg-amber-500 opacity-80 cursor-wait'
                  : 'bg-emerald-500 hover:bg-emerald-600 ring-8 ring-emerald-50 dark:ring-emerald-950/50 hover:scale-105 active:scale-95'
            }`}
            title={isRecording ? 'Click to stop and translate your voice' : 'Click to start speaking in Hindi'}
          >
            {isTranscribing ? (
              <Loader2 className="w-16 h-16 text-white animate-spin" />
            ) : isRecording ? (
              <Square className="w-16 h-16 text-white fill-white" />
            ) : (
              <Mic className="w-16 h-16 text-white" />
            )}
          </button>

          {/* Live Audio Visualizer Waveform during Recording */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1.5 h-10 mt-5">
              {[...Array(9)].map((_, i) => {
                const waveFactor = Math.sin((i / 8) * Math.PI);
                const height = Math.max(8, Math.min(38, Math.round((audioLevel * waveFactor * 0.7) + 8)));
                return (
                  <span
                    key={i}
                    className="w-1.5 bg-red-500 rounded-full transition-all duration-75"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          )}

          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-5 transition-colors">
            {isRecording 
              ? `बोल रहे हैं... (${recordingSeconds}s)` 
              : isTranscribing 
                ? 'Gemini आवाज़ पहचान रहा है...' 
                : 'Tap to Speak in Hindi'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-center max-w-md text-sm transition-colors">
            {isRecording 
              ? 'अपना वाक्य हिंदी में बोलें, फिर अनुवाद करने के लिए दोबारा बटन दबाएं।' 
              : isTranscribing
                ? 'कृपया प्रतीक्षा करें, Google Gemini द्वारा हिंदी भाषण को संथाली, हो, मुण्डारी और अंग्रेजी में बदला जा रहा है...'
                : 'माइक बटन दबाएं और हिंदी में बोलें। छात्र इसे तुरंत अपनी-अपनी मातृभाषा में सुनेंगे।'}
          </p>

          {/* Error / Status Guidance Banner */}
          {statusMessage && (
            <div className="mt-4 px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Live Multilingual Transmission Card */}
          {(hindiTranscript || isTranslating) && (
            <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Latest Voice Transmission (Multilingual Mother Tongue Routing)
                </span>
                {latency !== null && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    {latency}ms Latency
                  </span>
                )}
              </div>

              {/* Hindi Original */}
              <div className="mb-4">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">Hindi (Teacher Spoke)</span>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  "{hindiTranscript}"
                </p>
              </div>

              {/* Simultaneous Vernacular Audio Broadcasts */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                    Live Student Feeds (Broadcast in Mother Tongue)
                  </span>
                  {isTranslating && (
                    <span className="text-xs text-amber-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Translating...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {/* Santhali */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-900/50 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black text-purple-700 dark:text-purple-300">
                        ᱥᱟᱱᱛᱟᱲᱤ (Santhali)
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-ol-chiki">
                        Ol Chiki
                      </span>
                    </div>
                    <p className="text-base font-black text-purple-900 dark:text-purple-100 font-ol-chiki">
                      {santhaliTranslation ? (typeof santhaliTranslation === 'object' ? (santhaliTranslation.text || santhaliTranslation.olChiki) : santhaliTranslation) : (isTranslating ? '...' : '')}
                    </p>
                    {santhaliTranslation?.phonetic && santhaliTranslation.phonetic !== (santhaliTranslation.text || santhaliTranslation.olChiki) && (
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                        Audio: "{santhaliTranslation.phonetic}"
                      </p>
                    )}
                  </div>

                  {/* Ho */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black text-blue-700 dark:text-blue-300">
                        𑢹𑣉𑣉 (Ho)
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        हो
                      </span>
                    </div>
                    <p className="text-base font-black text-blue-900 dark:text-blue-100 font-warang-chiti">
                      {hoTranslation ? (typeof hoTranslation === 'object' ? (hoTranslation.text || hoTranslation.native) : hoTranslation) : (isTranslating ? '...' : '')}
                    </p>
                    {hoTranslation?.phonetic && (
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                        Audio: "{hoTranslation.phonetic}"
                      </p>
                    )}
                  </div>

                  {/* Mundari */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                        मुण्डारी (Mundari)
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        मुण्डारी
                      </span>
                    </div>
                    <p className="text-base font-black text-emerald-900 dark:text-emerald-100 font-devanagari">
                      {mundariTranslation ? (typeof mundariTranslation === 'object' ? (mundariTranslation.text || mundariTranslation.native) : mundariTranslation) : (isTranslating ? '...' : '')}
                    </p>
                    {mundariTranslation?.phonetic && mundariTranslation.phonetic !== (mundariTranslation.text || mundariTranslation.native) && (
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                        Audio: "{mundariTranslation.phonetic}"
                      </p>
                    )}
                  </div>
                </div>

                {/* English Subtitle */}
                {englishTranslation && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase">
                      English Subtitle:
                    </span>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      "{englishTranslation}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Classroom Test Chips */}
          <div className="w-full max-w-2xl mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Classroom Phrases (1-Click Test)</span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Instant speech pipeline</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {QUICK_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleProcessHindiSpeech(phrase.hi)}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-xl text-left transition-all active:scale-[0.98] cursor-pointer shadow-sm group"
                >
                  <span className="block font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {phrase.hi}
                  </span>
                  <span className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    → {phrase.en}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Hindi Text Input Box */}
          <form onSubmit={handleCustomSubmit} className="w-full max-w-2xl mt-4 flex gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="या यहाँ कोई भी हिंदी वाक्य टाइप करें (उदा: ध्यान से सुनें)..."
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-medium transition-all"
            />
            <button
              type="submit"
              disabled={!customText.trim()}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed text-sm shadow-md shadow-emerald-200 dark:shadow-emerald-950/40"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Column - Side Panel */}
      <div className="w-full md:w-96 flex flex-col gap-6">
        {/* Interrupts / Doubts */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm dark:shadow-slate-950/50 border-2 border-rose-100 dark:border-slate-800 flex-1 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950/60 rounded-full flex items-center justify-center">
              <Hand className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Student Doubts</h2>
          </div>
          
          <div className="space-y-4">
            {doubts.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-center py-8">No questions right now.</p>
            ) : (
              doubts.map((doubt, idx) => (
                <div key={idx} className="bg-rose-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-rose-200 dark:border-rose-900/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-700 dark:text-rose-300">{doubt.student.name}</span>
                      {doubt.student.motherTongue && (
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 ${LANG_MAP[doubt.student.motherTongue]?.font || ''}`}>
                          {LANG_MAP[doubt.student.motherTongue]?.native || doubt.student.motherTongue}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-white dark:bg-slate-900 text-rose-500 dark:text-rose-400 rounded-lg border dark:border-rose-900/40">Raised Hand</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">They had a doubt when you said:</p>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm text-sm text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800">
                    {doubt.context && doubt.context.length > 0 ? (
                      doubt.context.map((c, i) => <p key={i}>"{c.text}"</p>)
                    ) : (
                      <p>"{doubt.student.name} asked for clarification"</p>
                    )}
                  </div>
                  <button 
                    onClick={() => setDoubts(doubts.filter((_, i) => i !== idx))}
                    className="w-full mt-3 py-2 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold rounded-xl hover:bg-rose-100 dark:hover:bg-slate-800 border border-transparent dark:border-rose-900/40 transition-colors cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm dark:shadow-slate-950/50 border-2 border-slate-100 dark:border-slate-800 h-64 overflow-y-auto transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 transition-colors">Active Students</h2>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-bold">{students.length}</span>
          </div>
          <div className="space-y-3">
            {students.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-center py-4 text-sm">Waiting for students to join...</p>
            ) : (
              students.map(s => {
                const lang = LANG_MAP[s.motherTongue] || { name: s.motherTongue, native: s.motherTongue, hindi: s.motherTongue, font: '' };
                return (
                  <div key={s.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-transparent dark:border-slate-700/60 p-3 rounded-xl transition-colors">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{s.name}</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border dark:border-slate-800 px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5">
                      <span className={`${lang.font} text-emerald-600 dark:text-emerald-400 font-bold`}>{lang.native}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">({lang.hindi})</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Gemini API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button 
              onClick={() => setShowKeyModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Google Gemini API Key</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Fast, spot-on Hindi speech recognition & translation</p>
              </div>
            </div>

            {keySaveSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{keySaveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={hasApiKey ? `Key configured (${keyPreview}) - Paste new key to update` : "Paste AIzaSy... here"}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Don't have a Gemini API key?</p>
                <p>Get a 100% free key with no credit card required:</p>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-1"
                >
                  <span>Get Free Key from Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingKey || !apiKeyInput.trim()}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-200 dark:shadow-emerald-950/40 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSavingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Save Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
