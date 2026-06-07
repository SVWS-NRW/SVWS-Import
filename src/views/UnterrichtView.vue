<template>
  <div :class="['table-view', { 'is-dark': isDark }]">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="table-header">
      <div class="header-left">
        <Button
          icon="pi pi-arrow-left"
          size="small"
          text
          rounded
          @click="router.push({ name: 'import' })"
          aria-label="Zurück"
        />
        <h2>Unterricht</h2>
        <Select
          v-if="schuleStore.loaded"
          v-model="idSchuljahresabschnitt"
          :options="schuleStore.abschnitteOptions"
          optionLabel="label"
          optionValue="id"
          placeholder="Abschnitt wählen"
          size="small"
          style="width: 160px"
        />
        <InputNumber
          v-else
          v-model="idSchuljahresabschnitt"
          :min="1"
          size="small"
          style="width: 100px"
        />
      </div>
    </div>

    <Message v-if="parseError" severity="error" :closable="true" @close="parseError = ''">
      {{ parseError }}
    </Message>

    <!-- ── Tabs ────────────────────────────────────────────────────────── -->
    <Tabs v-model:value="activeTab" class="unterricht-tabs">
      <TabList>
        <Tab value="klasse">
          Klassenunterricht
          <Badge v-if="klasseRows.length > 0" :value="klasseRows.length" severity="secondary" class="tab-badge" />
        </Tab>
        <Tab value="kurs">
          Kursunterricht
          <Badge v-if="kursRows.length > 0" :value="kursRows.length" severity="secondary" class="tab-badge" />
        </Tab>
        <Tab value="schueler">
          Schülerunterricht
          <Badge v-if="schuelerRows.length > 0" :value="schuelerRows.length" severity="secondary" class="tab-badge" />
        </Tab>
        <Tab value="zuweisung">Kurszuweisung</Tab>
      </TabList>

      <TabPanels>

        <!-- ══ Tab 1: Klassenunterricht ══════════════════════════════════ -->
        <TabPanel value="klasse">
          <div class="tab-content">
            <div class="tab-actions">
              <FileUpload
                :key="klasseFileKey"
                mode="basic" :auto="false" :multiple="false"
                accept=".csv,.dat,.xlsx"
                chooseLabel="Datei laden" chooseIcon="pi pi-folder-open"
                :maxFileSize="10000000" :disabled="parsingKlasse"
                @select="onKlasseFileSelect"
              />
              <Button label="Importieren" icon="pi pi-upload" size="small"
                :disabled="klasseRows.filter(r => r._valid && !r._sent).length === 0 || klasseImport.running"
                @click="handleKlasseImport" />
              <Button v-if="klasseRows.length > 0" label="Leeren" icon="pi pi-trash"
                severity="danger" size="small" text :disabled="klasseImport.running"
                @click="klasseRows = []; klasseFileKey++" />
              <span v-if="loadingKlasseLookups" class="lookup-loading">
                <i class="pi pi-spin pi-spinner" /> Prüfe Referenzen…
              </span>
              <span v-if="klasseImport.running" class="lookup-loading">
                <i class="pi pi-spin pi-spinner" />
                {{ klasseImport.done }}&nbsp;/&nbsp;{{ klasseImport.total }} Einträge…
              </span>
              <span v-if="!klasseImport.running && klasseImport.total > 0" class="import-result">
                {{ klasseImport.done - klasseImport.errors }} importiert
                <span v-if="klasseImport.errors > 0" style="color:#ef4444">
                  · {{ klasseImport.errors }} Fehler
                </span>
              </span>
            </div>

            <Message
              v-if="klasseWarnCount > 0 && !loadingKlasseLookups"
              severity="warn"
              :closable="false"
            >
              {{ klasseWarnCount }} Zeile(n) mit nicht aufgelösten Referenzen
              (Abschnitt, Klasse, Lehrer oder Fach nicht gefunden).
              Bitte die markierten Zeilen prüfen — orangene ⚠ Felder anklicken für Details.
            </Message>

            <div v-if="klasseRows.length === 0" :class="['hint-box', { 'hint-box--dark': isDark }]">
              <i class="pi pi-info-circle hint-icon" />
              <div class="hint-body-wrap">
                <div class="hint-toggle" @click="klasseHintOpen = !klasseHintOpen">
                  <strong>Klassenunterricht</strong>
                  <i :class="['pi', klasseHintOpen ? 'pi-chevron-up' : 'pi-chevron-down', 'hint-chevron']" />
                </div>
                <div v-show="klasseHintOpen" class="hint-body">
                  <p style="margin:0 0 0.5rem">
                    Weist allen Schülern einer Klasse Unterrichtsfächer zu. Trennzeichen: Semikolon, Komma oder Pipe.
                    Abschnitt, Klasse, Lehrer und Fach werden automatisch gegen die Datenbank geprüft.
                  </p>
                  <table class="hint-table">
                    <tbody>
                      <tr>
                        <td class="hint-col-label">Pflichtfelder</td>
                        <td><code>schuljahr</code> · <code>abschnitt</code> · <code>klasse</code> · <code>fach</code></td>
                      </tr>
                      <tr>
                        <td class="hint-col-label">Optional</td>
                        <td><code>lehrerkuerzel</code> · <code>kursart</code> · <code>wochenstunden</code> · <code>aufszeugnis</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <ag-grid-vue
              v-if="klasseRows.length > 0"
              :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
              :rowData="klasseRows" :columnDefs="klasseColDefs" :defaultColDef="defaultColDef"
              :rowClassRules="rowClassRules" :getRowId="getRowId" :animateRows="true"
              rowSelection="multiple"
              @grid-ready="onKlasseGridReady"
              @selection-changed="onKlasseSelectionChanged"
            />
          </div>
        </TabPanel>

        <!-- ══ Tab 2: Kursunterricht (Kurse anlegen) ══════════════════════ -->
        <TabPanel value="kurs">
          <div class="tab-content">
            <div class="tab-actions">
              <FileUpload
                :key="kursFileKey"
                mode="basic" :auto="false" :multiple="false"
                accept=".csv,.dat,.xlsx"
                chooseLabel="Datei laden" chooseIcon="pi pi-folder-open"
                :maxFileSize="10000000" :disabled="parsingKurs"
                @select="onKursFileSelect"
              />
              <Button label="Kurse anlegen" icon="pi pi-upload" size="small"
                :disabled="kursRows.filter(r => r._valid && !r._sent).length === 0 || kursImport.running || loadingKursLookups"
                @click="handleKursImport" />
              <Button v-if="kursRows.length > 0" label="Leeren" icon="pi pi-trash"
                severity="danger" size="small" text :disabled="kursImport.running"
                @click="kursRows = []; kursFileKey++" />
              <span v-if="loadingKursLookups" class="lookup-loading">
                <i class="pi pi-spin pi-spinner" /> Prüfe Referenzen…
              </span>
              <span v-if="kursImport.running" class="lookup-loading">
                <i class="pi pi-spin pi-spinner" />
                {{ kursImport.done }}&nbsp;/&nbsp;{{ kursImport.total }} Kurse…
              </span>
              <span v-if="!kursImport.running && kursImport.total > 0" class="import-result">
                {{ kursImport.done - kursImport.errors }} angelegt
                <span v-if="kursImport.errors > 0" style="color:#ef4444">
                  · {{ kursImport.errors }} Fehler
                </span>
              </span>
            </div>
            <div v-if="kursRows.length === 0" :class="['hint-box', { 'hint-box--dark': isDark }]">
              <i class="pi pi-info-circle hint-icon" />
              <div class="hint-body-wrap">
                <div class="hint-toggle" @click="kursHintOpen = !kursHintOpen">
                  <strong>Kursunterricht</strong>
                  <i :class="['pi', kursHintOpen ? 'pi-chevron-up' : 'pi-chevron-down', 'hint-chevron']" />
                </div>
                <div v-show="kursHintOpen" class="hint-body">
                  <p style="margin:0 0 0.5rem">
                    Legt neue Kurse in der Datenbank an. Trennzeichen: Semikolon, Komma oder Pipe.
                  </p>
                  <table class="hint-table">
                    <tbody>
                      <tr>
                        <td class="hint-col-label">Pflichtfelder</td>
                        <td><code>schuljahr</code> · <code>abschnitt</code> · <code>kuerzel</code> · <code>fach</code> · <code>kursart</code></td>
                      </tr>
                      <tr>
                        <td class="hint-col-label">Optional</td>
                        <td><code>lehrerkuerzel</code> · <code>jahrgaenge</code> · <code>zeugnisbezeichnung</code> · <code>wochenstunden</code> · <code>wochenstundenlehrkraft</code> · <code>schienen</code> · <code>istepochal</code></td>
                      </tr>
                      <tr>
                        <td class="hint-col-label">Fortschreibungsart</td>
                        <td><code>keine</code> · <code>jghoch</code> · <code>jghalten</code> · <code>komplett</code></td>
                      </tr>
                      <tr>
                        <td class="hint-col-label">Hinweise</td>
                        <td>Mehrere Jahrgänge kommagetrennt, z.&nbsp;B. <code>05,06,07</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <ag-grid-vue
              v-if="kursRows.length > 0"
              :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
              :rowData="kursRows" :columnDefs="kursColDefs" :defaultColDef="defaultColDef"
              :rowClassRules="rowClassRules" :getRowId="getRowId" :animateRows="true"
              rowSelection="multiple"
              @grid-ready="onKursGridReady"
              @selection-changed="onKursSelectionChanged"
            />
          </div>
        </TabPanel>

        <!-- ══ Tab 3: Schülerunterricht ══════════════════════════════════ -->
        <TabPanel value="schueler">
          <div class="tab-content">
            <div class="tab-actions">
              <FileUpload
                :key="schuelerFileKey"
                mode="basic" :auto="false" :multiple="false"
                accept=".csv,.dat,.xlsx"
                chooseLabel="Datei laden" chooseIcon="pi pi-folder-open"
                :maxFileSize="10000000" :disabled="parsingSchueler"
                @select="onSchuelerFileSelect"
              />
              <Button label="Importieren" icon="pi pi-upload" size="small"
                :disabled="schuelerRows.filter(r => r._valid && !r._sent).length === 0 || schuelerImport.running || loadingSchuelerLookups"
                @click="handleSchuelerImport" />
              <Button v-if="schuelerRows.length > 0" label="Leeren" icon="pi pi-trash"
                severity="danger" size="small" text :disabled="schuelerImport.running"
                @click="schuelerRows = []; schuelerFileKey++" />
              <span v-if="loadingSchuelerLookups" class="lookup-loading">
                <i class="pi pi-spin pi-spinner" /> Prüfe Referenzen…
              </span>
              <span v-if="schuelerImport.running" class="lookup-loading">
                <i class="pi pi-spin pi-spinner" />
                {{ schuelerImport.done }}&nbsp;/&nbsp;{{ schuelerImport.total }} Einträge…
              </span>
              <span v-if="!schuelerImport.running && schuelerImport.total > 0" class="import-result">
                {{ schuelerImport.done - schuelerImport.errors }} importiert
                <span v-if="schuelerImport.errors > 0" style="color:#ef4444">
                  · {{ schuelerImport.errors }} Fehler
                </span>
              </span>
            </div>
            <div v-if="schuelerRows.length === 0" :class="['hint-box', { 'hint-box--dark': isDark }]">
              <i class="pi pi-info-circle hint-icon" />
              <div class="hint-body-wrap">
                <div class="hint-toggle" @click="schuelerHintOpen = !schuelerHintOpen">
                  <strong>Schülerunterricht</strong>
                  <i :class="['pi', schuelerHintOpen ? 'pi-chevron-up' : 'pi-chevron-down', 'hint-chevron']" />
                </div>
                <div v-show="schuelerHintOpen" class="hint-body">
                  <p style="margin:0 0 0.5rem">
                    Weist einzelnen Schülern Leistungsdaten zu. Schüler werden per
                    <em>Nachname&nbsp;+&nbsp;Vorname&nbsp;+&nbsp;Geburtsdatum</em> in der Datenbank identifiziert.
                    Ein Kurs wird (falls angegeben) über das Kürzel im jeweiligen Abschnitt aufgelöst.
                  </p>
                  <table class="hint-table">
                    <tbody>
                      <tr>
                        <td class="hint-col-label">Pflichtfelder</td>
                        <td><code>nachname</code> · <code>vorname</code> · <code>geburtsdatum</code> · <code>schuljahr</code> · <code>abschnitt</code> · <code>fach</code></td>
                      </tr>
                      <tr>
                        <td class="hint-col-label">Unterricht</td>
                        <td><code>fachlehrer</code> · <code>kurs</code> · <code>kursart</code> · <code>jahrgaenge</code> · <code>wochenstd</code></td>
                      </tr>
                      <tr>
                        <td class="hint-col-label">Bewertung</td>
                        <td><code>note</code> · <code>abiturfach</code> (1–4)</td>
                      </tr>
                      <tr>
                        <td class="hint-col-label">Fehlzeiten</td>
                        <td><code>fehlstd</code> · <code>unentschfehlstd</code> · <code>mahnung</code> (true/false) · <code>mahndatum</code></td>
                      </tr>
                      <tr>
                        <td class="hint-col-label">Sonstiges</td>
                        <td><code>externeschulnr</code> · <code>zusatzkraft</code> · <code>wochenstdzusatzkraft</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <ag-grid-vue
              v-if="schuelerRows.length > 0"
              :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
              :rowData="schuelerRows" :columnDefs="schuelerColDefs" :defaultColDef="defaultColDef"
              :rowClassRules="rowClassRules" :getRowId="getRowId" :animateRows="true"
              rowSelection="multiple"
              @grid-ready="onSchuelerGridReady"
              @selection-changed="onSchuelerSelectionChanged"
            />
          </div>
        </TabPanel>

        <!-- ══ Tab 4: Kurszuweisung (Drag & Drop) ════════════════════════ -->
        <TabPanel value="zuweisung">
          <div class="zuweisung-root">

            <!-- Filter-Leiste -->
            <div class="zuweisung-toolbar">
              <!-- Zeile 1: Kurs-Filter -->
              <div class="toolbar-row">
                <span class="toolbar-label">Kurse</span>
                <InputText v-model="kursSearch" placeholder="Fach suchen…" size="small" style="width: 150px" />
                <Select
                  v-model="kursartFilter"
                  :options="availableKursarten"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  style="width: 130px"
                />
                <Button
                  label="Laden"
                  icon="pi pi-refresh"
                  size="small"
                  severity="secondary"
                  outlined
                  :loading="loadingKurse"
                  :disabled="!idSchuljahresabschnitt"
                  @click="loadKurse"
                />
              </div>
              <!-- Zeile 2: Schüler-Filter -->
              <div class="toolbar-row">
                <span class="toolbar-label">Schüler</span>
                <InputText v-model="schuelerSearch" placeholder="Name suchen…" size="small" style="width: 150px" />
                <Select
                  v-model="klasseFilter"
                  :options="availableKlassen"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  style="width: 130px"
                />
                <Checkbox v-model="includeExtern" inputId="zuw-extern" binary />
                <label for="zuw-extern" class="toolbar-sub-label">inkl. Extern</label>
                <Button
                  label="Laden"
                  icon="pi pi-refresh"
                  size="small"
                  severity="secondary"
                  outlined
                  :loading="loadingSchueler"
                  :disabled="!idSchuljahresabschnitt"
                  @click="loadSchueler"
                />
                <div class="toolbar-spacer" />
                <span v-if="zuweisungSave.running" class="lookup-loading">
                  <i class="pi pi-spin pi-spinner" />
                  {{ zuweisungSave.done }}&nbsp;/&nbsp;{{ zuweisungSave.total }}
                </span>
                <span v-else-if="!zuweisungSave.running && zuweisungSave.total > 0" class="import-result">
                  {{ zuweisungSave.done - zuweisungSave.errors }} gespeichert
                  <span v-if="zuweisungSave.errors > 0" style="color:#ef4444">
                    · {{ zuweisungSave.errors }} Fehler
                  </span>
                </span>
                <Button
                  v-if="pendingAssignments > 0"
                  :label="`${pendingAssignments} Zuweisung(en) speichern`"
                  icon="pi pi-save"
                  size="small"
                  :loading="zuweisungSave.running"
                  @click="saveAssignments"
                />
              </div>
            </div>

            <!-- Zwei-Spalten-Layout -->
            <div class="zuweisung-layout">

              <!-- ── Linke Spalte: Kursliste ───────────────────────── -->
              <div class="panel kurs-panel">
                <div class="panel-header">
                  <span class="panel-title">Kurse</span>
                  <span class="panel-count">{{ filteredKurse.length }}</span>
                </div>

                <div v-if="dbKurse.length === 0" class="panel-empty">
                  <i class="pi pi-list" />
                  <span>Kurse über „Laden" aus der Datenbank holen</span>
                </div>

                <div v-else class="kurs-list">
                  <div
                    v-for="kurs in filteredKurse"
                    :key="kurs.id"
                    :class="['kurs-item', { 'kurs-item--selected': kurs.id === selectedKursId }]"
                    @click="selectedKursId = kurs.id"
                  >
                    <div class="kurs-item-main">
                      <span class="kurs-fach">{{ kurs.fach }}</span>
                      <span class="kurs-meta">{{ kurs.kuerzel }}</span>
                    </div>
                    <div class="kurs-item-right">
                      <span v-if="kurs.lehrer" class="kurs-lehrer">{{ kurs.lehrer }}</span>
                      <span class="kurs-count-badge">
                        {{ (assignments[kurs.id] ?? []).length }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── Rechte Spalte: Schüler-Zuweisung ─────────────── -->
              <div class="panel schueler-panel">

                <!-- Pool: Nicht zugewiesen -->
                <div class="schueler-section">
                  <div class="panel-header">
                    <span class="panel-title">Verfügbare Schüler</span>
                    <span class="panel-count">{{ filteredPool.length }}</span>
                  </div>
                  <div class="schueler-list">
                    <div v-if="dbSchueler.length === 0" class="panel-empty">
                      <i class="pi pi-users" />
                      <span>Schüler über „Laden" aus der Datenbank holen</span>
                    </div>
                    <div v-else-if="poolJahrgangsWarnung" class="list-hint list-hint--warn">
                      <i class="pi pi-exclamation-triangle" />
                      {{ poolJahrgangsWarnung }}
                    </div>
                    <div v-else-if="filteredPool.length === 0 && selectedKursId" class="list-hint">
                      Alle gefilterten Schüler sind diesem Kurs zugewiesen
                    </div>
                    <div v-else-if="filteredPool.length === 0" class="list-hint">
                      Kein Schüler entspricht dem Filter
                    </div>
                    <div
                      v-for="s in filteredPool"
                      :key="s.id"
                      class="schueler-row"
                      :class="{ 'schueler-row--disabled': !selectedKursId }"
                      @click="onPoolStudentClick(s.id)"
                    >
                      <span class="schueler-name">{{ s.nachname }},&nbsp;{{ s.vorname }}</span>
                      <span class="klasse-tag">{{ s.klasse }}</span>
                      <i v-if="selectedKursId" class="pi pi-plus schueler-row-action" />
                    </div>
                  </div>
                </div>

                <!-- Zugewiesen zu gewähltem Kurs -->
                <div class="schueler-section" :class="{ 'schueler-section--inactive': !selectedKursId }">
                  <div class="panel-header">
                    <span class="panel-title">
                      {{ selectedKursId ? `Zugewiesen: ${selectedKursLabel}` : 'Zuerst Kurs wählen' }}
                    </span>
                    <span v-if="selectedKursJahrgaengeLabel" class="panel-jahrgaenge">
                      Zulässige Jahrgänge: {{ selectedKursJahrgaengeLabel }}
                    </span>
                    <span v-if="selectedKursId" class="panel-count">{{ filteredAssigned.length }}</span>
                  </div>
                  <div class="schueler-list schueler-list--assigned">
                    <div v-if="!selectedKursId" class="list-hint list-hint--muted">
                      Kurs in der linken Liste anklicken
                    </div>
                    <div v-else-if="filteredAssigned.length === 0" class="list-hint">
                      Noch kein Schüler zugewiesen — links anklicken zum Hinzufügen
                    </div>
                    <div
                      v-for="s in filteredAssigned"
                      :key="s.id"
                      class="schueler-row schueler-row--assigned"
                      @click="onAssignedStudentClick(s.id)"
                    >
                      <span class="schueler-name">{{ s.nachname }},&nbsp;{{ s.vorname }}</span>
                      <span class="klasse-tag">{{ s.klasse }}</span>
                      <i class="pi pi-times schueler-row-action schueler-row-action--remove" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </TabPanel>

      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AgGridVue } from '@ag-grid-community/vue3'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry, type ColDef, type GetRowIdParams, type GridApi } from '@ag-grid-community/core'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import FileUpload from 'primevue/fileupload'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Badge from 'primevue/badge'
