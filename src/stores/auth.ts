import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createApiClient, destroyApiClient, type ConnectionConfig } from '@/services/apiClient'
import { testConnection, diagnoseConnectionError } from '@/services/svwsService'
import { toAppError } from '@/services/errorService'

export const useAuthStore = defineStore('auth', () => {
  const baseUrl = ref('')
  const schema = ref('')
  const username = ref('')
  const connected = ref(false)
  const connecting = ref(false)
  const error = ref<string | null>(null)
  const certCheckUrl = ref<string | null>(null)

  const isConnected = computed(() => connected.value)

  async function connect(config: ConnectionConfig): Promise<boolean> {
    connecting.value = true
    error.value = null
    certCheckUrl.value = null
    try {
      createApiClient(config)
      await testConnection()
      baseUrl.value = config.baseUrl
      schema.value = config.schema
      username.value = config.username
      connected.value = true
      return true
    } catch (e) {
      destroyApiClient()
      const appError = toAppError(e, 'auth')
      console.error(`[auth] ${appError.messageTechnical}`)
      // Im Dev-Modus läuft alles über den Vite-Proxy – dort gibt es keine Zertifikats-/CORS-Probleme im Browser
      if (appError.type === 'network' && !import.meta.env.DEV) {
        const diagnosis = await diagnoseConnectionError(config.baseUrl)
        error.value = diagnosis.message
        certCheckUrl.value = diagnosis.certCheckUrl ?? null
      } else {
        error.value = appError.messageUser
      }
      connected.value = false
      return false
    } finally {
      connecting.value = false
    }
  }

  function disconnect(): void {
    destroyApiClient()
    connected.value = false
    baseUrl.value = ''
    schema.value = ''
    username.value = ''
    error.value = null
    certCheckUrl.value = null
  }

  return { baseUrl, schema, username, connected, connecting, error, certCheckUrl, isConnected, connect, disconnect }
})
