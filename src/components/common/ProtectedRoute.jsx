import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Đang tải thông tin tài khoản...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu có giới hạn Roles và vai trò hiện tại không thuộc allowedRoles
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-sm max-w-md text-center">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Không Có Quyền Truy Cập</h2>
          <p className="text-sm text-slate-600 mb-6">
            Khu vực này chỉ dành cho vai trò: <span className="font-semibold">{allowedRoles.join(', ')}</span>. Vai trò hiện tại của bạn là <span className="font-semibold text-brand-600">{role}</span>.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl transition-all"
          >
            Quay Về Trang Chủ
          </a>
        </div>
      </div>
    );
  }

  return children;
}
