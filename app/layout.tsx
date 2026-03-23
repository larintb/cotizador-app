import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import NavigationProgress from './_components/NavigationProgress'
import PageTransition from './_components/PageTransition'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Arancela — Cotizador de Importación Vehicular',
  description:
    'Plataforma profesional de cotización de importación de vehículos. Calcula DTA, IGI, IVA y honorarios en segundos.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f0f0f0] text-black">
        <NavigationProgress />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  )
}
