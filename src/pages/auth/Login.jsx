import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LogIn, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      if (err.message.includes('Invalid login credentials')) {
        setErrorMsg('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!');
      } else if (err.message.includes('Email not confirmed')) {
        setErrorMsg('Email chưa được kích hoạt. Tài khoản của Thầy/Cô đã được kích hoạt trực tiếp trên hệ thống, vui lòng bấm nút "Đăng Nhập" lại ngay bây giờ!');
      } else if (err.message.includes('rate limit')) {
        setErrorMsg('Quá nhiều lần thử đăng nhập. Vui lòng đợi trong giây lát và thử lại.');
      } else {
        setErrorMsg(err.message || 'Đăng nhập không thành công. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white p-1 border-2 border-brand-200 shadow-md flex items-center justify-center mx-auto mb-3 overflow-hidden">
            <img src="/logo.jpg" alt="Logo THCS & THPT Nguyễn Thái Bình" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            Đăng Nhập Khảo Thí
          </h2>
          <p className="text-xs font-bold text-brand-600 mt-1 uppercase">
            Trường THCS & THPT Nguyễn Thái Bình
          </p>
          <p className="text-[11px] text-slate-400">
            Bắc Khánh Vĩnh — Tỉnh Khánh Hòa
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="thi.sinh@thpt.edu.vn"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Chưa có tài khoản thí sinh / giáo viên?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700 underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
