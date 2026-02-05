'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface EventTimerProps {
  isRunning: boolean;
  startTime?: Date;
  onStart: () => void;
  onStop: () => void;
  onResume?: () => void;
  onReset?: () => void;
}

function formatElapsed(startTime: Date): string {
  const diffMs = Date.now() - startTime.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

export function EventTimer({ 
  isRunning, 
  startTime, 
  onStart, 
  onStop, 
  onResume,
  onReset 
}: EventTimerProps) {
  const { t } = useI18n();
  const [elapsed, setElapsed] = useState('0:00');

  useEffect(() => {
    if (!startTime) { setElapsed('0:00'); return; }
    setElapsed(formatElapsed(startTime));
    if (!isRunning) return;

    const interval = setInterval(() => setElapsed(formatElapsed(startTime)), 1000);
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  return (
    <div className="py-4 px-4 bg-muted/40 rounded-xl flex items-center justify-center gap-3">
      {!isRunning && startTime && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="w-10 h-10 rounded-full text-muted-foreground active:bg-muted flex items-center justify-center"
        >
          ↺
        </button>
      )}
      
      <div className="text-5xl font-bold tabular-nums tracking-tight">{elapsed}</div>

      {!startTime ? (
        <button
          type="button"
          onClick={onStart}
          className="w-16 h-16 rounded-full bg-green-500 text-white font-bold active:bg-green-600"
        >
          {t('start')}
        </button>
      ) : isRunning ? (
        <button
          type="button"
          onClick={onStop}
          className="w-16 h-16 rounded-full bg-red-500 text-white font-bold active:bg-red-600"
        >
          {t('stop')}
        </button>
      ) : (
        <button
          type="button"
          onClick={onResume || onStart}
          className="w-16 h-16 rounded-full bg-green-500 text-white font-bold active:bg-green-600"
        >
          {t('resume')}
        </button>
      )}
    </div>
  );
}
