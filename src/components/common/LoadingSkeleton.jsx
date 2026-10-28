import React from 'react';

export default function LoadingSkeleton({ count = 3, type = 'card' }) {
  if (type === 'table') {
    return (
      <div className="w-full animate-pulse space-y-3">
        <div className="h-10 bg-slate-200 rounded-lg w-full"></div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-lg w-full flex items-center px-4 space-x-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'question') {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-slate-200 rounded-full w-28"></div>
          <div className="h-6 bg-slate-100 rounded-full w-20"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-4 bg-slate-100 rounded w-3/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm animate-pulse space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
            <div className="space-y-1 flex-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-full"></div>
            <div className="h-3 bg-slate-100 rounded w-4/5"></div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-8 bg-slate-200 rounded-lg w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
