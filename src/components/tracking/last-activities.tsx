'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatTime, formatDuration } from '@/lib/utils/date';
import { useI18n } from '@/lib/i18n';
import type { BabyEvent, EventType } from '@/lib/types';

interface LastActivitiesProps {
  lastEvents: Partial<Record<EventType, BabyEvent>>;
}

export function LastActivities({ lastEvents }: LastActivitiesProps) {
  const { t } = useI18n();

  const eventConfig: Record<EventType, { icon: string; labelKey: 'sleep' | 'feed' | 'diaper' | 'pump'; color: string }> = {
    sleep: { icon: '🛏️', labelKey: 'sleep', color: 'text-blue-600' },
    feed: { icon: '🍼', labelKey: 'feed', color: 'text-green-600' },
    diaper: { icon: '💧', labelKey: 'diaper', color: 'text-yellow-600' },
    pumping: { icon: '🧴', labelKey: 'pump', color: 'text-purple-600' },
  };

  const getEventDetail = (event: BabyEvent): string => {
    const { event_type, metadata, started_at, ended_at } = event;

    switch (event_type) {
      case 'sleep':
        return ended_at ? formatDuration(started_at, ended_at) : t('inProgress');
      case 'feed':
        if (metadata.method === 'breast') {
          const side = metadata.side ? metadata.side.charAt(0).toUpperCase() + metadata.side.slice(1) : 'Both';
          return ended_at 
            ? `${side} • ${formatDuration(started_at, ended_at)}` 
            : `${side} • ${formatDuration(started_at, null, true)}`;
        }
        return `${metadata.amount_ml || 0}ml${metadata.formula ? ' formula' : ''}`;
      case 'diaper':
        const parts = [];
        if (metadata.wet) parts.push('💦');
        if (metadata.dirty) parts.push('💩');
        return parts.join(' ');
      case 'pumping':
        return `${metadata.side?.charAt(0).toUpperCase()}${metadata.side?.slice(1) || 'Both'} • ${metadata.amount_ml || 0}ml`;
      default:
        return '';
    }
  };

  const eventTypes: EventType[] = ['sleep', 'feed', 'diaper', 'pumping'];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t('lastActivities')}</h2>
      {eventTypes.map((type) => {
        const event = lastEvents[type];
        const config = eventConfig[type];

        return (
          <Card key={type}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{t(config.labelKey)}</div>
                  {event ? (
                    <div className="text-sm text-muted-foreground">
                      {formatTime(event.started_at)} • {getEventDetail(event)}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">{t('noActivityYet')}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
