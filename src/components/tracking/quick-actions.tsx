'use client';

import { useI18n } from '@/lib/i18n';

interface QuickActionsProps {
  onSleep: () => void;
  onFeed: () => void;
  onDiaper: () => void;
  onPump: () => void;
}

export function QuickActions({ onSleep, onFeed, onDiaper, onPump }: QuickActionsProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <button
        type="button"
        onClick={onSleep}
        className="h-20 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 flex flex-col items-center justify-center gap-1 active:bg-blue-200 dark:active:bg-blue-800"
      >
        <span className="text-2xl">🛏️</span>
        <span className="font-medium">{t('sleep')}</span>
      </button>

      <button
        type="button"
        onClick={onFeed}
        className="h-20 rounded-xl bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 flex flex-col items-center justify-center gap-1 active:bg-green-200 dark:active:bg-green-800"
      >
        <span className="text-2xl">🍼</span>
        <span className="font-medium">{t('feed')}</span>
      </button>

      <button
        type="button"
        onClick={onDiaper}
        className="h-20 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 flex flex-col items-center justify-center gap-1 active:bg-amber-200 dark:active:bg-amber-800"
      >
        <span className="text-2xl">💧</span>
        <span className="font-medium">{t('diaper')}</span>
      </button>

      <button
        type="button"
        onClick={onPump}
        className="h-20 rounded-xl bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 flex flex-col items-center justify-center gap-1 active:bg-purple-200 dark:active:bg-purple-800"
      >
        <span className="text-2xl">🧴</span>
        <span className="font-medium">{t('pump')}</span>
      </button>
    </div>
  );
}
