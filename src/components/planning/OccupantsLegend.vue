<script setup lang="ts">
import type { DisplayUser } from '@/composable/useUsers'

defineProps<{ occupants: DisplayUser[] }>()
</script>

<template>
  <div class="legend">
    <div
      v-for="o in occupants"
      :key="o.iri"
      class="legend-item"
    >
      <span class="dot" :style="{ background: o.color }" />
      <span class="name">{{ o.username }}</span>
    </div>
  </div>
</template>

<style scoped>
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 0 2px 16px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--ink-2);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}
.name {
  font-weight: 600;
}
</style>
