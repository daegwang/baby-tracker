'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { createEvent } from '@/lib/api/events';
import { useI18n } from '@/lib/i18n';
import type { DiaperMetadata } from '@/lib/types';

interface DiaperSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  onSaved: () => void;
}

export function DiaperSheet({ open, onOpenChange, babyId, onSaved }: DiaperSheetProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const quickSave = async (type: 'wet' | 'dirty' | 'both') => {
    setLoading(true);
    try {
      const metadata: DiaperMetadata = { 
        wet: type === 'wet' || type === 'both', 
        dirty: type === 'dirty' || type === 'both' 
      };

      await createEvent({
        baby_id: babyId,
        user_id: '',
        event_type: 'diaper',
        started_at: new Date().toISOString(),
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
