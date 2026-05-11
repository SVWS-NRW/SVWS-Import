import Papa from 'papaparse'
import { type SchuelerImportRow } from '@/models/Schueler'
import { type LehrerImportRow } from '@/models/Lehrer'
import { type KlasseImportRow } from '@/models/Klassen'
import { type JahrgangImportRow } from '@/models/Jahrgaenge'
import { generateId } from './idHelper'

// Normalisiert Spaltennamen: Leerzeichen/Groß-Klein entfernen
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '')
}

function buildLookup(record: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>()
  for (const [k, v] of Object.entries(record)) {
    map.set(normalizeKey(k), v ?? '')
  }
  return map
}

function get(map: Map<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = map.get(normalizeKey(k))
    if (v !== undefined) return v
  }
  return ''
}

export async function parseSchuelerCsv(file: File): Promise<SchuelerImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: /\.dat$/i.test(file.name) ? '|' : '',
      complete(results) {
        const rows: SchuelerImportRow[] = results.data.map(record => {
          const m = buildLookup(record)
          const row: SchuelerImportRow = {
            _id: generateId(),
            _valid: true,
            _errors: [],
            _sent: false,
            nachname:              get(m, 'nachname', 'name', 'familienname', 'last name', 'lastname'),
            vorname:               get(m, 'vorname', 'firstname', 'first name', 'rufname'),
            alleVornamen:          get(m, 'allevornamen', 'vornamen', 'alle vornamen'),
            geburtsname:           get(m, 'geburtsname', 'mädchenname', 'maiden name'),
            geburtsort:            get(m, 'geburtsort', 'birthplace'),
            geschlecht:            get(m, 'geschlecht', 'gender', 'sex'),
            geburtsdatum:          normalisiereDatum(get(m, 'geburtsdatum', 'geburtstag', 'birthdate', 'birthday', 'geb.datum', 'geb')),
            staatsangehoerigkeitID: get(m, '1.staatsang.', 'staatsangehoerigkeit', 'staatsangehörigkeit', 'nationalität', 'nationality', 'staatsang'),
            religionID:            get(m, 'konfession', 'religion', 'religionszugehörigkeit', 'religionszugehoerigkeit'),
            religionKuerzel:       get(m, 'statistikkrzkonfession', 'statistikkrizkonfession', 'religionskuerzel', 'konfessionskuerzel'),
            strassenname:          get(m, 'straße', 'strasse', 'strassenname', 'street', 'adresse', 'wohnstraße', 'strae'),
            hausnummer:            get(m, 'hausnummer', 'hnr', 'hausnr'),
            plz:                   get(m, 'plz', 'postleitzahl', 'postal code', 'zip'),
            ort:                   get(m, 'ort', 'wohnort', 'stadt', 'city'),
            ortsteil:              get(m, 'ortsteil', 'stadtteil'),
            telefon:               get(m, 'telefon', 'tel', 'phone', 'telefonnummer'),
            email:                 get(m, 'email', 'e-mail', 'mail', 'emailadresse'),
            status:                get(m, 'status'),
            anmeldedatum:          normalisiereDatum(get(m, 'anmeldedatum', 'anmeldung')),
            aufnahmedatum:         normalisiereDatum(get(m, 'aufnahmedatum', 'aufnahme', 'einschulung')),
            beginnBildungsgang:    normalisiereDatum(get(m, 'beginnbildungsgang', 'beginn bildungsgang')),
            klasse:                get(m, 'klasse', 'class', 'klassenbezeichnung', 'lerngruppe'),
            jahrgang:              get(m, 'jahrgang', 'jahrgangsstufe', 'stufe', 'grade', 'jg', 'jgst'),
            schulgliederung:       get(m, 'schulgliederung', 'gliederung', 'bildungsgang', 'track'),
          }
          return row
        })
        resolve(rows)
      },
      error(err) {
        reject(new Error(`CSV-Fehler: ${err.message}`))
      },
    })
  })
}

