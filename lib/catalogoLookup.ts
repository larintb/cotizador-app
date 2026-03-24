// lib/catalogoLookup.ts
// Lookup de valor aduanal usando catalogo_por_marca_modelo.json como fuente de verdad.
// Reemplaza la función lookupCustomsValue de lib/customsValues.js.
// Misma firma: lookupCustomsValue(make, model, year, cylinders) -> { value, source } | null

import catalogoData from './catalogo_por_marca_modelo.json'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CatalogoEntry {
  id: number
  fraccion: string
  subseccion: string | null
  descripcion_nico: string
  umt: string
  precios_directos: Record<string, number>
  generico_mismo_grupo: {
    id: number
    row: number
    precios: Record<string, number>
  } | null
  precios_resueltos: Record<string, number>
  fuente_precio: Record<string, string>
}

interface CatalogoData {
  anios: number[]
  catalogo: Record<string, Record<string, CatalogoEntry[]>>
}

const catalogo = (catalogoData as unknown as CatalogoData).catalogo

// ─── Helpers internos ─────────────────────────────────────────────────────────

// Normaliza para comparación: guión → espacio, un espacio, 0→O (typos del xlsx).
// El orden importa: primero guión→espacio, luego colapsar espacios.
// Así "MONTANA-SV6" y "Montana SV6" producen el mismo token "MONTANA SV6".
function normalizeForMatch(s: string): string {
  return s
    .toUpperCase()
    .replace(/-/g, ' ')   // guión → espacio (antes de colapsar)
    .replace(/\s+/g, ' ') // colapsar espacios múltiples
    .replace(/0/g, 'O')   // 0 → O (typos del xlsx)
    .trim()
}

// Determina si el nombre de un modelo en el catálogo es consistente con
// el conteo de cilindros dado. Idéntico al filtro del catálogo anterior.
function cylinderMatch(modelKey: string, cylinders: string): boolean {
  if (!cylinders) return true
  const n = parseInt(cylinders, 10)
  if (isNaN(n)) return true
  const m = modelKey.toUpperCase()
  if (n === 4) return /4\s*CYL|L4|I4/.test(m)
  if (n === 6) return /6\s*CYL|V6|I6/.test(m)
  if (n === 8) return /8\s*CYL|V8/.test(m)
  if (n === 3) return /3\s*CYL/.test(m)
  if (n === 5) return /5\s*CYL/.test(m)
  if (n === 10) return /V10|10\s*CYL/.test(m)
  return true
}

/**
 * Resuelve el año efectivo a usar en el catálogo.
 *
 * Reglas:
 * - Si el año está dentro del rango disponible → se usa tal cual.
 * - Si el año es menor al mínimo disponible → se usa el mínimo (piso).
 *   Esto garantiza que vehículos de 2013, 2008 o 1987 usen el precio de 2014.
 * - Si el año es mayor al máximo disponible → se usa el máximo (techo).
 *
 * @param vehicleYear    Año modelo del vehículo (número).
 * @param availableYears Lista de años disponibles en precios_resueltos (números).
 * @returns              El año efectivo como string, listo para indexar el catálogo.
 */
export function resolveEffectiveYear(vehicleYear: number, availableYears: number[]): string {
  if (availableYears.length === 0) return String(vehicleYear)
  const sorted = [...availableYears].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  if (vehicleYear <= min) return String(min)
  if (vehicleYear >= max) return String(max)
  return String(vehicleYear)
}

// Obtiene el precio desde precios_resueltos aplicando resolveEffectiveYear.
// Nunca falla por año fuera de rango.
function getPriceForYear(
  entry: CatalogoEntry,
  year: string
): { value: number; source: string } | null {
  const resueltos = entry.precios_resueltos
  const fuente = entry.fuente_precio

  const availableYears = Object.keys(resueltos).map(Number)
  if (availableYears.length === 0) return null

  const effectiveYear = resolveEffectiveYear(parseInt(year, 10), availableYears)
  if (resueltos[effectiveYear] == null) return null

  const rawSource = fuente[effectiveYear] ?? 'resuelto'
  return {
    value: resueltos[effectiveYear],
    source: rawSource === 'directo' ? 'exact' : 'generic-fallback',
  }
}

