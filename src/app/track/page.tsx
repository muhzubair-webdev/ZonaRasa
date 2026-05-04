"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Clock, CheckCircle, XCircle, Package, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Order = {
  id: string
  customer_name: string
  whatsapp: string
  location_detail: string
  notes: string
  items: any[]
  total_price: number
  shipping_cost: number
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
}

const statusConfig = {
  pending: {
    label: "Menunggu",
    icon: Clock,
    badgeClass: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    stepColor: "bg-yellow-500",
    description: "Pesanan sedang diproses oleh penjual",
  },
  completed: {
    label: "Selesai",
    icon: CheckCircle,
    badgeClass: "bg-green-500/10 text-green-600 border-green-500/20",
    stepColor: "bg-green-500",
    description: "Pesanan telah selesai",
  },
  cancelled: {
    label: "Dibatalkan",
    icon: XCircle,
    badgeClass: "bg-red-500/10 text-red-600 border-red-500/20",
    stepColor: "bg-red-500",
    description: "Pesanan telah dibatalkan",
  },
}

export default function TrackPage() {
  const [name, setName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !whatsapp.trim()) return

    setIsSearching(true)
    setHasSearched(true)

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .ilike('customer_name', `%${name.trim()}%`)
        .ilike('whatsapp', `%${whatsapp.trim()}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Search error:", error)
        alert(`Gagal mencari pesanan: ${error.message}`)
        setOrders([])
      } else {
        console.log("Search results:", data)
        setOrders(data || [])
      }
    } catch (err) {
      console.error(err)
      setOrders([])
    }

    setIsSearching(false)
  }

  return (
    <div className="container py-8 max-w-3xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Menu
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Lacak Pesanan</h1>
        <p className="text-muted-foreground">
          Masukkan nama dan nomor WhatsApp yang digunakan saat pemesanan untuk melihat status pesanan Anda.
        </p>
      </div>

      {/* Search Form */}
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="track-name">Nama</Label>
                <Input
                  id="track-name"
                  placeholder="Nama saat pesan"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="track-wa">Nomor WhatsApp</Label>
                <Input
                  id="track-wa"
                  type="tel"
                  placeholder="e.g. 08123456789"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isSearching}>
              <Search className="h-4 w-4" />
              {isSearching ? "Mencari..." : "Cari Pesanan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          <Separator />
          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Pesanan Tidak Ditemukan</h3>
              <p className="text-muted-foreground max-w-md">
                Tidak ada pesanan dengan nama dan nomor WhatsApp tersebut. Pastikan data yang dimasukkan sesuai dengan yang digunakan saat pemesanan.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Ditemukan <span className="font-semibold text-foreground">{orders.length}</span> pesanan
              </p>
              <div className="space-y-4">
                {orders.map((order) => {
                  const config = statusConfig[order.status]
                  const StatusIcon = config.icon
                  return (
                    <Card key={order.id} className="overflow-hidden">
                      <CardHeader className="pb-3 bg-muted/30">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={config.badgeClass}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleString('id-ID', {
                                dateStyle: 'long',
                                timeStyle: 'short'
                              })}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-xl font-bold text-primary">
                              Rp {order.total_price.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        {/* Status Timeline */}
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${config.stepColor}`} />
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>

                        <Separator />

                        {/* Items */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Item Pesanan</h4>
                          <ul className="space-y-1.5">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between items-center text-sm">
                                <span>
                                  <span className="font-medium">{item.quantity}x</span> {item.name}
                                </span>
                                <span className="text-muted-foreground">
                                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 pt-2 border-t flex justify-between text-sm text-muted-foreground">
                            <span>Ongkir</span>
                            <span>
                              {order.shipping_cost === 0
                                ? "Gratis"
                                : `Rp ${order.shipping_cost.toLocaleString('id-ID')}`}
                            </span>
                          </div>
                        </div>

                        {/* Location & Notes */}
                        {order.location_detail && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Lokasi</h4>
                            <p className="text-sm bg-muted/50 p-2 rounded-md">{order.location_detail}</p>
                          </div>
                        )}
                        {order.notes && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Catatan</h4>
                            <p className="text-sm italic text-amber-600 bg-amber-500/10 p-2 rounded-md border border-amber-500/20">{order.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
