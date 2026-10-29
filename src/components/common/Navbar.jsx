import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, 
  BookOpen, 
  LayoutDashboard, 
  Database, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Menu, 
  X, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function Navbar() {
  const { user, profile, role, signOut, isTeacher, isSupabaseConfigured } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const roleBadgeMap = {
    admin: { label: 'Quản trị viên', bg: 'bg-rose-100 text-rose-700 border-rose-200' },
    teacher: { label: 'Giáo viên', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    student: { label: 'Học sinh', bg: 'bg-brand-100 text-brand-700 border-brand-200' },
  };

  const badge = roleBadgeMap[role] || roleBadgeMap.student;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {!isSupabaseConfigured && (
        <div className="bg-amber-500 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Vui lòng điền <strong>VITE_SUPABASE_URL</strong> và <strong>VITE_SUPABASE_ANON_KEY</strong> vào file <code>.env</code> để kết nối Database thật!</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-white p-0.5 border border-slate-200 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                <img 
                  src="/logo.jpg" 
                  alt="Logo Trường THCS & THPT Nguyễn Thái Bình" 
                  className="w-full h-full object-contain" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }} 
                />
                <GraduationCap className="w-6 h-6 hidden text-brand-600" />
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm md:text-base tracking-tight text-slate-900 flex items-center gap-1.5 uppercase">
                  THCS & THPT Nguyễn Thái Bình
                </span>
                <span className="block text-[10px] sm:text-[11px] font-bold text-brand-600 truncate -mt-0.5">
                  Bắc Khánh Vĩnh, Khánh Hòa • Kỳ Thi THPT 2025
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/') 
                  ? 'bg-brand-50 text-brand-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Trang Chủ
            </Link>

            <Link
              to="/exams"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/exams') 
                  ? 'bg-brand-50 text-brand-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Đề Thi 11 Môn
            </Link>

            {user && (
              <Link
                to="/student-dashboard"
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive('/student-dashboard') 
                    ? 'bg-brand-50 text-brand-700' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Tiến Độ Ôn Luyện
              </Link>
            )}

            {isTeacher && (
              <>
                <Link
                  to="/teacher-dashboard"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive('/teacher-dashboard') 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Báo Cáo Phổ Điểm
                </Link>
                <Link
                  to="/question-bank"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive('/question-bank') 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Database className="w-4 h-4 text-emerald-600" />
                  Ngân Hàng Câu Hỏi
                </Link>
              </>
            )}
          </nav>

          {/* User Auth Buttons / Profile */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-800 leading-tight">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  title="Đăng xuất"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-sm shadow-brand-500/20 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            Trang Chủ
          </Link>
          <Link
            to="/exams"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            Đề Thi 11 Môn
          </Link>

          {user && (
            <Link
              to="/student-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              Tiến Độ Ôn Luyện
            </Link>
          )}

          {isTeacher && (
            <>
              <Link
                to="/teacher-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-emerald-700 hover:bg-emerald-50"
              >
                Báo Cáo Phổ Điểm
              </Link>
              <Link
                to="/question-bank"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-emerald-700 hover:bg-emerald-50"
              >
                Ngân Hàng Câu Hỏi
              </Link>
            </>
          )}

          <div className="pt-4 border-t border-slate-200">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{profile?.full_name || user.email}</div>
                  <div className="text-xs text-slate-500">{badge.label}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-sm font-semibold text-rose-600 bg-rose-50 rounded-lg"
                >
                  Đăng Xuất
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
                >
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