// De un array de entradas para el mismo nombre de modelo, escoge la mejor
// para el año dado. Prioriza precios directos sobre genéricos.
function pickBestEntry(
  entries: CatalogoEntry[],
  year: string
): { value: number; source: string } | null {
  let fallback: { value: number; source: string } | null = null

  for (const entry of entries) {
    const result = getPriceForYear(entry, year)
    if (!result) continue
    if (result.source === 'exact') return result // precio directo gana de inmediato
    if (!fallback) fallback = result
  }

  return fallback
}

// ─── Aliases NHTSA → catálogo ─────────────────────────────────────────────────
// Problema 1 — MAKE alias: NHTSA a veces devuelve nombres de marca que no coinciden
// con el catálogo (ej. "VOLVO TRUCK" → catálogo tiene "VOLVO").
// makeKey.toUpperCase() → clave del catálogo.

export const NHTSA_MAKE_ALIASES: Record<string, string> = {
  'VOLVO TRUCK':      'VOLVO',
  'MERCEDES-BENZ':    'MERCEDES-BENZ',
  'MERCEDES BENZ':    'MERCEDES-BENZ',
  'VW':               'VOLKSWAGEN',
  'LAND-ROVER':       'LAND ROVER',
  'ALFA-ROMEO':       'ALFA ROMEO',
  'ROLLS-ROYCE':      'ROLLS ROYCE',
  'ASTON-MARTIN':     'ASTON MARTIN',
  'WESTERN-STAR':     'WESTERN STAR',
  'MITSUBISHI FUSO':  'MITSUBISHI-FUSO',
  // RAM es una marca separada desde 2009 pero el catálogo la tiene bajo DODGE
  'RAM':              'DODGE',
}

// Problema 2 — MODEL alias: NHTSA devuelve códigos cortos (ej. "CST120") o nombres
// de motor específicos (ej. "530i") mientras el catálogo usa nombres de serie o
// nombres descriptivos largos (ej. "5 SERIES", "CENTURY CLASS S/T 120 BBC ALUM CAB").
// modelKey.toUpperCase() → fragmento que usa el catálogo.
// Agregar aquí cada vez que un VIN aparezca como NOT FOUND por esta razón.

