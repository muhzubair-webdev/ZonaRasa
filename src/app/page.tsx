import { createClient } from "@/lib/supabase/server"
import { ProductList } from "@/components/catalog/ProductList"
import { Product } from "@/store/cart"

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  let products: Product[] = []

  try {
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.warn("Failed to fetch from Supabase:", error.message)
    } else if (data && data.length > 0) {
      // Sort: available items first, sold-out items at the bottom
      products = data.sort((a, b) => {
        if (a.is_available === b.is_available) return 0
        return a.is_available ? -1 : 1
      })
    }
  } catch (err) {
    console.error("Error fetching menus:", err)
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Menu Zona Rasa
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Pesan makanan dan minuman dengan mudah tanpa perlu mengantri. Pilih item yang Anda inginkan, siapkan uangnya, dan kami akan menyiapkannya untuk Anda!
        </p>
      </div>

      <ProductList products={products} />
    </div>
  )
}

