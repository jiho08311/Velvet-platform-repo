import "@/styles/globals.css"
import { AppHeader } from "@/app/_components/AppHeader"
import { AppSidebar } from "@/app/_components/AppSidebar"
import Footer from "@/shared/ui/Footer"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-white">
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        <div className="flex min-h-screen flex-col">
          
          {/* Top Header */}
          <AppHeader />

          {/* Main layout */}
          <div className="flex flex-1">
            <AppSidebar />

            <main className="flex-1">
              {children}
            </main>
          </div>

          <Footer />
        </div>
      </body>
    </html>
  )
}