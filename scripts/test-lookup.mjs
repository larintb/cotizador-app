/**
 * scripts/test-lookup.mjs
 *
 * Prueba masiva del lookup de catálogo contra la API NHTSA.
 *
 * Uso:
 *   node scripts/test-lookup.mjs
 *
 * Agrega tus VINs en el array TEST_VINS al final del archivo.
 * Cada entrada puede tener un `expectedPrice` opcional para verificar
 * que el valor encontrado sea exactamente el esperado.
 */

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Cargar catálogo ──────────────────────────────────────────────────────────

const catalogoData = require('../lib/catalogo_por_marca_modelo.json')
const catalogo = catalogoData.catalogo

// ─── Lógica de lookup (espejo de lib/catalogoLookup.ts) ───────────────────────

function normalizeForMatch(s) {
  return s
    .toUpperCase()
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/0/g, 'O')
    .trim()
}

function cylinderMatch(modelKey, cylinders) {
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

function resolveEffectiveYear(vehicleYear, availableYears) {
  if (!availableYears.length) return String(vehicleYear)
  const sorted = [...availableYears].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  if (vehicleYear <= min) return String(min)
  if (vehicleYear >= max) return String(max)
  return String(vehicleYear)
}

function getPriceForYear(entry, year) {
  const resueltos = entry.precios_resueltos
  const fuente = entry.fuente_precio
  const availableYears = Object.keys(resueltos).map(Number)
  if (!availableYears.length) return null
  const effectiveYear = resolveEffectiveYear(parseInt(year, 10), availableYears)
  if (resueltos[effectiveYear] == null) return null
  const rawSource = fuente[effectiveYear] ?? 'resuelto'
  return {
    value: resueltos[effectiveYear],
    source: rawSource === 'directo' ? 'exact' : 'generic-fallback',
    effectiveYear,
  }
}

function pickBestEntry(entries, year) {
  let fallback = null
  for (const entry of entries) {
    const result = getPriceForYear(entry, year)
    if (!result) continue
    if (result.source === 'exact') return result
    if (!fallback) fallback = result
  }
  return fallback
}

// ── MAKE aliases (espejo de catalogoLookup.ts — mantener sincronizado) ──────
const NHTSA_MAKE_ALIASES = {
  'VOLVO TRUCK': 'VOLVO', 'MERCEDES BENZ': 'MERCEDES-BENZ', 'VW': 'VOLKSWAGEN',
  'LAND-ROVER': 'LAND ROVER', 'ALFA-ROMEO': 'ALFA ROMEO', 'ROLLS-ROYCE': 'ROLLS ROYCE',
  'ASTON-MARTIN': 'ASTON MARTIN', 'WESTERN-STAR': 'WESTERN STAR',
  'MITSUBISHI FUSO': 'MITSUBISHI-FUSO',
  'RAM': 'DODGE',
}

// ── MODEL aliases (espejo de catalogoLookup.ts — mantener sincronizado) ─────
const NHTSA_MODEL_ALIASES = {
  FORD: {
    'F-150':'F150', 'F-250':'F250', 'F-350':'F350', 'F-450':'F450',
    'F-550':'F-SERIES SUPER DUTY',
    'CROWN VICTORIA':'CROW N VICTORIA',
    'EXPEDITION MAX':'EXPEDITION EL',
    'F-SUPER DUTY':'F-SERIES SUPER DUTY',
  },
  LINCOLN: { 'TOWN CAR':'TOW N CAR', 'BLACKWOOD':'BLACKW OOD' },
  DODGE: {
    'CARAVAN/GRAND CARAVAN':'GRAND CARAVAN',
    '1500':'RAM 1500 PICKUP', '2500':'RAM 2500 PICKUP', '3500':'RAM 3500 PICKUP',
  },
  CHEVROLET: { 'CAPTIVA SPORT':'CAPTIVA', 'ASTRO VAN':'ASTRO', 'S-10 PICKUP':'S10 PICKUP' },
  GMC: { 'SUBURBAN':'YUKON XL', 'JIMMY UTILITY':'JIMMY', 'SAVANA':'G 1500 VAN', 'SAVANA CARGO':'G 1500 VAN' },
  CHRYSLER: { 'TOWN AND COUNTRY':'TOW N & C0UNTRY', 'TOWN & COUNTRY':'TOW N & C0UNTRY', '300C':'300' },
  MAZDA: { 'MAZDA6':'MAZDA 6', 'MAZDA3':'MAZDA 3', 'MAZDA2':'MAZDA 2', 'MAZDA5':'MAZDA 5' },
  'MERCEDES-BENZ': {
    'ML-CLASS':'M CLASS', 'GL-CLASS':'GL CLASS', 'GLE-CLASS':'GLE CLASS',
    'GLS-CLASS':'GLS CLASS', 'GLC-CLASS':'GLC CLASS', 'SL-CLASS':'SL CLASS',
    'CLK-CLASS':'CLK CLASS', 'CLS-CLASS':'CLS CLASS', 'SLK-CLASS':'SLK CLASS',
  },
  PLYMOUTH: { 'GRAND VOYAGER':'VOYAGER' },
  TOYOTA: { 'COROLLA MATRIX':'COROLLA', 'MATRIX':'COROLLA' },
  SUBARU: { 'B9 TRIBECA':'TRIBECEA', 'TRIBECA':'TRIBECEA' },
  MASERATI: { 'GRANTURISMO':'GRAN TURISMO', 'GRAN TURISMO':'GRAN TURISMO', 'GRANTOURISMO':'GRAN TURISMO', 'GRANTURISMO CONVERTIBLE':'GRAN TURISMO CONVERTIBLE' },
  FREIGHTLINER: {
    'CST112':'CENTURY CLASS S/T 112', 'CST120':'CENTURY CLASS S/T 120',
    'FLC112':'CENTURY CLASS 112',      'FLC120':'CENTURY CLASS 120',
    'CC CONVENTIONAL':'CENTURY CLASS',
    'LONG CONV.':'FLD 120',
    'FLD112':'FLD 112', 'FLD120':'FLD 120', 'FLD132':'FLD 132',
    'M2106':'BUSINESS CLASS M2 106',   'M2112':'BUSINESS CLASS M2 112',
    'COL112':'COLUMBIA 112', 'COL120':'COLUMBIA 120', 'COR132':'CORONADO 132',
  },
  KENWORTH: {
    'T600':'T600', 'T800':'T800', 'W900':'W900', 'T300':'T300',
    'T2000':'T600/800/2000', 'T660':'T660', 'T680':'T660', 'T700':'T660',
    'T6 SERIES':'T600/800/2000', 'T8 SERIES':'T800',
  },
  PETERBILT: {
    '379':'377/378/379/385/387', '385':'377/378/379/385/387', '387':'377/378/379/385/387',
    '386':'382/386/388/389/587', '388':'382/386/388/389/587', '389':'382/386/388/389/587',
    '357':'357', '567':'567',
  },
  INTERNATIONAL: { '4300':'4300', '4400':'4400', '8600':'8600', 'LT':'LT', 'RH':'RH', 'HV':'HV', 'F-2574':'2000/5000 SERIES', 'F-2674':'2000/5000 SERIES', 'F-5070':'5/7000 SERIES', '4900':'MEDIUM DUTY CONVENTIONAL', '4700':'MEDIUM DUTY CONVENTIONAL', '4800':'MEDIUM DUTY CONVENTIONAL' },
  MACK:    { 'CXU':'CX', 'CXU (PINNACLE)':'PINNACLE SERIES', 'CHU':'CH', 'GU':'GRANITE', 'AN':'ANTHEM' },
  VOLVO:   { 'VNL':'VN SERIES', 'VNM':'VN SERIES', 'VNX':'VN/VT/VNX SERIES', 'VHD':'UVHD' },
  STERLING:{ 'AT9500':'AT9500', 'AT9513':'AT9500', 'L9500':'L9500', 'LT9500':'LT9500' },
  HYUNDAI: { 'SANTA FE SPORT':'SANTA FE' },
  INFINITI: { 'JX35':'QX60', 'FX35':'FX 35', 'FX50':'FX 50', 'FX37':'FX 35' },
  SATURN: { 'SC1':'S SERIES', 'SC2':'S SERIES', 'SL1':'S SERIES', 'SL2':'S SERIES' },
  SUZUKI: { 'GRAND VITARA XL-7':'XL-7 HARD TOP' },
  SMART: { 'FORTWO':'FORTW O' },
  FIAT: { '500L':'500', '500E':'500' },
  MINI: { 'COUNTRYMAN':'COOPER COUNTRYMAN', 'CLUBMAN':'COOPER CLUBMAN', 'PACEMAN':'COOPER PACEMAN', 'HARDTOP':'COOPER HARDTOP', 'ROADSTER':'COOPER ROADSTER', 'COUPE':'COOPER COUPE', 'CONVERTIBLE':'COOPER CONVERTIBLE' },
  BMW: {
    '318I':'3 SERIES','318IS':'3 SERIES','320I':'3 SERIES','323I':'3 SERIES',
    '325I':'3 SERIES','325IS':'3 SERIES','325CI':'3 SERIES','325XI':'3 SERIES',
    '328I':'3 SERIES','328XI':'3 SERIES','330I':'3 SERIES','330XI':'3 SERIES',
    '335I':'3 SERIES','335XI':'3 SERIES','340I':'3 SERIES',
    '520I':'5 SERIES','525I':'5 SERIES','525XI':'5 SERIES','528I':'5 SERIES',
    '528XI':'5 SERIES','530I':'5 SERIES','530XI':'5 SERIES','535I':'5 SERIES',
    '535XI':'5 SERIES','540I':'5 SERIES','545I':'5 SERIES','550I':'5 SERIES',
    '730I':'7 SERIES','740I':'7 SERIES','740IL':'7 SERIES','745I':'7 SERIES','745LI':'7 SERIES',
    '750I':'7 SERIES','750IL':'7 SERIES','750LI':'7 SERIES','750LI, ALPINA B7':'7 SERIES',
    '760I':'7 SERIES','760LI':'7 SERIES',
    '120I':'1 SERIES','128I':'1 SERIES','135I':'1 SERIES',
    '228I':'2 SERIES','230I':'2 SERIES','235I':'2 SERIES',
    '630I':'6 SERIES','640I':'6 SERIES','645CI':'6 SERIES','650I':'6 SERIES',
    '840I':'8 SERIES','850I':'8 SERIES',
  },
}

function lookupCustomsValue(make, model, year, cylinders) {
  const rawMakeKey = (make ?? '').toUpperCase().trim()
  let makeKey = NHTSA_MAKE_ALIASES[rawMakeKey] ?? rawMakeKey
  let modelKey = (model ?? '').toUpperCase().trim()
  // Toyota puede venir con modelos de Scion → redirigir a marca SCION
  if (makeKey === 'TOYOTA' && modelKey.startsWith('SCION ')) {
    makeKey = 'SCION'
    modelKey = modelKey.slice(6)
  }
  const resolvedModel = NHTSA_MODEL_ALIASES[makeKey]?.[modelKey] ?? modelKey
  const modelNorm = normalizeForMatch(resolvedModel)
  const marcas = catalogo[makeKey]
  if (!marcas) return null

  const entries = Object.entries(marcas)

  for (const [mkey, mEntries] of entries) {
    if (normalizeForMatch(mkey) === modelNorm && cylinderMatch(mkey, cylinders)) {
      const r = pickBestEntry(mEntries, year)
      if (r) return r
    }
  }
  for (const [mkey, mEntries] of entries) {
    const mn = normalizeForMatch(mkey)
    if ((mn.startsWith(modelNorm) || modelNorm.startsWith(mn)) && cylinderMatch(mkey, cylinders)) {
      const r = pickBestEntry(mEntries, year)
      if (r) return r
    }
  }
  for (const [mkey, mEntries] of entries) {
    const mn = normalizeForMatch(mkey)
    if (mn.startsWith(modelNorm) || modelNorm.startsWith(mn)) {
      const r = pickBestEntry(mEntries, year)
      if (r) return r
    }
  }
  return null
}

// ─── NHTSA ────────────────────────────────────────────────────────────────────

async function decodeVin(vin) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const r = data.Results?.[0]
  if (!r || r.ErrorCode !== '0') return null
  return {
    make: r.Make,
    model: r.Model,
    year: r.ModelYear,
    cylinders: r.EngineCylinders,
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GRAY   = '\x1b[90m'
const BOLD   = '\x1b[1m'
const RESET  = '\x1b[0m'

function pad(s, n) { return String(s ?? '').padEnd(n).slice(0, n) }
function rpad(s, n) { return String(s ?? '').padStart(n).slice(-n) }

async function runTests(vins) {
  console.log(`\n${BOLD}Probando ${vins.length} VINs contra catálogo_por_marca_modelo.json${RESET}\n`)

  const header = [
    pad('VIN', 18),
    pad('MAKE', 12),
    pad('MODEL', 22),
    pad('YEAR', 6),
    pad('CYL', 4),
    pad('EFF.YEAR', 9),
    rpad('PRICE USD', 10),
    pad('SOURCE', 16),
    'STATUS',
  ].join('  ')

  console.log(GRAY + header + RESET)
  console.log(GRAY + '─'.repeat(header.length) + RESET)

  let found = 0, notFound = 0, errors = 0

  for (const { vin, expectedPrice } of vins) {
    let vehicle = null
    let status = ''
    let color = ''

    try {
      vehicle = await decodeVin(vin)
    } catch (e) {
      errors++
      console.log(
        `${RED}${pad(vin, 18)}  ${pad('ERROR NHTSA', 75)}  ERROR${RESET}`
      )
      continue
    }

    if (!vehicle) {
      errors++
      console.log(
        `${RED}${pad(vin, 18)}  ${pad('VIN inválido', 75)}  ERROR${RESET}`
      )
      continue
    }

    const result = lookupCustomsValue(vehicle.make, vehicle.model, vehicle.year, vehicle.cylinders)

    if (result) {
      found++
      const priceOk = expectedPrice == null || result.value === expectedPrice
      color = priceOk ? GREEN : YELLOW
      status = priceOk
        ? 'OK'
        : `EXPECTED ${expectedPrice} GOT ${result.value}`
    } else {
      notFound++
      color = RED
      status = 'NOT FOUND'
    }

    console.log(
      color +
      [
        pad(vin, 18),
        pad(vehicle.make, 12),
        pad(vehicle.model, 22),
        pad(vehicle.year, 6),
        pad(vehicle.cylinders, 4),
        pad(result?.effectiveYear ?? '-', 9),
        rpad(result?.value ?? '-', 10),
        pad(result?.source ?? '-', 16),
        status,
      ].join('  ') +
      RESET
    )

    // Pequeña pausa para no saturar NHTSA
    await new Promise(r => setTimeout(r, 120))
  }

  console.log(GRAY + '─'.repeat(header.length) + RESET)
  console.log(
    `\n${BOLD}Resultados:${RESET}  ` +
    `${GREEN}${found} encontrados${RESET}  ` +
    `${RED}${notFound} no encontrados${RESET}  ` +
    `${YELLOW}${errors} errores${RESET}` +
    `  (total: ${vins.length})\n`
  )
}

// ─── LISTA DE VINs ────────────────────────────────────────────────────────────
// Agrega aquí tus VINs. `expectedPrice` es opcional.
// Si lo pones, el test verifica que el precio sea exactamente ese valor (en USD).
// Batch 9 — generado con: python scripts/vin_scraper.py -n 100 --js

const TEST_VINS = [
  { vin: '3FELFU7F3VMA36631' },
  { vin: 'JHMBB2250SC007263' },
  { vin: '4T1BK1EB0DU017197' },
  { vin: '5NPEC4AC0CH414402' },
  { vin: '2A4RR6DX1AR142981' },
  { vin: '1FTFW1ET2EFC09276' },
  { vin: '3FAFP07Z36R218846' },
  { vin: '5GZCZ33Z47S853254' },
  { vin: 'WBAPH7G57BNM58834' },
  { vin: '1N4AL3AP8DC104559' },
  { vin: 'JT3HN86RXV0067967' },
  { vin: '1FAFP53295A260534' },
  { vin: '1C4PJMAK1CW103223' },
  { vin: '1GTEC14X05Z116358' },
  { vin: '1J8GS48K98C235571' },
  { vin: 'JM3TB3MV6A0204342' },
  { vin: '1FDKF37G7VEB50303' },
  { vin: 'WMWZC3C54EWT00326' },
  { vin: '2D4GV58215H123833' },
  { vin: '1FTFX1CTXEFB08843' },
  { vin: 'KMHDN45D91U082760' },
  { vin: '1N6AA06B25N542167' },
  { vin: '1N4AL3AP0EC102306' },
  { vin: '1C4BJWDG5EL249996' },
  { vin: '1FDWF37S5XED68409' },
  { vin: '19UYA42421A023378' },
  { vin: '1FMCU0C79CKA32797' },
  { vin: '2HGFG12677H573871' },
  { vin: '2C3AA63H15H644393' },
  { vin: '1J4FJ27S8VL592760' },
  { vin: '2A4GM48416R762408' },
  { vin: 'JM1BL1V77C1691618' },
  { vin: '1C3LC65M18N268299' },
  { vin: '2HGFG12696H511788' },
  { vin: '1C3CDFAA8ED773105' },
  { vin: 'JNKCV51E96M511146' },
  { vin: '1FTDA14U8VZA95055' },
  { vin: '1FTFX1ET5BFB27695' },
  { vin: 'WP1AC29PX9LA81154' },
  { vin: '1GTR2VE30BZ236874' },
  { vin: '3G7DB03E81S548792' },
  { vin: '5FRYD3H41EB013637' },
  { vin: '1FABP41E1KF208593' },
  { vin: '3N1BC13E58L374747' },
  { vin: '5YJP02WDXJC390369' },
  { vin: '1GC1KXE81EF192913' },
  { vin: '1GDGG31V531903938' },
  { vin: '1FMCU931X8KD14759' },
  { vin: '5N1AL0MM8DC351411' },
  { vin: '5TFPX4EN8BX001607' },
  { vin: '2G2WP552581135217' },
  { vin: '2C3JA63HX5H530263' },
  { vin: '1G2ZH178X64135221' },
  { vin: '4T1BF18B1WU279877' },
  { vin: '1FT7W2BT8CEB48369' },
  { vin: '3N1AB51DX5L549411' },
  { vin: 'SALGS2VF2FA203906' },
  { vin: '5N1AN0NW2BC524248' },
  { vin: '1LNHM81W2YY863609' },
  { vin: 'WDBHA22E6RF038295' },
  { vin: '3N1AB61E07L628491' },
  { vin: 'JTDZN3EU5E3296371' },
  { vin: 'WBAFU7C53CDU62643' },
  { vin: '2FMDK39C18BB10832' },
  { vin: 'WA1YD64BX4N043267' },
  { vin: '1FDJE37F3VHA64605' },
  { vin: '2G1WC581169284256' },
  { vin: 'WDBRF40J23A528206' },
  { vin: 'JTDKB20UX97843046' },
  { vin: '1YVHZ8BH6B5M18279' },
  { vin: '1GCCS19W928133011' },
  { vin: '1MEFM50U83A601183' },
  { vin: 'JHMZF1D64FS000640' },
  { vin: '1G3NL12T6YC328818' },
  { vin: 'WAUEFGFF1F1001361' },
  { vin: 'JM3TB2MA6A0236120' },
  { vin: '1N4AL3AP9DC913312' },
  { vin: '1G1JC1240T7258539' },
  { vin: '2A8HR44H68R831741' },
  { vin: 'WDBEA30D9HA532472' },
  { vin: '3N1AB7AP9EY266992' },
  { vin: 'JNRAS18U39M104466' },
  { vin: '1HTMMAAL27H372507' },
  { vin: '4T4BE46K48R041022' },
  { vin: '1N4AL2AP6CN520865' },
  { vin: '4T1BK36B26U081822' },
  { vin: '1GCCS14Z8R8144836' },
  { vin: '5TDDK3EH7BS067285' },
  { vin: '1G3AL54N3N6438546' },
  { vin: '2B3HD46R52H246515' },
  { vin: '3N1BC1CP1CK200836' },
  { vin: 'YV4902RD3F2585238' },
  { vin: '5NPEB4AC5CH356628' },
  { vin: '1C6RR7LMXFS534678' },
  { vin: '3B7HC13Y1VG704714' },
  { vin: '1FT7W2BTXEEA83320' },
  { vin: 'KNDMB233286231813' },
  { vin: 'JN8AR07Y3XW368111' },
  { vin: '5NPEC4AC7DH603274' },
  { vin: '1FTFW1ET9EKE96901' },
];

runTests(TEST_VINS)
