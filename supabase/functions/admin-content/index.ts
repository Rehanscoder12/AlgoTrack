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
  } else if (action === 'delete-question' || action === 'delete-resource') {
    if (typeof body.id !== 'string') return jsonResponse({ error: 'Content ID is required.' }, 400)
    const table = action === 'delete-question' ? 'questions' : 'resources'
    result = await client.from(table).delete().eq('id', body.id).select('id').maybeSingle()
  } else {
    return jsonResponse({ error: 'Unknown admin action.' }, 400)
  }

  if (result.error) {
    console.error('Admin content operation failed:', result.error.message)
    return jsonResponse({ error: 'Unable to save the requested content.' }, 500)
  }
  if (!result.data) return jsonResponse({ error: 'Content not found.' }, 404)
  return jsonResponse({ data: result.data })
})
