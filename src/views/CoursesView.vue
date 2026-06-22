<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatError } from '@/utils/formatError'
import AppTopbar from '@/components/shell/AppTopbar.vue'
import Icon from '@/components/icons/Icon.vue'
import ShoppingRow from '@/components/shopping/ShoppingRow.vue'
import ShoppingItemModal, { type ModalInitial } from '@/components/shopping/ShoppingItemModal.vue'
import { useShopping } from '@/composable/useShopping'
import { useCategories } from '@/composable/useCategories'
import { useAuthStore } from '@/stores/auth'
import type { ShoppingItem } from '@/api/shopping'

type CatFilter = 'all' | string
type PurchaseFilter = 'all' | 'todo' | 'done'

const PURCHASE_FILTERS: Array<[PurchaseFilter, string]> = [
  ['todo', 'À acheter'],
  ['done', 'Achetés'],
  ['all', 'Tous'],
]

const shopping = useShopping()
const categories = useCategories()
const auth = useAuthStore()

const isAdmin = computed(() => auth.user?.roles.includes('ROLE_ADMIN') ?? false)

const cat = ref<CatFilter>('all')
const purchase = ref<PurchaseFilter>('todo')
const query = ref('')
const actionError = ref<string | null>(null)
const bulkBusy = ref(false)

const modalOpen = ref(false)
const modalInitial = ref<ModalInitial | null>(null)

const initialState = computed(() => {
  if (shopping.state.value === 'loading' || categories.state.value === 'loading') return 'loading'
  if (shopping.state.value === 'error' || categories.state.value === 'error') return 'error'
  return 'ready'
})

const counts = computed(() => {
  const items = shopping.items.value
  const todo = items.filter(i => !i.purchased)
  const done = items.filter(i => i.purchased)
  return {
    refs: items.length,
    todoRefs: todo.length,
    todoQty: todo.reduce((s, i) => s + i.quantity, 0),
    doneRefs: done.length,
  }
})

const filtered = computed<ShoppingItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  return shopping.items.value
    .filter(i =>
      (cat.value === 'all' || i.category === cat.value) &&
      (purchase.value === 'all'
        || (purchase.value === 'todo' && !i.purchased)
        || (purchase.value === 'done' && i.purchased)) &&
      (q === '' || i.name.toLowerCase().includes(q)),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
})

const visibleCategories = computed(() => {
  const used = new Set(shopping.items.value.map(i => i.category))
  if (cat.value !== 'all') used.add(cat.value)
  return categories.items.value.filter(c => used.has(c['@id']))
})

const categoriesShownInList = computed(() =>
  cat.value === 'all'
    ? visibleCategories.value
    : visibleCategories.value.filter(c => c['@id'] === cat.value),
)

function itemsOfCategory(iri: string) {
  return filtered.value.filter(i => i.category === iri)
}

const todoInView = computed(() => filtered.value.filter(i => !i.purchased))
const doneInView = computed(() => filtered.value.filter(i => i.purchased))

async function onPatch(
  id: number,
  patch: Partial<Pick<ShoppingItem, 'purchased' | 'quantity'>>,
) {
  actionError.value = null
  try {
    await shopping.patch(id, patch)
  } catch (err) {
    actionError.value = formatError(err)
  }
}

function onNew() {
  modalInitial.value = {
    mode: 'create',
    defaultCategory: cat.value !== 'all' ? cat.value : undefined,
  }
  modalOpen.value = true
}

function onEdit(item: ShoppingItem) {
  modalInitial.value = { mode: 'edit', item }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  modalInitial.value = null
}

