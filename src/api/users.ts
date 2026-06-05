import { apiClient } from './client'

export interface ApiUser {
  id: number
  username: string
  roles: string[]
}

export const usersApi = {
  list() {
    return apiClient.get<ApiUser[]>('/api/users')
  },
}

export function userIri(id: number): string {
  return `/api/users/${id}`
}

export function idFromIri(iri: string): number | null {
  const match = iri.match(/\/api\/users\/(\d+)/)
  return match ? Number(match[1]) : null
}
