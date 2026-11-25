import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function useContent() {
  const [questions, setQuestions] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setError('Connect a Supabase project to load shared questions and resources.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const [questionResult, resourceResult] = await Promise.all([
        supabase.from('questions').select('*').order('created_at', { ascending: false }),
        supabase.from('resources').select('*').order('created_at', { ascending: false }),
      ])
      if (questionResult.error || resourceResult.error) {
        setError(questionResult.error?.message || resourceResult.error?.message || 'Unable to load content.')
        setLoading(false)
        return
      }
      setQuestions(questionResult.data || [])
      setResources(resourceResult.data || [])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load shared content.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])
  return { questions, resources, loading, error, refresh }
}
