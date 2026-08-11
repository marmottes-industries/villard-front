import { apiClient } from '@/api/client'

export type Note = {
    '@id': string
    '@type': 'Note'
    id: number
    title: string
    content: string
    createdAt: string
    author: string
    property: string // IRI '/api/properties/{id}'
}

// `author` est renseigné côté serveur : inutile de l'envoyer.
export type NoteCreatePayload = {
    title: string
    content: string
    property: string
}

export type NoteUpdatePayload = Partial<Omit<NoteCreatePayload, 'property'>>

export const notesApi = {
    // `property` restreint au logement actif (cf. API.md §2.5).
    list(property: string) {
        return apiClient.get<Note[]>('/api/notes', { params: { property } })
    },
    create(payload: NoteCreatePayload) {
        return apiClient.post<Note>('/api/notes', payload)
    },
    update(id: number, payload: NoteUpdatePayload) {
        return apiClient.patch<Note>(`/api/notes/${id}`, payload, {
            headers: { 'Content-Type': 'application/merge-patch+json' },
        })
    },
    remove(id: number) {
        return apiClient.delete<void>(`/api/notes/${id}`)
    },
}

export function idFromIri(iri: string): number | null {
    const match = iri.match(/\/api\/notes\/(\d+)/)
    return match ? Number(match[1]) : null
}
