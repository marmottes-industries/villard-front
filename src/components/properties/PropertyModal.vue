<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import type { Property, PropertyCreatePayload } from '@/api/properties'

export type ModalInitial =
  | { mode: 'create' }
  | { mode: 'edit'; property: Property }

const props = defineProps<{
  open: boolean
  initial: ModalInitial | null
  canDelete: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: { id: number | null; values: PropertyCreatePayload }]
  remove: [id: number]
}>()

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

const name = ref('')
const slug = ref('')
const slugTouched = ref(false)
const city = ref('')
const address = ref('')
const latitude = ref('')
const longitude = ref('')
const timezone = ref('Europe/Paris')
const secondaryName = ref('')
const secondaryLatitude = ref('')
const secondaryLongitude = ref('')
const archived = ref(false)

const errorMessage = ref<string | null>(null)
const saving = ref(false)

const isEditing = computed(() => props.initial?.mode === 'edit')
const editingId = computed(() =>
  props.initial?.mode === 'edit' ? props.initial.property.id : null,
)

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Le slug est unique et contraint côté serveur : on le pré-remplit depuis le nom
// tant que l'utilisateur ne l'a pas édité lui-même.
watch(name, (value) => {
  if (!isEditing.value && !slugTouched.value) slug.value = slugify(value)
})

watch(() => props.open, (open) => {
  if (!open) return
  errorMessage.value = null
  saving.value = false
  slugTouched.value = false
  const init = props.initial
  if (!init) return
  if (init.mode === 'edit') {
    const p = init.property
    name.value = p.name
    slug.value = p.slug
    city.value = p.city
    address.value = p.address ?? ''
    latitude.value = String(p.latitude)
    longitude.value = String(p.longitude)
    timezone.value = p.timezone
    secondaryName.value = p.secondaryLocationName ?? ''
    secondaryLatitude.value = p.secondaryLatitude != null ? String(p.secondaryLatitude) : ''
    secondaryLongitude.value = p.secondaryLongitude != null ? String(p.secondaryLongitude) : ''
    archived.value = p.archived
  } else {
    name.value = ''
    slug.value = ''
    city.value = ''
    address.value = ''
    latitude.value = ''
    longitude.value = ''
    timezone.value = 'Europe/Paris'
    secondaryName.value = ''
    secondaryLatitude.value = ''
    secondaryLongitude.value = ''
    archived.value = false
  }
}, { immediate: true })

