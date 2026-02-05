'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Baby } from '@/lib/types'

export function useBaby(babyId?: string) {
  const [baby, setBaby] = useState<Baby | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!babyId) {
      setLoading(false)
      return
    }

    async function fetchBaby() {
      try {
        const { data, error } = await supabase
          .from('babies')
          .select('*')
          .eq('id', babyId)
          .single()

        if (error) throw error
        setBaby(data)
      } catch (e) {
        setError(e as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchBaby()

    // Set up realtime subscription
    const channel = supabase
      .channel(`baby:${babyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'babies',
          filter: `id=eq.${babyId}`,
        },
        (payload) => {
          setBaby(payload.new as Baby)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [babyId])

  return { baby, loading, error }
}
