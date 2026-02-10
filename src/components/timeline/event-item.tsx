'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTime, formatDuration } from '@/lib/utils/date';
import { useI18n } from '@/lib/i18n';
import type { BabyEvent } from '@/lib/types';

interface EventItemProps {
  event: BabyEvent;
  onDelete: (id: string) => void;
}

const eventConfig = {
  sleep: { icon: '🛏️', label: 'Sleep', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  feed: { icon: '🍼', label: 'Feed', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  diaper: { icon: '💧', label: 'Diaper', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  pumping: { icon: '🧴', label: 'Pump', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
};

function getEventDetail(event: BabyEvent): string {
  const { event_type, metadata, started_at, ended_at } = event;

  switch (event_type) {
    case 'sleep':
      const sleepDetail = ended_at ? formatDuration(started_at, ended_at) : 'In progress';
      return `${metadata.type} • ${sleepDetail}`;
    case 'feed':
      if (metadata.method === 'breast') {
        const side = metadata.side ? metadata.side.toUpperCase() : 'Both';
        const duration = ended_at ? formatDuration(started_at, ended_at) : 'In progress';
        return `${metadata.method} (${side}) • ${duration}`;
      }
      return `Bottle • ${metadata.amount_ml || 0}ml${metadata.formula ? ' formula' : ''}`;
    case 'diaper':
      const parts = [];
      if (metadata.wet) parts.push('Wet');
      if (metadata.dirty) parts.push('Dirty');
      return parts.join(' + ');
    case 'pumping':
      return `${metadata.side?.toUpperCase() || 'Both'} • ${metadata.amount_ml || 0}ml`;
    default:
      return '';
  }
}

export function EventItem({ event, onDelete }: EventItemProps) {
  const config = eventConfig[event.event_type];
  const { t } = useI18n();

  return (
    <Card className={config.bgColor}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={`font-medium ${config.textColor}`}>
                {config.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {event.metadata?.time_specified !== false ? formatTime(event.started_at) : t('today')}
              </span>
            </div>
            <div className="text-sm mt-1">{getEventDetail(event)}</div>
            {event.metadata.notes && (
              <div className="text-sm text-muted-foreground mt-1">
                {event.metadata.notes}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(event.id)}
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
