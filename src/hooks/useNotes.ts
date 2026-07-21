import { useCallback, useMemo } from 'react'
import type { NotesState } from '../types/note'
import { useLocalStorage } from './useLocalStorage'
import { createNote, loadInitialNotesState, updateActiveNoteContent } from '../utils/noteUtils'

interface UseNotesOptions {
  /** 本地变更后回调,用于 P2P 同步整份笔记状态 */
  onStateChange?: (state: NotesState) => void
}

export function useNotes(options?: UseNotesOptions) {
  const onStateChange = options?.onStateChange
  const [state, setState] = useLocalStorage<NotesState>('md-notes', loadInitialNotesState())

  const activeNote = useMemo(
    () => state.notes.find((n) => n.id === state.activeNoteId) ?? state.notes[0],
    [state.notes, state.activeNoteId],
  )

  const mutate = useCallback(
    (updater: (prev: NotesState) => NotesState) => {
      setState((prev) => {
        const next = updater(prev)
        onStateChange?.(next)
        return next
      })
    },
    [setState, onStateChange],
  )

  const replaceState = useCallback(
    (next: NotesState) => {
      setState(next)
    },
    [setState],
  )

  const setActiveContent = useCallback(
    (content: string) => {
      mutate((prev) => updateActiveNoteContent(prev, content))
    },
    [mutate],
  )

  const selectNote = useCallback(
    (id: string) => {
      mutate((prev) => (prev.notes.some((n) => n.id === id) ? { ...prev, activeNoteId: id } : prev))
    },
    [mutate],
  )

  const createNewNote = useCallback(() => {
    mutate((prev) => {
      const note = createNote()
      return {
        notes: [note, ...prev.notes],
        activeNoteId: note.id,
      }
    })
  }, [mutate])

  const deleteNote = useCallback(
    (id: string) => {
      mutate((prev) => {
        if (prev.notes.length <= 1) {
          const note = createNote()
          return { notes: [note], activeNoteId: note.id }
        }
        const notes = prev.notes.filter((n) => n.id !== id)
        const activeNoteId = prev.activeNoteId === id ? notes[0].id : prev.activeNoteId
        return { notes, activeNoteId }
      })
    },
    [mutate],
  )

  return {
    state,
    activeNote,
    replaceState,
    setActiveContent,
    selectNote,
    createNote: createNewNote,
    deleteNote,
  }
}