import { useSchuleStore } from '@/stores/schule'
import { useDarkMode } from '@/composables/useDarkMode'
import {
  fetchLehrkraefte, fetchFaecher, fetchKlassenDetails, fetchJahrgaenge,
  fetchSchuelerAuswahlliste, fetchLernabschnittId, createLeistungsdaten, createKurs,
  fetchKurseFuerAbschnitt, createSchuelerLeistungsdaten, patchSchuelerLeistungsdaten,
  fetchLeistungsdatenFuerLernabschnitt, deleteSchuelerLeistungsdaten,
  type LehrkraftListEntry, type DbKursEintrag, type SchuelerAuswahl, type LeistungsdatenEintrag,
} from '@/services/svwsService'
import { fetchKursartenForSchulform } from '@/services/katalogService'
import type { KlasseDetails } from '@/models/Klassen'
import type { FachDetails } from '@/models/Faecher'
import type { JahrgangDetails } from '@/models/Jahrgaenge'

ModuleRegistry.registerModules([ClientSideRowModelModule])

// ── Typen ─────────────────────────────────────────────────────────────────

interface BaseRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
}

interface KlassenunterrichtRow extends BaseRow {
  schuljahr: string
  abschnitt: string
  klasse: string
  lehrerKuerzel: string
  kursart: string
  fach: string
  wochenstunden: string
  aufsZeugnis: string
  // aufgelöste IDs
  idSchuljahresabschnitt: number | null
  idKlasse: number | null
  idLehrer: number | null
  idFach: number | null
  _kursartOk: boolean
}

