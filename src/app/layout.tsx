import type { Metadata } from 'next'
import { Nunito, Fraunces } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { QueryProvider } from '@/lib/client/QueryProvider'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['SOFT', 'opsz'],
})

export const metadata: Metadata = {
  title: 'GharKhata — Family Finance',
  description: 'A warm little ledger for the whole household',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunito.variable} ${fraunces.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
