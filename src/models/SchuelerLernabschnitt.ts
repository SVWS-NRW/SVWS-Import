/**
 * Lernabschnittsdaten zu Schülern. Eine Zeile entspricht dem Lernabschnitt eines Schülers in einem
 * Schuljahresabschnitt (bei Klassenwechsel ggf. mehrere, unterschieden über die WechselNr).
 * Alle Werte bleiben Text, damit sie in der Tabelle korrigiert werden können; aufgelöst wird erst im Store.
 */
export interface SchuelerLernabschnittImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  /** Felder mit Fehlern, für die rote Markierung in der Tabelle */
  _fehlerFelder: string[]
  _sent: boolean
  _schuelerId: number | null
  /** mismatch: Schüler-ID gefunden, aber Name/Geburtsdatum passen nicht dazu */
  _lookupStatus: 'pending' | 'ok' | 'not_found' | 'ambiguous' | 'mismatch'
  /** ID des Schuljahresabschnitts im SVWS-Server, null wenn dort unbekannt */
  _idSchuljahresabschnitt: number | null
  /** fehlt: Lernabschnitt existiert beim Schüler noch nicht und kann (noch) nicht angelegt werden */
  _result?: 'angelegt' | 'ueberschrieben' | 'uebersprungen' | 'fehlt'
  // Identifikation des Schülers — Schüler-ID hat Vorrang vor Name + Geburtsdatum
  schuelerId: string
  nachname: string
  vorname: string
  geburtsdatum: string
  // Abschnitt
  schuljahr: string
  abschnitt: string
  /** 0 = aktueller Lernabschnitt, 1 = vor dem ersten Wechsel … (leer = 0) */
  wechselNr: string
  // Zuordnung
  jahrgang: string
  klasse: string
  /** Lehrer-Kürzel; im Schild-Export „Klassenlehrer“ */
  tutor: string
  schulgliederung: string
  organisationsform: string
  klassenart: string
  // Förderung
  foerderschwerpunkt1: string
  foerderschwerpunkt2: string
  schwerbehinderung: string
  // Bewertung
  gewertet: string
  wiederholung: string
  versetzung: string
  abschlussart: string
  datumKonferenz: string
  datumZeugnis: string
  zeugnisart: string
  // Fehlstunden
  fehlstundenGesamt: string
  fehlstundenUnentschuldigt: string
  fehlstundenGrenzwert: string
  // Zeitraum
  datumAnfang: string
  datumEnde: string
  /** Nur Anzeige: der SVWS-Server übernimmt Abschlüsse derzeit nicht per PATCH */
  abschlussAllgemein: string
  abschlussBerufsbildend: string
}

/** Über Kataloge aufgelöste IDs einer Zeile; undefined = Feld leer, wird nicht gesendet */
export interface LernabschnittIds {
  jahrgangID?: number
  klassenID?: number
  tutorID?: number
  idSchulgliederung?: number
  idOrganisationsform?: number
  idKlassenart?: number
  foerderschwerpunkt1ID?: number
  foerderschwerpunkt2ID?: number
}

export function parseJaNein(raw: string): boolean | null {
  const v = raw.trim().toLowerCase()
  if (['j', 'ja', 'true', '1', 'x', 'yes'].includes(v)) return true
  if (['n', 'nein', 'false', '0', 'no'].includes(v)) return false
  return null
}

/** Ganze Zahl ≥ 0, sonst null */
export function parseGanzzahl(raw: string): number | null {
  const v = raw.trim()
  return /^\d+$/.test(v) ? Number(v) : null
}

/**
 * Patch für PATCH /schueler/lernabschnittsdaten/{id}. Leere Zellen werden nicht gesendet,
 * damit vorhandene Werte erhalten bleiben. Der Versetzungsvermerk wird als Kürzel übertragen
 * (Attribut „versetzungsvermerk“, nicht idVersetzungsvermerk).
 */
export function lernabschnittPatch(row: SchuelerLernabschnittImportRow, ids: LernabschnittIds): Record<string, unknown> {
  const patch: Record<string, unknown> = { ...ids }
  for (const key of Object.keys(patch)) if (patch[key] === undefined) delete patch[key]

  const bool = (raw: string, attr: string) => {
    const v = parseJaNein(raw)
    if (v !== null) patch[attr] = v
  }
  const zahl = (raw: string, attr: string) => {
    const v = parseGanzzahl(raw)
    if (v !== null) patch[attr] = v
  }
  const text = (raw: string, attr: string) => {
    if (raw.trim()) patch[attr] = raw.trim()
  }

  bool(row.gewertet, 'istGewertet')
  bool(row.wiederholung, 'istWiederholung')
  bool(row.schwerbehinderung, 'hatSchwerbehinderungsNachweis')
  text(row.versetzung, 'versetzungsvermerk')
  zahl(row.abschlussart, 'abschlussart')
  text(row.datumKonferenz, 'datumKonferenz')
  text(row.datumZeugnis, 'datumZeugnis')
  text(row.zeugnisart, 'zeugnisart')
  zahl(row.fehlstundenGesamt, 'fehlstundenGesamt')
  zahl(row.fehlstundenUnentschuldigt, 'fehlstundenUnentschuldigt')
  zahl(row.fehlstundenGrenzwert, 'fehlstundenGrenzwert')
  text(row.datumAnfang, 'datumAnfang')
  text(row.datumEnde, 'datumEnde')
  return patch
}
