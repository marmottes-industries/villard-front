import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { formatError } from '@/utils/formatError'
import { roomsApi, type Room } from '@/api/rooms'
import { roomIcon, roomTypeLabel } from '@/utils/roomMeta'
import { usePropertiesStore } from '@/stores/properties'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

export type DisplayRoom = Room & { icon: string; typeLabel: string | null }

function decorate(room: Room): DisplayRoom {
    return { ...room, icon: roomIcon(room.type), typeLabel: roomTypeLabel(room.type) }
}

/**
 * Patron `useInventory`, et non `useCategories` : une pièce appartient à un
 * logement, elle doit donc se recharger à chaque bascule plutôt qu'une fois au
 * montage.
 */
export function useRooms() {
    const properties = usePropertiesStore()
    const { activePropertyIri } = storeToRefs(properties)

    const all = ref<DisplayRoom[]>([])
    const state = ref<AsyncState>('idle')
    const errorMessage = ref<string | null>(null)

    async function fetchAll() {
        const property = activePropertyIri.value
        // Aucun logement actif : on ne lance aucun appel, la vue affiche l'état vide.
        if (!property) {
            all.value = []
            state.value = 'idle'
            errorMessage.value = null
            return
        }

        state.value = 'loading'
        errorMessage.value = null
        try {
            const { data } = await roomsApi.list(property)
            all.value = data.map(decorate)
            state.value = 'success'
        } catch (err) {
            state.value = 'error'
            errorMessage.value = formatError(err)
        }
    }

    // Le gestionnaire décide de l'ordre : trier alphabétiquement placerait
    // « Chambre 10 » avant « Chambre 2 ».
    const items = computed(() =>
        all.value
            .filter(r => !r.archived)
            .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })),
    )

    function findByIri(iri: string): DisplayRoom | null {
        return all.value.find(r => r['@id'] === iri) ?? null
    }

    watch(activePropertyIri, fetchAll, { immediate: true })

    return { items, all, state, errorMessage, fetchAll, findByIri }
}
