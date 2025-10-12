import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/providers/query-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { AdminProvider } from "@/providers/admin-provider"
import { AppLayout } from "@/components/layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Rhinos Stats Tracker",
  description: "Track rhinos statistics, teams, players, and games",
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
            <AdminProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </AdminProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}