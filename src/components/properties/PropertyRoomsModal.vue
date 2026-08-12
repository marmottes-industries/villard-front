<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { formatError } from '@/utils/formatError'
import { roomsApi, type Room, type RoomType } from '@/api/rooms'
import { ROOM_TYPE_META, ROOM_TYPE_OPTIONS, roomIcon } from '@/utils/roomMeta'
import type { Property } from '@/api/properties'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

const props = defineProps<{
  open: boolean
  property: Property | null
  // Contrairement aux autres ressources, toute écriture exige le gestionnaire.
  canManage: boolean
}>()

const emit = defineEmits<{ close: [] }>()

// Cette modale gère les pièces d'un logement quelconque, pas forcément l'actif :
// elle appelle donc l'API en direct, jamais `useRooms()`. Même choix que la
// modale des membres.
const rooms = ref<Room[]>([])
const state = ref<AsyncState>('idle')
const errorMessage = ref<string | null>(null)
const actionError = ref<string | null>(null)
const busy = ref(false)

const newName = ref('')
const newType = ref<RoomType | ''>('')

const sorted = computed(() =>
  [...rooms.value].sort(
    (a, b) => a.position - b.position || a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }),
  ),
)

async function fetchRooms() {
  const property = props.property
  if (!property) return
  state.value = 'loading'
  errorMessage.value = null
  try {
    const { data } = await roomsApi.list(property['@id'])
    rooms.value = data
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
  newName.value = ''
  newType.value = ''
  rooms.value = []
  void fetchRooms()
}, { immediate: true })

async function onAdd() {
  const property = props.property
  const name = newName.value.trim()
  if (!property || !name) return
  actionError.value = null
  busy.value = true
  try {
    const { data } = await roomsApi.create({
      name,
      type: newType.value || null,
      // La nouvelle pièce arrive en fin de liste, à charge de la remonter.
      position: sorted.value.length,
      property: property['@id'],
    })
    rooms.value = [...rooms.value, data]
    newName.value = ''
    newType.value = ''
  } catch (err) {
    actionError.value = formatError(err)
  } finally {
    busy.value = false
  }
}

async function onRename(room: Room, name: string) {
  const trimmed = name.trim()
  if (!trimmed || trimmed === room.name) return
  await patch(room, { name: trimmed })
}

async function onChangeType(room: Room, type: string) {
  // Le `''` du <select> doit repartir en `null`, pas en chaîne vide.
  await patch(room, { type: (type || null) as RoomType | null })
}

async function onMove(room: Room, direction: -1 | 1) {
  const list = sorted.value
  const index = list.findIndex(r => r.id === room.id)
  const neighbour = list[index + direction]
  if (!neighbour) return

  actionError.value = null
  busy.value = true
  try {
    // Les positions peuvent être égales (pièces créées par la reprise) : on
    // réécrit les deux depuis l'ordre affiché plutôt que de les échanger.
    const [a, b] = await Promise.all([
      roomsApi.update(room.id, { position: index + direction }),
      roomsApi.update(neighbour.id, { position: index }),
    ])
    rooms.value = rooms.value.map(r => (r.id === a.data.id ? a.data : r.id === b.data.id ? b.data : r))
  } catch (err) {
    actionError.value = formatError(err)
  } finally {
    busy.value = false
  }
}

async function patch(room: Room, payload: Parameters<typeof roomsApi.update>[1]) {
  actionError.value = null
  busy.value = true
  try {
    const { data } = await roomsApi.update(room.id, payload)
    rooms.value = rooms.value.map(r => (r.id === room.id ? data : r))
  } catch (err) {
    actionError.value = formatError(err)
    // Le champ affiche encore la valeur refusée : on recharge pour ne pas
    // laisser croire que l'écriture a abouti.
    void fetchRooms()
  } finally {
    busy.value = false
  }
}

async function onRemove(room: Room) {
  actionError.value = null
  busy.value = true
  try {
    await roomsApi.remove(room.id)
    rooms.value = rooms.value.filter(r => r.id !== room.id)
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
          <div class="eyebrow">Pièces du logement</div>
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
          <div v-if="sorted.length" class="room-list">
            <div v-for="(r, i) in sorted" :key="r.id" class="room-row">
              <Icon :name="roomIcon(r.type)" :size="17" class="room-ico" />

              <input
                v-if="canManage"
                class="fld room-name"
                :value="r.name"
                :disabled="busy"
                aria-label="Nom de la pièce"
                @change="onRename(r, ($event.target as HTMLInputElement).value)"
              />
              <span v-else class="room-name-ro">{{ r.name }}</span>

              <select
                v-if="canManage"
                class="fld room-type"
                :value="r.type ?? ''"
                :disabled="busy"
                aria-label="Type de pièce"
                @change="onChangeType(r, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">Sans type</option>
                <option v-for="t in ROOM_TYPE_OPTIONS" :key="t" :value="t">
                  {{ ROOM_TYPE_META[t].label }}
                </option>
              </select>
              <span v-else-if="r.type" class="tag">{{ ROOM_TYPE_META[r.type].label }}</span>
              <span v-else />

              <span v-if="canManage" class="room-move">
                <button
                  class="btn icon sm"
                  aria-label="Monter la pièce"
                  :disabled="busy || i === 0"
                  @click="onMove(r, -1)"
                >
                  <Icon name="chevD" :size="15" class="flip" />
                </button>
                <button
                  class="btn icon sm"
                  aria-label="Descendre la pièce"
                  :disabled="busy || i === sorted.length - 1"
                  @click="onMove(r, 1)"
                >
                  <Icon name="chevD" :size="15" />
                </button>
              </span>

              <button
                v-if="canManage"
                class="btn icon sm"
                aria-label="Supprimer la pièce"
                :disabled="busy"
                @click="onRemove(r)"
              >
                <Icon name="trash" :size="15" />
              </button>
            </div>
          </div>

          <p v-else class="muted">Aucune pièce définie pour ce logement.</p>

          <p v-if="canManage && sorted.length" class="room-hint muted">
            Supprimer une pièce ne supprime pas ce qu'elle contient : les articles et travaux
            rattachés restent dans le logement, sans pièce.
          </p>

          <template v-if="canManage">
            <div class="fld-sec">Ajouter une pièce</div>
            <div class="room-add">
              <input
                v-model="newName"
                class="fld"
                placeholder="Ex. Chambre 2, Cabane à skis…"
                :disabled="busy"
                @keyup.enter="onAdd"
              />
              <select v-model="newType" class="fld" :disabled="busy">
                <option value="">Sans type</option>
                <option v-for="t in ROOM_TYPE_OPTIONS" :key="t" :value="t">
                  {{ ROOM_TYPE_META[t].label }}
                </option>
              </select>
              <button class="btn primary" :disabled="busy || !newName.trim()" @click="onAdd">
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
.room-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.room-row {
  display: grid;
  grid-template-columns: 20px 1fr auto auto auto;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--line);
}
.room-row:last-child {
  border-bottom: 0;
}
.room-ico {
  color: var(--ink-2);
}
.room-name {
  padding: 6px 9px;
  font-size: 14px;
}
.room-name-ro {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.room-type {
  width: auto;
  padding: 6px 9px;
  font-size: 13px;
}
.room-move {
  display: inline-flex;
  gap: 4px;
}
.flip {
  transform: rotate(180deg);
}
.room-hint {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.4;
}
.fld-sec {
  margin-top: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
}
.room-add {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: center;
}
</style>
