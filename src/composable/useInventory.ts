import { onMounted, ref } from 'vue'
import { AxiosError } from 'axios'
import {
    inventoryApi,
    type InventoryItem,
    type InventoryCreatePayload,
    type InventoryUpdatePayload,
} from '@/api/inventory'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

export function useInventory() {
    const items = ref<InventoryItem[]>([])
    const state = ref<AsyncState>('idle')
    const errorMessage = ref<string | null>(null)

    async function fetchAll() {
        state.value = 'loading'
        errorMessage.value = null
        try {
            const { data } = await inventoryApi.list()
            items.value = data
            state.value = 'success'
        } catch (err) {
            state.value = 'error'
            errorMessage.value = formatError(err)
        }
    }

    async function create(payload: InventoryCreatePayload) {
        const { data } = await inventoryApi.create(payload)
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

    onMounted(fetchAll)

    return { items, state, errorMessage, fetchAll, create, update, patch, remove }
}

function formatError(err: unknown): string {
    if (err instanceof AxiosError) {
        if (err.code === 'ERR_NETWORK') return 'Impossible de joindre le serveur.'
        if (err.response?.status === 403) return "Vous n'avez pas les droits nécessaires."
    }
    return 'Une erreur est survenue.'
}