export async function parseLehrerCsv(file: File): Promise<LehrerImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const rows: LehrerImportRow[] = results.data.map(record => {
          const m = buildLookup(record)
          const row: LehrerImportRow = {
            _id: generateId(),
            _valid: true,
            _errors: [],
            _sent: false,
            kuerzel: get(m, 'kuerzel', 'abbreviation', 'kürzel', 'internkrz', 'kurzzeichen', 'kz'),
            nachname: get(m, 'nachname', 'name', 'familienname'),
            vorname: get(m, 'vorname', 'firstname'),
            personalTyp: get(m, 'personaltyp', 'typ', 'type') || 'LEHRKRAFT',
            anrede: get(m, 'anrede', 'salutation'),
            titel: get(m, 'titel', 'title'),
            geburtsdatum: normalisiereDatum(get(m, 'geburtsdatum', 'geburtstag', 'birthdate')),
            geschlecht: get(m, 'geschlecht', 'gender'),
            emailDienstlich: get(m, 'emaildienstlich', 'email', 'mail', 'e-mail'),
            telefon: get(m, 'telefon', 'phone', 'tel'),
          }
          return row
        })
        resolve(rows)
      },
      error(err) {
        reject(new Error(`CSV-Fehler: ${err.message}`))
      },
    })
  })
}

export async function parseKlassenCsv(file: File): Promise<KlasseImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: /\.dat$/i.test(file.name) ? '|' : '',
      complete(results) {
        const rows: KlasseImportRow[] = results.data.map(record => {
          const m = buildLookup(record)
          const row: KlasseImportRow = {
            _id: generateId(),
            _valid: true,
            _errors: [],
            _sent: false,
            kuerzel:          get(m, 'internbez', 'kuerzel', 'kürzel', 'bezeichnung'),
            kuerzelStatistik: get(m, 'statistikbez', 'kuerzelstatistik', 'statistikbezeichnung'),
            beschreibung:     get(m, 'sonstigebez', 'beschreibung', 'sonstigebezeichnung'),
            jahrgang:         get(m, 'jahrgang', 'jahrgangsstufe', 'jg'),
            idJahrgang:       null,
            folgeklasse:      get(m, 'folgeklasse'),
            klassenlehrer:    get(m, 'klassenlehrer', 'klassenlehrkraft', 'kl'),
            idKlassenlehrer:  null,
            orgForm:          get(m, 'orgform', 'organisationsform'),
            klassenart:       get(m, 'klassenart'),
            gliederung:       get(m, 'gliederung'),
            fachklasse:       get(m, 'fachklasse'),
            jahr:             get(m, 'jahr', 'schuljahr'),
            abschnitt:        get(m, 'abschnitt'),
          }
          return row
        })
        resolve(rows)
      },
      error(err) {
        reject(new Error(`CSV-Fehler: ${err.message}`))
      },
    })
  })
}

export async function parseJahrgaengeCsv(file: File): Promise<JahrgangImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: /\.dat$/i.test(file.name) ? '|' : '',
      complete(results) {
        const rows: JahrgangImportRow[] = results.data.map(record => {
          const m = buildLookup(record)
          return {
            _id: generateId(),
            _valid: true,
            _errors: [],
            _sent: false,
            kuerzel:          get(m, 'internkrz', 'kuerzel', 'kürzel', 'jahrgang', 'jg'),
            kuerzelStatistik: get(m, 'statistikkrz', 'kuerzelstatistik', 'statistikkuerzel'),
            gliederung:       get(m, 'gliederung'),
          }
        })
        resolve(rows)
      },
      error(err) {
        reject(new Error(`CSV-Fehler: ${err.message}`))
      },
    })
  })
}

// Versucht gängige Datumsformate nach YYYY-MM-DD zu konvertieren
export function normalisiereDatum(raw: string): string {
  if (!raw) return ''
  // bereits ISO-Format
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  // DD.MM.YYYY
  const dmy = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  // MM/DD/YYYY
  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`
  return raw
}
