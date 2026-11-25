import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function useContent() {
  const [questions, setQuestions] = useState([])
  const [resources, setResources] = useState([])
  const [sections, setSections] = useState([])
  const [sectionTopics, setSectionTopics] = useState([])
  const [questionAssignments, setQuestionAssignments] = useState([])
  const [resourceSections, setResourceSections] = useState([])
  const [resourceSectionTopics, setResourceSectionTopics] = useState([])
  const [resourceAssignments, setResourceAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sectionsError, setSectionsError] = useState('')
  const [resourceSectionsError, setResourceSectionsError] = useState('')

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setError('Connect a Supabase project to load shared questions and resources.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const [
        questionResult, resourceResult, sectionsResult, topicsResult, assignmentsResult,
        resourceSectionsResult, resourceTopicsResult, resourceAssignmentsResult,
      ] = await Promise.all([
        supabase.from('questions').select('*').order('created_at', { ascending: false }),
        supabase.from('resources').select('*').order('created_at', { ascending: false }),
        supabase.from('dsa_sections').select('*').order('display_order').order('created_at'),
        supabase.from('dsa_section_topics').select('*').order('display_order').order('created_at'),
        supabase.from('dsa_topic_questions').select('topic_id,question_id,display_order').order('display_order').order('created_at'),
        supabase.from('resource_sections').select('*').order('display_order').order('created_at'),
        supabase.from('resource_section_topics').select('*').order('display_order').order('created_at'),
        supabase.from('resource_topic_resources').select('topic_id,resource_id,display_order').order('display_order').order('created_at'),
      ])
      if (questionResult.error || resourceResult.error) {
        setError(questionResult.error?.message || resourceResult.error?.message || 'Unable to load content.')
      } else {
        setQuestions(questionResult.data || [])
        setResources(resourceResult.data || [])
      }
      const sectionError = sectionsResult.error || topicsResult.error || assignmentsResult.error
      if (sectionError) {
        setSectionsError(sectionError.message || 'Unable to load DSA sections. Apply the DSA sections migration and retry.')
        setSections([])
        setSectionTopics([])
        setQuestionAssignments([])
      } else {
        setSectionsError('')
        setSections(sectionsResult.data || [])
        setSectionTopics(topicsResult.data || [])
        setQuestionAssignments(assignmentsResult.data || [])
      }
      const resourceSectionError = resourceSectionsResult.error || resourceTopicsResult.error || resourceAssignmentsResult.error
      if (resourceSectionError) {
        setResourceSectionsError(resourceSectionError.message || 'Unable to load resource sections. Apply the resource sections migration and retry.')
        setResourceSections([])
        setResourceSectionTopics([])
        setResourceAssignments([])
      } else {
        setResourceSectionsError('')
        setResourceSections(resourceSectionsResult.data || [])
        setResourceSectionTopics(resourceTopicsResult.data || [])
        setResourceAssignments(resourceAssignmentsResult.data || [])
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load shared content.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])
  return {
    questions, resources, sections, sectionTopics, questionAssignments,
    resourceSections, resourceSectionTopics, resourceAssignments,
    loading, error, sectionsError, resourceSectionsError, refresh,
  }
}
