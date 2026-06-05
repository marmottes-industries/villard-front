import {onMounted, ref} from "vue";
import {
    type Occupation,
    type OccupationCreatePayload,
    type OccupationUpdatePayload,
    occupationsApi,
} from "@/api/occupation.ts";
import {AxiosError} from "axios";

type AsyncState = 'idle' | 'loading' | 'error' | 'success'
export function useOccupations() {
    const items = ref<Occupation[]>([])
    const state = ref<AsyncState>('idle')
    const errorMessage = ref<string | null>(null)

    async function fetchAll() {
        state.value = 'loading'
        errorMessage.value = null

        try {
            const {data} = await occupationsApi.list()
            items.value = data
            state.value = 'success'

        } catch(err) {
            state.value = 'error'
            errorMessage.value = formatError(err)
        }
    }

    async function create(payload: OccupationCreatePayload) {
        const {data} = await occupationsApi.create(payload)
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

    onMounted(fetchAll)

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

function formatError(err: unknown) : string {
    if (err instanceof AxiosError) {
        if (err.code === 'ERR_NETWORK') {
            return 'Impossible de joindre le serveur.'
        }
        if (err.response?.status === 403) {
            return 'Vous n\'avez pas les droits nécessaires.'
        }
    }
    return 'Une erreur est survenue.'
}
