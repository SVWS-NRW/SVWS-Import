import Papa from 'papaparse'
import { type SchuelerImportRow } from '@/models/Schueler'
import { type LehrerImportRow } from '@/models/Lehrer'
import { type KlasseImportRow } from '@/models/Klassen'
import { type JahrgangImportRow } from '@/models/Jahrgaenge'
import { type FachImportRow } from '@/models/Faecher'
import { type FloskelImportRow } from '@/models/Floskel'
import type { BetriebImportRow, AnsprechpartnerImportRow } from '@/models/Betriebe'
import type { OrtsteilImportRow } from '@/models/Ortsteile'
import type { AnkreuzkompetenzImportRow } from '@/models/Ankreuzkompetenz'
import { generateId } from './idHelper'

// Normalisiert Spaltennamen: Leerzeichen/Groß-Klein entfernen
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '')
}

// Alle bekannten (normalisierten) Alias-Spaltennamen für Schüler-Imports
export const SCHUELER_KNOWN_KEYS = new Set([
  // nachname
  'nachname', 'name', 'familienname', 'lastname',
  // vorname
  'vorname', 'firstname', 'rufname',
  // alleVornamen
  'allevornamen', 'vornamen',
  // geburtsname
  'geburtsname', 'mädchenname', 'maidenname',
  // geburtsort / geburtsland
  'geburtsort', 'birthplace',
  'geburtsland', 'birthcountry',
  // geschlecht
  'geschlecht', 'gender', 'sex',
  // geburtsdatum
  'geburtsdatum', 'geburtstag', 'birthdate', 'birthday', 'geb.datum', 'geb',
  // staatsangehörigkeit
  '1.staatsang.', '1staatsang.', 'staatsangehoerigkeit', 'staatsangehörigkeit', 'nationalität', 'nationality', 'staatsang',
  '2.staatsang.', '2staatsang.', 'staatsangehoerigkeit2', 'zweitestaatsangehoerigkeit',
  // religion
  'konfession', 'religion', 'religionszugehörigkeit', 'religionszugehoerigkeit',
  'statistikkrzkonfession', 'statistikkrizkonfession', 'religionskuerzel', 'konfessionskuerzel',
  'druckekonfession', 'konfessionaufzeugnisse', 'druckekonfessionaufzeugnisse',
  'religionanmeldung', 'konfessionsanmeldung',
  'religionabmeldung', 'konfessionsabmeldung',
  // migration / herkunft
  'migrationshintergrund', 'hatmigrationshintergrund',
  'zuzugsjahr', 'einwanderungsjahr',
  'verkehrssprache', 'familiensprache', 'muttersprache', 'verkehrssprachefamilie',
  'geburtslandvater',
  'geburtslandmutter',
  // adresse
  'straße', 'strasse', 'strassenname', 'street', 'adresse', 'wohnstraße', 'strae',
  'hausnummer', 'hnr', 'hausnr',
  'hausnummernzusatz', 'hausnrz', 'adresszusatz',
  'plz', 'postleitzahl', 'postalcode', 'zip',
  'ort', 'wohnort', 'stadt', 'city',
  'ortsteil', 'stadtteil',
  // kontakt
  'telefon', 'tel', 'phone', 'telefonnummer',
  'telefonmobil', 'mobiltelefon', 'handy', 'mobil', 'mobile',
  'email', 'mail', 'emailadresse',
  'emailschule', 'schulmail',
  // schulbezogen
  'status',
  'externeschulnr', 'schulnummer', 'schulnr',
  'beruf', 'profession',
  'anmeldedatum', 'anmeldung',
  'aufnahmedatum', 'aufnahme', 'einschulung',
  'beginnbildungsgang',
  'dauerbildungsgang',
  'klasse', 'class', 'klassenbezeichnung', 'lerngruppe',
  'jahrgang', 'jahrgangsstufe', 'stufe', 'grade', 'jg', 'jgst',
  'schulgliederung', 'gliederung', 'bildungsgang', 'track',
  // sonstiges
  'masernimpfnachweis', 'masernimpfung', 'hatmasernimpfnachweis',
  'keineauskunft', 'keineauskunftandritte', 'auskunftsperre',
  'schuelerbafoeg', 'bafoeg', 'erhaeltschuelerbafoeg',
  'meisterbafoeg', 'erhaeltmeisterbafoeg',
])

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

