import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createApiClient, destroyApiClient, type ConnectionConfig } from '@/services/apiClient'
import { testConnection } from '@/services/svwsService'
import { toAppError } from '@/services/errorService'

export const useAuthStore = defineStore('auth', () => {
  const baseUrl = ref('')
  const schema = ref('')
  const username = ref('')
  const connected = ref(false)
  const connecting = ref(false)
  const error = ref<string | null>(null)

  const isConnected = computed(() => connected.value)

  async function connect(config: ConnectionConfig): Promise<boolean> {
    connecting.value = true
    error.value = null
    try {
      createApiClient(config)
      const ok = await testConnection()
      if (ok) {
        baseUrl.value = config.baseUrl
        schema.value = config.schema
        username.value = config.username
        connected.value = true
        return true
      } else {
        destroyApiClient()
        error.value = 'Verbindung fehlgeschlagen – Server antwortet nicht korrekt'
        connected.value = false
        return false
      }
    } catch (e) {
      destroyApiClient()
      error.value = toAppError(e, 'auth').messageUser
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
  }

  return { baseUrl, schema, username, connected, connecting, error, isConnected, connect, disconnect }
})
