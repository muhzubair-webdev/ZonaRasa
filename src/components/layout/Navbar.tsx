"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, Search } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Navbar() {
  const cartCount = useCartStore((state) => state.getCartCount())
  const pathname = usePathname()

  // Hide entire navbar on admin routes (admin has its own layout/header)
  const isAdminRoute = pathname.startsWith('/admin')
  if (isAdminRoute) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-2 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-extrabold text-2xl tracking-tight">
              <span className="text-primary">Zona</span>
              <span className="text-foreground">Rasa</span>
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/track">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Lacak Pesanan</span>
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline" className="relative h-10 w-10 rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10 hover:text-primary transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge variant="destructive" className="absolute -right-1.5 -top-1.5 h-5 w-5 justify-center rounded-full p-0 text-[10px] shadow-sm animate-in zoom-in">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
