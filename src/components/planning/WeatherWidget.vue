<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { weatherMeta, aqiMeta } from '@/utils/weatherMeta'
import { DOW, fmtISO, parseISO, dowMon, todayMidday } from '@/utils/dates'
import type { Occupation } from '@/api/occupation'
import type { AirQuality, CurrentWeather, DailyForecast } from '@/api/weather'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

const props = defineProps<{
  // Weather state is owned by the parent so the modal can reuse it (single fetch).
  occupations: Occupation[]
  current: CurrentWeather | null
  daily: DailyForecast[]
  airQuality: AirQuality | null
  state: AsyncState
  errorMessage: string | null
}>()

const emit = defineEmits<{ retry: [] }>()

const todayISO = fmtISO(todayMidday())

const air = computed(() => aqiMeta(props.airQuality?.europeanAqi ?? null))

interface DayView {
  date: string
  dayLabel: string
  isToday: boolean
  isStay: boolean
  icon: string
  label: string
  tempMin: number
  tempMax: number
  precipitation: number
  snowfall: number
}

function isDuringStay(dateISO: string): boolean {
  // ISO 'YYYY-MM-DD' compares correctly as a string. Inclusive of arrival/departure day.
  return props.occupations.some(o => o.startDate <= dateISO && dateISO <= o.endDate)
}

const days = computed<DayView[]>(() => {
  return props.daily.map(d => {
    const meta = weatherMeta(d.weatherCode)
    const dt = parseISO(d.date)
    const isToday = d.date === todayISO
    return {
      date: d.date,
      dayLabel: isToday ? "Auj." : `${DOW[dowMon(dt)]} ${dt.getDate()}`,
      isToday,
      isStay: isDuringStay(d.date),
      icon: meta.icon,
      label: meta.label,
      tempMin: Math.round(d.tempMin),
      tempMax: Math.round(d.tempMax),
      precipitation: d.precipitation,
      snowfall: d.snowfall,
    }
  })
})
</script>

<template>
  <div class="card weather">
    <div v-if="state === 'loading'" class="weather-msg muted">Météo en cours…</div>

    <div v-else-if="state === 'error'" class="weather-msg">
      <span class="error-msg">{{ errorMessage }}</span>
      <button class="btn sm" @click="emit('retry')">Réessayer</button>
    </div>

    <template v-else-if="current">
      <div class="weather-head">
        <div class="now">
          <Icon :name="weatherMeta(current.weatherCode).icon" :size="40" class="now-icon" />
          <div class="now-temp">
            <span class="temp">{{ Math.round(current.temperature) }}°</span>
            <span class="muted small">Ressenti {{ Math.round(current.apparentTemperature) }}°</span>
          </div>
          <div class="now-meta">
            <div class="now-label">{{ weatherMeta(current.weatherCode).label }}</div>
            <div class="now-stats muted small">
              <span><Icon name="wind" :size="14" /> {{ Math.round(current.windSpeed) }} km/h</span>
              <span><Icon name="droplet" :size="14" /> {{ current.humidity }} %</span>
            </div>
          </div>
        </div>

        <div v-if="air" class="aqi" :style="{ '--aqi': air.color }">
          <span class="aqi-dot" />
          <span class="aqi-text">
            Air <b>{{ air.label }}</b>
          </span>
        </div>
      </div>

      <div class="forecast">
        <div
          v-for="d in days"
          :key="d.date"
          class="day"
          :class="{ today: d.isToday, stay: d.isStay }"
          :title="d.label"
        >
          <span class="day-dow">{{ d.dayLabel }}</span>
          <Icon :name="d.icon" :size="22" class="day-icon" />
          <span class="day-temps">
            <b>{{ d.tempMax }}°</b><span class="muted">{{ d.tempMin }}°</span>
          </span>
          <span v-if="d.snowfall > 0" class="day-extra snow">{{ d.snowfall }} cm</span>
          <span v-else-if="d.precipitation > 0" class="day-extra rain">{{ d.precipitation }} mm</span>
          <span v-else class="day-extra empty">·</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.weather {
  padding: 16px 18px;
  margin-bottom: 14px;
}
.weather-msg {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 14px;
}
.error-msg {
  color: var(--replace);
}

.weather-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.now {
  display: flex;
  align-items: center;
  gap: 14px;
}
.now-icon {
  color: var(--forest);
}
.now-temp {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.temp {
  font-size: 30px;
  font-weight: 700;
}
.small {
  font-size: 12px;
}
.now-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.now-label {
  font-weight: 600;
  font-size: 14px;
}
.now-stats {
  display: flex;
  gap: 12px;
}
.now-stats span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.aqi {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 11px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--aqi) 12%, transparent);
  font-size: 13px;
}
.aqi-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--aqi);
}
.aqi-text b {
  color: var(--aqi);
}

.forecast {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  overflow-x: auto;
  scrollbar-width: thin;
  scroll-snap-type: x proximity;
}
.day {
  flex: 0 0 auto;
  width: 62px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 4px;
  border-radius: 10px;
  text-align: center;
  scroll-snap-align: start;
}
.day.today {
  background: var(--sage-bg, color-mix(in srgb, var(--sage) 18%, transparent));
}
.day.stay {
  outline: 2px solid var(--forest);
  outline-offset: -2px;
}
.day-dow {
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
  color: var(--ink-3);
}
.day-icon {
  color: var(--forest);
}
.day-temps {
  font-size: 12px;
  display: flex;
  gap: 4px;
}
.day-extra {
  font-size: 10px;
  font-weight: 600;
}
.day-extra.rain {
  color: #3a7bd5;
}
.day-extra.snow {
  color: #6aa9d8;
}
.day-extra.empty {
  color: var(--line);
}
</style>
