export type AppErrorType = 'api' | 'network' | 'validation' | 'parsing' | 'unexpected'
export type AppErrorSeverity = 'error' | 'warn' | 'info'

export interface AppErrorContext {
  source?: string
  [key: string]: unknown
}

export interface AppError {
  id: string
  type: AppErrorType
  severity: AppErrorSeverity
  messageUser: string
  messageTechnical: string
  timestamp: string
  context?: AppErrorContext
}
