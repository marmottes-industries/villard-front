import type { AccentColor } from '@/api/properties'

/**
 * Palette d'accents des logements, miroir de `App\Enum\AccentColor` côté API.
 *
 * L'hexadécimal est dupliqué ici uniquement pour peindre les pastilles du
 * sélecteur avant tout aller-retour serveur : dès qu'un logement est chargé,
 * c'est son `accentHex` qui fait foi. Les libellés, eux, n'existent que côté
 * client — l'API n'expose pas de traduction.
 */
export const ACCENTS: { value: AccentColor; hex: string; label: string }[] = [
  { value: 'forest', hex: '#2E4A39', label: 'Sapin' },
  { value: 'lake', hex: '#2C5159', label: 'Lac' },
  { value: 'wood', hex: '#97653A', label: 'Bois' },
  { value: 'slate', hex: '#4F6076', label: 'Ardoise' },
  { value: 'plum', hex: '#6E4B5E', label: 'Myrtille' },
  { value: 'lichen', hex: '#5F6440', label: 'Lichen' },
]

export const DEFAULT_ACCENT: AccentColor = 'forest'

export function accentHex(value: AccentColor | null | undefined): string {
  return ACCENTS.find(a => a.value === value)?.hex ?? ACCENTS[0].hex
}
