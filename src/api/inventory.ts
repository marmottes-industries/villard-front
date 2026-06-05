import { apiClient } from '@/api/client'

export type InvState = 'ok' | 'worn' | 'replace'

export type InventoryItem = {
    '@id': string
    id: number
    name: string
    quantity: number
    state: InvState
    location: string | null
    note: string | null
    category: string // IRI category
}

export type InventoryCreatePayload = {
    name: string
    quantity: number
    state: InvState
    location?: string | null
    note?: string | null
    category: string
}

export type InventoryUpdatePayload = Partial<InventoryCreatePayload>

export const inventoryApi = {
    list() {
        return apiClient.get<InventoryItem[]>('/api/inventory_items')
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
