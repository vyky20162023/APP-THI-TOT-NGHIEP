import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import ScoreSummary from '../../components/exam/ScoreSummary';
import QuestionCard from '../../components/exam/QuestionCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { calculateExamScore } from '../../utils/scoring';
import { 
  Trophy, 
  FileText, 
  ArrowLeft, 
  RotateCcw, 
  Share2, 
  Award, 
  Clock, 
  User, 
  School
} from 'lucide-react';

export default function ExamResult() {
  const { attemptId } = useParams();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(
    new URLSearchParams(location.search).get('view') === 'leaderboard' ? 'leaderboard' : 'review'
  );

  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [scoreResult, setScoreResult] = useState(location.state?.scoreResult || null);
  const [timeSpent, setTimeSpent] = useState(location.state?.timeSpentSeconds || 0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(!location.state?.scoreResult);

  // Tải chi tiết bài thi từ Supabase nếu vào trực tiếp bằng URL
  useEffect(() => {
    async function loadAttemptDetails() {
      if (!isSupabaseConfigured || !attemptId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Kiểm tra xem param là attemptId hay examId
        const { data: attemptData, error: attemptErr } = await supabase
          .from('exam_attempts')
          .select(`
            *,
            exams (
              id,
              title,
              duration_minutes,
              subjects (name, code)
            ),
            profiles (full_name, school_name)
          `)
          .eq('id', attemptId)
          .maybeSingle();

        let targetExamId = null;

        if (attemptData) {
          setAttempt(attemptData);
          setExam(attemptData.exams);
          setTimeSpent(attemptData.time_spent_seconds || 0);
          targetExamId = attemptData.exam_id;

          // Lấy câu hỏi và câu trả lời
          const { data: eqData } = await supabase
            .from('exam_questions')
            .select(`
              point_weight,
              order_index,
              questions (*)
            `)
            .eq('exam_id', targetExamId)
            .order('order_index');

          const loadedQuestions = (eqData || []).map((i) => ({
            ...i.questions,
            point_weight: i.point_weight,
          })).filter(q => Boolean(q.id));

          setQuestions(loadedQuestions);

          const { data: answersData } = await supabase
            .from('exam_answers')
            .select('question_id, student_answer, earned_score, is_correct')
            .eq('attempt_id', attemptId);

          const ansMap = {};
          (answersData || []).forEach((a) => {
            ansMap[a.question_id] = a.student_answer;
          });
          setAnswers(ansMap);

          // Tính toán lại điểm số nếu chưa có trong state
          if (!scoreResult && loadedQuestions.length > 0) {
            const calculated = calculateExamScore(loadedQuestions, ansMap);
            setScoreResult(calculated);
          }
        } else {
          // Thử tìm theo examId nếu đây là trang bảng xếp hạng của đề
          const { data: examData } = await supabase
            .from('exams')
            .select('*, subjects(name)')
            .eq('id', attemptId)
            .maybeSingle();

          if (examData) {
            setExam(examData);
            targetExamId = examData.id;
          }
        }

        // Tải bảng xếp hạng Top thí sinh của đề thi này
        if (targetExamId) {
          const { data: lbData, error: lbErr } = await supabase
            .from('exam_attempts')
            .select(`
              id,
              total_score,
              time_spent_seconds,
              submitted_at,
              profiles (
                full_name,
                school_name,
                avatar_url
              )
            `)
            .eq('exam_id', targetExamId)
            .eq('status', 'completed')
            .order('total_score', { ascending: false })
            .order('time_spent_seconds', { ascending: true })
            .limit(20);

          if (!lbErr && lbData) {
            setLeaderboard(lbData);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải kết quả thi:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAttemptDetails();
  }, [attemptId]);

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}p ${s}s`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            to="/exams"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách đề thi</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {exam?.title || location.state?.examTitle || 'Kết Quả Bài Thi Thử THPT'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Môn: {exam?.subjects?.name || 'Tốt Nghiệp THPT 2025'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {exam?.id && (
            <Link
              to={`/exam-room/${exam.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <RotateCcw className="w-4 h-4 text-brand-600" />
              <span>Thi Lại Đề Này</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tóm tắt điểm số nếu có scoreResult */}
      {scoreResult && (
        <ScoreSummary scoreData={scoreResult} timeSpentSeconds={timeSpent} />
      )}

      {/* TABS CHUYỂN ĐỔI: LỜI GIẢI CHI TIẾT VS BẢNG XẾP HẠNG */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab('review')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'review'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Đối Chiếu Đáp Án & Lời Giải KaTeX</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Bảng Xếp Hạng Top Thí Sinh</span>
        </button>
      </div>

      {/* NỘI DUNG THEO TAB */}
      {loading ? (
        <LoadingSkeleton count={3} type="question" />
      ) : activeTab === 'review' ? (
        /* TAB 1: XEM LẠI TỪNG CÂU VÀ LỜI GIẢI */
        <div>
          {scoreResult?.gradedResults && scoreResult.gradedResults.length > 0 ? (
            <div className="space-y-6">
              {scoreResult.gradedResults.map((item, idx) => (
                <QuestionCard
                  key={item.questionId || idx}
                  question={item.question}
                  index={idx}
                  answer={item.studentAnswer}
                  isReviewMode={true}
                  gradeResult={item}
                />
              ))}
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <QuestionCard
                  key={q.id || idx}
                  question={q}
                  index={idx}
                  answer={answers[q.id]}
                  isReviewMode={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có dữ liệu bài làm để xem lại"
              description="Bạn có thể làm bài thi này ngay trong phòng thi để nhận kết quả phân tích chi tiết."
            />
          )}
        </div>
      ) : (
        /* TAB 2: BẢNG XẾP HẠNG (LEADERBOARD) */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Vinh Danh Thí Sinh Điểm Cao Nhất
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Xếp hạng theo tổng điểm và thời gian nộp bài nhanh nhất
              </p>
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Chưa có thí sinh nào hoàn thành đề thi này. Hãy là người đầu tiên ghi tên lên bảng vàng!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                let rankBadge = (
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                    {rank}
                  </span>
                );

                if (rank === 1) {
                  rankBadge = (
                    <span className="w-8 h-8 rounded-full bg-amber-400 text-white font-black text-xs flex items-center justify-center shadow-md shadow-amber-400/30">
                      🥇
                    </span>
                  );
                } else if (rank === 2) {
                  rankBadge = (
                    <span className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center">
                      🥈
                    </span>
                  );
                } else if (rank === 3) {
                  rankBadge = (
                    <span className="w-8 h-8 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center">
                      🥉
                    </span>
                  );
                }

                return (
                  <div
                    key={entry.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {rankBadge}
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {entry.profiles?.full_name || 'Thí sinh ẩn danh'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <School className="w-3.5 h-3.5" />
                            {entry.profiles?.school_name || 'Trường THPT'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-brand-600">
                        {entry.total_score} <span className="text-xs text-slate-400">điểm</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatSeconds(entry.time_spent_seconds || 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
