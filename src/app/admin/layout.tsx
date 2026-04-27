"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Don't show the dashboard layout on the login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const navigation = [
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Menus', href: '/admin/menus', icon: UtensilsCrossed },
    { name: 'Laporan', href: '/admin/reports', icon: LayoutDashboard },
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/20">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-card border-b p-4">
        <span className="font-bold text-xl text-primary tracking-tight">Admin Dashboard</span>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-card border-r shadow-sm transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b hidden md:block">
            <span className="font-bold text-2xl text-primary tracking-tight">Halaman Admin</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}>
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </div>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
