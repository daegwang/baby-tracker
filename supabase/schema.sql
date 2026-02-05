-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- babies table
CREATE TABLE babies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_ids UUID[] DEFAULT '{}',
  invite_code TEXT UNIQUE,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- events table  
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('sleep', 'feed', 'diaper', 'pumping')),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_events_baby_id ON events(baby_id);
CREATE INDEX idx_events_started_at ON events(started_at DESC);
CREATE INDEX idx_babies_invite_code ON babies(invite_code) WHERE invite_code IS NOT NULL;

-- RLS Policies
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Babies: owner or caregiver can access
CREATE POLICY "Users can view babies they own or care for" ON babies
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = ANY(caregiver_ids));
  
CREATE POLICY "Owner can update baby" ON babies
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert babies" ON babies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Events: caregivers can CRUD
CREATE POLICY "Caregivers can view events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM babies 
      WHERE babies.id = events.baby_id 
      AND (auth.uid() = babies.owner_id OR auth.uid() = ANY(babies.caregiver_ids))
    )
  );

CREATE POLICY "Caregivers can insert events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM babies 
      WHERE babies.id = baby_id 
      AND (auth.uid() = owner_id OR auth.uid() = ANY(caregiver_ids))
    )
  );

CREATE POLICY "Caregivers can update their events" ON events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can delete their events" ON events
  FOR DELETE USING (auth.uid() = user_id);
