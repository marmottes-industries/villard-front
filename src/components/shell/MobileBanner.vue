<script setup lang="ts">
import Icon from '@/components/icons/Icon.vue'
import { useUi } from '@/composable/useUi'

const { dismissBanner } = useUi()
</script>

<template>
  <div class="m-banner" role="status">
    <div class="m-banner-ico" aria-hidden="true">
      <Icon name="mobile" :size="16" />
    </div>
    <div class="m-banner-text">
      <b>App mobile dédiée bientôt disponible</b>
      <span>Pour une meilleure expérience sur téléphone, l'app React Native arrive.</span>
    </div>
    <button
      type="button"
      class="m-banner-close"
      aria-label="Masquer le message"
      @click="dismissBanner"
    >
      <Icon name="x" :size="14" />
    </button>
  </div>
</template>

<style scoped>
.m-banner {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 12px;
  background: linear-gradient(180deg, var(--accent-deep), var(--accent-ink));
  color: #e8efe6;
  font-size: 12.5px;
  line-height: 1.35;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.m-banner-ico {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--accent-soft);
}
.m-banner-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}
.m-banner-text b {
  font-size: 12.5px;
  font-weight: 600;
  color: #fff;
}
.m-banner-text span {
  font-size: 11px;
  color: rgba(232, 239, 230, 0.65);
}
.m-banner-close {
  border: 0;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(232, 239, 230, 0.75);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.14s, color 0.14s;
}
.m-banner-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
</style>