export const NHTSA_MODEL_ALIASES: Record<string, Record<string, string>> = {
  FREIGHTLINER: {
    // Century Class S/T (CST)
    'CST112': 'CENTURY CLASS S/T 112',
    'CST120': 'CENTURY CLASS S/T 120',
    // Century Class (FLC)
    'FLC112': 'CENTURY CLASS 112',
    'FLC120': 'CENTURY CLASS 120',
    // CC Conventional = Century Class generic
    'CC CONVENTIONAL': 'CENTURY CLASS',
    // "Long Conv." = FLD 120"-132" convencional largo
    'LONG CONV.': 'FLD 120',
    // FLD
    'FLD112': 'FLD 112',
    'FLD120': 'FLD 120',
    'FLD132': 'FLD 132',
    // Business Class M2
    'M2106':  'BUSINESS CLASS M2 106',
    'M2112':  'BUSINESS CLASS M2 112',
    // Columbia
    'COL112': 'COLUMBIA 112',
    'COL120': 'COLUMBIA 120',
    // Coronado
    'COR132': 'CORONADO 132',
    // Cascadia
    'CASCADIA 113': 'CASCADIA 113',
    'CASCADIA 125': 'CASCADIA 125',
  },
  KENWORTH: {
    'T600':     'T600',
    'T800':     'T800',
    'W900':     'W900',
    'T300':     'T300',
    'T2000':    'T600/800/2000',
    'T660':     'T660',
    'T680':     'T660',
    'T700':     'T660',
    // "T6 Series" es el T600 bajo otra denominación NHTSA
    'T6 SERIES': 'T600/800/2000',
    'T8 SERIES': 'T800',
  },
  PETERBILT: {
    '379': '377/378/379/385/387',
    '385': '377/378/379/385/387',
    '387': '377/378/379/385/387',
    '386': '382/386/388/389/587',
    '388': '382/386/388/389/587',
    '389': '382/386/388/389/587',
    '357': '357',
    '567': '567',
  },
  INTERNATIONAL: {
    '4300': '4300',
    '4400': '4400',
    '8600': '8600',
    'LT':   'LT',
    'RH':   'RH',
    'HV':   'HV',
    // F-series medium duty → catálogo "2000/5000 SERIES"
    'F-2574': '2000/5000 SERIES',
    'F-2674': '2000/5000 SERIES',
    'F-5070': '5/7000 SERIES',
    // 4900 series → MEDIUM DUTY CONVENTIONAL (clase 6-7)
    '4900': 'MEDIUM DUTY CONVENTIONAL',
    '4700': 'MEDIUM DUTY CONVENTIONAL',
    '4800': 'MEDIUM DUTY CONVENTIONAL',
  },
  // FORD: catálogo usa "F150" (sin guión) pero NHTSA devuelve "F-150" (con guión)
  // F-550 no existe en catálogo: redirige a "F-SERIES SUPER DUTY" que sí existe.
  // E-series NO necesita alias: catálogo tiene "E-150 SERIES" (con guión) → normaliza igual.
  FORD: {
    'F-150': 'F150',  'F-250': 'F250',  'F-350': 'F350',  'F-450': 'F450',
    'F-550': 'F-SERIES SUPER DUTY',
    'CROWN VICTORIA': 'CROW N VICTORIA',
    // Expedition MAX = Expedition EL (extended wheelbase, rebadged name)
    'EXPEDITION MAX': 'EXPEDITION EL',
    // "F-Super Duty" (nombre genérico pre-1999) → catálogo "F-SERIES SUPER DUTY"
    'F-SUPER DUTY': 'F-SERIES SUPER DUTY',
  },
  // LINCOLN: Town Car tiene typo en el catálogo ("TOW N CAR-V8")
  LINCOLN: {
    'TOWN CAR': 'TOW N CAR',
    'BLACKWOOD': 'BLACKW OOD',
  },
  // CHRYSLER: "Town and Country" — catálogo tiene typo doble "TOW N & C0UNTRY-V6"
  // "300C" → catálogo tiene "300-V8" y "300-V6"
  CHRYSLER: {
    'TOWN AND COUNTRY': 'TOW N & C0UNTRY',
    'TOWN & COUNTRY':   'TOW N & C0UNTRY',
    '300C': '300',
  },
  // DODGE/RAM: "Caravan/Grand Caravan" tiene slash; RAM pickups están bajo DODGE
  DODGE: {
    'CARAVAN/GRAND CARAVAN': 'GRAND CARAVAN',
    // RAM pickups (make alias RAM→DODGE ya resuelve la marca)
    '1500': 'RAM 1500 PICKUP',
    '2500': 'RAM 2500 PICKUP',
    '3500': 'RAM 3500 PICKUP',
  },
  // CHEVROLET: modelos que necesitan alias para partial match
  CHEVROLET: {
    'CAPTIVA SPORT': 'CAPTIVA',
    'ASTRO VAN':     'ASTRO',
    // "S-10 Pickup" (NHTSA con guión) → catálogo "S10 PICKUP" (sin guión/espacio)
    'S-10 PICKUP':   'S10 PICKUP',
  },
  // GMC: Suburban fue rebadgeado como Yukon XL en el catálogo
  // "Jimmy Utility" → catálogo tiene "JIMMY-1/2 TON-V6"
  GMC: {
    'SUBURBAN':       'YUKON XL',
    'JIMMY UTILITY':  'JIMMY',
  },
  // MAZDA: NHTSA devuelve "Mazda6" junto (sin espacio), catálogo tiene "MAZDA 6-..."
  MAZDA: {
    'MAZDA6': 'MAZDA 6',
    'MAZDA3': 'MAZDA 3',
    'MAZDA2': 'MAZDA 2',
    'MAZDA5': 'MAZDA 5',
  },
  // MERCEDES-BENZ: NHTSA "ML-Class" → catálogo "M CLASS"
  'MERCEDES-BENZ': {
    'ML-CLASS': 'M CLASS',
    'GL-CLASS': 'GL CLASS',
    'GLE-CLASS': 'GLE CLASS',
    'GLS-CLASS': 'GLS CLASS',
    'GLC-CLASS': 'GLC CLASS',
    'SL-CLASS': 'SL CLASS',
    'CLK-CLASS': 'CLK CLASS',
    'CLS-CLASS': 'CLS CLASS',
    'SLK-CLASS': 'SLK CLASS',
    'AMG GT': 'AMG GT',
  },
  // PLYMOUTH: "Grand Voyager" → catálogo tiene solo "VOYAGER-V6"
  PLYMOUTH: {
    'GRAND VOYAGER': 'VOYAGER',
  },
  // TOYOTA: "Corolla Matrix" → reducir a "COROLLA" para partial match
  TOYOTA: {
    'COROLLA MATRIX': 'COROLLA',
    'MATRIX': 'COROLLA',
  },
  // SUBARU: catálogo tiene typo "TRIBECEA" en lugar de "TRIBECA"
  SUBARU: {
    'B9 TRIBECA': 'TRIBECEA',
    'TRIBECA':    'TRIBECEA',
  },
  // MASERATI: NHTSA "Granturismo" (una palabra) vs catálogo "GRAN TURISMO" (dos palabras)
  MASERATI: {
    'GRANTURISMO':            'GRAN TURISMO',
    'GRAN TURISMO':           'GRAN TURISMO',
    'GRANTOURISMO':           'GRAN TURISMO',
    'GRANTURISMO CONVERTIBLE':'GRAN TURISMO CONVERTIBLE',
  },
  // MACK: NHTSA devuelve "CXU (Pinnacle)" con sufijo entre paréntesis
  MACK: {
    'CXU': 'CX',
    'CXU (PINNACLE)': 'PINNACLE SERIES',
    'CHU': 'CH',
    'GU':  'GRANITE',
    'AN':  'ANTHEM',
  },
  // VOLVO trucks: NHTSA usa "VNL/VNM/VNX" pero el catálogo agrupa como "VN SERIES"
  VOLVO: {
    'VNL': 'VN SERIES',
    'VNM': 'VN SERIES',
    'VNX': 'VN/VT/VNX SERIES',
    'VHD': 'UVHD',
  },
  STERLING: {
    'AT9500': 'AT9500',
    'AT9513': 'AT9500',
    'L9500':  'L9500',
    'LT9500': 'LT9500',
  },
  // HYUNDAI: "Santa Fe Sport" es la variante deportiva de Santa Fe (4 cil.)
  HYUNDAI: {
    'SANTA FE SPORT': 'SANTA FE',
  },
  // INFINITI: JX35 fue rebadgeado como QX60 en 2014; el catálogo solo tiene QX60
  INFINITI: {
    'JX35': 'QX60',
  },
  // SATURN: SC1/SC2 son parte de la S-Series; el catálogo solo tiene "S SERIES-4 CYL."
  SATURN: {
    'SC1': 'S SERIES',
    'SC2': 'S SERIES',
    'SL1': 'S SERIES',
    'SL2': 'S SERIES',
  },
  // SUZUKI: "Grand Vitara XL-7" → catálogo "XL-7 HARD TOP-V6"
  SUZUKI: {
    'GRAND VITARA XL-7': 'XL-7 HARD TOP',
  },
  // SMART: catálogo tiene typo "FORTW O-3 CYL." (espacio entre W y O)
  SMART: {
    'FORTWO': 'FORTW O',
  },
  // FIAT: catálogo tiene "500-4 CYL"; 500L y 500X deben redirigir
  FIAT: {
    '500L': '500',
    '500E': '500',
  },
  // BMW: NHTSA devuelve número de motor ("530I", "328I") en vez de nombre de serie
  BMW: {
    // Serie 3
    '318I': '3 SERIES', '318IS': '3 SERIES',
    '320I': '3 SERIES', '323I': '3 SERIES',
    '325I': '3 SERIES', '325IS': '3 SERIES', '325CI': '3 SERIES', '325XI': '3 SERIES', '328I': '3 SERIES',
    '328XI': '3 SERIES', '330I': '3 SERIES', '330XI': '3 SERIES',
    '335I': '3 SERIES', '335XI': '3 SERIES', '340I': '3 SERIES',
    // Serie 5
    '520I': '5 SERIES', '523I': '5 SERIES', '525I': '5 SERIES',
    '525XI': '5 SERIES', '528I': '5 SERIES', '528XI': '5 SERIES',
    '530I': '5 SERIES', '530XI': '5 SERIES', '535I': '5 SERIES',
    '535XI': '5 SERIES', '540I': '5 SERIES', '545I': '5 SERIES',
    '550I': '5 SERIES',
    // Serie 7
    '730I': '7 SERIES', '740I': '7 SERIES', '740IL': '7 SERIES',
    '745I': '7 SERIES', '750I': '7 SERIES', '750IL': '7 SERIES',
    '745LI': '7 SERIES', '750LI': '7 SERIES', '750LI, ALPINA B7': '7 SERIES',
    '760I': '7 SERIES', '760LI': '7 SERIES',
    // Serie 1 y 2
    '120I': '1 SERIES', '128I': '1 SERIES', '135I': '1 SERIES',
    '228I': '2 SERIES', '230I': '2 SERIES', '235I': '2 SERIES',
    // Serie 6
    '630I': '6 SERIES', '640I': '6 SERIES', '645CI': '6 SERIES',
    '650I': '6 SERIES',
    // Serie 8
    '840I': '8 SERIES', '850I': '8 SERIES',
  },
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Busca el valor aduanal de un vehículo en el nuevo catálogo.
 *
 * @param make      Marca del vehículo (ej. "FORD", "TOYOTA")
 * @param model     Modelo tal como viene del VIN decode (ej. "FOCUS", "CAMRY")
 * @param year      Año modelo calendario (ej. "2021")
 * @param cylinders Cantidad de cilindros (ej. "4", "6") — usado como desempate
 * @returns         { value: number (USD), source: string } o null si no se encuentra
 */
export function lookupCustomsValue(
  make: string,
  model: string,
  year: string,
  cylinders: string
): { value: number; source: string } | null {
  const rawMakeKey = make?.toUpperCase().trim()
  // Resolver alias de marca: "VOLVO TRUCK" → "VOLVO", "RAM" → "DODGE", etc.
  let makeKey = NHTSA_MAKE_ALIASES[rawMakeKey] ?? rawMakeKey
  let modelKey = model?.toUpperCase().trim()

  // Redirecto especial: Toyota puede venir con modelos de Scion ("Scion tC", "Scion xB")
  // porque Toyota era dueño de Scion. El catálogo los tiene bajo la marca SCION.
  if (makeKey === 'TOYOTA' && modelKey.startsWith('SCION ')) {
    makeKey = 'SCION'
    modelKey = modelKey.slice(6) // quitar "SCION " del frente
  }

  // Resolver alias de modelo: "CST120" → "CENTURY CLASS S/T 120", "530I" → "5 SERIES", etc.
  const resolvedModel = NHTSA_MODEL_ALIASES[makeKey]?.[modelKey] ?? modelKey
  const modelNorm = normalizeForMatch(resolvedModel)

  const marcas = catalogo[makeKey]
  if (!marcas) return null

  const entries = Object.entries(marcas) // [modelName, CatalogoEntry[]]

  // ── Paso 1: nombre exacto + cilindros correctos
  for (const [mkey, mEntries] of entries) {
    if (normalizeForMatch(mkey) === modelNorm && cylinderMatch(mkey, cylinders)) {
      const result = pickBestEntry(mEntries, year)
      if (result) return result
    }
  }

  // ── Paso 2: nombre parcial (modelo base) + cilindros correctos
  for (const [mkey, mEntries] of entries) {
    const mkeyNorm = normalizeForMatch(mkey)
    if (
      (mkeyNorm.startsWith(modelNorm) || modelNorm.startsWith(mkeyNorm)) &&
      cylinderMatch(mkey, cylinders)
    ) {
      const result = pickBestEntry(mEntries, year)
      if (result) return result
    }
  }

  // ── Paso 3: nombre parcial sin filtro de cilindros (último recurso)
  for (const [mkey, mEntries] of entries) {
    const mkeyNorm = normalizeForMatch(mkey)
    if (mkeyNorm.startsWith(modelNorm) || modelNorm.startsWith(mkeyNorm)) {
      const result = pickBestEntry(mEntries, year)
      if (result) return result
    }
  }

  return null
}
