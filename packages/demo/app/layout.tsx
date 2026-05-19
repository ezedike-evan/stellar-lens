import type { Metadata } from 'next'
import { Instrument_Serif } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StellarLens — Soroban RPC SDK for Stellar developers',
  description:
    'Smart RPC routing with automatic latency-ranked fallback, Soroban transaction pre-flight simulation, and human-readable XDR error decoding.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
