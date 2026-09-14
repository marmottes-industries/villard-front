import { AxiosError } from 'axios'
import { apiClient } from '@/api/client'
import { env } from '@/config/env'
import { formatError } from '@/utils/formatError'

/** Image embarquée dans `Note.images` / `Work.images` (cf. API.md §4.12). */
export type ImageRef = {
    '@id': string
    '@type': 'Image'
    id: number
    mimeType: string
    size: number
    width: number
    height: number
    createdAt: string
    // Chemin signé et temporaire : à préfixer avec l'URL de l'API, jamais à persister.
    url: string
}

export type ImageParent = { note: string } | { work: string }

/** Modifications d'images faites dans une modale, appliquées à l'enregistrement. */
export type ImageChanges = {
    newFiles: File[]
    removedImageIds: number[]
}

export const MAX_IMAGES = 10
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024
// HEIC volontairement absent : le serveur le refuse.
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const imagesApi = {
    upload(file: File, parent: ImageParent) {
        const form = new FormData()
        form.append('file', file)
        if ('note' in parent) form.append('note', parent.note)
        else form.append('work', parent.work)
        // Le client force `application/json` par défaut : on le remplace, axios
        // complète alors la boundary du multipart.
        return apiClient.post<ImageRef>('/api/images', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    remove(id: number) {
        return apiClient.delete<void>(`/api/images/${id}`)
    },
}

export function imageSrc(image: ImageRef): string {
    return `${env.apiUrl.replace(/\/+$/, '')}${image.url}`
}

/**
 * Supprime puis envoie les images, une requête à la fois. Ne s'arrête pas au
 * premier échec : le parent est déjà enregistré, autant sauver ce qui passe.
 * Renvoie un message récapitulatif, ou `null` si tout est passé.
 */
export async function applyImageChanges(parent: ImageParent, changes?: ImageChanges): Promise<string | null> {
    if (!changes) return null

    let failed = 0
    let lastError: unknown = null

    for (const id of changes.removedImageIds) {
        try {
            await imagesApi.remove(id)
        } catch (err) {
            failed++
            lastError = err
        }
    }

    for (const file of changes.newFiles) {
        try {
            await imagesApi.upload(file, parent)
        } catch (err) {
            failed++
            lastError = err
        }
    }

    if (failed === 0) return null
    const label = failed > 1 ? `${failed} opérations sur les photos ont échoué` : 'Une opération sur les photos a échoué'
    return `${label} : ${formatImageError(lastError)}`
}

/** Remonte le message métier du serveur (format refusé, limite atteinte…) plutôt qu'un message générique. */
export function formatImageError(err: unknown): string {
    if (err instanceof AxiosError) {
        const status = err.response?.status
        const data = err.response?.data as { detail?: string; violations?: { message: string }[] } | undefined
        if (status === 413) return 'Image trop volumineuse pour le serveur.'
        if (status === 422) return data?.violations?.[0]?.message ?? data?.detail ?? 'Image refusée.'
    }
    return formatError(err)
}
