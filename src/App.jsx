import { useMemo, useState } from 'react'
import {
  ArrowDownUp, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown,
  CircleHelp, Code2, ExternalLink, FileText, Filter, LayoutDashboard,
  LoaderCircle, LockKeyhole, LogOut, Menu, Play, Plus, Search, ShieldCheck, Trash2, X,
} from 'lucide-react'
import { useContent } from './hooks/useContent'
import {
  CATEGORIES, DIFFICULTIES, formatDate, platformInitial, PLATFORMS,
  RESOURCE_TYPES, TOPICS, validHttpUrl,
} from './lib/catalog'
import { getVideoSource } from './lib/video'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const PROGRESS_KEY = 'algotrack-question-progress'
const ADMIN_TOKEN_KEY = 'algotrack-admin-session'

const emptyQuestion = {
  question_name: '', topic: TOPICS[0], difficulty: 'Easy', platform: 'LeetCode',
  problem_url: '', notes: '',
}
const emptyResource = {
  title: '', category: CATEGORIES[0], description: '', resource_type: 'Website',
  resource_url: '',
}

function readProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') } catch { return {} }
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = variant === 'primary'
    ? 'bg-ink text-white hover:bg-[#2b3431]'
    : variant === 'outline'
      ? 'border border-line bg-white text-ink hover:border-[#b6bcb7]'
      : 'text-muted hover:bg-paper hover:text-ink'
  return <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`} {...props}>{children}</button>
}

function Field({ label, children, hint }) {
  return <label className="block space-y-1.5">
    <span className="text-sm font-semibold text-ink">{label}</span>
    {children}
    {hint && <span className="block text-xs text-muted">{hint}</span>}
  </label>
}

const inputClass = 'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-[#a0a6a2]'
const selectClass = `${inputClass} appearance-none`

function SelectField({ value, onChange, options, label }) {
  return <Field label={label}>
    <span className="relative block">
      <select className={selectClass} value={value} onChange={onChange}>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </span>
  </Field>
}

function PageHeading({ eyebrow, title, description, children }) {
  return <div className="mb-8 flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[.15em] text-accent">{eyebrow}</p>
      <h1 className="display-font text-3xl font-bold tracking-[-.04em] sm:text-[2.4rem]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </div>
    {children}
  </div>
}

function EmptyState({ icon: Icon = CircleHelp, title, description }) {
  return <div className="rounded-xl border border-dashed border-line bg-white/70 px-6 py-12 text-center">
    <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-paper text-muted"><Icon size={20} /></span>
    <h3 className="font-semibold">{title}</h3>
    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">{description}</p>
  </div>
}

function Notice({ error, onRetry }) {
  if (!error) return null
  return <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#f1d2c2] bg-[#fff7f2] px-4 py-3 text-sm text-[#814b31]">
    <span>{error}</span>
    {isSupabaseConfigured && <button className="font-semibold underline underline-offset-2" onClick={onRetry}>Try again</button>}
  </div>
}

function QuestionCard({ question, progress, onProgress, admin, onEdit, onDelete }) {
  const level = question.difficulty?.toLowerCase()
  return <article className="group rounded-xl border border-line bg-white p-4 transition hover:border-[#cbd0cc] sm:p-5">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-xs font-bold text-muted">{platformInitial(question.platform)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <a className="font-semibold leading-6 decoration-accent decoration-1 underline-offset-4 hover:underline" href={question.problem_url} target="_blank" rel="noreferrer">{question.question_name}<ExternalLink size={12} className="ml-1 inline text-muted" /></a>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className={`rounded-md px-2 py-1 font-semibold capitalize ${level === 'easy' ? 'bg-[#eaf5ee] text-[#377448]' : level === 'hard' ? 'bg-[#fff0ee] text-[#ae5145]' : 'bg-[#fff5e7] text-[#9a6b22]'}`}>{question.difficulty}</span>
          <span>{question.platform}</span><span className="text-[#c3c7c4]">·</span><span>{formatDate(question.created_at)}</span>
        </div>
        {question.notes && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{question.notes}</p>}
      </div>
      <div className="flex items-start gap-1">
        {admin ? <>
          <button title="Edit question" aria-label="Edit question" onClick={() => onEdit(question)} className="rounded-md p-2 text-muted hover:bg-paper hover:text-ink"><FileText size={16} /></button>
          <button title="Delete question" aria-label="Delete question" onClick={() => onDelete(question)} className="rounded-md p-2 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
        </> : <select className="max-w-[130px] rounded-md border border-line bg-white px-2 py-1.5 text-xs text-muted outline-none focus:border-accent" aria-label={`Progress for ${question.question_name}`} value={progress || 'Not Started'} onChange={event => onProgress(question.id, event.target.value)}>
          {['Not Started', 'In Progress', 'Solved'].map(status => <option key={status}>{status}</option>)}
        </select>}
      </div>
    </div>
  </article>
}

function ResourceCard({ resource, admin, onEdit, onDelete, onPlayVideo }) {
  const isVideo = resource.resource_type?.toLowerCase() === 'video'
  function handleCardKeyDown(event) {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onPlayVideo(resource)
    }
  }
  return <article
    className={`group rounded-xl border border-line bg-white p-5 transition hover:border-[#cbd0cc] ${isVideo ? 'cursor-pointer' : ''}`}
    onClick={isVideo ? () => onPlayVideo(resource) : undefined}
    onKeyDown={isVideo ? handleCardKeyDown : undefined}
    role={isVideo ? (admin ? 'group' : 'button') : undefined}
    tabIndex={isVideo ? 0 : undefined}
    aria-label={isVideo ? `Play video: ${resource.title}` : undefined}
  >
    <div className="flex items-start justify-between gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-paper text-muted"><FileText size={17} /></span>
      {admin ? <span className="flex gap-1">
        <button aria-label="Edit resource" className="rounded-md p-2 text-muted hover:bg-paper hover:text-ink" onClick={event => { event.stopPropagation(); onEdit(resource) }}><FileText size={15} /></button>
        <button aria-label="Delete resource" className="rounded-md p-2 text-muted hover:bg-red-50 hover:text-red-600" onClick={event => { event.stopPropagation(); onDelete(resource) }}><Trash2 size={15} /></button>
      </span> : isVideo ? <Play size={17} className="mt-1 fill-current text-accent transition group-hover:scale-105" /> : <ArrowUpRight size={17} className="mt-1 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />}
    </div>
    <h3 className="mt-4 font-semibold leading-6">{isVideo
      ? <span className="decoration-accent decoration-1 underline-offset-4 group-hover:underline">{resource.title}<Play size={12} className="ml-1 inline text-muted" /></span>
      : <a href={resource.resource_url} target="_blank" rel="noreferrer" className="decoration-accent decoration-1 underline-offset-4 hover:underline">{resource.title}<ExternalLink size={12} className="ml-1 inline text-muted" /></a>}</h3>
    {resource.description && <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted">{resource.description}</p>}
    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
      <span className="rounded-md bg-paper px-2 py-1 font-medium">{resource.resource_type}</span>
      <span>{formatDate(resource.created_at)}</span>
    </div>
  </article>
}

function Modal({ title, onClose, children, width = 'max-w-lg' }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15201d]/40 p-4 backdrop-blur-[2px]" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div className={`max-h-[90vh] w-full ${width} overflow-y-auto rounded-2xl border border-line bg-white shadow-xl`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <button onClick={onClose} aria-label="Close dialog" className="rounded-md p-1.5 text-muted hover:bg-paper"><X size={18} /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
}

function App() {
  const { questions, resources, loading, error, refresh } = useContent()
  const [page, setPage] = useState('dashboard')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('All topics')
  const [difficultyFilter, setDifficultyFilter] = useState('All difficulties')
  const [platformFilter, setPlatformFilter] = useState('All platforms')
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [sortNewest, setSortNewest] = useState(true)
  const [progress, setProgress] = useState(readProgress)
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) || '')
  const [adminOpen, setAdminOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [questionForm, setQuestionForm] = useState(emptyQuestion)
  const [resourceForm, setResourceForm] = useState(emptyResource)
  const [editing, setEditing] = useState(null)
  const [activeVideo, setActiveVideo] = useState(null)

  const solvedCount = questions.filter(question => progress[question.id] === 'Solved').length
  const filteredQuestions = useMemo(() => {
    let rows = questions.filter(question =>
      (!search || question.question_name.toLowerCase().includes(search.toLowerCase())) &&
      (topicFilter === 'All topics' || question.topic === topicFilter) &&
      (difficultyFilter === 'All difficulties' || question.difficulty === difficultyFilter) &&
      (platformFilter === 'All platforms' || question.platform === platformFilter),
    )
    return [...rows].sort((a, b) => sortNewest
      ? new Date(b.created_at) - new Date(a.created_at)
      : a.question_name.localeCompare(b.question_name))
  }, [questions, search, topicFilter, difficultyFilter, platformFilter, sortNewest])
  const filteredResources = useMemo(() => {
    let rows = resources.filter(resource =>
      (!search || resource.title.toLowerCase().includes(search.toLowerCase())) &&
      (categoryFilter === 'All categories' || resource.category === categoryFilter),
    )
    return [...rows].sort((a, b) => sortNewest
      ? new Date(b.created_at) - new Date(a.created_at)
      : a.title.localeCompare(b.title))
  }, [resources, search, categoryFilter, sortNewest])

  function updateProgress(id, value) {
    const updated = { ...progress, [id]: value }
    setProgress(updated)
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated))
  }

  function openVideo(resource) {
    setActiveVideo({ ...resource, player: getVideoSource(resource.resource_url) })
  }

  function navigate(target, selectedTopic = '') {
    setPage(target)
    setMobileMenu(false)
    setSearch('')
    setNotice('')
    if (target === 'questions') setTopicFilter(selectedTopic || 'All topics')
  }

  function startQuestionEdit(question) {
    setEditing({ kind: 'question', id: question.id })
    setQuestionForm({
      question_name: question.question_name, topic: question.topic, difficulty: question.difficulty,
      platform: question.platform, problem_url: question.problem_url, notes: question.notes || '',
    })
    setAdminOpen(true)
  }

  function startResourceEdit(resource) {
    setEditing({ kind: 'resource', id: resource.id })
    setResourceForm({
      title: resource.title, category: resource.category, description: resource.description || '',
      resource_type: resource.resource_type, resource_url: resource.resource_url,
    })
    setAdminOpen(true)
  }

  async function adminRequest(action, data = {}) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured. Add the project URL and anon key to .env.')
    const { data: result, error: fnError } = await supabase.functions.invoke('admin-content', {
      body: { action, adminToken, ...data },
    })
    if (fnError) throw new Error(fnError.message || 'The admin request failed.')
    if (result?.error) throw new Error(result.error)
    return result
  }

  async function login(event) {
    event.preventDefault()
    setBusy(true)
    setLoginError('')
    try {
      if (!isSupabaseConfigured) throw new Error('Set up Supabase in .env before signing in.')
      const { data, error: fnError } = await supabase.functions.invoke('admin-content', { body: { action: 'login', password } })
      if (fnError || data?.error || !data?.adminToken) throw new Error(data?.error || fnError?.message || 'Admin verification failed.')
      localStorage.setItem(ADMIN_TOKEN_KEY, data.adminToken)
      setAdminToken(data.adminToken)
      setPassword('')
      setLoginOpen(false)
      setAdminOpen(true)
    } catch (reason) {
      setLoginError(reason.message || 'Unable to verify admin password.')
    } finally { setBusy(false) }
  }

  function logout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setAdminToken('')
    setAdminOpen(false)
    setEditing(null)
    setNotice('Admin mode ended.')
  }

  async function saveQuestion(event) {
    event.preventDefault()
    if (!questionForm.question_name.trim() || !validHttpUrl(questionForm.problem_url)) {
      setNotice('Enter a question name and a valid http(s) problem URL.')
      return
    }
    setBusy(true)
    setNotice('')
    try {
      await adminRequest(editing?.kind === 'question' ? 'update-question' : 'add-question', {
        id: editing?.kind === 'question' ? editing.id : undefined,
        question: { ...questionForm, question_name: questionForm.question_name.trim(), notes: questionForm.notes.trim() },
      })
      setQuestionForm(emptyQuestion)
      setEditing(null)
      await refresh()
      setNotice('Question saved and published.')
    } catch (reason) { setNotice(reason.message || 'Could not save question.') }
    finally { setBusy(false) }
  }

  async function saveResource(event) {
    event.preventDefault()
    if (!resourceForm.title.trim() || !validHttpUrl(resourceForm.resource_url)) {
      setNotice('Enter a resource title and a valid http(s) URL.')
      return
    }
    setBusy(true)
    setNotice('')
    try {
      await adminRequest(editing?.kind === 'resource' ? 'update-resource' : 'add-resource', {
        id: editing?.kind === 'resource' ? editing.id : undefined,
        resource: { ...resourceForm, title: resourceForm.title.trim(), description: resourceForm.description.trim() },
      })
      setResourceForm(emptyResource)
      setEditing(null)
      await refresh()
      setNotice('Resource saved and published.')
    } catch (reason) { setNotice(reason.message || 'Could not save resource.') }
    finally { setBusy(false) }
  }

  async function deleteItem(kind, item) {
    if (!window.confirm(`Delete "${kind === 'question' ? item.question_name : item.title}"? This cannot be undone.`)) return
    setBusy(true)
    setNotice('')
    try {
      await adminRequest(kind === 'question' ? 'delete-question' : 'delete-resource', { id: item.id })
      await refresh()
      setNotice('Content deleted.')
    } catch (reason) { setNotice(reason.message || 'Could not delete content.') }
    finally { setBusy(false) }
  }

  const questionCountFor = topic => questions.filter(question => question.topic === topic).length
  return <div className="min-h-screen bg-paper text-ink">
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <button onClick={() => navigate('dashboard')} className="flex items-center gap-2.5 text-left">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white"><Code2 size={19} strokeWidth={2.2} /></span>
          <span className="display-font text-[19px] font-extrabold tracking-[-.05em]">AlgoTrack<span className="text-accent">.</span></span>
        </button>
        <nav className="hidden items-center gap-1 md:flex">
          {[
            ['dashboard', 'Overview', LayoutDashboard],
            ['questions', 'DSA Questions', Code2],
            ['resources', 'CS Resources', BookOpen],
          ].map(([id, label, Icon]) => <button key={id} onClick={() => navigate(id)} className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${page === id ? 'bg-white text-ink ring-1 ring-line' : 'text-muted hover:text-ink'}`}><Icon size={16} />{label}</button>)}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => adminToken ? setAdminOpen(true) : setLoginOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-[#b6bcb7]">
            {adminToken ? <ShieldCheck size={16} className="text-[#4d8059]" /> : <LockKeyhole size={15} />}
            <span className="hidden sm:inline">{adminToken ? 'Admin mode' : 'Admin'}</span>
          </button>
          <button aria-label="Open navigation" className="rounded-lg border border-line bg-white p-2 md:hidden" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={18} /></button>
        </div>
      </div>
      {mobileMenu && <nav className="border-t border-line bg-paper px-5 py-2 md:hidden">
        {[['dashboard', 'Overview', LayoutDashboard], ['questions', 'DSA Questions', Code2], ['resources', 'CS Resources', BookOpen]].map(([id, label, Icon]) => <button key={id} onClick={() => navigate(id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${page === id ? 'text-ink' : 'text-muted'}`}><Icon size={17} />{label}</button>)}
      </nav>}
    </header>

    <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
      <Notice error={error} onRetry={refresh} />
      {notice && <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm text-muted"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15} /></button></div>}
      {loading ? <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted"><LoaderCircle className="mr-2 animate-spin" size={18} />Loading shared content…</div> : page === 'dashboard' ? (
        <Dashboard questions={questions} resources={resources} solvedCount={solvedCount} progress={progress} onProgress={updateProgress} onNavigate={navigate} onPlayVideo={openVideo} />
      ) : page === 'questions' ? (
        <section>
          <PageHeading eyebrow="Practice library" title="DSA Questions" description="A focused collection of problems to help you build consistency, one question at a time." />
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={search} onChange={event => setSearch(event.target.value)} className={`${inputClass} pl-10`} placeholder="Search questions…" aria-label="Search questions" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <FilterSelect value={topicFilter} onChange={setTopicFilter} all="All topics" options={TOPICS} />
              <FilterSelect value={difficultyFilter} onChange={setDifficultyFilter} all="All difficulties" options={DIFFICULTIES} />
              <FilterSelect value={platformFilter} onChange={setPlatformFilter} all="All platforms" options={PLATFORMS} />
              <Button variant="outline" className="!px-3" onClick={() => setSortNewest(!sortNewest)} title="Change sort order"><ArrowDownUp size={15} /><span className="hidden xl:inline">{sortNewest ? 'Newest' : 'Name'}</span></Button>
            </div>
          </div>
          <div className="mb-5 flex items-center justify-between text-sm text-muted">
            <span>{filteredQuestions.length} {filteredQuestions.length === 1 ? 'question' : 'questions'}</span>
            {adminToken && <Button variant="outline" className="!py-2" onClick={() => { setEditing(null); setAdminOpen(true) }}><Plus size={15} />Add question</Button>}
          </div>
          {filteredQuestions.length === 0 ? <EmptyState icon={Code2} title={search || topicFilter !== 'All topics' ? 'No matching questions' : 'Your practice list starts here'} description={search || topicFilter !== 'All topics' ? 'Try another search or adjust your filters.' : 'Questions published by the owner will appear here, organized by topic.'} /> : (
            <div className="space-y-8">
              {(topicFilter === 'All topics' ? TOPICS : [topicFilter]).filter(topic => filteredQuestions.some(q => q.topic === topic)).map(topic => <section key={topic}>
                <div className="mb-3 flex items-center justify-between border-b border-line pb-2.5">
                  <h2 className="font-semibold">{topic}</h2><span className="text-xs text-muted">{questionCountFor(topic)} {questionCountFor(topic) === 1 ? 'problem' : 'problems'}</span>
                </div>
                <div className="grid gap-3">{filteredQuestions.filter(question => question.topic === topic).map(question => <QuestionCard key={question.id} question={question} progress={progress[question.id]} onProgress={updateProgress} admin={Boolean(adminToken)} onEdit={startQuestionEdit} onDelete={item => deleteItem('question', item)} />)}</div>
              </section>)}
            </div>
          )}
        </section>
      ) : (
        <section>
          <PageHeading eyebrow="Study library" title="CS Resources" description="Curated notes, references and practice material for the subjects behind the code." />
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={search} onChange={event => setSearch(event.target.value)} className={`${inputClass} pl-10`} placeholder="Search resources…" aria-label="Search resources" />
            </div>
            <FilterSelect value={categoryFilter} onChange={setCategoryFilter} all="All categories" options={CATEGORIES} />
            <Button variant="outline" onClick={() => setSortNewest(!sortNewest)}><ArrowDownUp size={15} />{sortNewest ? 'Newest' : 'Name'}</Button>
          </div>
          <div className="mb-5 flex items-center justify-between text-sm text-muted">
            <span>{filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'}</span>
            {adminToken && <Button variant="outline" className="!py-2" onClick={() => { setEditing(null); setAdminOpen(true) }}><Plus size={15} />Add resource</Button>}
          </div>
          {filteredResources.length === 0 ? <EmptyState icon={BookOpen} title={search || categoryFilter !== 'All categories' ? 'No matching resources' : 'No resources yet'} description={search || categoryFilter !== 'All categories' ? 'Try a different search or category.' : 'Study materials added by the owner will appear here by category.'} /> : (
            <div className="space-y-8">
              {(categoryFilter === 'All categories' ? CATEGORIES : [categoryFilter]).filter(category => filteredResources.some(r => r.category === category)).map(category => <section key={category}>
                <div className="mb-3 flex items-center justify-between border-b border-line pb-2.5">
                  <h2 className="font-semibold">{category}</h2><span className="text-xs text-muted">{filteredResources.filter(r => r.category === category).length} resources</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filteredResources.filter(resource => resource.category === category).map(resource => <ResourceCard key={resource.id} resource={resource} admin={Boolean(adminToken)} onEdit={startResourceEdit} onDelete={item => deleteItem('resource', item)} onPlayVideo={openVideo} />)}</div>
              </section>)}
            </div>
          )}
        </section>
      )}
    </main>
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="font-semibold text-ink">AlgoTrack<span className="text-accent">.</span> <span className="font-normal text-muted">A little progress, every day.</span></span>
        <span className="sm:text-right"><span className="block">Free and open to everyone · Progress stays on your device</span><span className="mt-1 block">Created &amp; founded by Rehans Pathak</span></span>
      </div>
    </footer>

    {activeVideo && <VideoModal resource={activeVideo} onClose={() => setActiveVideo(null)} />}

    {loginOpen && <Modal title="Owner access" onClose={() => { setLoginOpen(false); setLoginError('') }}>
      <form className="space-y-4" onSubmit={login}>
        <p className="text-sm leading-6 text-muted">Admin mode is reserved for the site owner. Enter the private admin password to manage public content.</p>
        <Field label="Admin password">
          <input type="password" autoFocus autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className={inputClass} placeholder="Enter password" required />
        </Field>
        {loginError && <p role="alert" className="text-sm text-red-600">{loginError}</p>}
        <div className="flex justify-end gap-2 pt-1"><Button variant="outline" type="button" onClick={() => setLoginOpen(false)}>Cancel</Button><Button disabled={busy}>{busy && <LoaderCircle size={15} className="animate-spin" />}Continue<ArrowRight size={15} /></Button></div>
      </form>
    </Modal>}

    {adminOpen && adminToken && <Modal title="Manage AlgoTrack" width="max-w-5xl" onClose={() => { setAdminOpen(false); setEditing(null) }}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-paper px-4 py-3">
        <div><p className="text-sm font-semibold">Admin mode is on</p><p className="mt-0.5 text-xs text-muted">Changes publish for every visitor.</p></div>
        <Button variant="outline" className="!py-2" onClick={logout}><LogOut size={15} />End session</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="space-y-4 rounded-xl border border-line p-4 sm:p-5" onSubmit={saveQuestion}>
          <div className="flex items-center gap-2"><Code2 size={17} className="text-accent" /><h3 className="font-semibold">{editing?.kind === 'question' ? 'Edit question' : 'Add DSA question'}</h3></div>
          <Field label="Question name"><input className={inputClass} value={questionForm.question_name} maxLength={180} onChange={e => setQuestionForm({ ...questionForm, question_name: e.target.value })} required /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Topic" value={questionForm.topic} options={TOPICS} onChange={e => setQuestionForm({ ...questionForm, topic: e.target.value })} />
            <SelectField label="Difficulty" value={questionForm.difficulty} options={DIFFICULTIES} onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })} />
            <SelectField label="Platform" value={questionForm.platform} options={PLATFORMS} onChange={e => setQuestionForm({ ...questionForm, platform: e.target.value })} />
            <Field label="Problem URL"><input type="url" className={inputClass} placeholder="https://" value={questionForm.problem_url} onChange={e => setQuestionForm({ ...questionForm, problem_url: e.target.value })} required /></Field>
          </div>
          <Field label="Notes" hint="Optional · up to 2,000 characters"><textarea className={`${inputClass} min-h-20 resize-y`} maxLength={2000} value={questionForm.notes} onChange={e => setQuestionForm({ ...questionForm, notes: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><Button variant="outline" type="button" onClick={() => { setQuestionForm(emptyQuestion); if (editing?.kind === 'question') setEditing(null) }}>Clear</Button><Button disabled={busy}>{busy && <LoaderCircle size={15} className="animate-spin" />}{editing?.kind === 'question' ? 'Save changes' : 'Publish question'}</Button></div>
        </form>

        <form className="space-y-4 rounded-xl border border-line p-4 sm:p-5" onSubmit={saveResource}>
          <div className="flex items-center gap-2"><BookOpen size={17} className="text-accent" /><h3 className="font-semibold">{editing?.kind === 'resource' ? 'Edit resource' : 'Add CS resource'}</h3></div>
          <Field label="Resource title"><input className={inputClass} maxLength={180} value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} required /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Category" value={resourceForm.category} options={CATEGORIES} onChange={e => setResourceForm({ ...resourceForm, category: e.target.value })} />
            <SelectField label="Resource type" value={resourceForm.resource_type} options={RESOURCE_TYPES} onChange={e => setResourceForm({ ...resourceForm, resource_type: e.target.value })} />
          </div>
          <Field label="Resource URL"><input type="url" className={inputClass} placeholder="https://" value={resourceForm.resource_url} onChange={e => setResourceForm({ ...resourceForm, resource_url: e.target.value })} required /></Field>
          <Field label="Description" hint="Optional · up to 2,000 characters"><textarea className={`${inputClass} min-h-24 resize-y`} maxLength={2000} value={resourceForm.description} onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><Button variant="outline" type="button" onClick={() => { setResourceForm(emptyResource); if (editing?.kind === 'resource') setEditing(null) }}>Clear</Button><Button disabled={busy}>{busy && <LoaderCircle size={15} className="animate-spin" />}{editing?.kind === 'resource' ? 'Save changes' : 'Publish resource'}</Button></div>
        </form>
      </div>
      <div className="mt-7 border-t border-line pt-5">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold">Existing content</h3><p className="mt-1 text-xs text-muted">Edit or remove published entries.</p></div><span className="text-xs text-muted">{questions.length} questions · {resources.length} resources</span></div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Questions</h4>
            {questions.length === 0 ? <p className="rounded-lg bg-paper px-3 py-4 text-sm text-muted">No questions to manage.</p> : questions.slice(0, 12).map(question => <div key={question.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2.5">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{question.question_name}</p><p className="mt-0.5 text-xs text-muted">{question.topic} · {question.difficulty}</p></div>
              <span className="flex shrink-0 gap-1"><button className="rounded p-1.5 text-muted hover:bg-paper hover:text-ink" aria-label={`Edit ${question.question_name}`} onClick={() => startQuestionEdit(question)}><FileText size={14} /></button><button className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${question.question_name}`} onClick={() => deleteItem('question', question)}><Trash2 size={14} /></button></span>
            </div>)}
            {questions.length > 12 && <button className="text-xs font-semibold text-accent" onClick={() => { setAdminOpen(false); navigate('questions') }}>View all questions →</button>}
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Resources</h4>
            {resources.length === 0 ? <p className="rounded-lg bg-paper px-3 py-4 text-sm text-muted">No resources to manage.</p> : resources.slice(0, 12).map(resource => <div key={resource.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2.5">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{resource.title}</p><p className="mt-0.5 text-xs text-muted">{resource.category} · {resource.resource_type}</p></div>
              <span className="flex shrink-0 gap-1"><button className="rounded p-1.5 text-muted hover:bg-paper hover:text-ink" aria-label={`Edit ${resource.title}`} onClick={() => startResourceEdit(resource)}><FileText size={14} /></button><button className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${resource.title}`} onClick={() => deleteItem('resource', resource)}><Trash2 size={14} /></button></span>
            </div>)}
            {resources.length > 12 && <button className="text-xs font-semibold text-accent" onClick={() => { setAdminOpen(false); navigate('resources') }}>View all resources →</button>}
          </div>
        </div>
      </div>
    </Modal>}
  </div>
}

