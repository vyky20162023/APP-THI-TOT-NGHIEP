import React from 'react';
import LaTeXRenderer from '../common/LaTeXRenderer';
import { Flag, Check, X, AlertCircle } from 'lucide-react';

export default function QuestionCard({
  question,
  index = 0,
  answer,
  onAnswerChange,
  isFlagged = false,
  onToggleFlag,
  isReviewMode = false,
  gradeResult = null,
}) {
  if (!question) return null;

  const typeConfig = {
    single_choice: { label: 'Phần I: Nhiều lựa chọn', bg: 'bg-brand-50 text-brand-700 border-brand-200' },
    true_false: { label: 'Phần II: Đúng / Sai', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    short_answer: { label: 'Phần III: Trả lời ngắn', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  };

  const difficultyConfig = {
    nhan_biet: { label: 'Nhận biết', color: 'bg-slate-100 text-slate-700' },
    thong_hieu: { label: 'Thông hiểu', color: 'bg-blue-50 text-blue-700' },
    van_dung: { label: 'Vận dụng', color: 'bg-amber-50 text-amber-700' },
    van_dung_cao: { label: 'Vận dụng cao', color: 'bg-rose-50 text-rose-700 font-semibold' },
  };

  const typeInfo = typeConfig[question.type] || typeConfig.single_choice;
  const diffInfo = difficultyConfig[question.difficulty] || difficultyConfig.nhan_biet;

  // Xử lý thay đổi đáp án Dạng 1: Nhiều lựa chọn
  const handleSingleChoiceSelect = (optionId) => {
    if (isReviewMode) return;
    onAnswerChange({ answer: optionId });
  };

  // Xử lý thay đổi đáp án Dạng 2: Đúng / Sai
  const handleTrueFalseToggle = (subItemId, value) => {
    if (isReviewMode) return;
    const currentAns = typeof answer === 'object' && answer !== null ? { ...answer } : {};
    currentAns[subItemId] = value;
    onAnswerChange(currentAns);
  };

  // Xử lý thay đổi đáp án Dạng 3: Trả lời ngắn
  const handleShortAnswerChange = (val) => {
    if (isReviewMode) return;
    onAnswerChange({ value: val });
  };

  const currentChoice = typeof answer === 'object' && answer !== null ? answer.answer : answer;
  const shortAnswerVal = typeof answer === 'object' && answer !== null ? (answer.value ?? '') : (answer ?? '');

  return (
    <div 
      id={`question-card-${index}`} 
      className={`bg-white rounded-2xl p-6 sm:p-7 border shadow-sm transition-all mb-6 ${
        isReviewMode && gradeResult
          ? gradeResult.isCorrect 
            ? 'border-emerald-200 bg-emerald-50/10' 
            : 'border-rose-200 bg-rose-50/10'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Header Card: Số thứ tự câu + Badges + Nút gắn cờ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-base sm:text-lg text-slate-900">
            Câu {index + 1}:
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${typeInfo.bg}`}>
            {typeInfo.label}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${diffInfo.color}`}>
            {diffInfo.label}
          </span>
          {question.point_weight && (
            <span className="text-xs text-slate-500 font-medium">
              ({question.point_weight} điểm)
            </span>
          )}
        </div>

        {/* Nút Flag hoặc Kết quả điểm số khi Review */}
        {!isReviewMode ? (
          <button
            type="button"
            onClick={onToggleFlag}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isFlagged
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{isFlagged ? 'Đã đánh dấu' : 'Đặt cờ'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 ${
              gradeResult?.isCorrect 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-rose-100 text-rose-800'
            }`}>
              {gradeResult?.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {gradeResult?.earnedScore ?? 0} điểm
            </span>
          </div>
        )}
      </div>

      {/* Nội dung câu hỏi có KaTeX */}
      <div className="text-slate-800 text-base leading-relaxed mb-6 font-normal">
        <LaTeXRenderer text={question.content} />
      </div>

      {/* Hình ảnh đính kèm (nếu có) */}
      {question.image_url && (
        <div className="mb-6 flex justify-center">
          <img
            src={question.image_url}
            alt={`Hình minh họa câu ${index + 1}`}
            className="max-h-72 object-contain rounded-xl border border-slate-200 shadow-xs"
          />
        </div>
      )}

      {/* KHU VỰC TRẢ LỜI THEO TỪNG DẠNG THỨC */}

      {/* 1. Dạng 1: Nhiều lựa chọn (Single Choice) */}
      {question.type === 'single_choice' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.isArray(question.options) &&
            question.options.map((opt) => {
              const isSelected = String(currentChoice).toUpperCase() === String(opt.id).toUpperCase();
              
              // Nếu đang ở Review Mode
              const correctAns = question.correct_answer?.answer || question.correct_answer;
              const isThisCorrect = String(opt.id).toUpperCase() === String(correctAns).toUpperCase();

              let cardStyle = 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/20';
              if (isSelected) {
                cardStyle = 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500 text-brand-900 font-medium';
              }
              if (isReviewMode) {
                if (isThisCorrect) {
                  cardStyle = 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 text-emerald-900 font-semibold';
                } else if (isSelected && !isThisCorrect) {
                  cardStyle = 'border-rose-400 bg-rose-50 ring-1 ring-rose-400 text-rose-900 line-through';
                }
              }

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSingleChoiceSelect(opt.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${cardStyle}`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isSelected
                        ? isReviewMode
                          ? isThisCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                          : 'bg-brand-600 text-white'
                        : isReviewMode && isThisCorrect
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {opt.id}
                  </span>
                  <div className="flex-1 text-sm pt-0.5">
                    <LaTeXRenderer text={opt.text} />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* 2. Dạng 2: Đúng / Sai 4 ý (True / False) */}
      {question.type === 'true_false' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 italic mb-2">
            * Chọn Đúng hoặc Sai cho từng mệnh đề sau (Thang điểm bậc thang 0.1đ - 0.25đ - 0.5đ - 1.0đ):
          </p>
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {Array.isArray(question.options) &&
              question.options.map((item) => {
                const studentVal = typeof answer === 'object' && answer !== null ? answer[item.id] : undefined;
                const correctVal = question.correct_answer?.[item.id];
                const itemGrade = gradeResult?.details?.[item.id];

                return (
                  <div
                    key={item.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isReviewMode
                        ? itemGrade?.isCorrect
                          ? 'bg-emerald-50/30'
                          : studentVal !== undefined
                          ? 'bg-rose-50/30'
                          : 'bg-slate-50/50'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 text-sm">
                      <span className="w-6 h-6 rounded-md bg-slate-100 font-bold text-xs flex items-center justify-center shrink-0 text-slate-700">
                        {item.id})
                      </span>
                      <div className="flex-1">
                        <LaTeXRenderer text={item.text} />
                      </div>
                    </div>

                    {/* Bộ 2 nút Đúng / Sai */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={isReviewMode}
                        onClick={() => handleTrueFalseToggle(item.id, true)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          studentVal === true
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        ĐÚNG
                      </button>

                      <button
                        type="button"
                        disabled={isReviewMode}
                        onClick={() => handleTrueFalseToggle(item.id, false)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          studentVal === false
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        SAI
                      </button>

                      {isReviewMode && (
                        <div className="ml-2 text-xs font-semibold">
                          {itemGrade?.isCorrect ? (
                            <span className="text-emerald-600 flex items-center gap-0.5">
                              <Check className="w-3.5 h-3.5" /> Đúng
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center gap-0.5">
                              <X className="w-3.5 h-3.5" /> (Đáp án: {correctVal ? 'ĐÚNG' : 'SAI'})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. Dạng 3: Trả lời ngắn (Short Answer) */}
      {question.type === 'short_answer' && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-500">
            * Nhập đáp án số hoặc biểu thức ngắn (ví dụ: 2.5, -3, 124):
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              disabled={isReviewMode}
              value={shortAnswerVal}
              onChange={(e) => handleShortAnswerChange(e.target.value)}
              placeholder="Nhập kết quả tại đây..."
              className={`max-w-md w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-hidden ${
                isReviewMode
                  ? gradeResult?.isCorrect
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-rose-400 bg-rose-50 text-rose-900'
                  : 'border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200'
              }`}
            />
          </div>

          {isReviewMode && (
            <div className="mt-2 text-xs font-semibold text-slate-600 flex items-center gap-2">
              <span>Đáp án đúng của đề:</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md font-mono">
                {question.correct_answer?.value || JSON.stringify(question.correct_answer)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* KHU VỰC LỜI GIẢI CHI TIẾT (CHỈ HIỂN THỊ KHI XEM LẠI BÀI THI) */}
      {isReviewMode && question.explanation && (
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-brand-600" />
              Lời Giải Chi Tiết
            </h4>
            <div className="text-sm text-slate-700 leading-relaxed font-sans">
              <LaTeXRenderer text={question.explanation} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
