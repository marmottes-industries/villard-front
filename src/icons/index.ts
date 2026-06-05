// Linear icon set — stroke 1.6, viewBox 24. Ported from design/prototype/icons.jsx.
// Inner SVG markup as strings: rendered via v-html in <Icon>.

const P =
  'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'

export const ICONS: Record<string, string> = {
  calendar: `<rect x="3.5" y="4.5" width="17" height="16" rx="2.5" ${P}/><path d="M3.5 9h17M8 2.5v4M16 2.5v4" ${P}/>`,
  box: `<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" ${P}/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" ${P}/>`,
  cart: `<path d="M3 4h2l2.2 11.2a1.4 1.4 0 0 0 1.4 1.1h8.2a1.4 1.4 0 0 0 1.4-1.1L21 8H6" ${P}/><circle cx="9.5" cy="20" r="1.2" ${P}/><circle cx="18" cy="20" r="1.2" ${P}/>`,
  server: `<rect x="3.5" y="4" width="17" height="7" rx="2" ${P}/><rect x="3.5" y="13" width="17" height="7" rx="2" ${P}/><path d="M7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6" ${P}/>`,
  leaf: `<path d="M5 19c0-8 5-14 14-14 0 9-5 14-14 14z" ${P}/><path d="M5 19c4-6 8-8 12-9" ${P}/>`,
  plus: `<path d="M12 5v14M5 12h14" ${P}/>`,
  chevL: `<path d="M14.5 6 9 12l5.5 6" ${P}/>`,
  chevR: `<path d="M9.5 6 15 12l-5.5 6" ${P}/>`,
  chevD: `<path d="M6 9.5 12 15l6-5.5" ${P}/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${P}/><path d="m20 20-3.5-3.5" ${P}/>`,
  check: `<path d="M5 12.5 10 17.5 19.5 7" ${P}/>`,
  x: `<path d="M6 6 18 18M18 6 6 18" ${P}/>`,
  user: `<circle cx="12" cy="8.5" r="3.5" ${P}/><path d="M5.5 19a6.5 6.5 0 0 1 13 0" ${P}/>`,
  users: `<circle cx="9" cy="9" r="3.2" ${P}/><path d="M3 19a6 6 0 0 1 12 0" ${P}/><path d="M15 6.5a3 3 0 0 1 0 5.7M21 19a5 5 0 0 0-3.6-4.8" ${P}/>`,
  gear: `<circle cx="12" cy="12" r="3" ${P}/><path d="M12 3v2.5M12 18.5V21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M3 12h2.5M18.5 12H21M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" ${P}/>`,
  trash: `<path d="M4.5 7h15M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7M6.5 7l1 12a2 2 0 0 0 2 1.8h5a2 2 0 0 0 2-1.8l1-12" ${P}/>`,
  alert: `<path d="M12 4 2.5 20h19z" ${P}/><path d="M12 10v4M12 17h.01" ${P}/>`,
  clock: `<circle cx="12" cy="12" r="8.5" ${P}/><path d="M12 7.5V12l3 2" ${P}/>`,
  grid: `<rect x="3.5" y="3.5" width="7" height="7" rx="1.5" ${P}/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" ${P}/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" ${P}/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" ${P}/>`,
  cols: `<rect x="3.5" y="4" width="5" height="16" rx="1.5" ${P}/><rect x="9.5" y="4" width="5" height="16" rx="1.5" ${P}/><rect x="15.5" y="4" width="5" height="16" rx="1.5" ${P}/>`,
  list: `<path d="M4 6.5h16M4 12h16M4 17.5h16" ${P}/>`,
  arrow: `<path d="M5 12h14M13 6l6 6-6 6" ${P}/>`,
}
