import { onMounted, ref } from 'vue'
import { type WeatherForecast, weatherApi } from '@/api/weather'
import { formatError } from '@/utils/formatError'

type AsyncState = 'idle' | 'loading' | 'error' | 'success'

export function useWeather() {
  const data = ref<WeatherForecast | null>(null)
  const state = ref<AsyncState>('idle')
  const errorMessage = ref<string | null>(null)

  async function fetch() {
    state.value = 'loading'
    errorMessage.value = null

    try {
      const { data: forecast } = await weatherApi.get()
      data.value = forecast
      state.value = 'success'
    } catch (err) {
      state.value = 'error'
      errorMessage.value = formatError(err)
    }
  }

  onMounted(fetch)

  return {
    data,
    state,
    errorMessage,
    fetch,
  }
}
