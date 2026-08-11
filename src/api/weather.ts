import { apiClient } from '@/api/client.ts'

export interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
  snowDepth: number // m (snowpack on the ground)
  time: string // ISO local datetime
}

export interface DailyForecast {
  date: string // ISO 'YYYY-MM-DD'
  weatherCode: number
  tempMin: number
  tempMax: number
  precipitation: number // mm
  snowfall: number // cm
  windMax: number // km/h
  uvMax: number
}

export interface AirQuality {
  europeanAqi: number | null
  pm25: number | null
  pm10: number | null
}

// Points météo d'un logement. Les clés sont stables d'un logement à l'autre :
// 'main' est le logement lui-même, 'secondary' un point d'altitude optionnel.
// Un logement sans point secondaire ne renvoie qu'une seule entrée (cf. API.md §12).
export const MAIN_LOCATION_KEY = 'main'

export interface LocationForecast {
  key: string // 'main' | 'secondary'
  name: string
  latitude: number
  longitude: number
  elevation: number // m
  current: CurrentWeather
  daily: DailyForecast[]
  airQuality: AirQuality
}

export interface WeatherForecast {
  timezone: string
  locations: LocationForecast[]
}

export const weatherApi = {
  // `property` est obligatoire dès que l'utilisateur a plusieurs logements (422 sinon).
  get(property: string) {
    return apiClient.get<WeatherForecast>('/api/weather', { params: { property } })
  },
}

/** Point météo à afficher par défaut : le logement lui-même, sinon le premier disponible. */
export function mainLocation(locations: LocationForecast[]): LocationForecast | null {
  return locations.find(l => l.key === MAIN_LOCATION_KEY) ?? locations[0] ?? null
}
