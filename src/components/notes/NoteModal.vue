<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import ImageAttachments from '@/components/images/ImageAttachments.vue'
import type { Note } from '@/api/notes'
import type { ImageChanges } from '@/api/images'

export type ModalInitial =
  | { mode: 'create' }
  | { mode: 'edit'; note: Note }

/*
 * L'état d'envoi et l'erreur serveur viennent du parent, seul à savoir quand
 * la requête se termine. Un `saving` interne restait bloqué à `true` après un
 * échec : la modale affichait « Enregistrement… » sans jamais rendre la main.
 */
const props = defineProps<{
  open: boolean
  initial: ModalInitial | null
  canDelete: boolean
  submitting?: boolean
  saveError?: string | null
}>()

export type NoteSavePayload = {
  id: number | null
  title: string
  content: string
  images: ImageChanges
}

const emit = defineEmits<{
  close: []
  save: [payload: NoteSavePayload]
  remove: [id: number]
}>()

const title = ref('')
const content = ref('')
const newFiles = ref<File[]>([])
const removedImageIds = ref<number[]>([])
// Erreurs de saisie locales ; celles du serveur arrivent par `saveError`.
const errorMessage = ref<string | null>(null)
const saving = computed(() => props.submitting ?? false)
const displayedError = computed(() => errorMessage.value ?? props.saveError ?? null)

const isEditing = computed(() => props.initial?.mode === 'edit')
const editingId = computed(() =>
  props.initial?.mode === 'edit' ? props.initial.note.id : null,
)
const existingImages = computed(() =>
  props.initial?.mode === 'edit' ? props.initial.note.images : [],
)

watch(() => props.open, (open) => {
  if (!open) return
  errorMessage.value = null
  newFiles.value = []
  removedImageIds.value = []
  const init = props.initial
  if (!init) return
  if (init.mode === 'edit') {
    title.value = init.note.title
    content.value = init.note.content
  } else {
    title.value = ''
    content.value = ''
  }
}, { immediate: true })

function onSave() {
  errorMessage.value = null
  if (!title.value.trim()) {
    errorMessage.value = 'Renseigne un titre.'
    return
  }
  if (!content.value.trim()) {
    errorMessage.value = 'Renseigne un contenu.'
    return
  }
  emit('save', {
    id: editingId.value,
    title: title.value.trim(),
    content: content.value.trim(),
    images: { newFiles: newFiles.value, removedImageIds: removedImageIds.value },
  })
}

function onDelete() {
  if (editingId.value !== null) emit('remove', editingId.value)
}
</script>

<template>
  <div v-if="open" class="modal-scrim" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-head">
        <div>
          <div class="eyebrow">{{ isEditing ? 'Modifier la note' : 'Nouvelle note' }}</div>
          <h2 class="modal-title">
            {{ isEditing ? title || 'Note' : 'Ajouter une note' }}
          </h2>
        </div>
        <button class="btn icon ghost" @click="emit('close')" aria-label="Fermer">
          <Icon name="x" :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <label class="fld-label" for="note-title">Titre</label>
        <input
          id="note-title"
          class="fld"
          v-model="title"
          placeholder="Ex. Code Wifi, Boulangerie…"
          autocomplete="off"
          maxlength="120"
        />

        <label class="fld-label" for="note-content">Contenu</label>
        <textarea
          id="note-content"
          class="fld note-area"
          v-model="content"
          placeholder="Décris l'info utile pour les autres marmottes…"
          rows="6"
        />

        <label class="fld-label">
          Photos <span class="muted optional">· optionnel</span>
        </label>
        <ImageAttachments
          v-model:new-files="newFiles"
          v-model:removed-ids="removedImageIds"
          :existing="existingImages"
          :disabled="saving"
        />

        <div v-if="displayedError" class="modal-err">
          <Icon name="alert" :size="15" />
          {{ displayedError }}
        </div>
      </div>

      <div class="modal-foot">
        <button
          v-if="isEditing && canDelete"
          class="btn ghost danger"
          :disabled="saving"
          @click="onDelete"
        >
          <Icon name="trash" :size="16" />
          Supprimer
        </button>
        <button class="btn" @click="emit('close')" :disabled="saving">Annuler</button>
        <button class="btn primary" @click="onSave" :disabled="saving">
          <Icon name="check" :size="16" />
          {{ saving ? 'Enregistrement…' : (isEditing ? 'Enregistrer' : 'Ajouter') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-title {
  font-size: 21px;
  margin-top: 4px;
}
.note-area {
  font-family: var(--sans);
  line-height: 1.45;
  min-height: 120px;
}
.optional {
  font-weight: 400;
}
.danger {
  color: var(--replace);
  margin-right: auto;
}
.danger:hover {
  background: var(--replace-bg);
}
</style>
