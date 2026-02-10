'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { createEvent } from '@/lib/api/events';
import { useI18n } from '@/lib/i18n';
import type { DiaperMetadata } from '@/lib/types';
import { format } from 'date-fns';

interface DiaperSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  onSaved: () => void;
}

export function DiaperSheet({ open, onOpenChange, babyId, onSaved }: DiaperSheetProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Reset date and time to current when sheet opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      setSelectedDate(format(now, 'yyyy-MM-dd'));
      setSelectedTime(format(now, 'HH:mm'));
      setIsExpanded(false);
    }
  }, [open]);

  const quickSave = async (type: 'wet' | 'dirty' | 'both') => {
    setLoading(true);
    try {
      const metadata: DiaperMetadata & { time_specified?: boolean } = { 
        wet: type === 'wet' || type === 'both', 
        dirty: type === 'dirty' || type === 'both',
        time_specified: isExpanded
      };

      let timestamp: Date;
      if (!isExpanded) {
        // Collapsed: use current timestamp
        timestamp = new Date();
      } else {
        // Expanded: use selected date and time
        const [year, month, day] = selectedDate.split('-').map(Number);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        timestamp = new Date(year, month - 1, day, hours, minutes, 0, 0);
      }

      await createEvent({
        baby_id: babyId,
        user_id: '',
        event_type: 'diaper',
        started_at: timestamp.toISOString(),
        ended_at: null,
        metadata,
      });

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
          <SheetTitle className="text-lg">{t('logDiaper')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Date & Time Collapsible */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <button 
                type="button"
                className="flex items-center justify-between w-full h-12 px-3 rounded-lg border border-border bg-muted/30 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <span>{t('setSpecificDateTime')}</span>
                <ChevronDown 
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  {t('date')}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-12 px-3 rounded-lg border border-border bg-background text-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  {t('time')}
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full h-12 px-3 rounded-lg border border-border bg-background text-lg"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Quick Save Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => quickSave('wet')}
              disabled={loading}
              className="h-24 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex flex-col items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-50"
            >
              <span className="text-3xl">💦</span>
              <span className="font-semibold">{t('wet')}</span>
            </button>
            <button
              type="button"
              onClick={() => quickSave('dirty')}
              disabled={loading}
              className="h-24 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex flex-col items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-50"
            >
              <span className="text-3xl">💩</span>
              <span className="font-semibold">{t('dirty')}</span>
            </button>
            <button
              type="button"
              onClick={() => quickSave('both')}
              disabled={loading}
              className="h-24 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex flex-col items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-50"
            >
              <span className="text-3xl">💦💩</span>
              <span className="font-semibold">{t('both')}</span>
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {t('tapToSave')}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
