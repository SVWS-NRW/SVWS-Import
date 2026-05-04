import { getApiClient } from './apiClient'
import type { SchuelerNeu, SchuelerImportRow } from '@/models/Schueler'
import type { LehrerStammdaten, LehrerImportRow } from '@/models/Lehrer'
import { schuelerImportToApi } from '@/models/Schueler'
import { lehrerImportToApi } from '@/models/Lehrer'

export interface UploadResult {
  success: boolean
  id?: number
  error?: string
}

export async function testConnection(): Promise<boolean> {
  try {
    await getApiClient().get('/lehrer')
    return true
  } catch {
    return false
  }
}

export async function createSchueler(
  row: SchuelerImportRow,
  idSchuljahresabschnitt: number,
): Promise<UploadResult> {
  try {
    const payload: SchuelerNeu = schuelerImportToApi(row, idSchuljahresabschnitt)
    const response = await getApiClient().post('/schueler/create', payload)
    return { success: true, id: response.data.id }
  } catch (error: unknown) {
    return { success: false, error: extractErrorMessage(error) }
  }
}

export async function createLehrer(row: LehrerImportRow): Promise<UploadResult> {
  try {
    const payload: LehrerStammdaten = lehrerImportToApi(row)
    const response = await getApiClient().post('/lehrer/create', payload)
    return { success: true, id: response.data.id }
  } catch (error: unknown) {
    return { success: false, error: extractErrorMessage(error) }
  }
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status: number; data?: unknown } }
    const status = axiosError.response?.status
    const data = axiosError.response?.data
    if (status === 401) return 'Nicht autorisiert – Zugangsdaten prüfen'
    if (status === 409) return 'Datensatz existiert bereits'
    if (data && typeof data === 'string') return data
    if (data && typeof data === 'object') return JSON.stringify(data)
    return `HTTP ${status}`
  }
  if (error instanceof Error) return error.message
  return 'Unbekannter Fehler'
}
