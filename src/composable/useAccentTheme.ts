import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePropertiesStore } from '@/stores/properties'

// Les variantes claire/foncée et le fond sont dérivés de la teinte de base :
// l'API n'expose qu'un hexadécimal par accent, le reste est du calcul CSS.
//
// `-deep` et `-ink` forment le dégradé de la sidebar, `-soft` sert aux éléments
// posés dessus (liseré actif, glyphe de marque) — d'où le mélange vers le blanc,
// seul moyen de rester lisible sur ces fonds sombres.
const DERIVED: [string, (hex: string) => string][] = [
  ['--accent', hex => hex],
  ['--accent-2', hex => `color-mix(in oklab, ${hex}, white 12%)`],
  ['--accent-deep', hex => `color-mix(in oklab, ${hex}, black 24%)`],
  ['--accent-ink', hex => `color-mix(in oklab, ${hex}, black 42%)`],
  ['--accent-soft', hex => `color-mix(in oklab, ${hex}, white 50%)`],
  ['--accent-bg', hex => `color-mix(in oklab, ${hex} 13%, var(--card))`],
]

/**
 * Teinte l'interface avec l'accent du logement actif.
 *
 * À appeler une seule fois, au niveau de `App.vue` : le sélecteur de logement
 * vit dans la sidebar, mais la couleur doit survivre au démontage de celle-ci
 * (page de connexion) pour être remise à la valeur des tokens.
 */
export function useAccentTheme() {
  const { activeProperty } = storeToRefs(usePropertiesStore())

  watch(
    () => activeProperty.value?.accentHex ?? null,
    (hex) => {
      const html = document.documentElement
      for (const [name, derive] of DERIVED) {
        // Sans logement (déconnecté, ou aucune appartenance), on retire la
        // surcharge inline : `tokens.css` reprend la main sur son vert par défaut.
        if (hex === null) html.style.removeProperty(name)
        else html.style.setProperty(name, derive(hex))
      }
    },
    { immediate: true },
  )
}
