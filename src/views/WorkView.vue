<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatError } from '@/utils/formatError'
import AppTopbar from '@/components/shell/AppTopbar.vue'
import Icon from '@/components/icons/Icon.vue'
import WorkCard from '@/components/work/WorkCard.vue'
import WorkModal, {
  type ModalInitial,
  type WorkSavePayload,
} from '@/components/work/WorkModal.vue'
import { useWork } from '@/composable/useWork'
import { useRooms } from '@/composable/useRooms'
import { useUsers } from '@/composable/useUsers'
import { useAuthStore } from '@/stores/auth'
import { usePropertiesStore } from '@/stores/properties'
import type { Work, WorkStatus } from '@/api/work'
import {
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
} from '@/utils/workMeta'

const works = useWork()
const rooms = useRooms()
const users = useUsers()
const auth = useAuthStore()
const properties = usePropertiesStore()

const isAdmin = computed(() => auth.user?.roles.includes('ROLE_ADMIN') ?? false)
const currentUserIri = computed(() => {
  const uuid = auth.userUuid
  if (!uuid) return null
  return users.findByUuid(uuid)?.iri ?? null
})

const query = ref('')
const statusFilter = ref<WorkStatus | 'all' | 'open'>('open')
const yearFilter = ref<number | 'all'>('all')
const modalSaveError = ref<string | null>(null)
const actionError = ref<string | null>(null)

const modalOpen = ref(false)
const modalInitial = ref<ModalInitial | null>(null)

const initialState = computed(() => {
  if (works.state.value === 'loading' || users.state.value === 'loading') return 'loading'
  if (works.state.value === 'error' || users.state.value === 'error') return 'error'
  return 'ready'
})

function resolveAuthor(iri: string) {
  return users.resolve(iri) ?? users.fallback(iri)
}

function canEditWork(work: Work) {
  if (isAdmin.value) return true
  return currentUserIri.value !== null && work.author === currentUserIri.value
}

const sorted = computed<Work[]>(() =>
  [...works.items.value].sort((a, b) => {
    const sa = STATUS_ORDER.indexOf(a.status)
    const sb = STATUS_ORDER.indexOf(b.status)
    if (sa !== sb) return sa - sb
    const pa = a.priority ? PRIORITY_ORDER[a.priority] : 3
    const pb = b.priority ? PRIORITY_ORDER[b.priority] : 3
    if (pa !== pb) return pa - pb
    const da = new Date(a.scheduledFor ?? a.createdAt).getTime()
    const db = new Date(b.scheduledFor ?? b.createdAt).getTime()
    return da - db
  }),
)

const filtered = computed<Work[]>(() => {
  const q = query.value.trim().toLowerCase()
  return sorted.value.filter(w => {
    if (statusFilter.value === 'open') {
      if (w.status === 'done' || w.status === 'cancelled') return false
    } else if (statusFilter.value !== 'all' && w.status !== statusFilter.value) {
      return false
    }
    if (!q) return true
    return `${w.title} ${w.description ?? ''}`.toLowerCase().includes(q)
  })
})

const counts = computed(() => {
  const map: Record<WorkStatus, number> = {
    suggested: 0,
    planned: 0,
    in_progress: 0,
    done: 0,
    cancelled: 0,
  }
  for (const w of works.items.value) map[w.status]++
  return map
})

const openCount = computed(
  () => counts.value.suggested + counts.value.planned + counts.value.in_progress,
)

const doneWorks = computed(() =>
  works.items.value.filter(w => w.status === 'done'),
)

function completionYear(work: Work): number | null {
  const ref = work.completedAt ?? work.scheduledFor ?? work.createdAt
  if (!ref) return null
  const d = new Date(ref)
  return Number.isNaN(d.getTime()) ? null : d.getFullYear()
}

const availableYears = computed<number[]>(() => {
  const set = new Set<number>()
  for (const w of doneWorks.value) {
    const y = completionYear(w)
    if (y !== null) set.add(y)
  }
  return [...set].sort((a, b) => b - a)
})

const doneInYear = computed(() =>
  doneWorks.value.filter(w => {
    if (yearFilter.value === 'all') return true
    return completionYear(w) === yearFilter.value
  }),
)

const totalActualCost = computed(() =>
  doneInYear.value.reduce((sum, w) => sum + (w.actualCost ?? 0), 0),
)

const countWithCost = computed(
  () => doneInYear.value.filter(w => w.actualCost !== null && w.actualCost !== undefined).length,
)

const costFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

function onNew() {
  modalInitial.value = { mode: 'create' }
  modalOpen.value = true
}

function onEdit(work: Work) {
  modalInitial.value = { mode: 'edit', work }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  modalInitial.value = null
  modalSaveError.value = null
}

async function onSave(payload: WorkSavePayload) {
  modalSaveError.value = null
  actionError.value = null
  try {
    const body = {
      title: payload.title,
      description: payload.description,
      status: payload.status,
      type: payload.type,
      priority: payload.priority,
      scheduledFor: payload.scheduledFor,
      estimatedCost: payload.estimatedCost,
      actualCost: payload.actualCost,
      room: payload.room,
    }
    const { imageError } = payload.id === null
      ? await works.create(body, payload.images)
      : await works.update(payload.id, body, payload.images)
    closeModal()
    // Les travaux sont enregistrés : un échec sur les photos se signale sans rouvrir la modale.
    if (imageError) actionError.value = `Travaux enregistrés. ${imageError}`
  } catch (err) {
    modalSaveError.value = formatError(err)
  }
}

