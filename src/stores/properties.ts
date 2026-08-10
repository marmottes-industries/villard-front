import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Membership, PropertyRole, PropertySummary } from '@/api/properties'

const ACTIVE_PROPERTY_STORAGE_KEY = 'marmotte.activeProperty'

function readStoredId(): number | null {
    const raw = localStorage.getItem(ACTIVE_PROPERTY_STORAGE_KEY)
    if (!raw) return null
    const id = Number(raw)
    return Number.isInteger(id) ? id : null
}

export const usePropertiesStore = defineStore('properties', () => {
    const auth = useAuthStore()
    const activePropertyId = ref<number | null>(readStoredId())

    // La liste est amorcée depuis /api/me : aucun appel supplémentaire au démarrage.
    const memberships = computed<Membership[]>(() => auth.user?.memberships ?? [])

    // Un logement archivé reste lisible côté API : c'est au front de le masquer du sélecteur.
    const properties = computed<PropertySummary[]>(() =>
        memberships.value.map(m => m.property).filter(p => !p.archived),
    )

    const hasProperties = computed(() => properties.value.length > 0)
    const isMultiProperty = computed(() => properties.value.length > 1)

    // Repli sur le premier logement disponible si l'identifiant mémorisé n'est plus
    // valide (logement retiré de l'utilisateur, ou archivé depuis).
    const activeProperty = computed<PropertySummary | null>(
        () =>
            properties.value.find(p => p.id === activePropertyId.value)
            ?? properties.value[0]
            ?? null,
    )

    const activePropertyIri = computed<string | null>(() => activeProperty.value?.['@id'] ?? null)

    const isAdmin = computed(() => auth.user?.roles.includes('ROLE_ADMIN') ?? false)

    function roleFor(propertyIri: string): PropertyRole | null {
        return memberships.value.find(m => m.property['@id'] === propertyIri)?.role ?? null
    }

    // ROLE_ADMIN traverse tous les logements (cf. API.md §2.4).
    function canManage(propertyIri: string): boolean {
        return isAdmin.value || roleFor(propertyIri) === 'manager'
    }

    const canManageActive = computed(() =>
        activePropertyIri.value ? canManage(activePropertyIri.value) : false,
    )

    function setActive(id: number) {
        activePropertyId.value = id
    }

    // Réaligne le stockage sur le logement réellement actif : le repli ci-dessus
    // est ainsi mémorisé et l'identifiant périmé remplacé. On ne touche à rien
    // quand il n'y a pas de logement (déconnexion, /api/me pas encore chargé) :
    // le choix de l'utilisateur survit à une reconnexion.
    watch(
        activeProperty,
        (property) => {
            if (!property) return
            activePropertyId.value = property.id
            localStorage.setItem(ACTIVE_PROPERTY_STORAGE_KEY, String(property.id))
        },
        { immediate: true },
    )

    return {
        properties,
        memberships,
        hasProperties,
        isMultiProperty,
        activePropertyId,
        activeProperty,
        activePropertyIri,
        canManageActive,
        isAdmin,
        roleFor,
        canManage,
        setActive,
    }
})
