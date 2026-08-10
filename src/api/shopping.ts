import { apiClient } from '@/api/client'


export type ShoppingItem = {
    '@id': string
    id: number
    name: string
    quantity: number
    purchased: boolean
    category: string
    property: string // IRI '/api/properties/{id}'
}

export type ShoppingCreatePayload = {
    name: string
    quantity: number
    purchased?: boolean
    category: string
    property: string
}

export type ShoppingUpdatePayload = Partial<Omit<ShoppingCreatePayload, 'property'>>

export const shoppingApi = {
    // `property` restreint au logement actif (cf. API.md §2.5).
    list(property: string) {
        return apiClient.get<ShoppingItem[]>('/api/shopping_items', { params: { property } })
    },
    create(payload: ShoppingCreatePayload) {
        return apiClient.post<ShoppingItem>('/api/shopping_items', payload)
    },
    update(id: number, payload: ShoppingUpdatePayload) {
        return apiClient.patch<ShoppingItem>(`/api/shopping_items/${id}`, payload, {
            headers: { 'Content-Type': 'application/merge-patch+json' },
        })
    },
    remove(id: number) {
        return apiClient.delete<void>(`/api/shopping_items/${id}`)
    },
}

export function idFromIri(iri: string): number | null {
    const match = iri.match(/\/api\/shopping_items\/(\d+)/)
    return match ? Number(match[1]) : null
}
