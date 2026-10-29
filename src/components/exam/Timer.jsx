import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, Volume2 } from 'lucide-react';
import { soundEffects } from '../../utils/audio';

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

        // Phát âm thanh tik-tok trong 10 giây cuối cùng
        if (nextVal > 0 && nextVal <= 10) {
          soundEffects.playCountdownTick();
        }

        if (nextVal <= 0) {
          clearInterval(timer);
          soundEffects.playViolationSiren();
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
  const isUrgent = secondsLeft <= 300; // Dưới 5 phút cảnh báo màu đỏ
  const isCritical = secondsLeft <= 10 && secondsLeft > 0; // 10 giây cuối

  const formatNumber = (num) => String(num).padStart(2, '0');

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl font-mono font-bold transition-all shadow-sm ${
        isCritical
          ? 'bg-rose-600 text-white border-2 border-rose-700 animate-ping'
          : isUrgent
          ? 'bg-rose-50 text-rose-700 border-2 border-rose-300 animate-pulse'
          : 'bg-white text-slate-800 border border-slate-200'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className={`w-5 h-5 ${isCritical ? 'text-white' : 'text-rose-600'} animate-bounce`} />
      ) : (
        <Clock className="w-5 h-5 text-brand-600" />
      )}
      <div className="flex items-center text-lg sm:text-xl tracking-wider">
        <span>{formatNumber(minutes)}</span>
        <span className="mx-0.5 animate-pulse">:</span>
        <span>{formatNumber(seconds)}</span>
      </div>
      {isUrgent && (
        <span className={`text-xs font-sans font-semibold hidden sm:inline ${isCritical ? 'text-white' : 'text-rose-600'}`}>
          {isCritical ? `(Còn ${secondsLeft}s!)` : '(Sắp hết giờ!)'}
        </span>
      )}
    </div>
  );
}
