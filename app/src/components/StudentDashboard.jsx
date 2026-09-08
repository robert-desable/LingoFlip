import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { Hand, Volume2, UserCheck, AlertTriangle, ArrowLeft, LogOut } from 'lucide-react';
import { processAudioPipeline } from '../services/ai4bharat';
import ThemeToggle from './ThemeToggle';

const socket = io('http://localhost:3001');

const LANGUAGES = [
  { code: 'sat', name: 'Santhali', color: 'bg-purple-500' },
  { code: 'mun', name: 'Mundari', color: 'bg-indigo-500' },
  { code: 'hoc', name: 'Ho', color: 'bg-blue-500' }
];

function StudentDashboard() {
  const navigate = useNavigate();
  const [step, setStep] = useState('join'); // 'join' -> 'class'
  const [roomCode, setRoomCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [motherTongue, setMotherTongue] = useState('sat');
  const [teacherName, setTeacherName] = useState('');
  
  const [incomingText, setIncomingText] = useState('');
  const [isDoubtRaised, setIsDoubtRaised] = useState(false);

  useEffect(() => {
    socket.on('receive-transcript', async (transcript) => {
      // In a real implementation, we would call the AI4Bharat API here
      // to translate the text to the student's mother tongue and play TTS.
      // const translated = await processAudioPipeline(...);
      
      // Simulate translation delay
      setIncomingText(`[Translating...] ${transcript.text}`);
      
      setTimeout(() => {
        // Simulated translated text
        setIncomingText(`(Translated to ${motherTongue}): ${transcript.text}`);
        // Play TTS audio here
      }, 1000);
    });

    socket.on('teacher-disconnected', () => {
      alert('Teacher has ended the class.');
      setIncomingText('');
      setIsDoubtRaised(false);
      setStep('join');
    });

    return () => {
      socket.off('receive-transcript');
      socket.off('teacher-disconnected');
    };
  }, [motherTongue]);

  const joinRoom = () => {
    if (!roomCode || !studentName) return;
    
    socket.emit('join-room', { roomCode, studentName, motherTongue }, (res) => {
      if (res.success) {
        setTeacherName(res.roomDetails.teacherName);
        setStep('class');
      } else {
        alert('Room not found! Please check the code.');
      }
    });
  };

  const raiseDoubt = () => {
    setIsDoubtRaised(true);
    socket.emit('raise-doubt', { roomCode });
    
    // Reset doubt status after a few seconds
    setTimeout(() => {
      setIsDoubtRaised(false);
    }, 5000);
  };

  if (step === 'join') {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-slate-950 flex items-center justify-center p-4 relative transition-colors duration-200">
        {/* Theme Switcher in top right */}
        <div className="absolute top-6 right-6 z-10">
          <ThemeToggle showLabel />
        </div>

        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-slate-950/60 p-8 border border-transparent dark:border-slate-800 transition-colors">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-sky-900 dark:text-sky-300 mb-2 transition-colors">Join Class</h1>
            <p className="text-sky-600 dark:text-sky-400 font-medium transition-colors">Enter details to start learning</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Room Code</label>
              <input 
                type="number" 
                className="w-full text-center text-4xl font-black tracking-[0.5em] text-sky-900 dark:text-sky-300 bg-sky-50 dark:bg-slate-800/80 border-2 border-sky-100 dark:border-slate-700 rounded-2xl py-4 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/40 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="1234"
                maxLength={4}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">Your Name</label>
              <input 
                type="text" 
                className="w-full text-lg font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors">My Language</label>
              <div className="grid grid-cols-3 gap-3">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setMotherTongue(lang.code)}
                    className={`py-3 rounded-xl font-bold transition-all border-2 cursor-pointer ${
                      motherTongue === lang.code 
                        ? `${lang.color} text-white shadow-lg border-transparent scale-105` 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <button 
                onClick={joinRoom}
                disabled={!roomCode || !studentName}
                className="w-full py-4 bg-sky-500 disabled:bg-sky-200 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 hover:bg-sky-600 text-white rounded-2xl text-xl font-bold transition-colors shadow-lg shadow-sky-200 dark:shadow-sky-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <UserCheck className="w-6 h-6" />
                Join Classroom
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
      </div>
    );
  }

  // Class Interface (Highly expressive, minimal clutter for students)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col p-4 md:p-8 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm dark:shadow-slate-950/50 flex items-center justify-between border-2 border-slate-100 dark:border-slate-800 mb-6 shrink-0 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-transparent dark:border-sky-900/40 rounded-2xl flex items-center justify-center font-black text-xl transition-colors">
            {motherTongue.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Teacher: {teacherName}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Live Translation Active</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to leave the class?')) {
                setStep('join');
                setIncomingText('');
                setIsDoubtRaised(false);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 font-semibold rounded-xl border border-transparent dark:border-slate-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Class</span>
          </button>
        </div>
      </div>

      {/* Main Content Area - Large Transcript Display */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm dark:shadow-slate-950/50 border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center mb-6 relative overflow-hidden transition-colors">
        {/* Animated speaking indicator */}
        <div className="absolute top-8 right-8 flex items-center gap-2 text-sky-500 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/60 border border-transparent dark:border-sky-900/40 px-4 py-2 rounded-full transition-colors">
          <Volume2 className="w-5 h-5 animate-pulse" />
          Listening...
        </div>

        <div className="max-w-3xl w-full text-center">
          {incomingText ? (
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 leading-tight transition-colors">
              {incomingText}
            </h1>
          ) : (
            <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center transition-colors">
              <Volume2 className="w-24 h-24 mb-6 opacity-50" />
              <h1 className="text-3xl font-bold text-slate-400 dark:text-slate-600">Waiting for teacher to speak...</h1>
            </div>
          )}
        </div>
      </div>

      {/* The Massive Interrupt Button */}
      <div className="shrink-0">
        <button 
          onClick={raiseDoubt}
          disabled={isDoubtRaised}
          className={`w-full py-8 md:py-12 rounded-3xl shadow-xl flex items-center justify-center gap-6 transition-all duration-300 border-4 cursor-pointer ${
            isDoubtRaised 
              ? 'bg-orange-100 dark:bg-orange-950/60 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-300' 
              : 'bg-rose-500 hover:bg-rose-600 hover:scale-[1.02] border-transparent text-white shadow-rose-200 dark:shadow-rose-950/50'
          }`}
        >
          {isDoubtRaised ? (
            <>
              <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 animate-pulse" />
              <span className="text-3xl md:text-5xl font-black">Teacher Notified</span>
            </>
          ) : (
            <>
              <Hand className="w-12 h-12 md:w-16 md:h-16" />
              <span className="text-3xl md:text-5xl font-black">I Have a Doubt!</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default StudentDashboard;