interface KursRow extends BaseRow {
  schuljahr: string
  abschnitt: string
  kuerzel: string
  lehrerkuerzel: string
  kursart: string
  fach: string
  jahrgaenge: string
  zeugnisbezeichnung: string
  wochenstunden: string
  wochenstundenlehrkraft: string
  fortschreibungsart: string
  schienen: string
  istepochal: string
  // aufgelöste IDs
  idSchuljahresabschnitt: number | null
  idFach: number | null
  idLehrer: number | null
  idJahrgaenge: number[]
  _duplicate: boolean
}

interface SchuelerUnterrichtRow extends BaseRow {
  nachname: string
  vorname: string
  geburtsdatum: string
  schuljahr: string
  abschnitt: string
  fach: string
  fachlehrer: string
  kurs: string
  kursart: string
  jahrgaenge: string
  note: string
  abiturfach: string
  wochenstd: string
  externeschulnr: string
  zusatzkraft: string
  wochenstdzusatzkraft: string
  fehlstd: string
  unentschfehlstd: string
  mahnung: string
  mahndatum: string
  // resolved
  idSchuljahresabschnitt: number | null
  idSchueler: number | null
  idFach: number | null
  idKurs: number | null
  idLehrer: number | null
  idZusatzkraft: number | null
  idLernabschnitt: number | null
}

interface DbKurs {
  id: number
  fach: string
  kursart: string
  kuerzel: string
  lehrer: string
  idFach: number
  idLehrer: number | null
  wochenstunden: number
  idJahrgaenge: number[]
}

interface DbSchueler {
  id: number
  nachname: string
  vorname: string
  klasse: string
  jahrgang: string
}

// ── Stores & Composables ──────────────────────────────────────────────────

const router = useRouter()
const schuleStore = useSchuleStore()
const { isDark } = useDarkMode()

// ── Schuljahresabschnitt ──────────────────────────────────────────────────

const idSchuljahresabschnitt = ref<number | null>(null)

onMounted(() => {
  if (schuleStore.loaded) {
    idSchuljahresabschnitt.value =
      schuleStore.aktuellerAbschnittId ?? schuleStore.abschnitteOptions[0]?.id ?? null
  }
})

// ── Tab-State ─────────────────────────────────────────────────────────────

const activeTab = ref<'klasse' | 'kurs' | 'schueler' | 'zuweisung'>('klasse')

watch(activeTab, (tab) => {
  if (tab !== 'zuweisung') return
  if (dbKurse.value.length === 0) loadKurse()
  if (dbSchueler.value.length === 0) loadSchueler()
})
const parseError = ref('')
const klasseHintOpen = ref(false)
const kursHintOpen = ref(false)
const schuelerHintOpen = ref(false)

// ── Tab 1: Klassenunterricht ──────────────────────────────────────────────

const klasseRows = ref<KlassenunterrichtRow[]>([])
const parsingKlasse = ref(false)
const loadingKlasseLookups = ref(false)
const klasseFileKey = ref(0)

const cachedLehrkraefte = ref<LehrkraftListEntry[]>([])
const cachedFaecher = ref<FachDetails[]>([])
const cachedKlassenByAbschnitt = ref<Record<number, KlasseDetails[]>>({})
const cachedKursarten = ref<Set<string>>(new Set())

const klasseWarnCount = computed(() => klasseRows.value.filter(r => !r._valid && !r._sent).length)
const klasseImport = ref({ running: false, total: 0, done: 0, errors: 0 })
const klasseGridApi = ref<GridApi<KlassenunterrichtRow> | null>(null)
const klasseSelectedCount = ref(0)

function onKlasseGridReady(params: { api: GridApi<KlassenunterrichtRow> }): void {
  klasseGridApi.value = params.api
}

function onKlasseSelectionChanged(): void {
  klasseSelectedCount.value = klasseGridApi.value?.getSelectedRows().length ?? 0
}

async function onKlasseFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  parsingKlasse.value = true
  parseError.value = ''
  try {
    klasseRows.value = await parseKlassenunterrichtCsv(file)
    await loadKlassenunterrichtLookups(klasseRows.value)
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen'
  } finally {
    parsingKlasse.value = false
  }
}

function normDate(d: string): string {
  const m = d.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d
}

function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === sep && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += ch }
  }
  result.push(current.trim())
  return result
}

async function parseKlassenunterrichtCsv(file: File): Promise<KlassenunterrichtRow[]> {
  const text = await file.text()
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) throw new Error('Keine Datenzeilen gefunden')
  const sep = lines[0].includes(';') ? ';' : lines[0].includes('|') ? '|' : ','
  const header = parseCsvLine(lines[0], sep).map(h => h.toLowerCase())
  const col = (names: string[]) => names.reduce((found, n) => found !== -1 ? found : header.indexOf(n), -1)

  const rows: KlassenunterrichtRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvLine(lines[i], sep)
    const get = (names: string[]) => (c[col(names)] ?? '').trim()
    rows.push({
      _id: crypto.randomUUID(),
      _valid: true,
      _errors: [],
      _sent: false,
      schuljahr:     get(['schuljahr', 'jahr']),
      abschnitt:     get(['abschnitt']),
      klasse:        get(['klasse']),
      lehrerKuerzel: get(['lehrerkuerzel', 'lehrer', 'fachlehrer']),
      kursart:       get(['kursart']),
      fach:          get(['fach']),
      wochenstunden: get(['wochenstunden', 'wochenstd.']),
      aufsZeugnis:   get(['aufszerugnis', 'aufszeugnis', 'aufszeugnis']),
      idSchuljahresabschnitt: null,
      idKlasse: null,
      idLehrer: null,
      idFach: null,
      _kursartOk: false,
    })
  }
  if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
  return rows
}

async function loadKlassenunterrichtLookups(_rows: KlassenunterrichtRow[]): Promise<void> {
  loadingKlasseLookups.value = true
  try {
    const schulform = schuleStore.schulform ?? ''
    const [lehrkraefte, faecher, kursarten] = await Promise.all([
      fetchLehrkraefte(),
      fetchFaecher(),
      schulform ? fetchKursartenForSchulform(schulform) : Promise.resolve(new Set<string>()),
    ])
    cachedLehrkraefte.value = lehrkraefte
    cachedFaecher.value = faecher
    cachedKursarten.value = kursarten

    // Klassen für den gewählten Abschnitt laden (nicht aus CSV ableiten)
    const selectedId = idSchuljahresabschnitt.value
    if (selectedId !== null && !cachedKlassenByAbschnitt.value[selectedId]) {
      const klassen = await fetchKlassenDetails(selectedId)
      cachedKlassenByAbschnitt.value = { ...cachedKlassenByAbschnitt.value, [selectedId]: klassen }
    }

    resolveKlasseRows()
    klasseRows.value = [...klasseRows.value]
  } finally {
    loadingKlasseLookups.value = false
  }
}

function resolveKlasseRows(): void {
  const selectedId = idSchuljahresabschnitt.value
  const selectedSja = selectedId !== null
    ? schuleStore.abschnitte.find(a => a.id === selectedId)
    : null
  const klassen = selectedId !== null ? (cachedKlassenByAbschnitt.value[selectedId] ?? []) : []

  for (const row of klasseRows.value) {
    row._errors = []

    // Abschnitt: immer der gewählte — nur Plausibilitätswarnung wenn CSV-Wert abweicht
    row.idSchuljahresabschnitt = selectedId
    if (selectedId === null) {
      row._errors.push('Kein Schuljahresabschnitt ausgewählt')
    } else if (selectedSja && row.schuljahr && row.abschnitt) {
      const csvMismatch =
        String(selectedSja.schuljahr) !== row.schuljahr ||
        String(selectedSja.abschnitt) !== row.abschnitt
      if (csvMismatch)
        row._errors.push(
          `CSV-Abschnitt ${row.schuljahr}/${row.abschnitt} weicht vom gewählten Abschnitt ab`,
        )
    }

    const lehrer = cachedLehrkraefte.value.find(
      l => l.kuerzel.toLowerCase() === row.lehrerKuerzel.toLowerCase(),
    )
    row.idLehrer = lehrer?.id ?? null
    if (!lehrer && row.lehrerKuerzel)
      row._errors.push(`Lehrer „${row.lehrerKuerzel}" nicht gefunden`)

    const fach = cachedFaecher.value.find(
      f => f.kuerzel.toLowerCase() === row.fach.toLowerCase(),
    )
    row.idFach = fach?.id ?? null
    if (!fach && row.fach)
      row._errors.push(`Fach „${row.fach}" nicht gefunden`)

    const klasse = klassen.find(k => k.kuerzel.toLowerCase() === row.klasse.toLowerCase())
    row.idKlasse = klasse?.id ?? null
    if (!klasse && row.klasse)
      row._errors.push(`Klasse „${row.klasse}" nicht im gewählten Abschnitt gefunden`)

    const kursartenKatalog = cachedKursarten.value
    row._kursartOk = !row.kursart || kursartenKatalog.size === 0 || kursartenKatalog.has(row.kursart)
    if (row.kursart && kursartenKatalog.size > 0 && !kursartenKatalog.has(row.kursart))
      row._errors.push(`Kursart „${row.kursart}" für Schulform ${schuleStore.schulform ?? '?'} nicht zulässig`)

    row._valid = row._errors.length === 0
  }
}

async function handleKlasseImport(): Promise<void> {
  const abschnittId: number = idSchuljahresabschnitt.value ?? 0
  if (!abschnittId) return

  const selected = klasseGridApi.value?.getSelectedRows() ?? []
  const rows = (selected.length > 0 ? selected : klasseRows.value)
    .filter(r => r._valid && !r._sent)
  if (rows.length === 0) return

  // Alle Schüler des Abschnitts einmalig laden
  const alleSchueler = await fetchSchuelerAuswahlliste(abschnittId)
  // Nur aktive (status 2), nicht gelöschte Schüler
  const aktiveSchueler = alleSchueler.filter(s => s.status === 2)

  // Lernabschnitt-IDs cachen: ein Schüler kommt bei mehreren Fächern wieder vor
  const lernabschnittCache = new Map<number, number | null>()
  async function getLernabschnittId(schuelerId: number): Promise<number | null> {
    if (lernabschnittCache.has(schuelerId)) return lernabschnittCache.get(schuelerId)!
    const id = await fetchLernabschnittId(schuelerId, abschnittId)
    lernabschnittCache.set(schuelerId, id)
    return id
  }

  // Gesamtzahl vorberechnen für Fortschrittsanzeige
  const total = rows.reduce((sum, row) =>
    sum + aktiveSchueler.filter(s => s.idKlasse === row.idKlasse).length, 0)
  klasseImport.value = { running: true, total, done: 0, errors: 0 }

  for (const row of rows) {
    if (row.idFach === null || row.idKlasse === null) continue
    const schuelerInKlasse = aktiveSchueler.filter(s => s.idKlasse === row.idKlasse)

    for (const schueler of schuelerInKlasse) {
      const lernabschnittId = await getLernabschnittId(schueler.id)
      if (lernabschnittId === null) {
        klasseImport.value.errors++
        klasseImport.value.done++
        continue
      }
      const result = await createLeistungsdaten({
        lernabschnittID: lernabschnittId,
        fachID: row.idFach,
        kursart: row.kursart,
        lehrerID: row.idLehrer,
        wochenstunden: row.wochenstunden ? parseInt(row.wochenstunden) || null : null,
        aufZeugnis: row.aufsZeugnis.toLowerCase() === 'true',
      })
      if (!result.success) klasseImport.value.errors++
      klasseImport.value.done++
    }
    row._sent = true
  }

  klasseRows.value = klasseRows.value.map(r => ({ ...r }))
  klasseImport.value.running = false
}

