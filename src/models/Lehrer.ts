export type PersonalTyp = 'LEHRKRAFT' | 'SEKRETARIAT' | 'PERSONAL' | 'EXTERN' | 'SONSTIGE'

export interface LehrerStammdaten {
  id?: number
  kuerzel: string
  personalTyp: PersonalTyp
  anrede: string | null
  titel: string | null
  amtsbezeichnung: string | null
  nachname: string
  vorname: string
  geschlecht: number | null          // 3=männlich, 4=weiblich, 5=divers, 6=ohne Angabe
  geburtsdatum: string | null        // ISO 8601: YYYY-MM-DD
  staatsangehoerigkeitID: string | null
  strassenname: string | null
  hausnummer: string | null
  hausnummerZusatz: string | null
  wohnortID: number | null
  ortsteilID: number | null
  telefon: string | null
  telefonMobil: string | null
  emailPrivat: string | null
  emailDienstlich: string | null
  foto: string | null
  istSichtbar: boolean
  istRelevantFuerStatistik: boolean
  leitungsfunktionen: number[]
}

// Internes Modell für die Tabelle
export interface LehrerImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  kuerzel: string
  nachname: string
  vorname: string
  personalTyp: string
  anrede: string
  titel: string
  geburtsdatum: string
  geschlecht: string
  staatsangehoerigkeitID: string
  emailDienstlich: string
  telefon: string
}

export function lehrerImportToApi(row: LehrerImportRow): LehrerStammdaten {
  return {
    kuerzel: row.kuerzel,
    personalTyp: parsePersonalTyp(row.personalTyp),
    anrede: row.anrede || null,
    titel: row.titel || null,
    amtsbezeichnung: null,
    nachname: row.nachname,
    vorname: row.vorname,
    geschlecht: parseGeschlecht(row.geschlecht),
    geburtsdatum: row.geburtsdatum || null,
    staatsangehoerigkeitID: row.staatsangehoerigkeitID || null,
    strassenname: null,
    hausnummer: null,
    hausnummerZusatz: null,
    wohnortID: null,
    ortsteilID: null,
    telefon: row.telefon || null,
    telefonMobil: null,
    emailPrivat: null,
    emailDienstlich: row.emailDienstlich || null,
    foto: null,
    istSichtbar: true,
    istRelevantFuerStatistik: true,
    leitungsfunktionen: [],
  }
}

function parsePersonalTyp(raw: string): PersonalTyp {
  const map: Record<string, PersonalTyp> = {
    'lehrkraft': 'LEHRKRAFT',
    'lehrer':    'LEHRKRAFT',
    'sekretariat': 'SEKRETARIAT',
    'sekretär':    'SEKRETARIAT',
    'sekretaer':   'SEKRETARIAT',
    'personal':    'PERSONAL',
    'verwaltung':  'PERSONAL',
    'angestellte': 'PERSONAL',
    'angestellter':'PERSONAL',
    'extern':      'EXTERN',
    'externe':     'EXTERN',
    'sonstige':    'SONSTIGE',
    'sonstiger':   'SONSTIGE',
    'sonstig':     'SONSTIGE',
  }
  return map[raw.toLowerCase().trim()] ?? 'LEHRKRAFT'
}

function parseGeschlecht(raw: string): number | null {
  const map: Record<string, number> = {
    'm': 3, 'männlich': 3, 'maennlich': 3, 'male': 3, '3': 3,
    'w': 4, 'weiblich': 4, 'female': 4, '4': 4,
    'd': 5, 'divers': 5, '5': 5,
    'x': 6, 'ohne': 6, '6': 6,
  }
  return map[raw.toLowerCase().trim()] ?? null
}
