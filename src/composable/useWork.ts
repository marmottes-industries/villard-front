import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { formatError } from '@/utils/formatError'
import {
    worksApi,
    type Work,
    type WorkCreatePayload,
    type WorkUpdatePayload,
} from '@/api/work'
import { applyImageChanges, type ImageChanges } from '@/api/images'
import { usePropertiesStore } from '@/stores/properties'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

export function useWork() {
    const properties = usePropertiesStore()
    const { activePropertyIri } = storeToRefs(properties)

    const items = ref<Work[]>([])
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
            const { data } = await worksApi.list(property)
            items.value = data
            state.value = 'success'
        } catch (err) {
            state.value = 'error'
            errorMessage.value = formatError(err)
        }
    }

    /**
     * Les images sont traitées après l'enregistrement du parent, dont elles ont
     * besoin de l'IRI. Un échec sur les images n'annule pas l'enregistrement :
     * il est renvoyé dans `imageError` pour que la vue le signale.
     */
    async function create(payload: Omit<WorkCreatePayload, 'property'>, images?: ImageChanges) {
        const property = activePropertyIri.value
        if (!property) throw new Error('Aucun logement actif.')
        const { data } = await worksApi.create({ ...payload, property })
        items.value = [data, ...items.value]
        const imageError = await syncImages(data, images)
        return { work: data, imageError }
    }

    async function update(id: number, payload: WorkUpdatePayload, images?: ImageChanges) {
        const { data } = await worksApi.update(id, payload)
        items.value = items.value.map(w => (w.id === id ? data : w))
        const imageError = await syncImages(data, images)
        return { work: data, imageError }
    }

    async function syncImages(item: Work, images?: ImageChanges): Promise<string | null> {
        if (!images || (!images.newFiles.length && !images.removedImageIds.length)) return null
        const imageError = await applyImageChanges({ work: item['@id'] }, images)
        // Relecture pour récupérer les images et leurs URLs signées.
        try {
            const { data } = await worksApi.get(item.id)
            items.value = items.value.map(w => (w.id === item.id ? data : w))
        } catch {
            // Sans gravité : la liste se remettra à jour au prochain chargement.
        }
        return imageError
    }

    async function remove(id: number) {
        await worksApi.remove(id)
        items.value = items.value.filter(w => w.id !== id)
    }

    // Recharge au montage puis à chaque bascule de logement, sans rechargement de page.
    watch(activePropertyIri, fetchAll, { immediate: true })

    return { items, state, errorMessage, fetchAll, create, update, remove }
}
