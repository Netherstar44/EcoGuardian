import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, ShoppingCart, Heart, Share2, Filter, SortAsc } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  { id: "abono", label: "Abono y Compost" },
  { id: "semillas", label: "Semillas Ecológicas" },
  { id: "composteras", label: "Composteras" },
  { id: "reutilizables", label: "Botellas Reutilizables" },
  { id: "bolsas", label: "Bolsas Ecológicas" },
  { id: "filtros", label: "Filtros de Agua" },
  { id: "energia", label: "Energía Solar" },
  { id: "otro", label: "Otros Ecológicos" },
];

export default function Marketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState("newest");
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    category: "abono",
    price: 0,
    quantity: 1,
    imageBase64: "",
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["marketplace/products", searchQuery, selectedCategory, priceRange],
    queryFn: async () => {
      if (searchQuery || selectedCategory !== "all") {
        const params = new URLSearchParams();
        if (searchQuery) params.append("q", searchQuery);
        if (selectedCategory !== "all") params.append("category", selectedCategory);
        if (priceRange.min) params.append("minPrice", priceRange.min.toString());
        if (priceRange.max) params.append("maxPrice", priceRange.max.toString());
        const res = await apiRequest("GET", `/api/marketplace/search?${params.toString()}`);
        return res.json();
      }
      const res = await apiRequest("GET", "/api/marketplace/products");
      return res.json();
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/marketplace/products", newProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace/products"] });
      toast({ title: "✅ Producto creado", description: "Tu producto fue publicado exitosamente" });
      setNewProduct({
        title: "",
        description: "",
        category: "abono",
        price: 0,
        quantity: 1,
        imageBase64: "",
      });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewProduct(prev => ({ ...prev, imageBase64: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const sortedProducts = Array.isArray(products) ? [...products].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    return 0;
  }) : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-foreground">🌿 Marketplace Eco</h1>
          {user && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-12 px-6">
                  <Plus className="h-5 w-5 mr-2" />
                  Vender Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Publicar Nuevo Producto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título del Producto</Label>
                    <Input
                      id="title"
                      value={newProduct.title}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="ej: Abono ecológico premium"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={newProduct.category} onValueChange={(v) => setNewProduct(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger id="category" className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Precio (USD)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Cantidad Disponible</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newProduct.quantity}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe tu producto..."
                      className="bg-background border-border min-h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Imagen del Producto</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="bg-background border-border"
                    />
                  </div>

                  <Button
                    onClick={() => createProductMutation.mutate()}
                    disabled={createProductMutation.isPending || !newProduct.title || !newProduct.description}
                    className="w-full h-12"
                  >
                    {createProductMutation.isPending ? "Publicando..." : "Publicar Producto"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <p className="text-muted-foreground">Compra y vende productos ambiental mente sostenibles</p>
      </motion.div>

      {/* Controles de búsqueda y filtrado */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="pl-10 bg-background border-border"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Precio máx: ${priceRange.max}</Label>
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary bg-muted"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span><span>$1000</span>
            </div>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más Recientes</SelectItem>
              <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
              <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Grid de productos */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No hay productos disponibles</p>
              <p className="text-sm text-muted-foreground">Intenta ajustar tus filtros o búsqueda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((product: any) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col cursor-pointer group">
                    {product.imageUrl && (
                      <div className="w-full h-48 bg-gradient-to-br from-green-100 to-blue-100 overflow-hidden relative">
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-semibold">Ver detalles</span>
                        </div>
                      </div>
                    )}

                    <CardContent className="flex-1 p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-1">
                          {CATEGORIES.find(c => c.id === product.category)?.label || product.category}
                        </p>
                        <h3 className="font-bold text-foreground line-clamp-2">{product.title}</h3>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

                      <div className="flex items-baseline justify-between pt-2">
                        <span className="text-2xl font-bold text-green-600">${product.price.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.quantity} disponibles
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                
                {/* Preview Modal Content */}
                <DialogContent className="max-w-3xl border-none shadow-2xl p-0 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Left: Image */}
                    <div className="w-full md:w-1/2 bg-muted flex items-center justify-center p-4">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-auto max-h-[500px] object-contain rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64">
                          <span className="text-muted-foreground">Sin imagen</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Right: Info */}
                    <div className="w-full md:w-1/2 p-6 flex flex-col">
                      <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">
                        {CATEGORIES.find(c => c.id === product.category)?.label || product.category}
                      </p>
                      <h2 className="text-3xl font-bold text-foreground mb-4">{product.title}</h2>
                      
                      <div className="flex items-center gap-4 mb-6">
                        <span className="text-4xl font-bold text-green-600">${product.price.toFixed(2)}</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {product.quantity} en stock
                        </span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 mb-6">
                        <h4 className="font-semibold mb-2">Descripción del Producto</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                      
                      <div className="flex gap-3 pt-4 border-t">
                        <Button className="flex-1 h-12 text-base">
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          Comprar Ahora
                        </Button>
                        <Button variant="outline" className="h-12 w-12 p-0 flex-shrink-0">
                          <Heart className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}