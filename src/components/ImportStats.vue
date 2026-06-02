<template>
  <div class="import-stats">
    <div class="stat">
      <span class="stat-value">{{ total }}</span>
      <span class="stat-label">Gesamt</span>
    </div>
    <div class="stat valid">
      <span class="stat-value">{{ valid }}</span>
      <span class="stat-label">Gültig</span>
    </div>
    <div class="stat error" v-if="errors > 0">
      <span class="stat-value">{{ errors }}</span>
      <span class="stat-label">Fehler</span>
    </div>
    <div class="stat sent" v-if="sent > 0">
      <span class="stat-value">{{ sent }}</span>
      <span class="stat-label">Übertragen</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  total: number
  valid: number
  errors: number
  sent: number
}>()
</script>

<style scoped>
.import-stats {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 0.25rem;
}

.stat-value {
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  min-width: 1.5ch;
  text-align: right;
}

.stat-label {
  font-size: 0.65rem;
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.valid .stat-value { color: var(--p-green-500); }
.error .stat-value { color: var(--p-red-500); }
.sent .stat-value  { color: var(--p-blue-500); }
</style>
