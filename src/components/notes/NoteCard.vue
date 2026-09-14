<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import ImageStrip from '@/components/images/ImageStrip.vue'
import type { Note } from '@/api/notes'
import type { DisplayUser } from '@/composable/useUsers'

const props = defineProps<{
  note: Note
  author: DisplayUser
  canEdit: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', note: Note): void
}>()

const dateLabel = computed(() => {
  const d = new Date(props.note.createdAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
})

function onClick() {
  if (props.canEdit) emit('edit', props.note)
}
</script>

<template>
  <article
    class="note-card"
    :class="{ clickable: canEdit }"
    :tabindex="canEdit ? 0 : -1"
    :role="canEdit ? 'button' : undefined"
    @click="onClick"
    @keydown.enter.prevent="onClick"
    @keydown.space.prevent="onClick"
  >
    <header class="note-head">
      <div
        class="note-avatar"
        :style="{ background: author.bg, color: author.color }"
        :title="author.username"
      >
        {{ author.short }}
      </div>
      <div class="note-meta">
        <h3 class="note-title">{{ note.title }}</h3>
        <div class="note-sub muted">
          <span>{{ author.username }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ dateLabel }}</span>
        </div>
      </div>
      <button
        v-if="canEdit"
        type="button"
        class="btn icon ghost note-edit"
        aria-label="Modifier la note"
        @click.stop="emit('edit', note)"
      >
        <Icon name="edit" :size="15" />
      </button>
    </header>
    <p class="note-content">{{ note.content }}</p>
    <ImageStrip :images="note.images" />
  </article>
</template>

<style scoped>
.note-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--sh-1);
  transition: border-color 0.14s, box-shadow 0.14s, transform 0.08s;
  text-align: left;
}
.note-card.clickable {
  cursor: pointer;
}
.note-card.clickable:hover {
  border-color: var(--line-3);
  box-shadow: var(--sh-2);
}
.note-card.clickable:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.note-head {
  display: flex;
  align-items: center;
  gap: 11px;
}
.note-avatar {
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
.note-meta {
  flex: 1;
  min-width: 0;
}
.note-title {
  font-family: var(--serif);
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
  line-height: 1.2;
}
.note-sub {
  font-size: 12px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.note-edit {
  flex-shrink: 0;
}

.note-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-2);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
