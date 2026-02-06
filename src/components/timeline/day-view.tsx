'use client';

import { useMemo, useState } from 'react';
import {
  format,
  isToday,
  addDays,
  subDays,
  getHours,
} from 'date-fns';
import { deleteEvent } from '@/lib/api/events';
import { useI18n } from '@/lib/i18n';
import type { BabyEvent } from '@/lib/types';

interface DayViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  events: BabyEvent[];
  onEventDeleted?: () => void;
}

type ColumnType = 'sleep' | 'feed' | 'pee' | 'poop' | 'pumping';

const columns: { type: ColumnType; icon: string; color: string; headerBg: string }[] = [
  { type: 'sleep', icon: '🛏️', color: 'bg-blue-600 text-white dark:bg-blue-400 dark:text-blue-950', headerBg: 'bg-blue-100 dark:bg-blue-800' },
  { type: 'feed', icon: '🍼', color: 'bg-green-600 text-white dark:bg-green-400 dark:text-green-950', headerBg: 'bg-green-100 dark:bg-green-800' },
  { type: 'pee', icon: '💦', color: 'bg-sky-500 text-white dark:bg-sky-300 dark:text-sky-950', headerBg: 'bg-sky-100 dark:bg-sky-800' },
  { type: 'poop', icon: '💩', color: 'bg-amber-500 text-white dark:bg-amber-300 dark:text-amber-950', headerBg: 'bg-amber-100 dark:bg-amber-800' },
  { type: 'pumping', icon: '🧴', color: 'bg-purple-600 text-white dark:bg-purple-400 dark:text-purple-950', headerBg: 'bg-purple-100 dark:bg-purple-800' },
];

interface CellEvent {
  id: string;
  time: string;
  label: string;
}

interface AggregatedCell {
  events: CellEvent[];
  totalMl: number;
  hasBreast: boolean;
}

