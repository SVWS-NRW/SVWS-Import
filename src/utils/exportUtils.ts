export function exportAsCsv(
  data: Record<string, unknown>[],
  fields: string[],
  filename: string,
): void {
  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v)
    return s.includes(';') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const header = fields.join(';')
  const rows = data.map(row => fields.map(f => escape(row[f])).join(';'))
  const csv = '﻿' + [header, ...rows].join('\r\n')
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

export function exportAsJson(
  data: Record<string, unknown>[],
  fields: string[],
  filename: string,
): void {
  const filtered = data.map(row =>
    Object.fromEntries(fields.map(f => [f, row[f] ?? null])),
  )
  triggerDownload(
    new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' }),
    filename,
  )
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
