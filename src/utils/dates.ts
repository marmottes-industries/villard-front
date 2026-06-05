export const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
export const MONTHS_ABBR = [
  'jan', 'fév', 'mar', 'avr', 'mai', 'juin',
  'juil', 'août', 'sep', 'oct', 'nov', 'déc',
]
export const DOW = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']

export function todayMidday(): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function fmtISO(dt: Date): string {
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(dt: Date, n: number): Date {
  const d = new Date(dt)
  d.setDate(d.getDate() + n)
  return d
}

export function startOfDay(dt: Date): Date {
  const d = new Date(dt)
  d.setHours(12, 0, 0, 0)
  return d
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

export function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000)
}

export function dowMon(dt: Date): number {
  return (dt.getDay() + 6) % 7
}

export function mondayOf(dt: Date): Date {
  return addDays(startOfDay(dt), -dowMon(dt))
}

export function nights(startISO: string, endISO: string): number {
  return dayDiff(parseISO(startISO), parseISO(endISO))
}

export function fmtRange(startISO: string, endISO: string): string {
  const s = parseISO(startISO)
  const e = addDays(parseISO(endISO), -1)
  const sameMonth = s.getMonth() === e.getMonth()
  if (sameDay(s, e)) return `${s.getDate()} ${MONTHS_ABBR[s.getMonth()]}`
  if (sameMonth) return `${s.getDate()}–${e.getDate()} ${MONTHS_ABBR[s.getMonth()]}`
  return `${s.getDate()} ${MONTHS_ABBR[s.getMonth()]} – ${e.getDate()} ${MONTHS_ABBR[e.getMonth()]}`
}

export function fmtLongDate(iso: string): string {
  return parseISO(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
