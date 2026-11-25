import { useMemo, useRef, useState } from 'react'
import {
  ArrowDown, ArrowDownUp, ArrowRight, ArrowUp, ArrowUpRight, BookOpen, Check,
  ChevronDown, CircleHelp, Code2, ExternalLink, FileText, Filter, LayoutDashboard,
  LoaderCircle, LockKeyhole, LogOut, Menu, Play, Plus, Search, ShieldCheck,
  Trash2, X,
} from 'lucide-react'
import { useContent } from './hooks/useContent'
import {
  CATEGORIES, DIFFICULTIES, formatDate, platformInitial, PLATFORMS,
  RESOURCE_TYPES, TOPICS, validHttpUrl,
} from './lib/catalog'
import { getVideoSource } from './lib/video'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const PROGRESS_KEY = 'algotrack-question-progress'
const RESOURCE_PROGRESS_KEY = 'algotrack-resource-progress'
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

function readResourceProgress() {
  try { return JSON.parse(localStorage.getItem(RESOURCE_PROGRESS_KEY) || '{}') } catch { return {} }
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

function ResourceCard({ resource, admin, onEdit, onDelete, onPlayVideo, progress, onProgress }) {
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
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
      <span className="rounded-md bg-paper px-2 py-1 font-medium">{resource.resource_type}</span>
      <div className="flex items-center gap-2">
        <span>{formatDate(resource.created_at)}</span>
        {onProgress && <select
          className="rounded-md border border-line bg-white px-2 py-1.5 text-xs text-muted outline-none focus:border-accent"
          aria-label={`Completion for ${resource.title}`}
          value={progress || 'Not Started'}
          onClick={event => event.stopPropagation()}
          onChange={event => onProgress(resource.id, event.target.value)}
        >
          {['Not Started', 'In Progress', 'Completed'].map(status => <option key={status}>{status}</option>)}
        </select>}
      </div>
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

function CompletionProgress({ completed, total, unit = 'solved' }) {
  const percentage = total ? Math.round((completed / total) * 100) : 0
  return <div className="flex min-w-[135px] items-center gap-2">
    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper">
      <span className="block h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
    </span>
    <span className="shrink-0 text-[11px] text-muted">{completed}/{total} {unit}</span>
  </div>
}

function PublicSectionBrowser({
  sections, sectionTopics, questionAssignments, questions, sectionsError,
  progress, onProgress, onRetry,
}) {
  const [expandedSections, setExpandedSections] = useState({})
  const [expandedTopics, setExpandedTopics] = useState({})

  if (sectionsError) return <div>
    <Notice error={`DSA sections are unavailable. Apply the migration in supabase/migrations/20261125_dsa_sections.sql, then retry. (${sectionsError})`} onRetry={onRetry} />
    <EmptyState icon={BookOpen} title="Sections need database setup" description="Your existing question library remains available while the section tables are prepared." />
  </div>

  if (!sections.length) return <EmptyState icon={BookOpen} title="No study sections yet" description="The owner will publish curated DSA sections here. Your existing question library is still available in the other tab." />

  const questionsById = new Map(questions.map(question => [question.id, question]))
  return <div className="space-y-3">
    {sections.map(section => {
      const topics = sectionTopics.filter(topic => topic.section_id === section.id)
      const sectionTopicIds = new Set(topics.map(topic => topic.id))
      const sectionQuestionIds = new Set(questionAssignments
        .filter(assignment => sectionTopicIds.has(assignment.topic_id))
        .map(assignment => assignment.question_id)
        .filter(id => questionsById.has(id)))
      const sectionCompleted = [...sectionQuestionIds].filter(id => progress[id] === 'Solved').length
      const isExpanded = Boolean(expandedSections[section.id])

      return <article key={section.id} className="overflow-hidden rounded-xl border border-line bg-white">
        <button
          className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
          onClick={() => setExpandedSections(current => ({ ...current, [section.id]: !current[section.id] }))}
          aria-expanded={isExpanded}
        >
          <span className="flex min-w-0 items-center gap-3">
            <ChevronDown size={17} className={`shrink-0 text-muted transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
            <span className="min-w-0">
              <span className="block font-semibold">{section.title}</span>
              <span className="mt-1 block text-xs text-muted">{topics.length} {topics.length === 1 ? 'topic' : 'topics'} · {sectionQuestionIds.size} {sectionQuestionIds.size === 1 ? 'question' : 'questions'}</span>
            </span>
          </span>
          <span className="w-full pl-8 sm:w-44 sm:shrink-0 sm:pl-0"><CompletionProgress completed={sectionCompleted} total={sectionQuestionIds.size} /></span>
        </button>
        {isExpanded && <div className="space-y-3 border-t border-line bg-paper/50 p-3 sm:p-4">
          {section.description && <p className="px-1 text-sm leading-6 text-muted">{section.description}</p>}
          {topics.length === 0 && <p className="px-1 py-3 text-sm text-muted">Topics will appear here when added.</p>}
          {topics.map(topic => {
            const assignments = questionAssignments
              .filter(assignment => assignment.topic_id === topic.id)
              .sort((a, b) => a.display_order - b.display_order)
            const topicQuestionIds = [...new Set(assignments.map(assignment => assignment.question_id))]
            const topicQuestions = topicQuestionIds.map(id => questionsById.get(id)).filter(Boolean)
            const topicCompleted = topicQuestionIds.filter(id => progress[id] === 'Solved').length
            const isTopicExpanded = Boolean(expandedTopics[topic.id])
            return <section key={topic.id} className="rounded-lg border border-line bg-white">
              <button
                className="flex w-full flex-wrap items-center justify-between gap-3 p-3.5 text-left"
                onClick={() => setExpandedTopics(current => ({ ...current, [topic.id]: !current[topic.id] }))}
                aria-expanded={isTopicExpanded}
              >
                <span className="flex items-center gap-2 font-medium">
                  <ChevronDown size={15} className={`text-muted transition-transform ${isTopicExpanded ? '' : '-rotate-90'}`} />
                  {topic.title}
                  <span className="text-xs font-normal text-muted">({topicQuestionIds.length})</span>
                </span>
                <CompletionProgress completed={topicCompleted} total={topicQuestionIds.length} />
              </button>
              {isTopicExpanded && <div className="space-y-3 border-t border-line p-3.5">
                {topic.description && <p className="text-sm leading-6 text-muted">{topic.description}</p>}
                {topicQuestions.length ? <div className="grid gap-2">{topicQuestions.map(question => <QuestionCard
                  key={question.id}
                  question={question}
                  progress={progress[question.id]}
                  onProgress={onProgress}
                />)}</div> : <p className="text-sm text-muted">No questions in this topic yet.</p>}
              </div>}
            </section>
          })}
        </div>}
      </article>
    })}
  </div>
}

function AdminSectionManager({
  sections, sectionTopics, questionAssignments, questions, sectionsError,
  busy, onAction, onRetry, onEditQuestion, onCreateQuestion,
}) {
  const [newSection, setNewSection] = useState({ title: '', description: '' })
  const [editingSection, setEditingSection] = useState(null)
  const [newTopic, setNewTopic] = useState(null)
  const [topicForm, setTopicForm] = useState({ title: '', description: '' })
  const [editingTopic, setEditingTopic] = useState(null)
  const [assignmentSelection, setAssignmentSelection] = useState({})

  async function createSection(event) {
    event.preventDefault()
    if (!newSection.title.trim()) return
    if (await onAction('add-section', { section: newSection }, 'Section created.')) {
      setNewSection({ title: '', description: '' })
    }
  }

  async function saveSection(event) {
    event.preventDefault()
    if (!editingSection?.form.title.trim()) return
    if (await onAction('update-section', { id: editingSection.id, section: editingSection.form }, 'Section updated.')) {
      setEditingSection(null)
    }
  }

  async function createTopic(event, sectionId) {
    event.preventDefault()
    if (!topicForm.title.trim()) return
    if (await onAction('add-section-topic', {
      topic: { ...topicForm, section_id: sectionId },
    }, 'Topic created.')) {
      setNewTopic(null)
      setTopicForm({ title: '', description: '' })
    }
  }

  async function saveTopic(event) {
    event.preventDefault()
    if (!editingTopic?.form.title.trim()) return
    if (await onAction('update-section-topic', {
      id: editingTopic.id,
      topic: editingTopic.form,
    }, 'Topic updated.')) {
      setEditingTopic(null)
    }
  }

  if (sectionsError) return <section className="mt-8 border-t border-line pt-5">
    <h3 className="font-semibold">DSA sections and topics</h3>
    <Notice error={`Apply supabase/migrations/20261125_dsa_sections.sql to enable this feature. (${sectionsError})`} onRetry={onRetry} />
  </section>

  return <section className="mt-8 border-t border-line pt-5">
    <div className="mb-4">
      <h3 className="font-semibold">DSA sections and topics</h3>
      <p className="mt-1 text-xs leading-5 text-muted">Organize shared questions into study plans. A question remains a single record even when linked in multiple places.</p>
    </div>
    <form className="mb-5 grid gap-3 rounded-xl border border-line bg-paper p-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end" onSubmit={createSection}>
      <Field label="New section title">
        <input className={inputClass} value={newSection.title} maxLength={180} onChange={event => setNewSection({ ...newSection, title: event.target.value })} placeholder="e.g. Blind 75" required />
      </Field>
      <Field label="Description (optional)">
        <input className={inputClass} value={newSection.description} maxLength={2000} onChange={event => setNewSection({ ...newSection, description: event.target.value })} placeholder="A short overview" />
      </Field>
      <Button disabled={busy}><Plus size={15} />Create section</Button>
    </form>

    {sections.length === 0 ? <p className="rounded-lg bg-paper px-4 py-5 text-sm text-muted">No sections yet. Create one to start organizing questions.</p> : <div className="space-y-4">
      {sections.map((section, sectionIndex) => {
        const topics = sectionTopics.filter(topic => topic.section_id === section.id)
        const editingThisSection = editingSection?.id === section.id
        return <article key={section.id} className="rounded-xl border border-line p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {editingThisSection ? <form className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2" onSubmit={saveSection}>
              <Field label="Section title"><input className={inputClass} value={editingSection.form.title} maxLength={180} onChange={event => setEditingSection({ ...editingSection, form: { ...editingSection.form, title: event.target.value } })} required /></Field>
              <Field label="Description"><input className={inputClass} value={editingSection.form.description} maxLength={2000} onChange={event => setEditingSection({ ...editingSection, form: { ...editingSection.form, description: event.target.value } })} /></Field>
              <div className="flex gap-2 sm:col-span-2"><Button disabled={busy}>Save section</Button><Button type="button" variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button></div>
            </form> : <div className="min-w-0 flex-1">
              <h4 className="font-semibold">{section.title}</h4>
              {section.description && <p className="mt-1 text-sm leading-5 text-muted">{section.description}</p>}
              <p className="mt-1 text-xs text-muted">{topics.length} {topics.length === 1 ? 'topic' : 'topics'}</p>
            </div>}
            <div className="flex shrink-0 items-center gap-1">
              <button title="Move section up" aria-label="Move section up" disabled={busy || sectionIndex === 0} onClick={() => onAction('reorder-section', { id: section.id, direction: 'up' }, 'Section order updated.')} className="rounded-md p-2 text-muted hover:bg-paper disabled:opacity-30"><ArrowUp size={15} /></button>
              <button title="Move section down" aria-label="Move section down" disabled={busy || sectionIndex === sections.length - 1} onClick={() => onAction('reorder-section', { id: section.id, direction: 'down' }, 'Section order updated.')} className="rounded-md p-2 text-muted hover:bg-paper disabled:opacity-30"><ArrowDown size={15} /></button>
              {!editingThisSection && <button title="Edit section" aria-label="Edit section" onClick={() => setEditingSection({ id: section.id, form: { title: section.title, description: section.description || '' } })} className="rounded-md p-2 text-muted hover:bg-paper hover:text-ink"><FileText size={15} /></button>}
              <button title="Delete section" aria-label="Delete section" disabled={busy} onClick={() => {
                if (window.confirm(`Delete "${section.title}" and its topics? Questions themselves will remain unchanged.`)) onAction('delete-section', { id: section.id }, 'Section deleted.')
              }} className="rounded-md p-2 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 size={15} /></button>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted">Topics</h5>
              <Button variant="outline" className="!px-3 !py-1.5 !text-xs" disabled={busy} onClick={() => { setNewTopic(section.id); setTopicForm({ title: '', description: '' }) }}><Plus size={13} />Add topic</Button>
            </div>
            {newTopic === section.id && <form className="mb-3 grid gap-2 rounded-lg bg-paper p-3 sm:grid-cols-[1fr_1.4fr_auto_auto] sm:items-end" onSubmit={event => createTopic(event, section.id)}>
              <Field label="Topic title"><input className={inputClass} value={topicForm.title} maxLength={180} onChange={event => setTopicForm({ ...topicForm, title: event.target.value })} required /></Field>
              <Field label="Description (optional)"><input className={inputClass} value={topicForm.description} maxLength={2000} onChange={event => setTopicForm({ ...topicForm, description: event.target.value })} /></Field>
              <Button disabled={busy}>Save topic</Button>
              <Button type="button" variant="outline" onClick={() => setNewTopic(null)}>Cancel</Button>
            </form>}
            {topics.length === 0 && newTopic !== section.id && <p className="py-2 text-sm text-muted">No topics in this section.</p>}
            <div className="space-y-3">
              {topics.map((topic, topicIndex) => {
                const links = questionAssignments.filter(assignment => assignment.topic_id === topic.id)
                const assignedIds = new Set(links.map(assignment => assignment.question_id))
                const assignedQuestions = links.map(link => questions.find(question => question.id === link.question_id)).filter(Boolean)
                const availableQuestions = questions.filter(question => !assignedIds.has(question.id))
                const editingThisTopic = editingTopic?.id === topic.id
                return <div key={topic.id} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {editingThisTopic ? <form className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2" onSubmit={saveTopic}>
                      <Field label="Topic title"><input className={inputClass} value={editingTopic.form.title} maxLength={180} onChange={event => setEditingTopic({ ...editingTopic, form: { ...editingTopic.form, title: event.target.value } })} required /></Field>
                      <Field label="Description"><input className={inputClass} value={editingTopic.form.description} maxLength={2000} onChange={event => setEditingTopic({ ...editingTopic, form: { ...editingTopic.form, description: event.target.value } })} /></Field>
                      <div className="flex gap-2 sm:col-span-2"><Button disabled={busy}>Save topic</Button><Button type="button" variant="outline" onClick={() => setEditingTopic(null)}>Cancel</Button></div>
                    </form> : <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{topic.title}<span className="ml-2 text-xs font-normal text-muted">{assignedQuestions.length} questions</span></p>
                      {topic.description && <p className="mt-1 text-xs leading-5 text-muted">{topic.description}</p>}
                    </div>}
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button title="Move topic up" aria-label="Move topic up" disabled={busy || topicIndex === 0} onClick={() => onAction('reorder-section-topic', { id: topic.id, sectionId: section.id, direction: 'up' }, 'Topic order updated.')} className="rounded p-1.5 text-muted hover:bg-paper disabled:opacity-30"><ArrowUp size={14} /></button>
                      <button title="Move topic down" aria-label="Move topic down" disabled={busy || topicIndex === topics.length - 1} onClick={() => onAction('reorder-section-topic', { id: topic.id, sectionId: section.id, direction: 'down' }, 'Topic order updated.')} className="rounded p-1.5 text-muted hover:bg-paper disabled:opacity-30"><ArrowDown size={14} /></button>
                      {!editingThisTopic && <button title="Edit topic" aria-label="Edit topic" onClick={() => setEditingTopic({ id: topic.id, form: { title: topic.title, description: topic.description || '' } })} className="rounded p-1.5 text-muted hover:bg-paper hover:text-ink"><FileText size={14} /></button>}
                      <button title="Delete topic" aria-label="Delete topic" disabled={busy} onClick={() => {
                        if (window.confirm(`Delete topic "${topic.title}" and its question links? The original questions will remain.`)) onAction('delete-section-topic', { id: topic.id }, 'Topic deleted.')
                      }} className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
                    <label className="min-w-[220px] flex-1 space-y-1">
                      <span className="text-xs font-semibold text-muted">Add existing question</span>
                      <select className={selectClass} value={assignmentSelection[topic.id] || ''} onChange={event => setAssignmentSelection({ ...assignmentSelection, [topic.id]: event.target.value })}>
                        <option value="">Choose a question…</option>
                        {availableQuestions.map(question => <option key={question.id} value={question.id}>{question.question_name}</option>)}
                      </select>
                    </label>
                    <Button variant="outline" className="!py-2" disabled={busy || !assignmentSelection[topic.id]} onClick={async () => {
                      const questionId = assignmentSelection[topic.id]
                      if (await onAction('assign-question-to-topic', { topicId: topic.id, questionId }, 'Question added to topic.')) {
                        setAssignmentSelection(current => ({ ...current, [topic.id]: '' }))
                      }
                    }}><Plus size={14} />Add question</Button>
                    <Button variant="outline" className="!py-2" disabled={busy} onClick={() => onCreateQuestion(topic)}><Plus size={14} />Create new</Button>
                  </div>
                  {assignedQuestions.length > 0 && <div className="mt-3 divide-y divide-line border-t border-line">
                    {assignedQuestions.map(question => <div key={question.id} className="flex items-center justify-between gap-2 py-2">
                      <div className="min-w-0"><a href={question.problem_url} target="_blank" rel="noreferrer" className="truncate text-sm font-medium hover:underline">{question.question_name}<ExternalLink size={11} className="ml-1 inline text-muted" /></a><p className="text-xs text-muted">{question.difficulty} · {question.platform}</p></div>
                      <div className="flex shrink-0 gap-1">
                        <button title="Edit question globally" aria-label={`Edit ${question.question_name}`} onClick={() => onEditQuestion(question)} className="rounded p-1.5 text-muted hover:bg-paper hover:text-ink"><FileText size={14} /></button>
                        <button title="Remove from this topic" aria-label={`Remove ${question.question_name} from this topic`} onClick={() => {
                          if (window.confirm(`Remove "${question.question_name}" from "${topic.title}"? The original question will remain.`)) onAction('remove-question-from-topic', { topicId: topic.id, questionId: question.id }, 'Question removed from topic.')
                        }} className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><X size={14} /></button>
                      </div>
                    </div>)}
                  </div>}
                  {availableQuestions.length === 0 && questions.length > 0 && <p className="mt-2 text-xs text-muted">All questions are already linked to this topic.</p>}
                </div>
              })}
            </div>
          </div>
        </article>
      })}
    </div>}
  </section>
}

function PublicResourceSectionBrowser({
  sections, sectionTopics, resourceAssignments, resources, sectionsError,
  progress, onProgress, onPlayVideo, onRetry,
}) {
  const [expandedSections, setExpandedSections] = useState({})
  const [expandedTopics, setExpandedTopics] = useState({})

  if (sectionsError) return <div>
    <Notice error={`Resource sections are unavailable. Apply supabase/migrations/20261126_resource_sections.sql, then retry. (${sectionsError})`} onRetry={onRetry} />
    <EmptyState icon={BookOpen} title="Sections need database setup" description="Your existing resource library remains available while the section tables are prepared." />
  </div>

  if (!sections.length) return <EmptyState icon={BookOpen} title="No resource sections yet" description="The owner will publish organized resource sections here. Your resource library remains available in the other tab." />

  const resourcesById = new Map(resources.map(resource => [resource.id, resource]))
  return <div className="space-y-3">
    {sections.map(section => {
      const topics = sectionTopics.filter(topic => topic.section_id === section.id)
      const topicIds = new Set(topics.map(topic => topic.id))
      const sectionResourceIds = new Set(resourceAssignments
        .filter(assignment => topicIds.has(assignment.topic_id))
        .map(assignment => assignment.resource_id)
        .filter(id => resourcesById.has(id)))
      const sectionCompleted = [...sectionResourceIds].filter(id => progress[id] === 'Completed').length
      const isExpanded = Boolean(expandedSections[section.id])

      return <article key={section.id} className="overflow-hidden rounded-xl border border-line bg-white">
        <button
          className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left sm:p-5"
          onClick={() => setExpandedSections(current => ({ ...current, [section.id]: !current[section.id] }))}
          aria-expanded={isExpanded}
        >
          <span className="flex min-w-0 items-center gap-3">
            <ChevronDown size={17} className={`shrink-0 text-muted transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
            <span className="min-w-0">
              <span className="block font-semibold">{section.title}</span>
              <span className="mt-1 block text-xs text-muted">{topics.length} {topics.length === 1 ? 'topic' : 'topics'} · {sectionResourceIds.size} {sectionResourceIds.size === 1 ? 'resource' : 'resources'}</span>
            </span>
          </span>
          <span className="w-full pl-8 sm:w-44 sm:shrink-0 sm:pl-0"><CompletionProgress completed={sectionCompleted} total={sectionResourceIds.size} unit="complete" /></span>
        </button>
        {isExpanded && <div className="space-y-3 border-t border-line bg-paper/50 p-3 sm:p-4">
          {section.description && <p className="px-1 text-sm leading-6 text-muted">{section.description}</p>}
          {topics.length === 0 && <p className="px-1 py-3 text-sm text-muted">Topics will appear here when added.</p>}
          {topics.map(topic => {
            const assignments = resourceAssignments
              .filter(assignment => assignment.topic_id === topic.id)
              .sort((a, b) => a.display_order - b.display_order)
            const resourceIds = [...new Set(assignments.map(assignment => assignment.resource_id))]
            const topicResources = resourceIds.map(id => resourcesById.get(id)).filter(Boolean)
            const completed = resourceIds.filter(id => progress[id] === 'Completed').length
            const isTopicExpanded = Boolean(expandedTopics[topic.id])
            return <section key={topic.id} className="rounded-lg border border-line bg-white">
              <button
                className="flex w-full flex-wrap items-center justify-between gap-3 p-3.5 text-left"
                onClick={() => setExpandedTopics(current => ({ ...current, [topic.id]: !current[topic.id] }))}
                aria-expanded={isTopicExpanded}
              >
                <span className="flex items-center gap-2 font-medium">
                  <ChevronDown size={15} className={`text-muted transition-transform ${isTopicExpanded ? '' : '-rotate-90'}`} />
                  {topic.title}<span className="text-xs font-normal text-muted">({resourceIds.length})</span>
                </span>
                <CompletionProgress completed={completed} total={resourceIds.length} unit="complete" />
              </button>
              {isTopicExpanded && <div className="space-y-3 border-t border-line p-3.5">
                {topic.description && <p className="text-sm leading-6 text-muted">{topic.description}</p>}
                {topicResources.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{topicResources.map(resource => <ResourceCard
                  key={resource.id}
                  resource={resource}
                  progress={progress[resource.id]}
                  onProgress={onProgress}
                  onPlayVideo={onPlayVideo}
                />)}</div> : <p className="text-sm text-muted">No resources in this topic yet.</p>}
              </div>}
            </section>
          })}
        </div>}
      </article>
    })}
  </div>
}

function AdminResourceSectionManager({
  sections, sectionTopics, resourceAssignments, resources, sectionsError,
  busy, onAction, onRetry, onEditResource, onCreateResource,
}) {
  const [newSection, setNewSection] = useState({ title: '', description: '' })
  const [editingSection, setEditingSection] = useState(null)
  const [newTopic, setNewTopic] = useState(null)
  const [topicForm, setTopicForm] = useState({ title: '', description: '' })
  const [editingTopic, setEditingTopic] = useState(null)
  const [assignmentSelection, setAssignmentSelection] = useState({})

  async function createSection(event) {
    event.preventDefault()
    if (!newSection.title.trim()) return
    if (await onAction('add-resource-section', { section: newSection }, 'Resource section created.')) {
      setNewSection({ title: '', description: '' })
    }
  }

  async function saveSection(event) {
    event.preventDefault()
    if (!editingSection?.form.title.trim()) return
    if (await onAction('update-resource-section', { id: editingSection.id, section: editingSection.form }, 'Resource section updated.')) {
      setEditingSection(null)
    }
  }

  async function createTopic(event, sectionId) {
    event.preventDefault()
    if (!topicForm.title.trim()) return
    if (await onAction('add-resource-section-topic', {
      topic: { ...topicForm, section_id: sectionId },
    }, 'Resource topic created.')) {
      setNewTopic(null)
      setTopicForm({ title: '', description: '' })
    }
  }

  async function saveTopic(event) {
    event.preventDefault()
    if (!editingTopic?.form.title.trim()) return
    if (await onAction('update-resource-section-topic', {
      id: editingTopic.id,
      topic: editingTopic.form,
    }, 'Resource topic updated.')) {
      setEditingTopic(null)
    }
  }

  if (sectionsError) return <section className="mt-8 border-t border-line pt-5">
    <h3 className="font-semibold">Resource sections and topics</h3>
    <Notice error={`Apply supabase/migrations/20261126_resource_sections.sql to enable this feature. (${sectionsError})`} onRetry={onRetry} />
  </section>

  return <section className="mt-8 border-t border-line pt-5">
    <div className="mb-4">
      <h3 className="font-semibold">Resource sections and topics</h3>
      <p className="mt-1 text-xs leading-5 text-muted">Organize shared resources into study paths. A resource stays a single record when linked in multiple topics.</p>
    </div>
    <form className="mb-5 grid gap-3 rounded-xl border border-line bg-paper p-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end" onSubmit={createSection}>
      <Field label="New section title">
        <input className={inputClass} value={newSection.title} maxLength={180} onChange={event => setNewSection({ ...newSection, title: event.target.value })} placeholder="e.g. Interview Preparation" required />
      </Field>
      <Field label="Description (optional)">
        <input className={inputClass} value={newSection.description} maxLength={2000} onChange={event => setNewSection({ ...newSection, description: event.target.value })} placeholder="A short overview" />
      </Field>
      <Button disabled={busy}><Plus size={15} />Create section</Button>
    </form>

    {sections.length === 0 ? <p className="rounded-lg bg-paper px-4 py-5 text-sm text-muted">No sections yet. Create one to start organizing resources.</p> : <div className="space-y-4">
      {sections.map((section, sectionIndex) => {
        const topics = sectionTopics.filter(topic => topic.section_id === section.id)
        const editingThisSection = editingSection?.id === section.id
        return <article key={section.id} className="rounded-xl border border-line p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {editingThisSection ? <form className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2" onSubmit={saveSection}>
              <Field label="Section title"><input className={inputClass} value={editingSection.form.title} maxLength={180} onChange={event => setEditingSection({ ...editingSection, form: { ...editingSection.form, title: event.target.value } })} required /></Field>
              <Field label="Description"><input className={inputClass} value={editingSection.form.description} maxLength={2000} onChange={event => setEditingSection({ ...editingSection, form: { ...editingSection.form, description: event.target.value } })} /></Field>
              <div className="flex gap-2 sm:col-span-2"><Button disabled={busy}>Save section</Button><Button type="button" variant="outline" onClick={() => setEditingSection(null)}>Cancel</Button></div>
            </form> : <div className="min-w-0 flex-1">
              <h4 className="font-semibold">{section.title}</h4>
              {section.description && <p className="mt-1 text-sm leading-5 text-muted">{section.description}</p>}
              <p className="mt-1 text-xs text-muted">{topics.length} {topics.length === 1 ? 'topic' : 'topics'}</p>
            </div>}
            <div className="flex shrink-0 items-center gap-1">
              <button title="Move resource section up" aria-label="Move resource section up" disabled={busy || sectionIndex === 0} onClick={() => onAction('reorder-resource-section', { id: section.id, direction: 'up' }, 'Resource section order updated.')} className="rounded-md p-2 text-muted hover:bg-paper disabled:opacity-30"><ArrowUp size={15} /></button>
              <button title="Move resource section down" aria-label="Move resource section down" disabled={busy || sectionIndex === sections.length - 1} onClick={() => onAction('reorder-resource-section', { id: section.id, direction: 'down' }, 'Resource section order updated.')} className="rounded-md p-2 text-muted hover:bg-paper disabled:opacity-30"><ArrowDown size={15} /></button>
              {!editingThisSection && <button title="Edit resource section" aria-label="Edit resource section" onClick={() => setEditingSection({ id: section.id, form: { title: section.title, description: section.description || '' } })} className="rounded-md p-2 text-muted hover:bg-paper hover:text-ink"><FileText size={15} /></button>}
              <button title="Delete resource section" aria-label="Delete resource section" disabled={busy} onClick={() => {
                if (window.confirm(`Delete "${section.title}" and its topics? Resources themselves will remain unchanged.`)) onAction('delete-resource-section', { id: section.id }, 'Resource section deleted.')
              }} className="rounded-md p-2 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 size={15} /></button>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted">Topics</h5>
              <Button variant="outline" className="!px-3 !py-1.5 !text-xs" disabled={busy} onClick={() => { setNewTopic(section.id); setTopicForm({ title: '', description: '' }) }}><Plus size={13} />Add topic</Button>
            </div>
            {newTopic === section.id && <form className="mb-3 grid gap-2 rounded-lg bg-paper p-3 sm:grid-cols-[1fr_1.4fr_auto_auto] sm:items-end" onSubmit={event => createTopic(event, section.id)}>
              <Field label="Topic title"><input className={inputClass} value={topicForm.title} maxLength={180} onChange={event => setTopicForm({ ...topicForm, title: event.target.value })} required /></Field>
              <Field label="Description (optional)"><input className={inputClass} value={topicForm.description} maxLength={2000} onChange={event => setTopicForm({ ...topicForm, description: event.target.value })} /></Field>
              <Button disabled={busy}>Save topic</Button>
              <Button type="button" variant="outline" onClick={() => setNewTopic(null)}>Cancel</Button>
            </form>}
            {topics.length === 0 && newTopic !== section.id && <p className="py-2 text-sm text-muted">No topics in this section.</p>}
            <div className="space-y-3">
              {topics.map((topic, topicIndex) => {
                const links = resourceAssignments.filter(assignment => assignment.topic_id === topic.id)
                const assignedIds = new Set(links.map(assignment => assignment.resource_id))
                const assignedResources = links.map(link => resources.find(resource => resource.id === link.resource_id)).filter(Boolean)
                const availableResources = resources.filter(resource => !assignedIds.has(resource.id))
                const editingThisTopic = editingTopic?.id === topic.id
                return <div key={topic.id} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {editingThisTopic ? <form className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2" onSubmit={saveTopic}>
                      <Field label="Topic title"><input className={inputClass} value={editingTopic.form.title} maxLength={180} onChange={event => setEditingTopic({ ...editingTopic, form: { ...editingTopic.form, title: event.target.value } })} required /></Field>
                      <Field label="Description"><input className={inputClass} value={editingTopic.form.description} maxLength={2000} onChange={event => setEditingTopic({ ...editingTopic, form: { ...editingTopic.form, description: event.target.value } })} /></Field>
                      <div className="flex gap-2 sm:col-span-2"><Button disabled={busy}>Save topic</Button><Button type="button" variant="outline" onClick={() => setEditingTopic(null)}>Cancel</Button></div>
                    </form> : <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{topic.title}<span className="ml-2 text-xs font-normal text-muted">{assignedResources.length} resources</span></p>
                      {topic.description && <p className="mt-1 text-xs leading-5 text-muted">{topic.description}</p>}
                    </div>}
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button title="Move topic up" aria-label="Move resource topic up" disabled={busy || topicIndex === 0} onClick={() => onAction('reorder-resource-section-topic', { id: topic.id, sectionId: section.id, direction: 'up' }, 'Resource topic order updated.')} className="rounded p-1.5 text-muted hover:bg-paper disabled:opacity-30"><ArrowUp size={14} /></button>
                      <button title="Move topic down" aria-label="Move resource topic down" disabled={busy || topicIndex === topics.length - 1} onClick={() => onAction('reorder-resource-section-topic', { id: topic.id, sectionId: section.id, direction: 'down' }, 'Resource topic order updated.')} className="rounded p-1.5 text-muted hover:bg-paper disabled:opacity-30"><ArrowDown size={14} /></button>
                      {!editingThisTopic && <button title="Edit topic" aria-label="Edit resource topic" onClick={() => setEditingTopic({ id: topic.id, form: { title: topic.title, description: topic.description || '' } })} className="rounded p-1.5 text-muted hover:bg-paper hover:text-ink"><FileText size={14} /></button>}
                      <button title="Delete topic" aria-label="Delete resource topic" disabled={busy} onClick={() => {
                        if (window.confirm(`Delete topic "${topic.title}" and its resource links? Original resources will remain.`)) onAction('delete-resource-section-topic', { id: topic.id }, 'Resource topic deleted.')
                      }} className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
                    <label className="min-w-[220px] flex-1 space-y-1">
                      <span className="text-xs font-semibold text-muted">Add existing resource</span>
                      <select className={selectClass} value={assignmentSelection[topic.id] || ''} onChange={event => setAssignmentSelection(current => ({ ...current, [topic.id]: event.target.value }))}>
                        <option value="">Choose a resource…</option>
                        {availableResources.map(resource => <option key={resource.id} value={resource.id}>{resource.title}</option>)}
                      </select>
                    </label>
                    <Button variant="outline" className="!py-2" disabled={busy || !assignmentSelection[topic.id]} onClick={async () => {
                      const resourceId = assignmentSelection[topic.id]
                      if (await onAction('assign-resource-to-topic', { topicId: topic.id, resourceId }, 'Resource added to topic.')) {
                        setAssignmentSelection(current => ({ ...current, [topic.id]: '' }))
                      }
                    }}><Plus size={14} />Add resource</Button>
                    <Button variant="outline" className="!py-2" disabled={busy} onClick={() => onCreateResource(topic)}><Plus size={14} />Create new</Button>
                  </div>
                  {assignedResources.length > 0 && <div className="mt-3 divide-y divide-line border-t border-line">
                    {assignedResources.map(resource => <div key={resource.id} className="flex items-center justify-between gap-2 py-2">
                      <div className="min-w-0"><p className="truncate text-sm font-medium">{resource.title}</p><p className="text-xs text-muted">{resource.resource_type} · {resource.category}</p></div>
                      <div className="flex shrink-0 gap-1">
                        <button title="Edit resource" aria-label={`Edit ${resource.title}`} onClick={() => onEditResource(resource)} className="rounded p-1.5 text-muted hover:bg-paper hover:text-ink"><FileText size={14} /></button>
                        <button title="Remove from this topic" aria-label={`Remove ${resource.title} from this topic`} onClick={() => {
                          if (window.confirm(`Remove "${resource.title}" from "${topic.title}"? The original resource will remain.`)) onAction('remove-resource-from-topic', { topicId: topic.id, resourceId: resource.id }, 'Resource removed from topic.')
                        }} className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"><X size={14} /></button>
                      </div>
                    </div>)}
                  </div>}
                  {availableResources.length === 0 && resources.length > 0 && <p className="mt-2 text-xs text-muted">All resources are already linked to this topic.</p>}
                </div>
              })}
            </div>
          </div>
        </article>
      })}
    </div>}
  </section>
}

function App() {
  const {
    questions, resources, sections, sectionTopics, questionAssignments,
    resourceSections, resourceSectionTopics, resourceAssignments,
    loading, error, sectionsError, refresh,
    resourceSectionsError,
  } = useContent()
  const [page, setPage] = useState('dashboard')
  const [dsaView, setDsaView] = useState('questions')
  const [resourceView, setResourceView] = useState('library')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('All topics')
  const [difficultyFilter, setDifficultyFilter] = useState('All difficulties')
  const [platformFilter, setPlatformFilter] = useState('All platforms')
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [sortNewest, setSortNewest] = useState(true)
  const [progress, setProgress] = useState(readProgress)
  const [resourceProgress, setResourceProgress] = useState(readResourceProgress)
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
  const [topicQuestionTarget, setTopicQuestionTarget] = useState(null)
  const [resourceTopicTarget, setResourceTopicTarget] = useState(null)
  const questionFormRef = useRef(null)
  const resourceFormRef = useRef(null)

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

  function updateResourceProgress(id, value) {
    const updated = { ...resourceProgress, [id]: value }
    setResourceProgress(updated)
    localStorage.setItem(RESOURCE_PROGRESS_KEY, JSON.stringify(updated))
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
    setTopicQuestionTarget(null)
    setResourceTopicTarget(null)
    setQuestionForm({
      question_name: question.question_name, topic: question.topic, difficulty: question.difficulty,
      platform: question.platform, problem_url: question.problem_url, notes: question.notes || '',
    })
    setAdminOpen(true)
    window.requestAnimationFrame(() => questionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function startResourceEdit(resource) {
    setEditing({ kind: 'resource', id: resource.id })
    setResourceTopicTarget(null)
    setTopicQuestionTarget(null)
    setResourceForm({
      title: resource.title, category: resource.category, description: resource.description || '',
      resource_type: resource.resource_type, resource_url: resource.resource_url,
    })
    setAdminOpen(true)
    window.requestAnimationFrame(() => resourceFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function startResourceInTopic(topic) {
    setEditing(null)
    setResourceTopicTarget(topic.id)
    setTopicQuestionTarget(null)
    setResourceForm(emptyResource)
    window.requestAnimationFrame(() => resourceFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function startBlankResource() {
    setEditing(null)
    setResourceTopicTarget(null)
    setTopicQuestionTarget(null)
    setResourceForm(emptyResource)
    setAdminOpen(true)
    window.requestAnimationFrame(() => resourceFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
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
    setTopicQuestionTarget(null)
    setResourceTopicTarget(null)
    setNotice('Admin mode ended.')
  }

  async function performAdminAction(action, data, successMessage) {
    setBusy(true)
    setNotice('')
    try {
      await adminRequest(action, data)
      await refresh()
      setNotice(successMessage)
      return true
    } catch (reason) {
      setNotice(reason.message || 'The requested change could not be saved.')
      return false
    } finally {
      setBusy(false)
    }
  }

  function startQuestionInTopic(topic) {
    setEditing(null)
    setTopicQuestionTarget(topic.id)
    setResourceTopicTarget(null)
    setQuestionForm(emptyQuestion)
    window.requestAnimationFrame(() => questionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function startBlankQuestion() {
    setEditing(null)
    setTopicQuestionTarget(null)
    setResourceTopicTarget(null)
    setQuestionForm(emptyQuestion)
    setAdminOpen(true)
    window.requestAnimationFrame(() => questionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
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
      const action = editing?.kind === 'question'
        ? 'update-question'
        : topicQuestionTarget ? 'create-question-in-topic' : 'add-question'
      await adminRequest(action, {
        id: editing?.kind === 'question' ? editing.id : undefined,
        topicId: topicQuestionTarget || undefined,
        question: { ...questionForm, question_name: questionForm.question_name.trim(), notes: questionForm.notes.trim() },
      })
      setQuestionForm(emptyQuestion)
      setEditing(null)
      setTopicQuestionTarget(null)
      await refresh()
      setNotice(topicQuestionTarget ? 'Question saved and linked to the selected topic.' : 'Question saved and published.')
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
      const action = editing?.kind === 'resource'
        ? 'update-resource'
        : resourceTopicTarget ? 'create-resource-in-topic' : 'add-resource'
      await adminRequest(action, {
        id: editing?.kind === 'resource' ? editing.id : undefined,
        topicId: resourceTopicTarget || undefined,
        resource: { ...resourceForm, title: resourceForm.title.trim(), description: resourceForm.description.trim() },
      })
      setResourceForm(emptyResource)
      setEditing(null)
      setResourceTopicTarget(null)
      await refresh()
      setNotice(resourceTopicTarget ? 'Resource saved and linked to the selected topic.' : 'Resource saved and published.')
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
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-line pb-4">
            <button onClick={() => setDsaView('questions')} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${dsaView === 'questions' ? 'bg-white text-ink ring-1 ring-line' : 'text-muted hover:text-ink'}`}>Question library</button>
            <button onClick={() => setDsaView('sections')} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${dsaView === 'sections' ? 'bg-white text-ink ring-1 ring-line' : 'text-muted hover:text-ink'}`}>Study sections</button>
          </div>
          {dsaView === 'sections' ? <PublicSectionBrowser
            sections={sections}
            sectionTopics={sectionTopics}
            questionAssignments={questionAssignments}
            questions={questions}
            sectionsError={sectionsError}
            progress={progress}
            onProgress={updateProgress}
            onRetry={refresh}
          /> : <>
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
            {adminToken && <Button variant="outline" className="!py-2" onClick={startBlankQuestion}><Plus size={15} />Add question</Button>}
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
          </>}
        </section>
      ) : (
        <section>
          <PageHeading eyebrow="Study library" title="CS Resources" description="Curated notes, references and practice material for the subjects behind the code." />
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-line pb-4">
            <button onClick={() => setResourceView('library')} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${resourceView === 'library' ? 'bg-white text-ink ring-1 ring-line' : 'text-muted hover:text-ink'}`}>Resource library</button>
            <button onClick={() => setResourceView('sections')} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${resourceView === 'sections' ? 'bg-white text-ink ring-1 ring-line' : 'text-muted hover:text-ink'}`}>Study sections</button>
          </div>
          {resourceView === 'sections' ? <PublicResourceSectionBrowser
            sections={resourceSections}
            sectionTopics={resourceSectionTopics}
            resourceAssignments={resourceAssignments}
            resources={resources}
            sectionsError={resourceSectionsError}
            progress={resourceProgress}
            onProgress={updateResourceProgress}
            onPlayVideo={openVideo}
            onRetry={refresh}
          /> : <>
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
            {adminToken && <Button variant="outline" className="!py-2" onClick={startBlankResource}><Plus size={15} />Add resource</Button>}
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
          </>}
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

    {adminOpen && adminToken && <Modal title="Manage AlgoTrack" width="max-w-5xl" onClose={() => { setAdminOpen(false); setEditing(null); setTopicQuestionTarget(null); setResourceTopicTarget(null) }}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-paper px-4 py-3">
        <div><p className="text-sm font-semibold">Admin mode is on</p><p className="mt-0.5 text-xs text-muted">Changes publish for every visitor.</p></div>
        <Button variant="outline" className="!py-2" onClick={logout}><LogOut size={15} />End session</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <form id="question-admin-form" ref={questionFormRef} className="space-y-4 rounded-xl border border-line p-4 sm:p-5" onSubmit={saveQuestion}>
          <div className="flex items-center gap-2"><Code2 size={17} className="text-accent" /><h3 className="font-semibold">{editing?.kind === 'question' ? 'Edit question' : topicQuestionTarget ? 'Add question to selected topic' : 'Add DSA question'}</h3></div>
          {topicQuestionTarget && <p className="text-xs leading-5 text-muted">The new question will be created once and linked to this topic. Its existing DSA topic classification is selected below.</p>}
          <Field label="Question name"><input className={inputClass} value={questionForm.question_name} maxLength={180} onChange={e => setQuestionForm({ ...questionForm, question_name: e.target.value })} required /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Topic" value={questionForm.topic} options={TOPICS} onChange={e => setQuestionForm({ ...questionForm, topic: e.target.value })} />
            <SelectField label="Difficulty" value={questionForm.difficulty} options={DIFFICULTIES} onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })} />
            <SelectField label="Platform" value={questionForm.platform} options={PLATFORMS} onChange={e => setQuestionForm({ ...questionForm, platform: e.target.value })} />
            <Field label="Problem URL"><input type="url" className={inputClass} placeholder="https://" value={questionForm.problem_url} onChange={e => setQuestionForm({ ...questionForm, problem_url: e.target.value })} required /></Field>
          </div>
          <Field label="Notes" hint="Optional · up to 2,000 characters"><textarea className={`${inputClass} min-h-20 resize-y`} maxLength={2000} value={questionForm.notes} onChange={e => setQuestionForm({ ...questionForm, notes: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><Button variant="outline" type="button" onClick={() => { setQuestionForm(emptyQuestion); setTopicQuestionTarget(null); if (editing?.kind === 'question') setEditing(null) }}>Clear</Button><Button disabled={busy}>{busy && <LoaderCircle size={15} className="animate-spin" />}{editing?.kind === 'question' ? 'Save changes' : topicQuestionTarget ? 'Create and assign' : 'Publish question'}</Button></div>
        </form>

        <form id="resource-admin-form" ref={resourceFormRef} className="space-y-4 rounded-xl border border-line p-4 sm:p-5" onSubmit={saveResource}>
          <div className="flex items-center gap-2"><BookOpen size={17} className="text-accent" /><h3 className="font-semibold">{editing?.kind === 'resource' ? 'Edit resource' : resourceTopicTarget ? 'Add resource to selected topic' : 'Add CS resource'}</h3></div>
          {resourceTopicTarget && <p className="text-xs leading-5 text-muted">The resource will be created once and linked to this topic. Existing resources with the same URL are reused.</p>}
          <Field label="Resource title"><input className={inputClass} maxLength={180} value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} required /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Category" value={resourceForm.category} options={CATEGORIES} onChange={e => setResourceForm({ ...resourceForm, category: e.target.value })} />
            <SelectField label="Resource type" value={resourceForm.resource_type} options={RESOURCE_TYPES} onChange={e => setResourceForm({ ...resourceForm, resource_type: e.target.value })} />
          </div>
          <Field label="Resource URL"><input type="url" className={inputClass} placeholder="https://" value={resourceForm.resource_url} onChange={e => setResourceForm({ ...resourceForm, resource_url: e.target.value })} required /></Field>
          <Field label="Description" hint="Optional · up to 2,000 characters"><textarea className={`${inputClass} min-h-24 resize-y`} maxLength={2000} value={resourceForm.description} onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><Button variant="outline" type="button" onClick={() => { setResourceForm(emptyResource); setResourceTopicTarget(null); if (editing?.kind === 'resource') setEditing(null) }}>Clear</Button><Button disabled={busy}>{busy && <LoaderCircle size={15} className="animate-spin" />}{editing?.kind === 'resource' ? 'Save changes' : resourceTopicTarget ? 'Create and assign' : 'Publish resource'}</Button></div>
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
      <AdminSectionManager
        sections={sections}
        sectionTopics={sectionTopics}
        questionAssignments={questionAssignments}
        questions={questions}
        sectionsError={sectionsError}
        busy={busy}
        onAction={performAdminAction}
        onRetry={refresh}
        onEditQuestion={startQuestionEdit}
        onCreateQuestion={startQuestionInTopic}
      />
      <AdminResourceSectionManager
        sections={resourceSections}
        sectionTopics={resourceSectionTopics}
        resourceAssignments={resourceAssignments}
        resources={resources}
        sectionsError={resourceSectionsError}
        busy={busy}
        onAction={performAdminAction}
        onRetry={refresh}
        onEditResource={startResourceEdit}
        onCreateResource={startResourceInTopic}
      />
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
