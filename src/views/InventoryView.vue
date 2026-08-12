<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatError } from '@/utils/formatError'
import AppTopbar from '@/components/shell/AppTopbar.vue'
import Icon from '@/components/icons/Icon.vue'
import InvRow from '@/components/inventory/InvRow.vue'
import InventoryItemModal, { type ModalInitial } from '@/components/inventory/InventoryItemModal.vue'
import { useInventory } from '@/composable/useInventory'
import { useRooms } from '@/composable/useRooms'
import { useAuthStore } from '@/stores/auth'
import { usePropertiesStore } from '@/stores/properties'
import type { InventoryItem, InvState } from '@/api/inventory'
import { ROOM_FALLBACK_ICON } from '@/utils/roomMeta'
import { STATE_FILTERS } from '@/utils/inventoryState'

// Sentinelle du groupe « Sans pièce » : un article peut n'en avoir aucune, et
// il doit rester visible — sinon ceux créés par un client pas encore à jour, ou
// dont la pièce a été supprimée, disparaissent silencieusement.
const UNASSIGNED = '__none__'

type RoomFilter = 'all' | typeof UNASSIGNED | string // ou IRI de pièce
type StateFilter = InvState | 'all'

const inventory = useInventory()
const rooms = useRooms()
const auth = useAuthStore()
const properties = usePropertiesStore()

const isAdmin = computed(() => auth.user?.roles.includes('ROLE_ADMIN') ?? false)

const room = ref<RoomFilter>('all')
const state = ref<StateFilter>('all')
const query = ref('')
const actionError = ref<string | null>(null)

const modalOpen = ref(false)
const modalInitial = ref<ModalInitial | null>(null)

const initialState = computed(() => {
  // Loading global = les deux ressources en cours de chargement initial.
  if (inventory.state.value === 'loading' || rooms.state.value === 'loading') return 'loading'
  if (inventory.state.value === 'error') return 'error'
  if (rooms.state.value === 'error') return 'error'
  return 'ready'
})

const counts = computed(() => ({
  total: inventory.items.value.reduce((s, i) => s + i.quantity, 0),
  refs: inventory.items.value.length,
  ok: inventory.items.value.filter(i => i.state === 'ok').length,
  worn: inventory.items.value.filter(i => i.state === 'worn').length,
  replace: inventory.items.value.filter(i => i.state === 'replace').length,
}))

function matchesRoomFilter(item: InventoryItem) {
  if (room.value === 'all') return true
  if (room.value === UNASSIGNED) return item.room === null
  return item.room === room.value
}

const filtered = computed<InventoryItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  return inventory.items.value
    .filter(i =>
      matchesRoomFilter(i) &&
      (state.value === 'all' || i.state === state.value) &&
      (q === '' || `${i.name} ${i.location ?? ''} ${i.note ?? ''}`.toLowerCase().includes(q)),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
})

// Pièces visibles : celles qui ont des articles aujourd'hui (réactif) + celle
// actuellement sélectionnée si un filtre est actif.
const visibleRooms = computed(() => {
  const used = new Set(inventory.items.value.map(i => i.room))
  if (room.value !== 'all' && room.value !== UNASSIGNED) used.add(room.value)
  return rooms.items.value.filter(r => used.has(r['@id']))
})

const hasUnassigned = computed(() => inventory.items.value.some(i => i.room === null))

const roomsShownInList = computed(() =>
  room.value === 'all' || room.value === UNASSIGNED
    ? visibleRooms.value
    : visibleRooms.value.filter(r => r['@id'] === room.value),
)

const showUnassignedSection = computed(
  () => hasUnassigned.value && (room.value === 'all' || room.value === UNASSIGNED),
)

function itemsOfRoom(iri: string) {
  return filtered.value.filter(i => i.room === iri)
}

const unassignedItems = computed(() => filtered.value.filter(i => i.room === null))

async function onPatch(
  id: number,
  patch: Partial<Pick<InventoryItem, 'state' | 'quantity'>>,
) {
  actionError.value = null
  try {
    await inventory.patch(id, patch)
  } catch (err) {
    actionError.value = formatError(err)
  }
}

function onNew() {
  modalInitial.value = {
    mode: 'create',
    defaultRoom: room.value !== 'all' && room.value !== UNASSIGNED ? room.value : undefined,
  }
  modalOpen.value = true
}

function onEdit(item: InventoryItem) {
  modalInitial.value = { mode: 'edit', item }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  modalInitial.value = null
}

