import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Users, User, Mic } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200 relative">
      {/* Theme Switcher in top-right */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle showLabel />
      </div>

      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-sky-900 dark:text-sky-200 mb-4 transition-colors">
            Classroom Translator
          </h1>
          <p className="text-xl text-sky-700 dark:text-sky-400 transition-colors">
            Choose how you want to join
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Teacher Card */}
          <button 
            onClick={() => navigate('/teacher')}
            className="flex flex-col items-center p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-slate-950/60 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-4 border-transparent hover:border-emerald-500 dark:border-slate-800 dark:hover:border-emerald-500 group cursor-pointer"
          >
            <div className="w-32 h-32 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors">
              <Users className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Teacher</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium transition-colors">Host a class in Hindi</p>
          </button>

          {/* Student Card */}
          <button 
            onClick={() => navigate('/student')}
            className="flex flex-col items-center p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-slate-950/60 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-4 border-transparent hover:border-amber-500 dark:border-slate-800 dark:hover:border-amber-500 group cursor-pointer"
          >
            <div className="w-32 h-32 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center mb-6 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60 transition-colors">
              <User className="w-16 h-16 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Student</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium transition-colors">Join in your language</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RoleSelection />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/student" element={<StudentDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
