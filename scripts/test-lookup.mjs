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
  GMC: { 'SUBURBAN':'YUKON XL', 'JIMMY UTILITY':'JIMMY' },
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
  INFINITI: { 'JX35':'QX60' },
  SATURN: { 'SC1':'S SERIES', 'SC2':'S SERIES', 'SL1':'S SERIES', 'SL2':'S SERIES' },
  SUZUKI: { 'GRAND VITARA XL-7':'XL-7 HARD TOP' },
  SMART: { 'FORTWO':'FORTW O' },
  FIAT: { '500L':'500', '500E':'500' },
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

const TEST_VINS = [
  { vin: '1FMYU04141KF59739' },
  { vin: '2G1WG5EK2B1194852' },
  { vin: '5TDZT38A05S244989' },
  { vin: 'KMHD35LH4EU215111' },
  { vin: '5J6YH18686L015017' },
  { vin: '1G11B5SL3EF122237' },
  { vin: '1FTRX17W12NC04802' },
  { vin: '1NXBR32EX8Z989045' },
  { vin: '1GKEK63UX5J205087' },
  { vin: '1GCRCREA5CZ255084' },
  { vin: '3C6JR7EG7DG574256' },
  { vin: '4B3AG42G54E140054' },
  { vin: '2HGFB2F94DH536619' },
  { vin: '1B7GL23X5SS374945' },
  { vin: '1HGCM566X3A059213' },
  { vin: '3C3EL45HXXT574674' },
  { vin: '1FAFP40604F233368' },
  { vin: '1GNDT13W0W2200279' },
  { vin: '5UXWX7C51CL736386' },
  { vin: 'SAJNL5046HC133922' },
  { vin: '1J8GR48KX8C165462' },
  { vin: '1G1GZ11G5HP145620' },
  { vin: '5NPEC4AC2BH023735' },
  { vin: 'JTHBA30G040014733' },
  { vin: '19XFA1F65AE030046' },
  { vin: 'JA4MW51R82J069150' },
  { vin: '1N4BU31D9VC121301' },
  { vin: '1C3CCBBG2DN528193' },
  { vin: '1FUYDXYB1YPG11546' },
  { vin: '1D7HU18D45S216407' },
  { vin: 'JTHHE5BC0F5000373' },
  { vin: '1B3LC46J78N257443' },
  { vin: '4B3AU42Y4VE157804' },
  { vin: 'JNKCV54E85M404969' },
  { vin: '4F2YZ94115KM17154' },
  { vin: '1FTSX31F4XEF01530' },
  { vin: '1GNLREED5AS141882' },
  { vin: '1HGCM72345A015394' },
  { vin: '2GCEC13V061356097' },
  { vin: '2HGFB2F59DH556555' },
  { vin: '4A4MM21S37E035610' },
  { vin: '1G1ZB5E16BF265269' },
  { vin: 'JM1BG2248P0570595' },
  { vin: '1FAFP40442F205472' },
  { vin: '1FTFW1CV0AFA08507' },
  { vin: '1HGCP2F40BA049468' },
  { vin: '2C3CDXBG2CH225030' },
  { vin: '1FTEX1EM3EFB68805' },
  { vin: '2HKRM3H77EH530278' },
  { vin: '1FAFP56S7YG153804' },
  { vin: '1FTFW1EF8DKE06422' },
  { vin: '3VWRA69M35M076388' },
  { vin: 'WBXPC93418WJ22418' },
  { vin: '2G1WH55K339189336' },
  { vin: '2T1BU4EE0BC582070' },
  { vin: '5NPEB4AC3DH767222' },
  { vin: '1FUPCSZB8YDA97969' },
  { vin: '2P4GP44R8VR152658' },
  { vin: '1FAFP33P0YW192339' },
  { vin: 'WAUDH74F66N164069' },
  { vin: '2G61M5S39F9119227' },
  { vin: '5NPEB4AC4EH870585' },
  { vin: '2G1WT57K291154869' },
  { vin: '4S4BSADC5F3222159' },
  { vin: '3VWSF71K77M011307' },
  { vin: '1FAFP34N15W209318' },
  { vin: '4T1BK1EB3EU103458' },
  { vin: '19XFB2F51EE251370' },
  { vin: 'JA4MT41R13J007819' },
  { vin: '4T1BF28BXYU035055' },
  { vin: 'KNDUP132X56751613' },
  { vin: '3FADP4EJ3CM102213' },
  { vin: '3C63R3GL8EG255672' },
  { vin: '1FMCU0C77AKB10197' },
  { vin: 'WMEEJ3BA3FK803071' },
  { vin: '1GMDU23L05D298424' },
  { vin: '1C4NJRCB1DD231847' },
  { vin: '2T2BK1BA6DC180428' },
  { vin: '2G1WG5EK1B1215822' },
  { vin: '1D7HA18N68J225623' },
  { vin: 'JTDFR320220052098' },
  { vin: 'ZFBCFADH2EZ019740' },
  { vin: '1J8GA591X7L149246' },
  { vin: '2HGES16583H522949' },
  { vin: '1HTSDAARX1H291063' },
  { vin: '1GNFC13C57J337868' },
  { vin: '1G6KD54Y82U301107' },
  { vin: '2HNYD28347H536290' },
  { vin: '5XYZK3AB7CG094055' },
  { vin: '1FM5K8B81DGB99991' },
  { vin: '1G6D25ED8B0159648' },
  { vin: '3D7KS28D17G742697' },
  { vin: 'KMHCN46C67U161006' },
  { vin: '1G11B5SL9FU118741' },
  { vin: 'WBAVB335X6PS19361' },
  { vin: '2FTRX18L41CA22746' },
  { vin: '4TANL42N3YZ576519' },
  { vin: '3C3CFFAR4DT548401' },
  { vin: 'KMHGH4JH5FU092741' },
  { vin: '3GNEC12Z15G236942' },
];

runTests(TEST_VINS)
