<script setup lang="ts">
import Icon from '@/components/icons/Icon.vue'
import Stepper from '@/components/inventory/Stepper.vue'
import type { InventoryItem, InvState } from '@/api/inventory'
import { STATE_CYCLE, STATE_META } from '@/utils/inventoryState'

const props = defineProps<{ item: InventoryItem }>()

const emit = defineEmits<{
  (e: 'patch', id: number, patch: Partial<Pick<InventoryItem, 'state' | 'quantity'>>): void
  (e: 'edit', item: InventoryItem): void
}>()

function cycleState() {
  emit('patch', props.item.id, { state: STATE_CYCLE[props.item.state] })
}

function updateQty(quantity: number) {
  emit('patch', props.item.id, { quantity })
}

function meta(state: InvState) {
  return STATE_META[state]
}
</script>

<template>
  <div class="inv-row">
    <button
      type="button"
      class="inv-main"
      title="Modifier l'article"
      @click="emit('edit', item)"
    >
      <span class="inv-name">{{ item.name }}</span>
      <span v-if="item.note" class="inv-note muted">{{ item.note }}</span>
    </button>
    <span v-if="item.location" class="inv-loc mono">
      <Icon name="pin" :size="12" />{{ item.location }}
    </span>
    <span v-else />
    <button
      type="button"
      class="tag"
      :class="meta(item.state).cls"
      title="Cliquer pour changer l'état"
      @click="cycleState"
    >
      <span class="dot" :style="{ background: `var(--${meta(item.state).cls})` }" />
      {{ meta(item.state).label }}
    </button>
    <Stepper
      :model-value="item.quantity"
      :min="0"
      :aria-label="`quantité ${item.name}`"
      @update:model-value="updateQty"
    />
  </div>
</template>

<style scoped>
.inv-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  align-items: flex-start;
  text-align: left;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
}
.inv-main:hover .inv-name {
  color: var(--accent);
}
.inv-name {
  transition: color 0.12s;
}
</style>
