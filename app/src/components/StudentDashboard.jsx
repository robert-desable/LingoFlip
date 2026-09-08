import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Hand, Volume2, UserCheck, AlertTriangle } from 'lucide-react';
import { processAudioPipeline } from '../services/ai4bharat';

const socket = io('http://localhost:3001');

const LANGUAGES = [
  { code: 'sat', name: 'Santhali', color: 'bg-purple-500' },
  { code: 'mun', name: 'Mundari', color: 'bg-indigo-500' },
  { code: 'hoc', name: 'Ho', color: 'bg-blue-500' }
];

function StudentDashboard() {
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
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-sky-900 mb-2">Join Class</h1>
            <p className="text-sky-600 font-medium">Enter details to start learning</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Room Code</label>
              <input 
                type="number" 
                className="w-full text-center text-4xl font-black tracking-[0.5em] text-sky-900 bg-sky-50 border-2 border-sky-100 rounded-2xl py-4 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="1234"
                maxLength={4}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
              <input 
                type="text" 
                className="w-full text-lg font-bold text-slate-800 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:outline-none focus:border-sky-400 transition-all"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">My Language</label>
              <div className="grid grid-cols-3 gap-3">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setMotherTongue(lang.code)}
                    className={`py-3 rounded-xl font-bold transition-all border-2 ${
                      motherTongue === lang.code 
                        ? `${lang.color} text-white shadow-lg border-transparent scale-105` 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={joinRoom}
              disabled={!roomCode || !studentName}
              className="w-full py-4 mt-4 bg-sky-500 disabled:bg-sky-200 hover:bg-sky-600 text-white rounded-2xl text-xl font-bold transition-colors shadow-lg shadow-sky-200 flex items-center justify-center gap-2"
            >
              <UserCheck className="w-6 h-6" />
              Join Classroom
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Class Interface (Highly expressive, minimal clutter for students)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm flex items-center justify-between border-2 border-slate-100 mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center font-black text-xl">
            {motherTongue.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Teacher: {teacherName}</h2>
            <p className="text-slate-500 font-medium">Live Translation Active</p>
          </div>
        </div>
      </div>

      {/* Main Content Area - Large Transcript Display */}
      <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border-2 border-slate-100 flex flex-col items-center justify-center mb-6 relative overflow-hidden">
        {/* Animated speaking indicator */}
        <div className="absolute top-8 right-8 flex items-center gap-2 text-sky-500 font-bold bg-sky-50 px-4 py-2 rounded-full">
          <Volume2 className="w-5 h-5 animate-pulse" />
          Listening...
        </div>

        <div className="max-w-3xl w-full text-center">
          {incomingText ? (
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">
              {incomingText}
            </h1>
          ) : (
            <div className="text-slate-300 flex flex-col items-center">
              <Volume2 className="w-24 h-24 mb-6 opacity-50" />
              <h1 className="text-3xl font-bold">Waiting for teacher to speak...</h1>
            </div>
          )}
        </div>
      </div>

      {/* The Massive Interrupt Button */}
      <div className="shrink-0">
        <button 
          onClick={raiseDoubt}
          disabled={isDoubtRaised}
          className={`w-full py-8 md:py-12 rounded-3xl shadow-xl flex items-center justify-center gap-6 transition-all duration-300 border-4 ${
            isDoubtRaised 
              ? 'bg-orange-100 border-orange-300 text-orange-600' 
              : 'bg-rose-500 hover:bg-rose-600 hover:scale-[1.02] border-transparent text-white shadow-rose-200'
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
