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
    <div className="relative h-44 overflow-hidden rounded-lg border bg-muted/30">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-11 bg-primary/10 border-y border-primary/30 pointer-events-none z-10" />
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-background to-transparent pointer-events-none z-20" />
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory"
        style={{ paddingTop: '88px', paddingBottom: '88px', scrollbarWidth: 'none' }}
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
  const [method, setMethod] = useState<'breast' | 'bottle'>('bottle');
  const [side, setSide] = useState<'left' | 'right' | 'both'>('left');
  const [entryMode, setEntryMode] = useState<'timer' | 'manual'>('timer');
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date>();
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [amount, setAmount] = useState(90);
  const [breastAmount, setBreastAmount] = useState<string>('');
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

  const handleStart = () => { setStartTime(new Date()); setIsRunning(true); };
  const handleResume = () => { setIsRunning(true); };
  const handleStop = () => { setIsRunning(false); };
  const handleReset = () => { setStartTime(undefined); setIsRunning(false); };

  const handleSave = async () => {
    setLoading(true);
    try {
      const metadata: FeedMetadata = { method };
      let started_at: string;
      let ended_at: string | null = null;

      if (method === 'breast') {
        metadata.side = side;
        if (breastAmount) {
          metadata.amount_ml = parseInt(breastAmount) || undefined;
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
          started_at = startTime ? startTime.toISOString() : new Date().toISOString();
          ended_at = new Date().toISOString(); // Always set end time
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

      setIsRunning(false);
      setStartTime(undefined);
      setAmount(90);
      setBreastAmount('');
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
                <label className="block text-sm text-muted-foreground mb-1">
                  {language === 'ko' ? '양 (선택)' : 'Amount (optional)'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={breastAmount}
                    onChange={(e) => setBreastAmount(e.target.value)}
                    placeholder="0"
                    className="flex-1 h-12 px-3 rounded-lg border border-border bg-background text-lg text-center"
                  />
                  <span className="text-muted-foreground">ml</span>
                </div>
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
