import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  Download, 
  Users, 
  AlertOctagon, 
  FileSpreadsheet, 
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';

export default function TeacherDashboard() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('all');
  const [attempts, setAttempts] = useState([]);
  const [hardestQuestions, setHardestQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Tải danh sách đề thi mà giáo viên quản lý
  useEffect(() => {
    async function fetchExams() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('id, title, duration_minutes, subjects(name)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setExams(data);
          if (data.length > 0) {
            setSelectedExamId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải đề thi:', err);
      }
    }
    fetchExams();
  }, []);

  // 2. Tải số liệu thi thực tế theo đề được chọn
  useEffect(() => {
    async function fetchAnalytics() {
      if (!isSupabaseConfigured || !selectedExamId) return;

      try {
        setLoading(true);

        let query = supabase
          .from('exam_attempts')
          .select(`
            id,
            exam_id,
            total_score,
            time_spent_seconds,
            violation_count,
            submitted_at,
            status,
            profiles (
              full_name,
              email,
              school_name
            ),
            exams (
              title
            )
          `)
          .eq('status', 'completed')
          .order('submitted_at', { ascending: false });

        if (selectedExamId !== 'all') {
          query = query.eq('exam_id', selectedExamId);
        }

        const { data: attemptData, error: attemptErr } = await query;

        if (!attemptErr && attemptData) {
          setAttempts(attemptData);

          // Phân tích câu hỏi có tỷ lệ làm sai cao nhất
          const attemptIds = attemptData.map((a) => a.id);
          if (attemptIds.length > 0) {
            const { data: answerStats } = await supabase
              .from('exam_answers')
              .select(`
                question_id,
                is_correct,
                questions (
                  id,
                  type,
                  content,
                  difficulty
                )
              `)
              .in('attempt_id', attemptIds);

            if (answerStats) {
              const qMap = {};
              answerStats.forEach((ans) => {
                const qId = ans.question_id;
                if (!qMap[qId]) {
                  qMap[qId] = {
                    question: ans.questions,
                    total: 0,
                    wrong: 0,
                  };
                }
                qMap[qId].total += 1;
                if (!ans.is_correct) {
                  qMap[qId].wrong += 1;
                }
              });

              const hardest = Object.values(qMap)
                .map((item) => ({
                  ...item,
                  failRate: item.total > 0 ? Math.round((item.wrong / item.total) * 100) : 0,
                }))
                .filter((item) => item.total > 0 && item.question)
                .sort((a, b) => b.failRate - a.failRate)
                .slice(0, 5);

              setHardestQuestions(hardest);
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải phân tích:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedExamId]);

  // 3. Tính toán phổ điểm (Histogram 10 khoảng: 0-1, 1-2, ... 9-10)
  const scoreBuckets = [
    { label: '0 - 1', min: 0, max: 1, count: 0 },
    { label: '1 - 2', min: 1, max: 2, count: 0 },
    { label: '2 - 3', min: 2, max: 3, count: 0 },
    { label: '3 - 4', min: 3, max: 4, count: 0 },
    { label: '4 - 5', min: 4, max: 5, count: 0 },
    { label: '5 - 6', min: 5, max: 6, count: 0 },
    { label: '6 - 7', min: 6, max: 7, count: 0 },
    { label: '7 - 8', min: 7, max: 8, count: 0 },
    { label: '8 - 9', min: 8, max: 9, count: 0 },
    { label: '9 - 10', min: 9, max: 10.01, count: 0 },
  ];

  attempts.forEach((a) => {
    const s = Number(a.total_score || 0);
    const bucket = scoreBuckets.find((b) => s >= b.min && s < b.max);
    if (bucket) {
      bucket.count += 1;
    }
  });

  const maxBucketCount = Math.max(...scoreBuckets.map((b) => b.count), 1);

  // 4. Xuất danh sách điểm ra file Excel / CSV
  const handleExportExcel = () => {
    if (attempts.length === 0) {
      alert('Không có dữ liệu bài làm để xuất file!');
      return;
    }

    const exportData = attempts.map((item, index) => ({
      STT: index + 1,
      'Họ và tên': item.profiles?.full_name || 'Thí sinh',
      Email: item.profiles?.email || '',
      'Trường THPT': item.profiles?.school_name || 'Chưa cập nhật',
      'Đề thi': item.exams?.title || 'Đề thi THPT',
      'Điểm số': item.total_score,
      'Thời gian làm (phút)': Math.round((item.time_spent_seconds || 0) / 60),
      'Số lần rời tab': item.violation_count || 0,
      'Ngày nộp bài': new Date(item.submitted_at).toLocaleString('vi-VN'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KetQuaThi');

    const fileName = `Ket_Qua_Thi_THPT_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const avgExamScore = attempts.length > 0
    ? (attempts.reduce((sum, a) => sum + Number(a.total_score || 0), 0) / attempts.length).toFixed(2)
    : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Báo Cáo Phổ Điểm & Quản Lý Thi Thử
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Phân tích dữ liệu kết quả học sinh, biểu đồ phổ điểm và xuất file Excel
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất Báo Cáo Excel</span>
        </button>
      </div>

      {/* Bộ chọn đề thi cần phân tích */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Filter className="w-4 h-4 text-brand-600" />
          <span>Chọn đề thi cần phân tích:</span>
        </div>

        <select
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-slate-50 text-slate-800 focus:outline-hidden focus:border-brand-500"
        >
          <option value="all">Tất cả đề thi</option>
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.title} ({ex.subjects?.name})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <>
          {/* 3 Card Tổng Quan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-3 text-slate-500 text-xs font-bold mb-3">
                <Users className="w-5 h-5 text-brand-600" />
                <span>Tổng lượt thí sinh dự thi</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{attempts.length}</div>
              <div className="text-xs text-slate-400 mt-1">Lượt làm bài hoàn thành</div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-3 text-slate-500 text-xs font-bold mb-3">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <span>Điểm trung bình toàn ca thi</span>
              </div>
              <div className="text-3xl font-black text-emerald-600">{avgExamScore} / 10 đ</div>
              <div className="text-xs text-slate-400 mt-1">Đánh giá độ phân hóa đề</div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-3 text-slate-500 text-xs font-bold mb-3">
                <AlertOctagon className="w-5 h-5 text-amber-500" />
                <span>Số câu có tỷ lệ sai &gt; 50%</span>
              </div>
              <div className="text-3xl font-black text-amber-600">
                {hardestQuestions.filter((q) => q.failRate >= 50).length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Lỗ hổng kiến thức chung</div>
            </div>
          </div>

          {/* BIỂU ĐỒ PHỔ ĐIỂM THI DẠNG CỘT (SCORE DISTRIBUTION HISTOGRAM) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-600" />
                  Biểu Đồ Phổ Điểm Thi (Score Distribution Chart)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân bố số lượng thí sinh theo các thang điểm từ 0 đến 10
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Tổng: {attempts.length} bài thi
              </span>
            </div>

            {attempts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Chưa có dữ liệu bài thi nào trong đề này để lập phổ điểm.
              </div>
            ) : (
              <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 px-2 border-b border-slate-200">
                {scoreBuckets.map((bucket, index) => {
                  const heightPercent = Math.round((bucket.count / maxBucketCount) * 100);

                  let barBg = 'bg-brand-500 hover:bg-brand-600';
                  if (bucket.min >= 8) barBg = 'bg-emerald-500 hover:bg-emerald-600';
                  else if (bucket.max <= 5) barBg = 'bg-rose-400 hover:bg-rose-500';

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {bucket.count}
                      </span>
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${barBg}`}
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      ></div>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 whitespace-nowrap">
                        {bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CÂU HỎI CÓ TỶ LỆ LÀM SAI CAO NHẤT */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
            <h3 className="font-black text-lg text-slate-900 mb-2 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-500" />
              Top Câu Hỏi Có Tỷ Lệ Thí Sinh Làm Sai Cao Nhất
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Giúp giáo viên nhận biết các chuyên đề kiến thức học sinh còn gặp nhiều lúng túng
            </p>

            {hardestQuestions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Chưa có câu hỏi nào bị làm sai nhiều trong lượt thi này.
              </div>
            ) : (
              <div className="space-y-3">
                {hardestQuestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-black text-slate-900">Câu hỏi #{idx + 1}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {item.question?.type}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {item.question?.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {item.question?.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-black text-rose-600">
                          {item.failRate}% sai
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ({item.wrong}/{item.total} thí sinh)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
