import { createClient } from '@/lib/supabase/client';
import type { BabyEvent, EventType } from '@/lib/types';

export async function createEvent(
  event: Omit<BabyEvent, 'id' | 'created_at'>
): Promise<BabyEvent> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...event,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getEvents(
  babyId: string,
  date?: Date
): Promise<BabyEvent[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('events')
    .select('*')
    .eq('baby_id', babyId)
    .order('started_at', { ascending: false });

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    query = query
      .gte('started_at', startOfDay.toISOString())
      .lte('started_at', endOfDay.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function updateEvent(
  id: string,
  updates: Partial<BabyEvent>
): Promise<BabyEvent> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getEventsForMonth(
  babyId: string,
  year: number,
  month: number
): Promise<BabyEvent[]> {
  const supabase = createClient();
  
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('baby_id', babyId)
    .gte('started_at', startOfMonth.toISOString())
    .lte('started_at', endOfMonth.toISOString())
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getLastEvents(
  babyId: string
): Promise<Partial<Record<EventType, BabyEvent>>> {
  const supabase = createClient();
  
  const eventTypes: EventType[] = ['sleep', 'feed', 'diaper', 'pumping'];
  const lastEvents: Partial<Record<EventType, BabyEvent>> = {};

  await Promise.all(
    eventTypes.map(async (type) => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('baby_id', babyId)
        .eq('event_type', type)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        lastEvents[type] = data;
      }
    })
  );

  return lastEvents;
}
