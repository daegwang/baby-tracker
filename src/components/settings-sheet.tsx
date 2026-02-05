'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useI18n } from '@/lib/i18n';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto px-4 pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">⚙️ {t('settings')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">{t('language')}</label>
            <div className="grid grid-cols-2 h-11 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-md text-sm font-medium ${
                  language === 'en' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                🇺🇸 English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ko')}
                className={`rounded-md text-sm font-medium ${
                  language === 'ko' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                🇰🇷 한국어
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">{t('theme')}</label>
            <div className="grid grid-cols-3 h-11 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`rounded-md text-sm font-medium ${
                  theme === 'light' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                ☀️
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`rounded-md text-sm font-medium ${
                  theme === 'dark' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                🌙
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`rounded-md text-sm font-medium ${
                  theme === 'system' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
