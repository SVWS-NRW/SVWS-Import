<template>
  <div class="export-view">
    <h2>Daten exportieren</h2>
    <p class="subtitle">Wähle einen Datentyp, stelle die gewünschten Felder zusammen und exportiere als CSV oder JSON.</p>

    <!-- Kacheln -->
    <div class="export-cards">
      <div
        v-for="tile in TILES"
        :key="tile.id"
        class="export-card"
        :class="{
          active:        selectedTile === tile.id,
          'coming-soon': tile.comingSoon,
        }"
        :title="tile.comingSoon ? 'Noch nicht verfügbar' : tile.description"
        @click="!tile.comingSoon && selectTile(tile.id)"
      >
        <i :class="[tile.icon, 'card-icon']" />
        <strong>{{ tile.label }}</strong>
        <span v-if="tile.comingSoon" class="coming-soon-badge">In Vorbereitung</span>
      </div>
    </div>

    <!-- Konfigurationsbereich -->
    <template v-if="activeTile">

      <!-- Format + Aktionen -->
      <div class="config-section">
        <h3 class="section-title">Format</h3>
        <div class="format-row">
          <label class="format-option">
            <RadioButton v-model="format" inputId="fmt-csv" value="csv" />
            <i class="pi pi-file" />
            <span>CSV</span>
          </label>
          <label class="format-option">
            <RadioButton v-model="format" inputId="fmt-json" value="json" />
            <i class="pi pi-code" />
            <span>JSON</span>
          </label>
          <div class="format-actions">
            <Button
              :label="loadBtnLabel"
              :icon="selectedTile === 'schueler' ? 'pi pi-file-export' : 'pi pi-refresh'"
              size="small"
              :loading="loading"
              :disabled="selectedFields.length === 0 || (selectedTile === 'schueler' && schuelerAuswahl.length === 0) || (selectedTile === 'lehrer' && lehrerListe.length === 0)"
              @click="loadData"
            />
            <Button
              v-if="data.length > 0 && selectedTile !== 'schueler' && selectedTile !== 'lehrer'"
              label="Exportieren"
              icon="pi pi-file-export"
              size="small"
              :disabled="selectedFields.length === 0"
              @click="doExport"
            />
          </div>
        </div>
        <div v-if="exportProgress > 0" class="export-progress">
          <span class="progress-text">Lade {{ exportDone }} / {{ exportTotal }} {{ selectedTile === 'lehrer' ? 'Lehrerstammdaten' : 'Schülerdaten' }}…</span>
          <ProgressBar :value="Math.round(exportProgress * 100)" style="height: 6px; flex: 1" />
        </div>
      </div>

      <!-- Felder wählen -->
      <div class="config-section">
        <div class="section-header">
          <h3 class="section-title">Felder auswählen</h3>
          <div class="section-actions">
            <Button label="Alle" size="small" severity="secondary" text @click="selectAll" />
            <Button label="Keine" size="small" severity="secondary" text @click="selectNone" />
          </div>
        </div>
        <template v-if="hasSections">
          <div v-for="(sectionGroups, sectionName) in groupedBySections" :key="sectionName" class="field-section">
            <div class="field-section-header">{{ sectionName }}</div>
            <div class="groups-grid">
              <div v-for="(groupFields, groupName) in sectionGroups" :key="groupName" class="field-group-card">
                <div class="field-group-card-header">{{ groupName }}</div>
                <div class="field-list">
                  <label v-for="field in groupFields" :key="field.key" class="field-label">
                    <Checkbox v-model="selectedFields" :value="field.key" />
                    <span>{{ field.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="hasFieldGroups">
          <div class="groups-grid">
            <div v-for="(groupFields, groupName) in groupedActiveTileFields" :key="groupName" class="field-group-card">
              <div class="field-group-card-header">{{ groupName }}</div>
              <div class="field-list">
                <label v-for="field in groupFields" :key="field.key" class="field-label">
                  <Checkbox v-model="selectedFields" :value="field.key" />
                  <span>{{ field.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="groups-grid">
          <label v-for="field in activeTile.fields" :key="field.key" class="field-label">
            <Checkbox v-model="selectedFields" :value="field.key" />
            <span>{{ field.label }}</span>
          </label>
        </div>
      </div>

      <Message v-if="loadError" severity="error" :closable="true" @close="loadError = ''">
        {{ loadError }}
      </Message>

      <!-- Schülerliste (automatisch bei Schülerdaten-Kachel) -->
      <div v-if="selectedTile === 'schueler'" class="config-section">
        <div class="section-header">
          <h3 class="section-title">
            Schülerliste
            <span v-if="schuelerAuswahl.length > 0" class="count-badge">
              {{ filteredSchueler.length }} von {{ schuelerAuswahl.length }}
              <template v-if="selectedSchueler.length > 0"> · {{ selectedSchueler.length }} ausgewählt</template>
            </span>
          </h3>
          <div class="section-actions">
            <InputText
              v-model="schuelerNameSearch"
              placeholder="Name suchen…"
              size="small"
              class="schueler-name-search"
            />
            <Select
              v-if="schuleStore.loaded"
              v-model="selectedAbschnittId"
              :options="schuleStore.abschnitteOptions"
              optionLabel="label"
              optionValue="id"
              placeholder="Abschnitt wählen"
              size="small"
              style="width: 160px"
            />
            <InputNumber
              v-else
              v-model="selectedAbschnittId"
              :min="1"
              placeholder="Abschnitt-ID"
              size="small"
              style="width: 100px"
            />
            <MultiSelect
              v-model="jahrgangFilter"
              :options="jahrgaengeOptions"
              placeholder="Jahrgang"
              size="small"
              style="width: 110px"
            />
            <MultiSelect
              v-model="klasseFilter"
              :options="klassenOptions"
              placeholder="Klasse"
              size="small"
              style="width: 110px"
            />
            <MultiSelect
              v-model="statusFilter"
              :options="SCHUELER_STATUS_OPTIONS"
              optionLabel="label"
              optionValue="value"
              placeholder="Status"
              size="small"
              style="width: 110px"
            />
            <Button
              icon="pi pi-refresh"
              severity="secondary"
              text
              size="small"
              :loading="listLoading"
              :disabled="selectedAbschnittId === null"
              v-tooltip.top="'Schülerliste neu laden'"
              @click="reloadAuswahlliste"
            />
          </div>
        </div>
        <div v-if="listLoading" class="list-empty">
          <i class="pi pi-spin pi-spinner" />
          <span>Schüler werden geladen…</span>
        </div>
        <div v-else-if="listError" class="list-error">
          <i class="pi pi-exclamation-triangle" />
          <span>{{ listError }}</span>
        </div>
        <DataTable
          v-else
          v-model:selection="selectedSchueler"
          :value="filteredSchueler"
          dataKey="id"
          paginator
          :rows="50"
          :rowsPerPageOptions="[25, 50, 100, 200]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="{first}–{last} von {totalRecords}"
          size="small"
          sortMode="single"
          class="compact-table"
        >
          <Column selectionMode="multiple" style="width: 3rem; flex: none" />
          <Column field="nachname" header="Nachname" sortable style="min-width: 140px" />
          <Column field="vorname" header="Vorname" sortable style="min-width: 120px" />
          <Column field="klasse" header="Klasse" sortable style="min-width: 90px" />
          <Column field="jahrgang" header="Jahrgang" sortable style="min-width: 100px" />
          <Column header="Status" sortField="status" sortable style="min-width: 110px">
            <template #body="{ data: row }">
              <span :class="['status-badge', `status-${row.status}`]">
                {{ statusLabel(row.status) }}
              </span>
            </template>
          </Column>
          <template #empty>
            <span style="color: var(--p-text-muted-color); font-size: 0.875rem;">
              Keine Schüler für den gewählten Status.
            </span>
          </template>
        </DataTable>
      </div>

      <!-- Lehrerliste -->
      <div v-if="selectedTile === 'lehrer'" class="config-section">
        <div class="section-header">
          <h3 class="section-title">
            Lehrerliste
            <span v-if="lehrerListe.length > 0" class="count-badge">
              {{ filteredLehrer.length }} von {{ lehrerListe.length }}
              <template v-if="selectedLehrer.length > 0"> · {{ selectedLehrer.length }} ausgewählt</template>
            </span>
          </h3>
          <div class="section-actions">
            <MultiSelect
              v-model="lehrerSichtbarFilter"
              :options="LEHRER_SICHTBAR_OPTIONS"
              optionLabel="label"
              optionValue="value"
              placeholder="Sichtbarkeit"
              size="small"
              style="width: 130px"
            />
            <MultiSelect
              v-model="lehrerPersonalTypFilter"
              :options="LEHRER_PERSONALTYP_OPTIONS"
              optionLabel="label"
              optionValue="value"
              placeholder="Personaltyp"
              size="small"
              style="width: 130px"
            />
            <Button
              icon="pi pi-refresh"
              severity="secondary"
              text
              size="small"
              :loading="lehrerListLoading"
              v-tooltip.top="'Lehrerliste neu laden'"
              @click="reloadLehrerListe"
            />
          </div>
        </div>
        <div v-if="lehrerListLoading" class="list-empty">
          <i class="pi pi-spin pi-spinner" />
          <span>Lehrkräfte werden geladen…</span>
        </div>
        <div v-else-if="lehrerListError" class="list-error">
          <i class="pi pi-exclamation-triangle" />
          <span>{{ lehrerListError }}</span>
        </div>
        <DataTable
          v-else
          v-model:selection="selectedLehrer"
          :value="filteredLehrer"
          dataKey="id"
          scrollable
          scrollHeight="400px"
          :virtualScrollerOptions="{ itemSize: 36 }"
          size="small"
          sortMode="single"
        >
          <Column selectionMode="multiple" style="width: 3rem; flex: none" />
          <Column field="kuerzel"  header="Kürzel"   sortable style="min-width: 80px" />
          <Column field="nachname" header="Nachname" sortable style="min-width: 140px" />
          <Column field="vorname"  header="Vorname"  sortable style="min-width: 120px" />
          <Column header="Personaltyp" sortField="personTyp" sortable style="min-width: 160px">
            <template #body="{ data: row }">
              <span :class="['status-badge', `ptyp-${row.personTyp}`]">
                {{ lehrerPersonalTypLabel(row.personTyp as string) }}
              </span>
            </template>
          </Column>
          <Column header="Sichtbar" sortField="istSichtbar" sortable style="min-width: 110px">
            <template #body="{ data: row }">
              <span :class="['status-badge', row.istSichtbar ? 'sichtbar-ja' : 'sichtbar-nein']">
                {{ row.istSichtbar ? 'Sichtbar' : 'Versteckt' }}
              </span>
            </template>
          </Column>
          <template #empty>
            <span style="color: var(--p-text-muted-color); font-size: 0.875rem;">
              Keine Lehrkräfte für den gewählten Filter.
            </span>
          </template>
        </DataTable>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import TooltipDirective from 'primevue/tooltip'
import Button from 'primevue/button'

const vTooltip = TooltipDirective
import Checkbox from 'primevue/checkbox'
import RadioButton from 'primevue/radiobutton'
import ProgressBar from 'primevue/progressbar'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { fetchForExport, fetchSchuelerAuswahlliste, enrichSchueler, enrichRecords, fetchOrteById, fetchReligionenById, fetchSchulenById, fetchJahrgaengeById, fetchEinschulungsartenById, fetchUebergangsempfehlungenById, fetchKindergartenbesuchsdauerById, fetchKindergartenById, type SchuelerAuswahl } from '@/services/svwsService'
import type { OrtKatalogEintrag, ReligionKatalogEintrag } from '@/models/ImportSchema'
import { exportAsCsv, exportAsJson } from '@/utils/exportUtils'
import { useSchuleStore } from '@/stores/schule'

interface FieldDef { key: string; label: string; group?: string; section?: string }

interface SubEndpoint {
  path: (id: number) => string
  fieldKeys: string[]
}

interface ExportTile {
  id: string
  label: string
  description: string
  icon: string
  comingSoon?: boolean
  endpoint?: string        // Bulk-Endpunkt (z.B. Lehrer)
  subEndpoints?: SubEndpoint[]  // Per-Datensatz-Endpunkte (z.B. Schüler)
  fields?: FieldDef[]
}

const TILES: ExportTile[] = [
  {
    id: 'schueler',
    label: 'Schülerdaten',
    description: 'Schülerinnen und Schüler exportieren',
    icon: 'pi pi-users',
    subEndpoints: [
      {
        path: id => `/schueler/${id}/stammdaten`,
        fieldKeys: [
          'nachname', 'vorname', 'alleVornamen', 'geschlecht', 'geburtsdatum', 'geburtsort', 'geburtsname',
          'status', 'anmeldedatum', 'aufnahmedatum', 'beginnBildungsgang', 'dauerBildungsgang', 'beruf',
          'externeSchulNr', 'idSchuelerausweis', 'fahrschuelerArtID', 'haltestelleID',
          'istVolljaehrig', 'istSchulpflichtErfuellt', 'istBerufsschulpflichtErfuellt',
          'hatMasernimpfnachweis', 'keineAuskunftAnDritte', 'erhaeltSchuelerBAFOEG', 'erhaeltMeisterBAFOEG',
          'istDuplikat',
          'strassenname', 'hausnummer', 'hausnummerZusatz', 'wohnortID', 'ortsteilID',
          'telefon', 'telefonMobil', 'emailPrivat', 'emailSchule',
          'staatsangehoerigkeitID', 'staatsangehoerigkeit2ID',
          'hatMigrationshintergrund', 'zuzugsjahr', 'geburtsland', 'verkehrspracheFamilie',
          'geburtslandVater', 'geburtslandMutter',
          'religionID', 'druckeKonfessionAufZeugnisse', 'religionabmeldung', 'religionanmeldung',
        ],
      },
      {
        path: id => `/schueler/${id}/schulbesuch`,
        fieldKeys: [
          'idVorherigeSchule', 'vorigeAllgHerkunft', 'vorigeEntlassdatum', 'vorigeEntlassjahrgang',
          'vorigeArtLetzteVersetzung', 'vorigeBemerkung', 'vorigeEntlassgrundID', 'vorigeAbschlussartID',
          'entlassungDatum', 'idEntlassjahrgang', 'entlassungGrundID', 'entlassungAbschlussartID',
          'idAufnehmendeSchule', 'aufnehmendWechseldatum', 'aufnehmendBestaetigt',
          'grundschuleEinschulungsjahr', 'grundschuleEinschulungsartID',
          'idGrundschuleJahreEingangsphase', 'idKuerzelGrundschuleUebergangsempfehlung',
          'sekIWechsel', 'sekIErsteSchulform', 'sekIIWechsel',
          'idDauerKindergartenbesuch', 'idKindergarten',
          'verpflichtungSprachfoerderkurs', 'teilnahmeSprachfoerderkurs',
          'alleSchulen', 'merkmale',
        ],
      },
    ],
    fields: [
      // ── Stammdaten ──────────────────────────────────────────────────────────
      { key: 'nachname',                       label: 'Nachname',                    section: 'Stammdaten', group: 'Personendaten' },
      { key: 'vorname',                        label: 'Vorname',                     section: 'Stammdaten', group: 'Personendaten' },
      { key: 'alleVornamen',                   label: 'Alle Vornamen',               section: 'Stammdaten', group: 'Personendaten' },
      { key: 'geschlecht',                     label: 'Geschlecht',                  section: 'Stammdaten', group: 'Personendaten' },
      { key: 'geburtsdatum',                   label: 'Geburtsdatum',                section: 'Stammdaten', group: 'Personendaten' },
      { key: 'geburtsort',                     label: 'Geburtsort',                  section: 'Stammdaten', group: 'Personendaten' },
      { key: 'geburtsname',                    label: 'Geburtsname',                 section: 'Stammdaten', group: 'Personendaten' },
      { key: 'klasse',                         label: 'Klasse',                      section: 'Stammdaten', group: 'Schule' },
      { key: 'jahrgang',                       label: 'Jahrgang',                    section: 'Stammdaten', group: 'Schule' },
      { key: 'status',                         label: 'Status',                      section: 'Stammdaten', group: 'Schule' },
      { key: 'anmeldedatum',                   label: 'Anmeldedatum',                section: 'Stammdaten', group: 'Schule' },
      { key: 'aufnahmedatum',                  label: 'Aufnahmedatum',               section: 'Stammdaten', group: 'Schule' },
      { key: 'beginnBildungsgang',             label: 'Bildungsgangbeginn',          section: 'Stammdaten', group: 'Schule' },
      { key: 'dauerBildungsgang',              label: 'Dauer Bildungsgang (Jahre)',  section: 'Stammdaten', group: 'Schule' },
      { key: 'beruf',                          label: 'Beruf',                       section: 'Stammdaten', group: 'Schule' },
      { key: 'externeSchulNr',                 label: 'Externe Schulnummer',         section: 'Stammdaten', group: 'Schule' },
      { key: 'idSchuelerausweis',              label: 'Schülerausweis-Nr.',          section: 'Stammdaten', group: 'Schule' },
      { key: 'fahrschuelerArtID',              label: 'Fahrschüler-Art',             section: 'Stammdaten', group: 'Schule' },
      { key: 'haltestelleID',                  label: 'Haltestelle-ID',              section: 'Stammdaten', group: 'Schule' },
      { key: 'istVolljaehrig',                 label: 'Volljährig',                  section: 'Stammdaten', group: 'Schule' },
      { key: 'istSchulpflichtErfuellt',        label: 'Schulpflicht erfüllt',        section: 'Stammdaten', group: 'Schule' },
      { key: 'istBerufsschulpflichtErfuellt',  label: 'Berufsschulpflicht erfüllt', section: 'Stammdaten', group: 'Schule' },
      { key: 'istDuplikat',                    label: 'Duplikat',                    section: 'Stammdaten', group: 'Schule' },
      { key: 'strassenname',                   label: 'Straße',                      section: 'Stammdaten', group: 'Adresse & Kontakt' },
      { key: 'hausnummer',                     label: 'Hausnummer',                  section: 'Stammdaten', group: 'Adresse & Kontakt' },
      { key: 'plz',                            label: 'PLZ',                         section: 'Stammdaten', group: 'Adresse & Kontakt' },
      { key: 'ort',                            label: 'Wohnort',                     section: 'Stammdaten', group: 'Adresse & Kontakt' },
      { key: 'ortsteilID',                     label: 'Ortsteil-ID',                 section: 'Stammdaten', group: 'Adresse & Kontakt' },
      { key: 'telefon',                        label: 'Telefon',                     section: 'Stammdaten', group: 'Adresse & Kontakt' },
      { key: 'telefonMobil',                   label: 'Mobil',                       section: 'Stammdaten', group: 'Adresse & Kontakt' },
      { key: 'emailPrivat',                    label: 'E-Mail (privat)',             section: 'Stammdaten', group: 'Adresse & Kontakt' },
      { key: 'emailSchule',                    label: 'E-Mail (Schule)',             section: 'Stammdaten', group: 'Adresse & Kontakt' },
      { key: 'staatsangehoerigkeitID',         label: 'Staatsangehörigkeit',         section: 'Stammdaten', group: 'Herkunft' },
      { key: 'staatsangehoerigkeit2ID',        label: '2. Staatsangehörigkeit',      section: 'Stammdaten', group: 'Herkunft' },
      { key: 'hatMigrationshintergrund',       label: 'Migrationshintergrund',       section: 'Stammdaten', group: 'Herkunft' },
      { key: 'zuzugsjahr',                     label: 'Zuzugsjahr',                  section: 'Stammdaten', group: 'Herkunft' },
      { key: 'geburtsland',                    label: 'Geburtsland',                 section: 'Stammdaten', group: 'Herkunft' },
      { key: 'geburtslandVater',               label: 'Geburtsland Vater',           section: 'Stammdaten', group: 'Herkunft' },
      { key: 'geburtslandMutter',              label: 'Geburtsland Mutter',          section: 'Stammdaten', group: 'Herkunft' },
      { key: 'verkehrspracheFamilie',          label: 'Familiensprache',             section: 'Stammdaten', group: 'Herkunft' },
      { key: 'religionKuerzel',                label: 'Konfessionskürzel',           section: 'Stammdaten', group: 'Religion' },
      { key: 'religionBezeichnung',            label: 'Konfession',                  section: 'Stammdaten', group: 'Religion' },
      { key: 'druckeKonfessionAufZeugnisse',   label: 'Konfession auf Zeugnis',      section: 'Stammdaten', group: 'Religion' },
      { key: 'religionanmeldung',              label: 'Religionsanmeldung',          section: 'Stammdaten', group: 'Religion' },
      { key: 'religionabmeldung',              label: 'Religionsabmeldung',          section: 'Stammdaten', group: 'Religion' },
      { key: 'hatMasernimpfnachweis',          label: 'Masernimpfnachweis',          section: 'Stammdaten', group: 'Sonstiges' },
      { key: 'keineAuskunftAnDritte',          label: 'Keine Auskunft an Dritte',    section: 'Stammdaten', group: 'Sonstiges' },
      { key: 'erhaeltSchuelerBAFOEG',          label: 'Schüler-BAföG',              section: 'Stammdaten', group: 'Sonstiges' },
      { key: 'erhaeltMeisterBAFOEG',           label: 'Meister-BAföG',              section: 'Stammdaten', group: 'Sonstiges' },
      // ── Schulbesuchsdaten ────────────────────────────────────────────────────
      { key: 'vorigeAllgHerkunft',             label: 'Schulform (Vorherige Schule)',           section: 'Schulbesuchsdaten', group: 'Vorherige Schule' },
      { key: 'idVorherigeSchule',              label: 'Schulnummer (Vorherige Schule)',          section: 'Schulbesuchsdaten', group: 'Vorherige Schule' },
      { key: 'vorigeEntlassdatum',             label: 'Entlassdatum (Vorherige Schule)',        section: 'Schulbesuchsdaten', group: 'Vorherige Schule' },
      { key: 'vorigeEntlassjahrgang',          label: 'Entlassjahrgang (Vorherige Schule)',     section: 'Schulbesuchsdaten', group: 'Vorherige Schule' },
      { key: 'vorigeAbschlussartID',           label: 'Abschlussart (Vorherige Schule)',        section: 'Schulbesuchsdaten', group: 'Vorherige Schule' },
      { key: 'vorigeArtLetzteVersetzung',      label: 'Letzte Versetzungsart (Vorherige Schule)',    section: 'Schulbesuchsdaten', group: 'Vorherige Schule' },
      { key: 'vorigeEntlassgrundID',           label: 'Entlassungsgrund-ID (Vorherige Schule)',      section: 'Schulbesuchsdaten', group: 'Vorherige Schule' },
      { key: 'vorigeBemerkung',                label: 'Bemerkung (Vorherige Schule)',           section: 'Schulbesuchsdaten', group: 'Vorherige Schule' },
      { key: 'entlassungDatum',                label: 'Entlassdatum (diese Schule)',          section: 'Schulbesuchsdaten', group: 'Entlassung' },
      { key: 'idEntlassjahrgang',              label: 'Entlassjahrgang (diese Schule)',       section: 'Schulbesuchsdaten', group: 'Entlassung' },
      { key: 'entlassungGrundID',              label: 'Entlassungsgrund-ID (diese Schule)',   section: 'Schulbesuchsdaten', group: 'Entlassung' },
      { key: 'entlassungAbschlussartID',       label: 'Abschlussart (diese Schule)',          section: 'Schulbesuchsdaten', group: 'Entlassung' },
      { key: 'idAufnehmendeSchule',            label: 'Schulnummer (Aufnehmende Schule)',     section: 'Schulbesuchsdaten', group: 'Aufnehmende Schule' },
      { key: 'aufnehmendWechseldatum',         label: 'Wechseldatum Aufnehmende Schule',     section: 'Schulbesuchsdaten', group: 'Aufnehmende Schule' },
      { key: 'aufnehmendBestaetigt',           label: 'Aufnahme bestätigt',                  section: 'Schulbesuchsdaten', group: 'Aufnehmende Schule' },
      { key: 'grundschuleEinschulungsjahr',    label: 'Einschulungsjahr Grundschule',        section: 'Schulbesuchsdaten', group: 'Grundschule' },
      { key: 'grundschuleEinschulungsartID',   label: 'Einschulungsart Grundschule',         section: 'Schulbesuchsdaten', group: 'Grundschule' },
      { key: 'idGrundschuleJahreEingangsphase',     label: 'Jahre Schuleingangsphase',           section: 'Schulbesuchsdaten', group: 'Grundschule' },
      { key: 'idKuerzelGrundschuleUebergangsempfehlung', label: 'Übergangsempfehlung Grundschule', section: 'Schulbesuchsdaten', group: 'Grundschule' },
      { key: 'sekIWechsel',                    label: 'Wechseljahr Sekundarstufe I',         section: 'Schulbesuchsdaten', group: 'Sekundarstufen' },
      { key: 'sekIErsteSchulform',             label: 'Erste Schulform Sekundarstufe I',     section: 'Schulbesuchsdaten', group: 'Sekundarstufen' },
      { key: 'sekIIWechsel',                   label: 'Wechseljahr Sekundarstufe II',        section: 'Schulbesuchsdaten', group: 'Sekundarstufen' },
      { key: 'idDauerKindergartenbesuch',      label: 'Dauer Kindergartenbesuch',            section: 'Schulbesuchsdaten', group: 'Kindergarten' },
      { key: 'idKindergarten',                 label: 'Kindergarten',                        section: 'Schulbesuchsdaten', group: 'Kindergarten' },
      { key: 'verpflichtungSprachfoerderkurs', label: 'Verpflichtung Sprachförderkurs',      section: 'Schulbesuchsdaten', group: 'Sprachförderung' },
      { key: 'teilnahmeSprachfoerderkurs',     label: 'Teilnahme Sprachförderkurs',          section: 'Schulbesuchsdaten', group: 'Sprachförderung' },
      { key: 'alleSchulen',                    label: 'Frühere Schulen (JSON)',              section: 'Schulbesuchsdaten', group: 'Schulhistorie' },
      { key: 'merkmale',                       label: 'Statistische Merkmale (JSON)',        section: 'Schulbesuchsdaten', group: 'Schulhistorie' },
    ],
  },
  {
    id: 'lehrer',
    label: 'Lehrerdaten',
    description: 'Lehrkräfte exportieren',
    icon: 'pi pi-id-card',
    subEndpoints: [
      {
        path: id => `/lehrer/${id}/stammdaten`,
        fieldKeys: [
          'anrede', 'amtsbezeichnung', 'geschlecht', 'geburtsdatum',
          'staatsangehoerigkeitID', 'strassenname', 'hausnummer', 'plz', 'ort',
          'telefon', 'telefonMobil', 'emailPrivat', 'emailDienstlich',
        ],
      },
    ],
    fields: [
      { key: 'kuerzel',               label: 'Kürzel'            },
      { key: 'nachname',              label: 'Nachname'          },
      { key: 'vorname',               label: 'Vorname'           },
      { key: 'personTyp',             label: 'Personaltyp'       },
      { key: 'anrede',                label: 'Anrede'            },
      { key: 'titel',                 label: 'Titel'             },
      { key: 'amtsbezeichnung',       label: 'Amtsbezeichnung'   },
      { key: 'geschlecht',            label: 'Geschlecht'        },
      { key: 'geburtsdatum',          label: 'Geburtsdatum'      },
      { key: 'staatsangehoerigkeitID',label: 'Staatsangehörigkeit'},
      { key: 'strassenname',          label: 'Straße'            },
      { key: 'hausnummer',            label: 'Hausnummer'        },
      { key: 'plz',                   label: 'PLZ'               },
      { key: 'ort',                   label: 'Wohnort'           },
      { key: 'telefon',               label: 'Telefon'           },
      { key: 'telefonMobil',          label: 'Telefon (Mobil)'   },
      { key: 'emailPrivat',           label: 'E-Mail (privat)'   },
      { key: 'emailDienstlich',       label: 'E-Mail (dienstlich)'},
    ],
  },
  {
    id: 'erzieher',
    label: 'Erzieherdaten',
    description: 'Erziehungsberechtigte exportieren',
    icon: 'pi pi-heart',
    comingSoon: true,
  },
  {
    id: 'betriebe',
    label: 'Betriebe',
    description: 'Ausbildungsbetriebe exportieren',
    icon: 'pi pi-building',
    comingSoon: true,
  },
  {
    id: 'lernplattformen',
    label: 'Lernplattformen',
    description: 'Zugangsdaten für Lernplattformen exportieren',
    icon: 'pi pi-desktop',
    comingSoon: true,
  },
]

const GESCHLECHT_LABELS: Record<number, string> = {
  3: 'männlich', 4: 'weiblich', 5: 'divers', 6: 'ohne Angabe',
}

const SCHUELER_BOOL_FIELDS = new Set([
  'druckeKonfessionAufZeugnisse', 'hatMigrationshintergrund', 'istDuplikat',
  'istVolljaehrig', 'istSchulpflichtErfuellt', 'istBerufsschulpflichtErfuellt',
  'hatMasernimpfnachweis', 'keineAuskunftAnDritte', 'erhaeltSchuelerBAFOEG', 'erhaeltMeisterBAFOEG',
  'aufnehmendBestaetigt', 'verpflichtungSprachfoerderkurs', 'teilnahmeSprachfoerderkurs',
])

const SCHUELER_STATUS_OPTIONS = [
  { value: 0,  label: 'Aufnahme'   },
  { value: 1,  label: 'Warteliste' },
  { value: 2,  label: 'Aktiv'      },
  { value: 3,  label: 'Beurlaubt'  },
  { value: 6,  label: 'Extern'     },
  { value: 8,  label: 'Abschluss'  },
  { value: 9,  label: 'Abgang'     },
  { value: 10, label: 'Ehemalige'  },
]

const SCHUELER_STATUS_LABELS: Record<number, string> = Object.fromEntries(
  SCHUELER_STATUS_OPTIONS.map(o => [o.value, o.label]),
)

function statusLabel(status: number): string {
  return SCHUELER_STATUS_LABELS[status] ?? `Status ${status}`
}

const LEHRER_PERSONALTYP_OPTIONS = [
  { value: 'LEHRKRAFT',   label: 'Lehrkraft'                                      },
  { value: 'SEKRETARIAT', label: 'Sekretär / Sekretärin'                          },
  { value: 'PERSONAL',    label: 'Angestelltes Personal'                          },
  { value: 'EXTERN',      label: 'Externe Lehrkraft'                              },
  { value: 'SONSTIGE',    label: 'Sonstiges Personal'                             },
]

const LEHRER_PERSONALTYP_LABELS: Record<string, string> = Object.fromEntries(
  LEHRER_PERSONALTYP_OPTIONS.map(o => [o.value, o.label]),
)

const LEHRER_SICHTBAR_OPTIONS = [
  { value: true,  label: 'Sichtbar'       },
  { value: false, label: 'Nicht sichtbar' },
]

function lehrerPersonalTypLabel(typ: string): string {
  return LEHRER_PERSONALTYP_LABELS[typ] ?? typ
}

function formatSchuelerValue(key: string, value: unknown): unknown {
  if (key === 'geschlecht') return GESCHLECHT_LABELS[value as number] ?? String(value ?? '')
  if (key === 'status')     return SCHUELER_STATUS_LABELS[value as number] ?? String(value ?? '')
  if (SCHUELER_BOOL_FIELDS.has(key)) return value === true ? 'Ja' : value === false ? 'Nein' : ''
  if (Array.isArray(value)) return value.length > 0 ? JSON.stringify(value) : ''
  return value
}

const schuleStore = useSchuleStore()

const selectedTile        = ref<string | null>(null)
const selectedFields      = ref<string[]>([])
const format              = ref<'csv' | 'json'>('csv')
const data                = ref<Record<string, unknown>[]>([])
const loading             = ref(false)
const loadError           = ref('')
const schuelerAuswahl     = ref<SchuelerAuswahl[]>([])
const selectedSchueler    = ref<SchuelerAuswahl[]>([])
const statusFilter        = ref<number[]>([2])
const jahrgangFilter      = ref<string[]>([])
const klasseFilter        = ref<string[]>([])
const schuelerNameSearch  = ref('')
const selectedAbschnittId = ref<number | null>(null)
const listLoading             = ref(false)
const listError               = ref('')
const exportProgress          = ref(0)
const exportDone              = ref(0)
const exportTotal             = ref(0)
const lehrerListe             = ref<Record<string, unknown>[]>([])
const selectedLehrer          = ref<Record<string, unknown>[]>([])
const lehrerListLoading       = ref(false)
const lehrerListError         = ref('')
const lehrerSichtbarFilter    = ref<boolean[]>([true])
const lehrerPersonalTypFilter = ref<string[]>([])

const activeTile = computed(() => TILES.find(t => t.id === selectedTile.value))

const hasSections = computed(() =>
  (activeTile.value?.fields ?? []).some(f => f.section),
)

const groupedBySections = computed(() => {
  const fields = activeTile.value?.fields ?? []
  const sections: Record<string, Record<string, FieldDef[]>> = {}
  for (const f of fields) {
    const s = f.section ?? ''
    const g = f.group ?? 'Allgemein'
    if (!sections[s]) sections[s] = {}
    if (!sections[s][g]) sections[s][g] = []
    sections[s][g].push(f)
  }
  return sections
})

const groupedActiveTileFields = computed(() => {
  const fields = activeTile.value?.fields ?? []
  const groups: Record<string, FieldDef[]> = {}
  for (const f of fields) {
    const g = f.group ?? 'Allgemein'
    if (!groups[g]) groups[g] = []
    groups[g].push(f)
  }
  return groups
})

const hasFieldGroups = computed(() =>
  (activeTile.value?.fields ?? []).some(f => f.group),
)

const loadBtnLabel = computed(() => {
  if (selectedTile.value === 'schueler') {
    const count = selectedSchueler.value.length > 0
      ? selectedSchueler.value.length
      : filteredSchueler.value.length
    return count > 0 ? `${count} Schüler exportieren` : 'Exportieren'
  }
  if (selectedTile.value === 'lehrer') {
    const count = selectedLehrer.value.length > 0
      ? selectedLehrer.value.length
      : filteredLehrer.value.length
    return count > 0 ? `${count} Lehrkräfte exportieren` : 'Exportieren'
  }
  return data.value.length ? `Neu laden (${data.value.length} Datensätze)` : 'Daten laden'
})

const filteredLehrer = computed(() => {
  const sichtbarSet = lehrerSichtbarFilter.value.length > 0 ? new Set(lehrerSichtbarFilter.value) : null
  const typSet      = lehrerPersonalTypFilter.value.length > 0 ? new Set(lehrerPersonalTypFilter.value) : null
  if (!sichtbarSet && !typSet) return lehrerListe.value
  return lehrerListe.value.filter(l =>
    (!sichtbarSet || sichtbarSet.has(l.istSichtbar as boolean)) &&
    (!typSet      || typSet.has(l.personTyp as string)),
  )
})

const jahrgaengeOptions = computed(() =>
  [...new Set(schuelerAuswahl.value.map(s => s.jahrgang).filter((j): j is string => !!j))].sort(),
)

const klassenOptions = computed(() =>
  [...new Set(schuelerAuswahl.value.map(s => s.klasse).filter((k): k is string => !!k))].sort(),
)

const filteredSchueler = computed(() => {
  const statusSet  = statusFilter.value.length  > 0 ? new Set(statusFilter.value)  : null
  const jahrgSet   = jahrgangFilter.value.length > 0 ? new Set(jahrgangFilter.value) : null
  const klasseSet  = klasseFilter.value.length  > 0 ? new Set(klasseFilter.value)  : null
  const nameQ      = schuelerNameSearch.value.trim().toLowerCase()

  return schuelerAuswahl.value.filter(s =>
    (!statusSet || statusSet.has(s.status)) &&
    (!jahrgSet  || jahrgSet.has(s.jahrgang  as string)) &&
    (!klasseSet || klasseSet.has(s.klasse   as string)) &&
    (!nameQ     || (s.nachname as string).toLowerCase().includes(nameQ) ||
                   (s.vorname  as string).toLowerCase().includes(nameQ)),
  )
})

onMounted(() => {
  if (schuleStore.aktuellerAbschnittId !== null) {
    selectedAbschnittId.value = schuleStore.aktuellerAbschnittId
  }
})

watch(selectedAbschnittId, (newId, oldId) => {
  if (newId !== null && oldId !== null && selectedTile.value === 'schueler') {
    reloadAuswahlliste()
  }
})

function selectTile(id: string): void {
  if (selectedTile.value === id) return
  selectedTile.value = id
  data.value = []
  loadError.value = ''
  schuelerAuswahl.value = []
  selectedSchueler.value = []
  jahrgangFilter.value = []
  klasseFilter.value = []
  listError.value = ''
  lehrerListe.value = []
  selectedLehrer.value = []
  lehrerListError.value = ''
  const tile = TILES.find(t => t.id === id)
  selectedFields.value = tile?.fields?.map(f => f.key) ?? []
  if (id === 'schueler') reloadAuswahlliste()
  if (id === 'lehrer')   reloadLehrerListe()
}

function selectAll(): void {
  selectedFields.value = activeTile.value?.fields?.map(f => f.key) ?? []
}

function selectNone(): void {
  selectedFields.value = []
}

async function reloadAuswahlliste(): Promise<void> {
  if (selectedAbschnittId.value === null) return
  listLoading.value = true
  listError.value = ''
  selectedSchueler.value = []
  try {
    schuelerAuswahl.value = await fetchSchuelerAuswahlliste(selectedAbschnittId.value)
  } catch (e) {
    listError.value = e instanceof Error ? e.message : 'Fehler beim Laden der Schülerliste'
    schuelerAuswahl.value = []
  } finally {
    listLoading.value = false
  }
}

async function reloadLehrerListe(): Promise<void> {
  lehrerListLoading.value = true
  lehrerListError.value = ''
  selectedLehrer.value = []
  try {
    lehrerListe.value = await fetchForExport('/lehrer')
  } catch (e) {
    lehrerListError.value = e instanceof Error ? e.message : 'Fehler beim Laden der Lehrerliste'
    lehrerListe.value = []
  } finally {
    lehrerListLoading.value = false
  }
}

async function loadData(): Promise<void> {
  const tile = activeTile.value
  if (!tile) return
  loadError.value = ''

  if (tile.id === 'schueler') {
    const students = selectedSchueler.value.length > 0
      ? selectedSchueler.value
      : filteredSchueler.value
    if (students.length === 0) {
      loadError.value = 'Keine Schüler zum Exportieren vorhanden.'
      return
    }
    if (selectedFields.value.length === 0) {
      loadError.value = 'Bitte mindestens ein Feld auswählen.'
      return
    }

    // Nur Endpunkte laden deren Felder auch selektiert sind
    const neededEndpoints = (tile.subEndpoints ?? [])
      .filter(ep => ep.fieldKeys.some(k => selectedFields.value.includes(k)))
      .map(ep => ep.path)

    loading.value = true
    exportProgress.value = 0
    exportDone.value = 0
    exportTotal.value = students.length
    try {
      const sf = selectedFields.value
      const needsOrt                    = sf.some(f => f === 'plz' || f === 'ort')
      const needsReligion               = sf.some(f => f === 'religionKuerzel' || f === 'religionBezeichnung')
      const needsSchulen                = sf.some(f => f === 'idVorherigeSchule' || f === 'idAufnehmendeSchule')
      const needsJahrgaenge             = sf.includes('idEntlassjahrgang')
      const needsEinschulungsarten      = sf.includes('grundschuleEinschulungsartID')
      const needsUebergangsempfehlungen = sf.includes('idKuerzelGrundschuleUebergangsempfehlung')
      const needsKgBesuchsdauer         = sf.includes('idDauerKindergartenbesuch')
      const needsKindergaerten          = sf.includes('idKindergarten')

      const nm = <T>() => Promise.resolve(null as unknown as Map<number, T>)
      const [enriched, orteById, religionenById, schulenById, jahrgaengeById,
             einschulungsartenById, uebergangsempfehlungenById, kgBesuchsdauerById, kindergartenById] = await Promise.all([
        enrichSchueler(
          students,
          neededEndpoints,
          (done, total) => { exportDone.value = done; exportTotal.value = total; exportProgress.value = done / total },
        ),
        needsOrt                    ? fetchOrteById()                    : nm<OrtKatalogEintrag>(),
        needsReligion               ? fetchReligionenById()              : nm<ReligionKatalogEintrag>(),
        needsSchulen                ? fetchSchulenById()                 : nm<string>(),
        needsJahrgaenge             ? fetchJahrgaengeById()              : nm<string>(),
        needsEinschulungsarten      ? fetchEinschulungsartenById()       : nm<string>(),
        needsUebergangsempfehlungen ? fetchUebergangsempfehlungenById()  : nm<string>(),
        needsKgBesuchsdauer         ? fetchKindergartenbesuchsdauerById(): nm<string>(),
        needsKindergaerten          ? fetchKindergartenById()            : nm<string>(),
      ])

      const resolved = enriched.map(row => {
        const r: Record<string, unknown> = { ...row }

        if (orteById) {
          const entry = orteById.get(r.wohnortID as number)
          r.plz = entry?.plz ?? ''
          r.ort = entry?.ortsname ?? ''
        }

        const zusatz = String(r.hausnummerZusatz ?? '').trim()
        if (zusatz) r.hausnummer = `${String(r.hausnummer ?? '').trim()}${zusatz}`

        if (religionenById) {
          const rEntry = religionenById.get(r.religionID as number)
          r.religionKuerzel     = rEntry?.kuerzel     ?? ''
          r.religionBezeichnung = rEntry?.bezeichnung ?? ''
        }

        if (schulenById) {
          r.idVorherigeSchule   = schulenById.get(r.idVorherigeSchule   as number) ?? ''
          r.idAufnehmendeSchule = schulenById.get(r.idAufnehmendeSchule as number) ?? ''
        }
        if (jahrgaengeById)             r.idEntlassjahrgang                        = jahrgaengeById.get(r.idEntlassjahrgang                        as number) ?? ''
        if (einschulungsartenById)      r.grundschuleEinschulungsartID             = einschulungsartenById.get(r.grundschuleEinschulungsartID       as number) ?? ''
        if (uebergangsempfehlungenById) r.idKuerzelGrundschuleUebergangsempfehlung = uebergangsempfehlungenById.get(r.idKuerzelGrundschuleUebergangsempfehlung as number) ?? ''
        if (kgBesuchsdauerById)         r.idDauerKindergartenbesuch                = kgBesuchsdauerById.get(r.idDauerKindergartenbesuch            as number) ?? ''
        if (kindergartenById)           r.idKindergarten                           = kindergartenById.get(r.idKindergarten                         as number) ?? ''

        return r
      })

      const fieldLabelMap = Object.fromEntries((tile.fields ?? []).map(f => [f.key, f.label]))
      const exportCols = selectedFields.value.map(k => fieldLabelMap[k] ?? k)
      const exportData = resolved.map(row => {
        const r: Record<string, unknown> = {}
        for (const k of selectedFields.value) {
          r[fieldLabelMap[k] ?? k] = formatSchuelerValue(k, row[k])
        }
        return r
      })

      const date = new Date().toISOString().slice(0, 10)
      const filename = `schueler_export_${date}`
      format.value === 'csv'
        ? exportAsCsv(exportData, exportCols, `${filename}.csv`)
        : exportAsJson(exportData, exportCols, `${filename}.json`)
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : 'Fehler beim Exportieren'
    } finally {
      loading.value = false
      exportProgress.value = 0
      exportDone.value = 0
      exportTotal.value = 0
    }
    return
  }

  if (tile.id === 'lehrer') {
    const teachers = selectedLehrer.value.length > 0 ? selectedLehrer.value : filteredLehrer.value
    if (teachers.length === 0) { loadError.value = 'Keine Lehrkräfte zum Exportieren vorhanden.'; return }
    if (selectedFields.value.length === 0) { loadError.value = 'Bitte mindestens ein Feld auswählen.'; return }

    const neededEndpoints = (tile.subEndpoints ?? [])
      .filter(ep => ep.fieldKeys.some(k => selectedFields.value.includes(k)))
      .map(ep => ep.path)

    loading.value = true
    exportProgress.value = 0
    exportDone.value = 0
    exportTotal.value = teachers.length
    try {
      const needsOrt = selectedFields.value.some(f => f === 'plz' || f === 'ort')
      const [enriched, orteById] = await Promise.all([
        neededEndpoints.length > 0
          ? enrichRecords(
              teachers,
              neededEndpoints,
              (done, total) => { exportDone.value = done; exportTotal.value = total; exportProgress.value = done / total },
            )
          : Promise.resolve(teachers),
        needsOrt ? fetchOrteById() : Promise.resolve(null as unknown as Map<number, OrtKatalogEintrag>),
      ])

      const resolved = enriched.map(row => {
        const r: Record<string, unknown> = { ...row }
        if (orteById) {
          const entry = orteById.get(r.wohnortID as number)
          r.plz = entry?.plz ?? ''
          r.ort = entry?.ortsname ?? ''
        }
        const zusatz = String(r.hausnummerZusatz ?? '').trim()
        if (zusatz) r.hausnummer = `${String(r.hausnummer ?? '').trim()}${zusatz}`
        return r
      })

      const date = new Date().toISOString().slice(0, 10)
      const filename = `lehrer_export_${date}`
      format.value === 'csv'
        ? exportAsCsv(resolved, selectedFields.value, `${filename}.csv`)
        : exportAsJson(resolved, selectedFields.value, `${filename}.json`)
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : 'Fehler beim Exportieren'
    } finally {
      loading.value = false
      exportProgress.value = 0
      exportDone.value = 0
      exportTotal.value = 0
    }
    return
  }

  if (!tile.endpoint) return
  loading.value = true
  try {
    data.value = await fetchForExport(tile.endpoint)
    if (data.value.length === 0) loadError.value = 'Keine Datensätze auf dem Server gefunden.'
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Fehler beim Laden der Daten'
    data.value = []
  } finally {
    loading.value = false
  }
}

function doExport(): void {
  const tile = activeTile.value
  if (!tile || data.value.length === 0 || selectedFields.value.length === 0) return
  const date     = new Date().toISOString().slice(0, 10)
  const filename = `${tile.id}_export_${date}`
  if (format.value === 'csv') {
    exportAsCsv(data.value, selectedFields.value, `${filename}.csv`)
  } else {
    exportAsJson(data.value, selectedFields.value, `${filename}.json`)
  }
}
</script>

<style scoped>
.export-view {
  padding: 0.375rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

h2 { margin: 0; font-size: 0.9rem; font-weight: 600; }

.subtitle {
  margin: 0;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}

/* ── Kacheln ─────────────────────────────────────────────────────────────── */

.export-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.625rem;
}

.export-card {
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
  background: var(--p-surface-card);
  transition: border-color 0.15s, background 0.15s;
}

.export-card:hover:not(.coming-soon) {
  border-color: var(--p-primary-400);
}

.export-card.active {
  border-color: var(--p-primary-color);
  background: var(--p-primary-50);
}

:global(.dark) .export-card.active {
  background: color-mix(in srgb, var(--p-primary-color) 15%, var(--p-surface-card));
}

.export-card.coming-soon {
  opacity: 0.55;
  cursor: not-allowed;
  border-style: dashed;
}

.card-icon {
  font-size: 1.5rem;
  color: var(--p-primary-color);
}

.export-card.active .card-icon { color: var(--p-primary-700); }

.export-card strong { display: block; font-size: 0.85rem; line-height: 1.2; }

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

/* ── Konfig-Sektionen ────────────────────────────────────────────────────── */

.config-section {
  background: var(--p-surface-card);
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.section-title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
}

.section-actions {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Feld-Sektionen (oberste Ebene: Stammdaten / Schulbesuchsdaten) */
.field-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-section-header {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--p-primary-color);
  padding: 0.25rem 0 0.15rem;
  border-bottom: 2px solid var(--p-primary-200, #93c5fd);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:global(.dark) .field-section-header {
  border-bottom-color: color-mix(in srgb, var(--p-primary-color) 40%, transparent);
}

/* Karten-Gitter für Gruppen */
.groups-grid {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  align-items: start;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

/* Einzelne Gruppen-Karte */
.field-group-card {
  flex: 0 0 auto;
  min-width: 190px;
  border: 1px solid var(--p-surface-border);
  border-radius: 6px;
  background: var(--p-surface-ground);
  padding: 0.4rem 0.6rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field-group-card-header {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--p-text-muted-color);
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--p-surface-border);
}

/* Vertikale Checkbox-Liste innerhalb einer Karte */
.field-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  cursor: pointer;
  user-select: none;
}

/* Format-Auswahl */
.format-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 500;
}

.format-option i { color: var(--p-primary-color); font-size: 0.78rem; }

.format-actions {
  margin-left: auto;
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

/* Export-Fortschritt */
.export-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: var(--p-text-muted-color);
}

.progress-text { white-space: nowrap; }

/* Schülerliste */
.list-empty,
.list-error {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  padding: 0.25rem 0;
}

.list-empty { color: var(--p-text-muted-color); }
.list-error { color: var(--p-red-500, #ef4444); }

.count-badge {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--p-text-muted-color);
  margin-left: 0.35rem;
}

.status-badge {
  display: inline-block;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-0  { background: #e0f2fe; color: #075985; }
.status-1  { background: #fef9c3; color: #854d0e; }
.status-2  { background: #dcfce7; color: #166534; }
.status-3  { background: #fef3c7; color: #92400e; }
.status-6  { background: #f3e8ff; color: #6b21a8; }
.status-8  { background: #f0fdf4; color: #166534; }
.status-9  { background: #fef2f2; color: #991b1b; }
.status-10 { background: #f1f5f9; color: #475569; }

:global(.dark) .status-0  { background: #0c4a6e; color: #7dd3fc; }
:global(.dark) .status-1  { background: #713f12; color: #fde68a; }
:global(.dark) .status-2  { background: #14532d; color: #86efac; }
:global(.dark) .status-3  { background: #78350f; color: #fcd34d; }
:global(.dark) .status-6  { background: #4c1d95; color: #d8b4fe; }
:global(.dark) .status-8  { background: #14532d; color: #86efac; }
:global(.dark) .status-9  { background: #7f1d1d; color: #fca5a5; }
:global(.dark) .status-10 { background: #1e293b; color: #94a3b8; }

.ptyp-LEHRKRAFT   { background: #dbeafe; color: #1e40af; }
.ptyp-SEKRETARIAT { background: #fef9c3; color: #854d0e; }
.ptyp-PERSONAL    { background: #f3e8ff; color: #6b21a8; }
.ptyp-EXTERN      { background: #ffedd5; color: #9a3412; }
.ptyp-SONSTIGE    { background: #f1f5f9; color: #475569; }
.sichtbar-ja      { background: #dcfce7; color: #166534; }
.sichtbar-nein    { background: #fef2f2; color: #991b1b; }

:global(.dark) .ptyp-LEHRKRAFT   { background: #1e3a8a; color: #93c5fd; }
:global(.dark) .ptyp-SEKRETARIAT { background: #713f12; color: #fde68a; }
:global(.dark) .ptyp-PERSONAL    { background: #4c1d95; color: #d8b4fe; }
:global(.dark) .ptyp-EXTERN      { background: #7c2d12; color: #fed7aa; }
:global(.dark) .ptyp-SONSTIGE    { background: #1e293b; color: #94a3b8; }
:global(.dark) .sichtbar-ja      { background: #14532d; color: #86efac; }
:global(.dark) .sichtbar-nein    { background: #7f1d1d; color: #fca5a5; }

:deep(.p-datatable thead th),
:deep(.p-datatable tbody td) {
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
}

:deep(.p-datatable .p-paginator) {
  padding: 0.25rem 0.5rem;
  font-size: 0.72rem;
}

:deep(.p-datatable .p-paginator .p-paginator-page),
:deep(.p-datatable .p-paginator .p-paginator-first),
:deep(.p-datatable .p-paginator .p-paginator-prev),
:deep(.p-datatable .p-paginator .p-paginator-next),
:deep(.p-datatable .p-paginator .p-paginator-last) {
  min-width: 1.6rem;
  height: 1.6rem;
  font-size: 0.72rem;
}

:deep(.p-datatable .p-paginator .p-paginator-current) {
  font-size: 0.72rem;
}

:deep(.p-datatable .p-paginator .p-select) {
  font-size: 0.72rem;
}

:deep(.p-datatable .p-checkbox) {
  width: 14px;
  height: 14px;
}
:deep(.p-datatable .p-checkbox .p-checkbox-box) {
  width: 14px;
  height: 14px;
}
:deep(.p-datatable .p-checkbox .p-checkbox-icon) {
  font-size: 0.6rem;
  width: 0.6rem;
  height: 0.6rem;
}

:deep(.p-checkbox) {
  width: 13px;
  height: 13px;
}
:deep(.p-checkbox .p-checkbox-box) {
  width: 13px;
  height: 13px;
}
:deep(.p-checkbox .p-checkbox-icon) {
  display: none;
}
:deep(.p-checkbox:not(.p-checkbox-checked) .p-checkbox-box) {
  border-color: #888;
}

:deep(.section-actions .p-select .p-select-label),
:deep(.section-actions .p-multiselect .p-multiselect-label) {
  font-size: 0.72rem;
  padding: 0.2rem 0.25rem;
}
:deep(.section-actions .p-select .p-select-dropdown),
:deep(.section-actions .p-multiselect .p-multiselect-dropdown) {
  width: 1.25rem;
}
:deep(.section-actions .p-select .p-select-dropdown .p-icon),
:deep(.section-actions .p-multiselect .p-multiselect-dropdown .p-icon) {
  width: 0.6rem;
  height: 0.6rem;
}


:deep(.schueler-name-search) {
  width: 200px;
  font-size: 0.72rem;
  padding: 0.2rem 0.35rem;
}

:deep(.format-actions .p-button),
:deep(.section-actions .p-button) {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}
:deep(.format-actions .p-button .p-button-icon),
:deep(.section-actions .p-button .p-button-icon) {
  font-size: 0.75rem;
}

/* Extra-kompakte Schülertabelle — Spezifität muss >= .p-datatable.p-datatable-sm .p-datatable-tbody > tr > td sein */
:global(.p-datatable.p-datatable-sm.compact-table .p-datatable-tbody > tr > td) {
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
}
:global(.p-datatable.p-datatable-sm.compact-table .p-datatable-thead > tr > th) {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
}
:global(.p-datatable.compact-table) {
  --p-checkbox-width: 1rem;
  --p-checkbox-height: 1rem;
  --p-checkbox-icon-size: 0.55rem;
}
</style>
