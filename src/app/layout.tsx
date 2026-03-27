import "@/styles/globals.css"
import { AppChrome } from "@/app/_components/AppChrome"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  )
}