'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { BabyHeader } from '@/components/baby/baby-header';
import { WeekView } from '@/components/timeline/week-view';
import { DayView } from '@/components/timeline/day-view';
import { LogView } from '@/components/timeline/log-view';
import { getBabies } from '@/lib/api/babies';
import { getEvents, getEventsForMonth } from '@/lib/api/events';
import { useI18n } from '@/lib/i18n';
import type { Baby, BabyEvent } from '@/lib/types';

type ViewMode = 'daily' | 'weekly';
type DailyViewMode = 'table' | 'log';

export default function TimelinePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [baby, setBaby] = useState<Baby | null>(null);
  const [events, setEvents] = useState<BabyEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [dailyViewMode, setDailyViewMode] = useState<DailyViewMode>('table');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBaby();
  }, []);

  useEffect(() => {
    if (baby) {
      loadEvents();
    }
  }, [baby, selectedDate, viewMode]);

  const loadBaby = async () => {
    try {
      const babies = await getBabies();
      
      if (babies.length === 0) {
        router.push('/dashboard/setup');
        return;
      }

      setBaby(babies[0]);
    } catch (error) {
      console.error('Failed to load baby:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    if (!baby) return;

    try {
      if (viewMode === 'daily') {
        const data = await getEvents(baby.id, selectedDate);
        setEvents(data);
      } else {
        const data = await getEventsForMonth(
          baby.id,
          selectedDate.getFullYear(),
          selectedDate.getMonth()
        );
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, BabyEvent[]> = {};
    events.forEach((event) => {
      const key = format(new Date(event.started_at), 'yyyy-MM-dd');
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, [events]);

  const dayEvents = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate[key] || [];
  }, [eventsByDate, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!baby) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <BabyHeader baby={baby} />
          <Link href="/dashboard">
            <Button variant="outline">{t('back')}</Button>
          </Link>
        </div>

        {/* View Mode Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg mb-4">
          {(['daily', 'weekly'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`py-2.5 px-4 rounded-md text-sm font-medium ${
                viewMode === mode
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {t(mode)}
            </button>
          ))}
        </div>

        {/* Daily View Mode Toggle */}
        {viewMode === 'daily' && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg mb-4">
            {(['table', 'log'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDailyViewMode(mode)}
                className={`py-2 px-4 rounded-md text-sm font-medium ${
                  dailyViewMode === mode
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {mode === 'table' ? 'Table View' : 'Log View'}
              </button>
            ))}
          </div>
        )}

        {/* View Content */}
        {viewMode === 'daily' && dailyViewMode === 'table' && (
          <DayView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            events={dayEvents}
            onEventDeleted={loadEvents}
          />
        )}

        {viewMode === 'daily' && dailyViewMode === 'log' && (
          <LogView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            events={dayEvents}
            onEventDeleted={loadEvents}
          />
        )}

        {viewMode === 'weekly' && (
          <WeekView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            events={events}
          />
        )}
      </div>
    </div>
  );
}
