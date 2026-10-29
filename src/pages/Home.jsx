import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  BarChart3, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import { THPT_SUBJECTS } from '../constants/subjects';

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubjects() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (!error && data) {
          setSubjects(data);
        }
      } catch (err) {
        console.error('Lỗi tải môn học:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSubjects();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 bg-gradient-to-b from-brand-50/70 via-white to-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Logo & School Header */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-2 border-2 border-brand-200 shadow-lg shadow-brand-500/10 hover:scale-105 transition-transform overflow-hidden mb-3">
              <img 
                src="/logo.jpg" 
                alt="Logo Trường THCS & THPT Nguyễn Thái Bình" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-800 text-xs sm:text-sm font-extrabold uppercase tracking-wide">
              Trường THCS & THPT Nguyễn Thái Bình
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
              Bắc Khánh Vĩnh — Tỉnh Khánh Hòa
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Hệ Thống Thi Thử Tốt Nghiệp <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-800">
              THPT Quốc Gia 2025
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Trải nghiệm phòng thi ảo tiêu chuẩn Bộ GD&ĐT: Tích hợp đầy đủ 3 dạng thức trắc nghiệm mới,
            chấm điểm bậc thang Đúng/Sai, công thức KaTeX sắc nét và phân tích phổ điểm năng lực.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/exams"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-brand-500/30 transition-all hover:scale-102 active:scale-98"
            >
              <BookOpen className="w-5 h-5" />
              <span>Bắt Đầu Làm Bài Ngay</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-sm sm:text-base shadow-xs transition-all hover:border-slate-400"
            >
              <GraduationCap className="w-5 h-5 text-brand-600" />
              <span>Đăng Ký Tài Khoản</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 DẠNG THỨC TRẮC NGHIỆM ĐỘT PHÁ 2025 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đáp Ứng Chuẩn Xác 3 Dạng Thức Trắc Nghiệm Mới
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Hệ thống chấm điểm tự động thông minh theo đúng quy chế ban hành của Bộ Giáo dục và Đào tạo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg mb-4">
              I
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Dạng 1: Nhiều Lựa Chọn</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Chọn 1 phương án đúng trong 4 phương án (A, B, C, D). Đánh giá chuẩn xác mức độ nhận biết và thông hiểu kiến thức nền tảng.
            </p>
            <div className="text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl inline-block">
              Chuẩn 0.25đ / câu
            </div>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-emerald-200/90 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-b from-emerald-50/20 to-white">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg mb-4">
              II
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Dạng 2: Đúng / Sai Bậc Thang</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Một câu gồm 4 ý a, b, c, d. Chấm điểm lũy tiến chính xác: Đúng 1 ý = 0.1đ; 2 ý = 0.25đ; 3 ý = 0.5đ; đúng cả 4 ý = 1.0 điểm.
            </p>
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl inline-block">
              Tối đa 1.0đ / câu (Bậc thang)
            </div>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-amber-200/90 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-b from-amber-50/20 to-white">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-lg mb-4">
              III
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Dạng 3: Trả Lời Ngắn</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Thí sinh tự điền đáp án số hoặc chuỗi ngắn vào ô trống. Đánh giá tư duy vận dụng cao và giải quyết bài toán thực tế mà không cần đoán mò.
            </p>
            <div className="text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl inline-block">
              Chuẩn 0.5đ / câu
            </div>
          </div>
        </div>
      </section>

      {/* DANH MỤC 11 MÔN THI THPT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              11 Môn Thi Tốt Nghiệp THPT
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Hệ thống ngân hàng đề thi được cập nhật liên tục từ các sở giáo dục và trường chuyên
            </p>
          </div>
          <Link
            to="/exams"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700"
          >
            <span>Xem tất cả đề thi</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {THPT_SUBJECTS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={`/exams?subject=${encodeURIComponent(item.name)}`}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-brand-500 hover:shadow-md transition-all text-center group cursor-pointer flex flex-col items-center justify-between"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">
                    {item.name}
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                    Mã: {item.code}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-brand-600 mt-2 block group-hover:translate-x-0.5 transition-transform">
                  Vào thi ngay →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* TÍNH NĂNG PHÒNG THI ẢO CHUYÊN NGHIỆP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-2 block">
              Công Nghệ Phòng Thi Ảo
            </span>
            <h3 className="text-2xl sm:text-3xl font-black mb-4">
              Trải Nghiệm Thi Trực Tuyến Như Trong Phòng Thi Thật
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Bảo đảm công bằng và tính kỷ luật với hệ thống đếm ngược chính xác, lưu tiến độ tức thì (Auto-Save) hai tầng chống rớt mạng, và cảnh báo vi phạm khi rời tab.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-white">Tự Động Lưu Tiến Độ (Auto-Save)</div>
                  <div className="text-xs text-slate-400">Đồng bộ tức thời LocalStorage & Supabase, không lo mất điện hay rớt mạng.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-white">Đếm Ngược Thời Gian Thực</div>
                  <div className="text-xs text-slate-400">Cảnh báo thị giác khi còn 5 phút cuối và tự động nộp bài khi hết giờ.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-white">Giám Sát Rời Màn Hình</div>
                  <div className="text-xs text-slate-400">Ghi log số lần chuyển tab (Tab-Switching) và nhắc nhở tập trung bài làm.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-white">Phổ Điểm & Lời Giải KaTeX</div>
                  <div className="text-xs text-slate-400">Xem lại bài thi kèm lời giải chi tiết công thức Toán/Lý/Hóa mượt mà.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
