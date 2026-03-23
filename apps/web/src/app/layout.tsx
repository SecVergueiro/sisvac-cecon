import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SisVac',
  description: 'Sistema de Gerenciamento de Férias e Licenças — FCECON',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
