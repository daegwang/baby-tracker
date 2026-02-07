'use client';

import { useState } from 'react';
import {
  format,
  isToday,
  addDays,
  subDays,
} from 'date-fns';
import { deleteEvent } from '@/lib/api/events';
import { useI18n } from '@/lib/i18n';
import type { BabyEvent } from '@/lib/types';

interface LogViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  events: BabyEvent[];
  onEventDeleted?: () => void;
}

const eventConfig = {
  sleep: { icon: '🛏️', label: 'Sleep', bgColor: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-200 dark:border-blue-800' },
  feed: { icon: '🍼', label: 'Feed', bgColor: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-700 dark:text-green-300', borderColor: 'border-green-200 dark:border-green-800' },
  diaper: { icon: '💧', label: 'Diaper', bgColor: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-700 dark:text-amber-300', borderColor: 'border-amber-200 dark:border-amber-800' },
  pumping: { icon: '🧴', label: 'Pump', bgColor: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-700 dark:text-purple-300', borderColor: 'border-purple-200 dark:border-purple-800' },
};

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return 'In progress';
  
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const minutes = Math.round((end - start) / 60000);
  
  if (minutes < 60) return `${minutes}m`;
  
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getEventDetail(event: BabyEvent): string[] {
  const { event_type, metadata, started_at, ended_at } = event;
  const details: string[] = [];

  switch (event_type) {
    case 'sleep':
      const sleepType = metadata.type === 'night' ? 'Night sleep' : 'Nap';
      details.push(sleepType);
      if (ended_at) {
        const duration = formatDuration(started_at, ended_at);
        details.push(duration);
        
        // Show end time for multi-day sleeps
        const startDate = format(new Date(started_at), 'M/d');
        const endDate = format(new Date(ended_at), 'M/d');
        if (startDate !== endDate) {
          details.push(`Ended: ${format(new Date(ended_at), 'M/d h:mm a')}`);
        }
      } else {
        details.push('In progress');
      }
      break;
      
    case 'feed':
      if (metadata.method === 'breast') {
        const side = metadata.side === 'left' ? 'Left' : metadata.side === 'right' ? 'Right' : 'Both';
        details.push(`Breastfeed (${side})`);
        if (ended_at) {
          details.push(formatDuration(started_at, ended_at));
        }
        if (metadata.amount_ml) {
          details.push(`${metadata.amount_ml}ml`);
        }
      } else {
        details.push('Bottle');
        if (metadata.amount_ml) {
          details.push(`${metadata.amount_ml}ml`);
        }
        if (metadata.formula) {
          details.push('Formula');
        }
      }
      break;
      
    case 'diaper':
      const parts = [];
      if (metadata.wet) parts.push('💦 Wet');
      if (metadata.dirty) parts.push('💩 Dirty');
      if (parts.length > 0) {
        details.push(parts.join(' + '));
      }
      break;
      
    case 'pumping':
      const pumpSide = metadata.side === 'left' ? 'Left' : metadata.side === 'right' ? 'Right' : 'Both';
      details.push(pumpSide);
      if (metadata.amount_ml) {
        details.push(`${metadata.amount_ml}ml`);
      }
      break;
  }

  if (metadata.notes) {
    details.push(`Note: ${metadata.notes}`);
  }

  return details;
}

export function LogView({ selectedDate, onDateChange, events, onEventDeleted }: LogViewProps) {
  const { t } = useI18n();
  const [editMode, setEditMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isDayToday = isToday(selectedDate);

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

      {/* Events List */}
      <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No events recorded yet
          </div>
        ) : (
          events.map((event) => {
            const config = eventConfig[event.event_type];
            const details = getEventDetail(event);
            
            return (
              <div
                key={event.id}
                className={`${config.bgColor} border ${config.borderColor} rounded-lg p-3`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium ${config.textColor}`}>
                        {config.label}
                      </span>
                      <span className="text-sm font-semibold text-foreground flex-shrink-0">
                        {format(new Date(event.started_at), 'h:mm a')}
                      </span>
                    </div>
                    <div className="text-sm mt-1 space-y-0.5">
                      {details.map((detail, idx) => (
                        <div key={idx} className="text-foreground/80">
                          {detail}
                        </div>
                      ))}
                    </div>
                  </div>
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium flex-shrink-0"
                    >
                      {deletingId === event.id ? '...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
