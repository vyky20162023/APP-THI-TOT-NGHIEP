import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import LaTeXRenderer from '../../components/common/LaTeXRenderer';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Check, 
  X, 
  Eye, 
  Sparkles,
  Layers,
  Image as ImageIcon
} from 'lucide-react';

export default function QuestionBankManager() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal tạo câu hỏi
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formType, setFormType] = useState('single_choice');
  const [formDifficulty, setFormDifficulty] = useState('nhan_biet');
  const [formContent, setFormContent] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formExplanation, setFormExplanation] = useState('');

  // Options & Correct Answers theo từng dạng
  // Dạng 1: Single choice
  const [singleOptions, setSingleOptions] = useState([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ]);
  const [singleCorrect, setSingleCorrect] = useState('A');

  // Dạng 2: True/False 4 ý
  const [tfOptions, setTfOptions] = useState([
    { id: 'a', text: '', isTrue: true },
    { id: 'b', text: '', isTrue: false },
    { id: 'c', text: '', isTrue: true },
    { id: 'd', text: '', isTrue: false },
  ]);

  // Dạng 3: Short answer
  const [shortValue, setShortValue] = useState('');
  const [shortAccepted, setShortAccepted] = useState('');

  // 1. Tải danh sách môn học và câu hỏi
  const fetchData = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: subData } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (subData) {
        setSubjects(subData);
        if (subData.length > 0 && !formSubjectId) {
          setFormSubjectId(subData[0].id);
        }
      }

      let qQuery = supabase
        .from('questions')
        .select(`
          *,
          subjects (name, code)
        `)
        .order('created_at', { ascending: false });

      const { data: qData, error: qErr } = await qQuery;

      if (!qErr && qData) {
        setQuestions(qData);
      }
    } catch (err) {
      console.error('Lỗi khi tải ngân hàng câu hỏi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Tạo câu hỏi mới vào Supabase
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!formContent.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    try {
      setSubmitting(true);

      let optionsPayload = [];
      let correctPayload = {};

      if (formType === 'single_choice') {
        optionsPayload = singleOptions;
        correctPayload = { answer: singleCorrect };
      } else if (formType === 'true_false') {
        optionsPayload = tfOptions.map((o) => ({ id: o.id, text: o.text }));
        const tfCorrectMap = {};
        tfOptions.forEach((o) => {
          tfCorrectMap[o.id] = o.isTrue;
        });
        correctPayload = tfCorrectMap;
      } else if (formType === 'short_answer') {
        optionsPayload = [];
        const acceptedArr = shortAccepted
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (!acceptedArr.includes(shortValue.trim())) {
          acceptedArr.unshift(shortValue.trim());
        }
        correctPayload = {
          value: shortValue.trim(),
          accepted_values: acceptedArr,
        };
      }

      const { data, error } = await supabase.from('questions').insert({
        subject_id: formSubjectId,
        type: formType,
        difficulty: formDifficulty,
        content: formContent,
        image_url: formImageUrl.trim() || null,
        options: optionsPayload,
        correct_answer: correctPayload,
        explanation: formExplanation,
        created_by: user?.id || null,
      }).select();

      if (error) throw error;

      alert('Đã thêm câu hỏi mới thành công vào ngân hàng đề!');
      setShowModal(false);
      // Reset form
      setFormContent('');
      setFormExplanation('');
      setFormImageUrl('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tạo câu hỏi: ' + (err.message || 'Thử lại sau'));
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Xóa câu hỏi
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng đề?')) return;
    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa: ' + err.message);
    }
  };

  // Lọc câu hỏi
  const filtered = questions.filter((q) => {
    const matchSub = selectedSubject === 'all' || q.subject_id === selectedSubject;
    const matchType = selectedType === 'all' || q.type === selectedType;
    const matchSearch =
      !searchQuery || q.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSub && matchType && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Ngân Hàng Câu Hỏi Chuẩn 2025
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Soạn thảo và quản lý câu hỏi 3 dạng thức Bộ GD&ĐT với trình hiển thị KaTeX trực tiếp
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Câu Hỏi Mới</span>
        </button>
      </div>

      {/* Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs mb-8 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo nội dung câu hỏi..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:outline-hidden focus:border-brand-500"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-white"
        >
          <option value="all">Tất cả môn học</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-white"
        >
          <option value="all">Tất cả dạng thức</option>
          <option value="single_choice">Dạng 1: Nhiều lựa chọn</option>
          <option value="true_false">Dạng 2: Đúng / Sai</option>
          <option value="short_answer">Dạng 3: Trả lời ngắn</option>
        </select>
      </div>

      {/* Danh Sách Câu Hỏi */}
      {loading ? (
        <LoadingSkeleton count={3} type="table" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Chưa có câu hỏi nào"
          description="Hãy tạo câu hỏi đầu tiên của bạn để làm phong phú thêm ngân hàng đề thi."
          actionLabel="Soạn câu hỏi ngay"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-800">
                    Câu #{idx + 1}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700">
                    {q.subjects?.name || 'Môn học'}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {q.type === 'single_choice'
                      ? 'Dạng 1: Nhiều lựa chọn'
                      : q.type === 'true_false'
                      ? 'Dạng 2: Đúng / Sai'
                      : 'Dạng 3: Trả lời ngắn'}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Nội dung KaTeX */}
              <div className="text-sm text-slate-800 leading-relaxed mb-4">
                <LaTeXRenderer text={q.content} />
              </div>

              {/* Lời giải chi tiết rút gọn */}
              {q.explanation && (
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                  <strong>Lời giải: </strong>
                  <LaTeXRenderer text={q.explanation} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL THÊM CÂU HỎI MỚI KÈM LIVE PREVIEW KATEX */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                Soạn Thảo Câu Hỏi Chuẩn Bộ GD&ĐT
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dạng thức</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="single_choice">Dạng 1: Nhiều lựa chọn</option>
                    <option value="true_false">Dạng 2: Đúng / Sai 4 ý</option>
                    <option value="short_answer">Dạng 3: Trả lời ngắn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ nhận thức</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="nhan_biet">Nhận biết</option>
                    <option value="thong_hieu">Thông hiểu</option>
                    <option value="van_dung">Vận dụng</option>
                    <option value="van_dung_cao">Vận dụng cao</option>
                  </select>
                </div>
              </div>

              {/* Nội dung câu hỏi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung câu hỏi (Cú pháp LaTeX: $ công thức inline $ hoặc $$ công thức block $$)
                </label>
                <textarea
                  rows={3}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Ví dụ: Tính đạo hàm của hàm số $y = \int_0^x (2t + 1)dt$..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:border-brand-500"
                />
                {/* Xem trước KaTeX trực tiếp */}
                {formContent && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <span className="font-bold text-slate-500 block mb-1">Xem trước công thức:</span>
                    <LaTeXRenderer text={formContent} />
                  </div>
                )}
              </div>

              {/* Link hình vẽ nếu có */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đường dẫn ảnh đồ thị / hình học (Tùy chọn)
                </label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* CẤU HÌNH ĐÁP ÁN THEO DẠNG */}

              {/* Dạng 1 */}
              {formType === 'single_choice' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    4 Phương Án & Chọn Đáp Án Đúng:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {singleOptions.map((opt, i) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span className="font-bold text-xs w-6">{opt.id})</span>
                        <input
                          type="text"
                          required
                          value={opt.text}
                          onChange={(e) => {
                            const updated = [...singleOptions];
                            updated[i].text = e.target.value;
                            setSingleOptions(updated);
                          }}
                          placeholder={`Nội dung phương án ${opt.id}...`}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                        <input
                          type="radio"
                          name="correctSingle"
                          checked={singleCorrect === opt.id}
                          onChange={() => setSingleCorrect(opt.id)}
                          className="w-4 h-4 text-brand-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dạng 2 */}
              {formType === 'true_false' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    4 Mệnh Đề (a, b, c, d) & Đáp Án Đúng/Sai:
                  </label>
                  <div className="space-y-2">
                    {tfOptions.map((opt, i) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span className="font-bold text-xs w-6">{opt.id})</span>
                        <input
                          type="text"
                          required
                          value={opt.text}
                          onChange={(e) => {
                            const updated = [...tfOptions];
                            updated[i].text = e.target.value;
                            setTfOptions(updated);
                          }}
                          placeholder={`Mệnh đề ${opt.id}...`}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...tfOptions];
                            updated[i].isTrue = !updated[i].isTrue;
                            setTfOptions(updated);
                          }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                            opt.isTrue
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-rose-600 text-white border-rose-600'
                          }`}
                        >
                          {opt.isTrue ? 'ĐÚNG' : 'SAI'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dạng 3 */}
              {formType === 'short_answer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đáp án chính (Số hoặc chuỗi ngắn)
                    </label>
                    <input
                      type="text"
                      required
                      value={shortValue}
                      onChange={(e) => setShortValue(e.target.value)}
                      placeholder="Ví dụ: 2.5 hoặc -3"
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Các đáp án chấp nhận tương đương (cách nhau dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={shortAccepted}
                      onChange={(e) => setShortAccepted(e.target.value)}
                      placeholder="Ví dụ: 2.5, 2,5, 5/2"
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Lời giải chi tiết */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lời giải chi tiết từng bước (LaTeX):
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Giải thích các bước suy luận để thí sinh xem lại sau khi nộp bài..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono focus:outline-hidden focus:border-brand-500"
                />
              </div>

              {/* Nút Submit */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Vào Ngân Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