async function onSave(payload: {
  id: number | null
  name: string
  quantity: number
  purchased: boolean
  category: string
}) {
  actionError.value = null
  try {
    if (payload.id === null) {
      await shopping.create({
        name: payload.name,
        quantity: payload.quantity,
        purchased: payload.purchased,
        category: payload.category,
      })
    } else {
      await shopping.update(payload.id, {
        name: payload.name,
        quantity: payload.quantity,
        purchased: payload.purchased,
        category: payload.category,
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
    await shopping.remove(id)
    closeModal()
  } catch (err) {
    actionError.value = formatError(err)
  }
}

async function markAllPurchased() {
  if (!todoInView.value.length) return
  actionError.value = null
  bulkBusy.value = true
  const results = await Promise.allSettled(
    todoInView.value.map(i => shopping.patch(i.id, { purchased: true })),
  )
  bulkBusy.value = false
  if (results.some(r => r.status === 'rejected')) {
    actionError.value = 'Certains articles n’ont pas pu être mis à jour.'
  }
}

async function clearPurchased() {
  if (!doneInView.value.length) return
  actionError.value = null
  bulkBusy.value = true
  const results = await Promise.allSettled(
    doneInView.value.map(i => shopping.remove(i.id)),
  )
  bulkBusy.value = false
  if (results.some(r => r.status === 'rejected')) {
    actionError.value = 'Certains articles n’ont pas pu être supprimés.'
  }
}
async function retryInitial() {
  await Promise.all([shopping.fetchAll(), categories.fetchAll()])
}
</script>

<template>
  <AppTopbar eyebrow="Liste" title="Courses" sub="Réassorts et achats">
    <div class="searchbox">
      <Icon name="search" :size="15" class="muted-icon" />
      <input
        v-model="query"
        type="search"
        placeholder="Rechercher un article…"
        aria-label="Rechercher dans la liste de courses"
      />
    </div>
    <button class="btn primary" @click="onNew">
      <Icon name="plus" :size="16" /><span class="btn-label">Ajouter</span>
    </button>
  </AppTopbar>

  <div class="content">
    <div class="content-inner view">
      <div v-if="initialState === 'loading'" class="card pad-center">
        <p class="muted">Chargement…</p>
      </div>

      <div v-else-if="initialState === 'error'" class="card pad-center">
        <p class="error-msg">
          {{ shopping.errorMessage.value ?? categories.errorMessage.value ?? 'Erreur de chargement.' }}
        </p>
        <button class="btn" @click="retryInitial">Réessayer</button>
      </div>

      <template v-else>
        <section class="sh-summary" aria-label="Résumé des courses">
          <div class="sumcard" :class="{ hot: counts.todoRefs > 0 }">
            <span class="sum-k mono todo-key">À ACHETER</span>
            <span class="sum-v num">{{ counts.todoRefs }}</span>
            <span class="sum-s muted">
              {{ counts.todoQty }} article{{ counts.todoQty > 1 ? 's' : '' }} au total
            </span>
          </div>
          <div class="sumcard">
            <span class="sum-k mono done-key">ACHETÉS</span>
            <span class="sum-v num">{{ counts.doneRefs }}</span>
            <span class="sum-s muted">
              {{ counts.doneRefs > 0 ? 'cochés dans la liste' : 'rien encore' }}
            </span>
          </div>
          <div class="sumcard">
            <span class="sum-k mono">RÉFÉRENCES</span>
            <span class="sum-v num">{{ counts.refs }}</span>
            <span class="sum-s muted">dans la liste</span>
          </div>
        </section>

        <div v-if="actionError" class="action-error">
          <Icon name="alert" :size="15" />
          {{ actionError }}
        </div>

        <div class="filt-bar">
          <div class="chips" role="tablist" aria-label="Filtrer par catégorie">
            <button
              class="chip"
              :class="{ on: cat === 'all' }"
              role="tab"
              :aria-selected="cat === 'all'"
              @click="cat = 'all'"
            >
              Tout
            </button>
            <button
              v-for="c in visibleCategories"
              :key="c['@id']"
              class="chip"
              :class="{ on: cat === c['@id'] }"
              role="tab"
              :aria-selected="cat === c['@id']"
              @click="cat = c['@id']"
            >
              <Icon :name="c.icon" :size="14" />{{ c.name }}
            </button>
          </div>
          <div class="seg push-right" aria-label="Filtrer par statut">
            <button
              v-for="[value, label] in PURCHASE_FILTERS"
              :key="value"
              :class="{ on: purchase === value }"
              @click="purchase = value"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <div v-if="todoInView.length || doneInView.length" class="bulk-bar">
          <button
            type="button"
            class="btn ghost sm"
            :disabled="bulkBusy || !todoInView.length"
            @click="markAllPurchased"
          >
            <Icon name="check" :size="14" />
            Tout cocher ({{ todoInView.length }})
          </button>
          <button
            v-if="isAdmin"
            type="button"
            class="btn ghost sm danger"
            :disabled="bulkBusy || !doneInView.length"
            @click="clearPurchased"
          >
            <Icon name="trash" :size="14" />
            Retirer les achetés ({{ doneInView.length }})
          </button>
        </div>

        <template v-for="c in categoriesShownInList" :key="c['@id']">
          <section v-if="itemsOfCategory(c['@id']).length" class="sh-cat">
            <header class="sh-cat-head">
              <Icon :name="c.icon" :size="17" />
              <h3>{{ c.name }}</h3>
              <span class="mono muted cat-count">
                {{ itemsOfCategory(c['@id']).length }} réf.
              </span>
            </header>
            <div class="sh-cat-body card">
              <ShoppingRow
                v-for="it in itemsOfCategory(c['@id'])"
                :key="it.id"
                :item="it"
                @patch="onPatch"
                @edit="onEdit"
              />
            </div>
          </section>
        </template>

        <div v-if="!filtered.length" class="empty">
          <Icon name="cart" :size="26" class="muted-icon" />
          <p v-if="purchase === 'todo'">Plus rien à acheter, bravo !</p>
          <p v-else-if="purchase === 'done'">Aucun article coché.</p>
          <p v-else>Aucun article ne correspond.</p>
        </div>
      </template>
    </div>
  </div>

  <ShoppingItemModal
    :open="modalOpen"
    :initial="modalInitial"
    :categories="categories.items.value"
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
.todo-key {
  color: var(--replace);
}
.done-key {
  color: var(--ok);
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

.sh-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 22px;
}

.bulk-bar {
  display: flex;
  gap: 8px;
  margin: -4px 2px 16px;
  flex-wrap: wrap;
}
.bulk-bar .btn.sm {
  padding: 6px 10px;
  font-size: 12.5px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.bulk-bar .danger {
  color: var(--replace);
}
.bulk-bar .danger:hover:not(:disabled) {
  background: var(--replace-bg);
}

.sh-cat {
  margin-bottom: 22px;
}
.sh-cat-head {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 2px 10px;
  color: var(--accent);
}
.sh-cat-head h3 {
  font-size: 16px;
  color: var(--ink);
}
.sh-cat-body {
  overflow: hidden;
}
</style>