function FilterSelect({ value, onChange, all, options }) {
  return <span className="relative block">
    <Filter size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
    <select className="h-full min-h-[42px] min-w-[145px] appearance-none rounded-lg border border-line bg-white py-2 pl-8 pr-8 text-sm text-ink outline-none focus:border-accent" value={value} onChange={event => onChange(event.target.value)}>
      {[all, ...options].map(option => <option key={option}>{option}</option>)}
    </select>
    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
  </span>
}

function Dashboard({ questions, resources, solvedCount, progress, onProgress, onNavigate, onPlayVideo }) {
  const topicCounts = TOPICS.map(topic => ({ topic, count: questions.filter(question => question.topic === topic).length }))
  const coveredTopicCount = topicCounts.filter(item => item.count > 0).length
  const recentQuestions = questions.slice(0, 4)
  const recentResources = resources.slice(0, 3)
  return <section>
    <div className="mb-9 grid gap-8 border-b border-line pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted"><span className="h-1.5 w-1.5 rounded-full bg-[#61a675]" />A free learning companion</div>
        <h1 className="display-font max-w-2xl text-4xl font-extrabold leading-[1.13] tracking-[-.055em] sm:text-5xl">Prepare with a little more <span className="text-accent">intention.</span></h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">Your Personal DSA &amp; CS Preparation Tracker. Keep the important problems and study material in one calm, organized place.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => onNavigate('questions')}>Explore questions<ArrowRight size={16} /></Button>
          <Button variant="outline" onClick={() => onNavigate('resources')}>Browse resources<BookOpen size={16} /></Button>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 lg:min-w-[220px]">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf5ee] text-[#4d8059]"><Check size={18} /></span>
        <div><p className="text-2xl font-bold tracking-tight">{solvedCount}<span className="ml-1 text-sm font-medium text-muted">/ {questions.length}</span></p><p className="text-xs text-muted">questions solved on this device</p></div>
      </div>
    </div>
    <div className="mb-10 grid gap-3 sm:grid-cols-3">
      <StatCard label="DSA questions" value={questions.length} icon={Code2} detail="across all topics" />
      <StatCard label="CS resources" value={resources.length} icon={BookOpen} detail="ready when you are" />
      <StatCard label="Topics covered" value={coveredTopicCount} icon={LayoutDashboard} detail={`of ${TOPICS.length} DSA topics`} />
    </div>
    <div className="grid gap-9 lg:grid-cols-[1fr_320px]">
      <div className="space-y-10">
        <section>
          <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-accent">Keep the momentum</p><h2 className="display-font mt-1 text-xl font-bold tracking-tight">Recently added questions</h2></div><button onClick={() => onNavigate('questions')} className="text-sm font-semibold text-muted hover:text-ink">View all <ArrowRight size={14} className="ml-1 inline" /></button></div>
          {recentQuestions.length ? <div className="grid gap-3">{recentQuestions.map(question => <QuestionCard key={question.id} question={question} progress={progress[question.id]} onProgress={onProgress} />)}</div> : <EmptyState icon={Code2} title="Ready for your first problem?" description="New questions added by the owner will show up here." />}
        </section>
        <section>
          <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-accent">Learn beyond algorithms</p><h2 className="display-font mt-1 text-xl font-bold tracking-tight">Recently added resources</h2></div><button onClick={() => onNavigate('resources')} className="text-sm font-semibold text-muted hover:text-ink">View all <ArrowRight size={14} className="ml-1 inline" /></button></div>
          {recentResources.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{recentResources.map(resource => <ResourceCard key={resource.id} resource={resource} onPlayVideo={onPlayVideo} />)}</div> : <EmptyState icon={BookOpen} title="Make room for good references" description="Helpful CS resources will be collected here as they are added." />}
        </section>
      </div>
      <aside>
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.13em] text-accent">Your roadmap</p><h2 className="display-font mt-1 text-lg font-bold tracking-tight">Topics</h2></div><span className="text-xs text-muted">{topicCounts.length}/{TOPICS.length}</span></div>
          <div className="max-h-[440px] space-y-1 overflow-y-auto pr-1">{topicCounts.map(({ topic, count }) => <button key={topic} onClick={() => onNavigate('questions', topic)} className="flex w-full items-center justify-between rounded-md py-2 text-left text-sm hover:text-accent"><span>{topic}</span><span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">{count}</span></button>)}</div>
        </div>
        <div className="mt-4 rounded-xl border border-line bg-[#f1f2ef] p-5">
          <p className="text-sm font-semibold">A steady rhythm beats a sprint.</p>
          <p className="mt-2 text-sm leading-6 text-muted">Mark each question as you go. Your progress stays private in this browser.</p>
          <button onClick={() => onNavigate('questions')} className="mt-4 text-sm font-semibold text-ink underline decoration-accent underline-offset-4">Pick up where you left off <ArrowRight size={14} className="ml-1 inline" /></button>
        </div>
      </aside>
    </div>
  </section>
}

function StatCard({ label, value, icon: Icon, detail }) {
  return <div className="rounded-xl border border-line bg-white p-4 sm:p-5">
    <div className="flex items-center justify-between"><span className="text-sm font-medium text-muted">{label}</span><Icon size={17} className="text-accent" /></div>
    <p className="display-font mt-3 text-3xl font-bold tracking-[-.04em]">{value}</p>
    <p className="mt-1 text-xs text-muted">{detail}</p>
  </div>
}

function VideoModal({ resource, onClose }) {
  const [playerError, setPlayerError] = useState(false)
  const { player } = resource
  return <Modal title="Watch video" onClose={onClose} width="max-w-3xl">
    <h3 className="display-font text-xl font-bold tracking-tight">{resource.title}</h3>
    {resource.description && <p className="mt-2 text-sm leading-6 text-muted">{resource.description}</p>}
    <div className="mt-5 aspect-video w-full overflow-hidden rounded-lg bg-[#111715]">
      {player.type === 'mp4' && !playerError ? <video
        className="h-full w-full"
        src={player.src}
        controls
        playsInline
        preload="metadata"
        onError={() => setPlayerError(true)}
      /> : ['youtube', 'vimeo'].includes(player.type) && !playerError ? <iframe
        className="h-full w-full border-0"
        src={player.src}
        title={resource.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onError={() => setPlayerError(true)}
      /> : <div className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center text-sm text-white/80">
        <Play size={22} />
        <p>{playerError ? 'This video could not be played here.' : 'This video link is not supported for in-page playback.'}</p>
        <a href={resource.resource_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-white underline underline-offset-4">Try opening the original link<ArrowUpRight size={14} /></a>
      </div>}
    </div>
  </Modal>
}

export default App