export function DayView({ selectedDate, onDateChange, events, onEventDeleted }: DayViewProps) {
  const [editMode, setEditMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    setDeletingId(id);
    try {
      await deleteEvent(id);
      onEventDeleted?.();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };
  const { t } = useI18n();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isDayToday = isToday(selectedDate);

  // Aggregate events by hour and column
  const cellsByHourAndColumn = useMemo(() => {
    const map: Record<string, AggregatedCell> = {};
    
    events.forEach((event) => {
      const eventDate = new Date(event.started_at);
      const hour = getHours(eventDate);
      const time = format(eventDate, 'ha');
      
      const addToCell = (colType: ColumnType, label: string, ml: number = 0, isBreast: boolean = false) => {
        const key = `${hour}-${colType}`;
        if (!map[key]) {
          map[key] = { events: [], totalMl: 0, hasBreast: false };
        }
        map[key].events.push({ id: event.id, time, label });
        map[key].totalMl += ml;
        if (isBreast) map[key].hasBreast = true;
      };
      
      if (event.event_type === 'diaper') {
        if (event.metadata.wet) addToCell('pee', '💦');
        if (event.metadata.dirty) addToCell('poop', '💩');
      } else if (event.event_type === 'feed') {
        const isBreast = event.metadata.method === 'breast';
        const ml = event.metadata.amount_ml || 0;
        let label = '';
        if (isBreast) {
          let duration = '';
          if (event.ended_at) {
            const start = new Date(event.started_at).getTime();
            const end = new Date(event.ended_at).getTime();
            const totalSecs = Math.round((end - start) / 1000);
            const mins = Math.floor(totalSecs / 60);
            const secs = totalSecs % 60;
            
            // Rule: Show seconds only if duration < 1 minute
            if (mins >= 1) {
              duration = `${mins}m`;
            } else if (secs > 0) {
              duration = `${secs}s`;
            }
          }
          const side = event.metadata.side === 'left' ? 'L' : event.metadata.side === 'right' ? 'R' : 'B';
          
          // Format: Line 1: emoji+side, Line 2: duration, Line 3: ml (if any)
          let lines = [`🤱${side}`];
          if (duration) lines.push(duration);
          if (ml > 0) lines.push(`${ml}ml`);
          label = lines.join('\n');
        } else {
          label = `🍼${ml}ml`;
        }
        addToCell('feed', label, ml, isBreast);
      } else if (event.event_type === 'pumping') {
        addToCell('pumping', `${event.metadata.amount_ml || 0}ml`, event.metadata.amount_ml || 0);
      } else if (event.event_type === 'sleep') {
        const icon = event.metadata.type === 'night' ? '🌙' : '😴';
        let label = icon;
        
        if (event.ended_at) {
          const start = new Date(event.started_at);
          const end = new Date(event.ended_at);
          const startTime = start.getTime();
          const endTime = end.getTime();
          const mins = Math.round((endTime - startTime) / 60000);
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          const duration = h > 0 ? (m > 0 ? `${h}h${m}m` : `${h}h`) : `${m}m`;
          
          // Check if sleep spans multiple days
          const startDate = format(start, 'M/d');
          const endDate = format(end, 'M/d');
          const startTimeStr = format(start, 'h:mm a');
          const endTimeStr = format(end, 'h:mm a');
          
          if (startDate !== endDate) {
            // Multi-day sleep: show dates with times
            label = `${icon}${duration} (${startDate} ${startTimeStr} - ${endDate} ${endTimeStr})`;
          } else {
            // Same day sleep: just show duration
            label = `${icon}${duration}`;
          }
        }
        
        addToCell('sleep', label);
      }
    });
    
    return map;
  }, [events]);

  // Calculate stats
  const stats = useMemo(() => {
    let sleepCount = 0, sleepMinutes = 0, feedCount = 0, feedMl = 0, feedMinutes = 0, peeCount = 0, poopCount = 0, pumpCount = 0, pumpMl = 0;

    events.forEach((event) => {
      switch (event.event_type) {
        case 'sleep':
          sleepCount++;
          if (event.ended_at) {
            const start = new Date(event.started_at).getTime();
            const end = new Date(event.ended_at).getTime();
            sleepMinutes += Math.round((end - start) / 60000);
          }
          break;
        case 'feed':
          feedCount++;
          if (event.metadata.amount_ml) feedMl += event.metadata.amount_ml;
          if (event.metadata.method === 'breast' && event.ended_at) {
            const start = new Date(event.started_at).getTime();
            const end = new Date(event.ended_at).getTime();
            feedMinutes += Math.round((end - start) / 60000);
          }
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

    return { sleepCount, sleepMinutes, feedCount, feedMl, feedMinutes, peeCount, poopCount, pumpCount, pumpMl };
  }, [events]);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h${m}m`;
  };

  const getHeaderSummary = (type: ColumnType) => {
    switch (type) {
      case 'sleep': return stats.sleepCount > 0 ? (stats.sleepMinutes > 0 ? `${stats.sleepCount}\n${formatDuration(stats.sleepMinutes)}` : `${stats.sleepCount}`) : '';
      case 'feed': {
        if (stats.feedCount === 0) return '';
        const parts: string[] = [];
        if (stats.feedMl > 0) parts.push(`${stats.feedMl}ml`);
        if (stats.feedMinutes > 0) parts.push(formatDuration(stats.feedMinutes));
        return parts.length > 0 ? `${stats.feedCount}\n${parts.join(' ')}` : `${stats.feedCount}`;
      }
      case 'pee': return stats.peeCount > 0 ? `${stats.peeCount}` : '';
      case 'poop': return stats.poopCount > 0 ? `${stats.poopCount}` : '';
      case 'pumping': return stats.pumpCount > 0 ? (stats.pumpMl > 0 ? `${stats.pumpCount}\n${stats.pumpMl}ml` : `${stats.pumpCount}`) : '';
      default: return '';
    }
  };

  const goToPreviousDay = () => onDateChange(subDays(selectedDate, 1));
  const goToNextDay = () => onDateChange(addDays(selectedDate, 1));
  const goToToday = () => onDateChange(new Date());

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousDay}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted active:bg-muted/80"
        >
          ←
        </button>
        <div className="text-center">
          <h3 className="font-semibold">
            {format(selectedDate, 'EEEE, MMM d')}
          </h3>
          {!isDayToday && (
            <button
              type="button"
              onClick={goToToday}
              className="text-xs text-primary"
            >
              {t('today')}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className={`w-9 h-9 rounded-full flex items-center justify-center active:bg-muted/80 ${editMode ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300' : 'hover:bg-muted'}`}
          >
            {editMode ? '✓' : '✏️'}
          </button>
          <button
            type="button"
            onClick={goToNextDay}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted active:bg-muted/80"
          >
            →
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Header with Summary */}
        <div className="grid grid-cols-[44px_repeat(5,1fr)] border-b border-border min-w-0">
          <div className="p-1.5 bg-muted" />
          {columns.map((col) => {
            const summary = getHeaderSummary(col.type);
            return (
              <div
                key={col.type}
                className={`p-2 text-center border-l border-border min-w-0 overflow-hidden ${col.headerBg}`}
              >
                <div className="text-lg leading-none">{col.icon}</div>
                {summary && (
                  <div className="text-[10px] font-semibold mt-1 text-foreground/80 whitespace-pre-line leading-tight">{summary}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Body - Hours */}
        <div>
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[44px_repeat(5,1fr)] border-b border-border last:border-b-0 min-w-0">
              {/* Hour label */}
              <div className="p-1 text-[10px] text-muted-foreground text-right pr-1 border-r border-border bg-muted flex items-center justify-end">
                {hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`}
              </div>
              
              {/* Activity columns */}
              {columns.map((col) => {
                const key = `${hour}-${col.type}`;
                const cell = cellsByHourAndColumn[key];
                
                return (
                  <div
                    key={key}
                    className="min-h-[40px] p-0.5 border-l border-border flex flex-col gap-0.5 items-center justify-center overflow-hidden"
                  >
                    {cell?.events.map((ev) => (
                      <div
                        key={ev.id}
                        className={`${col.color} text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 overflow-hidden min-w-0 max-w-full`}
                        title={ev.label}
                      >
                        <span className="overflow-hidden min-w-0 flex-shrink whitespace-pre-line leading-tight text-center">{ev.label}</span>
                        {editMode && (
                          <button
                            type="button"
                            onClick={() => handleDelete(ev.id)}
                            disabled={deletingId === ev.id}
                            className="opacity-60 hover:opacity-100 active:opacity-100 flex-shrink-0"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
