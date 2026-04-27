"use client"
import { useState } from "react"
import { useCartStore } from "@/store/cart"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getCartTotal, clearCart } = useCartStore()

  const [name, setName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Flat shipping cost for Phase 2
  const SHIPPING_COST = 2000
  const subtotal = getCartTotal()
  const total = subtotal + (items.length > 0 ? SHIPPING_COST : 0)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setIsSubmitting(true)

    try {
      // 1. Save to Supabase
      const { error } = await supabase.from('orders').insert({
        customer_name: name,
        whatsapp: whatsapp,
        location_detail: location,
        notes: notes,
        items: items,
        total_price: total,
        shipping_cost: SHIPPING_COST,
        status: 'pending'
      })

      if (error) {
        console.error("Failed to save order:", error)
        alert("Failed to submit order. Please try again.")
        setIsSubmitting(false)
        return
      }

      // 2. Format WhatsApp Message
      const orderListText = items.map(
        item => `- ${item.quantity}x ${item.name} (Rp ${(item.price * item.quantity).toLocaleString('id-ID')})`
      ).join('\n')

      const message = `*Zona Rasa - NEW ORDER*

*Nama:* ${name}
*WhatsApp:* ${whatsapp}
*Alamat:* ${location}
*Catatan:* ${notes || '-'}

*Daftar Pesanan:*
${orderListText}

*Subtotal:* Rp ${subtotal.toLocaleString('id-ID')}
*Ongkir:* Rp ${SHIPPING_COST.toLocaleString('id-ID')}
*Total:* Rp ${total.toLocaleString('id-ID')}

Mohon segera diproses!`

      // Target WhatsApp Number (6285340302129)
      const targetPhone = "6285340302129"

      // 3. Clear cart and redirect directly to WhatsApp App
      clearCart()
      window.location.href = `whatsapp://send?phone=${targetPhone}&text=${encodeURIComponent(message)}`

      // Fallback in case they don't have the app installed, redirect to web after a short delay
      setTimeout(() => {
        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank')
        // Go back to home after successful order placement
        window.location.href = '/'
      }, 2000)

    } catch (err) {
      console.error(err)
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container py-16 flex flex-col items-center text-center space-y-4">
        <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center mb-4">
          <ShoppingCart className="h-14 w-14 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Keranjangmu kosong</h2>
        <p className="text-muted-foreground">Sepertinya kamu belum menambahkan item apapun ke keranjang.</p>
        <Link href="/">
          <Button className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali Ke Menu
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="flex p-4 gap-4">
                  <div className="relative h-24 w-24 rounded-md overflow-hidden shrink-0 bg-muted">
                    {item.image_url && (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-primary font-medium">Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-4 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="ml-auto font-bold">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Checkout Form & Summary */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleCheckout}>
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 pb-4 border-b">
                <CardTitle>Detail Pengiriman</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap<span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    placeholder="e.g. Budi Santoso"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">Nomor WhatsApp <span className="text-destructive">*</span></Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="e.g. 08123456789"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Stand / Lokasi Detail <span className="text-destructive">*</span></Label>
                  <Input
                    id="location"
                    placeholder="e.g. Stand B4, Fakultas Teknik"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan Tambahan</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g. Pedas, jangan pakai plastik..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ongkir</span>
                    <span className="font-medium">Rp {SHIPPING_COST.toLocaleString('id-ID')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 pt-6">
                <Button
                  type="submit"
                  className="w-full text-lg h-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Pesan via WhatsApp"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
