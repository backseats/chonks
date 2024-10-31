import type { Metadata } from 'next'
import { Inter, Source_Code_Pro } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const sourceCodePro = Source_Code_Pro({
  weight: '600',
  subsets: ['latin'],
  variable: '--font-source-code-pro',
})

export const metadata: Metadata = {
  title: 'NFT Viewer',
  description: 'NFT Viewer - by Eto Vass',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
