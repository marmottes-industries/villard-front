import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { formatError } from '@/utils/formatError'
import {
    notesApi,
    type Note,
    type NoteCreatePayload,
    type NoteUpdatePayload,
} from '@/api/notes'
import { usePropertiesStore } from '@/stores/properties'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

export function useNotes() {
    const properties = usePropertiesStore()
    const { activePropertyIri } = storeToRefs(properties)

    const items = ref<Note[]>([])
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
            const { data } = await notesApi.list(property)
            items.value = data
            state.value = 'success'
        } catch (err) {
            state.value = 'error'
            errorMessage.value = formatError(err)
        }
    }

    async function create(payload: Omit<NoteCreatePayload, 'property'>) {
        const property = activePropertyIri.value
        if (!property) throw new Error('Aucun logement actif.')
        const { data } = await notesApi.create({ ...payload, property })
        items.value = [data, ...items.value]
        return data
    }

    async function update(id: number, payload: NoteUpdatePayload) {
        const { data } = await notesApi.update(id, payload)
        items.value = items.value.map(n => (n.id === id ? data : n))
        return data
    }

    async function remove(id: number) {
        await notesApi.remove(id)
        items.value = items.value.filter(n => n.id !== id)
    }

    // Recharge au montage puis à chaque bascule de logement, sans rechargement de page.
    watch(activePropertyIri, fetchAll, { immediate: true })

    return { items, state, errorMessage, fetchAll, create, update, remove }
}
