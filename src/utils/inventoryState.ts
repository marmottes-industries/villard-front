import type { InvState } from '@/api/inventory'

export const STATE_META: Record<InvState, { label: string; cls: InvState }> = {
  ok: { label: 'Bon état', cls: 'ok' },
  worn: { label: 'Usé', cls: 'worn' },
  replace: { label: 'À remplacer', cls: 'replace' },
}

export const STATE_CYCLE: Record<InvState, InvState> = {
  ok: 'worn',
  worn: 'replace',
  replace: 'ok',
}

export const STATE_FILTERS: Array<[InvState | 'all', string]> = [
  ['all', 'Tous'],
  ['ok', 'Bon'],
  ['worn', 'Usé'],
  ['replace', 'À remplacer'],
]