// ── Tab 2: Kursunterricht (Kurse anlegen) ─────────────────────────────────

const kursRows = ref<KursRow[]>([])
const parsingKurs = ref(false)
const kursFileKey = ref(0)
const loadingKursLookups = ref(false)
const cachedJahrgaenge = ref<JahrgangDetails[]>([])
const kursImport = ref({ running: false, total: 0, done: 0, errors: 0 })
const cachedDbKursByAbschnitt = ref<Record<number, DbKursEintrag[]>>({})
const kursGridApi = ref<GridApi<KursRow> | null>(null)
const kursSelectedCount = ref(0)

function onKursGridReady(params: { api: GridApi<KursRow> }): void {
  kursGridApi.value = params.api
}

function onKursSelectionChanged(): void {
  kursSelectedCount.value = kursGridApi.value?.getSelectedRows().length ?? 0
}

async function onKursFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  parsingKurs.value = true
  parseError.value = ''
  try {
    cachedDbKursByAbschnitt.value = {}
    kursRows.value = await parseKurseCsv(file)
    await loadKursLookups()
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen'
  } finally {
    parsingKurs.value = false
  }
}

async function parseKurseCsv(file: File): Promise<KursRow[]> {
  const text = await file.text()
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) throw new Error('Keine Datenzeilen gefunden')
  const sep = lines[0].includes(';') ? ';' : lines[0].includes('|') ? '|' : ','
  const header = parseCsvLine(lines[0], sep).map(h => h.toLowerCase())
  const col = (names: string[]) => names.reduce((found, n) => found !== -1 ? found : header.indexOf(n), -1)

  const rows: KursRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvLine(lines[i], sep)
    const get = (names: string[]) => (c[col(names)] ?? '').trim()
    rows.push({
      _id: crypto.randomUUID(),
      _valid: true,
      _errors: [],
      _sent: false,
      schuljahr:             get(['schuljahr', 'jahr']),
      abschnitt:             get(['abschnitt']),
      kuerzel:               get(['kuerzel']),
      lehrerkuerzel:         get(['lehrerkuerzel', 'lehrer', 'fachlehrer']),
      kursart:               get(['kursart']),
      fach:                  get(['fach']),
      jahrgaenge:            get(['jahrgaenge', 'jahrgang']),
      zeugnisbezeichnung:    get(['zeugnisbezeichnung', 'bezeichnungzeugnis']),
      wochenstunden:         get(['wochenstunden', 'wochenstd.']),
      wochenstundenlehrkraft: get(['wochenstundenlehrkraft', 'wochenstundenlehrer']),
      fortschreibungsart:    get(['fortschreibungsart']),
      schienen:              get(['schienen']),
      istepochal:            get(['istepochal', 'istepochalunterricht']),
      idSchuljahresabschnitt: null,
      idFach: null,
      idLehrer: null,
      idJahrgaenge: [],
      _duplicate: false,
    })
  }
  if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
  return rows
}

async function loadKursLookups(): Promise<void> {
  loadingKursLookups.value = true
  try {
    const [lehrkraefte, faecher, jahrgaenge] = await Promise.all([
      cachedLehrkraefte.value.length ? Promise.resolve(cachedLehrkraefte.value) : fetchLehrkraefte(),
      cachedFaecher.value.length    ? Promise.resolve(cachedFaecher.value)    : fetchFaecher(),
      cachedJahrgaenge.value.length ? Promise.resolve(cachedJahrgaenge.value) : fetchJahrgaenge(),
    ])
    cachedLehrkraefte.value = lehrkraefte
    cachedFaecher.value     = faecher
    cachedJahrgaenge.value  = jahrgaenge

    // DB-Kurse für alle eindeutigen Abschnitte aus der CSV laden
    const abschnittIds = new Set<number>()
    if (idSchuljahresabschnitt.value !== null) abschnittIds.add(idSchuljahresabschnitt.value)
    for (const row of kursRows.value) {
      const sja = schuleStore.abschnitte.find(
        a => String(a.schuljahr) === row.schuljahr && String(a.abschnitt) === row.abschnitt,
      )
      if (sja) abschnittIds.add(sja.id)
    }
    await Promise.all(
      [...abschnittIds]
        .filter(id => !cachedDbKursByAbschnitt.value[id])
        .map(async id => {
          const kurse = await fetchKurseFuerAbschnitt(id)
          cachedDbKursByAbschnitt.value = {
            ...cachedDbKursByAbschnitt.value,
            [id]: kurse,
          }
        }),
    )

    resolveKursRows()
    checkCsvDuplicates()
    kursRows.value = [...kursRows.value]
  } finally {
    loadingKursLookups.value = false
  }
}

function resolveKursRows(): void {
  for (const row of kursRows.value) {
    row._errors = []

    if (row.schuljahr && row.abschnitt) {
      const sja = schuleStore.abschnitte.find(
        a => String(a.schuljahr) === row.schuljahr && String(a.abschnitt) === row.abschnitt,
      )
      row.idSchuljahresabschnitt = sja?.id ?? null
      if (!sja)
        row._errors.push(`Schuljahresabschnitt ${row.schuljahr}/${row.abschnitt} nicht gefunden`)
    } else {
      row.idSchuljahresabschnitt = idSchuljahresabschnitt.value
    }

    const fach = cachedFaecher.value.find(f => f.kuerzel.toLowerCase() === row.fach.toLowerCase())
    row.idFach = fach?.id ?? null
    if (!fach && row.fach) row._errors.push(`Fach „${row.fach}" nicht gefunden`)

    const lehrer = cachedLehrkraefte.value.find(
      l => l.kuerzel.toLowerCase() === row.lehrerkuerzel.toLowerCase(),
    )
    row.idLehrer = lehrer?.id ?? null
    if (!lehrer && row.lehrerkuerzel) row._errors.push(`Lehrer „${row.lehrerkuerzel}" nicht gefunden`)

    row.idJahrgaenge = []
    const jgRaw = row.jahrgaenge.trim()
    if (jgRaw) {
      for (const kuerzel of jgRaw.split(/[,/]/).map(s => s.trim()).filter(Boolean)) {
        const jg = cachedJahrgaenge.value.find(
          j => j.kuerzel?.toLowerCase() === kuerzel.toLowerCase() ||
               j.kuerzelStatistik?.toLowerCase() === kuerzel.toLowerCase(),
        )
        if (jg) row.idJahrgaenge.push(jg.id)
        else    row._errors.push(`Jahrgang „${kuerzel}" nicht gefunden`)
      }
    }

    // Duplikat-Check gegen DB — nur wenn kuerzel + idFach + kursart + idJahrgaenge übereinstimmen
    row._duplicate = false
    if (row.idSchuljahresabschnitt !== null && row.kuerzel && row.idFach !== null) {
      const dbKurse = cachedDbKursByAbschnitt.value[row.idSchuljahresabschnitt] ?? []
      const rowJg = [...row.idJahrgaenge].sort((a, b) => a - b)
      const isDuplicate = dbKurse.some(k => {
        if (k.kuerzel.toLowerCase() !== row.kuerzel.toLowerCase()) return false
        if (k.idFach !== row.idFach) return false
        if ((k.kursartAllg ?? '').toLowerCase() !== row.kursart.toLowerCase()) return false
        const dbJg = [...(k.idJahrgaenge ?? [])].sort((a, b) => a - b)
        return dbJg.length === rowJg.length && dbJg.every((id, i) => id === rowJg[i])
      })
      if (isDuplicate) {
        row._duplicate = true
        row._errors.push(`Kurs mit Kürzel „${row.kuerzel}", diesem Fach, dieser Kursart und diesen Jahrgängen existiert bereits`)
      }
    }

    row._valid = row._errors.length === 0
  }
}

function checkCsvDuplicates(): void {
  const seen = new Map<string, KursRow[]>()
  for (const row of kursRows.value) {
    if (!row.kuerzel || row.idSchuljahresabschnitt === null) continue
    const key = `${row.idSchuljahresabschnitt}::${row.kuerzel.toLowerCase()}`
    const group = seen.get(key) ?? []
    group.push(row)
    seen.set(key, group)
  }
  for (const group of seen.values()) {
    if (group.length < 2) continue
    for (const row of group) {
      if (!row._duplicate) {
        row._duplicate = true
        row._valid = false
        row._errors.push(`Kürzel „${row.kuerzel}" kommt in der Datei mehrfach im selben Abschnitt vor`)
      }
    }
  }
}

function kursStatusCell(p: { data: KursRow }): string {
  if (p.data._sent)      return '<span style="color:#22c55e">✔ Gesendet</span>'
  if (p.data._duplicate) return `<span style="color:#ef4444" title="${p.data._errors.join('; ')}">⊗ Doppelt</span>`
  if (!p.data._valid)    return `<span style="color:#ef4444" title="${p.data._errors.join('; ')}">✖ Fehler</span>`
  return '<span style="color:#f59e0b">● Bereit</span>'
}

function mapFortschreibungsart(raw: string): number {
  switch (raw.trim().toLowerCase()) {
    case 'jghoch':    return 1  // Nur Definition, Jahrgang hochschreiben
    case 'jghalten':  return 2  // Nur Definition, Jahrgang beibehalten
    case 'komplett':  return 3  // Komplett
    default:          return 0  // keine
  }
}

