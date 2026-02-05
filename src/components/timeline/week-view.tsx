'use client';

import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  addWeeks,
  subWeeks,
  getHours,
} from 'date-fns';
import { useI18n } from '@/lib/i18n';
import type { BabyEvent, EventType } from '@/lib/types';

interface WeekViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  events: BabyEvent[];
}

const eventColors: Record<EventType, string> = {
  sleep: 'bg-blue-600 text-white dark:bg-blue-400 dark:text-blue-950',
  feed: 'bg-green-600 text-white dark:bg-green-400 dark:text-green-950',
  diaper: 'bg-amber-500 text-white dark:bg-amber-300 dark:text-amber-950',
  pumping: 'bg-purple-600 text-white dark:bg-purple-400 dark:text-purple-950',
};

function getEventLabel(event: BabyEvent): string {
  const { event_type, metadata, started_at, ended_at } = event;
  
  const getDuration = () => {
    if (!ended_at) return '';
    const start = new Date(started_at).getTime();
    const end = new Date(ended_at).getTime();
    const totalSecs = Math.round((end - start) / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins > 0 && secs > 0) return `${mins}m${secs}s`;
    if (mins > 0) return `${mins}m`;
    if (secs > 0) return `${secs}s`;
    return '';
  };

  switch (event_type) {
    case 'feed':
      if (metadata.method === 'breast') {
        const duration = getDuration();
        const ml = metadata.amount_ml;
        const mlPart = ml ? `(${ml}ml)` : '';
        return duration ? `🤱${duration}${mlPart}` : (ml ? `🤱${ml}ml` : '🤱');
      }
      return `🍼${metadata.amount_ml || 0}ml`;
    case 'diaper':
      return `${metadata.wet ? '💦' : ''}${metadata.dirty ? '💩' : ''}`;
    case 'pumping':
      return `🧴${metadata.amount_ml || 0}ml`;
    case 'sleep': {
      const icon = metadata.type === 'night' ? '🌙' : '😴';
      if (!ended_at) return icon;
      const start = new Date(started_at).getTime();
      const end = new Date(ended_at).getTime();
      const mins = Math.round((end - start) / 60000);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const duration = h > 0 ? (m > 0 ? `${h}h${m}m` : `${h}h`) : `${m}m`;
      return `${icon}${duration}`;
    }
    default:
      return '';
  }
}

export function WeekView({ selectedDate, onDateChange, events }: WeekViewProps) {
  const { t } = useI18n();
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const hours = Array.from({ length: 19 }, (_, i) => i + 5);

  const eventsByDayAndHour = useMemo(() => {
    const map: Record<string, { event: BabyEvent; time: string }[]> = {};
    events.forEach((event) => {
      const eventDate = new Date(event.started_at);
      const dayKey = format(eventDate, 'yyyy-MM-dd');
      const hour = getHours(eventDate);
      const time = format(eventDate, 'h:mm a');
      const key = `${dayKey}-${hour}`;
      if (!map[key]) map[key] = [];
      map[key].push({ event, time });
    });
    return map;
  }, [events]);

  const goToPreviousWeek = () => onDateChange(subWeeks(selectedDate, 1));
  const goToNextWeek = () => onDateChange(addWeeks(selectedDate, 1));
  const goToToday = () => onDateChange(new Date());

  const isCurrentWeek = weekDays.some((d) => isToday(d));

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousWeek}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted active:bg-muted/80"
        >
          ←
        </button>
        <div className="text-center">
          <h3 className="font-semibold text-sm">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
          </h3>
          {!isCurrentWeek && (
            <button
              type="button"
              onClick={goToToday}
              className="text-xs text-primary"
            >
              {t('today')}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={goToNextWeek}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted active:bg-muted/80"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Header - Days */}
        <div className="grid grid-cols-[72px_repeat(7,1fr)] bg-muted border-b border-border">
          <div className="p-1" />
          {weekDays.map((day) => {
            const isDayToday = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={`p-1.5 text-center border-l border-border ${isDayToday ? 'bg-primary/20 dark:bg-primary/30' : ''}`}
              >
                <div className="text-[10px] text-muted-foreground uppercase">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-sm font-semibold ${isDayToday ? 'text-primary' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Body - Hours */}
        <div>
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[72px_repeat(7,1fr)] border-b border-border last:border-b-0">
              {/* Hour label */}
              <div className="p-1 text-[10px] text-muted-foreground text-right pr-2 border-r border-border bg-muted flex items-center justify-end">
                {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
              </div>
              
              {/* Day cells */}
              {weekDays.map((day) => {
                const key = `${format(day, 'yyyy-MM-dd')}-${hour}`;
                const cellEvents = eventsByDayAndHour[key] || [];
                const isDayToday = isToday(day);
                
                return (
                  <div
                    key={key}
                    className={`min-h-[36px] p-0.5 border-l border-border ${isDayToday ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      {cellEvents.map(({ event }, idx) => (
                        <div
                          key={`${event.id}-${idx}`}
                          className={`${eventColors[event.event_type]} text-[9px] px-1 py-0.5 rounded font-semibold`}
                        >
                          {getEventLabel(event)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-600 dark:bg-blue-400" />
          <span className="text-muted-foreground">{t('sleep')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-600 dark:bg-green-400" />
          <span className="text-muted-foreground">{t('feed')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500 dark:bg-amber-300" />
          <span className="text-muted-foreground">{t('diaper')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-600 dark:bg-purple-400" />
          <span className="text-muted-foreground">{t('pump')}</span>
        </div>
      </div>
    </div>
  );
}
