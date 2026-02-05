'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { createEvent } from '@/lib/api/events';
import { useI18n } from '@/lib/i18n';
import type { SleepMetadata } from '@/lib/types';

interface SleepSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  onSaved: () => void;
}

export function SleepSheet({ open, onOpenChange, babyId, onSaved }: SleepSheetProps) {
  const { t, language } = useI18n();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sleepType, setSleepType] = useState<'nap' | 'night'>('nap');
  const [loading, setLoading] = useState(false);

  // Reset to current time when sheet opens
  useEffect(() => {
    if (open) {
      const now = format(new Date(), 'HH:mm');
      setStartTime(now);
      setEndTime(now);
    }
  }, [open]);

  const handleSave = async () => {
    if (!startTime || !endTime) return;
    setLoading(true);

    try {
      const today = new Date();
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      const startDate = new Date(today);
      startDate.setHours(startH, startM, 0, 0);
      
      const endDate = new Date(today);
      endDate.setHours(endH, endM, 0, 0);
      
      // If end time is before start time, assume it's the next day
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      const metadata: SleepMetadata = { type: sleepType };

      await createEvent({
        baby_id: babyId,
        user_id: '',
        event_type: 'sleep',
        started_at: startDate.toISOString(),
        ended_at: endDate.toISOString(),
        metadata,
      });

      setStartTime('');
      setEndTime('');
      setSleepType('nap');
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
      <SheetContent side="bottom" className="h-auto px-4 pb-8">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">{t('logSleep')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Sleep Type */}
          <div className="grid grid-cols-2 h-11 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setSleepType('nap')}
              className={`rounded-md text-sm font-medium ${
                sleepType === 'nap' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t('nap')}
            </button>
            <button
              type="button"
              onClick={() => setSleepType('night')}
              className={`rounded-md text-sm font-medium ${
                sleepType === 'night' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t('night')}
            </button>
          </div>

          {/* Start/End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                {language === 'ko' ? '시작' : 'Start'}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-border bg-background text-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                {language === 'ko' ? '종료' : 'End'}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-border bg-background text-lg"
              />
            </div>
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !startTime || !endTime}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-semibold disabled:opacity-50"
          >
            {loading ? t('saving') : t('save')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
