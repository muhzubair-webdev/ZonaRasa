"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, ShoppingBag, CreditCard, Download } from "lucide-react"

type Order = {
  id: string
  customer_name: string
  whatsapp: string
  location_detail: string
  notes: string
  items: any[]
  total_price: number
  shipping_cost: number
  status: string
  created_at: string
}

type BestSeller = {
  name: string
  quantity: number
  revenue: number
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCompletedOrders()
  }, [])

  const fetchCompletedOrders = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (data) setOrders(data)
    setIsLoading(false)
  }

  const downloadCSV = () => {
    if (orders.length === 0) return

    // Create CSV headers
    const headers = ["Date", "Order ID", "Customer Name", "WhatsApp", "Location", "Notes", "Items", "Shipping Cost", "Total Price"]

    // Create CSV rows
    const rows = orders.map(order => {
      const date = new Date(order.created_at).toLocaleString('id-ID')
      const itemsStr = order.items.map(item => `${item.quantity}x ${item.name}`).join('; ')
      const notes = order.notes ? order.notes.replace(/,/g, ' ') : '' // Remove commas from notes for safe CSV
      const location = order.location_detail.replace(/,/g, ' ')

      return [
        `"${date}"`,
        `"${order.id}"`,
        `"${order.customer_name}"`,
        `"${order.whatsapp}"`,
        `"${location}"`,
        `"${notes}"`,
        `"${itemsStr}"`,
        order.shipping_cost,
        order.total_price
      ].join(',')
    })

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `expo_sales_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate Metrics
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0)
  const totalOrders = orders.length

  // Calculate Best Sellers
  const getBestSellers = (): BestSeller[] => {
    const itemMap = new Map<string, BestSeller>()

    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemMap.get(item.name)
        if (existing) {
          existing.quantity += item.quantity
          existing.revenue += (item.price * item.quantity)
        } else {
          itemMap.set(item.name, {
            name: item.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity
          })
        }
      })
    })

    return Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5) // Top 5
  }

  const bestSellers = getBestSellers()

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Penjualan</h1>
          <p className="text-muted-foreground">Statistik penjualan dari seluruh pesanan yang telah selesai.</p>
        </div>
        <Button onClick={downloadCSV} disabled={orders.length === 0} className="gap-2">
          <Download className="w-4 h-4" /> Download CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">Rp {totalRevenue.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1"> dari {totalOrders} pesanan yang selesai</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Berhasil dipenuhi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Penjualan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              Rp {totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString('id-ID') : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Best Sellers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Best Selling Items</CardTitle>
        </CardHeader>
        <CardContent>
          {bestSellers.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">No sales data available yet.</p>
          ) : (
            <div className="space-y-4">
              {bestSellers.map((item, index) => (
                <div key={item.name} className="flex items-center">
                  <div className="w-8 text-center font-bold text-muted-foreground">#{index + 1}</div>
                  <div className="flex-1 ml-4">
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.quantity} units sold
                    </p>
                  </div>
                  <div className="font-medium">
                    Rp {item.revenue.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
