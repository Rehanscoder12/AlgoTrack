export const TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 'Binary Search',
  'Recursion', 'Backtracking', 'Trees', 'Binary Search Tree', 'Heap',
  'Graph', 'Dynamic Programming', 'Greedy', 'Sliding Window', 'Two Pointers',
  'Hashing', 'Bit Manipulation', 'Tries', 'Others',
]

export const CATEGORIES = [
  'Operating System (OS)', 'Database Management System (DBMS)',
  'Computer Networks (CN)', 'Object Oriented Programming (OOP)', 'Aptitude',
  'Technical MCQs', 'System Design', 'Java', 'SQL', 'Other Technical Subjects',
]

export const PLATFORMS = ['LeetCode', 'GeeksforGeeks', 'CodeStudio', 'HackerRank', 'Others']
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
export const RESOURCE_TYPES = ['PDF', 'Notes', 'Video', 'Website', 'Practice']

export function validHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export function platformInitial(platform = 'Other') {
  return ({ LeetCode: 'L', GeeksforGeeks: 'G', CodeStudio: 'C', HackerRank: 'H' })[platform] || '↗'
}