/**
 * Trennt einen kombinierten Straßen-String (z.B. "Altgrabauer Straße 227")
 * in Straßenname und Hausnummer auf.
 * Gibt ["Altgrabauer Straße", "227"] zurück.
 * Wenn keine Hausnummer erkennbar ist: ["Altgrabauer Straße", ""].
 */
export function splitStrasseHausnummer(combined: string): [string, string] {
  const trimmed = combined.trim()
  if (!trimmed) return ['', '']
  const match = trimmed.match(/^(.*)\s+(\d+[a-zA-Z0-9/\-]*)$/)
  if (match) return [match[1].trim(), match[2].trim()]
  return [trimmed, '']
}

export async function parseSchuelerCsv(file: File): Promise<{ rows: SchuelerImportRow[]; unmappedHeaders: string[] }> {
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
            _rawData: record,
            // Personaldaten
            nachname:                    get(m, 'nachname', 'name', 'familienname', 'last name', 'lastname'),
            vorname:                     get(m, 'vorname', 'firstname', 'first name', 'rufname'),
            alleVornamen:                get(m, 'allevornamen', 'vornamen', 'alle vornamen'),
            geburtsname:                 get(m, 'geburtsname', 'mädchenname', 'maiden name'),
            geburtsort:                  get(m, 'geburtsort', 'birthplace'),
            geburtsland:                 get(m, 'geburtsland', 'birthcountry'),
            geschlecht:                  get(m, 'geschlecht', 'gender', 'sex'),
            geburtsdatum:                normalisiereDatum(get(m, 'geburtsdatum', 'geburtstag', 'birthdate', 'birthday', 'geb.datum', 'geb')),
            staatsangehoerigkeitID:      get(m, '1.staatsang.', 'staatsangehoerigkeit', 'staatsangehörigkeit', 'nationalität', 'nationality', 'staatsang'),
            staatsangehoerigkeit2ID:     get(m, '2.staatsang.', 'staatsangehoerigkeit2', 'zweitestaatsangehoerigkeit'),
            religionID:                  get(m, 'konfession', 'religion', 'religionszugehörigkeit', 'religionszugehoerigkeit'),
            religionKuerzel:             get(m, 'statistikkrzkonfession', 'statistikkrizkonfession', 'religionskuerzel', 'konfessionskuerzel'),
            druckeKonfessionAufZeugnisse: get(m, 'druckekonfession', 'konfessionaufzeugnisse', 'drucke konfession auf zeugnisse'),
            religionanmeldung:           normalisiereDatum(get(m, 'religionanmeldung', 'konfessionsanmeldung')),
            religionabmeldung:           normalisiereDatum(get(m, 'religionabmeldung', 'konfessionsabmeldung')),
            // Herkunft / Migration
            hatMigrationshintergrund:    get(m, 'migrationshintergrund', 'hatmigrationshintergrund'),
            zuzugsjahr:                  get(m, 'zuzugsjahr', 'einwanderungsjahr'),
            verkehrspracheFamilie:       get(m, 'verkehrssprache', 'familiensprache', 'muttersprache', 'verkehrssprache familie'),
            geburtslandVater:            get(m, 'geburtslandvater', 'geburtsland vater'),
            geburtslandMutter:           get(m, 'geburtslandmutter', 'geburtsland mutter'),
            // Adresse
            ...(() => {
              const strasseRaw = get(m, 'straße', 'strasse', 'strassenname', 'street', 'adresse', 'wohnstraße', 'strae')
              const explicitHnr = get(m, 'hausnummer', 'hnr', 'hausnr')
              const [strassenname, hausnummer] = explicitHnr ? [strasseRaw, explicitHnr] : splitStrasseHausnummer(strasseRaw)
              return { strassenname, hausnummer }
            })(),
            hausnummerZusatz:            get(m, 'hausnummernzusatz', 'hausnrz', 'adresszusatz'),
            plz:                         get(m, 'plz', 'postleitzahl', 'postal code', 'zip'),
            ort:                         get(m, 'ort', 'wohnort', 'stadt', 'city'),
            ortsteil:                    get(m, 'ortsteil', 'stadtteil'),
            // Kontakt
            telefon:                     get(m, 'telefon', 'tel', 'phone', 'telefonnummer'),
            telefonMobil:                get(m, 'telefonmobil', 'mobiltelefon', 'handy', 'mobil', 'mobile'),
            email:                       get(m, 'email', 'e-mail', 'mail', 'emailadresse'),
            emailSchule:                 get(m, 'emailschule', 'schulmail', 'school email'),
            // Schulbezogen
            status:                      get(m, 'status'),
            externeSchulNr:              get(m, 'externeschulnr', 'schulnummer', 'schulnr'),
            beruf:                       get(m, 'beruf', 'profession'),
            anmeldedatum:                normalisiereDatum(get(m, 'anmeldedatum', 'anmeldung')),
            aufnahmedatum:               normalisiereDatum(get(m, 'aufnahmedatum', 'aufnahme', 'einschulung')),
            beginnBildungsgang:          normalisiereDatum(get(m, 'beginnbildungsgang', 'beginn bildungsgang')),
            dauerBildungsgang:           get(m, 'dauerbildungsgang', 'dauer bildungsgang'),
            klasse:                      get(m, 'klasse', 'class', 'klassenbezeichnung', 'lerngruppe'),
            jahrgang:                    get(m, 'jahrgang', 'jahrgangsstufe', 'stufe', 'grade', 'jg', 'jgst'),
            schulgliederung:             get(m, 'schulgliederung', 'gliederung', 'bildungsgang', 'track'),
            // Sonstiges
            hatMasernimpfnachweis:       get(m, 'masernimpfnachweis', 'masernimpfung', 'hatmasernimpfnachweis'),
            keineAuskunftAnDritte:       get(m, 'keineauskunft', 'keineauskunftandritte', 'auskunftsperre'),
            erhaeltSchuelerBAFOEG:       get(m, 'schuelerbafoeg', 'bafoeg', 'erhaeltschuelerbafoeg'),
            erhaeltMeisterBAFOEG:        get(m, 'meisterbafoeg', 'erhaeltmeisterbafoeg'),
          }
          return row
        })
        const allHeaders = (results.meta.fields ?? [])
        const unmappedHeaders = allHeaders.filter(h => !SCHUELER_KNOWN_KEYS.has(normalizeKey(h)))
        resolve({ rows, unmappedHeaders })
      },
      error(err) {
        reject(new Error(`CSV-Fehler: ${err.message}`))
      },
    })
  })
}

