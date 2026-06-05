import {categoriesApi, type Category} from "@/api/category.ts";
import {computed, onMounted, ref} from "vue";
import {AxiosError} from "axios";

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

const ICON_BY_NAME: Record<string, string> = {
    'Cuisine': 'dish',
    'Salle de bain': 'bath',
    'Chambre': 'linen',
    'Salon': 'leaf',
    'Extérieur': 'sun',
    'Cave': 'gear',
}

export type DisplayCategory = Category & { icon: string }

export function useCategories() {
    const items = ref<DisplayCategory[]>([])
    const state = ref<AsyncState>('idle')
    const errorMessage = ref<string | null>(null)

    async function fetchAll() {
        state.value = 'loading'
        errorMessage.value = null

        try {
            const {data} = await categoriesApi.list()
            items.value = data.map(c => ({
                ...c,
                icon: ICON_BY_NAME[c.name] ?? 'box',
            }))
            state.value = 'success'
        } catch (err) {
            state.value = 'error'
            errorMessage.value = formatError(err)
        }
    }

    const forInventory = computed(() =>
        items.value.filter(c => c.inventoryItems.length > 0),
    )

    function findByIri(iri: string): DisplayCategory | null {
        return items.value.find(c => c['@id'] === iri) ?? null
    }

    onMounted(fetchAll)

    return {items, forInventory, state, errorMessage, fetchAll, findByIri}
}

function formatError(err: unknown): string {
    if (err instanceof AxiosError && err.code === 'ERR_NETWORK') {
        return 'Impossible de joindre le serveur.'
    }
    return 'Une erreur est survenue.'
}
