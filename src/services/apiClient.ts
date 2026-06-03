import axios, { type AxiosInstance } from 'axios'

let client: AxiosInstance | null = null

export interface ConnectionConfig {
  baseUrl: string
  schema: string
  username: string
  password: string
}

function resolveBaseUrl(config: ConnectionConfig): string {
  if (import.meta.env.DEV) {
    return `/svws-proxy/db/${config.schema}`
  }
  return `${config.baseUrl}/db/${config.schema}`
}

export function createApiClient(config: ConnectionConfig): AxiosInstance {
  client = axios.create({
    baseURL: resolveBaseUrl(config),
    headers: {
      'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  })
  client.interceptors.request.use(cfg => {
    if (!cfg.method || cfg.method.toLowerCase() === 'get') {
      cfg.headers['Cache-Control'] = 'no-cache'
      cfg.headers['Pragma'] = 'no-cache'
    }
    if (import.meta.env.DEV) {
      cfg.headers['X-Proxy-Target'] = config.baseUrl
    }
    return cfg
  })
  return client
}

export function getApiClient(): AxiosInstance {
  if (!client) throw new Error('API-Client nicht initialisiert. Bitte zuerst verbinden.')
  return client
}

export function destroyApiClient(): void {
  client = null
}