export const LEHRER_KNOWN_KEYS = new Set([
  'kuerzel', 'kürzel', 'abbreviation', 'internkrz', 'kurzzeichen', 'kz',
  'nachname', 'name', 'familienname',
  'vorname', 'firstname',
  'personaltyp', 'typ', 'type',
  'anrede', 'salutation',
  'titel', 'title',
  'amtsbezeichnung', 'amtsbez', 'bezeichnung',
  'geburtsdatum', 'geburtstag', 'birthdate',
  'geschlecht', 'gender',
  '1.staatsang.', 'staatsangehoerigkeitid', 'staatsangehoerigkeit', 'staatsangehörigkeit', 'nationalität', 'nationality', 'staatsang',
  'dienstl.email', 'dienstlemail', 'emaildienstlich', 'dienstlicheemail', 'dienstemail',
  'email', 'e-mail', 'mail', 'emailadresse',
  'emailprivat', 'privateemail', 'mailprivat', 'emailprivate',
  'tel.festnetz', 'telfestnetz', 'telefon', 'phone', 'tel', 'festnetz',
  'telefonmobil', 'mobiltelefon', 'handy', 'mobil', 'mobile', 'tel.mobil',
  'istsichtbar', 'sichtbar', 'visible',
  'istrelevantfuerstatistik', 'statistik', 'relevantfuerstatistik',
  'straße', 'strasse', 'strassenname', 'street', 'adresse',
  'hausnummer', 'hnr', 'hausnr',
  'hausnummerzusatz', 'hausnrz', 'adresszusatz',
  'plz', 'postleitzahl', 'zip',
  'ort', 'wohnort', 'stadt', 'city',
])

