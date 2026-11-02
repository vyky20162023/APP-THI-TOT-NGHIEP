import React from 'react';
import { Flag, CheckCircle2 } from 'lucide-react';

export default function QuestionPalette({
  questions = [],
  answers = {},
  flagged = {},
  currentQuestionIndex = 0,
  onSelectQuestion,
}) {
  const isQuestionAnswered = (qId, type) => {
    const val = answers[qId];
    if (val === undefined || val === null) return false;

    if (type === 'single_choice') {
      return Boolean(val);
    }
    if (type === 'true_false') {
      // Đã làm nếu ít nhất 1 ý được chọn
      return typeof val === 'object' && Object.keys(val).length > 0;
    }
    if (type === 'short_answer') {
      const text = typeof val === 'object' ? val.value : val;
      return String(text || '').trim().length > 0;
    }
    return false;
  };

  const answeredCount = questions.filter((q) => isQuestionAnswered(q.id, q.type)).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  // Nhóm câu hỏi theo từng Phần chuẩn Bộ GD&ĐT 2025
  const partGroups = [
    {
      id: 1,
      title: 'Phần I: Nhiều lựa chọn',
      shortTitle: 'Phần I',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      pointNote: '0.25đ/câu',
      items: questions
        .map((q, idx) => ({ ...q, originalIndex: idx }))
        .filter((q) => q.type === 'single_choice' || q.part_id === 1),
    },
    {
      id: 2,
      title: 'Phần II: Đúng / Sai',
      shortTitle: 'Phần II',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pointNote: 'Tối đa 1.0đ/câu',
      items: questions
        .map((q, idx) => ({ ...q, originalIndex: idx }))
        .filter((q) => q.type === 'true_false' || q.part_id === 2),
    },
    {
      id: 3,
      title: 'Phần III: Trả lời ngắn',
      shortTitle: 'Phần III',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      pointNote: '0.5đ/câu',
      items: questions
        .map((q, idx) => ({ ...q, originalIndex: idx }))
        .filter((q) => q.type === 'short_answer' || q.part_id === 3),
    },
  ].filter((p) => p.items.length > 0);

  // Nếu không có nhóm rõ ràng thì tạo 1 nhóm duy nhất
  const displayGroups = partGroups.length > 0 
    ? partGroups 
    : [{
        id: 0,
        title: 'Tất cả câu hỏi',
        shortTitle: 'Đề thi',
        badge: 'bg-slate-50 text-slate-700 border-slate-200',
        pointNote: '',
        items: questions.map((q, idx) => ({ ...q, originalIndex: idx })),
      }];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm sticky top-20">
      {/* Header & Stats */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Danh Sách Câu Hỏi</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Đã làm: <span className="font-bold text-emerald-600">{answeredCount}</span>/{questions.length} câu
          </p>
        </div>
        {flaggedCount > 0 && (
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
            <Flag className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{flaggedCount} cờ</span>
          </div>
        )}
      </div>

      {/* Hiển thị phân nhóm theo từng phần */}
      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
        {displayGroups.map((group) => {
          const groupAnswered = group.items.filter((item) => isQuestionAnswered(item.id, item.type)).length;

          return (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <span className={`px-2 py-0.5 rounded-md border text-[11px] ${group.badge}`}>
                  {group.title}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {groupAnswered}/{group.items.length} ({group.pointNote})
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                {group.items.map((item) => {
                  const idx = item.originalIndex;
                  const isAnswered = isQuestionAnswered(item.id, item.type);
                  const isFlagged = Boolean(flagged[item.id]);
                  const isCurrent = currentQuestionIndex === idx;

                  let btnClass = 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
                  if (isAnswered) {
                    btnClass = 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 font-bold';
                  }
                  if (isCurrent) {
                    btnClass += ' ring-2 ring-brand-500 ring-offset-2 scale-105';
                  }

                  return (
                    <button
                      key={item.id || idx}
                      onClick={() => onSelectQuestion(idx)}
                      className={`relative h-9 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95 ${btnClass}`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border border-white rounded-full flex items-center justify-center shadow-xs">
                          <Flag className="w-2 h-2 text-white fill-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend chú thích */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-500"></span>
          <span>Đã làm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300"></span>
          <span>Chưa làm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-400"></span>
          <span>Đánh dấu</span>
        </div>
      </div>
    </div>
  );
}
