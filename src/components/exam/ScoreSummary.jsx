import React from 'react';
import { Award, CheckCircle, XCircle, HelpCircle, Clock, BarChart3 } from 'lucide-react';

export default function ScoreSummary({ scoreData, timeSpentSeconds = 0, onReviewClick }) {
  if (!scoreData) return null;

  const {
    totalScore,
    maxPossibleScore,
    percentage,
    correctCount,
    wrongCount,
    unattemptedCount,
    totalQuestions,
    difficultyStats,
  } = scoreData;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins} phút ${remainingSecs} giây`;
  };

  const difficultyLabels = {
    nhan_biet: 'Nhận biết',
    thong_hieu: 'Thông hiểu',
    van_dung: 'Vận dụng',
    van_dung_cao: 'Vận dụng cao',
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md mb-8">
      {/* Top Banner: Điểm số lớn */}
      <div className="text-center pb-8 border-b border-slate-100">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-4 shadow-inner">
          <Award className="w-9 h-9" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
          Kết Quả Bài Thi Thử
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          Đạt tiêu chuẩn đánh giá năng lực tốt nghiệp THPT Quốc Gia
        </p>

        {/* Điểm số */}
        <div className="mt-5 inline-flex items-baseline gap-2 bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/60 px-6 py-3 rounded-2xl">
          <span className="text-4xl sm:text-5xl font-black text-brand-600 tracking-tight">
            {totalScore}
          </span>
          <span className="text-lg font-bold text-slate-400">
            / {maxPossibleScore} điểm
          </span>
          <span className="text-xs font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full ml-2">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Grid 4 thống kê nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-100">
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center text-emerald-600 mb-1.5">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{correctCount}</div>
          <div className="text-xs font-semibold text-slate-500">Số câu đúng</div>
        </div>

        <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center text-rose-600 mb-1.5">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-rose-700">{wrongCount}</div>
          <div className="text-xs font-semibold text-slate-500">Số câu sai</div>
        </div>

        <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center text-slate-600 mb-1.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-700">{unattemptedCount}</div>
          <div className="text-xs font-semibold text-slate-500">Chưa làm</div>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center text-indigo-600 mb-1.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-sm font-black text-indigo-700 mt-2 truncate">
            {formatTime(timeSpentSeconds)}
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-1">Thời gian làm</div>
        </div>
      </div>

      {/* Phân tích theo mức độ nhận thức (Ma trận 4 mức) */}
      <div className="pt-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-600" />
          Phân Tích Tỷ Lệ Năng Lực Nhận Thức
        </h3>

        <div className="space-y-3">
          {difficultyStats &&
            Object.entries(difficultyStats).map(([key, stat]) => {
              const label = difficultyLabels[key] || key;
              const rate = stat.max > 0 ? Math.round((stat.earned / stat.max) * 100) : 0;

              let barColor = 'bg-brand-500';
              if (key === 'nhan_biet') barColor = 'bg-emerald-500';
              if (key === 'thong_hieu') barColor = 'bg-blue-500';
              if (key === 'van_dung') barColor = 'bg-amber-500';
              if (key === 'van_dung_cao') barColor = 'bg-rose-500';

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-700">{label} ({stat.total} câu)</span>
                    <span className="text-slate-500">
                      Đạt {stat.earned.toFixed(2)} / {stat.max.toFixed(2)} đ ({rate}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-700 rounded-full`}
                      style={{ width: `${rate}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
