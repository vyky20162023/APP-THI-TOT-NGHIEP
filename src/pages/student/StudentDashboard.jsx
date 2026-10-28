import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { 
  Award, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Target,
  BarChart2
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weakTopics, setWeakTopics] = useState([]);

  useEffect(() => {
    async function loadStudentStats() {
      if (!isSupabaseConfigured || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Tải danh sách bài thi đã hoàn thành của học sinh
        const { data: attemptData, error: attemptErr } = await supabase
          .from('exam_attempts')
          .select(`
            id,
            total_score,
            time_spent_seconds,
            submitted_at,
            violation_count,
            exams (
              id,
              title,
              subjects (name, code)
            )
          `)
          .eq('student_id', user.id)
          .eq('status', 'completed')
          .order('submitted_at', { ascending: false });

        if (!attemptErr && attemptData) {
          setAttempts(attemptData);

          // 2. Phân tích các câu hỏi sai nhiều để phát hiện lỗ hổng kiến thức
          const attemptIds = attemptData.slice(0, 10).map((a) => a.id);
          if (attemptIds.length > 0) {
            const { data: wrongAnswers } = await supabase
              .from('exam_answers')
              .select(`
                question_id,
                questions (
                  id,
                  type,
                  difficulty,
                  content,
                  subjects (name)
                )
              `)
              .in('attempt_id', attemptIds)
              .eq('is_correct', false);

            if (wrongAnswers) {
              const topicCounts = {};
              wrongAnswers.forEach((wa) => {
                const sub = wa.questions?.subjects?.name || 'Môn học';
                const diff = wa.questions?.difficulty || 'van_dung';
                const key = `${sub} - Mức độ: ${diff === 'van_dung_cao' ? 'Vận dụng cao' : diff === 'van_dung' ? 'Vận dụng' : 'Thông hiểu'}`;
                topicCounts[key] = (topicCounts[key] || 0) + 1;
              });

              const sortedTopics = Object.entries(topicCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

              setWeakTopics(sortedTopics);
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải bảng điều khiển học sinh:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStudentStats();
  }, [user]);

  // Thống kê tổng hợp
  const totalTests = attempts.length;
  const avgScore = totalTests > 0
    ? (attempts.reduce((sum, a) => sum + Number(a.total_score || 0), 0) / totalTests).toFixed(2)
    : '0.00';
  const highestScore = totalTests > 0
    ? Math.max(...attempts.map((a) => Number(a.total_score || 0))).toFixed(2)
    : '0.00';
  const totalMinutes = Math.round(
    attempts.reduce((sum, a) => sum + Number(a.time_spent_seconds || 0), 0) / 60
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header chào mừng */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Bảng Tiến Độ Ôn Luyện Của Bạn
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Xin chào, <strong className="text-brand-600">{profile?.full_name || user?.email}</strong> ({profile?.school_name || 'Học sinh lớp 12'})
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <>
          {/* 4 Card Thống Kê Tổng Quan */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalTests}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Số đề đã luyện</div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">{avgScore}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Điểm trung bình</div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600">{highestScore}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Điểm cao nhất</div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600">{totalMinutes}p</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Tổng thời gian thi</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lịch sử thi & Biểu đồ tiến độ (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Biến thiên điểm số */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs">
                <h3 className="font-extrabold text-base text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-brand-600" />
                  Biến Thiên Điểm Số Qua Các Đề Gần Đây
                </h3>

                {attempts.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    Bạn chưa thi đề nào. Hãy bắt đầu làm bài để theo dõi sự tiến bộ!
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {attempts.slice(0, 6).map((item, idx) => {
                      const score = Number(item.total_score || 0);
                      const percent = Math.min(100, Math.round((score / 10) * 100));

                      return (
                        <div key={item.id} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-slate-800 line-clamp-1 max-w-xs">
                              {item.exams?.title || 'Đề thi thử'}
                            </span>
                            <span className="text-brand-600 font-bold">{score} / 10 đ</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bảng danh sách bài thi gần đây */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
                <h3 className="font-extrabold text-base text-slate-900 mb-4">
                  Lịch Sử Các Lần Làm Bài
                </h3>

                {attempts.length === 0 ? (
                  <EmptyState
                    title="Chưa có lịch sử làm bài"
                    description="Hãy làm bài thi đầu tiên của bạn để xem kết quả và lời giải KaTeX."
                    actionLabel="Xem danh sách đề thi"
                    onAction={() => (window.location.href = '/exams')}
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {attempts.map((item) => (
                      <div
                        key={item.id}
                        className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors rounded-xl px-2"
                      >
                        <div>
                          <div className="font-bold text-sm text-slate-800">
                            {item.exams?.title || 'Đề thi'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(item.submitted_at).toLocaleString('vi-VN')}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-base font-black text-brand-600">
                              {item.total_score} đ
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {Math.round((item.time_spent_seconds || 0) / 60)} phút
                            </div>
                          </div>

                          <Link
                            to={`/exam-result/${item.id}`}
                            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
                            title="Xem chi tiết lời giải"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cột Gợi Ý Kiến Thức Yếu (1/3) */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-amber-500/10 via-white to-slate-50 rounded-3xl p-6 border border-amber-200 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Phần Kiến Thức Cần Cải Thiện
                  </h3>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Dựa trên phân tích các câu hỏi bạn đã làm sai trong các lượt thi gần nhất:
                </p>

                {weakTopics.length === 0 ? (
                  <div className="text-xs text-emerald-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Rất tốt! Chưa phát hiện lỗ hổng kiến thức nghiêm trọng nào.</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {weakTopics.map((topic, i) => (
                      <div
                        key={i}
                        className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-800">{topic.name}</span>
                        </div>
                        <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full shrink-0">
                          {topic.count} lần sai
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-amber-200/60">
                  <Link
                    to="/exams"
                    className="block text-center py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Luyện Đề Bù Đắp Kiến Thức
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
