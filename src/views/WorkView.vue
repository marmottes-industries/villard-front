<script setup lang="ts">
import { computed, ref } from 'vue'
import { AxiosError } from 'axios'
import AppTopbar from '@/components/shell/AppTopbar.vue'
import Icon from '@/components/icons/Icon.vue'
import WorkCard from '@/components/work/WorkCard.vue'
import WorkModal, {
  type ModalInitial,
  type WorkSavePayload,
} from '@/components/work/WorkModal.vue'
import { useWork } from '@/composable/useWork'
import { useUsers } from '@/composable/useUsers'
import { useAuthStore } from '@/stores/auth'
import type { Work, WorkStatus } from '@/api/work'
import {
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
} from '@/utils/workMeta'

const works = useWork()
const users = useUsers()
const auth = useAuthStore()

const isAdmin = computed(() => auth.user?.roles.includes('ROLE_ADMIN') ?? false)
const currentUserIri = computed(() => {
  const uuid = auth.userUuid
  if (!uuid) return null
  return users.findByUuid(uuid)?.iri ?? null
})

const query = ref('')
const statusFilter = ref<WorkStatus | 'all' | 'open'>('open')
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
}

async function onSave(payload: WorkSavePayload) {
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
    }
    if (payload.id === null) {
      await works.create(body)
    } else {
      await works.update(payload.id, body)
    }
    closeModal()
  } catch (err) {
    actionError.value = formatError(err)
  }
}

async function onRemove(id: number) {
  actionError.value = null
  try {
    await works.remove(id)
    closeModal()
  } catch (err) {
    actionError.value = formatError(err)
  }
}

function formatError(err: unknown): string {
  if (err instanceof AxiosError) {
    if (err.response?.status === 403) return 'Action non autorisée.'
    if (err.response?.status === 422) return 'Données invalides.'
    if (err.code === 'ERR_NETWORK') return 'Impossible de joindre le serveur.'
  }
  return 'Une erreur est survenue.'
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
    <button class="btn primary" @click="onNew">
      <Icon name="plus" :size="16" /><span class="btn-label">Ajouter</span>
    </button>
  </AppTopbar>

  <div class="content">
    <div class="content-inner view">
      <div v-if="initialState === 'loading'" class="card pad-center">
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
    :can-delete="canDeleteCurrent"
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
  background: var(--ink);
  border-color: var(--ink);
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
