import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Users, Mic, Square, Hand, AlertCircle, PhoneOff, ArrowLeft } from 'lucide-react';
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

  const createRoom = () => {
    socket.emit('create-room', { teacherName: 'Teacher', language: 'hi' }, (res) => {
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
      // In a real implementation, we would use MediaRecorder here
      // to capture audio chunks and send them to the AI4Bharat STT API.
      // For boilerplate, we'll simulate a transcript being sent.
      simulateTranscription();
    } else {
      setIsRecording(false);
    }
  };

  const simulateTranscription = () => {
    // Simulated transcript payload
    setTimeout(() => {
      if (!isRecording) return;
      const text = "नमस्ते, आज हम विज्ञान के बारे में सीखेंगे। (Hello, today we will learn about science.)";
      setTranscript(text);
      socket.emit('send-transcript', {
        roomCode,
        text,
        originalLang: 'hi'
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
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Live Class</h1>
            <p className="text-slate-500 dark:text-slate-400 transition-colors">Speaking in Hindi</p>
          </div>

          <div className="flex items-center gap-4">
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
            {isRecording ? 'Your voice is being translated and sent to students in real-time.' : 'When you speak, students will hear the translation in their mother tongue.'}
          </p>

          {transcript && (
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/80 border border-transparent dark:border-slate-700 rounded-xl w-full max-w-2xl text-center transition-colors">
              <p className="text-sm text-slate-400 dark:text-slate-400 font-semibold mb-1">Latest Transcript (Hindi)</p>
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
    </div>
  );
}

export default TeacherDashboard;
