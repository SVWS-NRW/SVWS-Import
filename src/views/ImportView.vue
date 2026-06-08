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
      <div class="import-card" @click="router.push({ name: 'schueler' })" title="Schülerinnen und Schüler anlegen">
        <i class="pi pi-users card-icon" />
        <strong>Schülerdaten</strong>
      </div>
      <div class="import-card" @click="router.push({ name: 'lehrer' })" title="Lehrkräfte anlegen">
        <i class="pi pi-id-card card-icon" />
        <strong>Lehrerdaten</strong>
      </div>
      <div class="import-card" @click="router.push({ name: 'klassen' })" title="Klassen anlegen">
        <i class="pi pi-sitemap card-icon" />
        <strong>Klassen</strong>
      </div>
      <div class="import-card" @click="router.push({ name: 'jahrgaenge' })" title="Jahrgangsstufen anlegen">
        <i class="pi pi-calendar card-icon" />
        <strong>Jahrgänge</strong>
      </div>
      <div class="import-card" @click="router.push({ name: 'faecher' })" title="Fächer anlegen">
        <i class="pi pi-book card-icon" />
        <strong>Fächer</strong>
      </div>
      <div class="import-card" @click="router.push({ name: 'schuljahresabschnitte' })" title="Bestehende Abschnitte laden und neue anlegen">
        <i class="pi pi-calendar-plus card-icon" />
        <strong>Schuljahresabschnitte</strong>
      </div>
      <div class="import-card" @click="router.push({ name: 'floskeln' })" title="Floskeln anzeigen, filtern, löschen und importieren">
        <i class="pi pi-comment card-icon" />
        <strong>Floskeln verwalten</strong>
      </div>
      <div class="import-card" @click="router.push({ name: 'betriebe' })" title="Betriebe und Ansprechpartner anlegen">
        <i class="pi pi-building card-icon" />
        <strong>Betriebe</strong>
      </div>
      <div class="import-card" @click="router.push({ name: 'ortsteile' })" title="Ortsteile anlegen und verwalten">
        <i class="pi pi-map-marker card-icon" />
        <strong>Ortsteile verwalten</strong>
      </div>
      <div class="import-card" @click="router.push({ name: 'unterricht' })" title="Klassenunterricht und Kursunterricht importieren">
        <i class="pi pi-book card-icon" />
        <strong>Unterricht</strong>
      </div>
      <div class="import-card wizard-card" @click="router.push({ name: 'wizard' })" title="Geführter Import Schritt für Schritt">
        <i class="pi pi-list-check card-icon" />
        <strong>Import-Assistent</strong>
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
        <strong>{{ mod.label }}</strong>
        <span class="coming-soon-badge">In Vorbereitung</span>
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
  max-width: 780px;
  margin: 0 auto;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

h2 {
  margin: 0;
  font-size: 1.25rem;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: var(--p-text-muted-color);
}

.import-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.625rem;
}

@media (max-width: 640px) {
  .import-cards {
    grid-template-columns: repeat(2, 1fr);
  }
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
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
  font-size: 1.5rem;
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
  font-size: 0.85rem;
  line-height: 1.2;
}

.import-card small {
  color: var(--p-text-muted-color);
  display: block;
  font-size: 0.72rem;
  line-height: 1.3;
}
</style>
