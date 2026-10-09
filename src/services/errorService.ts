import type { ToastServiceMethods } from 'primevue/toastservice'
import type { AppError, AppErrorType, AppErrorSeverity } from '@/models/AppError'

let _toast: ToastServiceMethods | null = null

export function setToastService(toast: ToastServiceMethods): void {
  _toast = toast
}

function generateId(): string {
  return `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function classifyStatus(status: number): { type: AppErrorType; messageUser: string } {
  if (status === 401) return { type: 'api', messageUser: 'Nicht autorisiert – Zugangsdaten prüfen' }
  if (status === 403) return { type: 'api', messageUser: 'Zugriff verweigert' }
  if (status === 409) return { type: 'api', messageUser: 'Datensatz existiert bereits' }
  if (status >= 500) return { type: 'api', messageUser: 'Server-Fehler' }
  return { type: 'api', messageUser: `HTTP ${status}` }
}

/** Liest eine lesbare Fehlermeldung aus dem Response-Body (Text oder JSON mit message/log). */
function extractServerMessage(data: unknown): string {
  let text = ''
  if (typeof data === 'string') {
    text = data
  } else if (data && typeof data === 'object') {
    const d = data as { message?: unknown; log?: unknown }
    if (typeof d.message === 'string') text = d.message
    else if (Array.isArray(d.log)) text = d.log.filter(l => typeof l === 'string').join(' ')
  }
  text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 300 ? `${text.slice(0, 300)}…` : text
}

export function toAppError(input: unknown, source?: string): AppError {
  const id = generateId()
  const timestamp = new Date().toISOString()
  const context = source ? { source } : undefined

  // Axios / HTTP-Fehler (hat response-Objekt)
  if (input && typeof input === 'object' && 'response' in input) {
    const axiosErr = input as { response?: { status: number; data?: unknown } }
    const status = axiosErr.response?.status ?? 0
    const data = axiosErr.response?.data
    const classified = classifyStatus(status)
    const messageTechnical =
      typeof data === 'string' ? data
      : data && typeof data === 'object' ? JSON.stringify(data)
      : `HTTP ${status}`
    // Bei allgemeinen Statuscodes (z.B. 400, 404) die Begründung des Servers mit anzeigen
    const serverText = classified.messageUser.startsWith('HTTP') ? extractServerMessage(data) : ''
    const messageUser = serverText ? `${classified.messageUser}: ${serverText}` : classified.messageUser
    return { id, type: classified.type, severity: 'error', messageUser, messageTechnical, timestamp, context }
  }

  // Netzwerkfehler ohne Response
  if (input && typeof input === 'object' && 'code' in input) {
    const netErr = input as { code?: string; message?: string }
    if (netErr.code === 'ERR_NETWORK' || netErr.code === 'ECONNREFUSED' || netErr.code === 'ERR_CANCELED') {
      return {
        id, type: 'network', severity: 'error',
        messageUser: 'Server nicht erreichbar – Verbindung prüfen',
        messageTechnical: netErr.message ?? netErr.code ?? 'Netzwerkfehler',
        timestamp, context,
      }
    }
  }

  // Standard JS Error
  if (input instanceof Error) {
    return {
      id, type: 'unexpected', severity: 'error',
      messageUser: input.message,
      messageTechnical: input.stack ?? input.message,
      timestamp, context,
    }
  }

  return {
    id, type: 'unexpected', severity: 'error',
    messageUser: 'Unbekannter Fehler',
    messageTechnical: String(input),
    timestamp, context,
  }
}

export function reportError(error: AppError): void {
  console.error(`[${error.context?.source ?? error.type}] ${error.messageTechnical}`)
  _toast?.add({
    severity: error.severity === 'warn' ? 'warn' : 'error',
    summary: severityLabel(error.severity),
    detail: error.messageUser,
    life: 6000,
  })
}

export function reportInfo(message: string, source?: string): void {
  console.info(`[${source ?? 'app'}] ${message}`)
  _toast?.add({ severity: 'info', summary: 'Info', detail: message, life: 3000 })
}

function severityLabel(s: AppErrorSeverity): string {
  if (s === 'warn') return 'Warnung'
  if (s === 'info') return 'Info'
  return 'Fehler'
}
