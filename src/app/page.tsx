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
      products = data
    }
  } catch (err) {
    console.error("Error fetching menus:", err)
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Expo Menu
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Order food and drinks easily without waiting in line. Choose your items, checkout, and we will prepare it for you!
        </p>
      </div>

      <ProductList products={products} />
    </div>
  )
}