function parseCoord(value: string): number | null {
  const n = Number(value.trim().replace(',', '.'))
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

function onSave() {
  errorMessage.value = null

  if (!name.value.trim()) {
    errorMessage.value = 'Renseigne un nom.'
    return
  }
  if (!SLUG_PATTERN.test(slug.value.trim())) {
    errorMessage.value = 'Le slug doit être en minuscules, chiffres et tirets (ex. « les-marmottes »).'
    return
  }
  if (!city.value.trim()) {
    errorMessage.value = 'Renseigne une ville.'
    return
  }

  const lat = parseCoord(latitude.value)
  const lon = parseCoord(longitude.value)
  if (lat === null || lon === null) {
    errorMessage.value = 'Renseigne des coordonnées valides pour le logement.'
    return
  }

  // Les trois champs du point secondaire vont ensemble : sinon il n'est pas exploité.
  const secLat = parseCoord(secondaryLatitude.value)
  const secLon = parseCoord(secondaryLongitude.value)
  const secName = secondaryName.value.trim()
  const secFilled = [secName !== '', secLat !== null, secLon !== null]
  if (secFilled.some(Boolean) && !secFilled.every(Boolean)) {
    errorMessage.value = 'Point secondaire : renseigne le nom et les deux coordonnées, ou laisse les trois vides.'
    return
  }

  saving.value = true
  emit('save', {
    id: editingId.value,
    values: {
      name: name.value.trim(),
      slug: slug.value.trim(),
      city: city.value.trim(),
      address: address.value.trim() || null,
      latitude: lat,
      longitude: lon,
      timezone: timezone.value.trim() || 'Europe/Paris',
      secondaryLocationName: secName || null,
      secondaryLatitude: secLat,
      secondaryLongitude: secLon,
      archived: archived.value,
    },
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
          <div class="eyebrow">{{ isEditing ? 'Modifier le logement' : 'Nouveau logement' }}</div>
          <h2 class="modal-title">{{ isEditing ? name || 'Logement' : 'Ajouter un logement' }}</h2>
        </div>
        <button class="btn icon ghost" @click="emit('close')" aria-label="Fermer">
          <Icon name="x" :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <div class="fld-grid">
          <div>
            <label class="fld-label" for="prop-name">Nom</label>
            <input id="prop-name" v-model="name" class="fld" maxlength="255" autocomplete="off" />
          </div>
          <div>
            <label class="fld-label" for="prop-slug">Slug</label>
            <input
              id="prop-slug"
              v-model="slug"
              class="fld mono"
              maxlength="255"
              autocomplete="off"
              @input="slugTouched = true"
            />
          </div>
        </div>

        <div class="fld-grid">
          <div>
            <label class="fld-label" for="prop-city">Ville</label>
            <input id="prop-city" v-model="city" class="fld" maxlength="255" autocomplete="off" />
          </div>
          <div>
            <label class="fld-label" for="prop-tz">Fuseau horaire</label>
            <input id="prop-tz" v-model="timezone" class="fld mono" autocomplete="off" />
          </div>
        </div>

        <label class="fld-label" for="prop-address">Adresse (optionnel)</label>
        <input id="prop-address" v-model="address" class="fld" maxlength="255" autocomplete="off" />

        <div class="fld-sec">Point météo du logement</div>
        <div class="fld-grid">
          <div>
            <label class="fld-label" for="prop-lat">Latitude</label>
            <input id="prop-lat" v-model="latitude" class="fld mono" inputmode="decimal" />
          </div>
          <div>
            <label class="fld-label" for="prop-lon">Longitude</label>
            <input id="prop-lon" v-model="longitude" class="fld mono" inputmode="decimal" />
          </div>
        </div>

        <div class="fld-sec">
          Point secondaire (optionnel)
          <span class="muted">— typiquement un domaine d'altitude</span>
        </div>
        <label class="fld-label" for="prop-sec-name">Nom du point</label>
        <input id="prop-sec-name" v-model="secondaryName" class="fld" maxlength="255" autocomplete="off" />
        <div class="fld-grid">
          <div>
            <label class="fld-label" for="prop-sec-lat">Latitude</label>
            <input id="prop-sec-lat" v-model="secondaryLatitude" class="fld mono" inputmode="decimal" />
          </div>
          <div>
            <label class="fld-label" for="prop-sec-lon">Longitude</label>
            <input id="prop-sec-lon" v-model="secondaryLongitude" class="fld mono" inputmode="decimal" />
          </div>
        </div>

        <label class="prop-archived">
          <input v-model="archived" type="checkbox" />
          <span>
            Archivé
            <span class="muted">— le logement reste lisible mais disparaît du sélecteur</span>
          </span>
        </label>

        <div v-if="errorMessage" class="modal-err">
          <Icon name="alert" :size="15" />
          {{ errorMessage }}
        </div>
      </div>

      <div class="modal-foot">
        <button v-if="isEditing && canDelete" class="btn ghost danger" @click="onDelete">
          <Icon name="trash" :size="16" />
          Supprimer
        </button>
        <button class="btn" :disabled="saving" @click="emit('close')">Annuler</button>
        <button class="btn primary" :disabled="saving" @click="onSave">
          <Icon name="check" :size="16" />
          {{ saving ? 'Enregistrement…' : (isEditing ? 'Enregistrer' : 'Créer') }}
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
.fld-sec {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
}
.prop-archived {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 6px;
  font-size: 13px;
  cursor: pointer;
}
.prop-archived input {
  margin-top: 2px;
}
.danger {
  color: var(--replace);
  margin-right: auto;
}
.danger:hover {
  background: var(--replace-bg);
}
</style>
