import type { RoomType } from '@/api/rooms'

/**
 * Label et icône par type de pièce. L'API n'expose délibérément aucune icône :
 * c'est une décision d'interface, et le web et le mobile n'ont pas le même jeu
 * disponible. Les six premiers reprennent l'ancien `ICON_BY_NAME` des
 * catégories, pour que la bascule soit visuellement neutre.
 */
export const ROOM_TYPE_META: Record<RoomType, { label: string; icon: string }> = {
    kitchen: { label: 'Cuisine', icon: 'dish' },
    bathroom: { label: 'Salle de bain', icon: 'bath' },
    toilet: { label: 'WC', icon: 'droplet' },
    bedroom: { label: 'Chambre', icon: 'linen' },
    living_room: { label: 'Salon', icon: 'leaf' },
    office: { label: 'Bureau', icon: 'note' },
    laundry: { label: 'Buanderie', icon: 'refresh' },
    hallway: { label: 'Couloir', icon: 'door' },
    garage: { label: 'Garage', icon: 'hammer' },
    cellar: { label: 'Cave', icon: 'gear' },
    attic: { label: 'Combles', icon: 'stairs' },
    outdoor: { label: 'Extérieur', icon: 'sun' },
}

/** Ordre proposé dans les sélecteurs de type. */
export const ROOM_TYPE_OPTIONS: RoomType[] = [
    'kitchen',
    'living_room',
    'bedroom',
    'bathroom',
    'toilet',
    'office',
    'laundry',
    'hallway',
    'garage',
    'cellar',
    'attic',
    'outdoor',
]

/** Pièce sans type, et groupe « Sans pièce » des listes. */
export const ROOM_FALLBACK_ICON = 'box'

export function roomIcon(type: RoomType | null): string {
    return type ? ROOM_TYPE_META[type].icon : ROOM_FALLBACK_ICON
}

export function roomTypeLabel(type: RoomType | null): string | null {
    return type ? ROOM_TYPE_META[type].label : null
}
