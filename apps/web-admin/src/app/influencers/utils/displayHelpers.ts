// Country code to name mapping (DB stores codes like "US", "AR", etc.)
export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  ES: 'Spain',
  MX: 'Mexico',
  AR: 'Argentina',
  CO: 'Colombia',
  BR: 'Brazil',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
  IT: 'Italy',
  PT: 'Portugal',
  CL: 'Chile',
  PE: 'Peru',
  VE: 'Venezuela',
  EC: 'Ecuador',
  CA: 'Canada',
  AU: 'Australia',
  JP: 'Japan',
  KR: 'South Korea',
  IN: 'India',
  CN: 'China',
  RU: 'Russia',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  PL: 'Poland',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  IE: 'Ireland',
  NZ: 'New Zealand',
  ZA: 'South Africa',
  TR: 'Turkey',
  GR: 'Greece',
  IL: 'Israel',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  SG: 'Singapore',
  TH: 'Thailand',
  ID: 'Indonesia',
  MY: 'Malaysia',
  PH: 'Philippines',
  VN: 'Vietnam',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  MA: 'Morocco',
  UA: 'Ukraine',
  CZ: 'Czech Republic',
  RO: 'Romania',
  HU: 'Hungary',
  PR: 'Puerto Rico',
  DO: 'Dominican Republic',
  GT: 'Guatemala',
  CR: 'Costa Rica',
  PA: 'Panama',
  UY: 'Uruguay',
  PY: 'Paraguay',
  BO: 'Bolivia',
  HN: 'Honduras',
  SV: 'El Salvador',
  NI: 'Nicaragua',
  CU: 'Cuba',
}

// Language name mapping with associated country codes for flags
export const LANGUAGE_INFO: Record<string, { name: string; flagCode: string }> = {
  // Common language codes/names that might be stored in DB
  en: { name: 'English', flagCode: 'GB' },
  english: { name: 'English', flagCode: 'GB' },
  es: { name: 'Spanish', flagCode: 'ES' },
  spanish: { name: 'Spanish', flagCode: 'ES' },
  pt: { name: 'Portuguese', flagCode: 'PT' },
  portuguese: { name: 'Portuguese', flagCode: 'PT' },
  fr: { name: 'French', flagCode: 'FR' },
  french: { name: 'French', flagCode: 'FR' },
  de: { name: 'German', flagCode: 'DE' },
  german: { name: 'German', flagCode: 'DE' },
  it: { name: 'Italian', flagCode: 'IT' },
  italian: { name: 'Italian', flagCode: 'IT' },
  zh: { name: 'Chinese', flagCode: 'CN' },
  chinese: { name: 'Chinese', flagCode: 'CN' },
  mandarin: { name: 'Mandarin', flagCode: 'CN' },
  ja: { name: 'Japanese', flagCode: 'JP' },
  japanese: { name: 'Japanese', flagCode: 'JP' },
  ko: { name: 'Korean', flagCode: 'KR' },
  korean: { name: 'Korean', flagCode: 'KR' },
  ar: { name: 'Arabic', flagCode: 'SA' },
  arabic: { name: 'Arabic', flagCode: 'SA' },
  hi: { name: 'Hindi', flagCode: 'IN' },
  hindi: { name: 'Hindi', flagCode: 'IN' },
  ru: { name: 'Russian', flagCode: 'RU' },
  russian: { name: 'Russian', flagCode: 'RU' },
  nl: { name: 'Dutch', flagCode: 'NL' },
  dutch: { name: 'Dutch', flagCode: 'NL' },
  pl: { name: 'Polish', flagCode: 'PL' },
  polish: { name: 'Polish', flagCode: 'PL' },
  tr: { name: 'Turkish', flagCode: 'TR' },
  turkish: { name: 'Turkish', flagCode: 'TR' },
  sv: { name: 'Swedish', flagCode: 'SE' },
  swedish: { name: 'Swedish', flagCode: 'SE' },
  no: { name: 'Norwegian', flagCode: 'NO' },
  norwegian: { name: 'Norwegian', flagCode: 'NO' },
  da: { name: 'Danish', flagCode: 'DK' },
  danish: { name: 'Danish', flagCode: 'DK' },
  fi: { name: 'Finnish', flagCode: 'FI' },
  finnish: { name: 'Finnish', flagCode: 'FI' },
  el: { name: 'Greek', flagCode: 'GR' },
  greek: { name: 'Greek', flagCode: 'GR' },
  he: { name: 'Hebrew', flagCode: 'IL' },
  hebrew: { name: 'Hebrew', flagCode: 'IL' },
  th: { name: 'Thai', flagCode: 'TH' },
  thai: { name: 'Thai', flagCode: 'TH' },
  vi: { name: 'Vietnamese', flagCode: 'VN' },
  vietnamese: { name: 'Vietnamese', flagCode: 'VN' },
  id: { name: 'Indonesian', flagCode: 'ID' },
  indonesian: { name: 'Indonesian', flagCode: 'ID' },
  ms: { name: 'Malay', flagCode: 'MY' },
  malay: { name: 'Malay', flagCode: 'MY' },
  tl: { name: 'Tagalog', flagCode: 'PH' },
  tagalog: { name: 'Tagalog', flagCode: 'PH' },
  filipino: { name: 'Filipino', flagCode: 'PH' },
  uk: { name: 'Ukrainian', flagCode: 'UA' },
  ukrainian: { name: 'Ukrainian', flagCode: 'UA' },
  cs: { name: 'Czech', flagCode: 'CZ' },
  czech: { name: 'Czech', flagCode: 'CZ' },
  ro: { name: 'Romanian', flagCode: 'RO' },
  romanian: { name: 'Romanian', flagCode: 'RO' },
  hu: { name: 'Hungarian', flagCode: 'HU' },
  hungarian: { name: 'Hungarian', flagCode: 'HU' },
  catalan: { name: 'Catalan', flagCode: 'ES' },
  ca: { name: 'Catalan', flagCode: 'ES' },
}

