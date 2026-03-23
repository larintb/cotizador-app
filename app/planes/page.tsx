import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { CheckCircle2, ArrowRight, Zap, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { createCheckoutSession } from '@/app/actions/stripe'
import NavAccount from '@/app/_components/NavAccount'
import SuccessCelebration from '@/app/_components/SuccessCelebration'


export default async function PlanesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  type PlanesProfile = { nombre: string; role: 'cliente' | 'admin' | 'superadmin'; stripe_customer_id: string | null }
  let profile: PlanesProfile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('nombre, role, stripe_customer_id')
      .eq('id', user.id)
      .single()
    if (data) profile = data as unknown as PlanesProfile
  }

  // Use Stripe as source of truth
  let isActive    = false
  let currentPlan: string | null = null
  let nextBilling: string | null = null

  if (profile?.stripe_customer_id) {
    try {
      const stripe = getStripe()
      const subs   = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        limit: 1,
        expand: ['data.items.data.price'],
      })
      const stripeSub = subs.data[0]
      if (stripeSub && stripeSub.status === 'active') {
        isActive    = true
        const isAnnual = stripeSub.items.data[0]?.price?.id === process.env.STRIPE_PRICE_ANNUAL_ID
        currentPlan = isAnnual ? 'anual' : 'mensual'
        const periodEnd = (stripeSub as unknown as { current_period_end?: number }).current_period_end ?? null
        if (periodEnd && typeof periodEnd === 'number') {
          const d = new Date(periodEnd * 1000)
          if (!isNaN(d.getTime())) {
            nextBilling = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
          }
        }
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117', color: '#fff' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #21262D' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="https://ymdwinyijgkizxpugtxa.supabase.co/storage/v1/object/public/images/logo2_white-removebg-preview.png"
              alt="Arancela"
              width={140}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            {profile ? (
              <NavAccount nombre={profile.nombre} role={profile.role} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:text-[#059669]"
                  style={{ border: '1px solid #21262D', color: '#94A3B8' }}
                >
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 font-bold text-xs uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: '#10B981' }}
                >
                  Comenzar
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-20">
        <div className="max-w-4xl mx-auto">

          {/* Title */}
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#10B981' }}>
              Planes y precios
            </p>
            <h1 className="font-black uppercase tracking-tight leading-none mb-4" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>
              Elige tu plan
            </h1>
            <p className="text-base max-w-lg mx-auto" style={{ color: '#64748B' }}>
              Acceso completo a la plataforma profesional de cotización vehicular.
            </p>
          </div>

          {/* Status banner if active */}
          {isActive && (
            <div
              className="flex items-start gap-3 px-6 py-4 mb-10 max-w-xl mx-auto"
              style={{ background: '#064E3B', border: '1px solid #10B981' }}
            >
              <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#10B981' }}>
                  Suscripción activa — Plan {currentPlan === 'anual' ? 'Anual' : 'Mensual'}
                </p>
                {nextBilling && (
                  <p className="text-xs mt-1" style={{ color: '#6EE7B7' }}>
                    Próximo cobro: {nextBilling}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Mensual */}
            <PlanCard
              icon={<Zap size={20} />}
              name="Mensual"
              price="$200"
              currency="USD"
              period="/ mes"
              description="Ideal para empezar. Sin compromisos a largo plazo."
              priceId={process.env.STRIPE_PRICE_MONTHLY_ID!}
              isCurrent={isActive && currentPlan === 'mensual'}
              isLoggedIn={!!user}
              featured={false}
            />

            {/* Anual */}
            <PlanCard
              icon={<Shield size={20} />}
              name="Anual"
              price="$2,000"
              currency="USD"
              period="/ año"
              description="Ahorra 2 meses vs. mensual. El plan preferido por agentes activos."
              priceId={process.env.STRIPE_PRICE_ANNUAL_ID!}
              isCurrent={isActive && currentPlan === 'anual'}
              isLoggedIn={!!user}
              featured
            />

          </div>

          {/* Features list */}
          <div className="mt-16" style={{ borderTop: '1px solid #21262D', paddingTop: '4rem' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-center mb-12" style={{ color: '#10B981' }}>
              Todo incluido en ambos planes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">

              <FeatureGroup title="Cotizador" items={[
                'Cotizaciones ilimitadas de importación vehicular',
                'Cálculo automático de DTA, IGI, IVA y honorarios',
                'Consulta de VIN en tiempo real vía NHTSA',
                'Los 4 procesos: Definitiva, Amparo, VU y VF',
              ]} />

              <FeatureGroup title="Clientes y Seguimiento" items={[
                'Portal de clientes con número de orden único',
                'Trackeador de estatus por cotización',
                'Notificaciones por correo al cliente',
                'Historial completo de cotizaciones',
              ]} />

              <FeatureGroup title="Soporte y Plataforma" items={[
                'Base de datos en la nube segura',
                'Acceso desde cualquier dispositivo',
                'Soporte técnico incluido',
                'Orientación a personal del agente',
                'Actualizaciones de aranceles sin costo adicional',
              ]} />

            </div>
          </div>

        </div>
      </main>

      {/* Success celebration modal */}
      <Suspense fallback={null}>
        <SuccessCelebration />
      </Suspense>

      {/* Footer */}
      <footer className="py-6 px-6 flex items-center justify-center gap-6" style={{ borderTop: '1px solid #21262D', background: '#0D1117' }}>
        <Image src="https://ymdwinyijgkizxpugtxa.supabase.co/storage/v1/object/public/images/logo2_white-removebg-preview.png" alt="Arancela" width={80} height={20} className="h-5 w-auto object-contain" style={{ opacity: 0.3 }} />
        <p className="text-xs uppercase tracking-widest" style={{ color: '#374151' }}>
          © {new Date().getFullYear()} Arancela
        </p>
      </footer>
    </div>
  )
}

function PlanCard({
  icon,
  name,
  price,
  currency,
  period,
  description,
  priceId,
  isCurrent,
  isLoggedIn,
  featured,
}: {
  icon: React.ReactNode
  name: string
  price: string
  currency: string
  period: string
  description: string
  priceId: string
  isCurrent: boolean
  isLoggedIn: boolean
  featured: boolean
}) {
  return (
    <div className="flex flex-col">
      {/* Badge above card — always reserves height so both cards align */}
      <div className="h-7 flex items-center mb-2">
        {featured && (
          <div
            className="px-3 py-1 text-xs font-black uppercase tracking-widest"
            style={{ background: '#10B981', color: '#fff' }}
          >
            Más popular
          </div>
        )}
      </div>

      <div
        className="flex flex-col flex-1 p-8"
        style={{
          background: featured ? '#0f2318' : '#161B22',
          border: featured ? '2px solid #10B981' : '1px solid #21262D',
        }}
      >

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 flex items-center justify-center"
          style={{ background: featured ? '#10B981' : '#21262D', color: featured ? '#fff' : '#10B981' }}
        >
          {icon}
        </div>
        <span className="font-black text-sm uppercase tracking-widest">{name}</span>
      </div>

      <div className="flex items-end gap-1 mb-1">
        <span className="font-black" style={{ fontSize: '3rem', lineHeight: 1 }}>{price}</span>
        <span className="text-sm mb-2" style={{ color: '#64748B' }}>{period}</span>
      </div>
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#10B981' }}>{currency}</p>

      <p className="text-sm mb-8" style={{ color: '#64748B' }}>{description}</p>

      <div className="mt-auto">
        {isCurrent ? (
          <div
            className="w-full flex items-center justify-center gap-2 py-4 font-bold text-xs uppercase tracking-widest"
            style={{ background: '#064E3B', color: '#10B981', border: '1px solid #10B981' }}
          >
            <CheckCircle2 size={14} />
            Plan actual
          </div>
        ) : isLoggedIn ? (
          <form action={createCheckoutSession.bind(null, priceId)}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-4 font-black text-sm uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90"
              style={{ background: featured ? '#10B981' : '#21262D' }}
            >
              Suscribirme <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2 py-4 font-black text-sm uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90"
            style={{ background: featured ? '#10B981' : '#21262D', display: 'flex' }}
          >
            Crear cuenta <ArrowRight size={16} />
          </Link>
        )}
      </div>
      </div>
    </div>
  )
}

function FeatureGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#ffffff' }}>
        {title}
      </p>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item} className="flex items-start gap-3">
            <CheckCircle2 size={13} style={{ color: '#10B981', flexShrink: 0, marginTop: 2 }} />
            <span className="text-sm" style={{ color: '#94A3B8', lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
