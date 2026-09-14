<script setup lang="ts">
import { computed } from 'vue'
import { imageSrc, type ImageRef } from '@/api/images'

/*
 * Miniatures en lecture seule sur une carte. Un clic ouvre la photo dans un
 * nouvel onglet, sans déclencher l'édition de la carte.
 */
const props = withDefaults(defineProps<{
  images: ImageRef[]
  max?: number
}>(), { max: 3 })

const shown = computed(() => props.images.slice(0, props.max))
const hidden = computed(() => props.images.length - shown.value.length)
</script>

<template>
  <div v-if="images.length" class="img-strip" @click.stop @keydown.stop>
    <a
      v-for="(image, index) in shown"
      :key="image.id"
      class="img-thumb"
      :href="imageSrc(image)"
      target="_blank"
      rel="noopener"
      :aria-label="`Ouvrir la photo ${index + 1}`"
    >
      <img :src="imageSrc(image)" alt="" loading="lazy" />
      <span v-if="hidden > 0 && index === shown.length - 1" class="img-more">+{{ hidden }}</span>
    </a>
  </div>
</template>

<style scoped>
.img-strip {
  display: flex;
  gap: 6px;
}
.img-thumb {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--card-3);
  border: 1px solid var(--line);
}
.img-thumb:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.img-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-more {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(27, 39, 31, 0.55);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
}
</style>
