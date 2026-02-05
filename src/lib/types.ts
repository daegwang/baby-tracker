export type EventType = 'sleep' | 'feed' | 'diaper' | 'pumping';

export interface Baby {
  id: string;
  name: string;
  birth_date: string;
  owner_id: string;
  caregiver_ids: string[];
  invite_code: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BabyEvent {
  id: string;
  baby_id: string;
  user_id: string;
  event_type: EventType;
  started_at: string;
  ended_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Metadata shapes per event type
export interface SleepMetadata {
  type: 'nap' | 'night';
  location?: string;
  notes?: string;
}

export interface FeedMetadata {
  method: 'breast' | 'bottle';
  side?: 'left' | 'right' | 'both';
  amount_ml?: number;
  formula?: boolean;
  notes?: string;
}

export interface DiaperMetadata {
  wet: boolean;
  dirty: boolean;
  notes?: string;
}

export interface PumpingMetadata {
  side: 'left' | 'right' | 'both';
  amount_ml: number;
  notes?: string;
}
