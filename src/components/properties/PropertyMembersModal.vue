<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { formatError } from '@/utils/formatError'
import { propertyMembersApi, type PropertyMember } from '@/api/propertyMembers'
import type { Property, PropertyRole } from '@/api/properties'
import { useUsers } from '@/composable/useUsers'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

const ROLE_LABELS: Record<PropertyRole, string> = {
  manager: 'Gestionnaire',
  occupant: 'Occupant',
}

const props = defineProps<{
  open: boolean
  property: Property | null
  // Seul un gestionnaire du logement (ou un admin) peut modifier les appartenances.
  canManage: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const users = useUsers()

const members = ref<PropertyMember[]>([])
const state = ref<AsyncState>('idle')
const errorMessage = ref<string | null>(null)
const actionError = ref<string | null>(null)
const busy = ref(false)

const newUserIri = ref('')
const newRole = ref<PropertyRole>('occupant')

const memberUserIris = computed(() => new Set(members.value.map(m => m.user)))
const addableUsers = computed(() => users.items.value.filter(u => !memberUserIris.value.has(u.iri)))

function resolveUser(iri: string) {
  return users.resolve(iri) ?? users.fallback(iri)
}

async function fetchMembers() {
  const property = props.property
  if (!property) return
  state.value = 'loading'
  errorMessage.value = null
  try {
    const { data } = await propertyMembersApi.list(property['@id'])
    members.value = data
    state.value = 'success'
  } catch (err) {
    state.value = 'error'
    errorMessage.value = formatError(err)
  }
}

watch(() => [props.open, props.property?.id], () => {
  if (!props.open) return
  actionError.value = null
  busy.value = false
  newUserIri.value = ''
  newRole.value = 'occupant'
  members.value = []
  void fetchMembers()
}, { immediate: true })

async function onAdd() {
  const property = props.property
  if (!property || !newUserIri.value) return
  actionError.value = null
  busy.value = true
  try {
    const { data } = await propertyMembersApi.create({
      property: property['@id'],
      user: newUserIri.value,
      role: newRole.value,
    })
    members.value = [...members.value, data]
    newUserIri.value = ''
    newRole.value = 'occupant'
  } catch (err) {
    actionError.value = formatError(err)
  } finally {
    busy.value = false
  }
}

async function onChangeRole(member: PropertyMember, role: PropertyRole) {
  if (member.role === role) return
  actionError.value = null
  busy.value = true
  try {
    const { data } = await propertyMembersApi.update(member.id, { role })
    members.value = members.value.map(m => (m.id === member.id ? data : m))
  } catch (err) {
    actionError.value = formatError(err)
  } finally {
    busy.value = false
  }
}

async function onRemove(member: PropertyMember) {
  actionError.value = null
  busy.value = true
  try {
    await propertyMembersApi.remove(member.id)
    members.value = members.value.filter(m => m.id !== member.id)
  } catch (err) {
    actionError.value = formatError(err)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="open && property" class="modal-scrim" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-head">
        <div>
          <div class="eyebrow">Membres du logement</div>
          <h2 class="modal-title">{{ property.name }}</h2>
        </div>
        <button class="btn icon ghost" aria-label="Fermer" @click="emit('close')">
          <Icon name="x" :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <p v-if="state === 'loading'" class="muted">Chargement…</p>

        <div v-else-if="state === 'error'" class="modal-err">
          <Icon name="alert" :size="15" />
          {{ errorMessage }}
        </div>

        <template v-else>
          <div v-if="members.length" class="mbr-list">
            <div v-for="m in members" :key="m.id" class="mbr-row">
              <span class="mbr-avatar" :style="{ background: resolveUser(m.user).bg, color: resolveUser(m.user).color }">
                {{ resolveUser(m.user).short }}
              </span>
              <span class="mbr-name">{{ resolveUser(m.user).username }}</span>

              <select
                v-if="canManage"
                class="fld mbr-role"
                :value="m.role"
                :disabled="busy"
                @change="onChangeRole(m, ($event.target as HTMLSelectElement).value as PropertyRole)"
              >
                <option value="manager">Gestionnaire</option>
                <option value="occupant">Occupant</option>
              </select>
              <span v-else class="tag">{{ ROLE_LABELS[m.role] }}</span>

              <button
                v-if="canManage"
                class="btn icon sm"
                aria-label="Retirer le membre"
                :disabled="busy"
                @click="onRemove(m)"
              >
                <Icon name="trash" :size="15" />
              </button>
            </div>
          </div>

          <p v-else class="muted">Aucun membre rattaché à ce logement.</p>

          <template v-if="canManage">
            <div class="fld-sec">Ajouter un membre</div>
            <div class="mbr-add">
              <select v-model="newUserIri" class="fld" :disabled="busy">
                <option value="">Choisir un utilisateur…</option>
                <option v-for="u in addableUsers" :key="u.iri" :value="u.iri">
                  {{ u.username }}
                </option>
              </select>
              <select v-model="newRole" class="fld" :disabled="busy">
                <option value="occupant">Occupant</option>
                <option value="manager">Gestionnaire</option>
              </select>
              <button class="btn primary" :disabled="busy || !newUserIri" @click="onAdd">
                <Icon name="plus" :size="16" />
                Ajouter
              </button>
            </div>
          </template>

          <div v-if="actionError" class="modal-err">
            <Icon name="alert" :size="15" />
            {{ actionError }}
          </div>
        </template>
      </div>

      <div class="modal-foot">
        <button class="btn" @click="emit('close')">Fermer</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mbr-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.mbr-row {
  display: grid;
  grid-template-columns: 30px 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--line);
}
.mbr-row:last-child {
  border-bottom: 0;
}
.mbr-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
}
.mbr-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mbr-role {
  width: auto;
  padding: 6px 9px;
  font-size: 13px;
}
.fld-sec {
  margin-top: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
}
.mbr-add {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: center;
}
</style>
