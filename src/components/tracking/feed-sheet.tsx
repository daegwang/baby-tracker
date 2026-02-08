'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { EventTimer } from './event-timer';
import { createEvent } from '@/lib/api/events';
import { useI18n } from '@/lib/i18n';
import type { FeedMetadata } from '@/lib/types';

const TIMER_STORAGE_KEY = 'baby-tracker-active-timer';

interface PersistedTimer {
  type: 'breast';
  babyId: string;
  startTime: string; // ISO string
  elapsedMs: number;
  lastResumeTime: string | null; // ISO string
  isRunning: boolean;
  side: 'left' | 'right' | 'both';
}

interface FeedSheetProps {
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

export function FeedSheet({ open, onOpenChange, babyId, onSaved }: FeedSheetProps) {
  const { t, language } = useI18n();
  const [method, setMethod] = useState<'breast' | 'bottle'>('breast');
  const [side, setSide] = useState<'left' | 'right' | 'both'>('left');
  const [entryMode, setEntryMode] = useState<'timer' | 'manual'>('timer');
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date>();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [lastResumeTime, setLastResumeTime] = useState<Date | null>(null);
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [amount, setAmount] = useState(90);
  const [breastAmount, setBreastAmount] = useState(0);
  const [showBreastAmount, setShowBreastAmount] = useState(false);
  const [feedType, setFeedType] = useState<'breast_milk' | 'formula'>('breast_milk');
  const [loading, setLoading] = useState(false);

  // Reset manual times when sheet opens
  useEffect(() => {
    if (open) {
      const now = format(new Date(), 'HH:mm');
      setManualStartTime(now);
      setManualEndTime(now);
    }
  }, [open]);

  // Persist timer state to localStorage
  const persistTimer = () => {
    if (method === 'breast' && startTime) {
      const timerData: PersistedTimer = {
        type: 'breast',
        babyId,
        startTime: startTime.toISOString(),
        elapsedMs,
        lastResumeTime: lastResumeTime?.toISOString() || null,
        isRunning,
        side,
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerData));
    }
  };

  // Clear persisted timer
  const clearPersistedTimer = () => {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  // Check for persisted timer on sheet open
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        try {
          const timer: any = JSON.parse(saved);
          // Support both old 'method' and new 'type' field
          const timerType = timer.type || (timer.method === 'breast' ? 'breast' : null);
          if (timer.babyId === babyId && timerType === 'breast') {
            // Restore state directly without confirmation
            setMethod('breast');
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
            setEntryMode('timer');
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
    if (method === 'breast' && startTime && entryMode === 'timer') {
      persistTimer();
    }
  }, [method, startTime, elapsedMs, lastResumeTime, isRunning, side, entryMode, babyId]);

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
    setLoading(true);
    try {
      const metadata: FeedMetadata = { method };
      let started_at: string;
      let ended_at: string | null = null;

      if (method === 'breast') {
        metadata.side = side;
        if (breastAmount > 0) {
          metadata.amount_ml = breastAmount;
        }
        
        if (entryMode === 'manual') {
          const today = new Date();
          const [startH, startM] = manualStartTime.split(':').map(Number);
          const [endH, endM] = manualEndTime.split(':').map(Number);
          
          const startDate = new Date(today);
          startDate.setHours(startH, startM, 0, 0);
          
          const endDate = new Date(today);
          endDate.setHours(endH, endM, 0, 0);
          
          if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
          }
          
          started_at = startDate.toISOString();
          ended_at = endDate.toISOString();
        } else {
          // Timer mode: calculate ended_at from startTime + elapsedMs
          if (startTime) {
            started_at = startTime.toISOString();
            // Calculate total elapsed (include current running segment if still running)
            let totalMs = elapsedMs;
            if (isRunning && lastResumeTime) {
              totalMs += Date.now() - lastResumeTime.getTime();
            }
            ended_at = new Date(startTime.getTime() + totalMs).toISOString();
          } else {
            started_at = new Date().toISOString();
            ended_at = new Date().toISOString();
          }
        }
      } else {
        metadata.amount_ml = amount;
        metadata.formula = feedType === 'formula';
        started_at = new Date().toISOString();
      }

      await createEvent({
        baby_id: babyId,
        user_id: '',
        event_type: 'feed',
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
      setAmount(90);
      setBreastAmount(0);
      setFeedType('breast_milk');
      setEntryMode('timer');
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
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto px-4 pb-8">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">{t('logFeed')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Method Toggle */}
          <div className="grid grid-cols-2 h-11 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setMethod('breast')}
              className={`rounded-md text-sm font-medium ${
                method === 'breast' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t('breast')}
            </button>
            <button
              type="button"
              onClick={() => setMethod('bottle')}
              className={`rounded-md text-sm font-medium ${
                method === 'bottle' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t('bottle')}
            </button>
          </div>

          {method === 'breast' ? (
            <>
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

              {/* Amount (optional) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowBreastAmount(!showBreastAmount)}
                  className="flex items-center justify-between w-full h-11 px-3 rounded-lg border border-border bg-muted/30 text-sm font-medium mb-2"
                >
                  <span>{language === 'ko' ? '양 (선택)' : 'Amount (optional)'}</span>
                  <span className="text-lg">{showBreastAmount ? '▼' : '▶'}</span>
                </button>
                {showBreastAmount && (
                  <AmountPicker value={breastAmount} onChange={setBreastAmount} />
                )}
              </div>

              {/* Timer / Manual Toggle */}
              <div className="grid grid-cols-2 h-10 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => setEntryMode('timer')}
                  className={`rounded-md text-sm font-medium ${
                    entryMode === 'timer' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  ⏱️ {language === 'ko' ? '타이머' : 'Timer'}
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('manual')}
                  className={`rounded-md text-sm font-medium ${
                    entryMode === 'manual' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  ✏️ {language === 'ko' ? '직접입력' : 'Manual'}
                </button>
              </div>

              {entryMode === 'timer' ? (
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
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      {language === 'ko' ? '시작' : 'Start'}
                    </label>
                    <input
                      type="time"
                      value={manualStartTime}
                      onChange={(e) => setManualStartTime(e.target.value)}
                      className="w-full h-12 px-3 rounded-lg border border-border bg-background text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      {language === 'ko' ? '종료' : 'End'}
                    </label>
                    <input
                      type="time"
                      value={manualEndTime}
                      onChange={(e) => setManualEndTime(e.target.value)}
                      className="w-full h-12 px-3 rounded-lg border border-border bg-background text-lg"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Feed Type */}
              <div className="grid grid-cols-2 h-11 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => setFeedType('breast_milk')}
                  className={`rounded-md text-sm font-medium ${
                    feedType === 'breast_milk' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {t('breastMilk')}
                </button>
                <button
                  type="button"
                  onClick={() => setFeedType('formula')}
                  className={`rounded-md text-sm font-medium ${
                    feedType === 'formula' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {t('formula')}
                </button>
              </div>
              <AmountPicker value={amount} onChange={setAmount} />
            </>
          )}

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || (method === 'breast' && entryMode === 'timer' && !startTime)}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-semibold disabled:opacity-50"
          >
            {loading ? t('saving') : t('save')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
