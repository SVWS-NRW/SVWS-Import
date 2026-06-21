<template>
  <div class="help-view">
    <div class="help-header">
      <Button
        icon="pi pi-arrow-left"
        label="Zurück"
        severity="secondary"
        text
        @click="router.back()"
      />
      <h2>Hilfe – Dateiformate &amp; Import</h2>
      <p class="subtitle">Übersicht aller unterstützten CSV/XLSX-Formate und Import-Typen</p>
    </div>

    <nav class="toc-nav">
      <button @click="scrollTo('wege')">Importwege</button>
      <button @click="scrollTo('hinweise')">Allgemeine Hinweise</button>
      <button @click="scrollTo('schueler')">Schüler Stammdaten</button>
      <button @click="scrollTo('schulbesuch')">Schulbesuch</button>
      <button @click="scrollTo('lehrer')">Lehrkräfte</button>
      <button @click="scrollTo('klassen')">Klassen</button>
      <button @click="scrollTo('faecher')">Fächer</button>
      <button @click="scrollTo('jahrgaenge')">Jahrgänge</button>
      <button @click="scrollTo('betriebe')">Betriebe</button>
      <button @click="scrollTo('unterricht')">Unterricht</button>
      <button @click="scrollTo('floskeln')">Floskeln</button>
      <button @click="scrollTo('ankreuz')">Ankreuzkompetenzen</button>
      <button @click="scrollTo('ortsteile')">Ortsteile</button>
    </nav>

    <!-- ── Importwege ─────────────────────────────────────────────────────── -->
    <div id="wege" class="format-section">
      <h3><i class="pi pi-directions section-icon" /> Zwei Importwege</h3>
      <p class="section-desc">Die Anwendung bietet zwei gleichwertige Wege. Beide werden aktiv weiterentwickelt.</p>
      <div class="path-grid">
        <div class="path-card">
          <div class="path-header">
            <i class="pi pi-sparkles path-icon" />
            <strong>Import-Assistent (Wizard)</strong>
          </div>
          <p>Geführter 5-Schritte-Ablauf mit automatischer Spaltenerkennung. Ideal für den Einstieg oder unbekannte Dateistrukturen. Spaltenbezeichnungen müssen nicht exakt stimmen — das System erkennt viele Alternativen automatisch.</p>
          <p class="path-supports"><i class="pi pi-check" /> Schüler Stammdaten · Lehrkräfte Stammdaten</p>
          <p class="path-route"><code>/#/wizard</code></p>
        </div>
        <div class="path-card">
          <div class="path-header">
            <i class="pi pi-list path-icon" />
            <strong>Direktimport</strong>
          </div>
          <p>Entitätsspezifische Ansichten für alle Import-Typen. Für erfahrene Nutzer mit bekannten Datenstrukturen. Bietet Zugriff auf spezialisierte Funktionen, die der Assistent noch nicht abdeckt.</p>
          <p class="path-supports"><i class="pi pi-check" /> Alle Import-Typen dieser Hilfe</p>
          <p class="path-route"><code>/#/import</code></p>
        </div>
      </div>
    </div>

    <!-- ── Allgemeine Hinweise ────────────────────────────────────────────── -->
    <div id="hinweise" class="format-section notes-section">
      <h3><i class="pi pi-info-circle section-icon" /> Allgemeine Hinweise</h3>
      <div class="notes-grid">
        <div class="note-card">
          <strong>Dateiformat</strong>
          <p>Unterstützt werden <code>.csv</code>, <code>.xlsx</code> und <code>.xls</code>. Die erste Zeile muss die Spaltenüberschriften enthalten.</p>
        </div>
        <div class="note-card">
          <strong>Trennzeichen (CSV)</strong>
          <p>Semikolon <code>;</code> oder Komma <code>,</code>. Semikolon wird empfohlen, da es besser mit deutschen Sonderzeichen harmoniert.</p>
        </div>
        <div class="note-card">
          <strong>Spaltennamen</strong>
          <p>Groß-/Kleinschreibung wird ignoriert. Viele Spalten werden unter alternativen Bezeichnungen erkannt. Leerzeichen am Rand werden automatisch entfernt.</p>
        </div>
        <div class="note-card">
          <strong>Zeichenkodierung</strong>
          <p>UTF-8 wird empfohlen. UTF-8 with BOM (wie von Excel erzeugt) wird ebenfalls akzeptiert.</p>
        </div>
        <div class="note-card">
          <strong>Datumsformat</strong>
          <p><code>TT.MM.JJJJ</code> (z.&nbsp;B. <code>15.03.2005</code>) und <code>JJJJ-MM-TT</code> (z.&nbsp;B. <code>2005-03-15</code>) werden gleichwertig akzeptiert.</p>
        </div>
        <div class="note-card">
          <strong>Geschlecht-Kodierung</strong>
          <p>
            Kurzform: <code>m</code>, <code>w</code>, <code>d</code>, <code>x</code><br>
            Langform: <code>männlich</code>, <code>weiblich</code>, <code>divers</code>, <code>ohne Angabe</code><br>
            Numerisch: <code>3</code>, <code>4</code>, <code>5</code>, <code>6</code>
          </p>
        </div>
        <div class="note-card">
          <strong>Boolesche Werte</strong>
          <p><code>true</code> / <code>false</code> oder <code>ja</code> / <code>nein</code> werden gleichwertig akzeptiert.</p>
        </div>
        <div class="note-card">
          <strong>Maximale Dateigröße</strong>
          <p>Die Datei darf maximal <strong>10 MB</strong> groß sein. Bei größeren Datenmengen bitte aufteilen.</p>
        </div>
      </div>
    </div>

    <!-- ── Schüler Stammdaten ─────────────────────────────────────────────── -->
    <div id="schueler" class="format-section">
      <h3>
        <i class="pi pi-users section-icon" /> Schüler Stammdaten
        <span class="path-badge wizard">Wizard</span>
        <span class="path-badge direct">Direktimport</span>
      </h3>
      <p class="section-desc">
        Pflichtfelder sind mit <span class="required-badge">Pflicht</span> gekennzeichnet.
        Beispieldatei: <code>schueler-stammdaten.csv</code>
      </p>
      <table class="field-table">
        <thead>
          <tr>
            <th>Spaltenname</th>
            <th>Kategorie</th>
            <th>Typ</th>
            <th>Hinweis / Erlaubte Werte</th>
          </tr>
        </thead>
        <tbody>
          <tr class="cat-row"><td colspan="4">Personaldaten</td></tr>
          <tr>
            <td><code>Nachname</code> <span class="required-badge">Pflicht</span></td>
            <td>Personaldaten</td><td>Text</td>
            <td>Alias: <code>Name</code>, <code>Familienname</code></td>
          </tr>
          <tr>
            <td><code>Vorname</code> <span class="required-badge">Pflicht</span></td>
            <td>Personaldaten</td><td>Text</td>
            <td>Alias: <code>Rufname</code>, <code>Firstname</code></td>
          </tr>
          <tr>
            <td><code>AlleVornamen</code></td>
            <td>Personaldaten</td><td>Text</td>
            <td>Alias: <code>Alle Vornamen</code>, <code>Vornamen</code></td>
          </tr>
          <tr>
            <td><code>Geburtsname</code></td>
            <td>Personaldaten</td><td>Text</td>
            <td>Alias: <code>Mädchenname</code>, <code>Geburtsname / Mädchenname</code></td>
          </tr>
          <tr>
            <td><code>Geburtsort</code></td>
            <td>Personaldaten</td><td>Text</td>
            <td></td>
          </tr>
          <tr>
            <td><code>Geschlecht</code></td>
            <td>Personaldaten</td><td>Auswahl</td>
            <td><code>m</code> / <code>männlich</code> · <code>w</code> / <code>weiblich</code> · <code>d</code> / <code>divers</code> · <code>x</code> / <code>ohne Angabe</code></td>
          </tr>
          <tr>
            <td><code>Geburtsdatum</code></td>
            <td>Personaldaten</td><td>Datum</td>
            <td><code>TT.MM.JJJJ</code> oder <code>JJJJ-MM-TT</code></td>
          </tr>
          <tr>
            <td><code>Staatsangehörigkeit</code></td>
            <td>Personaldaten</td><td>Text</td>
            <td>Numerischer Schlüssel (z.&nbsp;B. <code>000</code>) oder ISO-3 (z.&nbsp;B. <code>DEU</code>). Alias: <code>1. Staatsang.</code></td>
          </tr>
          <tr>
            <td><code>Konfession</code></td>
            <td>Personaldaten</td><td>Text</td>
            <td>Religionsbezeichnung im Klartext (z.&nbsp;B. <code>römisch-katholisch</code>, <code>islamisch</code>). Alias: <code>Religionszugehörigkeit</code></td>
          </tr>
          <tr>
            <td><code>KonfessionKuerzel</code></td>
            <td>Personaldaten</td><td>Text</td>
            <td>Amtliches Kürzel (z.&nbsp;B. <code>KR</code>, <code>ER</code>, <code>IS</code>). Wird gegenüber dem Klartextfeld bevorzugt. Alias: <code>konfessionskuerzel</code>, <code>Statistikkrz Konfession</code></td>
          </tr>
          <tr class="cat-row"><td colspan="4">Herkunft / Migration</td></tr>
          <tr>
            <td><code>Geburtsland</code></td>
            <td>Herkunft / Migration</td><td>Text</td>
            <td>Numerischer Schlüssel oder ISO-3 (z.&nbsp;B. <code>TUR</code>, <code>POL</code>)</td>
          </tr>
          <tr>
            <td><code>Geburtsland Vater</code></td>
            <td>Herkunft / Migration</td><td>Text</td>
            <td>Numerischer Schlüssel oder ISO-3. Alias: <code>GeburtslandVater</code></td>
          </tr>
          <tr>
            <td><code>Geburtsland Mutter</code></td>
            <td>Herkunft / Migration</td><td>Text</td>
            <td>Numerischer Schlüssel oder ISO-3. Alias: <code>GeburtslandMutter</code></td>
          </tr>
          <tr>
            <td><code>Verkehrssprache Familie</code></td>
            <td>Herkunft / Migration</td><td>Text</td>
            <td>z.&nbsp;B. <code>Türkisch</code>, <code>Arabisch</code>. Alias: <code>Familiensprache</code>, <code>Muttersprache</code></td>
          </tr>
          <tr>
            <td><code>Zuzugsjahr</code></td>
            <td>Herkunft / Migration</td><td>Text/Zahl</td>
            <td>Vierstellige Jahreszahl, z.&nbsp;B. <code>2015</code></td>
          </tr>
          <tr class="cat-row"><td colspan="4">Adresse</td></tr>
          <tr>
            <td><code>Straße</code></td>
            <td>Adresse</td><td>Text</td>
            <td>Alias: <code>Strasse</code>, <code>Strassenname</code>, <code>Adresse</code></td>
          </tr>
          <tr>
            <td><code>Hausnummer</code></td>
            <td>Adresse</td><td>Text</td>
            <td>Alias: <code>Hnr</code>, <code>Nr</code></td>
          </tr>
          <tr>
            <td><code>PLZ</code></td>
            <td>Adresse</td><td>Text</td>
            <td>Alias: <code>Postleitzahl</code></td>
          </tr>
          <tr>
            <td><code>Ort</code></td>
            <td>Adresse</td><td>Text</td>
            <td>Alias: <code>Wohnort</code>, <code>Stadt</code></td>
          </tr>
          <tr>
            <td><code>Ortsteil</code></td>
            <td>Adresse</td><td>Text</td>
            <td>Alias: <code>Stadtteil</code></td>
          </tr>
          <tr class="cat-row"><td colspan="4">Kontakt</td></tr>
          <tr>
            <td><code>Telefon</code></td>
            <td>Kontakt</td><td>Text</td>
            <td>Alias: <code>Festnetz</code>, <code>Tel</code></td>
          </tr>
          <tr>
            <td><code>Mobil</code></td>
            <td>Kontakt</td><td>Text</td>
            <td>Alias: <code>Mobiltelefon</code>, <code>Handy</code></td>
          </tr>
          <tr>
            <td><code>E-Mail</code></td>
            <td>Kontakt</td><td>E-Mail</td>
            <td>Private E-Mail-Adresse. Alias: <code>Email</code>, <code>Emailadresse</code></td>
          </tr>
          <tr>
            <td><code>E-Mail Schule</code></td>
            <td>Kontakt</td><td>E-Mail</td>
            <td>Schulische E-Mail-Adresse. Alias: <code>EmailSchule</code></td>
          </tr>
          <tr class="cat-row"><td colspan="4">Schulbezogen</td></tr>
          <tr>
            <td><code>Status</code></td>
            <td>Schulbezogen</td><td>Auswahl</td>
            <td>
              <code>aktiv</code> (Standard) · <code>aufnahme</code> · <code>warteliste</code> ·
              <code>beurlaubt</code> · <code>extern</code> · <code>abschluss</code> ·
              <code>abgang</code> · <code>ehemalige</code>
            </td>
          </tr>
          <tr>
            <td><code>Anmeldedatum</code></td>
            <td>Schulbezogen</td><td>Datum</td>
            <td><code>TT.MM.JJJJ</code> oder <code>JJJJ-MM-TT</code></td>
          </tr>
          <tr>
            <td><code>Aufnahmedatum</code></td>
            <td>Schulbezogen</td><td>Datum</td>
            <td>Alias: <code>Einschulung</code>, <code>Schulbeginn</code></td>
          </tr>
          <tr>
            <td><code>BeginnBildungsgang</code></td>
            <td>Schulbezogen</td><td>Datum</td>
            <td>Alias: <code>Beginn Bildungsgang</code></td>
          </tr>
          <tr>
            <td><code>Klasse</code></td>
            <td>Schulbezogen</td><td>Text</td>
            <td>Alias: <code>Klasse/Kurs</code>, <code>Lerngruppe</code></td>
          </tr>
          <tr>
            <td><code>Jahrgang</code></td>
            <td>Schulbezogen</td><td>Text</td>
            <td>Alias: <code>Jahrgangsstufe</code>, <code>Stufe</code>, <code>Jg</code></td>
          </tr>
          <tr>
            <td><code>Schulgliederung</code></td>
            <td>Schulbezogen</td><td>Text</td>
            <td>z.&nbsp;B. <code>GY8</code>, <code>GY9</code>; bei BK: <code>HBF</code>, <code>BF</code>, <code>BGJ</code>. Alias: <code>Bildungsgang</code></td>
          </tr>
          <tr>
            <td><code>Beruf</code></td>
            <td>Schulbezogen</td><td>Text</td>
            <td>Ausbildungsberuf</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Schüler Schulbesuch ────────────────────────────────────────────── -->
    <div id="schulbesuch" class="format-section">
      <h3>
        <i class="pi pi-history section-icon" /> Schüler Schulbesuch
        <span class="path-badge direct">Direktimport</span>
      </h3>
      <p class="section-desc">
        Daten zum Bildungsweg: vorherige Schule, Entlassung, Kindergarten, Grundschule.
        Schüler werden anhand von <code>Nachname</code>, <code>Vorname</code> und <code>Geburtsdatum</code> zugeordnet.
        Beispieldateien: <code>schueler-schulbesuch.csv</code>, <code>Kindergarten-neu.csv</code>
      </p>
      <table class="field-table">
        <thead>
          <tr>
            <th>Spaltenname</th>
            <th>Kategorie</th>
            <th>Typ</th>
            <th>Hinweis</th>
          </tr>
        </thead>
        <tbody>
          <tr class="cat-row"><td colspan="4">Schüler-Identifikation</td></tr>
          <tr><td><code>Nachname</code> <span class="required-badge">Pflicht</span></td><td>Identifikation</td><td>Text</td><td>Zum Abgleich mit vorhandenem Schüler</td></tr>
          <tr><td><code>Vorname</code> <span class="required-badge">Pflicht</span></td><td>Identifikation</td><td>Text</td><td></td></tr>
          <tr><td><code>Geburtsdatum</code> <span class="required-badge">Pflicht</span></td><td>Identifikation</td><td>Datum</td><td><code>TT.MM.JJJJ</code> oder <code>JJJJ-MM-TT</code></td></tr>
          <tr class="cat-row"><td colspan="4">Vorherige Schule</td></tr>
          <tr><td><code>vorherigeSchule</code></td><td>Vorherige Schule</td><td>Text</td><td>Schulnummer (z.&nbsp;B. <code>999000</code>)</td></tr>
          <tr><td><code>vorigeAllgHerkunft</code></td><td>Vorherige Schule</td><td>Text</td><td>Allgemeine Herkunftsbezeichnung</td></tr>
          <tr><td><code>vorigeEntlassdatum</code></td><td>Vorherige Schule</td><td>Datum</td><td></td></tr>
          <tr><td><code>vorigeEntlassjahrgang</code></td><td>Vorherige Schule</td><td>Text</td><td>z.&nbsp;B. <code>04</code>, <code>10</code></td></tr>
          <tr><td><code>vorigeArtLetzteVersetzung</code></td><td>Vorherige Schule</td><td>Text</td><td></td></tr>
          <tr><td><code>vorigeEntlassgrund</code></td><td>Vorherige Schule</td><td>Text</td><td>Schlüsselwert (z.&nbsp;B. <code>1</code>, <code>2</code>)</td></tr>
          <tr><td><code>vorigeBemerkung</code></td><td>Vorherige Schule</td><td>Text</td><td></td></tr>
          <tr><td><code>vorigeAbschlussartAllgemeinbildend</code></td><td>Vorherige Schule</td><td>Text</td><td>z.&nbsp;B. <code>A</code>, <code>B</code></td></tr>
          <tr><td><code>vorigeAbschlussartBerufsbildend</code></td><td>Vorherige Schule</td><td>Text</td><td></td></tr>
          <tr class="cat-row"><td colspan="4">Entlassung (aktuelle Schule)</td></tr>
          <tr><td><code>entlassungDatum</code></td><td>Entlassung</td><td>Datum</td><td></td></tr>
          <tr><td><code>entlassjahrgang</code></td><td>Entlassung</td><td>Text</td><td></td></tr>
          <tr><td><code>entlassungGrund</code></td><td>Entlassung</td><td>Text</td><td>Schlüsselwert</td></tr>
          <tr><td><code>entlassungAbschlussart</code></td><td>Entlassung</td><td>Text</td><td></td></tr>
          <tr class="cat-row"><td colspan="4">Aufnehmende Schule</td></tr>
          <tr><td><code>aufnehmendeSchule</code></td><td>Aufnehmende Schule</td><td>Text</td><td>Schulnummer</td></tr>
          <tr><td><code>aufnehmendWechseldatum</code></td><td>Aufnehmende Schule</td><td>Datum</td><td></td></tr>
          <tr><td><code>aufnehmendBestaetigt</code></td><td>Aufnehmende Schule</td><td>Boolean</td><td><code>true</code> / <code>false</code></td></tr>
          <tr class="cat-row"><td colspan="4">Grundschule</td></tr>
          <tr><td><code>grundschuleEinschulungsjahr</code></td><td>Grundschule</td><td>Zahl</td><td>Vierstellige Jahreszahl</td></tr>
          <tr><td><code>grundschuleEinschulungsart</code></td><td>Grundschule</td><td>Text</td><td>Schlüsselwert</td></tr>
          <tr><td><code>grundschuleJahreEingangsphase</code></td><td>Grundschule</td><td>Zahl</td><td>Anzahl Jahre in der Eingangsphase</td></tr>
          <tr><td><code>kuerzelGrundschuleUebergangsempfehlung</code></td><td>Grundschule</td><td>Text</td><td>z.&nbsp;B. <code>R</code>, <code>G</code>, <code>H</code></td></tr>
          <tr class="cat-row"><td colspan="4">Sek I / Sek II</td></tr>
          <tr><td><code>sekIWechsel</code></td><td>Bildungsweg</td><td>Zahl</td><td>Jahr des Wechsels in Sek I</td></tr>
          <tr><td><code>sekIErsteSchulform</code></td><td>Bildungsweg</td><td>Text</td><td>z.&nbsp;B. <code>GE</code>, <code>GY</code></td></tr>
          <tr><td><code>sekIIWechsel</code></td><td>Bildungsweg</td><td>Zahl</td><td>Jahr des Wechsels in Sek II</td></tr>
          <tr class="cat-row"><td colspan="4">Kindergarten / Kita</td></tr>
          <tr><td><code>dauerKindergartenbesuch</code></td><td>Kindergarten</td><td>Zahl</td><td>Dauer in Jahren</td></tr>
          <tr><td><code>kindergarten</code></td><td>Kindergarten</td><td>Text</td><td>Name der Einrichtung</td></tr>
          <tr><td><code>verpflichtungSprachfoerderkurs</code></td><td>Kindergarten</td><td>Boolean</td><td><code>true</code> / <code>false</code></td></tr>
          <tr><td><code>teilnahmeSprachfoerderkurs</code></td><td>Kindergarten</td><td>Boolean</td><td><code>true</code> / <code>false</code></td></tr>
          <tr class="cat-row"><td colspan="4">Abschluss</td></tr>
          <tr><td><code>schluesselHoechsterSchulabschluss</code></td><td>Abschluss</td><td>Text</td><td>z.&nbsp;B. <code>K</code>, <code>Z1</code></td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── Lehrkräfte ────────────────────────────────────────────────────── -->
    <div id="lehrer" class="format-section">
      <h3>
        <i class="pi pi-id-card section-icon" /> Lehrkräfte Stammdaten
        <span class="path-badge wizard">Wizard</span>
        <span class="path-badge direct">Direktimport</span>
      </h3>
      <p class="section-desc">
        Pflichtfelder sind mit <span class="required-badge">Pflicht</span> gekennzeichnet.
        Beispieldatei: <code>lehrkraefte.csv</code>
      </p>
      <table class="field-table">
        <thead>
          <tr>
            <th>Spaltenname</th>
            <th>Kategorie</th>
            <th>Typ</th>
            <th>Hinweis / Erlaubte Werte</th>
          </tr>
        </thead>
        <tbody>
          <tr class="cat-row"><td colspan="4">Identifikation</td></tr>
          <tr>
            <td><code>Kuerzel</code> <span class="required-badge">Pflicht</span></td>
            <td>Identifikation</td><td>Text</td>
            <td>Alias: <code>Kürzel</code>, <code>InternKrz</code>, <code>KZ</code></td>
          </tr>
          <tr class="cat-row"><td colspan="4">Personaldaten</td></tr>
          <tr>
            <td><code>Nachname</code> <span class="required-badge">Pflicht</span></td>
            <td>Personaldaten</td><td>Text</td>
            <td>Alias: <code>Name</code>, <code>Familienname</code></td>
          </tr>
          <tr>
            <td><code>Vorname</code> <span class="required-badge">Pflicht</span></td>
            <td>Personaldaten</td><td>Text</td>
            <td>Alias: <code>Rufname</code>, <code>Firstname</code></td>
          </tr>
          <tr>
            <td><code>Anrede</code></td>
            <td>Personaldaten</td><td>Text</td>
            <td>z.&nbsp;B. <code>Herr</code>, <code>Frau</code>. Alias: <code>Titel/Anrede</code></td>
          </tr>
          <tr>
            <td><code>Titel</code></td>
            <td>Personaldaten</td><td>Text</td>
            <td>z.&nbsp;B. <code>Dr.</code>, <code>Prof. Dr.</code></td>
          </tr>
          <tr>
            <td><code>Amtsbezeichnung</code></td>
            <td>Personaldaten</td><td>Text</td>
            <td>z.&nbsp;B. <code>STD</code>, <code>OSTD</code>. Alias: <code>Funktion</code>, <code>Dienstbezeichnung</code></td>
          </tr>
          <tr>
            <td><code>Geschlecht</code></td>
            <td>Personaldaten</td><td>Auswahl</td>
            <td><code>m</code> / <code>männlich</code> · <code>w</code> / <code>weiblich</code> · <code>d</code> / <code>divers</code> · <code>x</code> / <code>ohne Angabe</code></td>
          </tr>
          <tr>
            <td><code>Geburtsdatum</code></td>
            <td>Personaldaten</td><td>Datum</td>
            <td><code>TT.MM.JJJJ</code> oder <code>JJJJ-MM-TT</code></td>
          </tr>
          <tr>
            <td><code>Staatsangehörigkeit</code></td>
            <td>Personaldaten</td><td>Text</td>
            <td>Numerischer Schlüssel (z.&nbsp;B. <code>000</code>) oder ISO-3 (z.&nbsp;B. <code>DEU</code>). Alias: <code>Staatsangehoerigkeit</code></td>
          </tr>
          <tr class="cat-row"><td colspan="4">Beschäftigung</td></tr>
          <tr>
            <td><code>PersonalTyp</code></td>
            <td>Beschäftigung</td><td>Auswahl</td>
            <td>
              <code>LEHRKRAFT</code> (Standard) · <code>PERSONAL</code> (Verwaltung/Technik) · <code>SONSTIGE</code>
            </td>
          </tr>
          <tr>
            <td><code>Rechtsverhältnis</code></td>
            <td>Beschäftigung</td><td>Text</td>
            <td>z.&nbsp;B. <code>Beamter</code>, <code>Angestellter</code></td>
          </tr>
          <tr>
            <td><code>Beschaeftigungsart</code></td>
            <td>Beschäftigung</td><td>Text</td>
            <td>Alias: <code>Beschäftigungsart</code>, <code>Vertrag</code></td>
          </tr>
          <tr>
            <td><code>Pflichtstunden</code></td>
            <td>Beschäftigung</td><td>Zahl</td>
            <td>Alias: <code>Sollstunden</code>, <code>Wochenstunden</code></td>
          </tr>
          <tr>
            <td><code>istSichtbar</code></td>
            <td>Beschäftigung</td><td>Boolean</td>
            <td>Standard: <code>true</code></td>
          </tr>
          <tr>
            <td><code>istRelevantFuerStatistik</code></td>
            <td>Beschäftigung</td><td>Boolean</td>
            <td>Standard: <code>true</code></td>
          </tr>
          <tr class="cat-row"><td colspan="4">Adresse</td></tr>
          <tr>
            <td><code>Strassenname</code></td>
            <td>Adresse</td><td>Text</td>
            <td>Alias: <code>Straße</code>, <code>Strasse</code></td>
          </tr>
          <tr>
            <td><code>Hausnummer</code></td>
            <td>Adresse</td><td>Text</td>
            <td></td>
          </tr>
          <tr>
            <td><code>HausnummerZusatz</code></td>
            <td>Adresse</td><td>Text</td>
            <td>z.&nbsp;B. <code>a</code>, <code>b</code>. Alias: <code>Zusatz</code></td>
          </tr>
          <tr>
            <td><code>PLZ</code></td>
            <td>Adresse</td><td>Text</td>
            <td>Alias: <code>Postleitzahl</code></td>
          </tr>
          <tr>
            <td><code>Ort</code></td>
            <td>Adresse</td><td>Text</td>
            <td>Alias: <code>Wohnort</code>, <code>Stadt</code></td>
          </tr>
          <tr class="cat-row"><td colspan="4">Kontakt</td></tr>
          <tr>
            <td><code>Telefon</code></td>
            <td>Kontakt</td><td>Text</td>
            <td>Festnetz. Alias: <code>Festnetz</code>, <code>Tel</code></td>
          </tr>
          <tr>
            <td><code>TelefonMobil</code></td>
            <td>Kontakt</td><td>Text</td>
            <td>Alias: <code>Mobil</code>, <code>Handy</code>, <code>Mobiltelefon</code></td>
          </tr>
          <tr>
            <td><code>EmailPrivat</code></td>
            <td>Kontakt</td><td>E-Mail</td>
            <td>Alias: <code>Privatmail</code>, <code>E-Mail privat</code></td>
          </tr>
          <tr>
            <td><code>EmailDienstlich</code></td>
            <td>Kontakt</td><td>E-Mail</td>
            <td>Alias: <code>Email</code>, <code>SchulEmail</code>, <code>Dienstliche Email</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Klassen ───────────────────────────────────────────────────────── -->
    <div id="klassen" class="format-section">
      <h3>
        <i class="pi pi-sitemap section-icon" /> Klassen
        <span class="path-badge direct">Direktimport</span>
      </h3>
      <p class="section-desc">
        Klassen für ein bestimmtes Schuljahr und einen Abschnitt anlegen.
        Beispieldatei: <code>klassen.csv</code>
      </p>
      <table class="field-table">
        <thead>
          <tr><th>Spaltenname</th><th>Typ</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          <tr><td><code>schuljahr</code></td><td>Zahl</td><td>Vierstellig, z.&nbsp;B. <code>2025</code></td></tr>
          <tr><td><code>abschnitt</code></td><td>Zahl</td><td><code>1</code> (1. Halbjahr) oder <code>2</code> (2. Halbjahr)</td></tr>
          <tr><td><code>kuerzel</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Klassenbezeichnung, z.&nbsp;B. <code>10a</code></td></tr>
          <tr><td><code>beschreibung</code></td><td>Text</td><td>Vollständige Beschreibung der Klasse</td></tr>
          <tr><td><code>jahrgang</code></td><td>Text</td><td>Jahrgangskürzel, z.&nbsp;B. <code>10</code></td></tr>
          <tr><td><code>parallelitaet</code></td><td>Text</td><td>Parallelklassen-Buchstabe, z.&nbsp;B. <code>A</code>, <code>B</code></td></tr>
          <tr><td><code>folgeklasse</code></td><td>Text</td><td>Kürzel der Folgeklasse, z.&nbsp;B. <code>EF</code></td></tr>
          <tr><td><code>vorgaengerklasse</code></td><td>Text</td><td>Kürzel der Vorgängerklasse</td></tr>
          <tr><td><code>sortierung</code></td><td>Zahl</td><td>Anzeigereihenfolge</td></tr>
          <tr><td><code>teilstandort</code></td><td>Text</td><td>Kürzel des Teilstandorts</td></tr>
          <tr><td><code>noteneingabeGesperrt</code></td><td>Boolean</td><td><code>true</code> / <code>false</code></td></tr>
          <tr><td><code>verwendungAnkreuzkompetenzen</code></td><td>Boolean</td><td><code>true</code> / <code>false</code></td></tr>
          <tr><td><code>pruefungsordnung</code></td><td>Text</td><td>z.&nbsp;B. <code>APO-SI 05: Jahrgänge 5-10</code></td></tr>
          <tr><td><code>beginnSommersemester</code></td><td>Boolean</td><td><code>true</code> / <code>false</code></td></tr>
          <tr><td><code>klassenlehrer</code></td><td>Text</td><td>Kürzel der Klassenlehrkraft</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── Fächer ─────────────────────────────────────────────────────────── -->
    <div id="faecher" class="format-section">
      <h3>
        <i class="pi pi-book section-icon" /> Fächer
        <span class="path-badge direct">Direktimport</span>
      </h3>
      <p class="section-desc">
        Fächerkatalog anlegen oder aktualisieren.
        Beispieldatei: <code>faecher.csv</code>
      </p>
      <table class="field-table">
        <thead>
          <tr><th>Spaltenname</th><th>Typ</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          <tr><td><code>kuerzel</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Fachkürzel, z.&nbsp;B. <code>D</code>, <code>M</code>, <code>E</code></td></tr>
          <tr><td><code>kuerzelStatistik</code></td><td>Text</td><td>Amtliches Statistikkürzel</td></tr>
          <tr><td><code>bezeichnung</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Vollständige Fachbezeichnung</td></tr>
          <tr><td><code>bezeichnungZeugnis</code></td><td>Text</td><td>Bezeichnung für das Zeugnis</td></tr>
          <tr><td><code>bezeichnungUeberweisungszeugnis</code></td><td>Text</td><td>Bezeichnung für das Überweisungszeugnis</td></tr>
          <tr><td><code>sortierung</code></td><td>Zahl</td><td>Anzeigereihenfolge</td></tr>
          <tr><td><code>istSichtbar</code></td><td>Boolean</td><td>Standard: <code>true</code></td></tr>
          <tr><td><code>aufZeugnis</code></td><td>Boolean</td><td>Erscheint auf dem Zeugnis</td></tr>
          <tr><td><code>istFremdsprache</code></td><td>Boolean</td><td></td></tr>
          <tr><td><code>aufgabenfeld</code></td><td>Text</td><td>Aufgabenfeld in der Oberstufe</td></tr>
          <tr><td><code>bilingualeSprache</code></td><td>Text</td><td>Sprache bei bilingualem Fach</td></tr>
          <tr><td><code>istOberstufenFach</code></td><td>Boolean</td><td></td></tr>
          <tr><td><code>istPruefungsordnungsRelevant</code></td><td>Boolean</td><td></td></tr>
          <tr><td><code>istMoeglichAlsNeueFremdspracheInSekII</code></td><td>Boolean</td><td></td></tr>
          <tr><td><code>istNachpruefungErlaubt</code></td><td>Boolean</td><td></td></tr>
          <tr><td><code>istSchriftlichZK</code></td><td>Boolean</td><td>Schriftlich im Zentralabitur</td></tr>
          <tr><td><code>istSchriftlichBA</code></td><td>Boolean</td><td>Schriftlich bei Besonderer Abiturprüfung</td></tr>
          <tr><td><code>istFHRFach</code></td><td>Boolean</td><td>Fachholschulreife-Fach</td></tr>
          <tr><td><code>holeAusAltenLernabschnitten</code></td><td>Boolean</td><td>Noten aus Vorjahr übernehmen</td></tr>
          <tr><td><code>maxZeichenInFachbemerkungen</code></td><td>Zahl</td><td>Zeichenbegrenzung für Fachbemerkungen</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── Jahrgänge ─────────────────────────────────────────────────────── -->
    <div id="jahrgaenge" class="format-section">
      <h3>
        <i class="pi pi-calendar section-icon" /> Jahrgänge
        <span class="path-badge direct">Direktimport</span>
      </h3>
      <p class="section-desc">
        Jahrgangsstufen anlegen.
        Beispieldatei: <code>jahrgaenge.csv</code>
      </p>
      <table class="field-table">
        <thead>
          <tr><th>Spaltenname</th><th>Typ</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          <tr><td><code>kuerzel</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>z.&nbsp;B. <code>05</code>, <code>EF</code>, <code>Q1</code></td></tr>
          <tr><td><code>kurzbezeichnung</code></td><td>Text</td><td>Kurze Anzeigenbezeichnung, z.&nbsp;B. <code>Jg. 05</code></td></tr>
          <tr><td><code>kuerzelStatistik</code></td><td>Text</td><td>Amtliches Statistikkürzel</td></tr>
          <tr><td><code>bezeichnung</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Vollständige Bezeichnung, z.&nbsp;B. <code>Jahrgang 5</code></td></tr>
          <tr><td><code>sortierung</code></td><td>Zahl</td><td>Anzeigereihenfolge</td></tr>
          <tr><td><code>kuerzelSchulgliederung</code></td><td>Text</td><td>Zugeordnete Schulgliederung, z.&nbsp;B. <code>***</code></td></tr>
          <tr><td><code>istSichtbar</code></td><td>Boolean</td><td>Standard: <code>true</code></td></tr>
          <tr><td><code>anzahlRestabschnitte</code></td><td>Zahl</td><td>Verbleibende Schulabschnitte bis zum Abschluss</td></tr>
          <tr><td><code>idBildungsstufe</code></td><td>Zahl</td><td>Interne ID der Bildungsstufe</td></tr>
          <tr><td><code>idFolgejahrgang</code></td><td>Zahl</td><td>Interne ID des Folgejahrgangs</td></tr>
          <tr><td><code>gueltigVon</code></td><td>Text</td><td>Schuljahr (Beginn der Gültigkeit)</td></tr>
          <tr><td><code>gueltigBis</code></td><td>Text</td><td>Schuljahr (Ende der Gültigkeit)</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── Betriebe ──────────────────────────────────────────────────────── -->
    <div id="betriebe" class="format-section">
      <h3>
        <i class="pi pi-building section-icon" /> Betriebe
        <span class="path-badge direct">Direktimport</span>
      </h3>
      <p class="section-desc">
        Ausbildungsbetriebe anlegen. Trennzeichen: Komma <code>,</code>.
        Beispieldatei: <code>betriebe.csv</code>
      </p>
      <table class="field-table">
        <thead>
          <tr><th>Spaltenname</th><th>Typ</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          <tr><td><code>name</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Firmenname / Betriebsname</td></tr>
          <tr><td><code>nameZusatz</code></td><td>Text</td><td>Zusatz zum Firmennamen (z.&nbsp;B. Filialbezeichnung)</td></tr>
          <tr><td><code>branche</code></td><td>Text</td><td>Branchenbezeichnung</td></tr>
          <tr><td><code>plz</code></td><td>Text</td><td>Postleitzahl</td></tr>
          <tr><td><code>ort</code></td><td>Text</td><td>Ortsname</td></tr>
          <tr><td><code>strasse</code></td><td>Text</td><td>Straßenname</td></tr>
          <tr><td><code>hausnummer</code></td><td>Text</td><td>Hausnummer</td></tr>
          <tr><td><code>hausnummerZusatz</code></td><td>Text</td><td>Hausnummernzusatz, z.&nbsp;B. <code>a</code></td></tr>
          <tr><td><code>telefon1</code></td><td>Text</td><td>Haupttelefonnummer</td></tr>
          <tr><td><code>telefon2</code></td><td>Text</td><td>Zweite Telefonnummer</td></tr>
          <tr><td><code>fax</code></td><td>Text</td><td>Faxnummer</td></tr>
          <tr><td><code>email</code></td><td>E-Mail</td><td>Allgemeine Kontakt-E-Mail</td></tr>
          <tr><td><code>ausbildungsbetrieb</code></td><td>Boolean</td><td><code>ja</code> / <code>nein</code></td></tr>
          <tr><td><code>massnahmentraeger</code></td><td>Boolean</td><td><code>ja</code> / <code>nein</code></td></tr>
          <tr><td><code>belehrungNachISGErforderlich</code></td><td>Boolean</td><td>Belehrung nach Infektionsschutzgesetz erforderlich</td></tr>
          <tr><td><code>erweitertesFuehrungszeugnis</code></td><td>Boolean</td><td>Erweitertes Führungszeugnis erforderlich</td></tr>
          <tr><td><code>praktikumsplaetze</code></td><td>Boolean</td><td>Bietet Praktikumsplätze an</td></tr>
          <tr><td><code>bemerkungen</code></td><td>Text</td><td>Freitext-Bemerkungen</td></tr>
        </tbody>
      </table>

      <h4 class="subsection-title"><i class="pi pi-user section-icon-sm" /> Betriebe: Ansprechpartner</h4>
      <p class="section-desc">
        Ansprechpartner zu bestehenden Betrieben zuordnen.
        Beispieldatei: <code>ansprechpartner.csv</code>
      </p>
      <table class="field-table">
        <thead>
          <tr><th>Spaltenname</th><th>Typ</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          <tr><td><code>betriebname</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Muss exakt mit dem Betriebsnamen übereinstimmen</td></tr>
          <tr><td><code>anrede</code></td><td>Text</td><td>z.&nbsp;B. <code>Herr</code>, <code>Frau</code></td></tr>
          <tr><td><code>name</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Nachname des Ansprechpartners</td></tr>
          <tr><td><code>rufname</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Vorname / Rufname</td></tr>
          <tr><td><code>telefon</code></td><td>Text</td><td>Direkte Telefonnummer</td></tr>
          <tr><td><code>email</code></td><td>E-Mail</td><td>Direkte E-Mail-Adresse</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── Unterricht ─────────────────────────────────────────────────────── -->
    <div id="unterricht" class="format-section">
      <h3>
        <i class="pi pi-book section-icon" /> Unterricht
        <span class="path-badge direct">Direktimport</span>
      </h3>
      <p class="section-desc">
        Unterrichtsdaten in drei Varianten: Klassenunterricht, Kursunterricht und Schüler-Lernabschnitte.
      </p>

      <h4 class="subsection-title">Unterricht – Klassen</h4>
      <p class="section-desc">Beispieldatei: <code>unterricht-klassen.csv</code></p>
      <table class="field-table">
        <thead>
          <tr><th>Spaltenname</th><th>Typ</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          <tr><td><code>schuljahr</code></td><td>Zahl</td><td>z.&nbsp;B. <code>2025</code></td></tr>
          <tr><td><code>abschnitt</code></td><td>Zahl</td><td><code>1</code> oder <code>2</code></td></tr>
          <tr><td><code>klasse</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Klassenbezeichnung, z.&nbsp;B. <code>5a</code></td></tr>
          <tr><td><code>lehrerKuerzel</code></td><td>Text</td><td>Kürzel der unterrichtenden Lehrkraft</td></tr>
          <tr><td><code>kursart</code></td><td>Text</td><td>z.&nbsp;B. <code>PUK</code> (Pflichtunterricht Klasse)</td></tr>
          <tr><td><code>fach</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Fachkürzel, z.&nbsp;B. <code>D</code>, <code>M</code></td></tr>
          <tr><td><code>wochenstunden</code></td><td>Zahl</td><td>Stunden pro Woche</td></tr>
          <tr><td><code>aufszeugnis</code></td><td>Boolean</td><td>Erscheint auf dem Zeugnis</td></tr>
        </tbody>
      </table>

      <h4 class="subsection-title">Unterricht – Kurse</h4>
      <p class="section-desc">Beispieldatei: <code>unterricht-kurse.csv</code></p>
      <table class="field-table">
        <thead>
          <tr><th>Spaltenname</th><th>Typ</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          <tr><td><code>schuljahr</code></td><td>Zahl</td><td>z.&nbsp;B. <code>2025</code></td></tr>
          <tr><td><code>abschnitt</code></td><td>Zahl</td><td><code>1</code> oder <code>2</code></td></tr>
          <tr><td><code>kuerzel</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Kursbezeichnung, z.&nbsp;B. <code>ER-05</code></td></tr>
          <tr><td><code>lehrerkuerzel</code></td><td>Text</td><td>Kürzel der Kurslehrkraft</td></tr>
          <tr><td><code>kursart</code></td><td>Text</td><td>z.&nbsp;B. <code>PUT</code> (Pflichtunterricht)</td></tr>
          <tr><td><code>fach</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Fachkürzel</td></tr>
          <tr><td><code>jahrgaenge</code></td><td>Text</td><td>Kommagetrennte Jahrgangskürzel, z.&nbsp;B. <code>05,06</code></td></tr>
          <tr><td><code>zeugnisbezeichnung</code></td><td>Text</td><td>Bezeichnung auf dem Zeugnis</td></tr>
          <tr><td><code>wochenstunden</code></td><td>Zahl</td><td></td></tr>
          <tr><td><code>wochenstundenlehrkraft</code></td><td>Zahl</td><td>Angerechnete Stunden der Lehrkraft</td></tr>
          <tr><td><code>fortschreibungsart</code></td><td>Text</td><td>z.&nbsp;B. <code>komplett</code></td></tr>
          <tr><td><code>schienen</code></td><td>Text</td><td>Kursschienenbezeichnung</td></tr>
          <tr><td><code>istepochal</code></td><td>Boolean</td><td>Epochalunterricht</td></tr>
        </tbody>
      </table>

      <h4 class="subsection-title">Unterricht – Schüler (Lernabschnitte)</h4>
      <p class="section-desc">Beispieldatei: <code>unterricht-schueler.csv</code></p>
      <table class="field-table">
        <thead>
          <tr><th>Spaltenname</th><th>Typ</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          <tr><td><code>nachname</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Zur Schüler-Identifikation</td></tr>
          <tr><td><code>vorname</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td></td></tr>
          <tr><td><code>geburtsdatum</code></td><td>Datum</td><td>Zur eindeutigen Zuordnung</td></tr>
          <tr><td><code>schuljahr</code></td><td>Zahl</td><td></td></tr>
          <tr><td><code>abschnitt</code></td><td>Zahl</td><td></td></tr>
          <tr><td><code>fach</code></td><td>Text</td><td>Fachkürzel</td></tr>
          <tr><td><code>fachlehrer</code></td><td>Text</td><td>Kürzel der Lehrkraft</td></tr>
          <tr><td><code>kurs</code></td><td>Text</td><td>Kurskürzel (leer bei Klassenunterricht)</td></tr>
          <tr><td><code>kursart</code></td><td>Text</td><td></td></tr>
          <tr><td><code>jahrgaenge</code></td><td>Text</td><td></td></tr>
          <tr><td><code>note</code></td><td>Text</td><td>Note als Zahl oder Kürzel</td></tr>
          <tr><td><code>abiturfach</code></td><td>Text</td><td>Abiturfachnummer (1–4)</td></tr>
          <tr><td><code>wochenstd</code></td><td>Zahl</td><td>Wochenstunden</td></tr>
          <tr><td><code>fehlstd</code></td><td>Zahl</td><td>Fehlstunden gesamt</td></tr>
          <tr><td><code>unentschfehlstd</code></td><td>Zahl</td><td>Unentschuldigte Fehlstunden</td></tr>
          <tr><td><code>mahnung</code></td><td>Boolean</td><td></td></tr>
          <tr><td><code>mahndatum</code></td><td>Datum</td><td></td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── Floskeln ──────────────────────────────────────────────────────── -->
    <div id="floskeln" class="format-section">
      <h3>
        <i class="pi pi-comment section-icon" /> Floskeln
        <span class="path-badge direct">Direktimport</span>
      </h3>
      <p class="section-desc">
        Textbausteine für Zeugnisse und Berichte.
        Beispieldatei: <code>floskeln.csv</code>
      </p>
      <p class="section-desc hint-box">
        <i class="pi pi-lightbulb" /> In Floskeltexten können Platzhalter verwendet werden:
        <code>$Vorname$</code>, <code>$Nachname$</code>, <code>&amp;Seine%Ihre&amp;</code> (Pronomen geschlechtsspezifisch).
      </p>
      <table class="field-table">
        <thead>
          <tr><th>Spaltenname</th><th>Typ</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          <tr><td><code>kuerzel</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Eindeutiges Kürzel (z.&nbsp;B. <code>#2288</code>)</td></tr>
          <tr><td><code>floskeltext</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Vollständiger Floskeltext, Platzhalter möglich</td></tr>
          <tr><td><code>floskelgruppe</code></td><td>Text</td><td>Gruppenbezeichnung, z.&nbsp;B. <code>SFEM</code></td></tr>
          <tr><td><code>fach</code></td><td>Text</td><td>Fachkürzel (leer = fachübergreifend)</td></tr>
          <tr><td><code>niveau</code></td><td>Text</td><td>Niveau-Schlüssel</td></tr>
          <tr><td><code>jahrgang</code></td><td>Text</td><td>Jahrgangskürzel (leer = alle)</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── Ankreuzkompetenzen ────────────────────────────────────────────── -->
    <div id="ankreuz" class="format-section">
      <h3>
        <i class="pi pi-check-square section-icon" /> Ankreuzkompetenzen
        <span class="path-badge direct">Direktimport</span>
      </h3>
      <p class="section-desc">
        Kompetenzaussagen für Ankreuzzeugnisse.
        Beispieldatei: <code>ankreuzkompetenzen.csv</code>
      </p>
      <table class="field-table">
        <thead>
          <tr><th>Spaltenname</th><th>Typ</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          <tr><td><code>fach</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Fachkürzel, z.&nbsp;B. <code>D</code>, <code>ASV</code></td></tr>
          <tr><td><code>istasv</code></td><td>Boolean</td><td><code>true</code> für allgemeine Schul- und Sozialverhaltens-Aussagen</td></tr>
          <tr><td><code>schulgliederung</code></td><td>Text</td><td>Gilt nur für diese Schulgliederung (leer = alle)</td></tr>
          <tr><td><code>abschnitt</code></td><td>Zahl</td><td><code>0</code> = beide Abschnitte, <code>1</code> oder <code>2</code></td></tr>
          <tr><td><code>aktiv</code></td><td>Boolean</td><td>Standard: <code>true</code></td></tr>
          <tr><td><code>jahrgaenge</code></td><td>Text</td><td>Kommagetrennte Jahrgangskürzel, z.&nbsp;B. <code>05,06</code></td></tr>
          <tr><td><code>sortierung</code></td><td>Zahl</td><td>Anzeigereihenfolge innerhalb der Gruppe</td></tr>
          <tr><td><code>sichtbar</code></td><td>Boolean</td><td>Standard: <code>true</code></td></tr>
          <tr><td><code>text</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Kompetenzaussage, z.&nbsp;B. „kann Texte lesen und verstehen"</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ── Ortsteile ─────────────────────────────────────────────────────── -->
    <div id="ortsteile" class="format-section">
      <h3>
        <i class="pi pi-map-marker section-icon" /> Ortsteile (PLZ-Zuordnung)
        <span class="path-badge direct">Direktimport</span>
      </h3>
      <p class="section-desc">
        Zuordnung von Postleitzahlen zu Ortsteilen. Wird beim Schüler- und Lehrkräfte-Import
        genutzt, um die Ortsteilzuordnung automatisch zu befüllen.
        Beispieldateien: <code>plz-ort-ortsteil-do.csv</code> (Dortmund), <code>plz-ort-ortsteil-k.csv</code> (Köln), <code>plz-ort-ortsteile-d.csv</code> (Düsseldorf) u.&nbsp;a.
      </p>
      <table class="field-table">
        <thead>
          <tr><th>Spaltenname</th><th>Typ</th><th>Hinweis</th></tr>
        </thead>
        <tbody>
          <tr><td><code>plz</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Fünfstellige Postleitzahl, z.&nbsp;B. <code>40210</code></td></tr>
          <tr><td><code>ort</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Ortsname, z.&nbsp;B. <code>Düsseldorf</code></td></tr>
          <tr><td><code>ortsteil</code> <span class="required-badge">Pflicht</span></td><td>Text</td><td>Ortsteilname, z.&nbsp;B. <code>Friedrichstadt</code></td></tr>
        </tbody>
      </table>
      <p class="section-desc" style="margin-top: 0.75rem;">
        <i class="pi pi-info-circle" /> Fertige Ortsteildateien für NRW-Großstädte befinden sich im Verzeichnis
        <code>examples/ortsteile/</code>.
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.help-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  scroll-behavior: smooth;
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.help-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.help-header h2 {
  margin: 0.5rem 0 0;
  font-size: 1.5rem;
}

.subtitle {
  margin: 0;
  color: var(--p-text-muted-color);
}

/* ── TOC Navigation ──────────────────────────────────────────────────────── */
.toc-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.75rem 1rem;
  background: var(--p-surface-card);
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
}

