'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { addDays, isToday } from 'date-fns';
import { BabyHeader } from '@/components/baby/baby-header';
import { TodaySummary } from '@/components/tracking/today-summary';
import { QuickActions } from '@/components/tracking/quick-actions';
import { SleepSheet } from '@/components/tracking/sleep-sheet';
import { FeedSheet } from '@/components/tracking/feed-sheet';
import { DiaperSheet } from '@/components/tracking/diaper-sheet';
import { PumpSheet } from '@/components/tracking/pump-sheet';
import { Button } from '@/components/ui/button';
import { getBabies } from '@/lib/api/babies';
import { getLastEvents } from '@/lib/api/events';
import { useI18n } from '@/lib/i18n';
import type { Baby, BabyEvent, EventType } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [baby, setBaby] = useState<Baby | null>(null);
  const [lastEvents, setLastEvents] = useState<Partial<Record<EventType, BabyEvent>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [sleepSheetOpen, setSleepSheetOpen] = useState(false);
  const [feedSheetOpen, setFeedSheetOpen] = useState(false);
  const [diaperSheetOpen, setDiaperSheetOpen] = useState(false);
  const [pumpSheetOpen, setPumpSheetOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const babies = await getBabies();
      
      if (babies.length === 0) {
        router.push('/dashboard/setup');
        return;
      }

      const currentBaby = babies[0];
      setBaby(currentBaby);

      const events = await getLastEvents(currentBaby.id);
      setLastEvents(events);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSaved = async () => {
    if (baby) {
      const events = await getLastEvents(baby.id);
      setLastEvents(events);
      setRefreshKey(k => k + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!baby) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <BabyHeader baby={baby} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-lg"
            >
              {language === 'en' ? '🇺🇸' : '🇰🇷'}
            </button>
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-lg"
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>
            )}
            <Link href="/dashboard/timeline">
              <Button variant="outline">{t('timeline')}</Button>
            </Link>
          </div>
        </div>

        {/* Summary */}
        <TodaySummary 
          babyId={baby.id}
          date={selectedDate}
          onDateChange={setSelectedDate}
          lastEvents={lastEvents}
          refreshKey={refreshKey} 
        />

        {/* Quick Actions */}
        <QuickActions
          onSleep={() => setSleepSheetOpen(true)}
          onFeed={() => setFeedSheetOpen(true)}
          onDiaper={() => setDiaperSheetOpen(true)}
          onPump={() => setPumpSheetOpen(true)}
        />

        {/* Sheets */}
        <SleepSheet
          open={sleepSheetOpen}
          onOpenChange={setSleepSheetOpen}
          babyId={baby.id}
          onSaved={handleEventSaved}
        />
        <FeedSheet
          open={feedSheetOpen}
          onOpenChange={setFeedSheetOpen}
          babyId={baby.id}
          onSaved={handleEventSaved}
        />
        <DiaperSheet
          open={diaperSheetOpen}
          onOpenChange={setDiaperSheetOpen}
          babyId={baby.id}
          onSaved={handleEventSaved}
        />
        <PumpSheet
          open={pumpSheetOpen}
          onOpenChange={setPumpSheetOpen}
          babyId={baby.id}
          onSaved={handleEventSaved}
        />
      </div>
    </div>
  );
}
