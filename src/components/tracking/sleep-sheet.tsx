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
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sleepType, setSleepType] = useState<'nap' | 'night'>('nap');
  const [loading, setLoading] = useState(false);

  // Reset to current date/time when sheet opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      setStartDate(format(now, 'yyyy-MM-dd'));
      setStartTime(format(now, 'HH:mm'));
      setEndDate(format(now, 'yyyy-MM-dd'));
      setEndTime(format(now, 'HH:mm'));
    }
  }, [open]);

  // Calculate duration in minutes
  const getDuration = () => {
    if (!startDate || !startTime || !endDate || !endTime) return null;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const start = new Date(startDate);
    start.setHours(startH, startM, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(endH, endM, 0, 0);

    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    
    return diffMinutes;
  };

  // Format duration as "Xh Ym" or "X시간 Y분" (Korean)
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (language === 'ko') {
      if (hours === 0) return `${mins}분`;
      if (mins === 0) return `${hours}시간`;
      return `${hours}시간 ${mins}분`;
    }
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Calculate preview of date range
  const getPreviewText = () => {
    if (!startDate || !startTime || !endDate || !endTime) return null;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const start = new Date(startDate);
    start.setHours(startH, startM, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(endH, endM, 0, 0);

    const startFormatted = format(start, 'M/d h:mm a');
    const endFormatted = format(end, 'M/d h:mm a');
    
    return `${startFormatted} - ${endFormatted}`;
  };

  const handleSave = async () => {
    if (!startDate || !startTime || !endDate || !endTime) return;
    
    const duration = getDuration();
    if (duration === null || duration <= 0) {
      alert(language === 'ko' ? '종료 시간은 시작 시간보다 나중이어야 합니다' : 'End time must be after start time');
      return;
    }
    
    setLoading(true);

    try {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      const start = new Date(startDate);
      start.setHours(startH, startM, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(endH, endM, 0, 0);

      const metadata: SleepMetadata = { type: sleepType };

      await createEvent({
        baby_id: babyId,
        user_id: '',
        event_type: 'sleep',
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        metadata,
      });

      setStartDate('');
      setStartTime('');
      setEndDate('');
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

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                {language === 'ko' ? '시작 날짜' : 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-border bg-background text-base"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                {language === 'ko' ? '시작 시간' : 'Start Time'}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-border bg-background text-lg"
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                {language === 'ko' ? '종료 날짜' : 'End Date'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-border bg-background text-base"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                {language === 'ko' ? '종료 시간' : 'End Time'}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-12 px-3 rounded-lg border border-border bg-background text-lg"
              />
            </div>
          </div>

          {/* Duration Display */}
          {getDuration() !== null && (
            <div className="space-y-2">
              {getDuration()! > 0 ? (
                <div className="text-center py-4 bg-primary/10 rounded-xl border-2 border-primary/20">
                  <div className="text-3xl font-bold text-primary">
                    {language === 'ko' ? '총: ' : 'Total: '}
                    {formatDuration(getDuration()!)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-destructive/10 rounded-xl border-2 border-destructive/30">
                  <div className="text-lg font-semibold text-destructive">
                    {language === 'ko' 
                      ? '⚠️ 종료 시간이 시작 시간보다 빠릅니다' 
                      : '⚠️ End time is before start time'}
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground text-center py-1">
                {getPreviewText()}
              </div>
            </div>
          )}

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !startDate || !startTime || !endDate || !endTime || (getDuration() !== null && getDuration()! <= 0)}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-semibold disabled:opacity-50"
          >
            {loading ? t('saving') : t('save')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
