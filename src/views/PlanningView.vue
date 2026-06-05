<script setup lang="ts">
import { computed, ref } from 'vue'
import { AxiosError } from 'axios'
import AppTopbar from '@/components/shell/AppTopbar.vue'
import Icon from '@/components/icons/Icon.vue'
import MonthCalendar from '@/components/planning/MonthCalendar.vue'
import ListCalendar from '@/components/planning/ListCalendar.vue'
import OccupantsLegend from '@/components/planning/OccupantsLegend.vue'
import OccupationModal, { type ModalInitial } from '@/components/planning/OccupationModal.vue'
import { useOccupations } from '@/composable/useOccupations'
import { useUsers } from '@/composable/useUsers'
import { useAuthStore } from '@/stores/auth'
import type { Occupation } from '@/api/occupation'
import {
  MONTHS,
  MONTHS_ABBR,
  addDays,
  fmtISO,
  mondayOf,
  parseISO,
  todayMidday,
} from '@/utils/dates'

type CalView = 'month' | 'list'

const occupations = useOccupations()
const users = useUsers()
const auth = useAuthStore()

const TODAY = todayMidday()
const focus = ref<Date>(TODAY)
const view = ref<CalView>('month')

const modalOpen = ref(false)
const modalInitial = ref<ModalInitial | null>(null)
const actionError = ref<string | null>(null)

function resolveUser(iri: string) {
  return users.resolve(iri) ?? users.fallback(iri)
}

const title = computed(() => {
  if (view.value === 'month') {
    return `${MONTHS[focus.value.getMonth()]} ${focus.value.getFullYear()}`
  }
  return 'Réservations'
})

const current = computed<Occupation | null>(() => {
  for (const o of occupations.items.value) {
    if (parseISO(o.startDate) <= TODAY && parseISO(o.endDate) > TODAY) return o
  }
  return null
})

const next = computed<Occupation | null>(() => {
  return [...occupations.items.value]
    .filter(o => parseISO(o.startDate) > TODAY)
    .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())[0] ?? null
})

function navMonth(dir: -1 | 1) {
  focus.value = new Date(focus.value.getFullYear(), focus.value.getMonth() + dir, 1, 12)
}

function backToToday() {
  focus.value = new Date(TODAY)
}

function openNew(start?: Date) {
  const startDay = start ?? TODAY
  modalInitial.value = {
    mode: 'create',
    startDate: fmtISO(startDay),
    endDate: fmtISO(addDays(startDay, 1)),
    occupantIri: auth.userIri ?? users.items.value[0]?.iri ?? '',
  }
  modalOpen.value = true
}

function openEdit(occ: Occupation) {
  modalInitial.value = { mode: 'edit', occupation: occ }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  modalInitial.value = null
}

async function onSave(payload: {
  id: number | null
  startDate: string
  endDate: string
  notes: string
  occupant: string
}) {
  actionError.value = null
  try {
    if (payload.id === null) {
      await occupations.create({
        startDate: payload.startDate,
        endDate: payload.endDate,
        notes: payload.notes || undefined,
        occupant: payload.occupant,
      })
    } else {
      await occupations.update(payload.id, {
        startDate: payload.startDate,
        endDate: payload.endDate,
        notes: payload.notes || undefined,
      })
    }
    closeModal()
  } catch (err) {
    actionError.value = formatError(err)
  }
}

async function onRemove(id: number) {
  actionError.value = null
  try {
    await occupations.remove(id)
    closeModal()
  } catch (err) {
    actionError.value = formatError(err)
  }
}

function formatError(err: unknown): string {
  if (err instanceof AxiosError) {
    if (err.response?.status === 403) return "Action non autorisée."
    if (err.response?.status === 422) return "Données invalides — vérifie les dates."
    if (err.code === 'ERR_NETWORK') return "Impossible de joindre le serveur."
  }
  return "Une erreur est survenue."
}

const isAdmin = computed(() => auth.user?.roles.includes('ROLE_ADMIN') ?? false)

function canEditOrDelete(occ: Occupation): boolean {
  if (isAdmin.value) return true
  return occ.occupant === auth.userIri
}

