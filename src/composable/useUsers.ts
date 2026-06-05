import { ref, computed, onMounted } from 'vue'
import { usersApi, idFromIri, type ApiUser } from '@/api/users'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

interface PaletteEntry {
  color: string
  bg: string
  key: string
}

const PALETTE: PaletteEntry[] = [
  { color: 'var(--p1)', bg: 'var(--p1-bg)', key: 'p1' },
  { color: 'var(--p2)', bg: 'var(--p2-bg)', key: 'p2' },
  { color: 'var(--p3)', bg: 'var(--p3-bg)', key: 'p3' },
  { color: 'var(--p4)', bg: 'var(--p4-bg)', key: 'p4' },
  { color: 'var(--p5)', bg: 'var(--p5-bg)', key: 'p5' },
]

export interface DisplayUser {
  id: number
  iri: string
  username: string
  short: string
  color: string
  bg: string
}

function initials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('') || '??'
}

function decorate(u: ApiUser): DisplayUser {
  const palette = PALETTE[u.id % PALETTE.length]
  return {
    id: u.id,
    iri: `/api/users/${u.id}`,
    username: u.username,
    short: initials(u.username),
    color: palette.color,
    bg: palette.bg,
  }
}

export function useUsers() {
  const items = ref<DisplayUser[]>([])
  const state = ref<AsyncState>('idle')
  const errorMessage = ref<string | null>(null)

  async function fetchAll() {
    state.value = 'loading'
    errorMessage.value = null
    try {
      const { data } = await usersApi.list()
      items.value = data.map(decorate)
      state.value = 'success'
    } catch {
      state.value = 'error'
      errorMessage.value = 'Impossible de charger les utilisateurs.'
    }
  }

  const byIri = computed<Record<string, DisplayUser>>(() => {
    const map: Record<string, DisplayUser> = {}
    for (const u of items.value) map[u.iri] = u
    return map
  })

  function resolve(iri: string): DisplayUser | null {
    return byIri.value[iri] ?? null
  }

  function fallback(iri: string): DisplayUser {
    const id = idFromIri(iri) ?? 0
    const palette = PALETTE[id % PALETTE.length]
    return {
      id,
      iri,
      username: `Utilisateur #${id}`,
      short: '??',
      color: palette.color,
      bg: palette.bg,
    }
  }

  onMounted(fetchAll)

  return { items, state, errorMessage, byIri, resolve, fallback, fetchAll }
}
