import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Counter from './_components/Counter'
import NavAccount from './_components/NavAccount'
import Silk from './_components/Silk'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  type Profile = { nombre: string; role: 'cliente' | 'admin' | 'superadmin' }
  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('nombre, role')
      .eq('id', user.id)
      .single()
    if (data) profile = data as unknown as Profile
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117', color: '#fff' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header>
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
              <>
                <Link
                  href="/planes"
                  className="px-5 py-2 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:text-[#10B981]"
                  style={{ border: '1px solid #10B98144', color: '#10B981' }}
                >
                  Planes
                </Link>
                <NavAccount nombre={profile.nombre} role={profile.role} />
              </>
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

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-12 overflow-hidden"
        style={{ minHeight: 'calc(100vh - 65px)' }}
      >
        {/* Silk background */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <Silk speed={10} scale={0.8} color="#7B7481" noiseIntensity={1.5} rotation={0} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0D111766, #0D1117)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto" style={{ zIndex: 1 }}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-6"
            style={{ border: '1px solid #10B98133', background: '#10B98111' }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#10B981' }}>
              Cotizador de Importación Vehicular
            </span>
          </div>

          <h1 className="font-black uppercase tracking-tight leading-none mb-6" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
            Ingresa el VIN.
            <br />
            <span style={{ color: '#10B981' }}>Obtén tu precio.</span>
            <br />
            Listo.
          </h1>

          <p className="text-lg max-w-xl mx-auto leading-relaxed mb-8" style={{ color: '#64748B' }}>
            DTA, IGI, IVA y honorarios calculados con precisión aduanera en segundos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {profile ? (
              <Link
                href={{ admin: '/admin/dashboard', superadmin: '/superadmin/usuarios', cliente: '/cliente/dashboard' }[profile.role]}
                className="inline-flex items-center justify-center gap-3 px-10 py-5 font-black text-sm uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90"
                style={{ background: '#10B981' }}
              >
                Ir a dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 font-black text-sm uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: '#10B981' }}
                >
                  Comenzar ahora <ArrowRight size={18} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 font-bold text-sm uppercase tracking-widest transition-all duration-200 hover:border-[#10B981] hover:text-[#059669]"
                  style={{ border: '2px solid #21262D', color: '#94A3B8' }}
                >
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Flujo VIN → PRECIO → COTIZACIÓN ───────────────── */}
      <section className="px-6 py-24" style={{ background: '#0D1117' }}>
        <div className="max-w-5xl mx-auto text-center">

          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#10B981' }}>Así de simple</p>
          <h2 className="font-black uppercase tracking-tight mb-16" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            Tres pasos. Un resultado.
          </h2>

          {/* Steps */}
          <div className="flex flex-col md:flex-row items-stretch justify-center">

            <div className="flex-1">
              <div className="h-full flex flex-col items-center text-center px-8 py-10" style={{ background: '#0D1117', border: '1px solid #21262D' }}>
                <span className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#64748B' }}>Paso 1</span>
                <p className="font-black uppercase tracking-tight mb-2" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>VIN</p>
                <p className="text-sm" style={{ color: '#64748B' }}>17 caracteres. Consulta NHTSA en tiempo real.</p>
              </div>
            </div>

            <div className="flex items-center justify-center flex-shrink-0">
              <div className="w-14 h-14 flex items-center justify-center" style={{ background: '#10B981' }}>
                <ArrowRight size={22} className="text-white hidden md:block" />
                <span className="text-white font-black text-xl md:hidden">↓</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="h-full flex flex-col items-center text-center px-8 py-10" style={{ background: '#0D1117', border: '2px solid #10B981' }}>
                <span className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#10B981' }}>Paso 2</span>
                <p className="font-black uppercase tracking-tight leading-none mb-2" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#10B981' }}>
                  TU PRECIO
                </p>
                <p className="text-sm" style={{ color: '#64748B' }}>DTA · IGI · IVA · Honorarios. En segundos.</p>
              </div>
            </div>

            <div className="flex items-center justify-center flex-shrink-0">
              <div className="w-14 h-14 flex items-center justify-center" style={{ background: '#10B981' }}>
                <ArrowRight size={22} className="text-white hidden md:block" />
                <span className="text-white font-black text-xl md:hidden">↓</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="h-full flex flex-col items-center text-center px-8 py-10" style={{ background: '#0D1117', border: '1px solid #21262D' }}>
                <span className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#64748B' }}>Paso 3</span>
                <p className="font-black uppercase tracking-tight mb-2" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>COTIZACIÓN</p>
                <p className="text-sm" style={{ color: '#64748B' }}>Número de orden único. Compártelo al instante.</p>
              </div>
            </div>

          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-12" style={{ background: '#21262D' }}>

            <div className="text-center py-10 px-4" style={{ background: '#0D1117' }}>
              <p className="font-black text-4xl mb-1" style={{ color: '#10B981' }}>
                <Counter to={4} />
              </p>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#64748B' }}>Procesos</p>
            </div>

            <div className="text-center py-10 px-4" style={{ background: '#0D1117' }}>
              <p className="font-black text-4xl mb-1" style={{ color: '#10B981' }}>
                {'<'}<Counter to={10} suffix="s" />
              </p>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#64748B' }}>Para cotizar</p>
            </div>

            <div className="text-center py-10 px-4" style={{ background: '#0D1117' }}>
              <p className="font-black text-4xl mb-1" style={{ color: '#10B981' }}>
                <Counter to={100} suffix="%" />
              </p>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#64748B' }}>Precisión</p>
            </div>

            <div className="text-center py-10 px-4" style={{ background: '#0D1117' }}>
              <p className="font-black text-3xl mb-1 tracking-widest" style={{ color: '#10B981' }}>
                XXX-XXX
              </p>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#64748B' }}>N° de orden</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Hero image + copy ──────────────────────────────── */}
      <section className="px-6 py-24" style={{ background: '#0D1117' }}>
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-16">

          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#10B981' }}>
              Para agentes aduaneros
            </p>
            <h2 className="font-black uppercase tracking-tight leading-none mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
              Profesional.<br />
              <span style={{ color: '#64748B' }}>Preciso.</span>
            </h2>
            <p className="leading-relaxed mb-8" style={{ color: '#64748B' }}>
              Historial organizado, portal de clientes con número de orden y status en tiempo real del proceso de importación.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-3 px-8 py-4 font-bold text-sm uppercase tracking-widest text-white hover:opacity-90 transition-all duration-200"
              style={{ background: '#10B981' }}
            >
              Crear cuenta <ArrowRight size={16} />
            </Link>
          </div>

          <div className="flex-1">
            <Image src="https://ymdwinyijgkizxpugtxa.supabase.co/storage/v1/object/public/images/hero_arancela.png" alt="Arancela" width={600} height={400} className="w-full h-auto object-contain" />
          </div>

        </div>
      </section>

      {/* ── Procesos ───────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ background: '#161B22' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-center mb-12" style={{ color: '#10B981' }}>
            Tipos de importación
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: '#21262D' }}>
            {[
              { title: 'Importación Definitiva A1', igi: 'IGI 50%', desc: 'Proceso estándar. Todos los vehículos.' },
              { title: 'Proceso de Amparo Legal',   igi: 'IGI 10%', desc: 'VINs de EE.UU. y Canadá (1, 2, 4 o 5).' },
              { title: 'Procedimiento VU',           igi: 'IGI 10%', desc: 'Modelos 2017 y 2018.' },
              { title: 'Procedimiento VF',           igi: 'IGI 10% / 1%', desc: 'Modelos 2016 a 2021.' },
            ].map(p => (
              <div key={p.title} className="flex items-start gap-4 p-8" style={{ background: '#0D1117' }}>
                <div className="px-3 py-1 text-xs font-black uppercase tracking-widest flex-shrink-0" style={{ background: '#064E3B', color: '#10B981' }}>
                  {p.igi}
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider mb-1">{p.title}</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────── */}
      <section className="px-6 py-24 text-center" style={{ background: '#0D1117' }}>
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <h2 className="font-black uppercase tracking-tight mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Empieza hoy.
          </h2>
          <p className="mb-10" style={{ color: '#64748B' }}>
            Plataforma profesional para agentes aduaneros.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-3 px-12 py-5 font-black text-sm uppercase tracking-widest text-white hover:opacity-90 transition-all"
            style={{ background: '#10B981' }}
          >
            Crear cuenta gratis <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="py-6 px-6 flex items-center justify-center gap-6" style={{ background: '#0D1117' }}>
        <Image src="https://ymdwinyijgkizxpugtxa.supabase.co/storage/v1/object/public/images/logo2_white-removebg-preview.png" alt="Arancela" width={80} height={20} className="h-5 w-auto object-contain" style={{ opacity: 0.3 }} />
        <p className="text-xs uppercase tracking-widest" style={{ color: '#374151' }}>
          © {new Date().getFullYear()} Arancela
        </p>
      </footer>

    </div>
  )
}