// `category` n'est plus envoyée : elle est dépréciée côté API (cf. API.md §4.3).
async function onSave(payload: {
  id: number | null
  name: string
  quantity: number
  state: InvState
  location: string | null
  note: string | null
  room: string | null
}) {
  actionError.value = null
  try {
    if (payload.id === null) {
      await inventory.create({
        name: payload.name,
        quantity: payload.quantity,
        state: payload.state,
        location: payload.location,
        note: payload.note,
        room: payload.room,
      })
    } else {
      await inventory.update(payload.id, {
        name: payload.name,
        quantity: payload.quantity,
        state: payload.state,
        location: payload.location,
        note: payload.note,
        room: payload.room,
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
    await inventory.remove(id)
    closeModal()
  } catch (err) {
    actionError.value = formatError(err)
  }
}
async function retryInitial() {
  await Promise.all([inventory.fetchAll(), rooms.fetchAll()])
}
</script>

<template>
  <AppTopbar eyebrow="Suivi d'inventaire" title="Inventaire">
    <div class="searchbox">
      <Icon name="search" :size="15" class="muted-icon" />
      <input
        v-model="query"
        type="search"
        placeholder="Rechercher un article, un lieu…"
        aria-label="Rechercher dans l'inventaire"
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
          à un logement pour voir l'inventaire.
        </p>
      </div>

      <div v-else-if="initialState === 'loading'" class="card pad-center">
        <p class="muted">Chargement…</p>
      </div>

      <div v-else-if="initialState === 'error'" class="card pad-center">
        <p class="error-msg">
          {{ inventory.errorMessage.value ?? rooms.errorMessage.value ?? 'Erreur de chargement.' }}
        </p>
        <button class="btn" @click="retryInitial">Réessayer</button>
      </div>

      <template v-else>
        <section class="inv-summary" aria-label="Résumé de l'inventaire">
          <div class="sumcard">
            <span class="sum-k mono">ARTICLES</span>
            <span class="sum-v num">{{ counts.total }}</span>
            <span class="sum-s muted">{{ counts.refs }} références</span>
          </div>
          <div class="sumcard">
            <span class="sum-k mono ok-key">BON ÉTAT</span>
            <span class="sum-v num">{{ counts.ok }}</span>
            <span class="sum-s muted">références</span>
          </div>
          <div class="sumcard">
            <span class="sum-k mono worn-key">USÉ</span>
            <span class="sum-v num">{{ counts.worn }}</span>
            <span class="sum-s muted">à surveiller</span>
          </div>
          <div class="sumcard" :class="{ hot: counts.replace > 0 }">
            <span class="sum-k mono replace-key">À REMPLACER</span>
            <span class="sum-v num">{{ counts.replace }}</span>
            <span class="sum-s muted">
              {{ counts.replace > 0 ? 'action requise' : 'rien à signaler' }}
            </span>
          </div>
        </section>

        <div v-if="actionError" class="action-error">
          <Icon name="alert" :size="15" />
          {{ actionError }}
        </div>

        <div class="filt-bar">
          <div class="chips" role="tablist" aria-label="Filtrer par pièce">
            <button
              class="chip"
              :class="{ on: room === 'all' }"
              role="tab"
              :aria-selected="room === 'all'"
              @click="room = 'all'"
            >
              Tout
            </button>
            <button
              v-for="r in visibleRooms"
              :key="r['@id']"
              class="chip"
              :class="{ on: room === r['@id'] }"
              role="tab"
              :aria-selected="room === r['@id']"
              @click="room = r['@id']"
            >
              <Icon :name="r.icon" :size="14" />{{ r.name }}
            </button>
            <button
              v-if="hasUnassigned"
              class="chip"
              :class="{ on: room === UNASSIGNED }"
              role="tab"
              :aria-selected="room === UNASSIGNED"
              @click="room = UNASSIGNED"
            >
              <Icon :name="ROOM_FALLBACK_ICON" :size="14" />Sans pièce
            </button>
          </div>
          <div class="seg push-right" aria-label="Filtrer par état">
            <button
              v-for="[value, label] in STATE_FILTERS"
              :key="value"
              :class="{ on: state === value }"
              @click="state = value"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <template v-for="r in roomsShownInList" :key="r['@id']">
          <section v-if="itemsOfRoom(r['@id']).length" class="inv-cat">
            <header class="inv-cat-head">
              <Icon :name="r.icon" :size="17" />
              <h3>{{ r.name }}</h3>
              <span class="mono muted cat-count">
                {{ itemsOfRoom(r['@id']).length }} réf.
              </span>
            </header>
            <div class="inv-cat-body card">
              <InvRow
                v-for="it in itemsOfRoom(r['@id'])"
                :key="it.id"
                :item="it"
                @patch="onPatch"
                @edit="onEdit"
              />
            </div>
          </section>
        </template>

        <!-- Toujours en dernier : ces articles attendent d'être rangés. -->
        <section v-if="showUnassignedSection && unassignedItems.length" class="inv-cat">
          <header class="inv-cat-head">
            <Icon :name="ROOM_FALLBACK_ICON" :size="17" />
            <h3>Sans pièce</h3>
            <span class="mono muted cat-count">{{ unassignedItems.length }} réf.</span>
          </header>
          <div class="inv-cat-body card">
            <InvRow
              v-for="it in unassignedItems"
              :key="it.id"
              :item="it"
              @patch="onPatch"
              @edit="onEdit"
            />
          </div>
        </section>

        <div v-if="!filtered.length" class="empty">
          <Icon name="search" :size="26" class="muted-icon" />
          <p>Aucun article ne correspond.</p>
        </div>
      </template>
    </div>
  </div>

  <InventoryItemModal
      :open="modalOpen"
      :initial="modalInitial"
      :rooms="rooms.items.value"
      :can-delete="isAdmin && modalInitial?.mode === 'edit'"
      @close="closeModal"
      @save="onSave"
      @remove="onRemove"
  />
</template>

<style scoped>
.muted-icon {
  color: var(--ink-3);
}
.ok-key {
  color: var(--ok);
}
.worn-key {
  color: var(--worn);
}
.replace-key {
  color: var(--replace);
}
.push-right {
  margin-left: auto;
}
.cat-count {
  margin-left: auto;
  font-size: 11.5px;
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
</style>
