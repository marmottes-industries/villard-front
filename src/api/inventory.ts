import { apiClient } from '@/api/client'

export type InvState = 'ok' | 'worn' | 'replace'

export type InventoryItem = {
    '@id': string
    id: number
    name: string
    quantity: number
    state: InvState
    // Précision de rangement DANS la pièce (« placard du haut »), pas la pièce.
    location: string | null
    note: string | null
    room: string | null // IRI '/api/rooms/{id}'
    /** @deprecated Remplacé par `room`, retiré à la prochaine majeure de l'API. */
    category: string | null
    property: string // IRI '/api/properties/{id}'
}

export type InventoryCreatePayload = {
    name: string
    quantity: number
    state: InvState
    location?: string | null
    note?: string | null
    room?: string | null
    property: string
}

export type InventoryUpdatePayload = Partial<Omit<InventoryCreatePayload, 'property'>>

export const inventoryApi = {
    // `property` restreint au logement actif (cf. API.md §2.5).
    list(property: string) {
        return apiClient.get<InventoryItem[]>('/api/inventory_items', { params: { property } })
    },
    create(payload: InventoryCreatePayload) {
        return apiClient.post<InventoryItem>('/api/inventory_items', payload)
    },
    update(id: number, payload: InventoryUpdatePayload) {
        return apiClient.patch<InventoryItem>(`/api/inventory_items/${id}`, payload, {
            headers: { 'Content-Type': 'application/merge-patch+json' },
        })
    },
    remove(id: number) {
        return apiClient.delete<void>(`/api/inventory_items/${id}`)
    },
}

export function idFromIri(iri: string): number | null {
    const match = iri.match(/\/api\/inventory_items\/(\d+)/)
    return match ? Number(match[1]) : null
}