async function handleKursImport(): Promise<void> {
  const selected = kursGridApi.value?.getSelectedRows() ?? []
  const rows = (selected.length > 0 ? selected : kursRows.value)
    .filter(r => r._valid && !r._sent)
  if (rows.length === 0) return

  kursImport.value = { running: true, total: rows.length, done: 0, errors: 0 }
  for (const row of rows) {
    if (row.idFach === null || row.idSchuljahresabschnitt === null) {
      kursImport.value.errors++
      kursImport.value.done++
      continue
    }
    const result = await createKurs({
      idSchuljahresabschnitt: row.idSchuljahresabschnitt,
      kuerzel:                row.kuerzel || `${row.fach}${row.kursart}`,
      idJahrgaenge:           row.idJahrgaenge,
      idFach:                 row.idFach,
      lehrer:                 row.idLehrer,
      kursartAllg:            row.kursart,
      sortierung:             0,
      istSichtbar:            true,
      schienen:               [],
      wochenstunden:          parseInt(row.wochenstunden) || 0,
      wochenstundenLehrer:    parseInt(row.wochenstundenlehrkraft) || parseInt(row.wochenstunden) || 0,
      idKursFortschreibungsart: mapFortschreibungsart(row.fortschreibungsart),
      schulnummer:            null,
      istEpochalunterricht:   row.istepochal.toLowerCase() === 'true',
      bezeichnungZeugnis:     row.zeugnisbezeichnung,
    })
    if (!result.success) kursImport.value.errors++
    else row._sent = true
    kursImport.value.done++
  }
  kursRows.value = kursRows.value.map(r => ({ ...r }))
  kursImport.value.running = false
}

// ── Tab 3: Schülerunterricht ──────────────────────────────────────────────

const schuelerRows = ref<SchuelerUnterrichtRow[]>([])
const parsingSchueler = ref(false)
const schuelerFileKey = ref(0)
const loadingSchuelerLookups = ref(false)
const schuelerImport = ref({ running: false, total: 0, done: 0, errors: 0 })
const schuelerGridApi = ref<GridApi<SchuelerUnterrichtRow> | null>(null)
const schuelerSelectedCount = ref(0)
const cachedSchuelerListe = ref<SchuelerAuswahl[]>([])

function onSchuelerGridReady(params: { api: GridApi<SchuelerUnterrichtRow> }): void {
  schuelerGridApi.value = params.api
}

function onSchuelerSelectionChanged(): void {
  schuelerSelectedCount.value = schuelerGridApi.value?.getSelectedRows().length ?? 0
}

async function onSchuelerFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  parsingSchueler.value = true
  parseError.value = ''
  try {
    cachedSchuelerListe.value = []
    schuelerRows.value = await parseSchuelerLeistungsdaten(file)
    await loadSchuelerLookups()
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen'
  } finally {
    parsingSchueler.value = false
  }
}

async function parseSchuelerLeistungsdaten(file: File): Promise<SchuelerUnterrichtRow[]> {
  const text = await file.text()
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) throw new Error('Keine Datenzeilen gefunden')
  const sep = lines[0].includes(';') ? ';' : lines[0].includes('|') ? '|' : ','
  const header = parseCsvLine(lines[0], sep).map(h => h.toLowerCase())
  const col = (names: string[]) => names.reduce((found, n) => found !== -1 ? found : header.indexOf(n), -1)
  const rows: SchuelerUnterrichtRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvLine(lines[i], sep)
    const get = (names: string[]) => (c[col(names)] ?? '').trim()
    rows.push({
      _id: crypto.randomUUID(),
      _valid: true,
      _errors: [],
      _sent: false,
      nachname:             get(['nachname']),
      vorname:              get(['vorname']),
      geburtsdatum:         get(['geburtsdatum']),
      schuljahr:            get(['schuljahr', 'jahr']),
      abschnitt:            get(['abschnitt']),
      fach:                 get(['fach']),
      fachlehrer:           get(['fachlehrer']),
      kurs:                 get(['kurs']),
      kursart:              get(['kursart']),
      jahrgaenge:           get(['jahrgaenge', 'jahrgang']),
      note:                 get(['note']),
      abiturfach:           get(['abiturfach']),
      wochenstd:            get(['wochenstd', 'wochenstunden']),
      externeschulnr:       get(['externeschulnr']),
      zusatzkraft:          get(['zusatzkraft']),
      wochenstdzusatzkraft: get(['wochenstdzusatzkraft']),
      fehlstd:              get(['fehlstd']),
      unentschfehlstd:      get(['unentschfehlstd']),
      mahnung:              get(['mahnung']),
      mahndatum:            get(['mahndatum']),
      idSchuljahresabschnitt: null,
      idSchueler: null,
      idFach: null,
      idKurs: null,
      idLehrer: null,
      idZusatzkraft: null,
      idLernabschnitt: null,
    })
  }
  if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
  return rows
}

async function loadSchuelerLookups(): Promise<void> {
  loadingSchuelerLookups.value = true
  try {
    const [lehrkraefte, faecher] = await Promise.all([
      cachedLehrkraefte.value.length ? Promise.resolve(cachedLehrkraefte.value) : fetchLehrkraefte(),
      cachedFaecher.value.length    ? Promise.resolve(cachedFaecher.value)    : fetchFaecher(),
    ])
    cachedLehrkraefte.value = lehrkraefte
    cachedFaecher.value     = faecher

    const abschnittIds = new Set<number>()
    for (const row of schuelerRows.value) {
      if (row.schuljahr && row.abschnitt) {
        const sja = schuleStore.abschnitte.find(
          a => String(a.schuljahr) === row.schuljahr && String(a.abschnitt) === row.abschnitt,
        )
        if (sja) abschnittIds.add(sja.id)
      }
    }
    if (idSchuljahresabschnitt.value !== null) abschnittIds.add(idSchuljahresabschnitt.value)

    await Promise.all([...abschnittIds].map(async id => {
      const [kurse, alleSchueler] = await Promise.all([
        fetchKurseFuerAbschnitt(id),
        fetchSchuelerAuswahlliste(id),
      ])
      cachedDbKursByAbschnitt.value = { ...cachedDbKursByAbschnitt.value, [id]: kurse }
      for (const s of alleSchueler.filter(s => s.status === 2)) {
        if (!cachedSchuelerListe.value.some(x => x.id === s.id))
          cachedSchuelerListe.value.push(s)
      }
    }))

    resolveSchuelerRows()
    schuelerRows.value = schuelerRows.value.map(r => ({ ...r }))
  } finally {
    loadingSchuelerLookups.value = false
  }
}

function resolveSchuelerRows(): void {
  for (const row of schuelerRows.value) {
    row._errors = []

    if (row.schuljahr && row.abschnitt) {
      const sja = schuleStore.abschnitte.find(
        a => String(a.schuljahr) === row.schuljahr && String(a.abschnitt) === row.abschnitt,
      )
      row.idSchuljahresabschnitt = sja?.id ?? null
      if (!sja) row._errors.push(`Abschnitt ${row.schuljahr}/${row.abschnitt} nicht gefunden`)
    } else {
      row.idSchuljahresabschnitt = idSchuljahresabschnitt.value
    }

    const match = cachedSchuelerListe.value.find(s => {
      const nOk = s.nachname.toLowerCase() === row.nachname.toLowerCase()
      const vOk = s.vorname.toLowerCase() === row.vorname.toLowerCase()
      if (!nOk || !vOk) return false
      if (!row.geburtsdatum) return true
      const dbGeb = String((s as Record<string, unknown>).geburtsdatum ?? '')
      return normDate(dbGeb) === normDate(row.geburtsdatum)
    })
    row.idSchueler = match?.id ?? null
    if (!match) row._errors.push(`Schüler „${row.nachname}, ${row.vorname}" nicht gefunden`)

    const fach = cachedFaecher.value.find(f => f.kuerzel.toLowerCase() === row.fach.toLowerCase())
    row.idFach = fach?.id ?? null
    if (!fach && row.fach) row._errors.push(`Fach „${row.fach}" nicht gefunden`)

    const lehrer = cachedLehrkraefte.value.find(
      l => l.kuerzel.toLowerCase() === row.fachlehrer.toLowerCase(),
    )
    row.idLehrer = lehrer?.id ?? null
    if (!lehrer && row.fachlehrer) row._errors.push(`Lehrer „${row.fachlehrer}" nicht gefunden`)

    const zusatz = cachedLehrkraefte.value.find(
      l => l.kuerzel.toLowerCase() === row.zusatzkraft.toLowerCase(),
    )
    row.idZusatzkraft = zusatz?.id ?? null
    if (!zusatz && row.zusatzkraft) row._errors.push(`Zusatzkraft „${row.zusatzkraft}" nicht gefunden`)

    row.idKurs = null
    if (row.kurs && row.idSchuljahresabschnitt !== null) {
      const dbKurse = cachedDbKursByAbschnitt.value[row.idSchuljahresabschnitt] ?? []
      const matched = dbKurse.find(k => k.kuerzel.toLowerCase() === row.kurs.toLowerCase())
      row.idKurs = matched?.id ?? null
      if (!matched) row._errors.push(`Kurs „${row.kurs}" in diesem Abschnitt nicht gefunden`)
    }

    row._valid = row._errors.length === 0
  }
}

async function handleSchuelerImport(): Promise<void> {
  const selected = schuelerGridApi.value?.getSelectedRows() ?? []
  const rows = (selected.length > 0 ? selected : schuelerRows.value)
    .filter(r => r._valid && !r._sent)
  if (rows.length === 0) return

  schuelerImport.value = { running: true, total: rows.length, done: 0, errors: 0 }

  const lernabschnittCache = new Map<string, number | null>()
  async function getLernabschnittId(schuelerId: number, abschnittId: number): Promise<number | null> {
    const key = `${schuelerId}:${abschnittId}`
    if (lernabschnittCache.has(key)) return lernabschnittCache.get(key)!
    const id = await fetchLernabschnittId(schuelerId, abschnittId)
    lernabschnittCache.set(key, id)
    return id
  }

  // Vorhandene Leistungsdaten je Lernabschnitt cachen (für Duplikaterkennung)
  const vorhandeneLeistungsdaten = new Map<number, Array<{ id: number; fachID: number }>>()
  async function getVorhandene(lernabschnittId: number) {
    if (vorhandeneLeistungsdaten.has(lernabschnittId))
      return vorhandeneLeistungsdaten.get(lernabschnittId)!
    const data = await fetchLeistungsdatenFuerLernabschnitt(lernabschnittId)
    vorhandeneLeistungsdaten.set(lernabschnittId, data)
    return data
  }

  for (const row of rows) {
    if (row.idSchueler === null || row.idFach === null || row.idSchuljahresabschnitt === null) {
      row._valid = false
      schuelerImport.value.errors++
      schuelerImport.value.done++
      continue
    }

    const lernabschnittId = await getLernabschnittId(row.idSchueler, row.idSchuljahresabschnitt)
    if (lernabschnittId === null) {
      row._errors.push('Lernabschnitt nicht gefunden')
      row._valid = false
      schuelerImport.value.errors++
      schuelerImport.value.done++
      continue
    }

    // Duplikaterkennung: existiert bereits ein Eintrag für dieses Fach?
    const vorhandene = await getVorhandene(lernabschnittId)
    if (vorhandene.some(e => e.fachID === row.idFach)) {
      row._errors.push(`Leistungsdaten für Fach „${row.fach}" bereits vorhanden — übersprungen`)
      row._sent = true  // als "bereits erledigt" markieren, Button importiert nicht erneut
      schuelerImport.value.done++
      continue
    }

    const createResult = await createSchuelerLeistungsdaten(lernabschnittId, row.idFach)
    if (!createResult.success || !createResult.id) {
      row._errors.push(createResult.error ?? 'Fehler beim Anlegen')
      row._valid = false
      schuelerImport.value.errors++
      schuelerImport.value.done++
      continue
    }

    const patch: Record<string, unknown> = {}
    if (row.idLehrer !== null)         patch.lehrerID                 = row.idLehrer
    if (row.idKurs !== null)           patch.kursID                   = row.idKurs
    if (row.kursart)                   patch.kursart                  = row.kursart
    if (row.note)                      patch.note                     = row.note
    if (row.abiturfach)                patch.abifach                  = parseInt(row.abiturfach) || null
    if (row.wochenstd)                 patch.wochenstunden            = parseInt(row.wochenstd) || null
    if (row.externeschulnr)            patch.koopSchule               = row.externeschulnr
    if (row.idZusatzkraft !== null)    patch.zusatzkraftID            = row.idZusatzkraft
    if (row.wochenstdzusatzkraft)      patch.zusatzkraftWochenstunden = parseInt(row.wochenstdzusatzkraft) || null
    if (row.fehlstd)                   patch.fehlstundenGesamt        = parseInt(row.fehlstd) || 0
    if (row.unentschfehlstd)           patch.fehlstundenUnentschuldigt = parseInt(row.unentschfehlstd) || 0
    if (row.mahnung)                   patch.istGemahnt               = ['true', 'ja', '1', 'j', 'x'].includes(row.mahnung.toLowerCase())
    if (row.mahndatum)                 patch.mahndatum                = row.mahndatum

    if (Object.keys(patch).length > 0) {
      const patchResult = await patchSchuelerLeistungsdaten(createResult.id, patch)
      if (!patchResult.success) {
        // Rollback: soeben angelegten Eintrag wieder löschen
        await deleteSchuelerLeistungsdaten(createResult.id)
        row._errors.push(
          (patchResult.error ?? 'Fehler beim Patchen') + ' — Eintrag wurde rückgängig gemacht',
        )
        row._valid = false
        schuelerImport.value.errors++
        schuelerImport.value.done++
        continue
      }
    }

    // Lokalen Cache aktualisieren, damit ein zweiter Eintrag im gleichen Lauf erkannt wird
    vorhandeneLeistungsdaten.get(lernabschnittId)?.push({ id: createResult.id, fachID: row.idFach })

    row._sent = true
    schuelerImport.value.done++
  }

  schuelerRows.value = schuelerRows.value.map(r => ({ ...r }))
  schuelerImport.value.running = false
}

