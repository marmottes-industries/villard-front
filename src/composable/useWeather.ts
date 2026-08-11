import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { type WeatherForecast, weatherApi } from '@/api/weather'
import { formatError } from '@/utils/formatError'
import { usePropertiesStore } from '@/stores/properties'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

export function useWeather() {
  const properties = usePropertiesStore()
  const { activePropertyIri } = storeToRefs(properties)

  const data = ref<WeatherForecast | null>(null)
  const state = ref<AsyncState>('idle')
  const errorMessage = ref<string | null>(null)

  async function fetch() {
    const property = activePropertyIri.value
    // Sans logement actif il n'y a pas de coordonnées : /api/weather renverrait 422.
    if (!property) {
      data.value = null
      state.value = 'idle'
      errorMessage.value = null
      return
    }

    state.value = 'loading'
    errorMessage.value = null

    try {
      const { data: forecast } = await weatherApi.get(property)
      data.value = forecast
      state.value = 'success'
    } catch (err) {
      state.value = 'error'
      errorMessage.value = formatError(err)
    }
  }

  // Recharge au montage puis à chaque bascule de logement : les coordonnées
  // météo sont portées par le logement (cf. API.md §12).
  watch(activePropertyIri, fetch, { immediate: true })

  return {
    data,
    state,
    errorMessage,
    fetch,
  }
}
