import "@/styles/globals.css"
import { AppHeader } from "@/app/_components/AppHeader"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-white">
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}