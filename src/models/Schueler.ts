export type Geschlecht = 3 | 4 | 5 | 6  // 3=männlich, 4=weiblich, 5=divers, 6=ohne Angabe

export type SchuelerStatus = 0 | 1 | 2 | 3 | 6 | 8 | 9 | 10  // 0=Aufnahme, 1=Warteliste, 2=Aktiv, 3=Beurlaubt, 6=Extern, 8=Abschluss, 9=Abgang, 10=Ehemalige

export interface SchuelerNeu {
  nachname: string
  vorname: string
  alleVornamen: string
  geschlecht: Geschlecht
  geburtsdatum: string | null       // ISO 8601: YYYY-MM-DD
  status: SchuelerStatus | null
  anmeldedatum: string | null
  aufnahmedatum: string | null
  beginnBildungsgang: string | null
  dauerBildungsgang: number | null
  staatsangehoerigkeitID: string | null
  idReligion: number | null
  idSchuljahresabschnitt: number | null
  idJahrgang: number | null
  idKlasse: number | null
  idGrundschuleEinschulungsart: number | null
}

// Internes Modell: vereinigt ImportZeile + Validierungsstatus
export interface SchuelerImportRow {
  _id: string                        // lokale UUID für die Tabelle
  _valid: boolean
  _errors: string[]
  _sent: boolean
  _rawData: Record<string, string>   // alle Original-Spaltennamen aus der Importdatei
  // Personaldaten
  nachname: string
  vorname: string
  alleVornamen: string
  geburtsname: string
  geburtsort: string
  geburtsland: string
  geschlecht: string                 // Roh-String aus der Datei, wird beim Senden konvertiert
  geburtsdatum: string
  staatsangehoerigkeitID: string
  staatsangehoerigkeit2ID: string
  religionID: string                 // Klartext (z.B. "römisch-katholisch")
  religionKuerzel: string            // Kürzel aus Schild-NRW StatistikKrz (z.B. "KR"), bevorzugter Lookup-Schlüssel
  druckeKonfessionAufZeugnisse: string
  religionanmeldung: string
  religionabmeldung: string
  // Herkunft / Migration
  hatMigrationshintergrund: string
  zuzugsjahr: string
  verkehrspracheFamilie: string
  geburtslandVater: string
  geburtslandMutter: string
  // Adresse
  strassenname: string
  hausnummer: string
  hausnummerZusatz: string
  plz: string
  ort: string
  ortsteil: string
  // Kontakt
  telefon: string
  telefonMobil: string
  email: string
  emailSchule: string
  // Schulbezogen
  status: string
  externeSchulNr: string
  beruf: string
  anmeldedatum: string
  aufnahmedatum: string
  beginnBildungsgang: string
  dauerBildungsgang: string
  klasse: string
  jahrgang: string
  schulgliederung: string
  // Sonstiges
  hatMasernimpfnachweis: string
  keineAuskunftAnDritte: string
  erhaeltSchuelerBAFOEG: string
  erhaeltMeisterBAFOEG: string
}

function parseStatus(raw: string): SchuelerStatus {
  const map: Record<string, SchuelerStatus> = {
    '0': 0, 'aufnahme': 0, 'neuaufnahme': 0,
    '1': 1, 'warteliste': 1,
    '2': 2, 'aktiv': 2,
    '3': 3, 'beurlaubt': 3,
    '6': 6, 'extern': 6,
    '8': 8, 'abschluss': 8,
    '9': 9, 'abgang': 9,
    '10': 10, 'ehemalige': 10,
  }
  return map[raw.toLowerCase().trim()] ?? 2
}

function parseGeschlecht(raw: string): Geschlecht {
  const map: Record<string, Geschlecht> = {
    'm': 3, 'männlich': 3, 'maennlich': 3, 'male': 3, '3': 3,
    'w': 4, 'weiblich': 4, 'female': 4, '4': 4,
    'd': 5, 'divers': 5, '5': 5,
    'x': 6, 'ohne': 6, '6': 6,
  }
  return map[raw.toLowerCase().trim()] ?? 6
}

export function schuelerImportToApi(row: SchuelerImportRow, idSchuljahresabschnitt: number): SchuelerNeu {
  return {
    nachname: row.nachname,
    vorname: row.vorname,
    alleVornamen: row.alleVornamen || row.vorname,
    geschlecht: parseGeschlecht(row.geschlecht),
    geburtsdatum: row.geburtsdatum || null,
    status: parseStatus(row.status),
    anmeldedatum: row.anmeldedatum || null,
    aufnahmedatum: row.aufnahmedatum || null,
    beginnBildungsgang: row.beginnBildungsgang || null,
    dauerBildungsgang: row.dauerBildungsgang ? parseInt(row.dauerBildungsgang, 10) || null : null,
    staatsangehoerigkeitID: null,
    idReligion: null,
    idSchuljahresabschnitt,
    idJahrgang: null,
    idKlasse: null,
    idGrundschuleEinschulungsart: null,
  }
}
