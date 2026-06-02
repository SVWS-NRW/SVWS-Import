'use strict'

const { app, BrowserWindow, session } = require('electron')
const path = require('path')


function fixCorsHeaders(details, callback) {
  const origin = details.requestHeaders?.['Origin'] ?? details.requestHeaders?.['origin']
  const headers = { ...details.responseHeaders }

  // Der SVWS-Server sendet credentials:true + allow-origin:* — laut CORS-Spec ungültig.
  // Im Electron-Main-Process ersetzen wir den Wildcard durch die tatsächliche Origin
  // (also "null" für file://-Seiten), damit der Renderer die Antwort akzeptiert.
  if (origin) {
    headers['access-control-allow-origin'] = [origin]
    headers['access-control-allow-credentials'] = ['true']
  }

  callback({ responseHeaders: headers })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  session.defaultSession.webRequest.onHeadersReceived(fixCorsHeaders)

  win.loadFile(path.join(__dirname, '../dist/index.html'))
}

// Selbstsignierte Zertifikate des SVWS-Servers akzeptieren
app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  event.preventDefault()
  callback(true)
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
