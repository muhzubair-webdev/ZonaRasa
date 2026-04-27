import { create } from 'zustand'

export interface Product {
  id: number
  name: string
  price: number
  description: string
  image_url: string
  is_available: boolean
}

export interface CartItem extends Product {
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id)
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        }
      }
      return { items: [...state.items, { ...product, quantity: 1 }] }
    })
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }))
  },
  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((item) => item.id !== productId) }
      }
      return {
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        ),
      }
    })
  },
  clearCart: () => set({ items: [] }),
  getCartTotal: () => {
    const { items } = get()
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  },
  getCartCount: () => {
    const { items } = get()
    return items.reduce((count, item) => count + item.quantity, 0)
  },
}))
