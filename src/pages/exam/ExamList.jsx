import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { THPT_SUBJECTS, getSubjectMeta } from '../../constants/subjects';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { 
  BookOpen, 
  Clock, 
  HelpCircle, 
  Search, 
  ArrowRight, 
  Trophy, 
  Filter,
  CheckCircle,
  Sparkles,
  LayoutGrid
} from 'lucide-react';

export default function ExamList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subjectParam = searchParams.get('subject') || 'all';

  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState(THPT_SUBJECTS);
  const [selectedSubject, setSelectedSubject] = useState(subjectParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Tải danh sách môn học và đề thi từ Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1. Tải danh sách môn học từ Supabase (nếu có cập nhật mới)
        const { data: subData, error: subError } = await supabase
          .from('subjects')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (!subError && subData && subData.length > 0) {
          setSubjects(subData);
        }

        // 2. Tải danh sách đề thi (kèm môn học và số câu)
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select(`
            *,
            subjects (id, name, code, icon),
            exam_questions (id)
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (examError) {
          console.error('Lỗi khi tải đề thi:', examError);
        } else if (examData) {
          // Tính tổng số câu hỏi thực tế từ quan hệ exam_questions
          const formatted = examData.map((e) => ({
            ...e,
            actualQuestionsCount: e.exam_questions?.length || e.total_questions || 0,
          }));
          setExams(formatted);
        }
      } catch (err) {
        console.error('Exception khi tải dữ liệu đề thi:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Cập nhật selectedSubject khi query param thay đổi
  useEffect(() => {
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    }
  }, [subjectParam]);

  // Bộ lọc theo môn và từ khóa tìm kiếm
  const filteredExams = exams.filter((exam) => {
    const matchSubject =
      selectedSubject === 'all' ||
      exam.subjects?.name?.toLowerCase() === selectedSubject.toLowerCase() ||
      exam.subjects?.code?.toLowerCase() === selectedSubject.toLowerCase();

    const matchSearch =
      !searchQuery ||
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSubject && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          Kỳ Thi Tốt Nghiệp THPT 2025
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Ngân Hàng Đề Thi Thử Trực Tuyến
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hệ thống đề thi trắc nghiệm bấm giờ theo chuẩn cấu trúc 3 phần mới nhất của Bộ GD&ĐT
        </p>
      </div>

      {/* Thanh tìm kiếm & Bộ lọc môn học */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên đề thi, mã đề..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          {/* Dropdown môn học cho màn hình nhỏ */}
          <div className="sm:hidden">
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSearchParams({ subject: e.target.value });
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 text-sm font-medium bg-white"
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Danh sách nút filter môn học (màn hình sm trở lên) */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setSelectedSubject('all');
              setSearchParams({ subject: 'all' });
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedSubject === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tất cả môn ({exams.length})</span>
          </button>

          {subjects.map((sub) => {
            const meta = getSubjectMeta(sub.name || sub.code);
            const Icon = meta.icon;
            const isSelected =
              selectedSubject.toLowerCase() === sub.name.toLowerCase() ||
              selectedSubject.toLowerCase() === sub.code?.toLowerCase();

            return (
              <button
                key={sub.id || sub.code}
                onClick={() => {
                  setSelectedSubject(sub.name);
                  setSearchParams({ subject: sub.name });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs shadow-brand-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Danh sách đề thi */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : filteredExams.length === 0 ? (
        <EmptyState
          title="Không tìm thấy đề thi phù hợp"
          description={`Hiện chưa có đề thi nào trong môn "${selectedSubject}" hoặc từ khóa bạn vừa tìm kiếm. Hãy chọn môn học khác.`}
          actionLabel="Xem tất cả đề thi"
          onAction={() => {
            setSelectedSubject('all');
            setSearchQuery('');
            setSearchParams({ subject: 'all' });
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => {
            const meta = getSubjectMeta(exam.subjects?.name || exam.subjects?.code);
            const Icon = meta.icon;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-brand-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Header Card: Tên môn + Điểm chuẩn */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${meta.badgeColor}`}>
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      {exam.subjects?.name || meta.name}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Mã: {exam.subjects?.code || meta.code}
                    </span>
                  </div>

                  {/* Tiêu đề đề thi */}
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-600 transition-colors line-clamp-2 mb-2">
                    {exam.title}
                  </h3>

                  {/* Mô tả ngắn */}
                  <p className="text-xs text-slate-500 line-clamp-2 mb-5">
                    {exam.description || 'Đề thi trắc nghiệm bám sát cấu trúc đề minh họa Bộ GD&ĐT 2025.'}
                  </p>
                </div>

                {/* Thông số & Nút vào thi */}
                <div>
                  <div className="flex items-center gap-4 py-3 border-t border-slate-100 text-xs font-semibold text-slate-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-600" />
                      <span>{exam.duration_minutes} phút</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-emerald-600" />
                      <span>{exam.actualQuestionsCount} câu hỏi</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/exam-room/${exam.id}`}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm text-center shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <span>Vào Thi Ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      to={`/exam-result/${exam.id}?view=leaderboard`}
                      title="Xem Bảng Xếp Hạng"
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-colors"
                    >
                      <Trophy className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
