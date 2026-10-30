import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { THPT_SUBJECTS } from '../../constants/subjects';
import LaTeXRenderer from '../common/LaTeXRenderer';
import { soundEffects } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  parseExcelExam,
  parseDocxExam,
  parsePdfExam,
  parseRawTextExam,
  downloadSampleExcelTemplate,
  downloadSampleWordTemplate
} from '../../utils/examParsers';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCheck,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Trash2,
  Clock,
  BookOpen,
  Award,
  Eye,
  Download,
  HelpCircle,
  RefreshCw,
  Send
} from 'lucide-react';

export default function ExamImportModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();

  // Mode: 'file' hoặc 'text'
  const [inputMode, setInputMode] = useState('file');

  // Exam Metadata
  const [examTitle, setExamTitle] = useState('Đề Thi Thử Tốt Nghiệp THPT 2025 - Khảo Thí Mới');
  const [subjectId, setSubjectId] = useState(THPT_SUBJECTS[0].id);
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [passingScore, setPassingScore] = useState(5.0);
  const [isPublished, setIsPublished] = useState(true);

  // File & Parsing state
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [parseError, setParseError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  // Xử lý khi chọn file
  const handleFileChange = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setParseError('');
    setParsing(true);

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let questions = [];

      if (ext === 'xlsx' || ext === 'xls') {
        questions = await parseExcelExam(file);
      } else if (ext === 'docx') {
        questions = await parseDocxExam(file);
      } else if (ext === 'pdf') {
        questions = await parsePdfExam(file);
      } else if (ext === 'txt') {
        const text = await file.text();
        questions = parseRawTextExam(text);
      } else {
        throw new Error('Định dạng file chưa được hỗ trợ. Vui lòng chọn file .xlsx, .xls, .docx, .pdf hoặc .txt');
      }

      if (!questions || questions.length === 0) {
        throw new Error('Không bóc tách được câu hỏi nào từ file. Vui lòng kiểm tra lại cấu trúc file mẫu.');
      }

      setParsedQuestions(questions);
      try {
        if (soundEffects && typeof soundEffects.playClick === 'function') {
          soundEffects.playClick();
        }
      } catch (soundErr) {
        // Bỏ qua lỗi âm thanh nếu trình duyệt chưa cấp quyền AudioContext
      }
    } catch (err) {
      console.error('Lỗi parse file:', err);
      setParseError(err.message || 'Không thể đọc nội dung file.');
      setParsedQuestions([]);
    } finally {
      setParsing(false);
    }
  };

  // Xử lý khi phân tích từ văn bản dán trực tiếp
  const handleParseText = () => {
    if (!rawText.trim()) {
      setParseError('Vui lòng dán nội dung đề thi vào ô văn bản trước khi bấm Phân tích.');
      return;
    }

    setParseError('');
    setParsing(true);

    try {
      const questions = parseRawTextExam(rawText);
      if (!questions || questions.length === 0) {
        throw new Error('Không nhận diện được câu hỏi nào. Vui lòng xem cú pháp mẫu: "Câu 1: ... A. ... B. ... C. ... D. ... Đáp án: A".');
      }

      setParsedQuestions(questions);
      try {
        if (soundEffects && typeof soundEffects.playClick === 'function') {
          soundEffects.playClick();
        }
      } catch (soundErr) {}
    } catch (err) {
      console.error(err);
      setParseError(err.message);
    } finally {
      setParsing(false);
    }
  };

  // Xóa bớt một câu hỏi khỏi danh sách xem trước
  const handleDeleteQuestion = (index) => {
    const updated = [...parsedQuestions];
    updated.splice(index, 1);
    setParsedQuestions(updated);
  };

  // Thống kê số lượng theo từng dạng thức
  const countD1 = parsedQuestions.filter((q) => q.type === 'single_choice').length;
  const countD2 = parsedQuestions.filter((q) => q.type === 'true_false').length;
  const countD3 = parsedQuestions.filter((q) => q.type === 'short_answer').length;

  // Lưu đề thi và câu hỏi vào Supabase
  const handleSaveExam = async () => {
    if (parsedQuestions.length === 0) {
      alert('Chưa có câu hỏi nào được bóc tách để lưu!');
      return;
    }

    if (!examTitle.trim()) {
      alert('Vui lòng nhập tiêu đề đề thi!');
      return;
    }

    try {
      setSaving(true);

      // 1. Tạo bản ghi đề thi trong bảng public.exams
      const { data: newExam, error: examErr } = await supabase
        .from('exams')
        .insert({
          subject_id: subjectId,
          title: examTitle.trim(),
          description: `Đề thi trắc nghiệm gồm ${parsedQuestions.length} câu bám sát cấu trúc Bộ GD&ĐT 2025. Nhập tự động từ file ${selectedFile?.name || 'văn bản'}.`,
          duration_minutes: Number(durationMinutes) || 50,
          total_questions: parsedQuestions.length,
          passing_score: Number(passingScore) || 5.0,
          is_published: isPublished,
          created_by: user?.id,
        })
        .select()
        .single();

      if (examErr || !newExam) {
        throw new Error(`Lỗi tạo đề thi: ${examErr?.message || 'Không thể tạo bản ghi đề thi'}`);
      }

      // 2. Thêm từng câu hỏi vào bảng public.questions và liên kết vào exam_questions
      for (let i = 0; i < parsedQuestions.length; i++) {
        const q = parsedQuestions[i];

        // Tạo câu hỏi
        const { data: insertedQ, error: qErr } = await supabase
          .from('questions')
          .insert({
            subject_id: subjectId,
            type: q.type,
            content: q.content,
            image_url: q.image_url || null,
            options: q.options || [],
            correct_answer: q.correct_answer,
            explanation: q.explanation || null,
            difficulty: q.difficulty || 'thong_hieu',
            created_by: user?.id,
          })
          .select('id')
          .single();

        if (qErr || !insertedQ) {
          console.error(`Lỗi thêm câu hỏi số ${i + 1}:`, qErr);
          continue;
        }

        // Liên kết câu hỏi vào đề thi
        await supabase.from('exam_questions').insert({
          exam_id: newExam.id,
          question_id: insertedQ.id,
          order_index: i + 1,
          point_weight: q.point_weight || 0.25,
        });
      }

      // 3. Thông báo thành công và hiệu ứng chúc mừng
      try {
        if (soundEffects && typeof soundEffects.playSuccessChime === 'function') {
          soundEffects.playSuccessChime();
        }
      } catch (soundErr) {}

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (confettiErr) {}

      alert(`✅ Đã tải lên và tạo thành công đề thi "${newExam.title}" với ${parsedQuestions.length} câu hỏi!`);

      if (onSuccess) {
        onSuccess(newExam);
      }
      onClose();
    } catch (err) {
      console.error('Lỗi lưu đề thi:', err);
      alert(`Đã xảy ra lỗi khi lưu đề thi: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full my-8 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-brand-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white tracking-tight flex items-center gap-2">
                <span>Tải Lên Đề Thi Từ File</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  Excel • Word • PDF
                </span>
              </h3>
              <p className="text-xs text-white/80">
                Tự động nhận diện cấu trúc 3 dạng thức trắc nghiệm mới của Bộ GD&ĐT 2025
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NỘI DUNG CUỘN CHÍNH */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* 1. THIẾT LẬP THÔNG TIN ĐỀ THI */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-brand-600" />
              <span>1. Thông Tin Đề Thi Khảo Thí</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tên / Tiêu đề đề thi:
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Ví dụ: Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Toán (Lần 1)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-brand-200 focus:border-brand-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Môn thi tốt nghiệp:
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
                >
                  {THPT_SUBJECTS.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Thời gian làm bài (phút):
                </label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Checkbox xuất bản ngay */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="publishCheckbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
              />
              <label htmlFor="publishCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                Công bố đề thi ngay lập tức để học sinh toàn trường có thể bấm vào thi
              </label>
            </div>
          </div>

          {/* 2. KHU VỰC TẢI LÊN FILE & TẢI FILE MẪU */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>2. Chọn File Đề Thi Hoặc Dán Văn Bản</span>
              </div>

              {/* Nút tải file mẫu */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadSampleExcelTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>File Mẫu Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={downloadSampleWordTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Hướng Dẫn Word (.txt)</span>
                </button>
              </div>
            </div>

            {/* Chuyển đổi tab chọn File / Dán Text */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  inputMode === 'file'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Tải File Lên (Excel, Word, PDF)</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  inputMode === 'text'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dán Nội Dung Trực Tiếp</span>
              </button>
            </div>

            {/* Khung Kéo Thả File */}
            {inputMode === 'file' ? (
              <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-brand-50/20 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .docx, .pdf, .txt"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7 text-brand-600" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {selectedFile ? (
                    <span className="text-brand-700 flex items-center justify-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Đã chọn: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    <span>Nhấp để chọn file hoặc kéo thả file vào đây</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Định dạng được hỗ trợ: <strong>.xlsx, .xls (Excel)</strong>, <strong>.docx (Word)</strong>, <strong>.pdf (PDF)</strong>, <strong>.txt</strong>
                </p>
              </div>
            ) : (
              /* Ô Dán Văn Bản Trực Tiếp */
              <div className="space-y-3">
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Dán nội dung đề thi vào đây, ví dụ:
Câu 1: Cho hàm số y = f(x)... Đạo hàm tại x = 2 là:
A. 0
B. 3
C. 6
D. -3
Đáp án: A
Lời giải: y' = 3x^2 - 3...

Câu 2: Xét tính đúng/sai của các khẳng định sau:
a) Hàm số đồng biến trên (2; +∞). (Đ)
b) Hàm số có 2 cực trị. (Đ)
c) Giá trị cực tiểu bằng 2. (S)
d) Đồ thị qua gốc tọa độ. (S)

Câu 3: Tìm giá trị lớn nhất của hàm số?
Đáp án: 5`}
                  className="w-full p-4 rounded-2xl border border-slate-300 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-brand-200 focus:border-brand-500 bg-white"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseText}
                    disabled={parsing}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Phân Tích Cú Pháp Câu Hỏi</span>
                  </button>
                </div>
              </div>
            )}

            {/* Thông báo lỗi nếu có */}
            {parseError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* 3. BẢNG XEM TRƯỚC CÂU HỎI & THỐNG KÊ (LIVE INTERACTIVE PREVIEW) */}
          {parsing ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Đang phân tích cấu trúc đề thi và công thức toán học...</p>
            </div>
          ) : parsedQuestions.length > 0 ? (
            <div className="space-y-4">
              {/* Thống kê dạng thức */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Bóc tách thành công {parsedQuestions.length} câu hỏi:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                    Dạng 1 (Nhiều lựa chọn): {countD1} câu
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Dạng 2 (Đúng / Sai bậc thang): {countD2} câu
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                    Dạng 3 (Trả lời ngắn): {countD3} câu
                  </span>
                </div>
              </div>

              {/* Danh sách từng câu hỏi */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {parsedQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-brand-300 transition-all space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          q.type === 'single_choice'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : q.type === 'true_false'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {q.type === 'single_choice' ? 'Dạng 1: Nhiều lựa chọn (0.25đ)' : q.type === 'true_false' ? 'Dạng 2: Đúng/Sai bậc thang (1.0đ)' : 'Dạng 3: Trả lời ngắn (0.5đ)'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 capitalize">
                          [{q.difficulty}]
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(idx)}
                        title="Xóa câu này"
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Nội dung câu hỏi */}
                    <div className="text-xs sm:text-sm font-medium text-slate-800">
                      <LaTeXRenderer text={q.content} />
                    </div>

                    {/* Phương án theo dạng thức */}
                    {q.type === 'single_choice' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {q.options?.map((opt) => {
                          const isCorrect = q.correct_answer?.answer === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-xl border flex items-start gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-white border text-[10px] font-bold flex items-center justify-center shrink-0">
                                {opt.id}
                              </span>
                              <div className="flex-1">
                                <LaTeXRenderer text={opt.text} />
                              </div>
                              {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {q.options?.map((opt) => {
                          const isTrue = q.correct_answer?.[opt.id] === true;
                          return (
                            <div
                              key={opt.id}
                              className="p-2 rounded-xl border bg-slate-50 border-slate-200 flex items-start justify-between gap-2"
                            >
                              <div className="flex items-start gap-1.5 flex-1">
                                <span className="font-bold text-slate-800">{opt.id})</span>
                                <LaTeXRenderer text={opt.text} />
                              </div>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                isTrue ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {isTrue ? 'ĐÚNG' : 'SAI'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'short_answer' && (
                      <div className="text-xs pt-1">
                        <span className="font-bold text-slate-600">Đáp án chuẩn: </span>
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {q.correct_answer?.value}
                        </span>
                      </div>
                    )}

                    {/* Lời giải chi tiết */}
                    {q.explanation && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700">Lời giải: </span>
                        <LaTeXRenderer text={q.explanation} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleSaveExam}
            disabled={saving || parsedQuestions.length === 0}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {saving ? 'Đang Lưu Đề Thi Vào Supabase...' : `Lưu & Xuất Bản Đề Thi (${parsedQuestions.length} Câu)`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
