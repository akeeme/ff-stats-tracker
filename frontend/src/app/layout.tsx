import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/providers/query-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { AppLayout } from "@/components/layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Flag Football Stats Tracker",
  description: "Track flag football statistics, teams, players, and games",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="dark">
          <QueryProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}