import { createClient } from '@/lib/supabase/client';
import type { Baby } from '@/lib/types';

export async function createBaby(name: string, birthDate: Date): Promise<Baby> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('babies')
    .insert({
      name,
      birth_date: birthDate.toISOString().split('T')[0],
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBabies(): Promise<Baby[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .or(`owner_id.eq.${user.id},caregiver_ids.cs.{${user.id}}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBaby(id: string): Promise<Baby> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
