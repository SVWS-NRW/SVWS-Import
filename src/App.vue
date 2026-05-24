<template>
  <div class="app-shell" :class="{ 'has-nav': auth.isConnected }">
    <nav v-if="auth.isConnected" class="app-nav">
      <div class="nav-brand">SVWS-Import</div>
      <div class="nav-links">
        <RouterLink :to="{ name: 'import' }" class="nav-link">
          <i class="pi pi-file-import" /> Import
        </RouterLink>
        <RouterLink :to="{ name: 'export' }" class="nav-link">
          <i class="pi pi-file-export" /> Export
        </RouterLink>
        <RouterLink :to="{ name: 'schueler' }" class="nav-link" v-if="schuelerStore.totalCount > 0">
          <i class="pi pi-users" /> Schüler
          <Badge :value="schuelerStore.totalCount" severity="secondary" />
        </RouterLink>
        <RouterLink :to="{ name: 'lehrer' }" class="nav-link" v-if="lehrerStore.totalCount > 0">
          <i class="pi pi-id-card" /> Lehrer
          <Badge :value="lehrerStore.totalCount" severity="secondary" />
        </RouterLink>
      </div>
      <div class="nav-conn">
        <span class="conn-info">
          <i class="pi pi-circle-fill" style="color: #22c55e; font-size: 0.75rem;" />
          {{ auth.schema }}@{{ shortUrl }}
        </span>
        <Button
          :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
          severity="secondary"
          text
          :aria-label="isDark ? 'Hell-Modus aktivieren' : 'Dunkel-Modus aktivieren'"
          @click="toggleDark"
        />
        <Button
          label="Trennen"
          icon="pi pi-power-off"
          severity="secondary"
          text
          @click="handleDisconnect"
        />
      </div>
    </nav>

    <Button
      v-if="!auth.isConnected"
      :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
      size="small"
      severity="secondary"
      text
      class="dark-mode-fab"
      :aria-label="isDark ? 'Hell-Modus aktivieren' : 'Dunkel-Modus aktivieren'"
      @click="toggleDark"
    />

    <main class="app-main">
      <RouterView />
    </main>

    <Toast position="bottom-right" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { useSchuelerStore } from '@/stores/schueler'
import { useLehrerStore } from '@/stores/lehrer'
import { useDarkMode } from '@/composables/useDarkMode'
import { setToastService } from '@/services/errorService'

setToastService(useToast())
const { isDark, toggle: toggleDark } = useDarkMode()
const auth = useAuthStore()
const schuelerStore = useSchuelerStore()
const lehrerStore = useLehrerStore()
const router = useRouter()

const shortUrl = computed(() => {
  try {
    return new URL(auth.baseUrl).hostname
  } catch {
    return auth.baseUrl
  }
})

function handleDisconnect(): void {
  auth.disconnect()
  schuelerStore.clear()
  lehrerStore.clear()
  router.push({ name: 'connect' })
}
</script>

<style>
*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: system-ui, -apple-system, sans-serif;
}

#app {
  height: 100%;
}
</style>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0 1.75rem;
  height: 64px;
  background: var(--p-surface-card);
  border-bottom: 1px solid var(--p-surface-border);
  flex-shrink: 0;
}

.nav-brand {
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--p-primary-color);
  white-space: nowrap;
}

.nav-links {
  display: flex;
  gap: 0.35rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  color: var(--p-text-color);
  font-size: 1rem;
  transition: background 0.15s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: var(--p-primary-50);
  color: var(--p-primary-color);
}

.nav-conn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.conn-info {
  font-size: 0.9rem;
  color: var(--p-text-muted-color);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--p-surface-ground);
}

.dark-mode-fab {
  position: fixed;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 100;
}
</style>
