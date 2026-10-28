import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, UserPlus, Lock, Mail, User, School, AlertCircle, ArrowRight } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [role, setRole] = useState('student');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự để đảm bảo bảo mật.');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, {
        full_name: fullName,
        role: role,
        school_name: schoolName,
      });

      setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/exams');
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/25">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Tạo Tài Khoản Mới
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gia nhập nền tảng ôn thi tốt nghiệp THPT Quốc Gia 2025
          </p>
        </div>

        {/* Thông báo lỗi / thành công */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 text-center">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Lựa chọn vai trò (Role Selector) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Vai Trò Tham Gia
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  role === 'student'
                    ? 'bg-brand-50 text-brand-700 border-brand-500 ring-1 ring-brand-500'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🎓 Học Sinh (Lớp 12)
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  role === 'teacher'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                👨‍🏫 Giáo Viên / Quản Trị
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Họ và Tên
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full pl-11 pr-4 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Trường THPT
            </label>
            <div className="relative">
              <School className="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="THPT Chuyên Lê Hồng Phong"
                className="w-full pl-11 pr-4 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-11 pr-4 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mật khẩu (ít nhất 6 ký tự)
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98 mt-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Hoàn Tất Đăng Ký</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
