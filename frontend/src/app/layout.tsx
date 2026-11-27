import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./rhinos.css"
import { QueryProvider } from "@/providers/query-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { AdminProvider } from "@/providers/admin-provider"
import { Shell } from "@/components/rx"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Rhinos Stats",
  description: "Scores, box scores and player stats for the Rhinos flag football team",
}

export const viewport = { themeColor: "#000000", viewportFit: "cover" as const }

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
              <Shell>
                {children}
              </Shell>
            </AdminProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}