import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = `${process.env.RESEND_FROM_NAME ?? 'Arancela'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@arancela.com'}>`

// ─── Shared HTML wrapper ────────────────────────────────────────────────────

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Arancela</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;">

        <!-- Header -->
        <tr>
          <td style="background:#000000;padding:24px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#10B981;width:40px;height:40px;text-align:center;vertical-align:middle;">
                  <span style="color:#ffffff;font-weight:900;font-size:14px;letter-spacing:-0.5px;">AR</span>
                </td>
                <td style="padding-left:12px;">
                  <div style="color:#ffffff;font-weight:800;font-size:15px;letter-spacing:-0.3px;line-height:1;">Arancela</div>
                  <div style="color:#9ca3af;font-size:10px;font-weight:400;letter-spacing:2px;text-transform:uppercase;margin-top:3px;">Cotizador de Importación</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:40px 32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#000000;padding:16px 32px;text-align:center;">
            <p style="color:#6b7280;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0;">
              Arancela &mdash; Sistema de Cotización &mdash; Uso interno
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Templates ───────────────────────────────────────────────────────────────

function welcomeHtml(nombre: string) {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#000000;letter-spacing:-0.5px;">
      Bienvenido, ${nombre}
    </h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 32px;">Tu cuenta ha sido creada exitosamente.</p>

    <div style="border-left:4px solid #10B981;padding-left:16px;margin-bottom:32px;">
      <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">
        Tu cuenta está activa con rol <strong>Cliente</strong>. Puedes buscar tus cotizaciones
        ingresando el número de orden que te proporcione tu agente Arancela.
      </p>
    </div>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
       style="display:inline-block;background:#000000;color:#ffffff;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">
      Iniciar Sesión
    </a>

    <p style="margin-top:32px;font-size:12px;color:#9ca3af;line-height:1.6;">
      Si no creaste esta cuenta, ignora este correo.
    </p>
  `)
}

function orderCreatedHtml(opts: {
  orderNumber: string
  vehiculo: string
  proceso: string
  total: string
  appUrl: string
}) {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#000000;letter-spacing:-0.5px;">
      Tu cotización está lista
    </h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 32px;">Arancela ha generado una cotización de importación para tu vehículo.</p>

    <!-- Order number box -->
    <div style="background:#000000;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="color:#9ca3af;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Número de Orden</p>
      <p style="color:#ffffff;font-size:28px;font-weight:900;letter-spacing:4px;margin:0;">${opts.orderNumber}</p>
    </div>

    <!-- Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #e5e7eb;margin-bottom:32px;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Vehículo</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:right;">
          <span style="font-size:14px;font-weight:600;color:#111827;">${opts.vehiculo}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Proceso</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:right;">
          <span style="font-size:14px;font-weight:600;color:#111827;">${opts.proceso}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Total Estimado</span>
        </td>
        <td style="padding:12px 16px;text-align:right;">
          <span style="font-size:16px;font-weight:800;color:#10B981;">${opts.total}</span>
        </td>
      </tr>
    </table>

    <a href="${opts.appUrl}/cliente/dashboard"
       style="display:inline-block;background:#10B981;color:#ffffff;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">
      Ver Mi Cotización
    </a>

    <p style="margin-top:24px;font-size:12px;color:#9ca3af;line-height:1.6;">
      Esta cotización es de carácter informativo. Los montos finales pueden variar según el tipo de cambio vigente al momento del trámite.
    </p>
  `)
}

function subscriptionConfirmHtml(opts: {
  nombre: string
  plan: string
  monto: string
  nextBilling: string
}) {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#000000;letter-spacing:-0.5px;">
      Suscripción activada
    </h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 32px;">Tu pago fue procesado exitosamente, ${opts.nombre}.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #10B981;margin-bottom:32px;">
      <tr style="background:#10B981;">
        <td colspan="2" style="padding:16px;text-align:center;">
          <span style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Plan ${opts.plan}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Monto</span>
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;text-align:right;">
          <span style="font-size:15px;font-weight:800;color:#111827;">${opts.monto}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Próximo cobro</span>
        </td>
        <td style="padding:14px 20px;text-align:right;">
          <span style="font-size:14px;font-weight:600;color:#111827;">${opts.nextBilling}</span>
        </td>
      </tr>
    </table>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard"
       style="display:inline-block;background:#000000;color:#ffffff;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">
      Ir al Dashboard
    </a>
  `)
}

function billingReminderHtml(opts: { nombre: string; plan: string; monto: string; billingDate: string }) {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#000000;letter-spacing:-0.5px;">
      Recordatorio de cobro
    </h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 32px;">Hola ${opts.nombre}, tu suscripción se renovará pronto.</p>

    <div style="border-left:4px solid #10B981;padding-left:16px;margin-bottom:32px;">
      <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">
        En <strong>7 días</strong> se realizará el cobro automático de tu plan <strong>${opts.plan}</strong>.
        Asegúrate de que tu método de pago esté vigente.
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #e5e7eb;margin-bottom:32px;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Plan</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:right;">
          <span style="font-size:14px;font-weight:600;color:#111827;">${opts.plan}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Monto</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:right;">
          <span style="font-size:14px;font-weight:600;color:#111827;">${opts.monto}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Fecha de cobro</span>
        </td>
        <td style="padding:12px 16px;text-align:right;">
          <span style="font-size:15px;font-weight:800;color:#10B981;">${opts.billingDate}</span>
        </td>
      </tr>
    </table>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/membresia"
       style="display:inline-block;background:#000000;color:#ffffff;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">
      Gestionar Suscripción
    </a>

    <p style="margin-top:32px;font-size:12px;color:#9ca3af;line-height:1.6;">
      Si deseas cancelar antes del cobro, ingresa a tu portal de membresía.
    </p>
  `)
}

