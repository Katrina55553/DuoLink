import type { Note, NotesState } from '../types/note'
import { sampleContent } from './sampleContent'

const DEFAULT_NOTE_ID = 'default'

export function getNoteTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  const title = match?.[1]?.trim()
  if (title) return title.length > 24 ? `${title.slice(0, 24)}…` : title
  const firstLine = content.split('\n').find((line) => line.trim())
  if (firstLine) {
    const text = firstLine.replace(/^#+\s*/, '').trim()
    if (text) return text.length > 24 ? `${text.slice(0, 24)}…` : text
  }
  return '未命名笔记'
}

export function createNote(content = '# 新笔记\n\n'): Note {
  return {
    id: crypto.randomUUID(),
    content,
    updatedAt: Date.now(),
  }
}

export function createDefaultNotesState(): NotesState {
  const note = createNote(sampleContent)
  note.id = DEFAULT_NOTE_ID
  return { notes: [note], activeNoteId: note.id }
}

export function loadInitialNotesState(): NotesState {
  try {
    const raw = localStorage.getItem('md-notes')
    if (raw) {
      const parsed = JSON.parse(raw) as NotesState
      if (parsed.notes?.length && parsed.activeNoteId) return parsed
    }
  } catch {
    /* ignore */
  }

  try {
    const legacyNote = localStorage.getItem('note-content')
    if (legacyNote) {
      const content = JSON.parse(legacyNote) as string
      const note = createNote(content)
      return { notes: [note], activeNoteId: note.id }
    }
  } catch {
    /* ignore */
  }

  try {
    const legacy = localStorage.getItem('md-content')
    if (legacy) {
      const content = JSON.parse(legacy) as string
      const note = createNote(content)
      return { notes: [note], activeNoteId: note.id }
    }
  } catch {
    /* ignore */
  }

  return createDefaultNotesState()
}

export function isNotesState(value: unknown): value is NotesState {
  if (!value || typeof value !== 'object') return false
  const state = value as NotesState
  return (
    Array.isArray(state.notes) &&
    typeof state.activeNoteId === 'string' &&
    state.notes.every(
      (n) =>
        n &&
        typeof n.id === 'string' &&
        typeof n.content === 'string' &&
        typeof n.updatedAt === 'number',
    )
  )
}

export function updateActiveNoteContent(state: NotesState, content: string): NotesState {
  return {
    ...state,
    notes: state.notes.map((n) =>
      n.id === state.activeNoteId ? { ...n, content, updatedAt: Date.now() } : n,
    ),
  }
}
