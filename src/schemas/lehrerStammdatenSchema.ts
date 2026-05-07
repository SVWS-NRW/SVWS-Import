import type { ImportModule, MappedRow } from '@/models/ImportSchema'
import type { LehrerStammdaten, PersonalTyp } from '@/models/Lehrer'
import { normalisiereDatum } from '@/utils/csvParser'

const dateValidate = (v: string): string | null => {
  if (!v) return null
  const n = normalisiereDatum(v)
  return /^\d{4}-\d{2}-\d{2}$/.test(n) ? null : 'Ungültiges Datumsformat (erwartet: TT.MM.JJJJ oder JJJJ-MM-TT)'
}

export const lehrerStammdatenSchema: ImportModule = {
  id: 'lehrer-stammdaten',
  entityType: 'lehrer',
  moduleType: 'stammdaten',
  label: 'Lehrer Stammdaten',
  description: 'Grunddaten: Kürzel, Name, Personaldaten, Beschäftigung, Kontakt',
  icon: 'pi pi-id-card',

  fields: [
    // ── Pflichtfelder ────────────────────────────────────────────────────────
    {
      key: 'kuerzel',
      label: 'Kürzel',
      category: 'Identifikation',
      required: true,
      type: 'string',
      aliases: ['kuerzel', 'kürzel', 'abbreviation', 'kurzzeichen', 'lehrer-kürzel', 'internkrz', 'intern kürzel', 'kz'],
      validate: v => v.trim() ? null : 'Kürzel ist Pflichtfeld',
    },
    {
      key: 'nachname',
      label: 'Nachname',
      category: 'Personaldaten',
      required: true,
      type: 'string',
      aliases: ['nachname', 'name', 'familienname', 'last name', 'lastname', 'surname'],
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
      key: 'anrede',
      label: 'Anrede',
      category: 'Personaldaten',
      required: false,
      type: 'string',
      aliases: ['anrede', 'salutation', 'titel/anrede'],
    },
    {
      key: 'titel',
      label: 'Titel',
      category: 'Personaldaten',
      required: false,
      type: 'string',
      aliases: ['titel', 'title', 'akademischer titel', 'dr', 'prof'],
    },
    {
      key: 'amtsbezeichnung',
      label: 'Amtsbezeichnung',
      category: 'Personaldaten',
      required: false,
      type: 'string',
      aliases: ['amtsbezeichnung', 'amt', 'funktion', 'dienstbezeichnung'],
    },
    {
      key: 'geschlecht',
      label: 'Geschlecht',
      category: 'Personaldaten',
      required: false,
      type: 'enum',
      aliases: ['geschlecht', 'gender', 'sex'],
      enumOptions: [
        { value: '3', label: 'männlich',    aliases: ['m', 'männlich', 'maennlich', 'male', '3'] },
        { value: '4', label: 'weiblich',    aliases: ['w', 'weiblich', 'female', 'f', '4'] },
        { value: '5', label: 'divers',      aliases: ['d', 'divers', '5'] },
        { value: '6', label: 'ohne Angabe', aliases: ['x', 'ohne', 'ohne angabe', '6'] },
      ],
    },
    {
      key: 'geburtsdatum',
      label: 'Geburtsdatum',
      category: 'Personaldaten',
      required: false,
      type: 'date',
      aliases: ['geburtsdatum', 'geburtstag', 'birthdate', 'birthday', 'date of birth', 'geb'],
      validate: dateValidate,
    },
    {
      key: 'staatsangehoerigkeitID',
      label: 'Staatsangehörigkeit',
      category: 'Personaldaten',
      required: false,
      type: 'string',
      aliases: ['staatsangehoerigkeit', 'staatsangehörigkeit', 'nationalität', 'nationality'],
    },
    // ── Beschäftigung ─────────────────────────────────────────────────────────
    {
      key: 'personalTyp',
      label: 'Personaltyp',
      category: 'Beschäftigung',
      required: false,
      type: 'enum',
      aliases: ['personaltyp', 'typ', 'type', 'personal typ', 'rolle', 'beschaeftigungsgruppe'],
      hint: 'Standard: LEHRKRAFT',
      enumOptions: [
        { value: 'LEHRKRAFT',         label: 'Lehrkraft',         aliases: ['lehrkraft', 'lehrer', 'teacher', 'LEHRKRAFT'] },
        { value: 'VERWALTUNG_TECHNIK', label: 'Verwaltung/Technik', aliases: ['verwaltung', 'technik', 'VERWALTUNG_TECHNIK', 'administration'] },
        { value: 'SONSTIGER',         label: 'Sonstiger',         aliases: ['sonstiger', 'sonstig', 'other', 'SONSTIGER'] },
      ],
    },
    {
      key: 'rechtsverhältnis',
      label: 'Rechtsverhältnis',
      category: 'Beschäftigung',
      required: false,
      type: 'string',
      aliases: ['rechtsverhältnis', 'rechtsverhaltnis', 'rechtsverhaeltnis', 'legal status', 'vertragsstatus'],
      hint: 'z.B. Beamter, Angestellter',
    },
    {
      key: 'beschaeftigungsart',
      label: 'Beschäftigungsart',
      category: 'Beschäftigung',
      required: false,
      type: 'string',
      aliases: ['beschaeftigungsart', 'beschäftigungsart', 'employment type', 'vertrag', 'anstellungsart'],
    },
    {
      key: 'pflichtstunden',
      label: 'Pflichtstunden (Soll)',
      category: 'Beschäftigung',
      required: false,
      type: 'number',
      aliases: ['pflichtstunden', 'sollstunden', 'stunden', 'hours', 'wochenstunden', 'unterrichtsstunden'],
    },
    // ── Adresse ───────────────────────────────────────────────────────────────
    {
      key: 'strassenname',
      label: 'Straße',
      category: 'Adresse',
      required: false,
      type: 'string',
      aliases: ['strasse', 'straße', 'strassenname', 'street', 'adresse'],
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
      key: 'hausnummerZusatz',
      label: 'Hausnummernzusatz',
      category: 'Adresse',
      required: false,
      type: 'string',
      aliases: ['hausnummerzusatz', 'zusatz', 'address supplement'],
    },
    {
      key: 'plz',
      label: 'Postleitzahl',
      category: 'Adresse',
      required: false,
      type: 'string',
      aliases: ['plz', 'postleitzahl', 'postal code', 'zip'],
    },
    {
      key: 'ort',
      label: 'Wohnort',
      category: 'Adresse',
      required: false,
      type: 'string',
      aliases: ['ort', 'wohnort', 'stadt', 'city'],
    },
    // ── Kontakt ───────────────────────────────────────────────────────────────
    {
      key: 'telefon',
      label: 'Telefon (Festnetz)',
      category: 'Kontakt',
      required: false,
      type: 'string',
      aliases: ['telefon', 'tel', 'phone', 'festnetz', 'telefonnummer'],
    },
    {
      key: 'telefonMobil',
      label: 'Telefon (Mobil)',
      category: 'Kontakt',
      required: false,
      type: 'string',
      aliases: ['mobil', 'mobile', 'handy', 'mobiltelefon', 'cell phone', 'telefon mobil', 'mobilnummer'],
    },
    {
      key: 'emailPrivat',
      label: 'E-Mail (privat)',
      category: 'Kontakt',
      required: false,
      type: 'string',
      aliases: ['emailprivat', 'e-mail privat', 'private email', 'email privat', 'privatmail'],
      validate: v => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ? null : 'Ungültige E-Mail-Adresse',
    },
    {
      key: 'emailDienstlich',
      label: 'E-Mail (dienstlich)',
      category: 'Kontakt',
      required: false,
      type: 'string',
      aliases: ['emaildienstlich', 'email', 'e-mail', 'mail', 'schulemail', 'dienstliche email', 'work email', 'dienstemail'],
      validate: v => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ? null : 'Ungültige E-Mail-Adresse',
    },
  ],

  toApiPayload(row: MappedRow): LehrerStammdaten {
    const str = (key: string) => String(row[key] ?? '').trim()

    const geschlechtMap: Record<string, number> = {
      '3': 3, 'm': 3, 'männlich': 3, 'maennlich': 3, 'male': 3,
      '4': 4, 'w': 4, 'weiblich': 4, 'female': 4,
      '5': 5, 'd': 5, 'divers': 5,
      '6': 6, 'x': 6, 'ohne': 6,
    }
    const personalTypMap: Record<string, PersonalTyp> = {
      'lehrkraft': 'LEHRKRAFT', 'lehrer': 'LEHRKRAFT', 'LEHRKRAFT': 'LEHRKRAFT',
      'verwaltung': 'VERWALTUNG_TECHNIK', 'technik': 'VERWALTUNG_TECHNIK', 'VERWALTUNG_TECHNIK': 'VERWALTUNG_TECHNIK',
      'sonstiger': 'SONSTIGER', 'sonstig': 'SONSTIGER', 'SONSTIGER': 'SONSTIGER',
    }

    const rawGeschlecht = str('geschlecht').toLowerCase()
    const rawTyp = str('personalTyp')

    return {
      kuerzel: str('kuerzel'),
      personalTyp: personalTypMap[rawTyp] ?? personalTypMap[rawTyp.toLowerCase()] ?? 'LEHRKRAFT',
      anrede: str('anrede') || null,
      titel: str('titel') || null,
      amtsbezeichnung: str('amtsbezeichnung') || null,
      nachname: str('nachname'),
      vorname: str('vorname'),
      geschlecht: geschlechtMap[rawGeschlecht] ?? null,
      geburtsdatum: normalisiereDatum(str('geburtsdatum')) || null,
      staatsangehoerigkeitID: str('staatsangehoerigkeitID') || null,
      strassenname: str('strassenname') || null,
      hausnummer: str('hausnummer') || null,
      hausnummerZusatz: str('hausnummerZusatz') || null,
      wohnortID: null,
      ortsteilID: null,
      telefon: str('telefon') || null,
      telefonMobil: str('telefonMobil') || null,
      emailPrivat: str('emailPrivat') || null,
      emailDienstlich: str('emailDienstlich') || null,
      foto: null,
      istSichtbar: true,
      istRelevantFuerStatistik: true,
      leitungsfunktionen: [],
    }
  },
}
