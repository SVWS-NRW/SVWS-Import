<template>
  <div class="connect-wrapper">
    <div class="connect-card">
      <div class="connect-header">
        <h1>SVWS-Import</h1>
        <p>Verbindung zum SVWS-Server herstellen</p>
      </div>

      <form @submit.prevent="handleConnect" class="connect-form">
        <div class="field">
          <label for="baseUrl">Server-URL</label>
          <InputText
            id="baseUrl"
            v-model="form.baseUrl"
            placeholder="https://svws.schule.de"
            :disabled="auth.connecting"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="schema">Schema</label>
          <InputText
            id="schema"
            v-model="form.schema"
            placeholder="schulname"
            :disabled="auth.connecting"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="username">Benutzername</label>
          <InputText
            id="username"
            v-model="form.username"
            autocomplete="username"
            :disabled="auth.connecting"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="password">Passwort</label>
          <Password
            id="password"
            v-model="form.password"
            :feedback="false"
            toggleMask
            autocomplete="current-password"
            :disabled="auth.connecting"
            class="w-full"
            inputClass="w-full"
          />
        </div>

        <Message v-if="auth.error" severity="error" :closable="false">
          {{ auth.error }}
        </Message>

        <Button
          type="submit"
          label="Verbinden"
          icon="pi pi-plug"
          :loading="auth.connecting"
          :disabled="!isFormValid"
          class="w-full connect-btn"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  baseUrl: import.meta.env.VITE_SVWS_URL ?? '',
  schema: import.meta.env.VITE_SVWS_SCHEMA ?? '',
  username: import.meta.env.VITE_SVWS_USERNAME ?? '',
  password: import.meta.env.VITE_SVWS_PASSWORD ?? '',
})

const isFormValid = computed(() =>
  form.baseUrl.trim() && form.schema.trim() && form.username.trim()
)

async function handleConnect(): Promise<void> {
  const ok = await auth.connect({
    baseUrl: form.baseUrl.trim().replace(/\/$/, ''),
    schema: form.schema.trim(),
    username: form.username.trim(),
    password: form.password,
  })
  if (ok) {
    form.password = ''
    router.push({ name: 'import' })
  }
}
</script>

<style scoped>
.connect-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--p-surface-ground);
}

.connect-card {
  background: var(--p-surface-card);
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}

.connect-header {
  text-align: center;
  margin-bottom: 2rem;
}

.connect-header h1 {
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--p-primary-color);
}

.connect-header p {
  margin: 0;
  color: var(--p-text-muted-color);
}

.connect-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--p-text-color);
}

.connect-btn {
  margin-top: 0.5rem;
}

.w-full {
  width: 100%;
}
</style>
