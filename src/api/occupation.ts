import {apiClient} from "@/api/client.ts";

export interface Occupation {
    id: number;
    startDate: string; // ISO 'YYYY-MM-DD'
    endDate: string; // ISO 'YYYY-MM-DD'
    notes?: string;
    occupant: string; // IRI '/api/users/{id}'
    property: string; // IRI '/api/properties/{id}'
}

export interface OccupationCreatePayload {
    startDate: string,
    endDate: string,
    notes?: string,
    occupant: string,
    property: string,
}

export interface OccupationUpdatePayload {
    startDate?: string,
    endDate?: string,
    notes?: string,
    occupant?: string,
}

export const occupationsApi = {
    // `property` restreint au logement actif. Le serveur cloisonne de toute façon
    // (cf. API.md §2.5) : sans le paramètre, on afficherait tous les logements mélangés.
    list(property: string) {
        return apiClient.get<Occupation[]>('/api/occupations', { params: { property } })
    },
    get(id: number) {
        return apiClient.get<Occupation>(`/api/occupations/${id}`)
    },
    create(payload: OccupationCreatePayload) {
        return apiClient.post<Occupation>('/api/occupations', payload)
    },
    update(id: number, payload: OccupationUpdatePayload) {
        return apiClient.patch<Occupation>(`/api/occupations/${id}`, payload, {
            headers: {'Content-Type': 'application/merge-patch+json'}
        })
    },
    remove(id: number) {
        return apiClient.delete<void>(`/api/occupations/${id}`)
    }
}
