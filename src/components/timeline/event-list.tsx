'use client';

import { EventItem } from './event-item';
import type { BabyEvent } from '@/lib/types';

interface EventListProps {
  events: BabyEvent[];
  onDelete: (id: string) => void;
}

export function EventList({ events, onDelete }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No events recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <EventItem key={event.id} event={event} onDelete={onDelete} />
      ))}
    </div>
  );
}
