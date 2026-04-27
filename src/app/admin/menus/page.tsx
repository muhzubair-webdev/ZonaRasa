"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, Image as ImageIcon, Pencil } from "lucide-react"
import Image from "next/image"

type Menu = {
  id: number
  name: string
  price: number
  description: string
  image_url: string
  is_available: boolean
}

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState("")

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('menus').select('*').order('id', { ascending: false })
    if (data) setMenus(data)
    setIsLoading(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setPrice("")
    setDescription("")
    setImageFile(null)
    setImagePreview(null)
    setExistingImageUrl("")
    const fileInput = document.getElementById('image') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleEditClick = (menu: Menu) => {
    setEditingId(menu.id)
    setName(menu.name)
    setPrice(menu.price.toString())
    setDescription(menu.description || "")
    setExistingImageUrl(menu.image_url || "")
    setImagePreview(menu.image_url || null)
    setImageFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddOrUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    let imageUrl = existingImageUrl

    // 1. Upload new image if selected
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `menus/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, imageFile)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        alert("Failed to upload image. Make sure the 'menu-images' bucket exists and policies are set.")
        setIsUploading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)
        
      imageUrl = publicUrlData.publicUrl
    }

    // 2. Save or Update database
    if (editingId) {
      const { data, error } = await supabase.from('menus').update({
        name,
        price: parseInt(price),
        description,
        image_url: imageUrl,
      }).eq('id', editingId).select()

      if (!error && data) {
        setMenus(menus.map(m => m.id === editingId ? data[0] : m))
        resetForm()
      } else {
        alert("Failed to update menu item.")
        console.error(error)
      }
    } else {
      const { data, error } = await supabase.from('menus').insert({
        name,
        price: parseInt(price),
        description,
        image_url: imageUrl,
        is_available: true
      }).select()

      if (!error && data) {
        setMenus([data[0], ...menus])
        resetForm()
      } else {
        alert("Failed to add menu item.")
        console.error(error)
      }
    }

    setIsUploading(false)
  }

  const toggleAvailability = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from('menus')
      .update({ is_available: !currentStatus })
      .eq('id', id)
      
    if (!error) {
      setMenus(menus.map(m => m.id === id ? { ...m, is_available: !currentStatus } : m))
    }
  }

  const deleteMenu = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    
    const { error } = await supabase.from('menus').delete().eq('id', id)
    if (!error) {
      setMenus(menus.filter(m => m.id !== id))
      if (editingId === id) resetForm()
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
        <p className="text-muted-foreground">Add new items, edit, and manage availability.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <Card className="lg:col-span-1 h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />} 
              {editingId ? "Edit Item" : "Add New Item"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddOrUpdateMenu} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (Rp)</Label>
                <Input id="price" type="number" required value={price} onChange={e => setPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
                {imagePreview && (
                  <div className="mt-2 relative w-full h-32 rounded-md overflow-hidden border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isUploading}>
                  {isUploading ? "Saving..." : (editingId ? "Update Item" : "Add to Menu")}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isUploading}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Menu List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : menus.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">No menu items found.</Card>
          ) : (
            menus.map((item) => (
              <Card key={item.id} className={!item.is_available ? 'opacity-70' : ''}>
                <div className="flex flex-col sm:flex-row p-4 gap-4">
                  <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-md overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-primary font-bold">Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                      <Button 
                        variant={item.is_available ? "outline" : "default"} 
                        size="sm"
                        className={!item.is_available ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                        onClick={() => toggleAvailability(item.id, item.is_available)}
                      >
                        {item.is_available ? "Mark Sold Out" : "Mark Available"}
                      </Button>
                      <div className="ml-auto flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:bg-blue-600/10 hover:text-blue-700"
                          onClick={() => handleEditClick(item)}
                        >
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteMenu(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
