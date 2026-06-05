<script setup lang="ts">
import { computed } from 'vue'
import {
  MONTHS,
  MONTHS_ABBR,
  fmtRange,
  nights,
  parseISO,
  todayMidday,
} from '@/utils/dates'
import type { Occupation } from '@/api/occupation'
import type { DisplayUser } from '@/composable/useUsers'

const props = defineProps<{
  occupations: Occupation[]
  resolveUser: (iri: string) => DisplayUser
}>()

const emit = defineEmits<{
  openOccupation: [occupation: Occupation]
}>()

const TODAY = todayMidday()

interface Group {
  key: string
  label: string
  items: Occupation[]
}

const groups = computed<Group[]>(() => {
  const sorted = [...props.occupations].sort(
    (a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
  )
  const map = new Map<string, Group>()
  for (const o of sorted) {
    const d = parseISO(o.startDate)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        items: [],
      })
    }
    map.get(key)!.items.push(o)
  }
  return Array.from(map.values())
})

function isPast(o: Occupation): boolean {
  return parseISO(o.endDate) <= TODAY
}

function isCurrent(o: Occupation): boolean {
  return parseISO(o.startDate) <= TODAY && parseISO(o.endDate) > TODAY
}

function startDay(o: Occupation): number {
  return parseISO(o.startDate).getDate()
}

function startMonth(o: Occupation): string {
  return MONTHS_ABBR[parseISO(o.startDate).getMonth()]
}

function nightsCount(o: Occupation): number {
  return nights(o.startDate, o.endDate)
}

function range(o: Occupation): string {
  return fmtRange(o.startDate, o.endDate)
}
</script>

<template>
  <div v-if="groups.length === 0" class="card empty">
    <p class="muted">Aucune occupation à afficher.</p>
  </div>

  <div v-else class="cal-list">
    <div v-for="g in groups" :key="g.key" class="list-group">
      <div class="list-month">
        <span>{{ g.label }}</span>
      </div>
      <div class="list-rows">
        <button
          v-for="o in g.items"
          :key="o.id"
          class="list-row card"
          :class="{ past: isPast(o) }"
          @click="emit('openOccupation', o)"
        >
          <div class="list-date">
            <span class="list-d">{{ startDay(o) }}</span>
            <span class="list-m">{{ startMonth(o) }}</span>
          </div>
          <div
            class="list-bar"
            :style="{ background: resolveUser(o.occupant).color }"
          />
          <span
            class="avatar"
            :style="{ background: resolveUser(o.occupant).color }"
          >{{ resolveUser(o.occupant).short }}</span>
          <div class="list-main">
            <div class="list-name">
              {{ resolveUser(o.occupant).username }}
              <span v-if="isCurrent(o)" class="now-pill">en cours</span>
            </div>
            <div v-if="o.notes" class="list-note">{{ o.notes }}</div>
          </div>
          <div class="list-meta">
            <span class="mono">{{ range(o) }}</span>
            <span class="muted">{{ nightsCount(o) }} nuit{{ nightsCount(o) > 1 ? 's' : '' }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty {
  padding: 48px;
  text-align: center;
}
.list-bar {
  width: 3px;
  align-self: stretch;
  border-radius: 3px;
}
.list-row {
  border-radius: var(--radius);
}
</style>