.toc-nav button {
  display: inline-block;
  padding: 0.2rem 0.7rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--p-primary-color);
  background: color-mix(in srgb, var(--p-primary-color) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--p-primary-color) 20%, transparent);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.toc-nav button:hover {
  background: color-mix(in srgb, var(--p-primary-color) 18%, transparent);
  border-color: color-mix(in srgb, var(--p-primary-color) 40%, transparent);
}

/* ── Section Layout ──────────────────────────────────────────────────────── */
.format-section {
  scroll-margin-top: 1rem;
}

.format-section h3 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 1.1rem;
  margin: 0 0 0.4rem;
}

.section-icon {
  color: var(--p-primary-color);
  font-size: 1.1rem;
}

.section-icon-sm {
  color: var(--p-primary-color);
  font-size: 0.9rem;
}

.section-desc {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
}

.subsection-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 1.5rem 0 0.4rem;
  color: var(--p-text-color);
}

/* ── Path Badges ────────────────────────────────────────────────────────── */
.path-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 4px;
  padding: 0.1rem 0.5rem;
  vertical-align: middle;
}

.path-badge.wizard {
  color: #6366f1;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
}

.path-badge.direct {
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

:global(.dark) .path-badge.wizard {
  color: #a5b4fc;
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}

:global(.dark) .path-badge.direct {
  color: #86efac;
  background: rgba(22, 163, 74, 0.15);
  border-color: rgba(22, 163, 74, 0.3);
}

/* ── Required Badge ─────────────────────────────────────────────────────── */
.required-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--p-primary-700);
  background: var(--p-primary-50);
  border: 1px solid var(--p-primary-200);
  border-radius: 4px;
  padding: 0.05rem 0.4rem;
  vertical-align: middle;
  margin-left: 0.25rem;
}

