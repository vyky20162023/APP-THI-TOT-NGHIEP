import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ExamList from './pages/exam/ExamList';
import ExamRoom from './pages/exam/ExamRoom';
import ExamResult from './pages/exam/ExamResult';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import QuestionBankManager from './pages/teacher/QuestionBankManager';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Công khai */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/exams" element={<ExamList />} />
              <Route path="/exam-result/:attemptId" element={<ExamResult />} />

              {/* Dành cho thí sinh (Đăng nhập) */}
              <Route
                path="/exam-room/:examId"
                element={
                  <ProtectedRoute>
                    <ExamRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Dành cho Giáo viên & Quản trị viên */}
              <Route
                path="/teacher-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/question-bank"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <QuestionBankManager />
                  </ProtectedRoute>
                }
              />

              {/* 404 Điều hướng về Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer chuẩn EdTech */}
          <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.jpg" 
                  alt="Logo THCS & THPT Nguyễn Thái Bình" 
                  className="w-10 h-10 object-contain rounded-xl border border-slate-200 p-0.5 bg-white shadow-xs" 
                />
                <div className="text-left">
                  <div className="font-extrabold text-slate-800 text-xs sm:text-sm">
                    TRƯỜNG THCS & THPT NGUYỄN THÁI BÌNH
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Bắc Khánh Vĩnh, Tỉnh Khánh Hòa • Khảo Thí THPT Quốc Gia &copy; 2025
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400 font-medium text-xs">
                <span>Cấu trúc Bộ GD&ĐT 2025</span>
                <span>•</span>
                <span>Render KaTeX</span>
                <span>•</span>
                <span>Supabase RLS</span>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
