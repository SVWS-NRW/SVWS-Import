# Datenschutzhinweise

## 1. Keine Daten ohne Nutzeraktion

SVWS-Import sendet Daten nur dann an einen Server, wenn Sie dies ausdrücklich auslösen.

- Hochgeladene CSV- und XLSX-Dateien werden ausschließlich lokal im Browser verarbeitet.
- Eine Netzwerkverbindung wird nur beim Verbindungsaufbau zum SVWS-Server und beim Import der Daten hergestellt.

## 2. Keine dauerhafte Speicherung von Zugangsdaten

Benutzername, Passwort und Server-URL werden **nicht** in `localStorage`, `sessionStorage` oder Cookies gespeichert.

- Alle Verbindungsdaten werden ausschließlich temporär im Arbeitsspeicher des Browsers gehalten (Pinia-Store).
- Nach einem Seiten-Reload müssen die Verbindungsdaten erneut eingegeben werden.
- Lediglich die Farbschema-Einstellung (Hell/Dunkel) wird im `localStorage` gespeichert.

## 3. Verarbeitung von Schuldaten

- Importierte Schüler-, Lehrer- und Betriebsdaten verbleiben ausschließlich im Arbeitsspeicher des Browsers.
- Daten werden nur dann an den SVWS-Server übertragen, wenn Sie einen Import explizit auslösen.
- Kein Tracking, keine Cookies, keine Drittserver.

## 4. Datenhaltung im Browser

- Alle geladenen Daten gehen nach dem Schließen des Browser-Tabs unwiderruflich verloren.
- Es werden keine Daten an externe Dienste weitergeleitet.

## 5. Empfehlungen

- Arbeiten Sie nach Möglichkeit über eine verschlüsselte `https://`-Verbindung zum SVWS-Server.
- Schließen Sie den Browser-Tab nach Abschluss der Importarbeiten.
- Geben Sie Import-Dateien mit Schuldaten nicht unbefugt weiter.
