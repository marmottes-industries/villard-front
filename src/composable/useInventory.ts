import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { formatError } from '@/utils/formatError'
import {
    inventoryApi,
    type InventoryItem,
    type InventoryCreatePayload,
    type InventoryUpdatePayload,
} from '@/api/inventory'
import { usePropertiesStore } from '@/stores/properties'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

export function useInventory() {
    const properties = usePropertiesStore()
    const { activePropertyIri } = storeToRefs(properties)

    const items = ref<InventoryItem[]>([])
    const state = ref<AsyncState>('idle')
    const errorMessage = ref<string | null>(null)

    async function fetchAll() {
        const property = activePropertyIri.value
        // Aucun logement actif : on ne lance aucun appel, la vue affiche l'état vide.
        if (!property) {
            items.value = []
            state.value = 'idle'
            errorMessage.value = null
            return
        }

        state.value = 'loading'
        errorMessage.value = null
        try {
            const { data } = await inventoryApi.list(property)
            items.value = data
            state.value = 'success'
        } catch (err) {
            state.value = 'error'
            errorMessage.value = formatError(err)
        }
    }

    async function create(payload: Omit<InventoryCreatePayload, 'property'>) {
        const property = activePropertyIri.value
        if (!property) throw new Error('Aucun logement actif.')
        const { data } = await inventoryApi.create({ ...payload, property })
        items.value = [...items.value, data]
        return data
    }

    // Pour la modale d'édition : on attend la réponse serveur avant de mettre à jour.
    async function update(id: number, payload: InventoryUpdatePayload) {
        const { data } = await inventoryApi.update(id, payload)
        items.value = items.value.map(i => (i.id === id ? data : i))
        return data
    }

    // Pour le stepper qty et le cycle d'état : MAJ immédiate, rollback si erreur.
    async function patch(id: number, payload: InventoryUpdatePayload) {
        const previous = items.value.find(i => i.id === id)
        if (!previous) return
        items.value = items.value.map(i => (i.id === id ? { ...i, ...payload } : i))
        try {
            const { data } = await inventoryApi.update(id, payload)
            items.value = items.value.map(i => (i.id === id ? data : i))
            return data
        } catch (err) {
            items.value = items.value.map(i => (i.id === id ? previous : i))
            throw err
        }
    }

    async function remove(id: number) {
        await inventoryApi.remove(id)
        items.value = items.value.filter(i => i.id !== id)
    }

    // Recharge au montage puis à chaque bascule de logement, sans rechargement de page.
    watch(activePropertyIri, fetchAll, { immediate: true })

    return { items, state, errorMessage, fetchAll, create, update, patch, remove }
}