// Category icons
export const CATEGORY_ICONS: Record<string, string> = {
  beauty: '💄',
  fashion: '👗',
  gaming: '🎮',
  food: '🍔',
  travel: '✈️',
  fitness: '💪',
  tech: '💻',
  music: '🎵',
  comedy: '😂',
  lifestyle: '🏠',
  education: '📚',
  sports: '⚽',
  art: '🎨',
  photography: '📷',
  parenting: '👶',
  automotive: '🚗',
  pets: '🐶',
  health: '🏥',
  finance: '💰',
  diy: '🔨',
  books: '📖',
  movies: '🎬',
  nature: '🌿',
  spirituality: '🧘',
}

// Country code to flag emoji
export const getCountryFlag = (code: string): string => {
  const upperCode = code.toUpperCase()
  // Check if it looks like a country code (2 letters)
  if (upperCode.length === 2 && /^[A-Z]{2}$/.test(upperCode)) {
    const codePoints = upperCode.split('').map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }
  return '🌍' // Default globe for unknown format
}

// Get display text for country select option
export const getCountryDisplay = (code: string): string => {
  const flag = getCountryFlag(code)
  const name = COUNTRY_NAMES[code.toUpperCase()] || code
  return `${flag} ${name}`
}

// Get language flag
export const getLanguageFlag = (language: string): string => {
  const lowerLang = language.toLowerCase().trim()
  const info = LANGUAGE_INFO[lowerLang]
  if (info) {
    return getCountryFlag(info.flagCode)
  }
  return '🌐' // Default globe for unknown language
}

// Get display text for language select option (with flag)
export const getLanguageDisplay = (language: string): string => {
  const lowerLang = language.toLowerCase().trim()
  const info = LANGUAGE_INFO[lowerLang]
  if (info) {
    return `${getCountryFlag(info.flagCode)} ${info.name}`
  }
  // Capitalize first letter for unknown languages
  const capitalized = language.charAt(0).toUpperCase() + language.slice(1).toLowerCase()
  return `🌐 ${capitalized}`
}

// Get language name only (without flag) - use when icon is shown separately
export const getLanguageName = (language: string): string => {
  const lowerLang = language.toLowerCase().trim()
  const info = LANGUAGE_INFO[lowerLang]
  if (info) {
    return info.name
  }
  // Capitalize first letter for unknown languages
  return language.charAt(0).toUpperCase() + language.slice(1).toLowerCase()
}

// Get category icon
export const getCategoryIcon = (category: string): string => {
  return CATEGORY_ICONS[category.toLowerCase()] || '📌'
}

// Parse JSON string or comma-separated list to array
export function parseToArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : [value]
  } catch {
    // Try comma-separated
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
}

// Parse JSON string or comma-separated list to string (for display)
export function parseToString(value: string | null): string {
  if (!value) return ''
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.join(', ') : value
  } catch {
    return value
  }
}
