<template>
  <Dialog
    :visible="true"
    modal
    header="Spalten zuordnen"
    :closable="false"
    :style="{ width: '700px' }"
    :pt="{ content: { style: 'padding: 0' } }"
  >
    <div class="dialog-body">
      <p class="hint">
        <span class="hint-count">{{ unmappedHeaders.length }}</span>
        Spalte{{ unmappedHeaders.length !== 1 ? 'n wurden' : ' wurde' }} nicht automatisch erkannt.
        Weise sie einem SVWS-Feld zu oder lass sie auf „Ignorieren".
      </p>

      <div class="mapping-grid">
        <div class="grid-head">CSV-Spalte</div>
        <div class="grid-head">Beispielwerte</div>
        <div class="grid-head">Zielfeld</div>

        <template v-for="header in unmappedHeaders" :key="header">
          <div class="csv-name">{{ header }}</div>
          <div class="samples">{{ getSamples(header) }}</div>
          <Select
            v-model="selections[header]"
            :options="targetOptionGroups"
            optionGroupLabel="label"
            optionGroupChildren="items"
            optionLabel="label"
            optionValue="value"
            placeholder="Ignorieren"
            showClear
            class="target-select"
          />
        </template>
      </div>
    </div>

    <template #footer>
      <Button label="Abbrechen" text severity="secondary" @click="$emit('skip')" />
      <Button label="Übernehmen" icon="pi pi-check" @click="onConfirm" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import type { SchuelerImportRow } from '@/models/Schueler'

const props = defineProps<{
  unmappedHeaders: string[]
  sampleRows: SchuelerImportRow[]
}>()

const emit = defineEmits<{
  confirm: [mapping: Record<string, string>]
  skip: []
}>()

const selections = reactive<Record<string, string | null>>(
  Object.fromEntries(props.unmappedHeaders.map(h => [h, null]))
)

const targetOptionGroups = [
  {
    label: 'Personaldaten',
    items: [
      { value: 'nachname',                    label: 'Nachname' },
      { value: 'vorname',                     label: 'Vorname' },
      { value: 'alleVornamen',                label: 'Alle Vornamen' },
      { value: 'geburtsname',                 label: 'Geburtsname' },
      { value: 'geburtsort',                  label: 'Geburtsort' },
      { value: 'geburtsland',                 label: 'Geburtsland' },
      { value: 'geschlecht',                  label: 'Geschlecht' },
      { value: 'geburtsdatum',                label: 'Geburtsdatum' },
      { value: 'staatsangehoerigkeitID',      label: 'Staatsangehörigkeit' },
      { value: 'staatsangehoerigkeit2ID',     label: 'Staatsangehörigkeit 2' },
    ],
  },
  {
    label: 'Religion',
    items: [
      { value: 'religionID',                  label: 'Konfession (Klartext)' },
      { value: 'religionKuerzel',             label: 'Konfessionskürzel' },
      { value: 'druckeKonfessionAufZeugnisse', label: 'Konfession auf Zeugnis drucken' },
      { value: 'religionanmeldung',           label: 'Anmeldung Religionsunterricht' },
      { value: 'religionabmeldung',           label: 'Abmeldung Religionsunterricht' },
    ],
  },
  {
    label: 'Herkunft / Migration',
    items: [
      { value: 'hatMigrationshintergrund', label: 'Migrationshintergrund' },
      { value: 'zuzugsjahr',               label: 'Zuzugsjahr' },
      { value: 'verkehrspracheFamilie',    label: 'Verkehrssprache Familie' },
      { value: 'geburtslandVater',         label: 'Geburtsland Vater' },
      { value: 'geburtslandMutter',        label: 'Geburtsland Mutter' },
    ],
  },
  {
    label: 'Adresse',
    items: [
      { value: 'strassenname',    label: 'Straße' },
      { value: 'hausnummer',      label: 'Hausnummer' },
      { value: 'hausnummerZusatz', label: 'Hausnummer Zusatz' },
      { value: 'plz',             label: 'PLZ' },
      { value: 'ort',             label: 'Ort' },
      { value: 'ortsteil',        label: 'Ortsteil' },
    ],
  },
  {
    label: 'Kontakt',
    items: [
      { value: 'telefon',     label: 'Telefon' },
      { value: 'telefonMobil', label: 'Mobiltelefon' },
      { value: 'email',       label: 'E-Mail privat' },
      { value: 'emailSchule', label: 'E-Mail Schule' },
    ],
  },
  {
    label: 'Schulbezogen',
    items: [
      { value: 'klasse',             label: 'Klasse' },
      { value: 'jahrgang',           label: 'Jahrgang' },
      { value: 'schulgliederung',    label: 'Schulgliederung' },
      { value: 'anmeldedatum',       label: 'Anmeldedatum' },
      { value: 'aufnahmedatum',      label: 'Aufnahmedatum' },
      { value: 'beginnBildungsgang', label: 'Beginn Bildungsgang' },
      { value: 'dauerBildungsgang',  label: 'Dauer Bildungsgang' },
      { value: 'externeSchulNr',     label: 'Externe Schulnummer' },
      { value: 'beruf',              label: 'Beruf' },
      { value: 'status',             label: 'Status' },
    ],
  },
  {
    label: 'Sonstiges',
    items: [
      { value: 'hatMasernimpfnachweis', label: 'Masernimpfnachweis' },
      { value: 'keineAuskunftAnDritte', label: 'Keine Auskunft an Dritte' },
      { value: 'erhaeltSchuelerBAFOEG', label: 'Schüler-BAföG' },
      { value: 'erhaeltMeisterBAFOEG',  label: 'Meister-BAföG' },
    ],
  },
]

function getSamples(header: string): string {
  const values = props.sampleRows
    .map(r => r._rawData[header])
    .filter(v => v != null && v !== '')
  return values.length > 0 ? values.slice(0, 3).join(' · ') : '—'
}

function onConfirm(): void {
  const mapping: Record<string, string> = {}
  for (const [header, target] of Object.entries(selections)) {
    if (target) mapping[header] = target
  }
  emit('confirm', mapping)
}
</script>

<style scoped>
.dialog-body {
  padding: 1.25rem 1.5rem;
}

.hint {
  margin: 0 0 1.25rem;
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}

.hint-count {
  font-weight: 700;
  color: var(--p-text-color);
}

.mapping-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1.3fr;
  gap: 0.5rem 1rem;
  align-items: center;
}

.grid-head {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--p-text-muted-color);
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--p-content-border-color);
}

.csv-name {
  font-family: monospace;
  font-size: 0.875rem;
  border: 1px solid var(--p-content-border-color);
  color: var(--p-text-color);
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.samples {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.target-select {
  width: 100%;
}
</style>
