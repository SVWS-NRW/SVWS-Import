<template>
  <div class="wizard-placeholder">
    <div class="wizard-placeholder__icon">
      <i class="pi pi-file-import" />
    </div>
    <h2>Import-Wizard</h2>
    <p>
      Der geführte Import-Wizard (ADR 0015) wird hier implementiert.<br />
      Die konzeptionelle Architektur ist bereit:
    </p>
    <ul>
      <li><strong>Schritt 1</strong> – Datei-Upload &amp; Modul-Auswahl</li>
      <li><strong>Schritt 2</strong> – Rohdaten-Vorschau</li>
      <li><strong>Schritt 3</strong> – Spalten-Mapping (mit Auto-Vorschlag)</li>
      <li><strong>Schritt 4</strong> – Import-Vorschau &amp; Inline-Korrektur</li>
      <li><strong>Schritt 5</strong> – Versand an SVWS</li>
    </ul>
    <div class="wizard-placeholder__modules">
      <div
        v-for="mod in modules"
        :key="mod.id"
        class="module-card"
      >
        <i :class="mod.icon" />
        <div>
          <strong>{{ mod.label }}</strong>
          <small>{{ mod.description }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { importModules } from '@/schemas'

const modules = importModules
</script>

<style scoped>
.wizard-placeholder {
  max-width: 600px;
  margin: 4rem auto;
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.wizard-placeholder__icon .pi {
  font-size: 3rem;
  color: var(--p-primary-color);
}

h2 { margin: 0; }

p {
  color: var(--p-text-muted-color);
  line-height: 1.6;
}

ul {
  text-align: left;
  line-height: 2;
  color: var(--p-text-color);
}

.wizard-placeholder__modules {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  margin-top: 1rem;
}

.module-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  background: var(--p-surface-card);
  text-align: left;
}

.module-card .pi {
  font-size: 1.5rem;
  color: var(--p-primary-color);
}

.module-card strong { display: block; }
.module-card small  { color: var(--p-text-muted-color); font-size: 0.85rem; }
</style>
