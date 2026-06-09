<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import type {
  Work,
  WorkPriority,
  WorkStatus,
  WorkType,
} from '@/api/work'
import {
  PRIORITY_META,
  PRIORITY_OPTIONS,
  STATUS_META,
  STATUS_OPTIONS,
  TYPE_META,
  TYPE_OPTIONS,
} from '@/utils/workMeta'

export type ModalInitial =
  | { mode: 'create' }
  | { mode: 'edit'; work: Work }

export type WorkSavePayload = {
  id: number | null
  title: string
  description: string | null
  status: WorkStatus
  type: WorkType | null
  priority: WorkPriority | null
  scheduledFor: string | null
  estimatedCost: number | null
  actualCost: number | null
}

const props = defineProps<{
  open: boolean
  initial: ModalInitial | null
  canDelete: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: WorkSavePayload]
  remove: [id: number]
}>()

const title = ref('')
const description = ref('')
const status = ref<WorkStatus>('suggested')
const type = ref<WorkType | null>(null)
const priority = ref<WorkPriority | null>(null)
const scheduledFor = ref('')
const estimatedCost = ref<number | null>(null)
const actualCost = ref<number | null>(null)
const errorMessage = ref<string | null>(null)
const saving = ref(false)

const isEditing = computed(() => props.initial?.mode === 'edit')
const editingId = computed(() =>
  props.initial?.mode === 'edit' ? props.initial.work.id : null,
)

watch(() => props.open, (open) => {
  if (!open) return
  errorMessage.value = null
  saving.value = false
  const init = props.initial
  if (!init) return
  if (init.mode === 'edit') {
    const w = init.work
    title.value = w.title
    description.value = w.description ?? ''
    status.value = w.status
    type.value = w.type
    priority.value = w.priority
    scheduledFor.value = toDateInputValue(w.scheduledFor)
    estimatedCost.value = w.estimatedCost
    actualCost.value = w.actualCost
  } else {
    title.value = ''
    description.value = ''
    status.value = 'suggested'
    type.value = null
    priority.value = null
    scheduledFor.value = ''
    estimatedCost.value = null
    actualCost.value = null
  }
}, { immediate: true })

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function normalizeCost(value: number | null): number | null {
  if (value === null || value === undefined) return null
  if (!Number.isFinite(value)) return null
  return Math.round(value)
}

function onSave() {
  errorMessage.value = null
  if (!title.value.trim()) {
    errorMessage.value = 'Renseigne un titre.'
    return
  }
  saving.value = true
  emit('save', {
    id: editingId.value,
    title: title.value.trim(),
    description: description.value.trim() || null,
    status: status.value,
    type: type.value,
    priority: priority.value,
    scheduledFor: scheduledFor.value || null,
    estimatedCost: normalizeCost(estimatedCost.value),
    actualCost: normalizeCost(actualCost.value),
  })
}

function onDelete() {
  if (editingId.value !== null) emit('remove', editingId.value)
}

function toggleType(value: WorkType) {
  type.value = type.value === value ? null : value
}

function togglePriority(value: WorkPriority) {
  priority.value = priority.value === value ? null : value
}
</script>

<template>
  <div v-if="open" class="modal-scrim" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-head">
        <div>
          <div class="eyebrow">{{ isEditing ? 'Modifier le travail' : 'Nouveau travail' }}</div>
          <h2 class="modal-title">
            {{ isEditing ? title || 'Travail' : 'Ajouter un travail' }}
          </h2>
        </div>
        <button class="btn icon ghost" @click="emit('close')" aria-label="Fermer">
          <Icon name="x" :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <label class="fld-label" for="work-title">Titre</label>
        <input
          id="work-title"
          class="fld"
          v-model="title"
          placeholder="Ex. Repeindre les volets…"
          autocomplete="off"
          maxlength="255"
        />

        <label class="fld-label" for="work-desc">
          Description <span class="muted optional">· optionnel</span>
        </label>
        <textarea
          id="work-desc"
          class="fld work-area"
          v-model="description"
          placeholder="Détails, matériel, fournisseur envisagé…"
          rows="4"
        />

        <label class="fld-label">Statut</label>
        <div class="seg status-seg">
          <button
            v-for="s in STATUS_OPTIONS"
            :key="s"
            type="button"
            :class="{ on: status === s }"
            @click="status = s"
          >
            {{ STATUS_META[s].label }}
          </button>
        </div>

        <div class="fld-grid two">
          <div>
            <label class="fld-label">
              Type <span class="muted optional">· optionnel</span>
            </label>
            <div class="chips">
              <button
                v-for="t in TYPE_OPTIONS"
                :key="t"
                type="button"
                class="chip"
                :class="{ on: type === t }"
                @click="toggleType(t)"
              >
                <Icon :name="TYPE_META[t].icon" :size="14" />
                {{ TYPE_META[t].label }}
              </button>
            </div>
          </div>
          <div>
            <label class="fld-label">
              Priorité <span class="muted optional">· optionnel</span>
            </label>
            <div class="chips">
              <button
                v-for="p in PRIORITY_OPTIONS"
                :key="p"
                type="button"
                class="chip"
                :class="[{ on: priority === p }, `prio-${PRIORITY_META[p].tone}`]"
                @click="togglePriority(p)"
              >
                {{ PRIORITY_META[p].label }}
              </button>
            </div>
          </div>
        </div>

        <label class="fld-label" for="work-date">
          Date prévue <span class="muted optional">· optionnel</span>
        </label>
        <input
          id="work-date"
          class="fld"
          type="date"
          v-model="scheduledFor"
        />

        <div class="fld-grid two">
          <div>
            <label class="fld-label" for="work-est">
              Coût estimé <span class="muted optional">· €</span>
            </label>
            <input
              id="work-est"
              class="fld"
              type="number"
              inputmode="numeric"
              min="0"
              v-model.number="estimatedCost"
              placeholder="0"
            />
          </div>
          <div>
            <label class="fld-label" for="work-act">
              Coût réel <span class="muted optional">· €</span>
            </label>
            <input
              id="work-act"
              class="fld"
              type="number"
              inputmode="numeric"
              min="0"
              v-model.number="actualCost"
              placeholder="0"
            />
          </div>
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
.work-area {
  font-family: var(--sans);
  line-height: 1.45;
  min-height: 90px;
}
.fld-grid.two {
  grid-template-columns: 1fr 1fr;
  align-items: start;
}
.status-seg {
  width: 100%;
  flex-wrap: wrap;
}
.status-seg button {
  flex: 1 1 auto;
  justify-content: center;
}
.chip.prio-low.on { background: #e7ede4; color: #5b7a58; }
.chip.prio-medium.on { background: #f3ead7; color: #876a2f; }
.chip.prio-high.on { background: #f5dfd9; color: #8c3a2e; }
.optional { font-weight: 400; }
.danger {
  color: var(--replace);
  margin-right: auto;
}
.danger:hover { background: var(--replace-bg); }
</style>
