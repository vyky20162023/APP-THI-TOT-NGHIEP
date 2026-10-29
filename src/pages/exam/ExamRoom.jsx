import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Timer from '../../components/exam/Timer';
import QuestionPalette from '../../components/exam/QuestionPalette';
import QuestionCard from '../../components/exam/QuestionCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { calculateExamScore } from '../../utils/scoring';
import { soundEffects } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { 
  ShieldAlert, 
  Maximize, 
  Minimize, 
  Send, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';

export default function ExamRoom() {
  const { examId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State bài thi
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);

  // Giám sát gian lận & Thời gian
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(3000); // Mặc định 50 phút

  const autoSaveTimerRef = useRef(null);

  // Key lưu trữ LocalStorage dự phòng chống mất kết quả
  const storageKey = `exam_cache_${examId}_${user?.id || 'guest'}`;

  // 1. Tải đề thi và các câu hỏi từ Supabase
  useEffect(() => {
    async function initExam() {
      if (!isSupabaseConfigured || !examId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Lấy thông tin đề thi
        const { data: examData, error: examErr } = await supabase
          .from('exams')
          .select('*, subjects (name, code)')
          .eq('id', examId)
          .single();

        if (examErr || !examData) {
          throw new Error('Không tìm thấy thông tin đề thi.');
        }

        setExam(examData);
        const durationSecs = (examData.duration_minutes || 50) * 60;
        setRemainingSeconds(durationSecs);

        // Lấy danh sách câu hỏi kèm thứ tự
        const { data: eqData, error: eqErr } = await supabase
          .from('exam_questions')
          .select(`
            order_index,
            point_weight,
            questions (
              id,
              type,
              content,
              image_url,
              options,
              correct_answer,
              explanation,
              difficulty
            )
          `)
          .eq('exam_id', examId)
          .order('order_index');

        if (eqErr) throw eqErr;

        let loadedQuestions = (eqData || [])
          .map((item) => ({
            ...item.questions,
            point_weight: item.point_weight,
            order_index: item.order_index,
          }))
          .filter((q) => Boolean(q.id));

        // Khởi tạo hoặc khôi phục lượt thi (Exam Attempt)
        let currentAttempt = null;
        if (user) {
          // Tìm lượt thi đang dở dang (in_progress)
          const { data: existingAttempts } = await supabase
            .from('exam_attempts')
            .select('*')
            .eq('exam_id', examId)
            .eq('student_id', user.id)
            .eq('status', 'in_progress')
            .order('created_at', { ascending: false })
            .limit(1);

          if (existingAttempts && existingAttempts.length > 0) {
            currentAttempt = existingAttempts[0];
            setAttemptId(currentAttempt.id);
            setViolationCount(currentAttempt.violation_count || 0);

            // Tính thời gian còn lại thực tế dựa trên started_at của Server
            const startTime = new Date(currentAttempt.started_at).getTime();
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setTimeSpentSeconds(elapsed);
            const left = Math.max(0, durationSecs - elapsed);
            setRemainingSeconds(left);

            // Khôi phục câu trả lời từ Database
            const { data: savedAnswers } = await supabase
              .from('exam_answers')
              .select('question_id, student_answer')
              .eq('attempt_id', currentAttempt.id);

            if (savedAnswers) {
              const ansMap = {};
              savedAnswers.forEach((a) => {
                ansMap[a.question_id] = a.student_answer;
              });
              setAnswers(ansMap);
            }
          } else {
            // Tạo lượt thi mới trên Supabase
            const { data: newAttempt, error: createAttemptErr } = await supabase
              .from('exam_attempts')
              .insert({
                exam_id: examId,
                student_id: user.id,
                status: 'in_progress',
                started_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (!createAttemptErr && newAttempt) {
              setAttemptId(newAttempt.id);
            }
          }
        }

        // Khôi phục thêm từ LocalStorage (nếu có cache mới hơn)
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.answers) {
              setAnswers((prev) => ({ ...prev, ...parsed.answers }));
            }
            if (parsed.flagged) {
              setFlagged(parsed.flagged);
            }
          }
        } catch (e) {
          console.warn('Lỗi đọc LocalStorage:', e);
        }

        setQuestions(loadedQuestions);
      } catch (err) {
        console.error('Lỗi khởi tạo phòng thi:', err);
      } finally {
        setLoading(false);
      }
    }

    initExam();
  }, [examId, user]);

  // 2. Chống gian lận: Bắt sự kiện chuyển Tab / ẩn cửa sổ
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        soundEffects.playViolationSiren();
        setViolationCount((prev) => {
          const updated = prev + 1;
          setShowViolationAlert(true);
          // Ghi nhận cảnh báo tức thời
          if (attemptId && isSupabaseConfigured) {
            supabase
              .from('exam_attempts')
              .update({ violation_count: updated })
              .eq('id', attemptId)
              .then(() => {});
          }
          return updated;
        });
      }
    };

    const handleWindowBlur = () => {
      // Khi con trỏ rời khỏi cửa sổ
      setShowViolationAlert(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [attemptId]);

  // 3. Tự động lưu tiến độ 2 tầng: LocalStorage tức thời + Supabase định kỳ (Auto-Save)
  const saveAnswer = useCallback((qId, val) => {
    setAnswers((prev) => {
      const updated = { ...prev, [qId]: val };
      // Tầng 1: LocalStorage ngay lập tức
      try {
        localStorage.setItem(storageKey, JSON.stringify({ answers: updated, flagged }));
      } catch (err) {
        console.warn(err);
      }

      // Tầng 2: Đồng bộ lên Supabase
      if (attemptId && isSupabaseConfigured) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
          supabase
            .from('exam_answers')
            .upsert({
              attempt_id: attemptId,
              question_id: qId,
              student_answer: val,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'attempt_id,question_id' })
            .then(() => {});
        }, 800);
      }

      return updated;
    });
  }, [attemptId, flagged, storageKey]);

  // Đổi cờ đánh dấu câu hỏi
  const toggleFlag = (qId) => {
    setFlagged((prev) => {
      const updated = { ...prev, [qId]: !prev[qId] };
      try {
        localStorage.setItem(storageKey, JSON.stringify({ answers, flagged: updated }));
      } catch (e) {}
      return updated;
    });
  };

  // 4. Bật / Tắt chế độ Toàn Màn Hình (Fullscreen)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // 5. Nộp bài thi
  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (submitting) return;

    if (!isAutoSubmit) {
      const unansweredCount = questions.filter((q) => {
        const a = answers[q.id];
        return a === undefined || a === null || (typeof a === 'object' && Object.keys(a).length === 0);
      }).length;

      const confirmMsg = unansweredCount > 0
        ? `Bạn còn ${unansweredCount} câu chưa làm. Bạn có chắc chắn muốn nộp bài ngay bây giờ?`
        : 'Bạn đã hoàn thành các câu hỏi. Bạn có chắc chắn muốn nộp bài thi?';

      if (!window.confirm(confirmMsg)) return;
    }

    try {
      setSubmitting(true);

      // Chấm điểm tự động theo thuật toán Bộ GD&ĐT
      const scoreResult = calculateExamScore(questions, answers);

      if (attemptId && isSupabaseConfigured) {
        // Ưu tiên nộp qua Stored Procedure bảo mật trên Supabase
        const { data: rpcData, error: rpcError } = await supabase.rpc('submit_exam_attempt', {
          p_attempt_id: attemptId,
          p_student_answers: answers,
          p_time_spent: timeSpentSeconds,
          p_violations: violationCount,
        });

        if (rpcError) {
          console.warn('RPC chưa được kích hoạt, chuyển sang chế độ cập nhật bảng trực tiếp:', rpcError);
          // Cập nhật lượt thi thành completed
          await supabase
            .from('exam_attempts')
            .update({
              status: 'completed',
              submitted_at: new Date().toISOString(),
              time_spent_seconds: timeSpentSeconds,
              total_score: scoreResult.totalScore,
              violation_count: violationCount,
            })
            .eq('id', attemptId);

          // Lưu toàn bộ chi tiết điểm từng câu vào exam_answers
          for (const item of scoreResult.gradedResults) {
            await supabase
              .from('exam_answers')
              .upsert({
                attempt_id: attemptId,
                question_id: item.questionId,
                student_answer: item.studentAnswer || null,
                is_correct: item.isCorrect,
                earned_score: item.earnedScore,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'attempt_id,question_id' });
          }
        }
      }

      // Xóa cache LocalStorage của phiên thi này
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {}

      // Bắn pháo hoa & phát âm thanh ăn mừng nộp bài
      soundEffects.playSuccessChime();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Thoát chế độ toàn màn hình nếu đang bật
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // Chuyển sang màn hình xem kết quả
      navigate(`/exam-result/${attemptId || examId}`, {
        state: { scoreResult, timeSpentSeconds, examTitle: exam?.title },
        replace: true,
      });
    } catch (err) {
      console.error('Lỗi khi nộp bài:', err);
      alert('Có lỗi xảy ra khi nộp bài. Đừng lo lắng, dữ liệu của bạn đã được lưu tạm trên máy.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-brand-600 mb-2">Đang thiết lập phòng thi ảo...</p>
          <LoadingSkeleton count={3} type="question" />
        </div>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Chưa Tìm Thấy Câu Hỏi Của Đề Thi</h2>
        <p className="text-sm text-slate-500 mb-6">
          Đề thi này có thể chưa được cấu hình câu hỏi hoặc chưa được xuất bản. Vui lòng quay lại danh sách đề thi.
        </p>
        <button
          onClick={() => navigate('/exams')}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm"
        >
          Quay Lại Danh Sách
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const answeredTotal = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Cảnh báo chuyển tab (Tab-switching modal/banner) */}
      {showViolationAlert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-200 shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Cảnh Báo Chống Gian Lận!</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Bạn vừa rời khỏi màn hình làm bài thi. Hành động này đã được ghi nhận vào hệ thống giám sát.
            </p>
            <div className="bg-rose-50 text-rose-800 text-xs font-bold py-2 px-4 rounded-xl mb-6">
              Số lần rời màn hình: <span className="text-base text-rose-600 font-black">{violationCount}</span> lần
            </div>
            <button
              onClick={() => setShowViolationAlert(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl cursor-pointer"
            >
              Tôi Đã Hiểu, Quay Lại Bài Thi
            </button>
          </div>
        </div>
      )}

      {/* THANH ĐIỀU HÀNH PHÒNG THI DÍNH TRÊN ĐẦU (STICKY HEADER) */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Thông tin đề thi */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn rời phòng thi? Tiến độ của bạn đã được tự động lưu lại.')) {
                  navigate('/exams');
                }
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Rời phòng thi"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                {exam.title}
              </h2>
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-2">
                <span>{exam.subjects?.name || 'Môn THPT'}</span>
                <span>•</span>
                <span>Tiến độ: <strong className="text-brand-600">{answeredTotal}</strong>/{questions.length} câu</span>
                {violationCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-rose-600 font-bold">{violationCount} vi phạm</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Đồng hồ đếm ngược & Nút nộp bài */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Timer
              totalSeconds={(exam.duration_minutes || 50) * 60}
              initialRemainingSeconds={remainingSeconds}
              onTick={(left) => {
                setTimeSpentSeconds((prev) => prev + 1);
                setRemainingSeconds(left);
              }}
              onTimeUp={() => {
                alert('Thời gian làm bài thi đã hết! Hệ thống sẽ tự động nộp bài.');
                handleSubmitExam(true);
              }}
            />

            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            <button
              onClick={() => handleSubmitExam(false)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Đang nộp...' : 'Nộp Bài'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH: CÂU HỎI & BẢNG ĐIỀU HƯỚNG */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* CỘT CÂU HỎI (3 phần 4 chiều rộng) */}
          <div className="lg:col-span-3 space-y-6">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id || idx}
                question={q}
                index={idx}
                answer={answers[q.id]}
                onAnswerChange={(val) => saveAnswer(q.id, val)}
                isFlagged={Boolean(flagged[q.id])}
                onToggleFlag={() => toggleFlag(q.id)}
              />
            ))}

            {/* Bottom Actions */}
            <div className="flex justify-end pt-4 pb-12">
              <button
                onClick={() => handleSubmitExam(false)}
                disabled={submitting}
                className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Hoàn Thành & Nộp Bài Thi</span>
              </button>
            </div>
          </div>

          {/* CỘT BẢNG CÂU HỎI (1 phần 4 chiều rộng - Dính bên phải) */}
          <div className="lg:col-span-1 hidden lg:block">
            <QuestionPalette
              questions={questions}
              answers={answers}
              flagged={flagged}
              currentQuestionIndex={currentQuestionIndex}
              onSelectQuestion={(idx) => {
                setCurrentQuestionIndex(idx);
                const element = document.getElementById(`question-card-${idx}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