export async function parseLehrerCsv(file: File): Promise<{ rows: LehrerImportRow[]; unmappedHeaders: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: /\.dat$/i.test(file.name) ? '|' : '',
      complete(results) {
        const rows: LehrerImportRow[] = results.data.map(record => {
          const m = buildLookup(record)
          const strasseRaw = get(m, 'straße', 'strasse', 'strassenname', 'street', 'adresse')
          const explicitHnr = get(m, 'hausnummer', 'hnr', 'hausnr')
          const [strassenname, hausnummer] = explicitHnr
            ? [strasseRaw, explicitHnr]
            : splitStrasseHausnummer(strasseRaw)
          const rawData: Record<string, string> = {}
          for (const [k, v] of Object.entries(record)) rawData[k] = v ?? ''
          const row: LehrerImportRow = {
            _id: generateId(),
            _valid: true,
            _errors: [],
            _sent: false,
            _rawData: rawData,
            kuerzel: get(m, 'kuerzel', 'abbreviation', 'kürzel', 'internkrz', 'kurzzeichen', 'kz'),
            nachname: get(m, 'nachname', 'name', 'familienname'),
            vorname: get(m, 'vorname', 'firstname'),
            personalTyp: get(m, 'personaltyp', 'typ', 'type') || 'LEHRKRAFT',
            anrede: get(m, 'anrede', 'salutation'),
            titel: get(m, 'titel', 'title'),
            amtsbezeichnung: get(m, 'amtsbezeichnung', 'amtsbez'),
            geburtsdatum: normalisiereDatum(get(m, 'geburtsdatum', 'geburtstag', 'birthdate')),
            geschlecht: get(m, 'geschlecht', 'gender'),
            staatsangehoerigkeitID: get(m, 'staatsangehoerigkeitID', '1.staatsang.', 'staatsangehoerigkeit', 'staatsangehörigkeit', 'nationalität', 'nationality', 'staatsang'),
            emailDienstlich: get(m, 'dienstl.email', 'dienstlemail', 'emaildienstlich', 'dienstlicheemail', 'dienstemail', 'email', 'e-mail', 'mail', 'emailadresse'),
            emailPrivat: get(m, 'emailprivat', 'privateemail', 'mailprivat', 'emailprivate'),
            telefon: get(m, 'tel.festnetz', 'telfestnetz', 'telefon', 'phone', 'tel', 'festnetz'),
            telefonMobil: get(m, 'telefonmobil', 'mobiltelefon', 'handy', 'mobil', 'mobile', 'tel.mobil'),
            istSichtbar: get(m, 'istsichtbar', 'sichtbar', 'visible'),
            istRelevantFuerStatistik: get(m, 'istrelevantfuerstatistik', 'statistik', 'relevantfuerstatistik'),
            strassenname,
            hausnummer,
            hausnummerZusatz: get(m, 'hausnummerzusatz', 'hausnrz', 'adresszusatz'),
            plz: get(m, 'plz', 'postleitzahl', 'zip'),
            ort: get(m, 'ort', 'wohnort', 'stadt', 'city'),
          }
          return row
        })
        const allHeaders = results.meta.fields ?? []
        const unmappedHeaders = allHeaders.filter(h => !LEHRER_KNOWN_KEYS.has(normalizeKey(h)))
        resolve({ rows, unmappedHeaders })
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

export async function parseFaecherCsv(file: File): Promise<FachImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: /\.dat$/i.test(file.name) ? '|' : '',
      complete(results) {
        const rows: FachImportRow[] = results.data.map(record => {
          const m = buildLookup(record)
          const row: FachImportRow = {
            _id: generateId(),
            _valid: true,
            _errors: [],
            _sent: false,
            kuerzel:          get(m, 'internkrz', 'kuerzel', 'kürzel', 'fach'),
            kuerzelStatistik: get(m, 'statistikkrz', 'kuerzelstatistik', 'statistikkuerzel'),
            bezeichnung:      get(m, 'bezeichnung', 'beschreibung', 'fachbezeichnung', 'name'),
          }
          for (const [key, value] of Object.entries(record)) {
            row[key] = value ?? ''
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

export async function parseFloskelCsv(file: File): Promise<FloskelImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: /\.dat$/i.test(file.name) ? '|' : '',
      complete(results) {
        const rows: FloskelImportRow[] = results.data.map(record => {
          const m = buildLookup(record)
          return {
            _id: generateId(),
            _valid: true,
            _errors: [],
            _sent: false,
            kuerzel:         get(m, 'kürzel', 'kuerzel', 'kz'),
            text:            get(m, 'floskeltext', 'text', 'inhalt', 'beschreibung'),
            floskelgruppe:   get(m, 'gruppe', 'floskelgruppe', 'fg'),
            idFloskelgruppe: get(m, 'idfloskelgruppe', 'gruppeid', 'floskelgruppeid'),
            fach:            get(m, 'fach'),
            jahrgang:        get(m, 'jahrgang', 'jg', 'jahrgangsstufe', 'stufe'),
            niveau:          get(m, 'niveau', 'niveaustufe'),
            sortierung:      get(m, 'sortierung', 'sort'),
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

export async function parseBetriebeCsv(file: File): Promise<BetriebImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: /\.dat$/i.test(file.name) ? '|' : '',
      complete(results) {
        const rows: BetriebImportRow[] = results.data.map(record => {
          const m = buildLookup(record)
          return {
            _id: generateId(),
            _valid: true,
            _errors: [],
            _sent: false,
            name:                              get(m, 'name', 'name1', 'betrieb', 'betriebsname', 'firma'),
            nameZusatz:                        get(m, 'namezusatz', 'name2', 'zusatz', 'namenszusatz'),
            bemerkungen:                       get(m, 'bemerkungen', 'bemerkung', 'notizen', 'notes'),
            branche:                           get(m, 'branche', 'branchenbezeichnung'),
            strasse:                           get(m, 'strasse', 'straße', 'street', 'strae'),
            hausnummer:                        get(m, 'hausnummer', 'hnr', 'hausnr'),
            hausnummerZusatz:                  get(m, 'hausnummerzusatz', 'hausnrz', 'adresszusatz'),
            plz:                               get(m, 'plz', 'postleitzahl', 'postalcode', 'zip'),
            ort:                               get(m, 'ort', 'wohnort', 'stadt', 'city'),
            telefon1:                          get(m, 'telefon1', 'telefonnr.1', 'telefon', 'tel', 'phone'),
            telefon2:                          get(m, 'telefon2', 'telefonnr.2'),
            fax:                               get(m, 'fax', 'faxnummer'),
            eMail:                             get(m, 'email', 'e-mail', 'mail', 'emailadresse'),
            istAusbildungsbetrieb:             get(m, 'ausbildungsbetrieb', 'istausbildungsbetrieb'),
            istMassnahmentraeger:              get(m, 'massnahmentraeger', 'istmassnahmentraeger', 'maßnahmenträger'),
            belehrungNachISGErforderlich:      get(m, 'belehrungisg', 'belehrungnachisg', 'belehrungnachisgerforderlich', 'isg'),
            erweitertesFuehrungszeugnisErforderlich: get(m, 'erweitertesfuehrungszeugnis', 'fuehrungszeugnis', 'erwfuehrungszeugnis'),
            bietetPraktikumsplaetzeAn:         get(m, 'praktikumsplaetze', 'bietetzpraktikumsplaetze', 'bietetzpraktikumsplaetzean'),
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

export async function parseAnsprechpartnerCsv(file: File): Promise<AnsprechpartnerImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: /\.dat$/i.test(file.name) ? '|' : '',
      complete(results) {
        const rows: AnsprechpartnerImportRow[] = results.data.map(record => {
          const m = buildLookup(record)
          return {
            _id: generateId(),
            _valid: true,
            _errors: [],
            _sent: false,
            betriebName: get(m, 'betrieb', 'betriebsname', 'firma', 'betriebname'),
            anrede:      get(m, 'anrede', 'salutation', 'title'),
            name:        get(m, 'nachname', 'name', 'familienname'),
            rufname:     get(m, 'vorname', 'rufname', 'firstname'),
            telefon:     get(m, 'telefon', 'tel', 'phone'),
            eMail:       get(m, 'email', 'e-mail', 'mail'),
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

export async function parseOrtsteileCsv(file: File): Promise<OrtsteilImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: /\.dat$/i.test(file.name) ? '|' : '',
      complete(results) {
        const rows: OrtsteilImportRow[] = results.data.map(record => {
          const m = buildLookup(record)
          return {
            _id: generateId(),
            _valid: true,
            _errors: [],
            _sent: false,
            ortsteil: get(m, 'ortsteil', 'stadtteil', 'bezeichnung', 'name'),
            plz:      get(m, 'plz', 'postleitzahl', 'postalcode'),
            ort:      get(m, 'ort', 'ortsname', 'stadt', 'city'),
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

export async function parseAnkreuzkompetenzCsv(file: File): Promise<AnkreuzkompetenzImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: /\.dat$/i.test(file.name) ? '|' : '',
      complete(results) {
        const rows: AnkreuzkompetenzImportRow[] = results.data.map(record => {
          const m = buildLookup(record)
          return {
            _id: generateId(),
            _valid: true,
            _errors: [],
            _sent: false,
            text:           get(m, 'text', 'floskeltext', 'ankreuzkompetenz', 'inhalt', 'beschreibung'),
            fach:           get(m, 'fach', 'fachkuerzel'),
            jahrgang:       get(m, 'jahrgang', 'jg', 'jahrgangsstufe', 'stufe', 'jahrgaenge'),
            abschnitt:      get(m, 'abschnitt', 'hj', 'halbjahr'),
            istASV:         get(m, 'istasv', 'asv', 'arbeitsundsozialverhalten'),
            sortierung:     get(m, 'sortierung', 'sort'),
            schulgliederung: get(m, 'schulgliederung', 'gliederung'),
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

export function parseSchuelerSchulbesuchCsv(file: File): Promise<import('@/models/SchuelerSchulbesuch').SchuelerSchulbesuchImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        try {
          const rows = (results.data as Record<string, string>[]).map((record) => {
            const m = buildLookup(record)
            return {
              _id: generateId(),
              _valid: false,
              _errors: [] as string[],
              _sent: false,
              _schuelerId: null,
              _lookupStatus: 'pending' as const,
              _vorherigeSchuleStatus: 'empty' as const,
              _vorigeEntlassJahrgangStatus: 'empty' as const,
              // Suchschlüssel
              nachname:     get(m, 'nachname', 'name', 'familienname'),
              vorname:      get(m, 'vorname', 'firstname', 'rufname'),
              geburtsdatum: normalisiereDatum(get(m, 'geburtsdatum', 'geburtstag', 'birthdate', 'birthday', 'geb')),
              // Vorige Schule — enthält Schulnummer, wird vor dem Upload in DB-ID aufgelöst
              vorherigeSchule:           get(m, 'vorherigeschule', 'idvorherigeschule', 'vorherigeschuleid', 'vorherige schule'),
              vorigeAllgHerkunft:        get(m, 'vorigeallgherkunft', 'herkunft', 'herkunftsart', 'schulformvorher'),
              vorigeEntlassdatum:        normalisiereDatum(get(m, 'vorigeentlassdatum', 'entlassdatumvorher')),
              vorigeEntlassjahrgang:     get(m, 'vorigeentlassjahrgang', 'jahrgangvorher'),
              vorigeArtLetzteVersetzung: get(m, 'vorigeartletzteversetzung', 'versetzungsart', 'letzteversetzung'),
              vorigeEntlassgrundID:      get(m, 'vorigeentlassgrundid', 'vorigeentlassgrund', 'entlassgrundvorher'),
              vorigeBemerkung:           get(m, 'vorigebemerkung', 'bemerkung'),
              vorigeAbschlussartID:      get(m, 'vorigeabschlussartid', 'vorigeabschlussart', 'abschlussartvorher', 'abschlussvorher'),
              // Entlassung von dieser Schule
              entlassungDatum:           normalisiereDatum(get(m, 'entlassungdatum', 'entlassdatum', 'entlassungsdatum')),
              idEntlassjahrgang:         get(m, 'identlassjahrgang', 'entlassjahrgang', 'entlassjahrgangid'),
              entlassungGrundID:         get(m, 'entlassunggrundid', 'entlassunggrund', 'entlassungsgrund', 'entlassungsgrundid'),
              entlassungAbschlussartID:  get(m, 'entlassungabschlussartid', 'entlassungabschlussart', 'abschlussart', 'abschluss'),
              // Aufnehmende Schule
              idAufnehmendeSchule:       get(m, 'idaufnehmendeschule', 'aufnehmendeschule', 'aufnehmendeschuleid'),
              aufnehmendWechseldatum:    normalisiereDatum(get(m, 'aufnehmendwechseldatum', 'wechseldatumaufnehmend', 'wechseldatum')),
              aufnehmendBestaetigt:      get(m, 'aufnehmendbestaetigt', 'wechselbestaetigt', 'aufnahmebestaetigt'),
              // Grundschule
              grundschuleEinschulungsjahr:             get(m, 'grundschuleeinschulungsjahr', 'einschulungsjahr', 'einschulung'),
              grundschuleEinschulungsartID:             get(m, 'grundschuleeinschulungsartid', 'grundschuleeinschulungsart', 'einschulungsart'),
              idGrundschuleJahreEingangsphase:          get(m, 'idgrundschulejahreeingangsphase', 'grundschulejahreeingangsphase', 'jahreeingangsphase', 'eingangsphase'),
              idKuerzelGrundschuleUebergangsempfehlung: get(m, 'idkuerzelgrundschuleuebergangsempfehlung', 'kuerzelgrundschuleuebergangsempfehlung', 'uebergangsempfehlung'),
              // Sekundarstufe
              sekIWechsel:               get(m, 'sekiwechsel', 'wechselseki', 'sek1wechsel'),
              sekIErsteSchulform:        get(m, 'sekiersteschulform', 'ersteschulform'),
              sekIIWechsel:              get(m, 'sekiiwechsel', 'wechselsekii', 'sek2wechsel'),
              // Kindergarten
              idDauerKindergartenbesuch: get(m, 'iddauerkindergartenbesuch', 'dauerkindergartenbesuch', 'dauerkindergarten', 'kindergartenbesuchdauer'),
              idKindergarten:            get(m, 'idkindergarten', 'kindergarten', 'kindergartenid'),
              // Sprachförderung
              verpflichtungSprachfoerderkurs: get(m, 'verpflichtungsprachfoerderkurs', 'sprachfoerderpflicht'),
              teilnahmeSprachfoerderkurs:     get(m, 'teilnahmesprachfoerderkurs', 'sprachfoerderteilnahme'),
            }
          })
          resolve(rows)
        } catch (e) {
          reject(e)
        }
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
