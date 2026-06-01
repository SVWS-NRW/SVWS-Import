import type { ImportModule, MappedRow, ImportContext } from '@/models/ImportSchema'
import type { SchuelerNeu, Geschlecht, SchuelerStatus } from '@/models/Schueler'
import { resolveNationalitaet } from '@/services/katalogService'
import { normalisiereDatum } from '@/utils/csvParser'

const dateValidate = (v: string): string | null => {
  if (!v) return null
  const n = normalisiereDatum(v)
  return /^\d{4}-\d{2}-\d{2}$/.test(n) ? null : 'Ungültiges Datumsformat (erwartet: TT.MM.JJJJ oder JJJJ-MM-TT)'
}

export const schuelerStammdatenSchema: ImportModule = {
  id: 'schueler-stammdaten',
  entityType: 'schueler',
  moduleType: 'stammdaten',
  label: 'Schüler Stammdaten',
  description: 'Grunddaten: Name, Geburtsdatum, Geschlecht, Adresse, Schulstatus',
  icon: 'pi pi-users',

  fields: [
    // ── Pflichtfelder ────────────────────────────────────────────────────────
    {
      key: 'nachname',
      label: 'Nachname',
      category: 'Personaldaten',
      required: true,
      type: 'string',
      aliases: ['nachname', 'name', 'familienname', 'last name', 'lastname', 'surname', 'schuelername'],
      validate: v => v.trim() ? null : 'Nachname ist Pflichtfeld',
    },
    {
      key: 'vorname',
      label: 'Vorname',
      category: 'Personaldaten',
      required: true,
      type: 'string',
      aliases: ['vorname', 'firstname', 'first name', 'rufname'],
      validate: v => v.trim() ? null : 'Vorname ist Pflichtfeld',
    },
    // ── Personaldaten ────────────────────────────────────────────────────────
    {
      key: 'alleVornamen',
      label: 'Alle Vornamen',
      category: 'Personaldaten',
      required: false,
      type: 'string',
      aliases: ['allevornamen', 'vornamen', 'alle vornamen', 'sämtliche vornamen'],
    },
    {
      key: 'geburtsname',
      label: 'Geburtsname',
      category: 'Personaldaten',
      required: false,
      type: 'string',
      aliases: ['geburtsname', 'mädchenname', 'maiden name', 'birth name', 'geburtsname / mädchenname'],
    },
    {
      key: 'geburtsort',
      label: 'Geburtsort',
      category: 'Personaldaten',
      required: false,
      type: 'string',
      aliases: ['geburtsort', 'birthplace', 'place of birth', 'ort der geburt'],
    },
    {
      key: 'geschlecht',
      label: 'Geschlecht',
      category: 'Personaldaten',
      required: false,
      type: 'enum',
      aliases: ['geschlecht', 'gender', 'sex'],
      enumOptions: [
        { value: '3', label: 'männlich',     aliases: ['m', 'männlich', 'maennlich', 'male', '3'] },
        { value: '4', label: 'weiblich',     aliases: ['w', 'weiblich', 'female', 'f', '4'] },
        { value: '5', label: 'divers',       aliases: ['d', 'divers', 'diverse', '5'] },
        { value: '6', label: 'ohne Angabe',  aliases: ['x', 'ohne', 'ohne angabe', 'unbekannt', '6'] },
      ],
    },
    {
      key: 'geburtsdatum',
      label: 'Geburtsdatum',
      category: 'Personaldaten',
      required: false,
      type: 'date',
      aliases: ['geburtsdatum', 'geburtstag', 'birthdate', 'birthday', 'date of birth', 'geb.datum', 'geb'],
      validate: dateValidate,
    },
    {
      key: 'staatsangehoerigkeitID',
      label: 'Staatsangehörigkeit',
      category: 'Personaldaten',
      required: false,
      type: 'string',
      aliases: [
        'staatsangehoerigkeit', 'staatsangehörigkeit', 'nationalität', 'nationality', 'nation',
        '1. staatsang.', '1 staatsang', '1. staatsangehörigkeit', 'staatsang',
      ],
      hint: 'Numerischer Schlüssel (z.B. 000) oder ISO-3-Kürzel (z.B. DEU)',
    },
    {
      key: 'religionID',
      label: 'Religionszugehörigkeit',
      category: 'Personaldaten',
      required: false,
      type: 'string',
      aliases: ['religion', 'religionszugehörigkeit', 'konfession', 'religionsunterricht'],
    },
    // ── Herkunft / Migration ─────────────────────────────────────────────────
    {
      key: 'zuzugsjahr',
      label: 'Zuzugsjahr',
      category: 'Herkunft / Migration',
      required: false,
      type: 'string',
      aliases: ['zuzugsjahr', 'einwanderungsjahr', 'zuzug'],
    },
    {
      key: 'geburtsland',
      label: 'Geburtsland',
      category: 'Herkunft / Migration',
      required: false,
      type: 'string',
      aliases: ['geburtsland', 'birthcountry', 'geburtsland schüler'],
      hint: 'Numerischer Schlüssel (z.B. 000) oder ISO-3-Kürzel (z.B. DEU)',
    },
    {
      key: 'geburtslandVater',
      label: 'Geburtsland Vater',
      category: 'Herkunft / Migration',
      required: false,
      type: 'string',
      aliases: ['geburtslandvater', 'geburtsland vater'],
      hint: 'Numerischer Schlüssel (z.B. 000) oder ISO-3-Kürzel (z.B. DEU)',
    },
    {
      key: 'geburtslandMutter',
      label: 'Geburtsland Mutter',
      category: 'Herkunft / Migration',
      required: false,
      type: 'string',
      aliases: ['geburtslandmutter', 'geburtsland mutter'],
      hint: 'Numerischer Schlüssel (z.B. 000) oder ISO-3-Kürzel (z.B. DEU)',
    },
    {
      key: 'verkehrspracheFamilie',
      label: 'Verkehrssprache Familie',
      category: 'Herkunft / Migration',
      required: false,
      type: 'string',
      aliases: ['verkehrssprache', 'familiensprache', 'muttersprache', 'verkehrssprachefamilie', 'verkehrssprache familie'],
    },
    {
      key: 'hatMigrationshintergrund',
      label: 'Migrationshintergrund',
      category: 'Herkunft / Migration',
      required: false,
      type: 'string',
      aliases: ['migrationshintergrund', 'hatmigrationshintergrund'],
      hint: 'Wird automatisch true wenn Herkunftsfelder gesetzt sind',
    },
    // ── Adresse ──────────────────────────────────────────────────────────────
    {
      key: 'strassenname',
      label: 'Straße',
      category: 'Adresse',
      required: false,
      type: 'string',
      aliases: ['strasse', 'straße', 'strassenname', 'street', 'adresse', 'wohnstraße', 'strae'],
    },
    {
      key: 'hausnummer',
      label: 'Hausnummer',
      category: 'Adresse',
      required: false,
      type: 'string',
      aliases: ['hausnummer', 'hnr', 'house number', 'nr', 'hausnr'],
    },
    {
      key: 'plz',
      label: 'Postleitzahl',
      category: 'Adresse',
      required: false,
      type: 'string',
      aliases: ['plz', 'postleitzahl', 'postal code', 'zip', 'zip code'],
    },
    {
      key: 'ort',
      label: 'Wohnort',
      category: 'Adresse',
      required: false,
      type: 'string',
      aliases: ['ort', 'wohnort', 'stadt', 'city', 'place'],
    },
    {
      key: 'ortsteil',
      label: 'Ortsteil',
      category: 'Adresse',
      required: false,
      type: 'string',
      aliases: ['ortsteil', 'stadtteil', 'district'],
    },
    // ── Kontakt ───────────────────────────────────────────────────────────────
    {
      key: 'telefon',
      label: 'Telefon',
      category: 'Kontakt',
      required: false,
      type: 'string',
      aliases: ['telefon', 'tel', 'phone', 'telefonnummer', 'festnetz'],
    },
    {
      key: 'email',
      label: 'E-Mail',
      category: 'Kontakt',
      required: false,
      type: 'string',
      aliases: ['email', 'e-mail', 'mail', 'emailadresse'],
      validate: v => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ? null : 'Ungültige E-Mail-Adresse',
    },
    // ── Schulbezogen ──────────────────────────────────────────────────────────
    {
      key: 'status',
      label: 'Status',
      category: 'Schulbezogen',
      required: false,
      type: 'enum',
      aliases: ['status', 'schuelerstatus', 'aktiv'],
      hint: 'Standard: aktiv',
      enumOptions: [
        { value: '2', label: 'aktiv',      aliases: ['aktiv', '2', 'active'] },
        { value: '6', label: 'beurlaubt',  aliases: ['beurlaubt', '6', 'auszeit'] },
        { value: '8', label: 'extern',     aliases: ['extern', '8', 'external'] },
      ],
    },
    {
      key: 'anmeldedatum',
      label: 'Anmeldedatum',
      category: 'Schulbezogen',
      required: false,
      type: 'date',
      aliases: ['anmeldedatum', 'anmeldung', 'registration date', 'angemeldet'],
      validate: dateValidate,
    },
    {
      key: 'aufnahmedatum',
      label: 'Aufnahmedatum',
      category: 'Schulbezogen',
      required: false,
      type: 'date',
      aliases: ['aufnahmedatum', 'aufnahme', 'einschulung', 'enrollment date', 'start date', 'schulbeginn'],
      validate: dateValidate,
    },
    {
      key: 'beginnBildungsgang',
      label: 'Beginn Bildungsgang',
      category: 'Schulbezogen',
      required: false,
      type: 'date',
      aliases: ['beginnbildungsgang', 'beginn bildungsgang', 'bildungsgangbeginn'],
      validate: dateValidate,
    },
    {
      key: 'klasse',
      label: 'Klasse',
      category: 'Schulbezogen',
      required: false,
      type: 'string',
      aliases: ['klasse', 'klasse/kurs', 'klassenbezeichnung', 'class', 'group', 'lerngruppe'],
    },
    {
      key: 'jahrgang',
      label: 'Jahrgang',
      category: 'Schulbezogen',
      required: false,
      type: 'string',
      aliases: ['jahrgang', 'jahrgangsstufe', 'stufe', 'grade', 'year', 'jg', 'jgst'],
    },
    {
      key: 'schulgliederung',
      label: 'Schulgliederung / Bildungsgang',
      category: 'Schulbezogen',
      required: false,
      type: 'string',
      aliases: ['schulgliederung', 'bildungsgang', 'gliederung', 'track', 'schulform'],
      hint: 'z.B. GY8, GY9; bei Berufskolleg: HBF, BF, BGJ, …',
    },
  ],

  toApiPayload(row: MappedRow, context: ImportContext): SchuelerNeu {
    const str = (key: string) => String(row[key] ?? '').trim()

    const geschlechtMap: Record<string, Geschlecht> = {
      '3': 3, 'm': 3, 'männlich': 3, 'maennlich': 3, 'male': 3,
      '4': 4, 'w': 4, 'weiblich': 4, 'female': 4,
      '5': 5, 'd': 5, 'divers': 5,
      '6': 6, 'x': 6, 'ohne': 6,
    }
    const statusMap: Record<string, SchuelerStatus> = {
      '2': 2, 'aktiv': 2, '6': 6, 'beurlaubt': 6, '8': 8, 'extern': 8,
    }

    const rawGeschlecht = str('geschlecht').toLowerCase()
    const rawStatus = str('status').toLowerCase()

    return {
      nachname: str('nachname'),
      vorname: str('vorname'),
      alleVornamen: str('alleVornamen') || str('vorname'),
      geschlecht: geschlechtMap[rawGeschlecht] ?? null,
      geburtsdatum: normalisiereDatum(str('geburtsdatum')) || null,
      status: statusMap[rawStatus] ?? 2,
      anmeldedatum: normalisiereDatum(str('anmeldedatum')) || null,
      aufnahmedatum: normalisiereDatum(str('aufnahmedatum')) || null,
      beginnBildungsgang: normalisiereDatum(str('beginnBildungsgang')) || null,
      dauerBildungsgang: null,
      staatsangehoerigkeitID: resolveNationalitaet(context.kataloge?.nationalitaeten, str('staatsangehoerigkeitID')) || null,
      idReligion: null,
      idSchuljahresabschnitt: context.idSchuljahresabschnitt ?? null,
      idJahrgang: null,
      idKlasse: null,
      idGrundschuleEinschulungsart: null,
    }
  },
}