// ── Tab 4: Kurszuweisung (Drag & Drop) ────────────────────────────────────

const dbKurse = ref<DbKurs[]>([])
const dbSchueler = ref<DbSchueler[]>([])
// kursId → Array der zugewiesenen Schüler-IDs (inkl. unsaved changes)
const assignments = ref<Record<number, number[]>>({})
// Unveränderlicher DB-Stand (für Diff beim Speichern)
const dbAssignments = ref<Record<number, number[]>>({})
// IDs der neu hinzugefügten bzw. entfernten Zuweisungen (für Speichern-Button)
const pendingAdded = ref<{ kursId: number; schuelerId: number }[]>([])
const pendingRemoved = ref<{ kursId: number; schuelerId: number }[]>([])
const pendingAssignments = computed(() => pendingAdded.value.length + pendingRemoved.value.length)
const zuweisungSave = ref({ running: false, done: 0, total: 0, errors: 0 })

const selectedKursId = ref<number | null>(null)
const loadingKurse = ref(false)
const loadingSchueler = ref(false)

const kursSearch = ref('')
const kursartFilter = ref('')
const schuelerSearch = ref('')
const klasseFilter = ref('')
const includeExtern = ref(false)


const filteredKurse = computed(() =>
  dbKurse.value.filter(k => {
    const matchFach = !kursSearch.value ||
      k.fach.toLowerCase().includes(kursSearch.value.toLowerCase())
    const matchArt = !kursartFilter.value || k.kursart === kursartFilter.value
    return matchFach && matchArt
  }),
)

const selectedKurs = computed(() => dbKurse.value.find(k => k.id === selectedKursId.value))
const selectedKursLabel = computed(() => {
  const k = selectedKurs.value
  return k ? `${k.fach} ${k.kuerzel}` : ''
})

const selectedKursJahrgaengeLabel = computed(() => {
  const k = selectedKurs.value
  if (!k || k.idJahrgaenge.length === 0) return null
  return k.idJahrgaenge
    .map(id => cachedJahrgaenge.value.find(j => j.id === id)?.kuerzel ?? String(id))
    .join(', ')
})

const assignedIds = computed(() =>
  new Set(selectedKursId.value ? (assignments.value[selectedKursId.value] ?? []) : []),
)

function matchesSchuelerFilter(s: DbSchueler): boolean {
  const matchName = !schuelerSearch.value ||
    `${s.nachname} ${s.vorname}`.toLowerCase().includes(schuelerSearch.value.toLowerCase())
  const matchKlasse = !klasseFilter.value || s.klasse === klasseFilter.value
  return matchName && matchKlasse
}

function matchesKursJahrgang(s: DbSchueler): boolean {
  const kurs = selectedKurs.value
  if (!kurs || kurs.idJahrgaenge.length === 0) return true
  const jg = cachedJahrgaenge.value.find(j => j.kuerzel === s.jahrgang)
  return jg ? kurs.idJahrgaenge.includes(jg.id) : true
}

// Warnmeldung: wenn ein Klassen-/Namensfilter aktiv ist, aber alle Treffer
// wegen Jahrgangs-Inkompatibilität zum gewählten Kurs herausgefiltert wurden.
const poolJahrgangsWarnung = computed(() => {
  const kurs = selectedKurs.value
  if (!kurs || kurs.idJahrgaenge.length === 0) return null

  // Nur prüfen wenn ein Filter gesetzt ist, sonst ist die leere Liste selbsterklärend
  if (!klasseFilter.value && !schuelerSearch.value) return null

  const gefiltertOhneJg = dbSchueler.value.filter(
    s => !assignedIds.value.has(s.id) && matchesSchuelerFilter(s),
  )
  if (gefiltertOhneJg.length === 0) return null  // generell keine Treffer, kein Extra-Hinweis

  const alleBlockiert = gefiltertOhneJg.every(s => !matchesKursJahrgang(s))
  if (!alleBlockiert) return null

  const jahrgangKuerzel = gefiltertOhneJg[0].jahrgang
  const erlaubt = kurs.idJahrgaenge
    .map(id => cachedJahrgaenge.value.find(j => j.id === id)?.kuerzel ?? String(id))
    .join(', ')
  return klasseFilter.value
    ? `Klasse „${klasseFilter.value}" (Jg. ${jahrgangKuerzel}) gehört nicht zu den Jahrgängen dieses Kurses (${erlaubt})`
    : `Keine gefilterten Schüler passen zum Jahrgang dieses Kurses (${erlaubt})`
})

const filteredPool = computed(() =>
  dbSchueler.value.filter(
    s => !assignedIds.value.has(s.id) && matchesSchuelerFilter(s) && matchesKursJahrgang(s),
  ),
)

const filteredAssigned = computed(() =>
  dbSchueler.value.filter(s => assignedIds.value.has(s.id) && matchesSchuelerFilter(s)),
)

const availableKursarten = computed(() => {
  const arten = [...new Set(dbKurse.value.map(k => k.kursart))].filter(Boolean).sort()
  return [
    { label: 'Alle Kursarten', value: '' },
    ...arten.map(a => ({ label: a, value: a })),
  ]
})

const availableKlassen = computed(() => {
  const klassen = [...new Set(dbSchueler.value.map(s => s.klasse))].filter(Boolean).sort()
  return [
    { label: 'Alle Klassen', value: '' },
    ...klassen.map(k => ({ label: k, value: k })),
  ]
})

function onPoolStudentClick(sid: number): void {
  const kid = selectedKursId.value
  if (kid === null) return
  const current = assignments.value[kid] ?? []
  if (current.includes(sid)) return
  assignments.value = { ...assignments.value, [kid]: [...current, sid] }
  const isDbEntry = (dbAssignments.value[kid] ?? []).includes(sid)
  if (!isDbEntry) {
    pendingAdded.value = [...pendingAdded.value, { kursId: kid, schuelerId: sid }]
  }
  pendingRemoved.value = pendingRemoved.value.filter(
    p => !(p.kursId === kid && p.schuelerId === sid),
  )
}

function onAssignedStudentClick(sid: number): void {
  const kid = selectedKursId.value
  if (kid === null) return
  const current = assignments.value[kid] ?? []
  if (!current.includes(sid)) return
  assignments.value = { ...assignments.value, [kid]: current.filter(id => id !== sid) }
  pendingRemoved.value = [...pendingRemoved.value, { kursId: kid, schuelerId: sid }]
  pendingAdded.value = pendingAdded.value.filter(
    p => !(p.kursId === kid && p.schuelerId === sid),
  )
}

async function loadKurse(): Promise<void> {
  if (idSchuljahresabschnitt.value === null) return
  loadingKurse.value = true
  try {
    const [dbKurseRaw, faecher, lehrkraefte, jahrgaenge] = await Promise.all([
      fetchKurseFuerAbschnitt(idSchuljahresabschnitt.value),
      cachedFaecher.value.length    ? Promise.resolve(cachedFaecher.value)    : fetchFaecher(),
      cachedLehrkraefte.value.length ? Promise.resolve(cachedLehrkraefte.value) : fetchLehrkraefte(),
      cachedJahrgaenge.value.length  ? Promise.resolve(cachedJahrgaenge.value)  : fetchJahrgaenge(),
    ])
    cachedFaecher.value     = faecher
    cachedLehrkraefte.value = lehrkraefte
    cachedJahrgaenge.value  = jahrgaenge
    dbKurse.value = dbKurseRaw.map(k => ({
      id: k.id,
      fach: faecher.find(f => f.id === k.idFach)?.kuerzel ?? '?',
      kursart: k.kursartAllg,
      kuerzel: k.kuerzel,
      lehrer: lehrkraefte.find(l => l.id === k.lehrer)?.kuerzel ?? '',
      idFach: k.idFach ?? 0,
      idLehrer: k.lehrer,
      wochenstunden: k.wochenstunden ?? 0,
      idJahrgaenge: k.idJahrgaenge ?? [],
    }))
    // Bestehende Zuweisungen aus der API übernehmen
    const initialAssignments: Record<number, number[]> = {}
    for (const k of dbKurseRaw) {
      initialAssignments[k.id] = (k.schueler ?? []).map(s => s.id)
    }
    dbAssignments.value = initialAssignments
    assignments.value = { ...initialAssignments }
    pendingAdded.value = []
    pendingRemoved.value = []
    selectedKursId.value = null
  } finally {
    loadingKurse.value = false
  }
}

async function loadSchueler(): Promise<void> {
  if (idSchuljahresabschnitt.value === null) return
  loadingSchueler.value = true
  try {
    const alleSchueler = await fetchSchuelerAuswahlliste(idSchuljahresabschnitt.value)
    const erlaubteStatus = includeExtern.value ? [2, 8] : [2]
    dbSchueler.value = alleSchueler
      .filter(s => erlaubteStatus.includes(s.status))
      .map(s => ({
        id: s.id,
        nachname: s.nachname,
        vorname: s.vorname,
        klasse: s.klasse ?? '',
        jahrgang: s.jahrgang ?? '',
      }))
  } finally {
    loadingSchueler.value = false
  }
}

