<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import type { Work } from '@/api/work'
import type { DisplayUser } from '@/composable/useUsers'
import { PRIORITY_META, STATUS_META, TYPE_META } from '@/utils/workMeta'

const props = defineProps<{
  work: Work
  author: DisplayUser
  canEdit: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', work: Work): void
}>()

const status = computed(() => STATUS_META[props.work.status])
const type = computed(() => (props.work.type ? TYPE_META[props.work.type] : null))
const priority = computed(() =>
  props.work.priority ? PRIORITY_META[props.work.priority] : null,
)

const scheduledLabel = computed(() => formatDate(props.work.scheduledFor))
const completedLabel = computed(() => formatDate(props.work.completedAt))
const createdLabel = computed(() => formatDate(props.work.createdAt))

function formatDate(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCost(value: number | null): string | null {
  if (value === null || value === undefined) return null
  return `${value} €`
}

const estimated = computed(() => formatCost(props.work.estimatedCost))
const actual = computed(() => formatCost(props.work.actualCost))

const hasDetails = computed(
  () =>
    !!scheduledLabel.value ||
    !!completedLabel.value ||
    estimated.value !== null ||
    actual.value !== null,
)

function onClick() {
  if (props.canEdit) emit('edit', props.work)
}
</script>

<template>
  <article
    class="work-card"
    :class="[`status-${status.tone}`, { clickable: canEdit }]"
    :tabindex="canEdit ? 0 : -1"
    :role="canEdit ? 'button' : undefined"
    @click="onClick"
    @keydown.enter.prevent="onClick"
    @keydown.space.prevent="onClick"
  >
    <header class="work-head">
      <div
        class="work-avatar"
        :style="{ background: author.bg, color: author.color }"
        :title="author.username"
      >
        {{ author.short }}
      </div>
      <div class="work-meta">
        <h3 class="work-title">{{ work.title }}</h3>
        <div class="work-sub muted">
          <span>{{ author.username }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ createdLabel }}</span>
        </div>
      </div>
      <button
        v-if="canEdit"
        type="button"
        class="btn icon ghost work-edit"
        aria-label="Modifier le travail"
        @click.stop="emit('edit', work)"
      >
        <Icon name="edit" :size="15" />
      </button>
    </header>

    <p v-if="work.description" class="work-content">{{ work.description }}</p>

    <div class="work-tags">
      <span class="tag" :class="`tone-${status.tone}`">
        <span class="dot" />
        {{ status.label }}
      </span>
      <span v-if="priority" class="tag" :class="`prio-${priority.tone}`">
        Priorité {{ priority.label.toLowerCase() }}
      </span>
      <span v-if="type" class="tag tag-type">
        <Icon :name="type.icon" :size="12" />
        {{ type.label }}
      </span>
    </div>

    <dl v-if="hasDetails" class="work-details">
      <div v-if="scheduledLabel" class="row">
        <dt><Icon name="calendar" :size="13" /> Prévu</dt>
        <dd>{{ scheduledLabel }}</dd>
      </div>
      <div v-if="completedLabel" class="row">
        <dt><Icon name="check" :size="13" /> Terminé</dt>
        <dd>{{ completedLabel }}</dd>
      </div>
      <div v-if="estimated || actual" class="row">
        <dt>Coût</dt>
        <dd>
          <span v-if="actual">{{ actual }}</span>
          <span v-else-if="estimated" class="muted">~ {{ estimated }}</span>
          <span v-if="actual && estimated" class="muted">&nbsp;(est. {{ estimated }})</span>
        </dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
.work-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--sh-1);
  border-left: 3px solid var(--line);
  transition: border-color 0.14s, box-shadow 0.14s;
  text-align: left;
}
.work-card.status-progress { border-left-color: var(--accent, #4a8c5a); }
.work-card.status-planned { border-left-color: #6a8aa8; }
.work-card.status-idea { border-left-color: var(--line-3); }
.work-card.status-done { border-left-color: #8aab87; opacity: 0.85; }
.work-card.status-cancelled { border-left-color: #b5b1aa; opacity: 0.7; }

.work-card.clickable { cursor: pointer; }
.work-card.clickable:hover {
  border-color: var(--line-3);
  box-shadow: var(--sh-2);
}
.work-card.clickable:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.work-head {
  display: flex;
  align-items: center;
  gap: 11px;
}
.work-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-family: var(--sans);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.4px;
  flex-shrink: 0;
}
.work-meta { flex: 1; min-width: 0; }
.work-title {
  font-family: var(--serif);
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
  line-height: 1.2;
}
.work-sub {
  font-size: 12px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.work-edit { flex-shrink: 0; }

.work-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-2);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.work-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  background: var(--p1-bg, #eef1ec);
  color: var(--ink-2);
  border: 1px solid transparent;
}
.tag .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.tag.tone-idea { color: #7a766e; background: #efece6; }
.tag.tone-planned { color: #3d6184; background: #e3edf5; }
.tag.tone-progress { color: #4a8c5a; background: #e4f0e6; }
.tag.tone-done { color: #5b7a58; background: #e7ede4; }
.tag.tone-cancelled { color: #8a847d; background: #ede9e3; }

.tag.prio-low { color: #5b7a58; background: #e7ede4; }
.tag.prio-medium { color: #876a2f; background: #f3ead7; }
.tag.prio-high { color: #8c3a2e; background: #f5dfd9; }

.tag.tag-type {
  background: #ecece8;
  color: var(--ink-2);
}

.work-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 2px 0 0;
  font-size: 12.5px;
  color: var(--ink-2);
}
.work-details .row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.work-details dt {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--ink-3);
  font-weight: 500;
}
.work-details dd {
  margin: 0;
  font-weight: 600;
}
</style>
