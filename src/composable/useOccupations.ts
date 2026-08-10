import {ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {
    type Occupation,
    type OccupationCreatePayload,
    type OccupationUpdatePayload,
    occupationsApi,
} from "@/api/occupation.ts";
import { formatError } from '@/utils/formatError'
import { usePropertiesStore } from '@/stores/properties'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'
export function useOccupations() {
    const properties = usePropertiesStore()
    const {activePropertyIri} = storeToRefs(properties)

    const items = ref<Occupation[]>([])
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
            const {data} = await occupationsApi.list(property)
            items.value = data
            state.value = 'success'

        } catch(err) {
            state.value = 'error'
            errorMessage.value = formatError(err)
        }
    }

    async function create(payload: Omit<OccupationCreatePayload, 'property'>) {
        const property = activePropertyIri.value
        if (!property) throw new Error('Aucun logement actif.')
        const {data} = await occupationsApi.create({...payload, property})
        items.value = [...items.value, data]
        return data
    }

    async function update(id: number, payload: OccupationUpdatePayload) {
        const {data} = await occupationsApi.update(id, payload)
        items.value = items.value.map(item => item.id === id ? data : item)
        return data
    }

    async function remove(id: number) {
        await occupationsApi.remove(id)
        items.value = items.value.filter(item => item.id != id)
    }

    // Recharge au montage puis à chaque bascule de logement, sans rechargement de page.
    watch(activePropertyIri, fetchAll, { immediate: true })

    return {
        items,
        state,
        errorMessage,
        fetchAll,
        create,
        update,
        remove,
    }
}
