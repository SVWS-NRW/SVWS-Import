<template>
  <div class="help-view">
    <div class="help-header">
      <Button
        icon="pi pi-arrow-left"
        label="Zurück"
        severity="secondary"
        text
        @click="router.back()"
      />
      <h2>Hilfe – Dateiformate</h2>
      <p class="subtitle">Übersicht der unterstützten Spalten und Formate für den Import</p>
    </div>

    <div class="format-section">
      <h3><i class="pi pi-users section-icon" /> Schülerdaten (CSV / XLSX)</h3>
      <p class="section-desc">Pflichtfelder sind mit <span class="required-badge">Pflicht</span> gekennzeichnet. Alle anderen Felder sind optional.</p>

      <table class="field-table">
        <thead>
          <tr>
            <th>Spaltenname</th>
            <th>Kategorie</th>
            <th>Typ</th>
            <th>Hinweis / Erlaubte Werte</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>Nachname</code> <span class="required-badge">Pflicht</span></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td>Familienname; Alias: <code>Name</code>, <code>Familienname</code></td>
          </tr>
          <tr>
            <td><code>Vorname</code> <span class="required-badge">Pflicht</span></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td>Alias: <code>Rufname</code>, <code>Firstname</code></td>
          </tr>
          <tr>
            <td><code>AlleVornamen</code></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td>Alle Vornamen vollständig</td>
          </tr>
          <tr>
            <td><code>Geburtsname</code></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td>Alias: <code>Mädchenname</code></td>
          </tr>
          <tr>
            <td><code>Geburtsort</code></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td></td>
          </tr>
          <tr>
            <td><code>Geschlecht</code></td>
            <td>Personaldaten</td>
            <td>Auswahl</td>
            <td>
              <code>m</code> / <code>männlich</code> · <code>w</code> / <code>weiblich</code> ·
              <code>d</code> / <code>divers</code> · <code>x</code> / <code>ohne Angabe</code>
            </td>
          </tr>
          <tr>
            <td><code>Geburtsdatum</code></td>
            <td>Personaldaten</td>
            <td>Datum</td>
            <td><code>TT.MM.JJJJ</code> oder <code>JJJJ-MM-TT</code></td>
          </tr>
          <tr>
            <td><code>Staatsangehörigkeit</code></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td>Numerischer Schlüssel (z.&nbsp;B. <code>000</code>) oder ISO-3 (z.&nbsp;B. <code>DEU</code>)</td>
          </tr>
          <tr>
            <td><code>Strasse</code></td>
            <td>Adresse</td>
            <td>Text</td>
            <td>Alias: <code>Straße</code>, <code>Adresse</code></td>
          </tr>
          <tr>
            <td><code>Hausnummer</code></td>
            <td>Adresse</td>
            <td>Text</td>
            <td>Alias: <code>Hnr</code></td>
          </tr>
          <tr>
            <td><code>PLZ</code></td>
            <td>Adresse</td>
            <td>Text</td>
            <td>Alias: <code>Postleitzahl</code></td>
          </tr>
          <tr>
            <td><code>Ort</code></td>
            <td>Adresse</td>
            <td>Text</td>
            <td>Alias: <code>Wohnort</code>, <code>Stadt</code></td>
          </tr>
          <tr>
            <td><code>Ortsteil</code></td>
            <td>Adresse</td>
            <td>Text</td>
            <td>Alias: <code>Stadtteil</code></td>
          </tr>
          <tr>
            <td><code>Telefon</code></td>
            <td>Kontakt</td>
            <td>Text</td>
            <td></td>
          </tr>
          <tr>
            <td><code>Email</code></td>
            <td>Kontakt</td>
            <td>E-Mail</td>
            <td>Muss gültiges E-Mail-Format haben</td>
          </tr>
          <tr>
            <td><code>Status</code></td>
            <td>Schulbezogen</td>
            <td>Auswahl</td>
            <td>
              <code>aktiv</code> (Standard) · <code>beurlaubt</code> · <code>extern</code>
            </td>
          </tr>
          <tr>
            <td><code>Anmeldedatum</code></td>
            <td>Schulbezogen</td>
            <td>Datum</td>
            <td><code>TT.MM.JJJJ</code> oder <code>JJJJ-MM-TT</code></td>
          </tr>
          <tr>
            <td><code>Aufnahmedatum</code></td>
            <td>Schulbezogen</td>
            <td>Datum</td>
            <td><code>TT.MM.JJJJ</code> oder <code>JJJJ-MM-TT</code></td>
          </tr>
          <tr>
            <td><code>BeginnBildungsgang</code></td>
            <td>Schulbezogen</td>
            <td>Datum</td>
            <td><code>TT.MM.JJJJ</code> oder <code>JJJJ-MM-TT</code></td>
          </tr>
          <tr>
            <td><code>Klasse</code></td>
            <td>Schulbezogen</td>
            <td>Text</td>
            <td>Alias: <code>Klasse/Kurs</code>, <code>Lerngruppe</code></td>
          </tr>
          <tr>
            <td><code>Jahrgang</code></td>
            <td>Schulbezogen</td>
            <td>Text</td>
            <td>Alias: <code>Jahrgangsstufe</code>, <code>Stufe</code>, <code>Jg</code></td>
          </tr>
          <tr>
            <td><code>Schulgliederung</code></td>
            <td>Schulbezogen</td>
            <td>Text</td>
            <td>z.&nbsp;B. <code>GY8</code>, <code>GY9</code>; bei BK: <code>HBF</code>, <code>BF</code>, <code>BGJ</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="format-section">
      <h3><i class="pi pi-id-card section-icon" /> Lehrerdaten (CSV / XLSX)</h3>
      <p class="section-desc">Pflichtfelder sind mit <span class="required-badge">Pflicht</span> gekennzeichnet. Alle anderen Felder sind optional.</p>

      <table class="field-table">
        <thead>
          <tr>
            <th>Spaltenname</th>
            <th>Kategorie</th>
            <th>Typ</th>
            <th>Hinweis / Erlaubte Werte</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>Kuerzel</code> <span class="required-badge">Pflicht</span></td>
            <td>Identifikation</td>
            <td>Text</td>
            <td>Alias: <code>Kürzel</code>, <code>InternKrz</code>, <code>KZ</code></td>
          </tr>
          <tr>
            <td><code>Nachname</code> <span class="required-badge">Pflicht</span></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td>Alias: <code>Name</code>, <code>Familienname</code></td>
          </tr>
          <tr>
            <td><code>Vorname</code> <span class="required-badge">Pflicht</span></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td>Alias: <code>Rufname</code>, <code>Firstname</code></td>
          </tr>
          <tr>
            <td><code>Anrede</code></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td>Alias: <code>Titel/Anrede</code></td>
          </tr>
          <tr>
            <td><code>Titel</code></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td>z.&nbsp;B. <code>Dr.</code>, <code>Prof.</code></td>
          </tr>
          <tr>
            <td><code>Amtsbezeichnung</code></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td>Alias: <code>Funktion</code>, <code>Dienstbezeichnung</code></td>
          </tr>
          <tr>
            <td><code>Geschlecht</code></td>
            <td>Personaldaten</td>
            <td>Auswahl</td>
            <td>
              <code>m</code> / <code>männlich</code> · <code>w</code> / <code>weiblich</code> ·
              <code>d</code> / <code>divers</code> · <code>x</code> / <code>ohne Angabe</code>
            </td>
          </tr>
          <tr>
            <td><code>Geburtsdatum</code></td>
            <td>Personaldaten</td>
            <td>Datum</td>
            <td><code>TT.MM.JJJJ</code> oder <code>JJJJ-MM-TT</code></td>
          </tr>
          <tr>
            <td><code>Staatsangehörigkeit</code></td>
            <td>Personaldaten</td>
            <td>Text</td>
            <td>Numerischer Schlüssel (z.&nbsp;B. <code>000</code>) oder ISO-3 (z.&nbsp;B. <code>DEU</code>)</td>
          </tr>
          <tr>
            <td><code>PersonalTyp</code></td>
            <td>Beschäftigung</td>
            <td>Auswahl</td>
            <td>
              <code>LEHRKRAFT</code> (Standard) · <code>VERWALTUNG_TECHNIK</code> · <code>SONSTIGER</code>
            </td>
          </tr>
          <tr>
            <td><code>Rechtsverhältnis</code></td>
            <td>Beschäftigung</td>
            <td>Text</td>
            <td>z.&nbsp;B. <code>Beamter</code>, <code>Angestellter</code></td>
          </tr>
          <tr>
            <td><code>Beschaeftigungsart</code></td>
            <td>Beschäftigung</td>
            <td>Text</td>
            <td>Alias: <code>Beschäftigungsart</code>, <code>Vertrag</code></td>
          </tr>
          <tr>
            <td><code>Pflichtstunden</code></td>
            <td>Beschäftigung</td>
            <td>Zahl</td>
            <td>Alias: <code>Sollstunden</code>, <code>Wochenstunden</code></td>
          </tr>
          <tr>
            <td><code>Strasse</code></td>
            <td>Adresse</td>
            <td>Text</td>
            <td>Alias: <code>Straße</code>, <code>Adresse</code></td>
          </tr>
          <tr>
            <td><code>Hausnummer</code></td>
            <td>Adresse</td>
            <td>Text</td>
            <td></td>
          </tr>
          <tr>
            <td><code>PLZ</code></td>
            <td>Adresse</td>
            <td>Text</td>
            <td>Alias: <code>Postleitzahl</code></td>
          </tr>
          <tr>
            <td><code>Ort</code></td>
            <td>Adresse</td>
            <td>Text</td>
            <td>Alias: <code>Wohnort</code>, <code>Stadt</code></td>
          </tr>
          <tr>
            <td><code>Telefon</code></td>
            <td>Kontakt</td>
            <td>Text</td>
            <td>Festnetz; Alias: <code>Festnetz</code>, <code>Tel</code></td>
          </tr>
          <tr>
            <td><code>Mobil</code></td>
            <td>Kontakt</td>
            <td>Text</td>
            <td>Alias: <code>Handy</code>, <code>Mobiltelefon</code></td>
          </tr>
          <tr>
            <td><code>EmailPrivat</code></td>
            <td>Kontakt</td>
            <td>E-Mail</td>
            <td>Alias: <code>Privatmail</code></td>
          </tr>
          <tr>
            <td><code>EmailDienstlich</code></td>
            <td>Kontakt</td>
            <td>E-Mail</td>
            <td>Alias: <code>Email</code>, <code>SchulEmail</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="format-section notes-section">
      <h3><i class="pi pi-info-circle section-icon" /> Allgemeine Hinweise</h3>
      <div class="notes-grid">
        <div class="note-card">
          <strong>Dateiformat</strong>
          <p>Unterstützt werden <code>.csv</code>, <code>.xlsx</code> und <code>.xls</code>. Die erste Zeile muss die Spaltenüberschriften enthalten.</p>
        </div>
        <div class="note-card">
          <strong>Spaltennamen</strong>
          <p>Groß- und Kleinschreibung wird ignoriert. Viele Spalten werden auch unter alternativen Namen (Aliases) erkannt.</p>
        </div>
        <div class="note-card">
          <strong>Datumsformat</strong>
          <p>Erlaubt sind <code>TT.MM.JJJJ</code> (z.&nbsp;B. <code>15.03.2005</code>) und <code>JJJJ-MM-TT</code> (z.&nbsp;B. <code>2005-03-15</code>).</p>
        </div>
        <div class="note-card">
          <strong>Geschlecht</strong>
          <p>Kurz: <code>m</code>, <code>w</code>, <code>d</code>, <code>x</code><br>Lang: <code>männlich</code>, <code>weiblich</code>, <code>divers</code>, <code>ohne Angabe</code></p>
        </div>
        <div class="note-card">
          <strong>Import-Assistent</strong>
          <p>Der Import-Assistent ermöglicht einen geführten Import mit automatischer Spaltenzuordnung und Vorschau vor dem eigentlichen Import.</p>
        </div>
        <div class="note-card">
          <strong>Maximale Dateigröße</strong>
          <p>Die Datei darf maximal <strong>10 MB</strong> groß sein.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()
