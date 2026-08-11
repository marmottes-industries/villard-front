<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import Icon from '@/components/icons/Icon.vue'
import { usePropertiesStore } from '@/stores/properties'

const router = useRouter()
const properties = usePropertiesStore()
const { properties: list, activeProperty, isMultiProperty } = storeToRefs(properties)

const open = ref(false)

// Le nom du logement remplace le libellé de marque figé. Sans logement rattaché,
// on garde un libellé neutre plutôt qu'un nom d'appartement inventé.
const name = computed(() => activeProperty.value?.name ?? 'Aucun logement')
const sub = computed(() => activeProperty.value?.city ?? 'Rien à afficher')

function toggle() {
  open.value = !open.value
}

function pick(id: number) {
  properties.setActive(id)
  open.value = false
}

function goToProperties() {
  open.value = false
  router.push('/logements')
}

function onDocumentClick() {
  open.value = false
}

// Fermeture au clic extérieur : le menu vit dans la sidebar, qui reste montée.
watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', onDocumentClick)
  } else {
    document.removeEventListener('click', onDocumentClick)
  }
})

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <!-- Mono-logement (ou aucun) : pas de sélecteur, juste le nom du logement. -->
  <div v-if="!isMultiProperty" class="switcher static">
    <div class="brand-glyph accent-glyph">
      <Icon name="leaf" :size="20" />
    </div>
    <div class="brand-titles">
      <div class="brand-name">{{ name }}</div>
      <div class="brand-sub">{{ sub }}</div>
    </div>
  </div>

  <div v-else class="switcher" @click.stop>
    <button
      type="button"
      class="switcher-btn"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <div class="brand-glyph accent-glyph">
        <Icon name="leaf" :size="20" />
      </div>
      <div class="brand-titles">
        <div class="brand-name">{{ name }}</div>
        <div class="brand-sub">{{ sub }}</div>
      </div>
      <Icon name="chevD" :size="16" class="switcher-caret" :class="{ up: open }" />
    </button>

    <div v-if="open" class="switcher-menu" role="listbox">
      <button
        v-for="p in list"
        :key="p.id"
        type="button"
        class="switcher-opt"
        :class="{ on: p.id === activeProperty?.id }"
        role="option"
        :aria-selected="p.id === activeProperty?.id"
        @click="pick(p.id)"
      >
        <span class="switcher-opt-dot" :style="{ background: p.accentHex }" aria-hidden="true" />
        <div class="switcher-opt-text">
          <span class="switcher-opt-name">{{ p.name }}</span>
          <span class="switcher-opt-city">{{ p.city }}</span>
        </div>
        <Icon v-if="p.id === activeProperty?.id" name="check" :size="15" />
      </button>

      <button type="button" class="switcher-manage" @click="goToProperties">
        <Icon name="gear" :size="14" />
        Gérer les logements
      </button>
    </div>
  </div>
</template>

<style scoped>
.switcher {
  position: relative;
  flex: 1;
  min-width: 0;
}
.switcher.static {
  display: flex;
  align-items: center;
  gap: 11px;
}
/* `.brand-glyph` / `.brand-name` / `.brand-sub` viennent de tokens.css ;
   `.brand-titles` est propre au bloc de marque, donc redéfini ici. */
.brand-titles {
  flex: 1;
  min-width: 0;
}
.brand-name,
.brand-sub {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Éclairci : la teinte brute du logement disparaîtrait sur le fond de sidebar,
   qui est cette même teinte assombrie. */
.accent-glyph {
  color: var(--accent-soft);
}

.switcher-btn {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 5px 6px 5px 5px;
  margin: -5px -6px -5px -5px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.14s;
}
.switcher-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}
.switcher-caret {
  flex-shrink: 0;
  color: rgba(232, 239, 230, 0.55);
  transition: transform 0.16s;
}
.switcher-caret.up {
  transform: rotate(180deg);
}

.switcher-menu {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  z-index: 20;
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--accent-ink, #16221a);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 11px;
  box-shadow: 0 16px 32px rgba(10, 18, 12, 0.45);
  animation: switcherIn 0.14s ease;
}
@keyframes switcherIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.switcher-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: rgba(232, 239, 230, 0.78);
  text-align: left;
  cursor: pointer;
  transition: background 0.14s, color 0.14s;
}
.switcher-opt:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}
.switcher-opt.on {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
/* Le liseré clair détache les accents sombres du fond de menu, lui-même sombre. */
.switcher-opt-dot {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.28);
}
.switcher-opt-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.switcher-opt-name {
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.switcher-opt-city {
  font-family: var(--mono), monospace;
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(232, 239, 230, 0.45);
}

.switcher-manage {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  margin-top: 3px;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0 0 8px 8px;
  background: transparent;
  color: rgba(232, 239, 230, 0.6);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.14s;
}
.switcher-manage:hover {
  color: #fff;
}
</style>
