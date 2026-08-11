import { apiClient } from '@/api/client'

export type PropertyRole = 'manager' | 'occupant'

// Palette fermée côté API (cf. API.md §4.9). L'hexadécimal correspondant est
// renvoyé par le serveur dans `accentHex` : les libellés et l'ordre du sélecteur
// vivent dans `@/config/accents`.
export type AccentColor = 'forest' | 'lake' | 'wood' | 'slate' | 'plum' | 'lichen'

// Version allégée renvoyée embarquée par /api/me (groupe `property:summary`).
// Suffisante pour amorcer le sélecteur de logement sans second appel.
export type PropertySummary = {
    '@id': string
    id: number
    name: string
    slug: string
    city: string
    latitude: number
    longitude: number
    timezone: string
    accentColor: AccentColor
    // Dérivé de `accentColor` côté serveur, en lecture seule.
    accentHex: string
    archived: boolean
}

// Version complète renvoyée par /api/properties. L'API omet les champs nuls,
// d'où les propriétés optionnelles sur l'adresse et le point météo secondaire.
export type Property = PropertySummary & {
    address?: string | null
    secondaryLocationName?: string | null
    secondaryLatitude?: number | null
    secondaryLongitude?: number | null
}

// Appartenance telle qu'exposée dans /api/me : le logement est embarqué, pas une IRI.
export type Membership = {
    '@id': string
    role: PropertyRole
    property: PropertySummary
}

export type PropertyCreatePayload = {
    name: string
    slug: string
    city: string
    address?: string | null
    latitude: number
    longitude: number
    timezone?: string
    secondaryLocationName?: string | null
    secondaryLatitude?: number | null
    secondaryLongitude?: number | null
    accentColor?: AccentColor
    archived?: boolean
}

export type PropertyUpdatePayload = Partial<PropertyCreatePayload>

export const propertiesApi = {
    list() {
        return apiClient.get<Property[]>('/api/properties')
    },
    get(id: number) {
        return apiClient.get<Property>(`/api/properties/${id}`)
    },
    // POST est réservé à ROLE_ADMIN (cf. API.md §4.9).
    create(payload: PropertyCreatePayload) {
        return apiClient.post<Property>('/api/properties', payload)
    },
    // PATCH est réservé aux gestionnaires du logement.
    update(id: number, payload: PropertyUpdatePayload) {
        return apiClient.patch<Property>(`/api/properties/${id}`, payload, {
            headers: { 'Content-Type': 'application/merge-patch+json' },
        })
    },
    remove(id: number) {
        return apiClient.delete<void>(`/api/properties/${id}`)
    },
}

export function idFromIri(iri: string): number | null {
    const match = iri.match(/\/api\/properties\/(\d+)/)
    return match ? Number(match[1]) : null
}
