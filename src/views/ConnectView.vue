<template>
  <div class="connect-wrapper">
    <div class="connect-card">
      <div class="connect-header">
        <h1>SVWS-Import</h1>
        <span class="version">v{{ version }}</span>
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
          size="small"
          :loading="auth.connecting"
          :disabled="!isFormValid"
          class="w-full connect-btn"
        />
      </form>
    </div>

    <div class="footer-links">
      <a
        class="footer-link"
        href="https://svws-nrw.github.io/SVWS-Import/"
        target="_blank"
        rel="noopener noreferrer"
      >Hilfe</a>
      <button class="footer-link" type="button" @click="openImpressumModal()">Impressum</button>
      <button class="footer-link" type="button" @click="datenschutzOpen = true">Datenschutzhinweise</button>
    </div>
  </div>

  <Dialog
    v-model:visible="impressumOpen"
    header="Impressum"
    :modal="true"
    :draggable="false"
    :style="{ width: 'min(700px, calc(100vw - 2rem))' }"
  >
    <p v-if="impressumLoading" class="modal-status">Impressum wird geladen...</p>
    <p v-else-if="impressumError" class="modal-error">{{ impressumError }}</p>
    <div v-else class="modal-content" v-html="impressumHtml" />
  </Dialog>

  <Dialog
    v-model:visible="datenschutzOpen"
    header="Datenschutzhinweise"
    :modal="true"
    :draggable="false"
    :style="{ width: 'min(700px, calc(100vw - 2rem))' }"
  >
    <div class="modal-content" v-html="datenschutzHtml" />
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { version } from '../../package.json'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSchuleStore } from '@/stores/schule'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import datenschutzRawMd from '../../docs/datenschutz.md?raw'

const auth = useAuthStore()
const schuleStore = useSchuleStore()
const router = useRouter()

type ImpressumWindow = Window & { __IMPRESSUM_MARKDOWN__?: string }

const impressumOpen = ref(false)
const impressumLoading = ref(false)
const impressumHtml = ref('')
const impressumError = ref('')

const datenschutzOpen = ref(false)
const datenschutzHtml = DOMPurify.sanitize(marked.parse(datenschutzRawMd, { async: false }))

async function loadImpressumScript(): Promise<string> {
  const existing = (window as ImpressumWindow).__IMPRESSUM_MARKDOWN__
  if (existing != null) return existing

  await new Promise<void>((resolve, reject) => {
    function loadScript(src: string, onError: () => void) {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = onError
      document.head.appendChild(script)
    }
    const primary = new URL('impressum.js', window.location.href).toString()
    const fallback = new URL('impressum.example.js', window.location.href).toString()
    loadScript(primary, () => {
      loadScript(fallback, () => {
        reject(new Error(
          'Weder "impressum.js" noch "impressum.example.js" wurden gefunden. ' +
          'Bitte benennen Sie "impressum.example.js" in "impressum.js" um und tragen Sie dort Ihre Schuldaten ein.'
        ))
      })
    })
  })

  const loaded = (window as ImpressumWindow).__IMPRESSUM_MARKDOWN__
  if (loaded == null) throw new Error('Die Datei "impressum.js" enthält keinen Impressumstext.')
  return loaded
}

async function openImpressumModal() {
  impressumOpen.value = true
  if (impressumLoading.value || impressumHtml.value) return

  impressumLoading.value = true
  impressumError.value = ''
  try {
    let content: string
    if (import.meta.env.DEV) {
      const targetUrl = new URL('impressum.md', window.location.href).toString()
      const response = await fetch(targetUrl, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Datei konnte nicht geladen werden (${response.status}).`)
      content = await response.text()
    } else {
      content = await loadImpressumScript()
    }
    impressumHtml.value = DOMPurify.sanitize(marked.parse(content, { async: false }))
  } catch (error) {
    impressumError.value = `Impressum konnte nicht geladen werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
  } finally {
    impressumLoading.value = false
  }
}

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
  schuleStore.reset()
  const ok = await auth.connect({
    baseUrl: form.baseUrl.trim().replace(/\/$/, ''),
    schema: form.schema.trim(),
    username: form.username.trim(),
    password: form.password,
  })
  if (ok) {
    form.password = ''
    await schuleStore.fetch()
    router.push({ name: 'import' })
  }
}
</script>

<style scoped>
.connect-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--p-surface-ground);
}

.connect-card {
  background: var(--p-surface-card);
  border-radius: 10px;
  padding: 1.5rem;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}

.connect-header {
  text-align: center;
  margin-bottom: 1rem;
}

.connect-header h1 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--p-primary-color);
}

.connect-header .version {
  display: block;
  font-size: 0.65rem;
  color: var(--p-text-muted-color);
  margin-bottom: 0.25rem;
}

.connect-header p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}

.connect-form {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--p-text-color);
}

.connect-btn {
  margin-top: 0.25rem;
}

:deep(.p-inputtext),
:deep(.p-password-input) {
  font-size: 0.78rem;
  padding: 0.3rem 0.5rem;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-password input) {
  width: 100%;
}

:deep(.p-password .p-password-toggle-mask-icon) {
  width: 0.75rem;
  height: 0.75rem;
}

:deep(.p-button) {
  font-size: 0.78rem;
  padding: 0.3rem 0.75rem;
}

.w-full {
  width: 100%;
}

.footer-links {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.footer-link {
  border: none;
  background: transparent;
  color: var(--p-primary-color);
  text-decoration: underline;
  text-underline-offset: 2px;
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.15rem 0.3rem;
}

.footer-link:hover {
  opacity: 0.75;
}

.modal-status {
  margin: 0;
  padding: 0.5rem 0;
  color: var(--p-text-muted-color);
}

.modal-error {
  margin: 0;
  padding: 0.5rem 0;
  color: var(--p-red-500, #ef4444);
}

.modal-content {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--p-text-color);
  max-height: 70vh;
  overflow-y: auto;
}

.modal-content :deep(h1),
.modal-content :deep(h2),
.modal-content :deep(h3) {
  margin: 0.8rem 0 0.35rem;
  line-height: 1.25;
}

.modal-content :deep(h2) { font-size: 1rem; }
.modal-content :deep(h3) { font-size: 0.9rem; }

.modal-content :deep(p),
.modal-content :deep(ul),
.modal-content :deep(ol) {
  margin: 0.4rem 0;
}

.modal-content :deep(ul),
.modal-content :deep(ol) {
  padding-left: 1.2rem;
}

.modal-content :deep(a) {
  color: var(--p-primary-color);
  word-break: break-word;
}

.modal-content :deep(strong) {
  font-weight: 700;
}
</style>
