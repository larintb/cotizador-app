// Round to 2 decimals to eliminate floating point errors
const r2 = (n: number) => Math.round(n * 100) / 100

function getIGIRate(selectedProcess: string, year: number): number {
  if (selectedProcess === 'vu') return 0.10
  if (selectedProcess === 'vf') return year === 2016 ? 0.10 : 0.01
  return 0.50 // importacion y amparo
}

export function getIGILabel(selectedProcess: string, year: string): string {
  const y = parseInt(year, 10)
  if (selectedProcess === 'vu') return '10% V. Aduana'
  if (selectedProcess === 'vf') return y === 2016 ? '10% V. Aduana (2016)' : '1% V. Aduana (2017–2021)'
  return '50% V. Aduana'
}

export interface CalcResult {
  aduanaPesos: number
  dta: number
  igi: number
  iva: number
  preval: number
  ivaPreval: number
  impuestos: number
  total: number
}

export function calcular(
  customsValueUSD: number,
  exchangeRate: number,
  agencyFees: number,
  selectedProcess: string,
  vehicleYear: string
): CalcResult {
  const usd = parseFloat(String(customsValueUSD)) || 0
  const tc = parseFloat(String(exchangeRate)) || 0
  const honorarios = parseFloat(String(agencyFees)) || 0
  const y = parseInt(vehicleYear, 10)
  const igiRate = getIGIRate(selectedProcess, y)

  const aduanaPesos = r2(usd * tc)
  const dta = aduanaPesos < 41375 ? 331 : Math.round(r2(aduanaPesos * 0.008))
  const igi = Math.round(r2(aduanaPesos * igiRate))
  const iva = Math.round(r2((aduanaPesos + dta + igi) * 0.16))
  const preval = 240
  const ivaPreval = 38
  const impuestos = dta + igi + iva + preval + ivaPreval
  const total = impuestos + honorarios

  return { aduanaPesos, dta, igi, iva, preval, ivaPreval, impuestos, total }
}

export function redondear500(n: number): number {
  return Math.ceil(n / 500) * 500
}

export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = () =>
    Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${part()}-${part()}`
}

export const fmt = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

export const STATUS_LABELS: Record<string, { label: string; color: string; dot: string; badge: string }> = {
  validacion: { label: 'Proceso de Validación', color: 'blue',   dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-800 border border-blue-200' },
  sellado:    { label: 'Proceso de Sellado',     color: 'purple', dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-800 border border-purple-200' },
  inspeccion: { label: 'Proceso de Inspección',  color: 'amber',  dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-800 border border-amber-200' },
  pedimento:  { label: 'Generando Pedimento',    color: 'orange', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-800 border border-orange-200' },
  modular:    { label: 'Listo para Modular',     color: 'cyan',   dot: 'bg-cyan-500',   badge: 'bg-cyan-50 text-cyan-800 border border-cyan-200' },
  recoger:    { label: 'Listo para Recoger',     color: 'green',  dot: 'bg-green-500',  badge: 'bg-green-50 text-green-800 border border-green-200' },
}

export const ESTATUSES = Object.entries(STATUS_LABELS).map(([value, data]) => ({
  value,
  ...data,
}))

export const PROCESS_LABELS: Record<string, string> = {
  importacion: 'Importación Definitiva A1',
  amparo: 'Proceso de Amparo Legal',
  vu: 'Procedimiento VU',
  vf: 'Procedimiento VF',
}
