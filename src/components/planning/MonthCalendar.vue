<script setup lang="ts">
import { computed } from 'vue'
import {
  DOW,
  addDays,
  dayDiff,
  mondayOf,
  parseISO,
  sameDay,
  todayMidday,
} from '@/utils/dates'
import type { Occupation } from '@/api/occupation'
import type { DisplayUser } from '@/composable/useUsers'

const props = defineProps<{
  occupations: Occupation[]
  focus: Date
  resolveUser: (iri: string) => DisplayUser
}>()

const emit = defineEmits<{
  pickDay: [date: Date]
  openOccupation: [occupation: Occupation]
}>()

const MAX_LANES = 3
const TODAY = todayMidday()

interface Segment {
  occ: Occupation
  startCol: number
  span: number
  lane: number
  contL: boolean
  contR: boolean
}

const weeks = computed<Date[]>(() => {
  const monthStart = new Date(props.focus.getFullYear(), props.focus.getMonth(), 1, 12)
  const gridStart = mondayOf(monthStart)
  return Array.from({ length: 6 }, (_, w) => addDays(gridStart, w * 7))
})

function segmentsForWeek(weekStart: Date): Segment[] {
  const weekEnd = addDays(weekStart, 7)
  const overlap = props.occupations
    .filter(o => parseISO(o.startDate) < weekEnd && parseISO(o.endDate) > weekStart)
    .sort((a, b) => {
      const da = parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
      if (da !== 0) return da
      const lb = dayDiff(parseISO(b.startDate), parseISO(b.endDate))
      const la = dayDiff(parseISO(a.startDate), parseISO(a.endDate))
      return lb - la
    })

  const lanes: number[] = []
  return overlap.map(o => {
    const rawStart = parseISO(o.startDate)
    const rawEnd = parseISO(o.endDate)
    const s = rawStart < weekStart ? weekStart : rawStart
    const e = rawEnd > weekEnd ? weekEnd : rawEnd
    const startCol = dayDiff(weekStart, s)
    const span = Math.max(1, dayDiff(s, e))
    const contL = rawStart < weekStart
    const contR = rawEnd > weekEnd

    let lane = lanes.findIndex(end => end <= startCol)
    if (lane === -1) {
      lane = lanes.length
      lanes.push(0)
    }
    lanes[lane] = startCol + span
    return { occ: o, startCol, span, lane, contL, contR }
  })
}

function hiddenCountForWeek(segs: Segment[]): Record<number, number> {
  const hidden: Record<number, number> = {}
  for (const s of segs) {
    if (s.lane >= MAX_LANES) {
      for (let c = s.startCol; c < s.startCol + s.span; c++) {
        hidden[c] = (hidden[c] || 0) + 1
      }
    }
  }
  return hidden
}

function barStyle(s: Segment) {
  const u = props.resolveUser(s.occ.occupant)
  return {
    left: `calc(${(s.startCol / 7) * 100}% + 3px)`,
    width: `calc(${(s.span / 7) * 100}% - 6px)`,
    top: `calc(26px + ${s.lane} * 22px)`,
    background: u.bg,
    color: u.color,
    borderTopLeftRadius: s.contL ? 0 : '6px',
    borderBottomLeftRadius: s.contL ? 0 : '6px',
    borderTopRightRadius: s.contR ? 0 : '6px',
    borderBottomRightRadius: s.contR ? 0 : '6px',
    borderLeft: `3px solid ${u.color}`,
  }
}

function isOutside(day: Date): boolean {
  return day.getMonth() !== props.focus.getMonth()
}

function isToday(day: Date): boolean {
  return sameDay(day, TODAY)
}
</script>

<template>
  <div class="cal-month card">
    <div class="cal-dow">
      <div v-for="d in DOW" :key="d" class="cal-dow-cell">{{ d }}</div>
    </div>
    <div class="cal-grid">
      <div
        v-for="(ws, wi) in weeks"
        :key="wi"
        class="cal-week"
        :style="{ minHeight: 'var(--cell-h)' }"
      >
        <template v-for="ci in 7" :key="ci">
          <div
            class="cal-cell"
            :class="{
              out: isOutside(addDays(ws, ci - 1)),
              today: isToday(addDays(ws, ci - 1)),
            }"
            @click="emit('pickDay', addDays(ws, ci - 1))"
          >
            <span class="cal-daynum">{{ addDays(ws, ci - 1).getDate() }}</span>
            <span
              v-if="hiddenCountForWeek(segmentsForWeek(ws))[ci - 1]"
              class="cal-more"
            >+{{ hiddenCountForWeek(segmentsForWeek(ws))[ci - 1] }}</span>
          </div>
        </template>
        <div class="cal-bars">
          <button
            v-for="s in segmentsForWeek(ws).filter(s => s.lane < MAX_LANES)"
            :key="`${s.occ.id}-${wi}`"
            class="resbar"
            :style="barStyle(s)"
            @click.stop="emit('openOccupation', s.occ)"
          >
            <span class="resbar-name">
              {{ resolveUser(s.occ.occupant).username }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
