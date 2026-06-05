<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { dayDiff, parseISO } from '@/utils/dates'
import type { Occupation } from '@/api/occupation'
import type { DisplayUser } from '@/composable/useUsers'

export type ModalInitial =
  | { mode: 'create'; startDate: string; endDate: string; occupantIri: string }
  | { mode: 'edit'; occupation: Occupation }

const props = defineProps<{
  open: boolean
  initial: ModalInitial | null
  occupants: DisplayUser[]
  currentUserIri: string | null
  canDelete: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: {
    id: number | null
    startDate: string
    endDate: string
    notes: string
    occupant: string
  }]
  remove: [id: number]
}>()

const occupantIri = ref<string>('')
const startDate = ref('')
const endDate = ref('')
const notes = ref('')
const errorMessage = ref<string | null>(null)
const saving = ref(false)

const isEditing = computed(() => props.initial?.mode === 'edit')

const nightsCount = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const s = parseISO(startDate.value)
  const e = parseISO(endDate.value)
  if (e <= s) return 0
  return dayDiff(s, e)
})

const selectedOccupant = computed(() =>
  props.occupants.find(o => o.iri === occupantIri.value) ?? null
)

watch(() => props.open, (open) => {
  if (!open) return
  errorMessage.value = null
  saving.value = false
  const init = props.initial
  if (!init) return
  if (init.mode === 'edit') {
    occupantIri.value = init.occupation.occupant
    startDate.value = init.occupation.startDate
    endDate.value = init.occupation.endDate
    notes.value = init.occupation.notes ?? ''
  } else {
    occupantIri.value = init.occupantIri
    startDate.value = init.startDate
    endDate.value = init.endDate
    notes.value = ''
  }
}, { immediate: true })

function onSave() {
  errorMessage.value = null
  if (!startDate.value || !endDate.value) {
    errorMessage.value = 'Renseigne les dates.'
    return
  }
  if (parseISO(endDate.value) <= parseISO(startDate.value)) {
    errorMessage.value = 'Le départ doit être après l\'arrivée.'
    return
  }
  if (!occupantIri.value) {
    errorMessage.value = 'Choisis un occupant.'
    return
  }
  saving.value = true
  emit('save', {
    id: isEditing.value ? (props.initial as { mode: 'edit'; occupation: Occupation }).occupation.id : null,
    startDate: startDate.value,
    endDate: endDate.value,
    notes: notes.value,
    occupant: occupantIri.value,
  })
}

function onDelete() {
  if (!isEditing.value) return
  const id = (props.initial as { mode: 'edit'; occupation: Occupation }).occupation.id
  emit('remove', id)
}
</script>

<template>
  <div v-if="open" class="modal-scrim" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-head">
        <div>
          <div class="eyebrow">{{ isEditing ? 'Modifier le séjour' : 'Nouveau séjour' }}</div>
          <h2 class="modal-title">
            {{ isEditing ? "Détails de l'occupation" : "Réserver l'appartement" }}
          </h2>
        </div>
        <button class="btn icon ghost" @click="emit('close')">
          <Icon name="x" :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <label class="fld-label">Qui occupe&nbsp;?</label>
        <div class="occ-pick">
          <button
            v-for="o in occupants"
            :key="o.iri"
            type="button"
            class="occ-opt"
            :class="{ on: occupantIri === o.iri }"
            :style="occupantIri === o.iri ? { color: o.color, borderColor: o.color, background: o.bg } : {}"
            @click="occupantIri = o.iri"
          >
            <span class="avatar" :style="{ background: o.color, width: '28px', height: '28px' }">
              {{ o.short }}
            </span>
            <div class="occ-opt-text">
              <div class="occ-opt-name">{{ o.username }}</div>
              <div v-if="o.iri === currentUserIri" class="muted occ-opt-role">moi</div>
            </div>
          </button>
        </div>

        <div class="fld-grid two">
          <div>
            <label class="fld-label" for="m-start">Arrivée</label>
            <input id="m-start" class="fld" type="date" v-model="startDate" />
          </div>
          <div>
            <label class="fld-label" for="m-end">Départ</label>
            <input id="m-end" class="fld" type="date" v-model="endDate" />
          </div>
        </div>

        <label class="fld-label" for="m-notes">
          Note <span class="muted" style="font-weight: 400">· motif, infos pratiques</span>
        </label>
        <textarea
          id="m-notes"
          class="fld"
          rows="2"
          v-model="notes"
          placeholder="Ex. semaine de ski, prêt aux amis…"
        />

        <div v-if="nightsCount > 0" class="modal-summary">
          <Icon name="clock" :size="15" />
          <span>
            <b class="num">{{ nightsCount }}</b> nuit{{ nightsCount > 1 ? 's' : '' }}
            <template v-if="selectedOccupant">
              · {{ selectedOccupant.username }}
            </template>
          </span>
        </div>

        <div v-if="errorMessage" class="modal-err">
          <Icon name="alert" :size="15" />
          {{ errorMessage }}
        </div>
      </div>

      <div class="modal-foot">
        <button
          v-if="isEditing && canDelete"
          class="btn ghost danger"
          @click="onDelete"
        >
          <Icon name="trash" :size="16" />
          Supprimer
        </button>
        <button class="btn" @click="emit('close')" :disabled="saving">Annuler</button>
        <button class="btn primary" @click="onSave" :disabled="saving">
          <Icon name="check" :size="16" />
          {{ saving ? 'Enregistrement…' : (isEditing ? 'Enregistrer' : 'Réserver') }}
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
.fld-grid.two {
  grid-template-columns: 1fr 1fr;
}
.occ-opt-text {
  text-align: left;
  line-height: 1.2;
}
.occ-opt-name {
  font-weight: 700;
  font-size: 13px;
}
.occ-opt-role {
  font-size: 11px;
}
.danger {
  color: var(--replace);
  margin-right: auto;
}
.danger:hover {
  background: var(--replace-bg);
}
</style>
