import axios, { type AxiosInstance } from 'axios'

let client: AxiosInstance | null = null

export interface ConnectionConfig {
  baseUrl: string
  schema: string
  username: string
  password: string
}

export function createApiClient(config: ConnectionConfig): AxiosInstance {
  client = axios.create({
    baseURL: `${config.baseUrl}/db/${config.schema}`,
    headers: {
      'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
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
