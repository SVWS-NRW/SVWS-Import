export interface Schuljahresabschnitt {
  id: number
  schuljahr: number  // z.B. 2022 für das Schuljahr 2022/23
  abschnitt: number  // 1 = 1. Halbjahr, 2 = 2. Halbjahr
}

export interface SchuleStammdaten {
  schuljahresabschnitt: number           // ID des aktuellen Abschnitts
  schuljahresabschnitte: Schuljahresabschnitt[]
  [key: string]: unknown
}

export function abschnittLabel(sja: Schuljahresabschnitt): string {
  const halbjahr = sja.abschnitt === 1 ? '1. Halbjahr' : '2. Halbjahr'
  return `${sja.schuljahr}/${String(sja.schuljahr + 1).slice(-2)} – ${halbjahr}`
}