async function saveAssignments(): Promise<void> {
  if (idSchuljahresabschnitt.value === null) return
  const abschnittId = idSchuljahresabschnitt.value
  const added = [...pendingAdded.value]
  const removed = [...pendingRemoved.value]
  zuweisungSave.value = { running: true, total: added.length + removed.length, done: 0, errors: 0 }

  const lernabschnittCache = new Map<number, number | null>()
  async function getLernabschnittId(schuelerId: number): Promise<number | null> {
    if (lernabschnittCache.has(schuelerId)) return lernabschnittCache.get(schuelerId)!
    const id = await fetchLernabschnittId(schuelerId, abschnittId)
    lernabschnittCache.set(schuelerId, id)
    return id
  }

  // Hinzufügen
  for (const { kursId, schuelerId } of added) {
    const kurs = dbKurse.value.find(k => k.id === kursId)
    if (!kurs || kurs.idFach === 0) {
      zuweisungSave.value.errors++
      zuweisungSave.value.done++
      continue
    }
    const lernabschnittId = await getLernabschnittId(schuelerId)
    if (lernabschnittId === null) {
      zuweisungSave.value.errors++
      zuweisungSave.value.done++
      continue
    }
    const createResult = await createSchuelerLeistungsdaten(lernabschnittId, kurs.idFach)
    if (!createResult.success || !createResult.id) {
      zuweisungSave.value.errors++
      zuweisungSave.value.done++
      continue
    }
    const patch: Record<string, unknown> = {
      kursID: kursId,
      kursart: kurs.kursart,
      abifach: null,
      wochenstunden: kurs.wochenstunden,
    }
    if (kurs.idLehrer !== null) patch.lehrerID = kurs.idLehrer
    const patchResult = await patchSchuelerLeistungsdaten(createResult.id, patch)
    if (!patchResult.success) {
      await deleteSchuelerLeistungsdaten(createResult.id)
      zuweisungSave.value.errors++
    }
    zuweisungSave.value.done++
  }

  // Entfernen
  const leistungsdatenCache = new Map<number, LeistungsdatenEintrag[]>()
  async function getLeistungsdaten(lernabschnittId: number): Promise<LeistungsdatenEintrag[]> {
    if (leistungsdatenCache.has(lernabschnittId)) return leistungsdatenCache.get(lernabschnittId)!
    const data = await fetchLeistungsdatenFuerLernabschnitt(lernabschnittId)
    leistungsdatenCache.set(lernabschnittId, data)
    return data
  }

  for (const { kursId, schuelerId } of removed) {
    const lernabschnittId = await getLernabschnittId(schuelerId)
    if (lernabschnittId === null) {
      zuweisungSave.value.errors++
      zuweisungSave.value.done++
      continue
    }
    const leistungen = await getLeistungsdaten(lernabschnittId)
    const eintrag = leistungen.find(e => e.kursID === kursId)
    if (!eintrag) {
      zuweisungSave.value.errors++
      zuweisungSave.value.done++
      continue
    }
    const result = await deleteSchuelerLeistungsdaten(eintrag.id)
    if (!result.success) zuweisungSave.value.errors++
    zuweisungSave.value.done++
  }

  // dbAssignments auf aktuellen Stand bringen (nur erfolgreiche Operationen)
  const newDb = { ...dbAssignments.value }
  for (const { kursId, schuelerId } of added) {
    if (!(newDb[kursId] ?? []).includes(schuelerId)) {
      newDb[kursId] = [...(newDb[kursId] ?? []), schuelerId]
    }
  }
  for (const { kursId, schuelerId } of removed) {
    if (newDb[kursId]) {
      newDb[kursId] = newDb[kursId].filter(id => id !== schuelerId)
    }
  }
  dbAssignments.value = newDb

  pendingAdded.value = []
  pendingRemoved.value = []
  zuweisungSave.value.running = false
}

// ── Grid-Konfiguration (gemeinsam) ────────────────────────────────────────

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  minWidth: 80,
}

const rowClassRules = {
  'row-sent':  (p: { data: BaseRow }) => p.data._sent,
  'row-error': (p: { data: BaseRow }) => !p.data._valid && !p.data._sent,
}

function getRowId(params: GetRowIdParams<BaseRow>): string {
  return params.data._id
}

function statusCell<T extends BaseRow>(p: { data: T }): string {
  if (p.data._sent)   return '<span style="color:#22c55e">✔ Gesendet</span>'
  if (!p.data._valid) return `<span style="color:#ef4444" title="${p.data._errors.join('; ')}">✖ Fehler</span>`
  return '<span style="color:#f59e0b">● Bereit</span>'
}

function resolveCell(
  idField: keyof KlassenunterrichtRow,
  labelField: keyof KlassenunterrichtRow,
  tooltip: (row: KlassenunterrichtRow) => string,
) {
  return (p: { data: KlassenunterrichtRow }) => {
    const label = String(p.data[labelField] ?? '').trim()
    if (!label) return '<span style="opacity:.4">—</span>'
    return p.data[idField] !== null
      ? `<span style="color:#22c55e">${label}</span>`
      : `<span style="color:#f59e0b" title="${tooltip(p.data)}">${label} ⚠</span>`
  }
}

const klasseColDefs: ColDef<KlassenunterrichtRow>[] = [
  {
    headerName: '', width: 40, pinned: 'left',
    checkboxSelection: true, headerCheckboxSelection: true,
    sortable: false, filter: false, resizable: false, suppressSizeToFit: true,
  },
  { field: 'schuljahr', headerName: 'Schuljahr', width: 95 },
  {
    headerName: 'Abschnitt', width: 95,
    cellRenderer: resolveCell(
      'idSchuljahresabschnitt', 'abschnitt',
      r => `Schuljahresabschnitt ${r.schuljahr}/${r.abschnitt} nicht gefunden`,
    ),
  },
  {
    headerName: 'Klasse', width: 100,
    cellRenderer: resolveCell(
      'idKlasse', 'klasse',
      r => `Klasse „${r.klasse}" im Abschnitt ${r.schuljahr}/${r.abschnitt} nicht gefunden`,
    ),
  },
  {
    headerName: 'Lehrer', width: 110,
    cellRenderer: resolveCell(
      'idLehrer', 'lehrerKuerzel',
      r => `Lehrer „${r.lehrerKuerzel}" nicht gefunden`,
    ),
  },
  {
    headerName: 'Kursart', width: 90,
    cellRenderer: (p: { data: KlassenunterrichtRow }) => {
      const v = p.data.kursart
      if (!v) return '<span style="opacity:.4">—</span>'
      if (cachedKursarten.value.size === 0) return v
      return p.data._kursartOk
        ? `<span style="color:#22c55e">${v}</span>`
        : `<span style="color:#f59e0b" title="Kursart „${v}" für Schulform ${schuleStore.schulform ?? '?'} nicht zulässig">${v} ⚠</span>`
    },
  },
  {
    headerName: 'Fach', width: 90,
    cellRenderer: resolveCell(
      'idFach', 'fach',
      r => `Fach „${r.fach}" nicht gefunden`,
    ),
  },
  { field: 'wochenstunden', headerName: 'Std./Wo.', width: 85 },
  { field: 'aufsZeugnis',   headerName: 'Aufs.Zeugnis', width: 115 },
  { headerName: 'Status', width: 130, editable: false, cellRenderer: statusCell },
]

const kursColDefs: ColDef<KursRow>[] = [
  {
    headerName: '', width: 40, pinned: 'left',
    checkboxSelection: true, headerCheckboxSelection: true,
    sortable: false, filter: false, resizable: false, suppressSizeToFit: true,
  },
  { field: 'schuljahr', headerName: 'Schuljahr', width: 90 },
  {
    headerName: 'Abschnitt', width: 90,
    cellRenderer: (p: { data: KursRow }) => {
      const v = p.data.abschnitt
      if (!v) return '<span style="opacity:.4">—</span>'
      return p.data.idSchuljahresabschnitt !== null
        ? `<span style="color:#22c55e">${v}</span>`
        : `<span style="color:#f59e0b" title="Abschnitt ${p.data.schuljahr}/${v} nicht gefunden">${v} ⚠</span>`
    },
  },
  { field: 'kuerzel', headerName: 'Kürzel', width: 110 },
  {
    headerName: 'Fach', width: 80,
    cellRenderer: (p: { data: KursRow }) => {
      const v = p.data.fach
      if (!v) return '<span style="opacity:.4">—</span>'
      return p.data.idFach !== null
        ? `<span style="color:#22c55e">${v}</span>`
        : `<span style="color:#f59e0b" title="Fach nicht gefunden">${v} ⚠</span>`
    },
  },
  { field: 'kursart', headerName: 'Kursart', width: 85 },
  {
    headerName: 'Jahrgang', width: 110,
    cellRenderer: (p: { data: KursRow }) => {
      const v = p.data.jahrgaenge
      if (!v) return '<span style="opacity:.4">—</span>'
      const hasError = p.data._errors.some(e => e.toLowerCase().includes('jahrgang'))
      return hasError
        ? `<span style="color:#f59e0b" title="Nicht alle Jahrgänge gefunden">${v} ⚠</span>`
        : `<span style="color:#22c55e">${v}</span>`
    },
  },
  {
    headerName: 'Lehrer', width: 85,
    cellRenderer: (p: { data: KursRow }) => {
      const v = p.data.lehrerkuerzel
      if (!v) return '<span style="opacity:.4">—</span>'
      return p.data.idLehrer !== null
        ? `<span style="color:#22c55e">${v}</span>`
        : `<span style="color:#f59e0b" title="Lehrer nicht gefunden">${v} ⚠</span>`
    },
  },
  { field: 'wochenstunden',          headerName: 'Std./Wo.',   width: 82 },
  { field: 'wochenstundenlehrkraft',  headerName: 'Std. Lkr.', width: 82 },
  { field: 'zeugnisbezeichnung',     headerName: 'Zeugnis',    width: 130 },
  {
    field: 'fortschreibungsart', headerName: 'Fortschr.', width: 90,
    headerTooltip: 'Erlaubte Werte: keine (0) | jghoch (1) | jghalten (2) | komplett (3)',
  },
  { field: 'schienen',               headerName: 'Schienen',   width: 80 },
  { field: 'istepochal',             headerName: 'Epochal',    width: 75 },
  { headerName: 'Status', width: 130, editable: false, cellRenderer: kursStatusCell },
]

