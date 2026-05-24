import axios, { type AxiosInstance } from 'axios'

let client: AxiosInstance | null = null

export interface ConnectionConfig {
  baseUrl: string
  schema: string
  username: string
  password: string
}

function resolveBaseUrl(config: ConnectionConfig): string {
  // Im Dev-Modus über den Vite-Proxy leiten, damit CORS nicht greift.
  // Der Proxy in vite.config.ts leitet /svws-proxy/* an VITE_SVWS_URL weiter.
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
  client.interceptors.request.use(config => {
    if (!config.method || config.method.toLowerCase() === 'get') {
      config.headers['Cache-Control'] = 'no-cache'
      config.headers['Pragma'] = 'no-cache'
    }
    return config
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
