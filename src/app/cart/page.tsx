"use client"
import { useState, useEffect, useCallback } from "react"
import { useCartStore } from "@/store/cart"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart, MapPin, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { 
  ssr: false, 
  loading: () => <div className="h-[300px] w-full flex items-center justify-center bg-muted rounded-md mt-2 border border-input"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> 
})
import {
  STAND_LAT,
  STAND_LON,
  haversineDistance,
  calculateShippingCost,
  formatDistance,
} from "@/lib/shipping"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getCartTotal, clearCart } = useCartStore()

  const [name, setName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Geolocation state
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLon, setUserLon] = useState<number | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [manualMode, setManualMode] = useState(false)

  // Calculate distance and shipping cost
  const effectiveDistance = userLat !== null && userLon !== null
    ? haversineDistance(STAND_LAT, STAND_LON, userLat, userLon)
    : null

  const shippingCost = effectiveDistance !== null
    ? calculateShippingCost(effectiveDistance)
    : null

  const subtotal = getCartTotal()
  const total = subtotal + (shippingCost ?? 0)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Browser tidak mendukung geolokasi")
      setLocationDenied(true)
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(position.coords.latitude)
        setUserLon(position.coords.longitude)
        setIsLocating(false)
        setLocationDenied(false)
        setManualMode(false)
      },
      (error) => {
        setIsLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationDenied(true)
          setLocationError("Akses lokasi ditolak. Silakan pilih lokasi Anda pada peta.")
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError("Lokasi tidak tersedia. Silakan pilih lokasi pada peta.")
          setLocationDenied(true)
        } else {
          setLocationError("Gagal mendapatkan lokasi. Silakan coba lagi atau pilih lokasi pada peta.")
          setLocationDenied(true)
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // Auto-request location on mount
  useEffect(() => {
    if (items.length > 0) {
      requestLocation()
    }
  }, [items.length, requestLocation])

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    if (shippingCost === null) {
      alert("Silakan tentukan lokasi Anda terlebih dahulu untuk menghitung ongkir.")
      return
    }
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
        shipping_cost: shippingCost,
        status: 'pending'
      })

      if (error) {
        console.error("Failed to save order:", error)
        alert("Gagal mengirim pesanan. Silakan coba lagi.")
        setIsSubmitting(false)
        return
      }

      // 2. Format WhatsApp Message
      const orderListText = items.map(
        item => `- ${item.quantity}x ${item.name} (Rp ${(item.price * item.quantity).toLocaleString('id-ID')})`
      ).join('\n')

      const distanceText = effectiveDistance !== null ? formatDistance(effectiveDistance) : '-'
      const shippingText = shippingCost === 0 ? 'Gratis' : `Rp ${shippingCost.toLocaleString('id-ID')}`

      const message = `*Zona Rasa - NEW ORDER*

*Nama:* ${name}
*WhatsApp:* ${whatsapp}
*Alamat:* ${location}
*Catatan:* ${notes || '-'}

*Daftar Pesanan:*
${orderListText}

*Subtotal:* Rp ${subtotal.toLocaleString('id-ID')}
*Jarak:* ${distanceText}
*Ongkir:* ${shippingText}
*Total:* Rp ${total.toLocaleString('id-ID')}

Mohon segera diproses!`

      // Target WhatsApp Number
      const targetPhone = "6285340302129"

      // 3. Clear cart and redirect directly to WhatsApp App
      clearCart()
      window.location.href = `whatsapp://send?phone=${targetPhone}&text=${encodeURIComponent(message)}`

      // Fallback in case they don't have the app installed
      setTimeout(() => {
        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank')
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

                {/* Shipping Location Section */}
                <div className="rounded-lg border border-dashed p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Lokasi & Ongkir</span>
                  </div>

                  {isLocating && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mendapatkan lokasi Anda...
                    </div>
                  )}

                  {effectiveDistance !== null && shippingCost !== null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Jarak dari stand</span>
                        <span className="font-medium">{formatDistance(effectiveDistance)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Ongkir</span>
                        {shippingCost === 0 ? (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                            Gratis!
                          </Badge>
                        ) : (
                          <span className="font-medium">Rp {shippingCost.toLocaleString('id-ID')}</span>
                        )}
                      </div>
                      {!manualMode && userLat !== null && (
                        <p className="text-xs text-muted-foreground">📍 Lokasi otomatis terdeteksi</p>
                      )}
                      {manualMode && userLat !== null && (
                        <p className="text-xs text-muted-foreground">📍 Lokasi dipilih secara manual pada peta</p>
                      )}
                    </div>
                  )}

                  {locationError && (
                    <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-500/10 p-3 rounded-md border border-amber-500/20">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{locationError}</span>
                    </div>
                  )}

                  {(locationDenied || manualMode) && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-sm">
                        Ketuk peta untuk menentukan lokasi Anda
                      </Label>
                      <MapPicker 
                        initialLat={STAND_LAT} 
                        initialLon={STAND_LON} 
                        onLocationSelected={(lat, lon) => {
                          setUserLat(lat)
                          setUserLon(lon)
                          setManualMode(true)
                          setLocationDenied(false)
                          setLocationError(null)
                        }} 
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Gratis ongkir dalam radius 100 meter dari stand. Di luar itu Rp 2.000/km.
                      </p>
                    </div>
                  )}

                  {!isLocating && !locationDenied && !manualMode && effectiveDistance === null && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={requestLocation}
                    >
                      <MapPin className="h-4 w-4" />
                      Gunakan Lokasi Saya
                    </Button>
                  )}

                  {!isLocating && !locationDenied && !manualMode && effectiveDistance !== null && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground"
                      onClick={() => setManualMode(true)}
                    >
                      Atau pilih lokasi manual di peta
                    </Button>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ongkir</span>
                    <span className="font-medium">
                      {shippingCost === null
                        ? "Menunggu lokasi..."
                        : shippingCost === 0
                          ? "Gratis"
                          : `Rp ${shippingCost.toLocaleString('id-ID')}`}
                    </span>
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
                  disabled={isSubmitting || shippingCost === null}
                >
                  {isSubmitting ? "Memproses..." : "Pesan via WhatsApp"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