const schuelerColDefs: ColDef<SchuelerUnterrichtRow>[] = [
  {
    headerName: '', width: 40, pinned: 'left',
    checkboxSelection: true, headerCheckboxSelection: true,
    sortable: false, filter: false, resizable: false, suppressSizeToFit: true,
  },
  {
    headerName: 'Schüler', width: 170,
    cellRenderer: (p: { data: SchuelerUnterrichtRow }) => {
      const name = `${p.data.nachname}, ${p.data.vorname}`
      return p.data.idSchueler !== null
        ? `<span style="color:#22c55e">${name}</span>`
        : `<span style="color:#ef4444" title="${p.data._errors.filter(e => e.includes('Schüler')).join('; ')}">${name} ✖</span>`
    },
  },
  { field: 'geburtsdatum',         headerName: 'Geb.-datum',   width: 105 },
  { field: 'schuljahr',            headerName: 'Schuljahr',    width: 88 },
  { field: 'abschnitt',            headerName: 'Abschnitt',    width: 88 },
  {
    headerName: 'Fach', width: 80,
    cellRenderer: (p: { data: SchuelerUnterrichtRow }) => {
      const v = p.data.fach
      if (!v) return '<span style="opacity:.4">—</span>'
      return p.data.idFach !== null
        ? `<span style="color:#22c55e">${v}</span>`
        : `<span style="color:#f59e0b" title="Fach nicht gefunden">${v} ⚠</span>`
    },
  },
  {
    headerName: 'Lehrer', width: 90,
    cellRenderer: (p: { data: SchuelerUnterrichtRow }) => {
      const v = p.data.fachlehrer
      if (!v) return '<span style="opacity:.4">—</span>'
      return p.data.idLehrer !== null
        ? `<span style="color:#22c55e">${v}</span>`
        : `<span style="color:#f59e0b" title="Lehrer nicht gefunden">${v} ⚠</span>`
    },
  },
  {
    headerName: 'Kurs', width: 110,
    cellRenderer: (p: { data: SchuelerUnterrichtRow }) => {
      const v = p.data.kurs
      if (!v) return '<span style="opacity:.4">—</span>'
      return p.data.idKurs !== null
        ? `<span style="color:#22c55e">${v}</span>`
        : `<span style="color:#f59e0b" title="Kurs nicht gefunden">${v} ⚠</span>`
    },
  },
  { field: 'kursart',              headerName: 'Kursart',      width: 85 },
  { field: 'note',                 headerName: 'Note',         width: 65 },
  { field: 'abiturfach',           headerName: 'Abiturfach',   width: 90 },
  { field: 'wochenstd',            headerName: 'Std./Wo.',     width: 78 },
  { field: 'fehlstd',              headerName: 'Fehlstd.',     width: 78 },
  { field: 'unentschfehlstd',      headerName: 'Unentsch.',    width: 82 },
  { field: 'mahnung',              headerName: 'Mahnung',      width: 78 },
  { field: 'mahndatum',            headerName: 'Mahndatum',    width: 100 },
  { field: 'externeschulnr',       headerName: 'Ext. Schulnr.', width: 105 },
  {
    headerName: 'Zusatzkraft', width: 105,
    cellRenderer: (p: { data: SchuelerUnterrichtRow }) => {
      const v = p.data.zusatzkraft
      if (!v) return '<span style="opacity:.4">—</span>'
      return p.data.idZusatzkraft !== null
        ? `<span style="color:#22c55e">${v}</span>`
        : `<span style="color:#f59e0b" title="Zusatzkraft nicht gefunden">${v} ⚠</span>`
    },
  },
  { field: 'wochenstdzusatzkraft', headerName: 'Std. Zusatz',  width: 95 },
  { headerName: 'Status', width: 130, editable: false, cellRenderer: statusCell },
]
</script>

<style>
.row-sent  { opacity: 0.6; }
.row-error { background-color: #fff5f5 !important; }
.dark .row-error { background-color: #3b0c0c !important; }
</style>

<style scoped>
/* ── Basis ────────────────────────────────────────────────────────────── */
.table-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.375rem;
  padding: 0.375rem 1rem;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

h2 {
  margin: 0;
  font-size: 0.9rem;
  white-space: nowrap;
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */
.unterricht-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

:deep(.p-tabpanels) {
  flex: 1;
  min-height: 0;
  padding: 0.75rem 0 0;
}

:deep(.p-tabpanel) {
  height: 100%;
}

.tab-badge {
  margin-left: 0.35rem;
  font-size: 0.7rem;
}

/* ── Tab 1/2/3 gemeinsam ─────────────────────────────────────────────── */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.tab-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

:deep(.tab-actions .p-button),
:deep(.tab-actions .p-fileupload-basic .p-button) {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

.hint-box {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: var(--p-surface-100, #f3f4f6);
  border-radius: 8px;
  font-size: 0.83rem;
  color: var(--p-text-color);
  line-height: 1.5;
}

.hint-box--dark {
  background: #1e293b;
  color: #e2e8f0;
}

.hint-icon {
  font-size: 1rem;
  margin-top: 0.15rem;
  flex-shrink: 0;
  color: var(--p-primary-color);
}

.hint-body-wrap {
  flex: 1;
  min-width: 0;
}

.hint-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  gap: 0.5rem;
}

.hint-toggle:hover strong {
  color: var(--p-primary-color);
}

.hint-chevron {
  font-size: 0.65rem;
  opacity: 0.5;
  flex-shrink: 0;
}

.hint-body {
  margin-top: 0.3rem;
}

.hint-table {
  border-collapse: collapse;
  font-size: 0.8rem;
  width: 100%;
}

.hint-table td {
  padding: 0.18rem 0.5rem 0.18rem 0;
  vertical-align: top;
}

.hint-col-label {
  font-weight: 600;
  white-space: nowrap;
  color: var(--p-text-muted-color);
  padding-right: 0.75rem !important;
}

.hint-table code {
  font-family: monospace;
  font-size: 0.76rem;
  background: color-mix(in srgb, var(--p-primary-color) 10%, transparent);
  border-radius: 3px;
  padding: 0.05rem 0.3rem;
}

.data-table {
  flex: 1;
  min-height: 300px;
}

.lookup-loading {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}

.import-result {
  font-size: 0.75rem;
  color: #22c55e;
}

:deep(.header-left .p-select .p-select-label) {
  font-size: 0.72rem;
  padding: 0.2rem 0.25rem;
}

/* ── Tab 4: Kurszuweisung ─────────────────────────────────────────────── */
.zuweisung-root {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.zuweisung-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  background: var(--p-surface-50, #f9fafb);
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
}

.is-dark .zuweisung-toolbar {
  background: var(--p-surface-900, #111827);
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
  white-space: nowrap;
  width: 3.5rem;
}

.toolbar-sub-label {
  font-size: 0.72rem;
  color: var(--p-text-muted-color);
  cursor: pointer;
  white-space: nowrap;
}

:deep(.zuweisung-toolbar .p-button),
:deep(.zuweisung-toolbar .p-inputtext) {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}

:deep(.zuweisung-toolbar .p-select) {
  font-size: 0.75rem;
}

:deep(.zuweisung-toolbar .p-select .p-select-label) {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}

:deep(.zuweisung-toolbar .p-select .p-select-dropdown) {
  padding: 0 0.3rem;
}

.zuweisung-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 0.75rem;
}

/* ── Panels ──────────────────────────────────────────────────────────── */
.panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: var(--p-surface-100, #f3f4f6);
  border-bottom: 1px solid var(--p-surface-border);
  flex-shrink: 0;
}

.is-dark .panel-header {
  background: var(--p-surface-800, #1f2937);
}

.panel-title {
  font-size: 0.78rem;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-count {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--p-primary-color);
  background: color-mix(in srgb, var(--p-primary-color) 15%, transparent);
  border-radius: 10px;
  padding: 0.05rem 0.4rem;
  flex-shrink: 0;
}

.panel-jahrgaenge {
  font-size: 0.68rem;
  color: var(--p-text-muted-color);
  flex: 1;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 0.5rem;
}

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
  padding: 2rem 1rem;
  text-align: center;
}

.panel-empty .pi {
  font-size: 1.5rem;
  opacity: 0.4;
}

/* ── Kursliste ───────────────────────────────────────────────────────── */
.kurs-panel {
  overflow: hidden;
}

.kurs-list {
  overflow-y: auto;
  flex: 1;
}

.kurs-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid var(--p-surface-border);
  transition: background 0.15s;
  font-size: 0.8rem;
}

.kurs-item:hover {
  background: var(--p-surface-100, #f3f4f6);
}

.is-dark .kurs-item:hover {
  background: var(--p-surface-700, #374151);
}

.kurs-item--selected {
  background: color-mix(in srgb, var(--p-primary-color) 12%, transparent) !important;
  border-left: 3px solid var(--p-primary-color);
}

.kurs-item-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.kurs-fach {
  font-weight: 600;
  font-size: 0.82rem;
}

.kurs-meta {
  font-size: 0.7rem;
  color: var(--p-text-muted-color);
}

.kurs-item-right {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.kurs-lehrer {
  font-size: 0.68rem;
  color: var(--p-text-muted-color);
}

.kurs-count-badge {
  font-size: 0.68rem;
  font-weight: 700;
  background: var(--p-surface-200, #e5e7eb);
  border-radius: 10px;
  padding: 0.05rem 0.35rem;
  min-width: 1.4rem;
  text-align: center;
}

.is-dark .kurs-count-badge {
  background: var(--p-surface-600, #4b5563);
}

/* ── Schüler-Panel ───────────────────────────────────────────────────── */
.schueler-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow: hidden;
}

.schueler-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.schueler-section--inactive {
  opacity: 0.6;
}

/* ── Schüler-Grid (Click-Modell) ─────────────────────────────────────── */
.schueler-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(max(180px, calc(25% - 0.25rem)), 1fr));
  align-content: flex-start;
  gap: 0.3rem;
  padding: 0.4rem;
}

.list-hint {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: var(--p-text-muted-color);
  font-size: 0.78rem;
  padding: 1.2rem 1rem;
  text-align: center;
}

.list-hint--muted {
  opacity: 0.6;
}

.list-hint--warn {
  color: #f59e0b;
  font-weight: 500;
}

.schueler-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  border: 1px solid var(--p-surface-border);
  border-radius: 6px;
  font-size: 0.78rem;
  user-select: none;
  transition: background 0.1s, border-color 0.1s;
  min-width: 0;
}

.schueler-row:hover {
  background: color-mix(in srgb, var(--p-primary-color) 8%, transparent);
  border-color: var(--p-primary-400);
}

.schueler-row--assigned {
  border-color: color-mix(in srgb, var(--p-primary-color) 40%, var(--p-surface-border));
  background: color-mix(in srgb, var(--p-primary-color) 5%, transparent);
}

.schueler-row--disabled {
  opacity: 0.45;
  pointer-events: none;
}

.schueler-row-action {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 0.7rem;
  color: var(--p-primary-color);
  opacity: 0;
  transition: opacity 0.1s;
}

.schueler-row:hover .schueler-row-action {
  opacity: 1;
}

.schueler-row-action--remove {
  color: var(--p-red-400, #f87171);
}

.schueler-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.klasse-tag {
  flex-shrink: 0;
  font-size: 0.68rem;
  color: var(--p-text-muted-color);
  background: var(--p-surface-200, #e5e7eb);
  border-radius: 4px;
  padding: 0.05rem 0.3rem;
}

.is-dark .klasse-tag {
  background: var(--p-surface-700, #374151);
}
</style>
