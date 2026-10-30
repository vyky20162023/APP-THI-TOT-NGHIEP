import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ExamImportModal from '../../components/exam/ExamImportModal';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  Download, 
  Users, 
  AlertOctagon, 
  FileSpreadsheet, 
  CheckCircle,
  Clock,
  Filter,
  Sparkles,
  UploadCloud,
  X
} from 'lucide-react';

export default function TeacherDashboard() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('all');
  const [attempts, setAttempts] = useState([]);
  const [hardestQuestions, setHardestQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Modal tải lên đề thi từ file
  const [showImportModal, setShowImportModal] = useState(false);

  // State sinh đề tự động theo ma trận
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [matrixSubjectId, setMatrixSubjectId] = useState('');
  const [matrixTitle, setMatrixTitle] = useState('Đề Thi Thử Tốt Nghiệp THPT 2025 - Sinh Ngẫu Nhiên');
  const [matrixDuration, setMatrixDuration] = useState(50);
  const [matrixCountD1, setMatrixCountD1] = useState(12); // Dạng 1: Nhiều lựa chọn
  const [matrixCountD2, setMatrixCountD2] = useState(4);  // Dạng 2: Đúng / Sai
  const [matrixCountD3, setMatrixCountD3] = useState(6);  // Dạng 3: Trả lời ngắn
  const [generating, setGenerating] = useState(false);

  // 1. Tải danh sách đề thi mà giáo viên quản lý
  useEffect(() => {
    async function fetchExams() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        // Tải đề thi
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

        // Tải môn học
        const { data: subData } = await supabase
          .from('subjects')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (subData) {
          setSubjects(subData);
          if (subData.length > 0) setMatrixSubjectId(subData[0].id);
        }
      } catch (err) {
        console.error('Lỗi khi tải đề thi & môn học:', err);
      }
    }
    fetchExams();
  }, []);

  // Xử lý sinh đề thi ngẫu nhiên theo ma trận Bộ GD&ĐT
  const handleGenerateMatrixExam = async (e) => {
    e.preventDefault();
    if (!matrixSubjectId) {
      alert('Vui lòng chọn môn học!');
      return;
    }

    try {
      setGenerating(true);

      // 1. Tải toàn bộ câu hỏi của môn học này theo từng dạng
      const { data: allQ, error: qErr } = await supabase
        .from('questions')
        .select('id, type, difficulty')
        .eq('subject_id', matrixSubjectId);

      if (qErr || !allQ || allQ.length === 0) {
        alert('Môn học này hiện chưa có đủ câu hỏi trong ngân hàng để sinh đề!');
        setGenerating(false);
        return;
      }

      // Lọc câu hỏi theo từng dạng
      const d1Questions = allQ.filter((q) => q.type === 'single_choice');
      const d2Questions = allQ.filter((q) => q.type === 'true_false');
      const d3Questions = allQ.filter((q) => q.type === 'short_answer');

      // Hàm bốc ngẫu nhiên N phần tử
      const pickRandom = (arr, n) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(n, shuffled.length));
      };

      const selectedD1 = pickRandom(d1Questions, Number(matrixCountD1));
      const selectedD2 = pickRandom(d2Questions, Number(matrixCountD2));
      const selectedD3 = pickRandom(d3Questions, Number(matrixCountD3));

      const totalPicked = selectedD1.length + selectedD2.length + selectedD3.length;
      if (totalPicked === 0) {
        alert('Không tìm thấy câu hỏi phù hợp với ma trận đã chọn.');
        setGenerating(false);
        return;
      }

      // 2. Tạo đề thi mới trong bảng exams
      const { data: newExam, error: examInsertErr } = await supabase
        .from('exams')
        .insert({
          subject_id: matrixSubjectId,
          title: matrixTitle,
          description: `Đề thi sinh ngẫu nhiên theo ma trận: ${selectedD1.length} câu Dạng 1, ${selectedD2.length} câu Dạng 2, ${selectedD3.length} câu Dạng 3.`,
          duration_minutes: Number(matrixDuration),
          total_questions: totalPicked,
          is_published: true,
        })
        .select()
        .single();

      if (examInsertErr || !newExam) throw examInsertErr;

      // 3. Ghép danh sách câu hỏi vào bảng exam_questions
      const examQuestionsPayload = [];
      let order = 1;

      selectedD1.forEach((q) => {
        examQuestionsPayload.push({
          exam_id: newExam.id,
          question_id: q.id,
          order_index: order++,
          point_weight: 0.25,
        });
      });

      selectedD2.forEach((q) => {
        examQuestionsPayload.push({
          exam_id: newExam.id,
          question_id: q.id,
          order_index: order++,
          point_weight: 1.00,
        });
      });

      selectedD3.forEach((q) => {
        examQuestionsPayload.push({
          exam_id: newExam.id,
          question_id: q.id,
          order_index: order++,
          point_weight: 0.50,
        });
      });

      const { error: eqInsertErr } = await supabase
        .from('exam_questions')
        .insert(examQuestionsPayload);

      if (eqInsertErr) throw eqInsertErr;

      alert(`Đã sinh đề thi thành công với ${totalPicked} câu hỏi! Đề thi đã được xuất bản để học sinh vào làm.`);
      setShowMatrixModal(false);

      // Cập nhật lại danh sách đề thi
      setExams((prev) => [newExam, ...prev]);
      setSelectedExamId(newExam.id);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi sinh đề thi: ' + (err.message || 'Thử lại sau'));
    } finally {
      setGenerating(false);
    }
  };

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

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
          >
            <UploadCloud className="w-4 h-4 text-emerald-200" />
            <span>Tải Lên Đề Thi (Excel / Word / PDF)</span>
          </button>

          <button
            onClick={() => setShowMatrixModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Sinh Đề Theo Ma Trận</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Báo Cáo Excel</span>
          </button>
        </div>
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

      {/* MODAL SINH ĐỀ THI TỰ ĐỘNG THEO MA TRẬN BỘ GD&ĐT */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Sinh Đề Tự Động Theo Ma Trận
                  </h3>
                  <p className="text-xs text-slate-500">Chuẩn cấu trúc 3 phần trắc nghiệm Bộ GD&ĐT</p>
                </div>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateMatrixExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Môn học áp dụng ma trận
                </label>
                <select
                  value={matrixSubjectId}
                  onChange={(e) => setMatrixSubjectId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đề thi mới
                </label>
                <input
                  type="text"
                  required
                  value={matrixTitle}
                  onChange={(e) => setMatrixTitle(e.target.value)}
                  placeholder="Ví dụ: Đề Khảo Sát Năng Lực Toán 12 - Lần 1"
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời gian làm bài (Phút)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  required
                  value={matrixDuration}
                  onChange={(e) => setMatrixDuration(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Cấu hình số câu theo 3 dạng thức Bộ GD&ĐT:
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-brand-50/60 p-3 rounded-xl border border-brand-200">
                    <label className="block text-[11px] font-bold text-brand-800 mb-1">
                      Phần I (Lựa chọn)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={matrixCountD1}
                      onChange={(e) => setMatrixCountD1(e.target.value)}
                      className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-brand-300 text-xs font-black text-center"
                    />
                    <span className="text-[10px] text-slate-500 block text-center mt-1">
                      (0.25đ / câu)
                    </span>
                  </div>

                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                      Phần II (Đúng/Sai)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={matrixCountD2}
                      onChange={(e) => setMatrixCountD2(e.target.value)}
                      className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-emerald-300 text-xs font-black text-center"
                    />
                    <span className="text-[10px] text-slate-500 block text-center mt-1">
                      (Bậc thang 1đ)
                    </span>
                  </div>

                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                    <label className="block text-[11px] font-bold text-amber-800 mb-1">
                      Phần III (Điền số)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={matrixCountD3}
                      onChange={(e) => setMatrixCountD3(e.target.value)}
                      className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-amber-300 text-xs font-black text-center"
                    />
                    <span className="text-[10px] text-slate-500 block text-center mt-1">
                      (0.5đ / câu)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMatrixModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {generating ? 'Đang bốc câu hỏi & tạo đề...' : 'Tạo Đề Thi Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tải Lên Đề Thi Từ File (Excel, Word, PDF) */}
      <ExamImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(newExam) => {
          setExams((prev) => [newExam, ...prev]);
          if (newExam?.id) {
            setSelectedExamId(newExam.id);
          }
        }}
      />
    </div>
  );
}
