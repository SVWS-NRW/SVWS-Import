export type Geschlecht = 3 | 4 | 5 | 6  // 3=männlich, 4=weiblich, 5=divers, 6=ohne Angabe

export type SchuelerStatus = 2 | 6 | 8  // 2=aktiv, 6=beurlaubt, 8=extern

export interface SchuelerNeu {
  nachname: string
  vorname: string
  alleVornamen: string
  geschlecht: Geschlecht | null
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
  // Personaldaten
  nachname: string
  vorname: string
  alleVornamen: string
  geburtsname: string
  geburtsort: string
  geschlecht: string                 // Roh-String aus der Datei, wird beim Senden konvertiert
  geburtsdatum: string
  staatsangehoerigkeitID: string
  religionID: string                 // Klartext (z.B. "römisch-katholisch")
  religionKuerzel: string            // Kürzel aus Schild-NRW StatistikKrz (z.B. "KR"), bevorzugter Lookup-Schlüssel
  // Adresse
  strassenname: string
  hausnummer: string
  plz: string
  ort: string
  ortsteil: string
  // Kontakt
  telefon: string
  email: string
  // Schulbezogen
  status: string
  anmeldedatum: string
  aufnahmedatum: string
  beginnBildungsgang: string
  klasse: string
  jahrgang: string
  schulgliederung: string
}

export function schuelerImportToApi(row: SchuelerImportRow, idSchuljahresabschnitt: number): SchuelerNeu {
  return {
    nachname: row.nachname,
    vorname: row.vorname,
    alleVornamen: row.alleVornamen || row.vorname,
    geschlecht: parseGeschlecht(row.geschlecht),
    geburtsdatum: row.geburtsdatum || null,
    status: 2,
    anmeldedatum: row.anmeldedatum || null,
    aufnahmedatum: row.aufnahmedatum || null,
    beginnBildungsgang: null,
    dauerBildungsgang: null,
    staatsangehoerigkeitID: null,
    idReligion: null,
    idSchuljahresabschnitt,
    idJahrgang: null,
    idKlasse: null,
    idGrundschuleEinschulungsart: null,
  }
}

function parseGeschlecht(raw: string): Geschlecht | null {
  const map: Record<string, Geschlecht> = {
    'm': 3, 'männlich': 3, 'maennlich': 3, 'male': 3, '3': 3,
    'w': 4, 'weiblich': 4, 'female': 4, '4': 4,
    'd': 5, 'divers': 5, '5': 5,
    'x': 6, 'ohne': 6, '6': 6,
  }
  return map[raw.toLowerCase().trim()] ?? null
}
