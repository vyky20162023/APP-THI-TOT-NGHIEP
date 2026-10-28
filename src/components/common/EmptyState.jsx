import React from 'react';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';

export default function EmptyState({
  title = 'Chưa có dữ liệu',
  description = 'Hiện tại chưa có dữ liệu nào được ghi nhận trong mục này.',
  actionLabel,
  onAction,
  icon: Icon = AlertCircle,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-300 my-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-all shadow-md shadow-brand-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
