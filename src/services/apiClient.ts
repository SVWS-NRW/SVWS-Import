import axios, { type AxiosInstance } from 'axios'

let client: AxiosInstance | null = null
let rootClient: AxiosInstance | null = null

export interface ConnectionConfig {
  baseUrl: string
  schema: string
  username: string
  password: string
}

function applyInterceptors(instance: AxiosInstance, config: ConnectionConfig): void {
  instance.interceptors.request.use(cfg => {
    if (!cfg.method || cfg.method.toLowerCase() === 'get') {
      cfg.headers['Cache-Control'] = 'no-cache'
      cfg.headers['Pragma'] = 'no-cache'
    }
    if (import.meta.env.DEV) {
      cfg.headers['X-Proxy-Target'] = config.baseUrl
    }
    return cfg
  })
}

export function createApiClient(config: ConnectionConfig): AxiosInstance {
  const schemaBaseUrl = import.meta.env.DEV
    ? `/svws-proxy/db/${config.schema}`
    : `${config.baseUrl}/db/${config.schema}`

  const rootBaseUrl = import.meta.env.DEV
    ? '/svws-proxy'
    : config.baseUrl

  const authHeader = `Basic ${btoa(`${config.username}:${config.password}`)}`

  client = axios.create({
    baseURL: schemaBaseUrl,
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    timeout: 30000,
  })
  applyInterceptors(client, config)

  rootClient = axios.create({
    baseURL: rootBaseUrl,
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    timeout: 30000,
  })
  applyInterceptors(rootClient, config)

  return client
}

export function getApiClient(): AxiosInstance {
  if (!client) throw new Error('API-Client nicht initialisiert. Bitte zuerst verbinden.')
  return client
}

/** Client für Endpunkte ohne /db/{schema}-Prefix (z.B. /types/allinone.json) */
export function getRootClient(): AxiosInstance {
  if (!rootClient) throw new Error('API-Client nicht initialisiert. Bitte zuerst verbinden.')
  return rootClient
}

export function destroyApiClient(): void {
  client = null
  rootClient = null
}
