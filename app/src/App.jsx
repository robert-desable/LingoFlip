import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Users, User, Mic } from 'lucide-react';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-sky-900 mb-4">Classroom Translator</h1>
          <p className="text-xl text-sky-700">Choose how you want to join</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Teacher Card */}
          <button 
            onClick={() => navigate('/teacher')}
            className="flex flex-col items-center p-12 bg-white rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-4 border-transparent hover:border-emerald-500 group"
          >
            <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition-colors">
              <Users className="w-16 h-16 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">Teacher</h2>
            <p className="text-slate-500 mt-2 font-medium">Host a class in Hindi</p>
          </button>

          {/* Student Card */}
          <button 
            onClick={() => navigate('/student')}
            className="flex flex-col items-center p-12 bg-white rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-4 border-transparent hover:border-amber-500 group"
          >
            <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-amber-200 transition-colors">
              <User className="w-16 h-16 text-amber-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">Student</h2>
            <p className="text-slate-500 mt-2 font-medium">Join in your language</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
