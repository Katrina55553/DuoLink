export interface Note {
  id: string
  content: string
  updatedAt: number
}

export interface NotesState {
  notes: Note[]
  activeNoteId: string
}

export type ViewMode = 'split' | 'edit' | 'preview'