const monthRangeLabel = computed(() => {
  const f = focus.value
  const ws = mondayOf(new Date(f.getFullYear(), f.getMonth(), 1, 12))
  const we = addDays(ws, 41)
  return `${ws.getDate()} ${MONTHS_ABBR[ws.getMonth()]} – ${we.getDate()} ${MONTHS_ABBR[we.getMonth()]}`
})
</script>

<template>
  <AppTopbar
    eyebrow="Planning d'occupation"
    :title="title"
    :sub="view === 'month' ? monthRangeLabel : undefined"
  >
    <div v-if="view === 'month'" class="cal-nav">
      <button class="btn icon sm" @click="navMonth(-1)" aria-label="Mois précédent">
        <Icon name="chevL" :size="16" />
      </button>
      <button class="btn sm" @click="backToToday">Aujourd'hui</button>
      <button class="btn icon sm" @click="navMonth(1)" aria-label="Mois suivant">
        <Icon name="chevR" :size="16" />
      </button>
    </div>
    <div class="seg">
      <button :class="{ on: view === 'month' }" @click="view = 'month'">
        <Icon name="grid" :size="14" />Mois
      </button>
      <button :class="{ on: view === 'list' }" @click="view = 'list'">
        <Icon name="list" :size="14" />Liste
      </button>
    </div>
    <button class="btn primary" @click="openNew()">
      <Icon name="plus" :size="16" />Réserver
    </button>
  </AppTopbar>

  <div class="content">
    <div class="content-inner view">
      <div v-if="occupations.state.value === 'loading'" class="card pad-center">
        <p class="muted">Chargement…</p>
      </div>

      <div v-else-if="occupations.state.value === 'error'" class="card pad-center">
        <p class="error-msg">{{ occupations.errorMessage.value }}</p>
        <button class="btn" @click="occupations.fetchAll">Réessayer</button>
      </div>

      <template v-else>
        <div class="occ-status">
          <div class="status-card">
            <span
              class="status-dot"
              :style="{ background: current ? resolveUser(current.occupant).color : 'var(--sage)' }"
            />
            <span v-if="current">
              Actuellement&nbsp;: <b>{{ resolveUser(current.occupant).username }}</b>
              <span class="muted"> · jusqu'au {{ addDays(parseISO(current.endDate), -1).getDate() }} {{ MONTHS_ABBR[addDays(parseISO(current.endDate), -1).getMonth()] }}</span>
            </span>
            <span v-else>
              Appartement <b>libre</b> aujourd'hui
            </span>
          </div>
          <div v-if="next" class="status-card subtle">
            <Icon name="arrow" :size="15" class="muted-icon" />
            <span>
              Prochain&nbsp;: <b>{{ resolveUser(next.occupant).username }}</b>
              <span class="muted"> · {{ parseISO(next.startDate).getDate() }} {{ MONTHS_ABBR[parseISO(next.startDate).getMonth()] }}</span>
            </span>
          </div>
        </div>

        <OccupantsLegend
          v-if="users.items.value.length > 0"
          :occupants="users.items.value"
        />

        <div v-if="actionError" class="action-error">
          <Icon name="alert" :size="15" />
          {{ actionError }}
        </div>

        <MonthCalendar
          v-if="view === 'month'"
          :occupations="occupations.items.value"
          :focus="focus"
          :resolve-user="resolveUser"
          @pick-day="openNew"
          @open-occupation="openEdit"
        />

        <ListCalendar
          v-else
          :occupations="occupations.items.value"
          :resolve-user="resolveUser"
          @open-occupation="openEdit"
        />
      </template>
    </div>
  </div>

  <OccupationModal
    :open="modalOpen"
    :initial="modalInitial"
    :occupants="users.items.value"
    :current-user-iri="auth.userIri"
    :can-delete="modalInitial?.mode === 'edit' && canEditOrDelete(modalInitial.occupation)"
    @close="closeModal"
    @save="onSave"
    @remove="onRemove"
  />
</template>

<style scoped>
.cal-nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pad-center {
  padding: 48px;
  text-align: center;
}
.error-msg {
  color: var(--replace);
  margin-bottom: 16px;
}
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
.muted-icon {
  color: var(--ink-3);
}
</style>
