import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Users, Mic, Square, Hand, AlertCircle, PhoneOff, ArrowLeft, Languages } from 'lucide-react';
import { AdultTeacherIcon, ChildStudentIcon } from './icons/RoleIcons';
import { processAudioPipeline } from '../services/ai4bharat';
import ThemeToggle from './ThemeToggle';

const socket = io('http://localhost:3001');

const LANG_MAP = {
  sat: { name: 'Santhali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', hindi: 'संथाली', font: 'font-ol-chiki' },
  hoc: { name: 'Ho', native: '𑢹𑣉𑣉', hindi: 'हो', font: 'font-warang-chiti' },
  mun: { name: 'Mundari', native: 'मुण्डारी', hindi: 'मुण्डारी', font: 'font-devanagari' }
};

function TeacherDashboard() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(null);
  const [students, setStudents] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [doubts, setDoubts] = useState([]);
  const [teacherLang, setTeacherLang] = useState('hi'); // 'hi' or 'en'

  const teacherLangRef = useRef(teacherLang);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    teacherLangRef.current = teacherLang;
  }, [teacherLang]);

  useEffect(() => {
    socket.on('student-joined', (student) => {
      setStudents((prev) => [...prev, student]);
    });

    socket.on('student-left', (student) => {
      setStudents((prev) => prev.filter(s => s.id !== student.id));
    });

    socket.on('student-doubt', (data) => {
      setDoubts((prev) => [...prev, data]);
      // Play a notification sound or flash screen here
    });

    return () => {
      socket.off('student-joined');
      socket.off('student-left');
      socket.off('student-doubt');
    };
  }, []);

  const switchLanguage = (newLang) => {
    if (newLang === teacherLang) return;
    setTeacherLang(newLang);
    teacherLangRef.current = newLang;
    if (roomCode) {
      socket.emit('update-room-language', { roomCode, language: newLang });
    }
  };

  const createRoom = () => {
    socket.emit('create-room', { teacherName: 'Teacher', language: teacherLang }, (res) => {
      if (res.success) {
        setRoomCode(res.roomCode);
      }
    });
  };

  const endClass = () => {
    const confirmEnd = window.confirm(
      'Are you sure you want to end this live class? All connected students will be disconnected.'
    );
    if (!confirmEnd) return;

    isRecordingRef.current = false;
    if (isRecording) {
      setIsRecording(false);
    }

    socket.emit('end-room', { roomCode }, (res) => {
      console.log('Class ended response:', res);
    });

    // Reset local room state to bring teacher back to lobby
    setRoomCode(null);
    setStudents([]);
    setTranscript('');
    setDoubts([]);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      isRecordingRef.current = true;
      simulateTranscription();
    } else {
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const simulateTranscription = () => {
    setTimeout(() => {
      if (!isRecordingRef.current) return;
      const currentLang = teacherLangRef.current;
      const text = currentLang === 'en'
        ? "Hello students, today we will learn about science and nature."
        : "नमस्ते बच्चों, आज हम विज्ञान और प्रकृति के बारे में सीखेंगे।";
      setTranscript(text);
      socket.emit('send-transcript', {
        roomCode,
        text,
        originalLang: currentLang
      });
      simulateTranscription();
    }, 5000);
  };

  if (!roomCode) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative transition-colors duration-200">
        {/* Theme Switcher top right */}
        <div className="absolute top-6 right-6 z-10">
          <ThemeToggle showLabel />
        </div>

        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-slate-950/60 p-8 text-center border border-transparent dark:border-slate-800 transition-colors">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors shadow-sm">
            <AdultTeacherIcon className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 transition-colors">Teacher Mode</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 transition-colors">Start a new class lobby and share the code with your students.</p>
          
          {/* Pre-lobby Speaking Language Selection */}
          <div className="mb-6 text-left">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-center">
              Choose Speaking Language
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTeacherLang('hi')}
                className={`py-2 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  teacherLang === 'hi'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🇮🇳</span>
                <span>हिन्दी (Hindi)</span>
              </button>
              <button
                type="button"
                onClick={() => setTeacherLang('en')}
                className={`py-2 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  teacherLang === 'en'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🌐</span>
                <span>English</span>
              </button>
            </div>
          </div>

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Live Class</h1>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Room
              </span>
            </div>

            {/* In-lobby Speaking Language Switcher */}
            <div className="mt-3 flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" />
                <span>Speaking In:</span>
              </span>
              
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-inner">
                <button
                  type="button"
                  onClick={() => switchLanguage('hi')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    teacherLang === 'hi'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Switch speaking language to Hindi"
                >
                  <span>🇮🇳</span>
                  <span>हिन्दी (Hindi)</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchLanguage('en')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    teacherLang === 'en'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Switch speaking language to English"
                >
                  <span>🌐</span>
                  <span>English</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
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

        {/* Microphone Control */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm dark:shadow-slate-950/50 flex flex-col items-center justify-center border-2 border-slate-100 dark:border-slate-800 transition-colors">
          <button 
            onClick={toggleRecording}
            className={`w-48 h-48 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-8 ring-red-200 dark:ring-red-950/60' 
                : 'bg-emerald-500 hover:bg-emerald-600 ring-8 ring-emerald-50 dark:ring-emerald-950/50'
            }`}
          >
            {isRecording ? <Square className="w-20 h-20 text-white fill-white" /> : <Mic className="w-20 h-20 text-white" />}
          </button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-8 transition-colors">
            {isRecording ? 'Transmitting Live...' : 'Tap to Speak'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center max-w-md transition-colors">
            {isRecording 
              ? `Your voice (${teacherLang === 'en' ? 'English' : 'Hindi'}) is being translated and sent to students in real-time.` 
              : `When you speak in ${teacherLang === 'en' ? 'English' : 'Hindi'}, students will receive translations in their tribal mother tongue.`}
          </p>

          {transcript && (
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/80 border border-transparent dark:border-slate-700 rounded-xl w-full max-w-2xl text-center transition-colors">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-sm text-slate-400 dark:text-slate-400 font-semibold">
                  Latest Transcript
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {teacherLang === 'en' ? 'English' : 'हिन्दी (Hindi)'}
                </span>
              </div>
              <p className="text-lg text-slate-700 dark:text-slate-100">{transcript}</p>
            </div>
          )}
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
                    {doubt.context.map((c, i) => <p key={i}>"{c.text}"</p>)}
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
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                        <ChildStudentIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={1.8} />
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{s.name}</span>
                    </div>
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
    </div>
  );
}

export default TeacherDashboard;