function billingSuccessHtml(opts: { nombre: string; plan: string; monto: string; nextBilling: string; periodo: string }) {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#000000;letter-spacing:-0.5px;">
      Pago procesado
    </h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 32px;">Tu suscripción de ${opts.periodo} ha sido renovada exitosamente, ${opts.nombre}.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #10B981;margin-bottom:32px;">
      <tr style="background:#10B981;">
        <td colspan="2" style="padding:16px;text-align:center;">
          <span style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Plan ${opts.plan} — Renovado</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Monto cobrado</span>
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;text-align:right;">
          <span style="font-size:15px;font-weight:800;color:#111827;">${opts.monto}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Próximo cobro</span>
        </td>
        <td style="padding:14px 20px;text-align:right;">
          <span style="font-size:14px;font-weight:600;color:#111827;">${opts.nextBilling}</span>
        </td>
      </tr>
    </table>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard"
       style="display:inline-block;background:#10B981;color:#ffffff;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">
      Ir al Dashboard
    </a>
  `)
}

function cancellationScheduledHtml(opts: { nombre: string; plan: string; accessUntil: string }) {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#000000;letter-spacing:-0.5px;">
      Cancelación programada
    </h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 32px;">Hola ${opts.nombre}, hemos recibido tu solicitud de cancelación.</p>

    <div style="border-left:4px solid #F59E0B;padding-left:16px;margin-bottom:32px;">
      <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">
        Tu plan <strong>${opts.plan}</strong> seguirá activo hasta el <strong>${opts.accessUntil}</strong>.
        Después de esa fecha perderás acceso al cotizador. Puedes reactivar tu membresía en cualquier momento antes de esa fecha.
      </p>
    </div>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/membresia"
       style="display:inline-block;background:#10B981;color:#ffffff;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">
      Reactivar Membresía
    </a>

    <p style="margin-top:32px;font-size:12px;color:#9ca3af;line-height:1.6;">
      Si cambiaste de opinión, puedes reactivar tu plan desde el portal de membresía antes de ${opts.accessUntil}.
    </p>
  `)
}

function cancellationConfirmedHtml(opts: { nombre: string; plan: string }) {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#000000;letter-spacing:-0.5px;">
      Suscripción cancelada
    </h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 32px;">Hola ${opts.nombre}, tu suscripción ha sido cancelada.</p>

    <div style="border-left:4px solid #6b7280;padding-left:16px;margin-bottom:32px;">
      <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">
        Tu plan <strong>${opts.plan}</strong> ha finalizado y ya no tienes acceso al cotizador.
        Puedes volver a suscribirte en cualquier momento para retomar tus cotizaciones.
      </p>
    </div>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/planes"
       style="display:inline-block;background:#10B981;color:#ffffff;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">
      Ver Planes
    </a>

    <p style="margin-top:32px;font-size:12px;color:#9ca3af;line-height:1.6;">
      Gracias por haber sido parte de Arancela. Esperamos verte pronto de regreso.
    </p>
  `)
}

function paymentFailedHtml(opts: { nombre: string; plan: string; monto: string }) {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#000000;letter-spacing:-0.5px;">
      Pago fallido
    </h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 32px;">Hola ${opts.nombre}, no pudimos procesar tu pago.</p>

    <div style="border-left:4px solid #EF4444;padding-left:16px;margin-bottom:32px;">
      <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">
        El cobro de <strong>${opts.monto}</strong> para tu plan <strong>${opts.plan}</strong> no pudo completarse.
        Por favor actualiza tu método de pago para evitar la suspensión de tu cuenta.
      </p>
    </div>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/membresia"
       style="display:inline-block;background:#000000;color:#ffffff;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">
      Actualizar Método de Pago
    </a>

    <p style="margin-top:32px;font-size:12px;color:#9ca3af;line-height:1.6;">
      Si no actualizas tu método de pago, tu suscripción podría ser cancelada automáticamente.
    </p>
  `)
}