async function onRemove(id: number) {
  modalSaveError.value = null
  try {
    await works.remove(id)
    closeModal()
  } catch (err) {
    modalSaveError.value = formatError(err)
  }
}
const canDeleteCurrent = computed(() => {
  const init = modalInitial.value
  if (!init || init.mode !== 'edit') return false
  return canEditWork(init.work)
})

async function retryInitial() {
  await Promise.all([works.fetchAll(), users.fetchAll()])
}
</script>

<template>
  <AppTopbar eyebrow="Le chalet" title="Travaux" sub="Bricolage et prestations à faire">
    <div class="searchbox">
      <Icon name="search" :size="15" class="muted-icon" />
      <input
        v-model="query"
        type="search"
        placeholder="Rechercher un travail…"
        aria-label="Rechercher dans les travaux"
      />
    </div>
    <button class="btn primary" :disabled="!properties.hasProperties" @click="onNew">
      <Icon name="plus" :size="16" /><span class="btn-label">Ajouter</span>
    </button>
  </AppTopbar>

  <div class="content">
    <div class="content-inner view">
      <div v-if="!properties.hasProperties" class="card pad-center">
        <p class="muted">
          Aucun logement ne vous est rattaché. Demande à un gestionnaire de t'ajouter
          à un logement pour voir les travaux.
        </p>
      </div>

      <div v-else-if="initialState === 'loading'" class="card pad-center">
        <p class="muted">Chargement…</p>
      </div>

      <div v-else-if="initialState === 'error'" class="card pad-center">
        <p class="error-msg">
          {{ works.errorMessage.value ?? users.errorMessage.value ?? 'Erreur de chargement.' }}
        </p>
        <button class="btn" @click="retryInitial">Réessayer</button>
      </div>

      <template v-else>
        <div v-if="actionError" class="action-error">
          <Icon name="alert" :size="15" />
          {{ actionError }}
        </div>

        <div v-if="doneWorks.length" class="stats-bar">
          <div class="stat">
            <span class="stat-label">Coût réel cumulé</span>
            <strong class="stat-value">{{ costFormatter.format(totalActualCost) }}</strong>
            <span class="stat-meta muted">
              {{ countWithCost }} / {{ doneInYear.length }} travaux chiffrés
            </span>
          </div>
          <label class="year-select" v-if="availableYears.length">
            <span class="sr-only">Filtrer par année</span>
            <Icon name="calendar" :size="13" class="muted-icon" />
            <select v-model="yearFilter">
              <option :value="'all'">Toutes les années</option>
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
          </label>
        </div>

        <div class="filters">
          <button
            type="button"
            class="filter-chip"
            :class="{ on: statusFilter === 'open' }"
            @click="statusFilter = 'open'"
          >
            À faire <span class="filter-count">{{ openCount }}</span>
          </button>
          <button
            type="button"
            class="filter-chip"
            :class="{ on: statusFilter === 'all' }"
            @click="statusFilter = 'all'"
          >
            Tous <span class="filter-count">{{ works.items.value.length }}</span>
          </button>
          <button
            v-for="s in STATUS_ORDER"
            :key="s"
            type="button"
            class="filter-chip"
            :class="{ on: statusFilter === s }"
            @click="statusFilter = s"
          >
            {{ STATUS_META[s].label }}
            <span class="filter-count">{{ counts[s] }}</span>
          </button>
        </div>

        <div v-if="filtered.length" class="works-grid">
          <WorkCard
            v-for="work in filtered"
            :key="work.id"
            :work="work"
            :author="resolveAuthor(work.author)"
            :can-edit="canEditWork(work)"
            @edit="onEdit"
          />
        </div>

        <div v-else class="empty">
          <Icon name="gear" :size="26" class="muted-icon" />
          <p v-if="query">Aucun travail ne correspond à « {{ query }} ».</p>
          <p v-else-if="statusFilter !== 'open' && statusFilter !== 'all'">
            Aucun travail dans ce statut.
          </p>
          <p v-else>Aucun travail pour le moment. Ajoute le premier !</p>
        </div>
      </template>
    </div>
  </div>

  <WorkModal
    :open="modalOpen"
    :initial="modalInitial"
    :rooms="rooms.items.value"
    :can-delete="canDeleteCurrent"
    :save-error="modalSaveError"
    @close="closeModal"
    @save="onSave"
    @remove="onRemove"
  />
</template>

<style scoped>
.muted-icon { color: var(--ink-3); }
.pad-center { padding: 48px; text-align: center; }
.error-msg { color: var(--replace); margin-bottom: 16px; }
.action-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
  background: var(--replace-bg);
  color: #8c3a2e;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}

.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 12px 16px;
  margin-bottom: 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--sh-1);
}
.stat {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.stat-label {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  font-weight: 500;
}
.stat-value {
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1;
}
.stat-meta {
  font-size: 12px;
}
.year-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper, #fff);
}
.year-select select {
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
  padding-right: 2px;
}
.year-select select:focus { outline: none; }
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink-2);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
}
.filter-chip:hover { border-color: var(--line-3); }
.filter-chip.on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.filter-count {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.07);
  color: inherit;
}
.filter-chip.on .filter-count {
  background: rgba(255, 255, 255, 0.18);
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
</style>
