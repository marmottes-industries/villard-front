import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Density = 'compact' | 'regular' | 'comfy'
export type CalView = 'month' | 'week' | 'list'

// L'accent ne vit plus ici : c'est une propriété du logement, appliquée par
// `useAccentTheme` depuis le logement actif (cf. `@/config/accents`).
interface TweaksSnapshot {
  density: Density
  calView: CalView
  grain: boolean
}

const STORAGE_KEY = 'marmotte.tweaks'

const DEFAULTS: TweaksSnapshot = {
  density: 'regular',
  calView: 'month',
  grain: true,
}

function load(): TweaksSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export const useTweaksStore = defineStore('tweaks', () => {
  const init = load()
  const density = ref<Density>(init.density)
  const calView = ref<CalView>(init.calView)
  const grain = ref<boolean>(init.grain)

  function applyToDom() {
    document.documentElement.setAttribute('data-density', density.value)
  }

  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        density: density.value,
        calView: calView.value,
        grain: grain.value,
      }),
    )
  }

  applyToDom()

  watch([density, calView, grain], () => {
    applyToDom()
    persist()
  })

  return { density, calView, grain }
})