function statusUpdateHtml(opts: {
  orderNumber: string
  vehiculo: string
  fromLabel: string
  toLabel: string
  appUrl: string
}) {
  return layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#000000;letter-spacing:-0.5px;">
      Actualización de tu trámite
    </h1>
    <p style="color:#6b7280;font-size:14px;margin:0 0 32px;">
      El estatus de tu importación ha cambiado.
    </p>

    <!-- Order box -->
    <div style="background:#000000;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="color:#9ca3af;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px;">Número de Orden</p>
      <p style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:4px;margin:0;">${opts.orderNumber}</p>
    </div>

    <!-- Vehicle -->
    <p style="font-size:13px;color:#6b7280;margin:0 0 20px;text-align:center;">${opts.vehiculo}</p>

    <!-- Status change -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #10B981;margin-bottom:32px;">
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;background:#f9fafb;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Estatus anterior</span>
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;text-align:right;">
          <span style="font-size:14px;font-weight:600;color:#6b7280;">${opts.fromLabel}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;background:#f0fdf4;">
          <span style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;">Nuevo estatus</span>
        </td>
        <td style="padding:14px 20px;background:#f0fdf4;text-align:right;">
          <span style="font-size:15px;font-weight:800;color:#10B981;">${opts.toLabel}</span>
        </td>
      </tr>
    </table>

    <a href="${opts.appUrl}/cliente/dashboard"
       style="display:inline-block;background:#10B981;color:#ffffff;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">
      Ver Mi Trámite
    </a>

    <p style="margin-top:24px;font-size:12px;color:#9ca3af;line-height:1.6;">
      Para más información comunícate con tu agente Arancela.
    </p>
  `)
}

// ─── Send functions ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, nombre: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Bienvenido a Arancela',
      html: welcomeHtml(nombre),
    })
  } catch (err) {
    console.error('[Resend] sendWelcomeEmail error:', err)
  }
}

export async function sendOrderCreatedEmail(opts: {
  to: string
  orderNumber: string
  vehiculo: string
  proceso: string
  total: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Cotización ${opts.orderNumber} — Arancela`,
      html: orderCreatedHtml({
        orderNumber: opts.orderNumber,
        vehiculo: opts.vehiculo,
        proceso: opts.proceso,
        total: opts.total,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      }),
    })
  } catch (err) {
    console.error('[Resend] sendOrderCreatedEmail error:', err)
  }
}

export async function sendSubscriptionConfirmEmail(opts: {
  to: string
  nombre: string
  plan: 'Mensual' | 'Anual'
  monto: string
  nextBilling: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Suscripción ${opts.plan} activada — Arancela`,
      html: subscriptionConfirmHtml(opts),
    })
  } catch (err) {
    console.error('[Resend] sendSubscriptionConfirmEmail error:', err)
  }
}

export async function sendBillingReminderEmail(opts: {
  to: string
  nombre: string
  plan: string
  monto: string
  billingDate: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Recordatorio: tu suscripción se renueva en 7 días — Arancela`,
      html: billingReminderHtml(opts),
    })
  } catch (err) {
    console.error('[Resend] sendBillingReminderEmail error:', err)
  }
}

export async function sendBillingSuccessEmail(opts: {
  to: string
  nombre: string
  plan: string
  monto: string
  nextBilling: string
  periodo: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Pago procesado — Plan ${opts.plan} renovado — Arancela`,
      html: billingSuccessHtml(opts),
    })
  } catch (err) {
    console.error('[Resend] sendBillingSuccessEmail error:', err)
  }
}

export async function sendCancellationScheduledEmail(opts: {
  to: string
  nombre: string
  plan: string
  accessUntil: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Cancelación programada — acceso hasta ${opts.accessUntil} — Arancela`,
      html: cancellationScheduledHtml(opts),
    })
  } catch (err) {
    console.error('[Resend] sendCancellationScheduledEmail error:', err)
  }
}

export async function sendCancellationConfirmedEmail(opts: {
  to: string
  nombre: string
  plan: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Tu suscripción ha finalizado — Arancela`,
      html: cancellationConfirmedHtml(opts),
    })
  } catch (err) {
    console.error('[Resend] sendCancellationConfirmedEmail error:', err)
  }
}

export async function sendStatusUpdateEmail(opts: {
  to: string
  orderNumber: string
  vehiculo: string
  fromLabel: string
  toLabel: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Orden ${opts.orderNumber} — Nuevo estatus: ${opts.toLabel} — Arancela`,
      html: statusUpdateHtml({
        ...opts,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      }),
    })
  } catch (err) {
    console.error('[Resend] sendStatusUpdateEmail error:', err)
  }
}

export async function sendPaymentFailedEmail(opts: {
  to: string
  nombre: string
  plan: string
  monto: string
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Pago fallido — actualiza tu método de pago — Arancela`,
      html: paymentFailedHtml(opts),
    })
  } catch (err) {
    console.error('[Resend] sendPaymentFailedEmail error:', err)
  }
}
