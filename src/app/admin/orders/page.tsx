"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle } from "lucide-react"

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setOrders(data)
    setIsLoading(false)
  }

  const updateStatus = async (id: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)
      
    if (!error) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o))
    } else {
      alert("Failed to update status")
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage incoming expo orders.</p>
      </div>

      <div className="grid gap-6">
        {orders.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No orders found.</Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className={order.status === 'completed' ? 'border-green-500/50' : order.status === 'cancelled' ? 'border-destructive/50' : 'border-primary/50'}>
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {order.customer_name}
                      {order.status === 'pending' && <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>}
                      {order.status === 'completed' && <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>}
                      {order.status === 'cancelled' && <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleString('id-ID')} • {order.whatsapp}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-primary">Rp {order.total_price.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Order Items</h4>
                  <ul className="space-y-2">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                        <span><span className="font-medium">{item.quantity}x</span> {item.name}</span>
                        <span className="text-muted-foreground">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-2 border-t flex justify-between text-sm text-muted-foreground">
                    <span>Shipping Cost</span>
                    <span>Rp {order.shipping_cost.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-1 text-sm uppercase tracking-wider text-muted-foreground">Delivery Location</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-md border">{order.location_detail}</p>
                  </div>
                  {order.notes && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm uppercase tracking-wider text-muted-foreground">Notes</h4>
                      <p className="text-sm text-amber-600 bg-amber-500/10 p-3 rounded-md border border-amber-500/20 italic">{order.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {order.status !== 'completed' && (
                      <Button onClick={() => updateStatus(order.id, 'completed')} className="flex-1 bg-green-600 hover:bg-green-700 text-white min-w-[140px]">
                        <CheckCircle className="w-4 h-4 mr-2" /> Mark Completed
                      </Button>
                    )}
                    {order.status !== 'cancelled' && (
                      <Button onClick={() => updateStatus(order.id, 'cancelled')} variant="outline" className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/20 min-w-[140px]">
                        <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                      </Button>
                    )}
                    {order.status !== 'pending' && (
                      <Button onClick={() => updateStatus(order.id, 'pending')} variant="outline" className="flex-1 text-yellow-600 hover:bg-yellow-500/10 border-yellow-500/20 min-w-[140px]">
                        <Clock className="w-4 h-4 mr-2" /> Revert to Pending
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
