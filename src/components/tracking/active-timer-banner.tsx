'use client';

import { useEffect, useState } from 'react';

const BREAST_TIMER_STORAGE_KEY = 'baby-tracker-active-timer';
const PUMP_TIMER_STORAGE_KEY = 'baby-tracker-active-pump-timer';

interface PersistedTimer {
  type: 'breast' | 'pump';
  babyId: string;
  startTime: string;
  elapsedMs: number;
  lastResumeTime: string | null;
  isRunning: boolean;
  side: 'left' | 'right' | 'both';
}

interface ActiveTimerBannerProps {
  babyId: string;
  onTap: (type: 'breast' | 'pump') => void;
}

function TimerBadge({ 
  timer, 
  displayTime, 
  onTap 
}: { 
  timer: PersistedTimer; 
  displayTime: string; 
  onTap: () => void;
}) {
  const sideLabel = timer.side === 'left' ? 'L' : timer.side === 'right' ? 'R' : 'B';
  const emoji = timer.type === 'pump' ? '🧴' : '🤱';
  const bgColor = timer.type === 'pump' ? 'bg-purple-500' : 'bg-green-500';

  return (
    <button
      onClick={onTap}
      className={`flex items-center gap-2 px-4 py-2 ${bgColor} text-white rounded-full shadow-lg animate-pulse`}
    >
      <span className="text-lg">{emoji}</span>
      <span className="font-bold">{displayTime}</span>
      <span className="text-sm opacity-80">({sideLabel})</span>
    </button>
  );
}

export function ActiveTimerBanner({ babyId, onTap }: ActiveTimerBannerProps) {
  const [timers, setTimers] = useState<PersistedTimer[]>([]);
  const [displayTimes, setDisplayTimes] = useState<Record<string, string>>({});

  // Check localStorage for active timers
  useEffect(() => {
    const checkTimers = () => {
      const activeTimers: PersistedTimer[] = [];
      
      // Check breast timer
      const breastSaved = localStorage.getItem(BREAST_TIMER_STORAGE_KEY);
      if (breastSaved) {
        try {
          const parsed: any = JSON.parse(breastSaved);
          if (parsed.babyId === babyId) {
            activeTimers.push({ ...parsed, type: 'breast' });
          }
        } catch {
          // Ignore invalid data
        }
      }
      
      // Check pump timer
      const pumpSaved = localStorage.getItem(PUMP_TIMER_STORAGE_KEY);
      if (pumpSaved) {
        try {
          const parsed: any = JSON.parse(pumpSaved);
          // Since we're reading from PUMP_TIMER_STORAGE_KEY, we can assume it's a pump timer
          // Handle both explicit type: 'pump' and missing type (backward compatibility)
          if (parsed.babyId === babyId) {
            activeTimers.push({ ...parsed, type: 'pump' });
          }
        } catch {
          // Ignore invalid data
        }
      }
      
      setTimers(activeTimers);
    };

    checkTimers();
    // Check periodically in case timer is cleared elsewhere
    const interval = setInterval(checkTimers, 1000);
    return () => clearInterval(interval);
  }, [babyId]);

  // Update display times for all active timers
  useEffect(() => {
    if (timers.length === 0) return;

    const updateDisplayTimes = () => {
      const times: Record<string, string> = {};
      
      timers.forEach((timer) => {
        let totalMs = timer.elapsedMs;
        if (timer.isRunning && timer.lastResumeTime) {
          totalMs += Date.now() - new Date(timer.lastResumeTime).getTime();
        }
        const minutes = Math.floor(totalMs / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        times[timer.type] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      });
      
      setDisplayTimes(times);
    };

    updateDisplayTimes();
    const interval = setInterval(updateDisplayTimes, 1000);
    return () => clearInterval(interval);
  }, [timers]);

  if (timers.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {timers.map((timer) => (
        <TimerBadge
          key={timer.type}
          timer={timer}
          displayTime={displayTimes[timer.type] || '0:00'}
          onTap={() => onTap(timer.type)}
        />
      ))}
    </div>
  );
}
