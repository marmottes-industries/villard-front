<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  imageSrc,
  type ImageRef,
} from '@/api/images'

/*
 * Édition des photos d'une note ou de travaux, sans rien envoyer : les ajouts
 * et retraits restent en attente dans les deux v-model jusqu'à l'enregistrement
 * de la modale. Annuler ne laisse donc aucun fichier orphelin sur le serveur.
 */
const props = defineProps<{
  existing: ImageRef[]
  disabled?: boolean
}>()

const newFiles = defineModel<File[]>('newFiles', { required: true })
const removedIds = defineModel<number[]>('removedIds', { required: true })

const input = ref<HTMLInputElement | null>(null)
const localError = ref<string | null>(null)

const kept = computed(() => props.existing.filter(i => !removedIds.value.includes(i.id)))
const count = computed(() => kept.value.length + newFiles.value.length)
const remaining = computed(() => MAX_IMAGES - count.value)

// Aperçus locaux des fichiers en attente, libérés dès qu'ils ne servent plus.
const previews = shallowRef(new Map<File, string>())

watch(newFiles, (files) => {
  const next = new Map<File, string>()
  for (const file of files) {
    next.set(file, previews.value.get(file) ?? URL.createObjectURL(file))
  }
  for (const [file, url] of previews.value) {
    if (!next.has(file)) URL.revokeObjectURL(url)
  }
  previews.value = next
}, { immediate: true })

onBeforeUnmount(() => {
  previews.value.forEach(url => URL.revokeObjectURL(url))
})

function onPick(event: Event) {
  const target = event.target as HTMLInputElement
  const picked = Array.from(target.files ?? [])
  // Réinitialise le champ : sinon re-choisir le même fichier ne déclenche rien.
  target.value = ''
  localError.value = null

  const accepted: File[] = []
  for (const file of picked) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      localError.value = `« ${file.name} » : format non supporté (JPEG, PNG ou WebP).`
      continue
    }
    if (file.size > MAX_IMAGE_BYTES) {
      localError.value = `« ${file.name} » : 15 Mo maximum.`
      continue
    }
    accepted.push(file)
  }

  if (accepted.length > remaining.value) {
    localError.value = `${MAX_IMAGES} photos maximum : seules les premières ont été ajoutées.`
  }

  newFiles.value = [...newFiles.value, ...accepted.slice(0, Math.max(0, remaining.value))]
}

function removeExisting(id: number) {
  removedIds.value = [...removedIds.value, id]
  localError.value = null
}

function removePending(file: File) {
  newFiles.value = newFiles.value.filter(f => f !== file)
  localError.value = null
}
</script>

<template>
  <div class="img-att">
    <div v-if="count" class="img-grid">
      <div v-for="image in kept" :key="image.id" class="img-tile">
        <a :href="imageSrc(image)" target="_blank" rel="noopener" title="Ouvrir la photo">
          <img :src="imageSrc(image)" alt="" loading="lazy" />
        </a>
        <button
          type="button"
          class="img-remove"
          aria-label="Retirer la photo"
          :disabled="disabled"
          @click="removeExisting(image.id)"
        >
          <Icon name="x" :size="13" />
        </button>
      </div>

      <div
        v-for="(file, index) in newFiles"
        :key="`${file.name}-${file.lastModified}-${index}`"
        class="img-tile pending"
      >
        <img :src="previews.get(file)" alt="" />
        <span class="img-badge">Nouvelle</span>
        <button
          type="button"
          class="img-remove"
          aria-label="Retirer la photo"
          :disabled="disabled"
          @click="removePending(file)"
        >
          <Icon name="x" :size="13" />
        </button>
      </div>
    </div>

    <div class="img-actions">
      <button
        type="button"
        class="btn"
        :disabled="disabled || remaining <= 0"
        @click="input?.click()"
      >
        <Icon name="image" :size="16" />
        Ajouter des photos
      </button>
      <span class="muted img-count">{{ count }} / {{ MAX_IMAGES }}</span>
      <input
        ref="input"
        type="file"
        :accept="ACCEPTED_IMAGE_TYPES.join(',')"
        multiple
        hidden
        @change="onPick"
      />
    </div>

    <p v-if="localError" class="img-err">
      <Icon name="alert" :size="14" />
      {{ localError }}
    </p>
  </div>
</template>

<style scoped>
.img-att {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.img-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 8px;
}
.img-tile {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--card-3);
  border: 1px solid var(--line);
}
.img-tile a,
.img-tile img {
  display: block;
  width: 100%;
  height: 100%;
}
.img-tile img {
  object-fit: cover;
}
.img-tile.pending {
  border-style: dashed;
  border-color: var(--line-3);
}
.img-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: rgba(27, 39, 31, 0.72);
  color: #fff;
  cursor: pointer;
}
.img-remove:hover {
  background: var(--replace);
}
.img-remove:disabled {
  cursor: default;
  opacity: 0.5;
}
.img-badge {
  position: absolute;
  left: 4px;
  bottom: 4px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 10.5px;
  font-weight: 600;
}
.img-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.img-count {
  font-size: 12.5px;
}
.img-err {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  color: var(--replace);
}
</style>
