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
              <div className="font-semibold text-slate-700">
                Hệ Thống Thi Thử Tốt Nghiệp THPT Quốc Gia (Lớp 12) &copy; 2025
              </div>
              <div className="flex items-center gap-4 text-slate-400 font-medium">
                <span>Chuẩn quy chế khảo thí Bộ GD&ĐT</span>
                <span>•</span>
                <span>Render Toán KaTeX</span>
                <span>•</span>
                <span>Bảo mật Supabase RLS</span>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
