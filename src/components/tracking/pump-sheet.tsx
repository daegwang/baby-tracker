'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { EventTimer } from './event-timer';
import { createEvent } from '@/lib/api/events';
import { useI18n } from '@/lib/i18n';
import type { PumpingMetadata } from '@/lib/types';

const PUMP_TIMER_STORAGE_KEY = 'baby-tracker-active-pump-timer';

interface PersistedTimer {
  type: 'pump';
  babyId: string;
  startTime: string; // ISO string
  elapsedMs: number;
  lastResumeTime: string | null; // ISO string
  isRunning: boolean;
  side: 'left' | 'right' | 'both';
}

interface PumpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  onSaved: () => void;
}

function AmountPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const amounts = Array.from({ length: 31 }, (_, i) => i * 10);
  
  useEffect(() => {
    if (containerRef.current) {
      const index = amounts.indexOf(value);
      containerRef.current.scrollTop = index * 48;
    }
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / 48);
      const newValue = amounts[Math.min(index, amounts.length - 1)];
      if (newValue !== value) onChange(newValue);
    }
  };

  return (
    <div className="relative h-36 overflow-hidden rounded-lg border bg-muted/30">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-11 bg-primary/10 border-y border-primary/30 pointer-events-none z-10" />
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background to-transparent pointer-events-none z-20" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory"
        style={{ paddingTop: '66px', paddingBottom: '66px', scrollbarWidth: 'none' }}
      >
        {amounts.map((amt) => (
          <div
            key={amt}
            onClick={() => onChange(amt)}
            className={`h-12 flex items-center justify-center snap-center text-2xl font-bold tabular-nums cursor-pointer ${
              amt === value ? 'text-primary' : 'text-muted-foreground/60'
            }`}
          >
            {amt} ml
          </div>
        ))}
      </div>
    </div>
  );
}

export function PumpSheet({ open, onOpenChange, babyId, onSaved }: PumpSheetProps) {
  const { t } = useI18n();
  const [side, setSide] = useState<'left' | 'right' | 'both'>('both');
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date>();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [lastResumeTime, setLastResumeTime] = useState<Date | null>(null);
  const [amount, setAmount] = useState(60);
  const [loading, setLoading] = useState(false);

  // Persist timer state to localStorage
  const persistTimer = () => {
    if (startTime) {
      const timerData: PersistedTimer = {
        type: 'pump',
        babyId,
        startTime: startTime.toISOString(),
        elapsedMs,
        lastResumeTime: lastResumeTime?.toISOString() || null,
        isRunning,
        side,
      };
      localStorage.setItem(PUMP_TIMER_STORAGE_KEY, JSON.stringify(timerData));
    }
  };

  // Clear persisted timer
  const clearPersistedTimer = () => {
    localStorage.removeItem(PUMP_TIMER_STORAGE_KEY);
  };

  // Check for persisted timer on sheet open
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(PUMP_TIMER_STORAGE_KEY);
      if (saved) {
        try {
          const timer: any = JSON.parse(saved);
          // Handle both explicit type: 'pump' and missing type (backward compatibility)
          if (timer.babyId === babyId) {
            // Restore state directly without confirmation
            setSide(timer.side);
            setStartTime(new Date(timer.startTime));
            
            // Calculate elapsed time correctly to avoid double-counting
            if (timer.isRunning && timer.lastResumeTime) {
              // If timer was running, calculate total elapsed up to now
              const elapsedSinceResume = Date.now() - new Date(timer.lastResumeTime).getTime();
              setElapsedMs(timer.elapsedMs + elapsedSinceResume);
              setLastResumeTime(new Date()); // Set to now for continued tracking
            } else {
              // If timer was paused, keep the saved elapsed time
              setElapsedMs(timer.elapsedMs);
              setLastResumeTime(timer.lastResumeTime ? new Date(timer.lastResumeTime) : null);
            }
            
            setIsRunning(timer.isRunning);
          }
        } catch (error) {
          console.error('Failed to restore timer:', error);
          clearPersistedTimer();
        }
      }
    }
  }, [open, babyId]);

  // Auto-persist timer state when it changes
  useEffect(() => {
    if (startTime) {
      persistTimer();
    }
  }, [startTime, elapsedMs, lastResumeTime, isRunning, side, babyId]);

  const handleStart = () => { 
    const now = new Date();
    setStartTime(now);
    setLastResumeTime(now);
    setElapsedMs(0);
    setIsRunning(true);
  };
  
  const handleResume = () => { 
    const now = new Date();
    setLastResumeTime(now);
    setIsRunning(true);
  };
  
  const handleStop = () => { 
    if (lastResumeTime) {
      setElapsedMs(prev => prev + (Date.now() - lastResumeTime.getTime()));
    }
    setIsRunning(false);
  };
  
  const handleReset = () => { 
    setStartTime(undefined);
    setLastResumeTime(null);
    setElapsedMs(0);
    setIsRunning(false);
    clearPersistedTimer();
  };

  const handleSave = async () => {
    if (!amount) return;
    setLoading(true);

    try {
      const metadata: PumpingMetadata = { side, amount_ml: amount };
      
      // Calculate total elapsed time including current running segment
      let totalMs = elapsedMs;
      if (isRunning && lastResumeTime) {
        totalMs += Date.now() - lastResumeTime.getTime();
      }
      
      const started_at = startTime?.toISOString() || new Date().toISOString();
      const ended_at = startTime ? new Date(startTime.getTime() + totalMs).toISOString() : null;

      await createEvent({
        baby_id: babyId,
        user_id: '',
        event_type: 'pumping',
        started_at,
        ended_at,
        metadata,
      });

      // Clear persisted timer on successful save
      clearPersistedTimer();
      
      setIsRunning(false);
      setStartTime(undefined);
      setElapsedMs(0);
      setLastResumeTime(null);
      setAmount(60);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[75vh] overflow-y-auto px-4 pb-8">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">{t('logPumping')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Side */}
          <div className="grid grid-cols-3 gap-2">
            {(['left', 'right', 'both'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={`h-12 rounded-lg text-sm font-medium border-2 ${
                  side === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted bg-muted text-muted-foreground'
                }`}
              >
                {t(s)}
              </button>
            ))}
          </div>

          {/* Timer (optional) */}
          <EventTimer
            isRunning={isRunning}
            startTime={startTime}
            elapsedMs={elapsedMs}
            lastResumeTime={lastResumeTime}
            onStart={handleStart}
            onStop={handleStop}
            onResume={handleResume}
            onReset={handleReset}
          />

          {/* Amount */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">{t('amount')}</label>
            <AmountPicker value={amount} onChange={setAmount} />
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !amount}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-semibold disabled:opacity-50"
          >
            {loading ? t('saving') : t('save')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
