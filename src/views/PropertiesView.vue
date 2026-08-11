<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AppTopbar from '@/components/shell/AppTopbar.vue'
import Icon from '@/components/icons/Icon.vue'
import PropertyModal, { type ModalInitial } from '@/components/properties/PropertyModal.vue'
import PropertyMembersModal from '@/components/properties/PropertyMembersModal.vue'
import { formatError } from '@/utils/formatError'
import { propertiesApi, type Property, type PropertyCreatePayload } from '@/api/properties'
import { usePropertiesStore } from '@/stores/properties'
import { useAuthStore } from '@/stores/auth'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

const propertiesStore = usePropertiesStore()
const auth = useAuthStore()
const { activeProperty } = storeToRefs(propertiesStore)

// La liste complète vient de /api/properties (archivés compris) : le store, lui,
// ne sert que le sélecteur et masque les archivés.
const items = ref<Property[]>([])
const state = ref<AsyncState>('idle')
const errorMessage = ref<string | null>(null)
const actionError = ref<string | null>(null)

const modalOpen = ref(false)
const modalInitial = ref<ModalInitial | null>(null)

const membersOpen = ref(false)
const membersProperty = ref<Property | null>(null)

// POST et DELETE sur un logement sont réservés à ROLE_ADMIN (cf. API.md §4.9).
const isAdmin = computed(() => auth.user?.roles.includes('ROLE_ADMIN') ?? false)

const sorted = computed(() =>
  [...items.value].sort((a, b) => {
    if (a.archived !== b.archived) return a.archived ? 1 : -1
    return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  }),
)

function canManage(property: Property): boolean {
  return propertiesStore.canManage(property['@id'])
}

async function fetchAll() {
  state.value = 'loading'
  errorMessage.value = null
  try {
    const { data } = await propertiesApi.list()
    items.value = data
    state.value = 'success'
  } catch (err) {
    state.value = 'error'
    errorMessage.value = formatError(err)
  }
}

function onNew() {
  modalInitial.value = { mode: 'create' }
  modalOpen.value = true
}

function onEdit(property: Property) {
  modalInitial.value = { mode: 'edit', property }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  modalInitial.value = null
}

function openMembers(property: Property) {
  membersProperty.value = property
  membersOpen.value = true
}

async function onSave(payload: { id: number | null; values: PropertyCreatePayload }) {
  actionError.value = null
  try {
    if (payload.id === null) {
      const { data } = await propertiesApi.create(payload.values)
      items.value = [...items.value, data]
    } else {
      const { data } = await propertiesApi.update(payload.id, payload.values)
      items.value = items.value.map(p => (p.id === payload.id ? data : p))
    }
    // /api/me porte les appartenances : on le rejoue pour que le sélecteur
    // reflète un renommage ou un archivage sans rechargement de page.
    await auth.fetchCurrentUser()
    closeModal()
  } catch (err) {
    actionError.value = formatError(err)
  }
}

async function onRemove(id: number) {
  actionError.value = null
  try {
    await propertiesApi.remove(id)
    items.value = items.value.filter(p => p.id !== id)
    await auth.fetchCurrentUser()
    closeModal()
  } catch (err) {
    // Supprimer un logement qui porte encore des données échoue sur la contrainte
    // de clé étrangère : on l'explique plutôt que de laisser un message générique.
    actionError.value = `${formatError(err)} Un logement qui porte encore des données ne peut pas être supprimé : archive-le.`
  }
}

onMounted(fetchAll)
</script>

<template>
  <AppTopbar
    eyebrow="Administration"
    title="Logements"
    sub="Logements, coordonnées météo et membres"
  >
    <button v-if="isAdmin" class="btn primary" @click="onNew">
      <Icon name="plus" :size="16" /><span class="btn-label">Nouveau logement</span>
    </button>
  </AppTopbar>

  <div class="content">
    <div class="content-inner view">
      <div v-if="state === 'loading'" class="card pad-center">
        <p class="muted">Chargement…</p>
      </div>

      <div v-else-if="state === 'error'" class="card pad-center">
        <p class="error-msg">{{ errorMessage }}</p>
        <button class="btn" @click="fetchAll">Réessayer</button>
      </div>

      <template v-else>
        <div v-if="actionError" class="action-error">
          <Icon name="alert" :size="15" />
          {{ actionError }}
        </div>

        <div v-if="sorted.length" class="prop-grid">
          <div
            v-for="p in sorted"
            :key="p.id"
            class="card prop-card"
            :class="{ archived: p.archived }"
          >
            <div class="prop-head">
              <span class="prop-accent" :style="{ background: p.accentHex }" aria-hidden="true" />
              <div class="prop-titles">
                <h3>{{ p.name }}</h3>
                <div class="eyebrow">{{ p.city }}</div>
              </div>
              <span v-if="p.id === activeProperty?.id" class="tag ok">Actif</span>
              <span v-else-if="p.archived" class="tag worn">Archivé</span>
            </div>

            <dl class="prop-meta mono">
              <div><dt>slug</dt><dd>{{ p.slug }}</dd></div>
              <div v-if="p.address"><dt>adresse</dt><dd>{{ p.address }}</dd></div>
              <div><dt>fuseau</dt><dd>{{ p.timezone }}</dd></div>
              <div>
                <dt>météo</dt>
                <dd>{{ p.latitude.toFixed(4) }}, {{ p.longitude.toFixed(4) }}</dd>
              </div>
              <div v-if="p.secondaryLocationName">
                <dt>2<sup>e</sup> point</dt>
                <dd>{{ p.secondaryLocationName }}</dd>
              </div>
            </dl>

            <div class="prop-actions">
              <button class="btn sm" @click="openMembers(p)">
                <Icon name="users" :size="15" />
                Membres
              </button>
              <button v-if="canManage(p)" class="btn sm" @click="onEdit(p)">
                <Icon name="edit" :size="15" />
                Modifier
              </button>
              <button
                v-if="!p.archived && p.id !== activeProperty?.id"
                class="btn sm"
                @click="propertiesStore.setActive(p.id)"
              >
                <Icon name="check" :size="15" />
                Activer
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty">
          <Icon name="pin" :size="26" class="muted-icon" />
          <p>Aucun logement ne vous est rattaché.</p>
        </div>
      </template>
    </div>
  </div>

  <PropertyModal
    :open="modalOpen"
    :initial="modalInitial"
    :can-delete="isAdmin"
    @close="closeModal"
    @save="onSave"
    @remove="onRemove"
  />

  <PropertyMembersModal
    :open="membersOpen"
    :property="membersProperty"
    :can-manage="membersProperty ? canManage(membersProperty) : false"
    @close="membersOpen = false"
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

.prop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.prop-card {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.prop-card.archived {
  opacity: 0.62;
}
.prop-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.prop-accent {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  margin-top: 6px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(27, 39, 31, 0.12);
}
/* `flex: 1` plutôt que le seul `space-between` du parent : sans lui, la pastille
   d'accent se retrouverait décollée du titre dès qu'aucune étiquette n'est là. */
.prop-titles {
  flex: 1;
  min-width: 0;
}
.prop-titles h3 {
  font-size: 18px;
  margin-bottom: 4px;
}
.prop-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11.5px;
  margin: 0;
}
.prop-meta > div {
  display: flex;
  gap: 8px;
}
.prop-meta dt {
  width: 68px;
  flex-shrink: 0;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 10px;
  padding-top: 1px;
}
.prop-meta dd {
  margin: 0;
  color: var(--ink-2);
  min-width: 0;
  overflow-wrap: anywhere;
}
.prop-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}
</style>
