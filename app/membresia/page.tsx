import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, AlertCircle, CreditCard, ArrowRight, ExternalLink, XCircle } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { createPortalSession } from '@/app/actions/stripe'
import NavAccount from '@/app/_components/NavAccount'

export default async function MembresiasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, role, stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/')

  // ── Fetch live data from Stripe ────────────────────────────────────────────
  type SubDetails = {
    status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | string
    plan: string
    interval: string
    amount: string
    lastBilling: string
    nextBilling: string
    cancelAtPeriodEnd: boolean
    cancelAt: string | null
    subscriptionId: string
  }

  let sub: SubDetails | null = null

  if (profile.stripe_customer_id) {
    try {
      const stripe = getStripe()
      const subs   = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        limit: 1,
        expand: ['data.items.data.price'],
      })

      const stripeSub = subs.data[0]

      if (stripeSub) {
        const price    = stripeSub.items.data[0]?.price
        const isAnnual = price?.id === process.env.STRIPE_PRICE_ANNUAL_ID

        const fmt = (ts: number | null | undefined): string => {
          if (!ts || typeof ts !== 'number') return '—'
          const d = new Date(ts * 1000)
          if (isNaN(d.getTime())) return '—'
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }

        const raw = stripeSub as unknown as { current_period_start?: number; billing_cycle_anchor?: number }
        const periodStart: number | null = raw.current_period_start ?? raw.billing_cycle_anchor ?? null

        // Calculate next billing as exactly +1 month (or +1 year) from last billing
        let periodEnd: number | null = null
        if (periodStart) {
          const next = new Date(periodStart * 1000)
          if (isAnnual) {
            next.setFullYear(next.getFullYear() + 1)
          } else {
            next.setMonth(next.getMonth() + 1)
          }
          periodEnd = Math.floor(next.getTime() / 1000)
        }

        sub = {
          status:            stripeSub.status,
          plan:              isAnnual ? 'Anual' : 'Mensual',
          interval:          isAnnual ? 'año' : 'mes',
          amount:            isAnnual ? '$2,000 USD' : '$200 USD',
          lastBilling:       fmt(periodStart),
          nextBilling:       fmt(periodEnd),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          cancelAt:          stripeSub.cancel_at ? fmt(stripeSub.cancel_at) : null,
          subscriptionId: stripeSub.id,
        }

        // Sync DB silently if out of date
        const serviceClient = await createServiceClient()
        await serviceClient
          .from('profiles')
          .update({
            stripe_subscription_id: stripeSub.id,
            subscription_status: stripeSub.status === 'active' ? 'active' : stripeSub.status === 'past_due' ? 'past_due' : 'inactive',
            subscription_plan: stripeSub.status === 'active' ? (isAnnual ? 'anual' : 'mensual') : null,
            role: stripeSub.status === 'active' ? 'admin' : 'cliente',
          })
          .eq('id', user.id)
      }
    } catch (err) {
      console.error('[Membresia] Stripe fetch error:', err)
    }
  }

  const isActive  = sub?.status === 'active' || sub?.status === 'trialing'
  const hasStripe = !!profile.stripe_customer_id

  const STATUS_CONFIG = {
    active:   { label: 'Activa',    icon: CheckCircle2, color: '#10B981', bg: '#064E3B' },
    trialing: { label: 'En prueba', icon: CheckCircle2, color: '#10B981', bg: '#064E3B' },
    past_due: { label: 'Vencida',   icon: AlertCircle,  color: '#F59E0B', bg: '#78350F' },
    canceled: { label: 'Cancelada', icon: XCircle,      color: '#6b7280', bg: '#1f2937' },
    inactive: { label: 'Inactiva',  icon: XCircle,      color: '#6b7280', bg: '#1f2937' },
  }
  const statusKey  = (sub?.status && sub.status in STATUS_CONFIG ? sub.status : 'inactive') as keyof typeof STATUS_CONFIG
  const statusCfg  = STATUS_CONFIG[statusKey]
  const StatusIcon = statusCfg.icon

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117', color: '#fff' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #21262D' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/images/logo_arancela.png"
              alt="Arancela"
              width={140}
              height={36}
              className="h-9 w-auto object-contain"
              priority
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </Link>
          <NavAccount nombre={profile.nombre} role={profile.role as 'cliente' | 'admin' | 'superadmin'} />
        </div>
      </header>

      <main className="flex-1 px-6 py-16">
        <div className="max-w-2xl mx-auto">

          {/* Title */}
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#10B981' }}>
              Mi cuenta
            </p>
            <h1 className="font-black uppercase tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
              Membresía
            </h1>
          </div>

          {/* Status card */}
          <div className="mb-6" style={{ background: '#161B22', border: '1px solid #21262D' }}>

            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #21262D' }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>
                Estado de suscripción
              </span>
              <div
                className="flex items-center gap-2 px-3 py-1.5"
                style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.color}` }}
              >
                <StatusIcon size={12} style={{ color: statusCfg.color }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: statusCfg.color }}>
                  {statusCfg.label}
                </span>
              </div>
            </div>

            <div className="p-6">
              {sub ? (
                <>
                  <Row label="Plan"          value={sub.plan} />
                  <Row label="Monto"         value={sub.amount} />
                  <Row label="Frecuencia"    value={`Cada ${sub.interval}`} />
                  <Row label="Último cobro" value={sub.lastBilling} />
                  <Row
                    label={sub.cancelAtPeriodEnd ? 'Suscripción hasta' : 'Próximo cobro'}
                    value={sub.cancelAtPeriodEnd && sub.cancelAt ? sub.cancelAt : sub.nextBilling}
                    highlight={isActive && !sub.cancelAtPeriodEnd}
                    danger={sub.cancelAtPeriodEnd}
                  />

                  {sub.cancelAtPeriodEnd && (
                    <div
                      className="flex items-start gap-3 p-4 mt-4"
                      style={{ background: '#1a0a0a', border: '1px solid #EF4444' }}
                    >
                      <XCircle size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                      <p className="text-xs" style={{ color: '#EF4444', lineHeight: 1.6 }}>
                        Tu membresía fue cancelada. Acceso disponible hasta <strong>{sub.cancelAt}</strong>.
                        Reactiva tu plan para seguir cotizando.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm py-2" style={{ color: '#64748B' }}>
                  No se encontró ninguna suscripción activa.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {sub?.cancelAtPeriodEnd ? (
            /* Cancelled — push to re-subscribe */
            <div className="space-y-3">
              <Link
                href="/planes"
                className="w-full flex items-center justify-center gap-2 py-4 font-black text-sm uppercase tracking-widest text-white transition-all hover:opacity-90"
                style={{ background: '#10B981', display: 'flex' }}
              >
                Reactivar membresía <ArrowRight size={16} />
              </Link>
              <form action={createPortalSession}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 font-bold text-xs uppercase tracking-widest transition-all hover:border-white hover:text-white"
                  style={{ border: '1px solid #21262D', color: '#64748B' }}
                >
                  <ExternalLink size={12} />
                  Gestionar desde el portal
                </button>
              </form>
            </div>
          ) : hasStripe ? (
            <div className="space-y-3">
              <form action={createPortalSession}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-4 font-black text-sm uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: '#10B981' }}
                >
                  <CreditCard size={16} />
                  Gestionar suscripción
                  <ExternalLink size={14} style={{ opacity: 0.7 }} />
                </button>
              </form>
              <p className="text-center text-xs" style={{ color: '#374151' }}>
                Cambia de plan, actualiza tu método de pago o cancela desde el portal.
              </p>
            </div>
          ) : (
            <Link
              href="/planes"
              className="w-full flex items-center justify-center gap-2 py-4 font-black text-sm uppercase tracking-widest text-white transition-all hover:opacity-90"
              style={{ background: '#10B981', display: 'flex' }}
            >
              Ver planes disponibles <ArrowRight size={16} />
            </Link>
          )}

        </div>
      </main>

      <footer className="py-6 px-6 flex items-center justify-center gap-6" style={{ borderTop: '1px solid #21262D' }}>
        <Image src="/images/logo2_arancela.png" alt="Arancela" width={80} height={20} className="h-5 w-auto object-contain" style={{ opacity: 0.3 }} />
        <p className="text-xs uppercase tracking-widest" style={{ color: '#374151' }}>
          © {new Date().getFullYear()} Arancela
        </p>
      </footer>
    </div>
  )
}

function Row({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  const color = danger ? '#EF4444' : highlight ? '#10B981' : '#ffffff'
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #21262D' }}>
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: danger ? '#EF4444' : '#64748B' }}>
        {label}
      </span>
      <span className="text-sm font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
