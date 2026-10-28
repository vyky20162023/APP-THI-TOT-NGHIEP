import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function Timer({ 
  totalSeconds, 
  initialRemainingSeconds, 
  onTimeUp,
  onTick 
}) {
  const [secondsLeft, setSecondsLeft] = useState(
    initialRemainingSeconds !== undefined ? initialRemainingSeconds : totalSeconds
  );

  useEffect(() => {
    if (initialRemainingSeconds !== undefined) {
      setSecondsLeft(initialRemainingSeconds);
    }
  }, [initialRemainingSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        const nextVal = prev - 1;
        if (onTick) onTick(nextVal);
        if (nextVal <= 0) {
          clearInterval(timer);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onTimeUp, onTick]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft <= 300; // Còn dưới 5 phút cảnh báo đổi màu

  const formatNumber = (num) => String(num).padStart(2, '0');

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl font-mono font-bold transition-all shadow-sm ${
        isUrgent
          ? 'bg-rose-50 text-rose-700 border-2 border-rose-300 animate-pulse'
          : 'bg-white text-slate-800 border border-slate-200'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
      ) : (
        <Clock className="w-5 h-5 text-brand-600" />
      )}
      <div className="flex items-center text-lg sm:text-xl tracking-wider">
        <span>{formatNumber(minutes)}</span>
        <span className="mx-0.5 animate-pulse">:</span>
        <span>{formatNumber(seconds)}</span>
      </div>
      {isUrgent && (
        <span className="text-xs font-sans font-semibold text-rose-600 hidden sm:inline">
          (Sắp hết giờ!)
        </span>
      )}
    </div>
  );
}
