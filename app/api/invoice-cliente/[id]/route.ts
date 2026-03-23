import { NextRequest, NextResponse } from 'next/server'
import { obtenerCotizacionPorId } from '@/app/actions/cotizaciones'
import { fmt, redondear500 } from '@/lib/utils'

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

  const fecha = new Date(cotizacion.created_at as string).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const totalRedondeado = redondear500(r.total)
  const totalExacto = r.total

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cotización ${cotizacion.order_number} — Arancela</title>
  <style>
    @page { size: letter; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; border-radius: 0 !important; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #000; font-size: 12px; width: 215.9mm; min-height: 279.4mm; }
    .page { width: 215.9mm; min-height: 279.4mm; display: flex; flex-direction: column; }

    .header { background: #4b5563; color: #fff; padding: 20px 28px; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo-a1 { display: inline-block; background: #10B981; color: #fff; font-weight: 900; font-size: 18px; padding: 5px 11px; margin-bottom: 5px; }
    .logo-name { font-weight: 900; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; }
    .logo-sub { font-size: 9px; color: #9ca3af; letter-spacing: 0.2em; text-transform: uppercase; }
    .order-block { text-align: right; }
    .order-label { font-size: 9px; color: #9ca3af; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 4px; }
    .order-number { font-size: 22px; font-weight: 900; letter-spacing: 0.1em; }
    .order-date { font-size: 10px; color: #9ca3af; margin-top: 4px; }

    .vehicle-bar { background: #9ca3af; color: #fff; padding: 14px 28px; margin-bottom: 40px; }
    .vehicle-name { font-size: 16px; font-weight: 900; margin-bottom: 4px; }
    .vehicle-vin { font-size: 10px; color: #f3f4f6; letter-spacing: 0.1em; font-family: monospace; }

    .content { padding: 0 28px; flex: 1; }

    .label-sm { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #6b7280; margin-bottom: 8px; }

    .total-box { border: 2px solid #10B981; margin-bottom: 32px; }
    .total-exact { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10B981; }
    .total-exact-value { font-size: 22px; font-weight: 900; }
    .total-rounded { padding: 24px; background: #10B981; display: flex; justify-content: space-between; align-items: center; }
    .total-rounded-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255,255,255,0.8); margin-bottom: 4px; }
    .total-rounded-value { font-size: 36px; font-weight: 900; color: #fff; }

    .note { padding: 14px 16px; border: 1px solid #e5e7eb; background: #f9fafb; font-size: 10px; color: #6b7280; line-height: 1.6; margin-bottom: 32px; }

    .footer { padding: 0 28px 28px 28px; border-top: 2px solid #000; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; }
    .footer-logo { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; }
    .footer-note { font-size: 9px; color: #9ca3af; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div>
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

    <!-- Vehicle -->
    <div class="vehicle-bar">
      <div class="vehicle-name">${v.year} ${v.make} ${v.model}</div>
      <div class="vehicle-vin">VIN: ${v.vin}</div>
    </div>

    <div class="content">
      <!-- Total -->
      <div class="label-sm">Costo total de importación</div>
      <div class="total-box">
        <div class="total-exact">
          <div>
            <div class="label-sm">Total exacto</div>
            <div class="total-exact-value">${fmt(totalExacto)}</div>
          </div>
        </div>
        <div class="total-rounded">
          <div>
            <div class="total-rounded-label">Total a pagar</div>
            <div class="total-rounded-value">${fmt(totalRedondeado)}</div>
          </div>
        </div>
      </div>

      <!-- Nota -->
      <div class="note">
        Este monto incluye impuestos de importación (DTA, IGI, IVA) y honorarios de agencia.
        Es de carácter referencial; el monto final puede variar según el tipo de cambio al momento del trámite.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        <div class="footer-logo">Arancela — Agencia Aduanera</div>
        <div class="footer-note">Generado el ${fecha}</div>
      </div>
      <div class="footer-note">Orden: ${cotizacion.order_number}</div>
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
