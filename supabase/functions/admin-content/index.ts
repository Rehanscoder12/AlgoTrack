import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const topics = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 'Binary Search', 'Recursion',
  'Backtracking', 'Trees', 'Binary Search Tree', 'Heap', 'Graph', 'Dynamic Programming',
  'Greedy', 'Sliding Window', 'Two Pointers', 'Hashing', 'Bit Manipulation', 'Tries', 'Others',
]
const categories = [
  'Operating System (OS)', 'Database Management System (DBMS)', 'Computer Networks (CN)',
  'Object Oriented Programming (OOP)', 'Aptitude', 'Technical MCQs', 'System Design',
  'Java', 'SQL', 'Other Technical Subjects',
]
const difficulties = ['Easy', 'Medium', 'Hard']
const platforms = ['LeetCode', 'GeeksforGeeks', 'CodeStudio', 'HackerRank', 'Others']
const resourceTypes = ['PDF', 'Notes', 'Video', 'Website', 'Practice']

interface QuestionInput {
  question_name: string
  topic: string
  difficulty: string
  platform: string
  problem_url: string
  notes: string
}

interface ResourceInput {
  title: string
  category: string
  description: string
  resource_type: string
  resource_url: string
}

interface SectionInput {
  title: string
  description: string
}

interface SectionTopicInput extends SectionInput {
  section_id?: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function encodeBase64Url(value: string) {
  return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function decodeBase64Url(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  return atob(base64 + '='.repeat((4 - base64.length % 4) % 4))
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function issueAdminToken(secret: string) {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = encodeBase64Url(JSON.stringify({ role: 'admin', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4 }))
  const unsigned = `${header}.${payload}`
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(unsigned))
  const bytes = Array.from(new Uint8Array(signature), byte => String.fromCharCode(byte)).join('')
  return `${unsigned}.${encodeBase64Url(bytes)}`
}

async function verifyAdminToken(token: unknown, secret: string) {
  if (typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  try {
    const unsigned = `${parts[0]}.${parts[1]}`
    const signatureString = decodeBase64Url(parts[2])
    const signature = Uint8Array.from(signatureString, char => char.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), signature, new TextEncoder().encode(unsigned))
    if (!valid) return false
    const payload = JSON.parse(decodeBase64Url(parts[1]))
    return payload.role === 'admin' && Number.isInteger(payload.exp) && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

function constantTimeEqual(left: string, right: string) {
  const a = new TextEncoder().encode(left)
  const b = new TextEncoder().encode(right)
  let difference = a.length ^ b.length
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) difference |= (a[index] || 0) ^ (b[index] || 0)
  return difference === 0
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function validQuestion(value: Record<string, unknown>): value is QuestionInput {
  return typeof value.question_name === 'string' && value.question_name.trim().length > 0 && value.question_name.length <= 180
    && topics.includes(value.topic as string) && difficulties.includes(value.difficulty as string)
    && platforms.includes(value.platform as string) && isHttpUrl(value.problem_url)
    && typeof value.notes === 'string' && value.notes.length <= 2000
}

function validResource(value: Record<string, unknown>): value is ResourceInput {
  return typeof value.title === 'string' && value.title.trim().length > 0 && value.title.length <= 180
    && categories.includes(value.category as string) && resourceTypes.includes(value.resource_type as string)
    && isHttpUrl(value.resource_url) && typeof value.description === 'string' && value.description.length <= 2000
}

function validSection(value: Record<string, unknown>): value is SectionInput {
  return typeof value.title === 'string' && value.title.trim().length > 0 && value.title.length <= 180
    && typeof value.description === 'string' && value.description.length <= 2000
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)

  const adminPassword = Deno.env.get('ADMIN_PASSWORD')
  const sessionSecret = Deno.env.get('ADMIN_SESSION_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!adminPassword || !sessionSecret || sessionSecret.length < 32 || !supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Admin service is not configured.' }, 503)
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400)
  }

  if (body.action === 'login') {
    if (typeof body.password !== 'string' || !constantTimeEqual(body.password, adminPassword)) {
      return jsonResponse({ error: 'Incorrect admin password.' }, 401)
    }
    return jsonResponse({ adminToken: await issueAdminToken(sessionSecret) })
  }

