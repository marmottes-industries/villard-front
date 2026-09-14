import { apiClient } from '@/api/client'
import type { ImageRef } from '@/api/images'

export type WorkStatus = 'suggested' | 'planned' | 'in_progress' | 'done' | 'cancelled'
export type WorkType = 'diy' | 'pro'
export type WorkPriority = 'low' | 'medium' | 'high'

export type Work = {
    '@id': string
    '@type': 'Work'
    id: number
    title: string
    description: string | null
    status: WorkStatus
    type: WorkType | null
    priority: WorkPriority | null
    author: string
    createdAt: string
    scheduledFor: string | null
    completedAt: string | null
    estimatedCost: number | null
    actualCost: number | null
    room: string | null // IRI '/api/rooms/{id}' — null si non localisés
    property: string // IRI '/api/properties/{id}'
    images: ImageRef[] // lecture seule, cf. API.md §4.12
}

// `author` est renseigné côté serveur : inutile de l'envoyer.
export type WorkCreatePayload = {
    title: string
    description?: string | null
    status?: WorkStatus
    type?: WorkType | null
    priority?: WorkPriority | null
    scheduledFor?: string | null
    estimatedCost?: number | null
    actualCost?: number | null
    room?: string | null
    property: string
}

export type WorkUpdatePayload = Partial<Omit<WorkCreatePayload, 'property'>>

export const worksApi = {
    // `property` restreint au logement actif (cf. API.md §2.5).
    list(property: string) {
        return apiClient.get<Work[]>('/api/works', { params: { property } })
    },
    get(id: number) {
        return apiClient.get<Work>(`/api/works/${id}`)
    },
    create(payload: WorkCreatePayload) {
        return apiClient.post<Work>('/api/works', payload)
    },
    update(id: number, payload: WorkUpdatePayload) {
        return apiClient.patch<Work>(`/api/works/${id}`, payload, {
            headers: { 'Content-Type': 'application/merge-patch+json' },
        })
    },
    remove(id: number) {
        return apiClient.delete<void>(`/api/works/${id}`)
    },
}

export function idFromIri(iri: string): number | null {
    const match = iri.match(/\/api\/works\/(\d+)/)
    return match ? Number(match[1]) : null
}
