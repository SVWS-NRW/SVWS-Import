<template>
  <div class="import-view">
    <div class="view-header">
      <div>
        <h2>Daten importieren</h2>
        <p class="subtitle">Wähle den Datentyp, den du importieren möchtest.</p>
      </div>
      <Button
        icon="pi pi-question-circle"
        label="Hilfe"
        severity="secondary"
        outlined
        @click="router.push({ name: 'help' })"
      />
    </div>

    <div class="import-cards">
      <div class="import-card" @click="router.push({ name: 'schueler' })">
        <i class="pi pi-users card-icon" />
        <div>
          <strong>Schülerdaten</strong>
          <small>Schülerinnen und Schüler anlegen</small>
        </div>
      </div>
      <div class="import-card" @click="router.push({ name: 'lehrer' })">
        <i class="pi pi-id-card card-icon" />
        <div>
          <strong>Lehrerdaten</strong>
          <small>Lehrkräfte anlegen</small>
        </div>
      </div>
      <div class="import-card wizard-card" @click="router.push({ name: 'wizard' })">
        <i class="pi pi-list-check card-icon" />
        <div>
          <strong>Import-Assistent</strong>
          <small>Geführter Import Schritt für Schritt</small>
        </div>
      </div>
    </div>

    <div class="import-cards">
      <div class="import-card" @click="router.push({ name: 'klassen' })">
        <i class="pi pi-sitemap card-icon" />
        <div>
          <strong>Klassen</strong>
          <small>Klassen anlegen</small>
        </div>
      </div>
      <div class="import-card" @click="router.push({ name: 'jahrgaenge' })">
        <i class="pi pi-calendar card-icon" />
        <div>
          <strong>Jahrgänge</strong>
          <small>Jahrgangsstufen anlegen</small>
        </div>
      </div>
      <div class="import-card" @click="router.push({ name: 'faecher' })">
        <i class="pi pi-book card-icon" />
        <div>
          <strong>Fächer</strong>
          <small>Fächer anlegen</small>
        </div>
      </div>
      <div class="import-card" @click="router.push({ name: 'schuljahresabschnitte' })">
        <i class="pi pi-calendar-plus card-icon" />
        <div>
          <strong>Schuljahresabschnitte anlegen</strong>
          <small>Bestehende Abschnitte laden und neue anlegen</small>
        </div>
      </div>
      <div class="import-card" @click="router.push({ name: 'floskeln' })">
        <i class="pi pi-comment card-icon" />
        <div>
          <strong>Floskeln verwalten</strong>
          <small>Floskeln anzeigen, filtern, löschen und importieren</small>
        </div>
      </div>
    </div>

    <div class="import-cards coming-soon-cards">
      <div
        v-for="mod in comingSoonModules"
        :key="mod.id"
        class="import-card coming-soon"
        title="Noch nicht verfügbar"
      >
        <i :class="[mod.icon, 'card-icon']" />
        <div>
          <strong>{{ mod.label }}</strong>
          <small>{{ mod.description }}</small>
          <span class="coming-soon-badge">In Vorbereitung</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { importModules } from '@/schemas'
import Button from 'primevue/button'

const router = useRouter()

const comingSoonModules = importModules.filter(m => m.comingSoon)
</script>

<style scoped>
.import-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

h2 {
  margin: 0;
  font-size: 1.5rem;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: var(--p-text-muted-color);
}

.import-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.wizard-card {
  border-style: dashed;
}

.coming-soon-cards {
  margin-top: -0.25rem;
}

.import-card.coming-soon {
  opacity: 0.55;
  cursor: not-allowed;
  border-style: dashed;
}

.import-card.coming-soon:hover {
  border-color: var(--p-surface-border);
}

.coming-soon-badge {
  display: inline-block;
  margin-top: 0.25rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
  background: var(--p-surface-200, #e5e7eb);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
}

:global(.dark) .coming-soon-badge {
  background: var(--p-surface-700, #374151);
}

.import-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 2px solid var(--p-surface-border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: var(--p-surface-card);
}

.import-card:hover {
  border-color: var(--p-primary-400);
}

.import-card.active {
  border-color: var(--p-primary-color);
  background: var(--p-primary-50);
}

:global(.dark) .import-card.active {
  background: color-mix(in srgb, var(--p-primary-color) 18%, var(--p-surface-card));
}

.card-icon {
  font-size: 2rem;
  color: var(--p-primary-color);
}

.import-card.active .card-icon {
  color: var(--p-primary-700);
}

.import-card.active strong {
  color: var(--p-primary-900);
}

.import-card.active small {
  color: var(--p-primary-700);
}

.import-card strong {
  display: block;
  font-size: 1rem;
}

.import-card small {
  color: var(--p-text-muted-color);
}


</style>
