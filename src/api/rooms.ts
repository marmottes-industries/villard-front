import { apiClient } from '@/api/client'

// Cf. API.md §4.11. Pas de valeur « autre » : une pièce atypique reste `null`.
export type RoomType =
    | 'kitchen'
    | 'bathroom'
    | 'toilet'
    | 'bedroom'
    | 'living_room'
    | 'office'
    | 'laundry'
    | 'hallway'
    | 'garage'
    | 'cellar'
    | 'attic'
    | 'outdoor'

export type Room = {
    '@id': string
    id: number
    name: string
    type: RoomType | null
    position: number
    archived: boolean
    property: string // IRI '/api/properties/{id}'
}

export type RoomCreatePayload = {
    name: string
    type?: RoomType | null
    position?: number
    archived?: boolean
    property: string
}

export type RoomUpdatePayload = Partial<Omit<RoomCreatePayload, 'property'>>

export const roomsApi = {
    list(property: string) {
        return apiClient.get<Room[]>('/api/rooms', { params: { property } })
    },
    // Écritures réservées au `manager` du logement. Contrairement aux autres
    // ressources, `property` n'est pas auto-remplie : l'omettre renvoie 403.
    // Un doublon (property, name) renvoie 422.
    create(payload: RoomCreatePayload) {
        return apiClient.post<Room>('/api/rooms', payload)
    },
    update(id: number, payload: RoomUpdatePayload) {
        return apiClient.patch<Room>(`/api/rooms/${id}`, payload, {
            headers: { 'Content-Type': 'application/merge-patch+json' },
        })
    },
    // Les articles et travaux rattachés ne sont pas supprimés, seulement
    // détachés : leur `room` repasse à null côté serveur.
    remove(id: number) {
        return apiClient.delete<void>(`/api/rooms/${id}`)
    },
}

export function idFromIri(iri: string): number | null {
    const match = iri.match(/\/api\/rooms\/(\d+)/)
    return match ? Number(match[1]) : null
}
