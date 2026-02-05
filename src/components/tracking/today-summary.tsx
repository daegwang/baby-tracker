'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, formatDistanceToNow, addDays, isToday } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { getEvents } from '@/lib/api/events';
import { useI18n } from '@/lib/i18n';
import type { BabyEvent, EventType } from '@/lib/types';

interface TodaySummaryProps {
  babyId: string;
  date: Date;
  onDateChange: (date: Date) => void;
  lastEvents: Partial<Record<EventType, BabyEvent>>;
  refreshKey?: number;
}

export function TodaySummary({ babyId, date, onDateChange, lastEvents, refreshKey }: TodaySummaryProps) {
  const { t, language } = useI18n();
  const [events, setEvents] = useState<BabyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [babyId, date, refreshKey]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents(babyId, date);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    let sleepCount = 0, feedCount = 0, feedMl = 0, peeCount = 0, poopCount = 0, pumpCount = 0, pumpMl = 0;

    events.forEach((event) => {
      switch (event.event_type) {
        case 'sleep': sleepCount++; break;
        case 'feed':
          feedCount++;
          if (event.metadata.amount_ml) feedMl += event.metadata.amount_ml;
          break;
        case 'diaper':
          if (event.metadata.wet) peeCount++;
          if (event.metadata.dirty) poopCount++;
          break;
        case 'pumping':
          pumpCount++;
          if (event.metadata.amount_ml) pumpMl += event.metadata.amount_ml;
          break;
      }
    });

    return { sleepCount, feedCount, feedMl, peeCount, poopCount, pumpCount, pumpMl };
  }, [events]);

  const getTimeAgo = (event: BabyEvent | undefined) => {
    if (!event) return null;
    return formatDistanceToNow(new Date(event.started_at), { 
      addSuffix: true,
      locale: language === 'ko' ? ko : enUS 
    });
  };

  const getLastDetail = (type: EventType) => {
    const event = lastEvents[type];
    if (!event) return null;
    
    switch (type) {
      case 'feed':
        if (event.metadata.method === 'breast') {
          return event.metadata.side?.[0]?.toUpperCase() || 'B';
        }
        return `${event.metadata.amount_ml || 0}ml`;
      case 'diaper':
        return `${event.metadata.wet ? '💦' : ''}${event.metadata.dirty ? '💩' : ''}`;
      case 'pumping':
        return `${event.metadata.amount_ml || 0}ml`;
      case 'sleep':
        return event.metadata.type === 'night' ? '🌙' : '😴';
      default:
        return null;
    }
  };

  const dateLabel = language === 'ko' 
    ? format(date, 'M월 d일 EEEE', { locale: ko })
    : format(date, 'EEEE, MMM d');

  const columns = [
    { type: 'sleep' as EventType, icon: '🛏️', count: stats.sleepCount, ml: null, bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-200', subtext: 'text-blue-600 dark:text-blue-300' },
    { type: 'feed' as EventType, icon: '🍼', count: stats.feedCount, ml: stats.feedMl, bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200', subtext: 'text-green-600 dark:text-green-300' },
    { type: 'diaper' as EventType, icon: '💧', count: stats.peeCount + stats.poopCount, ml: null, bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-800 dark:text-amber-200', subtext: 'text-amber-600 dark:text-amber-300', extra: `💦${stats.peeCount} 💩${stats.poopCount}` },
    { type: 'pumping' as EventType, icon: '🧴', count: stats.pumpCount, ml: stats.pumpMl, bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-200', subtext: 'text-purple-600 dark:text-purple-300' },
  ];

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 mb-4 animate-pulse">
        <div className="h-5 bg-muted rounded w-32 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => onDateChange(addDays(date, -1))}
          className="w-8 h-8 rounded-full flex items-center justify-center text-foreground active:bg-muted"
        >
          ←
        </button>
        <h2 className="text-sm font-medium text-foreground">{dateLabel}</h2>
        <button
          type="button"
          onClick={() => onDateChange(addDays(date, 1))}
          disabled={isToday(date)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-foreground active:bg-muted disabled:opacity-30"
        >
          →
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {columns.map((col) => {
          const timeAgo = getTimeAgo(lastEvents[col.type]);
          const lastDetail = getLastDetail(col.type);
          
          return (
            <div key={col.type} className={`${col.bg} rounded-xl p-3`}>
              <div className="flex items-start justify-between mb-1">
                <span className="text-2xl">{col.icon}</span>
                <span className={`text-2xl font-bold ${col.text}`}>{col.count}</span>
              </div>
              
              {col.ml !== null && col.ml > 0 && (
                <div className={`text-xs font-medium ${col.subtext}`}>{col.ml}ml total</div>
              )}
              
              {col.extra && (
                <div className={`text-xs ${col.subtext}`}>{col.extra}</div>
              )}
              
              {timeAgo ? (
                <div className={`text-[11px] ${col.subtext} mt-2 pt-2 border-t border-current/10`}>
                  <span className="opacity-70">{language === 'ko' ? '마지막' : 'Last'}:</span> {timeAgo}
                  {lastDetail && <span className="ml-1 opacity-70">({lastDetail})</span>}
                </div>
              ) : (
                <div className={`text-[11px] ${col.subtext} mt-2 pt-2 border-t border-current/10 opacity-50`}>
                  {t('noActivityYet')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
