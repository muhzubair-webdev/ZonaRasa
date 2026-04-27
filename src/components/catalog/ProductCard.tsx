"use client"
import { ShoppingBag } from "lucide-react"
import { Product, useCartStore } from "@/store/cart"
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const hasImage = product.image_url && product.image_url.trim() !== ""

  return (
    <Card className="overflow-hidden flex flex-col group border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300">
      <div className="relative aspect-video w-full overflow-hidden bg-muted/50">
        {hasImage ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/10 text-secondary">
            <span className="text-sm font-medium">No Image</span>
          </div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Badge variant="destructive" className="text-sm px-3 py-1">Sold Out</Badge>
          </div>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">{product.name}</CardTitle>
          <span className="font-bold text-primary shrink-0">
            Rp {product.price.toLocaleString('id-ID')}
          </span>
        </div>
        <CardDescription className="line-clamp-2 text-sm mt-1.5 h-10">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardFooter className="p-4 pt-2 mt-auto">
        <Button
          onClick={() => addItem(product)}
          disabled={!product.is_available}
          className="w-full gap-2 font-semibold"
        >
          <ShoppingBag className="h-4 w-4" />
          Tambah ke Keranjang
        </Button>
      </CardFooter>
    </Card>
  )
}