  if (!await verifyAdminToken(body.adminToken, sessionSecret)) {
    return jsonResponse({ error: 'Admin session is invalid or expired. Sign in again.' }, 401)
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const action = body.action
  let result

  if (action === 'add-question' || action === 'update-question') {
    if (!body.question || typeof body.question !== 'object' || !validQuestion(body.question as Record<string, unknown>)) {
      return jsonResponse({ error: 'Question details are invalid.' }, 400)
    }
    const question = body.question as QuestionInput
    const values = {
      question_name: question.question_name.trim(),
      topic: question.topic,
      difficulty: question.difficulty,
      platform: question.platform,
      problem_url: question.problem_url,
      notes: question.notes.trim(),
    }
    if (action === 'add-question') {
      result = await client.from('questions').insert(values).select().single()
    } else {
      if (typeof body.id !== 'string') return jsonResponse({ error: 'Question ID is required.' }, 400)
      result = await client.from('questions').update(values).eq('id', body.id).select().maybeSingle()
    }
  } else if (action === 'create-question-in-topic') {
    if (!isUuid(body.topicId)) return jsonResponse({ error: 'A valid topic ID is required.' }, 400)
    if (!body.question || typeof body.question !== 'object' || !validQuestion(body.question as Record<string, unknown>)) {
      return jsonResponse({ error: 'Question details are invalid.' }, 400)
    }
    const topicResult = await client.from('dsa_section_topics').select('id').eq('id', body.topicId).maybeSingle()
    if (topicResult.error) return jsonResponse({ error: 'Unable to verify the selected topic.' }, 500)
    if (!topicResult.data) return jsonResponse({ error: 'Topic not found.' }, 404)

    const question = body.question as QuestionInput
    const existingQuestionResult = await client.from('questions').select('*')
      .eq('problem_url', question.problem_url.trim()).maybeSingle()
    if (existingQuestionResult.error) {
      return jsonResponse({ error: 'Unable to check for an existing question with this problem URL.' }, 500)
    }
    if (existingQuestionResult.data) {
      const existingAssignment = await client.from('dsa_topic_questions').select('question_id')
        .eq('topic_id', body.topicId).eq('question_id', existingQuestionResult.data.id).maybeSingle()
      if (existingAssignment.error) return jsonResponse({ error: 'Unable to check the current topic links.' }, 500)
      if (existingAssignment.data) return jsonResponse({ error: 'This question is already linked to the selected topic.' }, 409)
      const assignmentResult = await client.from('dsa_topic_questions').insert({
        topic_id: body.topicId,
        question_id: existingQuestionResult.data.id,
      }).select().single()
      if (assignmentResult.error) {
        console.error('Existing question assignment failed:', assignmentResult.error.message)
        return jsonResponse({ error: 'The existing question could not be added to this topic.' }, 500)
      }
      return jsonResponse({ data: { question: existingQuestionResult.data, assignment: assignmentResult.data } })
    }

    const questionResult = await client.from('questions').insert({
      question_name: question.question_name.trim(),
      topic: question.topic,
      difficulty: question.difficulty,
      platform: question.platform,
      problem_url: question.problem_url,
      notes: question.notes.trim(),
    }).select().single()
    if (questionResult.error || !questionResult.data) {
      console.error('Question creation failed:', questionResult.error?.message)
      return jsonResponse({ error: 'Unable to create the requested question.' }, 500)
    }

    const assignmentResult = await client.from('dsa_topic_questions').insert({
      topic_id: body.topicId,
      question_id: questionResult.data.id,
    }).select().single()
    if (assignmentResult.error) {
      const cleanupResult = await client.from('questions').delete().eq('id', questionResult.data.id)
      if (cleanupResult.error) console.error('Unable to roll back unassigned question:', cleanupResult.error.message)
      console.error('Question assignment failed:', assignmentResult.error.message)
      return jsonResponse({ error: 'The question could not be added to this topic.' }, 500)
    }
    return jsonResponse({ data: { question: questionResult.data, assignment: assignmentResult.data } })
  } else if (action === 'add-resource' || action === 'update-resource') {
    if (!body.resource || typeof body.resource !== 'object' || !validResource(body.resource as Record<string, unknown>)) {
      return jsonResponse({ error: 'Resource details are invalid.' }, 400)
    }
    const resource = body.resource as ResourceInput
    const values = {
      title: resource.title.trim(),
      category: resource.category,
      description: resource.description.trim(),
      resource_type: resource.resource_type,
      resource_url: resource.resource_url,
    }
    if (action === 'add-resource') {
      result = await client.from('resources').insert(values).select().single()
    } else {
      if (typeof body.id !== 'string') return jsonResponse({ error: 'Resource ID is required.' }, 400)
      result = await client.from('resources').update(values).eq('id', body.id).select().maybeSingle()
    }
  } else if (action === 'create-resource-in-topic') {
    if (!isUuid(body.topicId)) return jsonResponse({ error: 'A valid topic ID is required.' }, 400)
    if (!body.resource || typeof body.resource !== 'object' || !validResource(body.resource as Record<string, unknown>)) {
      return jsonResponse({ error: 'Resource details are invalid.' }, 400)
    }
    const topicResult = await client.from('resource_section_topics').select('id').eq('id', body.topicId).maybeSingle()
    if (topicResult.error) return jsonResponse({ error: 'Unable to verify the selected resource topic.' }, 500)
    if (!topicResult.data) return jsonResponse({ error: 'Resource topic not found.' }, 404)

    const resource = body.resource as ResourceInput
    const existingResourceResult = await client.from('resources').select('*')
      .eq('resource_url', resource.resource_url.trim()).maybeSingle()
    if (existingResourceResult.error) {
      return jsonResponse({ error: 'Unable to check for an existing resource with this URL.' }, 500)
    }
    if (existingResourceResult.data) {
      const existingAssignment = await client.from('resource_topic_resources').select('resource_id')
        .eq('topic_id', body.topicId).eq('resource_id', existingResourceResult.data.id).maybeSingle()
      if (existingAssignment.error) return jsonResponse({ error: 'Unable to check the current resource topic links.' }, 500)
      if (existingAssignment.data) return jsonResponse({ error: 'This resource is already linked to the selected topic.' }, 409)
      const assignmentResult = await client.from('resource_topic_resources').insert({
        topic_id: body.topicId,
        resource_id: existingResourceResult.data.id,
      }).select().single()
      if (assignmentResult.error) {
        console.error('Existing resource assignment failed:', assignmentResult.error.message)
        return jsonResponse({ error: 'The existing resource could not be added to this topic.' }, 500)
      }
      return jsonResponse({ data: { resource: existingResourceResult.data, assignment: assignmentResult.data } })
    }

    const resourceResult = await client.from('resources').insert({
      title: resource.title.trim(),
      category: resource.category,
      description: resource.description.trim(),
      resource_type: resource.resource_type,
      resource_url: resource.resource_url.trim(),
    }).select().single()
    if (resourceResult.error || !resourceResult.data) {
      console.error('Resource creation failed:', resourceResult.error?.message)
      return jsonResponse({ error: 'Unable to create the requested resource.' }, 500)
    }
    const assignmentResult = await client.from('resource_topic_resources').insert({
      topic_id: body.topicId,
      resource_id: resourceResult.data.id,
    }).select().single()
    if (assignmentResult.error) {
      const cleanupResult = await client.from('resources').delete().eq('id', resourceResult.data.id)
      if (cleanupResult.error) console.error('Unable to roll back unassigned resource:', cleanupResult.error.message)
      console.error('Resource assignment failed:', assignmentResult.error.message)
      return jsonResponse({ error: 'The resource could not be added to this topic.' }, 500)
    }
    return jsonResponse({ data: { resource: resourceResult.data, assignment: assignmentResult.data } })
  } else if (action === 'add-section' || action === 'update-section') {
    if (!body.section || typeof body.section !== 'object' || !validSection(body.section as Record<string, unknown>)) {
      return jsonResponse({ error: 'Section details are invalid.' }, 400)
    }
    const section = body.section as SectionInput
    const values = { title: section.title.trim(), description: section.description.trim() }
    if (action === 'add-section') {
      const currentOrder = await client.from('dsa_sections').select('display_order')
        .order('display_order', { ascending: false }).limit(1).maybeSingle()
      if (currentOrder.error) return jsonResponse({ error: 'Unable to determine section order.' }, 500)
      result = await client.from('dsa_sections').insert({
        ...values,
        display_order: (currentOrder.data?.display_order ?? -1) + 1,
      }).select().single()
    } else {
      if (!isUuid(body.id)) return jsonResponse({ error: 'A valid section ID is required.' }, 400)
      result = await client.from('dsa_sections').update(values).eq('id', body.id).select().maybeSingle()
    }
  } else if (action === 'delete-section') {
    if (!isUuid(body.id)) return jsonResponse({ error: 'A valid section ID is required.' }, 400)
    result = await client.from('dsa_sections').delete().eq('id', body.id).select('id').maybeSingle()
  } else if (action === 'add-section-topic' || action === 'update-section-topic') {
    if (!body.topic || typeof body.topic !== 'object' || !validSection(body.topic as Record<string, unknown>)) {
      return jsonResponse({ error: 'Topic details are invalid.' }, 400)
    }
    const topic = body.topic as SectionTopicInput
    const values = { title: topic.title.trim(), description: topic.description.trim() }
    if (action === 'add-section-topic') {
      if (!isUuid(topic.section_id)) return jsonResponse({ error: 'A valid parent section ID is required.' }, 400)
      const currentOrder = await client.from('dsa_section_topics').select('display_order')
        .eq('section_id', topic.section_id).order('display_order', { ascending: false }).limit(1).maybeSingle()
      if (currentOrder.error) return jsonResponse({ error: 'Unable to determine topic order.' }, 500)
      result = await client.from('dsa_section_topics').insert({
        ...values,
        section_id: topic.section_id,
        display_order: (currentOrder.data?.display_order ?? -1) + 1,
      }).select().single()
    } else {
      if (!isUuid(body.id)) return jsonResponse({ error: 'A valid topic ID is required.' }, 400)
      result = await client.from('dsa_section_topics').update(values).eq('id', body.id).select().maybeSingle()
    }
  } else if (action === 'delete-section-topic') {
    if (!isUuid(body.id)) return jsonResponse({ error: 'A valid topic ID is required.' }, 400)
    result = await client.from('dsa_section_topics').delete().eq('id', body.id).select('id').maybeSingle()
  } else if (action === 'assign-question-to-topic' || action === 'remove-question-from-topic') {
    if (!isUuid(body.topicId) || !isUuid(body.questionId)) {
      return jsonResponse({ error: 'Valid topic and question IDs are required.' }, 400)
    }
    if (action === 'assign-question-to-topic') {
      result = await client.from('dsa_topic_questions').insert({
        topic_id: body.topicId,
        question_id: body.questionId,
      }).select().single()
    } else {
      result = await client.from('dsa_topic_questions').delete()
        .eq('topic_id', body.topicId).eq('question_id', body.questionId).select().maybeSingle()
    }
  } else if (action === 'add-resource-section' || action === 'update-resource-section') {
    if (!body.section || typeof body.section !== 'object' || !validSection(body.section as Record<string, unknown>)) {
      return jsonResponse({ error: 'Resource section details are invalid.' }, 400)
    }
    const section = body.section as SectionInput
    const values = { title: section.title.trim(), description: section.description.trim() }
    if (action === 'add-resource-section') {
      const currentOrder = await client.from('resource_sections').select('display_order')
        .order('display_order', { ascending: false }).limit(1).maybeSingle()
      if (currentOrder.error) return jsonResponse({ error: 'Unable to determine resource section order.' }, 500)
      result = await client.from('resource_sections').insert({
        ...values,
        display_order: (currentOrder.data?.display_order ?? -1) + 1,
      }).select().single()
    } else {
      if (!isUuid(body.id)) return jsonResponse({ error: 'A valid resource section ID is required.' }, 400)
      result = await client.from('resource_sections').update(values).eq('id', body.id).select().maybeSingle()
    }
  } else if (action === 'delete-resource-section') {
    if (!isUuid(body.id)) return jsonResponse({ error: 'A valid resource section ID is required.' }, 400)
    result = await client.from('resource_sections').delete().eq('id', body.id).select('id').maybeSingle()
  } else if (action === 'add-resource-section-topic' || action === 'update-resource-section-topic') {
    if (!body.topic || typeof body.topic !== 'object' || !validSection(body.topic as Record<string, unknown>)) {
      return jsonResponse({ error: 'Resource topic details are invalid.' }, 400)
    }
    const topic = body.topic as SectionTopicInput
    const values = { title: topic.title.trim(), description: topic.description.trim() }
    if (action === 'add-resource-section-topic') {
      if (!isUuid(topic.section_id)) return jsonResponse({ error: 'A valid parent resource section ID is required.' }, 400)
      const currentOrder = await client.from('resource_section_topics').select('display_order')
        .eq('section_id', topic.section_id).order('display_order', { ascending: false }).limit(1).maybeSingle()
      if (currentOrder.error) return jsonResponse({ error: 'Unable to determine resource topic order.' }, 500)
      result = await client.from('resource_section_topics').insert({
        ...values,
        section_id: topic.section_id,
        display_order: (currentOrder.data?.display_order ?? -1) + 1,
      }).select().single()
    } else {
      if (!isUuid(body.id)) return jsonResponse({ error: 'A valid resource topic ID is required.' }, 400)
      result = await client.from('resource_section_topics').update(values).eq('id', body.id).select().maybeSingle()
    }
  } else if (action === 'delete-resource-section-topic') {
    if (!isUuid(body.id)) return jsonResponse({ error: 'A valid resource topic ID is required.' }, 400)
    result = await client.from('resource_section_topics').delete().eq('id', body.id).select('id').maybeSingle()
  } else if (action === 'assign-resource-to-topic' || action === 'remove-resource-from-topic') {
    if (!isUuid(body.topicId) || !isUuid(body.resourceId)) {
      return jsonResponse({ error: 'Valid resource topic and resource IDs are required.' }, 400)
    }
    if (action === 'assign-resource-to-topic') {
      result = await client.from('resource_topic_resources').insert({
        topic_id: body.topicId,
        resource_id: body.resourceId,
      }).select().single()
    } else {
      result = await client.from('resource_topic_resources').delete()
        .eq('topic_id', body.topicId).eq('resource_id', body.resourceId).select().maybeSingle()
    }
  } else if (
    action === 'reorder-section' || action === 'reorder-section-topic'
    || action === 'reorder-resource-section' || action === 'reorder-resource-section-topic'
  ) {
    if (!isUuid(body.id) || !['up', 'down'].includes(body.direction as string)) {
      return jsonResponse({ error: 'A valid ID and reorder direction are required.' }, 400)
    }
    let table: 'dsa_sections' | 'dsa_section_topics' | 'resource_sections' | 'resource_section_topics'
    let orderedRows: { id: string; display_order: number; created_at: string }[]
    if (action === 'reorder-section' || action === 'reorder-resource-section') {
      const isResource = action === 'reorder-resource-section'
      table = isResource ? 'resource_sections' : 'dsa_sections'
      const orderResult = isResource
        ? await client.from('resource_sections').select('id,display_order,created_at').order('display_order').order('created_at')
        : await client.from('dsa_sections').select('id,display_order,created_at').order('display_order').order('created_at')
      if (orderResult.error) return jsonResponse({ error: 'Unable to load the current order.' }, 500)
      orderedRows = orderResult.data || []
    } else if (action === 'reorder-section-topic' || action === 'reorder-resource-section-topic') {
      const isResource = action === 'reorder-resource-section-topic'
      const parentTable = isResource ? 'resource_section_topics' : 'dsa_section_topics'
      if (!isUuid(body.sectionId)) return jsonResponse({ error: 'A valid parent section ID is required.' }, 400)
      table = parentTable
      const orderResult = isResource
        ? await client.from('resource_section_topics').select('id,display_order,created_at')
          .eq('section_id', body.sectionId).order('display_order').order('created_at')
        : await client.from('dsa_section_topics').select('id,display_order,created_at')
          .eq('section_id', body.sectionId).order('display_order').order('created_at')
      if (orderResult.error) return jsonResponse({ error: 'Unable to load the current order.' }, 500)
      orderedRows = orderResult.data || []
    } else {
      table = 'dsa_sections'
      orderedRows = []
    }
    const ordered = orderedRows
    const currentIndex = ordered.findIndex(item => item.id === body.id)
    const nextIndex = currentIndex + (body.direction === 'up' ? -1 : 1)
    if (currentIndex < 0) return jsonResponse({ error: 'Content not found.' }, 404)
    if (nextIndex < 0 || nextIndex >= ordered.length) return jsonResponse({ error: 'Content is already at that end of the list.' }, 400)
    const [moved] = ordered.splice(currentIndex, 1)
    ordered.splice(nextIndex, 0, moved)
    const reorderResults = await Promise.all(ordered.map((item, index) =>
      client.from(table).update({ display_order: index }).eq('id', item.id),
    ))
    const reorderError = reorderResults.find(item => item.error)?.error
    if (reorderError) {
      console.error('Content reordering failed:', reorderError.message)
      return jsonResponse({ error: 'Unable to save the new order.' }, 500)
    }
    result = { data: { id: body.id }, error: null }
  } else if (action === 'delete-question' || action === 'delete-resource') {
    if (typeof body.id !== 'string') return jsonResponse({ error: 'Content ID is required.' }, 400)
    const table = action === 'delete-question' ? 'questions' : 'resources'
    result = await client.from(table).delete().eq('id', body.id).select('id').maybeSingle()
  } else {
    return jsonResponse({ error: 'Unknown admin action.' }, 400)
  }

  if (result.error) {
    if (result.error.code === '23505') return jsonResponse({ error: 'That item is already present in this section or topic.' }, 409)
    console.error('Admin content operation failed:', result.error.message)
    return jsonResponse({ error: 'Unable to save the requested content.' }, 500)
  }
  if (!result.data) return jsonResponse({ error: 'Content not found.' }, 404)
  return jsonResponse({ data: result.data })
})
