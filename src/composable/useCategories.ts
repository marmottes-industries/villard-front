import {categoriesApi, type Category} from "@/api/category.ts";
import {computed, onMounted, ref} from "vue";
import { formatError } from '@/utils/formatError'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

const ICON_BY_NAME: Record<string, string> = {
    'Cuisine': 'dish',
    'Salle de bain': 'bath',
    'Chambre': 'linen',
    'Salon': 'leaf',
    'Extérieur': 'sun',
    'Cave': 'gear',
}

/**
 * Ne sert plus qu'aux courses : l'inventaire est passé aux pièces
 * (cf. `useRooms`). Un `forInventory` a été retiré ici, `inventoryItems` se
 * vidant à mesure que les articles cessent de porter une catégorie.
 */
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

    const forShopping = computed(() =>
        items.value.filter(c => c.shoppingItems.length > 0),
    )

    function findByIri(iri: string): DisplayCategory | null {
        return items.value.find(c => c['@id'] === iri) ?? null
    }

    onMounted(fetchAll)

    return {items, forShopping, state, errorMessage, fetchAll, findByIri}
}
