import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Users, Mic, Square, Hand, AlertCircle } from 'lucide-react';
import { processAudioPipeline } from '../services/ai4bharat';

const socket = io('http://localhost:3001');

function TeacherDashboard() {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Teacher Mode</h1>
          <p className="text-slate-500 mb-8">Start a new class lobby and share the code with your students.</p>
          <button 
            onClick={createRoom}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xl font-bold transition-colors shadow-lg shadow-emerald-200"
          >
            Create Class Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col md:flex-row gap-6">
      {/* Left Column - Main Controls */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex items-center justify-between border-2 border-emerald-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Live Class</h1>
            <p className="text-slate-500">Speaking in Hindi</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Room Code</p>
            <div className="text-4xl font-black text-emerald-600 tracking-widest bg-emerald-50 px-4 py-2 rounded-xl">
              {roomCode}
            </div>
          </div>
        </div>

        {/* Microphone Control */}
        <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center border-2 border-slate-100">
          <button 
            onClick={toggleRecording}
            className={`w-48 h-48 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-8 ring-red-200' 
                : 'bg-emerald-500 hover:bg-emerald-600 ring-8 ring-emerald-50'
            }`}
          >
            {isRecording ? <Square className="w-20 h-20 text-white fill-white" /> : <Mic className="w-20 h-20 text-white" />}
          </button>
          <h2 className="text-2xl font-bold text-slate-800 mt-8">
            {isRecording ? 'Transmitting Live...' : 'Tap to Speak'}
          </h2>
          <p className="text-slate-500 mt-2 text-center max-w-md">
            {isRecording ? 'Your voice is being translated and sent to students in real-time.' : 'When you speak, students will hear the translation in their mother tongue.'}
          </p>

          {transcript && (
            <div className="mt-8 p-4 bg-slate-50 rounded-xl w-full max-w-2xl text-center">
              <p className="text-sm text-slate-400 font-semibold mb-1">Latest Transcript (Hindi)</p>
              <p className="text-lg text-slate-700">{transcript}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Side Panel */}
      <div className="w-full md:w-96 flex flex-col gap-6">
        {/* Interrupts / Doubts */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-rose-100 flex-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <Hand className="w-5 h-5 text-rose-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Student Doubts</h2>
          </div>
          
          <div className="space-y-4">
            {doubts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No questions right now.</p>
            ) : (
              doubts.map((doubt, idx) => (
                <div key={idx} className="bg-rose-50 rounded-2xl p-4 border border-rose-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-rose-700">{doubt.student.name}</span>
                    <span className="text-xs font-bold px-2 py-1 bg-white text-rose-500 rounded-lg">Raised Hand</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">They had a doubt when you said:</p>
                  <div className="bg-white p-3 rounded-xl shadow-sm text-sm text-slate-700 border border-slate-100">
                    {doubt.context.map((c, i) => <p key={i}>"{c.text}"</p>)}
                  </div>
                  <button 
                    onClick={() => setDoubts(doubts.filter((_, i) => i !== idx))}
                    className="w-full mt-3 py-2 bg-white text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors"
                  >
                    Mark Resolved
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-slate-100 h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Active Students</h2>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold">{students.length}</span>
          </div>
          <div className="space-y-3">
            {students.length === 0 ? (
              <p className="text-slate-400 text-center py-4 text-sm">Waiting for students to join...</p>
            ) : (
              students.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                  <span className="font-bold text-slate-700">{s.name}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm">{s.motherTongue}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
