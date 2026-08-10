<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatError } from '@/utils/formatError'
import AppTopbar from '@/components/shell/AppTopbar.vue'
import Icon from '@/components/icons/Icon.vue'
import NoteCard from '@/components/notes/NoteCard.vue'
import NoteModal, { type ModalInitial } from '@/components/notes/NoteModal.vue'
import { useNotes } from '@/composable/useNotes'
import { useUsers } from '@/composable/useUsers'
import { useAuthStore } from '@/stores/auth'
import { usePropertiesStore } from '@/stores/properties'
import type { Note } from '@/api/notes'

const notes = useNotes()
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
const actionError = ref<string | null>(null)

const modalOpen = ref(false)
const modalInitial = ref<ModalInitial | null>(null)

const initialState = computed(() => {
  if (notes.state.value === 'loading' || users.state.value === 'loading') return 'loading'
  if (notes.state.value === 'error' || users.state.value === 'error') return 'error'
  return 'ready'
})

function resolveAuthor(iri: string) {
  return users.resolve(iri) ?? users.fallback(iri)
}

function canEditNote(note: Note) {
  if (isAdmin.value) return true
  return currentUserIri.value !== null && note.author === currentUserIri.value
}

const sorted = computed<Note[]>(() =>
  [...notes.items.value].sort((a, b) => {
    const da = new Date(a.createdAt).getTime()
    const db = new Date(b.createdAt).getTime()
    return db - da
  }),
)

const filtered = computed<Note[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return sorted.value
  return sorted.value.filter(n =>
    `${n.title} ${n.content}`.toLowerCase().includes(q),
  )
})

function onNew() {
  modalInitial.value = { mode: 'create' }
  modalOpen.value = true
}

function onEdit(note: Note) {
  modalInitial.value = { mode: 'edit', note }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  modalInitial.value = null
}

async function onSave(payload: { id: number | null; title: string; content: string }) {
  actionError.value = null
  try {
    if (payload.id === null) {
      await notes.create({ title: payload.title, content: payload.content })
    } else {
      await notes.update(payload.id, {
        title: payload.title,
        content: payload.content,
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
    await notes.remove(id)
    closeModal()
  } catch (err) {
    actionError.value = formatError(err)
  }
}
const canDeleteCurrent = computed(() => {
  const init = modalInitial.value
  if (!init || init.mode !== 'edit') return false
  return canEditNote(init.note)
})

async function retryInitial() {
  await Promise.all([notes.fetchAll(), users.fetchAll()])
}
</script>

<template>
  <AppTopbar eyebrow="Le chalet" title="Notes" sub="Infos pratiques du logement">
    <div class="searchbox">
      <Icon name="search" :size="15" class="muted-icon" />
      <input
        v-model="query"
        type="search"
        placeholder="Rechercher une note…"
        aria-label="Rechercher dans les notes"
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
          à un logement pour voir les notes.
        </p>
      </div>

      <div v-else-if="initialState === 'loading'" class="card pad-center">
        <p class="muted">Chargement…</p>
      </div>

      <div v-else-if="initialState === 'error'" class="card pad-center">
        <p class="error-msg">
          {{ notes.errorMessage.value ?? users.errorMessage.value ?? 'Erreur de chargement.' }}
        </p>
        <button class="btn" @click="retryInitial">Réessayer</button>
      </div>

      <template v-else>
        <div v-if="actionError" class="action-error">
          <Icon name="alert" :size="15" />
          {{ actionError }}
        </div>

        <div v-if="filtered.length" class="notes-grid">
          <NoteCard
            v-for="note in filtered"
            :key="note.id"
            :note="note"
            :author="resolveAuthor(note.author)"
            :can-edit="canEditNote(note)"
            @edit="onEdit"
          />
        </div>

        <div v-else class="empty">
          <Icon name="note" :size="26" class="muted-icon" />
          <p v-if="query">Aucune note ne correspond à « {{ query }} ».</p>
          <p v-else>Aucune note pour le moment. Ajoute la première !</p>
        </div>
      </template>
    </div>
  </div>

  <NoteModal
    :open="modalOpen"
    :initial="modalInitial"
    :can-delete="canDeleteCurrent"
    @close="closeModal"
    @save="onSave"
    @remove="onRemove"
  />
</template>

<style scoped>
.muted-icon {
  color: var(--ink-3);
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

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
</style>
