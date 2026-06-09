import type { WorkPriority, WorkStatus, WorkType } from '@/api/work'

export const STATUS_META: Record<WorkStatus, { label: string; tone: string }> = {
  suggested: { label: 'Idée', tone: 'idea' },
  planned: { label: 'Planifié', tone: 'planned' },
  in_progress: { label: 'En cours', tone: 'progress' },
  done: { label: 'Terminé', tone: 'done' },
  cancelled: { label: 'Annulé', tone: 'cancelled' },
}

export const TYPE_META: Record<WorkType, { label: string; icon: string }> = {
  diy: { label: 'Bricolage', icon: 'gear' },
  pro: { label: 'Prestation', icon: 'users' },
}

export const PRIORITY_META: Record<WorkPriority, { label: string; tone: string }> = {
  low: { label: 'Faible', tone: 'low' },
  medium: { label: 'Moyenne', tone: 'medium' },
  high: { label: 'Haute', tone: 'high' },
}

export const STATUS_ORDER: WorkStatus[] = [
  'in_progress',
  'planned',
  'suggested',
  'done',
  'cancelled',
]

export const PRIORITY_ORDER: Record<WorkPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export const STATUS_OPTIONS: WorkStatus[] = [
  'suggested',
  'planned',
  'in_progress',
  'done',
  'cancelled',
]

export const TYPE_OPTIONS: WorkType[] = ['diy', 'pro']
export const PRIORITY_OPTIONS: WorkPriority[] = ['low', 'medium', 'high']