:global(.dark) .required-badge {
  color: var(--p-primary-300);
  background: color-mix(in srgb, var(--p-primary-color) 15%, transparent);
  border-color: var(--p-primary-700);
}

/* ── Importwege ──────────────────────────────────────────────────────────── */
.path-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.path-card {
  padding: 1.25rem;
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  background: var(--p-surface-card);
  font-size: 0.875rem;
}

.path-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.path-icon {
  font-size: 1.2rem;
  color: var(--p-primary-color);
}

.path-card p {
  margin: 0 0 0.5rem;
  color: var(--p-text-muted-color);
  line-height: 1.55;
}

.path-supports {
  font-size: 0.82rem;
  color: var(--p-text-color) !important;
  font-weight: 500;
}

.path-route code {
  font-size: 0.78rem;
}

/* ── Field Table ─────────────────────────────────────────────────────────── */
.field-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.field-table th,
.field-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--p-surface-border);
}

.field-table th {
  font-weight: 600;
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: var(--p-surface-ground);
}

.field-table tbody tr:hover {
  background: var(--p-surface-hover);
}

.field-table code {
  padding: 0.1rem 0.35rem;
  background: var(--p-surface-ground);
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.82rem;
  color: var(--p-primary-color);
}

/* Category rows in field tables */
.cat-row td {
  background: var(--p-surface-ground);
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--p-text-muted-color);
  padding: 0.35rem 0.75rem;
}

/* ── Notes Grid ─────────────────────────────────────────────────────────── */
.notes-section h3 {
  margin-bottom: 1rem;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.note-card {
  padding: 1rem 1.25rem;
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  background: var(--p-surface-card);
  font-size: 0.875rem;
}

.note-card strong {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.9rem;
}

.note-card p {
  margin: 0;
  color: var(--p-text-muted-color);
  line-height: 1.5;
}

.note-card code {
  padding: 0.1rem 0.3rem;
  background: var(--p-surface-ground);
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.82rem;
  color: var(--p-primary-color);
}

/* ── Hint Box ───────────────────────────────────────────────────────────── */
.hint-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  background: color-mix(in srgb, var(--p-primary-color) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--p-primary-color) 20%, transparent);
  border-radius: 6px;
  color: var(--p-text-color) !important;
}

.hint-box .pi {
  color: var(--p-primary-color);
  flex-shrink: 0;
  margin-top: 0.1rem;
}
</style>
