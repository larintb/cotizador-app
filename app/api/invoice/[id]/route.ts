import { NextRequest, NextResponse } from 'next/server'
import { obtenerCotizacionPorId } from '@/app/actions/cotizaciones'
import { fmt, redondear500, PROCESS_LABELS, STATUS_LABELS, getIGILabel } from '@/lib/utils'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { cotizacion, error } = await obtenerCotizacionPorId(id)

  if (error || !cotizacion) {
    return new NextResponse('Cotización no encontrada', { status: 404 })
  }

  const v = cotizacion.vehicle_data as Record<string, string>
  const r = cotizacion.result as Record<string, number>
  const statusData = STATUS_LABELS[cotizacion.status as string] || STATUS_LABELS.validacion
  const processLabel = PROCESS_LABELS[cotizacion.selected_process as string] || cotizacion.selected_process
  const igiLabel = getIGILabel(cotizacion.selected_process as string, v.year)

  const fecha = new Date(cotizacion.created_at as string).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cotización ${cotizacion.order_number} — Arancela</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; border-radius: 0 !important; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #000; font-size: 13px; }
    .page { max-width: 800px; margin: 0 auto; padding: 32px; }

    /* Header */
    .header { background: #000; color: #fff; padding: 24px 32px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0; }
    .logo-block {}
    .logo-a1 { display: inline-block; background: #10B981; color: #fff; font-weight: 900; font-size: 20px; padding: 6px 12px; margin-bottom: 6px; }
    .logo-name { font-weight: 900; font-size: 16px; letter-spacing: 0.15em; text-transform: uppercase; }
    .logo-sub { font-size: 10px; color: #9ca3af; letter-spacing: 0.2em; text-transform: uppercase; }
    .order-block { text-align: right; }
    .order-label { font-size: 10px; color: #9ca3af; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 4px; }
    .order-number { font-size: 24px; font-weight: 900; letter-spacing: 0.1em; }
    .order-date { font-size: 11px; color: #9ca3af; margin-top: 4px; }

    /* Vehicle bar */
    .vehicle-bar { background: #1f2937; color: #fff; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .vehicle-name { font-size: 18px; font-weight: 900; }
    .vehicle-vin { font-size: 11px; color: #9ca3af; letter-spacing: 0.1em; font-family: monospace; }

    /* Section */
    .section { margin-bottom: 20px; border: 2px solid #e5e7eb; }
    .section-header { background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 10px 16px; display: flex; align-items: center; gap: 8px; }
    .section-stripe { width: 3px; height: 16px; background: #10B981; flex-shrink: 0; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #4b5563; }

    /* Row */
    .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid #f3f4f6; }
    .row:last-child { border-bottom: none; }
    .row-label { font-size: 13px; font-weight: 600; color: #000; }
    .row-sublabel { font-size: 11px; color: #9ca3af; margin-left: 6px; }
    .row-value { font-size: 13px; font-weight: 700; color: #000; font-variant-numeric: tabular-nums; }
    .row-base { background: #f9fafb; }
    .row-base .row-label, .row-base .row-value { font-size: 12px; color: #6b7280; font-weight: 600; }
    .row-highlight { background: #f3f4f6; }
    .row-highlight .row-label, .row-highlight .row-value { font-weight: 700; font-size: 13px; }

    /* Subtotal */
    .subtotal { display: flex; justify-content: space-between; padding: 12px 16px; background: #f9fafb; border-top: 2px solid #e5e7eb; font-weight: 700; font-size: 14px; }

    /* Total box */
    .total-box { margin-bottom: 20px; border: 2px solid #10B981; }
    .total-exact { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10B981; }
    .total-exact-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #6b7280; margin-bottom: 4px; }
    .total-exact-value { font-size: 22px; font-weight: 900; color: #000; }
    .total-rounded { padding: 16px 20px; background: #10B981; display: flex; justify-content: space-between; align-items: center; }
    .total-rounded-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255,255,255,0.8); margin-bottom: 4px; }
    .total-rounded-value { font-size: 28px; font-weight: 900; color: #fff; }

    /* Process badge */
    .process-badge { display: inline-block; background: #000; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; padding: 3px 8px; }
    .status-badge { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 3px 8px; border: 1px solid currentColor; }

    /* Info row */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .info-item { border: 1px solid #e5e7eb; padding: 12px; }
    .info-item-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #6b7280; margin-bottom: 4px; }
    .info-item-value { font-size: 14px; font-weight: 700; color: #000; }

    /* Disclaimer */
    .disclaimer { padding: 14px; border: 1px solid #e5e7eb; background: #f9fafb; font-size: 11px; color: #6b7280; line-height: 1.6; margin-bottom: 20px; }

    /* Footer */
    .footer { border-top: 2px solid #000; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }
    .footer-logo { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; }
    .footer-note { font-size: 10px; color: #9ca3af; }

    @media print {
      .page { padding: 0; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-block">
        <div><span class="logo-a1">A1</span></div>
        <div class="logo-name">Arancela</div>
        <div class="logo-sub">Agencia Aduanera</div>
      </div>
      <div class="order-block">
        <div class="order-label">Cotización #</div>
        <div class="order-number">${cotizacion.order_number}</div>
        <div class="order-date">${fecha}</div>
      </div>
    </div>

    <!-- Vehicle bar -->
    <div class="vehicle-bar">
      <div>
        <div class="vehicle-name">${v.year} ${v.make} ${v.model}</div>
        <div class="vehicle-vin">VIN: ${v.vin}</div>
      </div>
      <div>
        <span class="process-badge">${processLabel}</span>
      </div>
    </div>

    <!-- Info grid -->
    <div class="info-grid">
      <div class="info-item">
        <div class="info-item-label">Marca / Modelo</div>
        <div class="info-item-value">${v.make} ${v.model}</div>
      </div>
      <div class="info-item">
        <div class="info-item-label">Año Modelo</div>
        <div class="info-item-value">${v.year}</div>
      </div>
      <div class="info-item">
        <div class="info-item-label">Tipo de Proceso</div>
        <div class="info-item-value">${processLabel}</div>
      </div>
      <div class="info-item">
        <div class="info-item-label">Estatus</div>
        <div class="info-item-value">${statusData.label}</div>
      </div>
    </div>

    <!-- Desglose -->
    <div class="section">
      <div class="section-header">
        <div class="section-stripe"></div>
        <span class="section-title">Desglose de Impuestos</span>
      </div>
      <div class="row row-base">
        <span class="row-label">Valor Aduana (USD)</span>
        <span class="row-value">$ ${parseFloat(String(cotizacion.customs_value_usd)).toLocaleString('es-MX', { minimumFractionDigits: 2 })} USD</span>
      </div>
      <div class="row row-base">
        <span class="row-label">Tipo de Cambio</span>
        <span class="row-value">$ ${parseFloat(String(cotizacion.exchange_rate)).toFixed(2)} MXN/USD</span>
      </div>
      <div class="row row-highlight">
        <span class="row-label">V. Aduana en Pesos</span>
        <span class="row-value">${fmt(r.aduanaPesos)}</span>
      </div>
      <div style="height:1px;background:#e5e7eb;"></div>
      <div class="row">
        <span class="row-label">D.T.A. <span class="row-sublabel">(0.8% V. Aduana)</span></span>
        <span class="row-value">${fmt(r.dta)}</span>
      </div>
      <div class="row">
        <span class="row-label">I.G.I. <span class="row-sublabel">(${igiLabel})</span></span>
        <span class="row-value">${fmt(r.igi)}</span>
      </div>
      <div class="row">
        <span class="row-label">I.V.A. <span class="row-sublabel">(16% Base + DTA + IGI)</span></span>
        <span class="row-value">${fmt(r.iva)}</span>
      </div>
      <div class="row">
        <span class="row-label">Prevalidación <span class="row-sublabel">(Fijo)</span></span>
        <span class="row-value">${fmt(r.preval)}</span>
      </div>
      <div class="row">
        <span class="row-label">IVA Prevalidación <span class="row-sublabel">(Fijo)</span></span>
        <span class="row-value">${fmt(r.ivaPreval)}</span>
      </div>
      <div class="subtotal">
        <span>Subtotal Impuestos</span>
        <span>${fmt(r.impuestos)}</span>
      </div>
    </div>

    <!-- Honorarios -->
    <div class="section">
      <div class="row">
        <span class="row-label">Honorarios Agencia</span>
        <span class="row-value">${fmt(parseFloat(String(cotizacion.agency_fees)))}</span>
      </div>
    </div>

    <!-- Total -->
    <div class="total-box">
      <div class="total-exact">
        <div>
          <div class="total-exact-label">Total Exacto</div>
          <div class="total-exact-value">${fmt(r.total)}</div>
        </div>
      </div>
      <div class="total-rounded">
        <div>
          <div class="total-rounded-label">Total Redondeado</div>
          <div class="total-rounded-value">${fmt(redondear500(r.total))}</div>
        </div>
      </div>
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer">
      <strong>Nota:</strong> Esta cotización es de carácter informativo y referencial. Los montos finales pueden variar
      según el tipo de cambio vigente al momento del trámite y otros factores aduaneros.
      Arancela no se hace responsable por diferencias al momento del proceso.
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        <div class="footer-logo">Arancela — Agencia Aduanera</div>
        <div class="footer-note">Cotización generada el ${fecha}</div>
      </div>
      <div class="footer-note">Orden: ${cotizacion.order_number}</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto print when opened
      // window.print()
    }
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
