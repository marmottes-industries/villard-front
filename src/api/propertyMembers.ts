import { apiClient } from '@/api/client'
import type { PropertyRole } from '@/api/properties'

export type PropertyMember = {
    '@id': string
    id: number
    property: string // IRI '/api/properties/{id}'
    user: string // IRI '/api/users/{id}'
    role: PropertyRole
}

export type PropertyMemberCreatePayload = {
    property: string
    user: string
    role?: PropertyRole
}

export type PropertyMemberUpdatePayload = {
    role: PropertyRole
}

export const propertyMembersApi = {
    list(property: string) {
        return apiClient.get<PropertyMember[]>('/api/property_members', {
            params: { property },
        })
    },
    // POST / PATCH / DELETE exigent le rôle `manager` sur le logement visé.
    // Un doublon (property, user) renvoie 422.
    create(payload: PropertyMemberCreatePayload) {
        return apiClient.post<PropertyMember>('/api/property_members', payload)
    },
    update(id: number, payload: PropertyMemberUpdatePayload) {
        return apiClient.patch<PropertyMember>(`/api/property_members/${id}`, payload, {
            headers: { 'Content-Type': 'application/merge-patch+json' },
        })
    },
    remove(id: number) {
        return apiClient.delete<void>(`/api/property_members/${id}`)
    },
}

export function idFromIri(iri: string): number | null {
    const match = iri.match(/\/api\/property_members\/(\d+)/)
    return match ? Number(match[1]) : null
}