</script>

<style scoped>
.help-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.help-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.help-header h2 {
  margin: 0.5rem 0 0;
  font-size: 1.5rem;
}

.subtitle {
  margin: 0;
  color: var(--p-text-muted-color);
}

.format-section h3 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.1rem;
  margin: 0 0 0.4rem;
}

.section-icon {
  color: var(--p-primary-color);
  font-size: 1.1rem;
}

.section-desc {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
}

.required-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--p-primary-700);
  background: var(--p-primary-50);
  border: 1px solid var(--p-primary-200);
  border-radius: 4px;
  padding: 0.05rem 0.4rem;
  vertical-align: middle;
  margin-left: 0.25rem;
}

:global(.dark) .required-badge {
  color: var(--p-primary-300);
  background: color-mix(in srgb, var(--p-primary-color) 15%, transparent);
  border-color: var(--p-primary-700);
}

.field-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.field-table th,
.field-table td {
  padding: 0.55rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--p-surface-border);
}

.field-table th {
  font-weight: 600;
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: var(--p-surface-ground);
}

.field-table tbody tr:hover {
  background: var(--p-surface-hover);
}

.field-table code {
  padding: 0.1rem 0.35rem;
  background: var(--p-surface-ground);
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.82rem;
  color: var(--p-primary-color);
}

.notes-section h3 {
  margin-bottom: 1rem;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.note-card {
  padding: 1rem 1.25rem;
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  background: var(--p-surface-card);
  font-size: 0.875rem;
}

.note-card strong {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.9rem;
}

.note-card p {
  margin: 0;
  color: var(--p-text-muted-color);
  line-height: 1.5;
}

.note-card code {
  padding: 0.1rem 0.3rem;
  background: var(--p-surface-ground);
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.82rem;
  color: var(--p-primary-color);
}
</style>
