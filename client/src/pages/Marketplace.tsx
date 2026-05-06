import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient, apiBase } from "@/lib/queryClient";
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
    <div className="space-y-4 md:space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl md:text-4xl font-bold text-foreground">🌿 EcoMarket</h1>
          {user && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-9 md:h-12 px-3 md:px-6 text-sm md:text-base">
                  <Plus className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Vender</span> Producto
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
        <p className="text-xs md:text-base text-muted-foreground">Compra y vende productos ambientalmente sostenibles</p>
      </motion.div>

      {/* Controles de búsqueda y filtrado */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos..."
            className="pl-10 bg-background border-border h-10"
          />
        </div>

        {/* Filtros compactos en una fila */}
        <div className="grid grid-cols-3 gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-background border-border h-9 text-xs md:text-sm">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-background border-border h-9 text-xs md:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Recientes</SelectItem>
              <SelectItem value="price-asc">$ ↑</SelectItem>
              <SelectItem value="price-desc">$ ↓</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Máx:</Label>
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-primary bg-muted"
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">${priceRange.max}</span>
          </div>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
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
                      <div className="w-full aspect-square bg-gradient-to-br from-green-100 to-blue-100 overflow-hidden relative">
                        <img
                          src={`${apiBase}${product.imageUrl}`}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    )}

                    <CardContent className="flex-1 p-2 md:p-4 space-y-1 md:space-y-3">
                      <div>
                        <p className="text-[10px] md:text-xs font-semibold text-green-600 mb-0.5">
                          {CATEGORIES.find(c => c.id === product.category)?.label || product.category}
                        </p>
                        <h3 className="font-bold text-xs md:text-base text-foreground line-clamp-1 md:line-clamp-2">{product.title}</h3>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <span className="text-sm md:text-2xl font-bold text-green-600">${product.price.toFixed(2)}</span>
                        <span className="text-[9px] md:text-xs text-muted-foreground hidden md:inline">
                          {product.quantity} disp.
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                
                {/* Preview Modal Content */}
                <DialogContent className="max-w-[95vw] md:max-w-3xl border-none shadow-2xl p-0 overflow-hidden max-h-[85vh] overflow-y-auto">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="w-full md:w-1/2 bg-muted flex items-center justify-center p-3 md:p-4">
                      {product.imageUrl ? (
                        <img
                          src={`${apiBase}${product.imageUrl}`}
                          alt={product.title}
                          className="w-full h-auto max-h-[250px] md:max-h-[500px] object-contain rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-40">
                          <span className="text-muted-foreground">Sin imagen</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="w-full md:w-1/2 p-4 md:p-6 flex flex-col">
                      <p className="text-xs md:text-sm font-semibold text-green-600 uppercase tracking-wider mb-1">
                        {CATEGORIES.find(c => c.id === product.category)?.label || product.category}
                      </p>
                      <h2 className="text-xl md:text-3xl font-bold text-foreground mb-2 md:mb-4">{product.title}</h2>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl md:text-4xl font-bold text-green-600">${product.price.toFixed(2)}</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs md:text-sm font-medium">
                          {product.quantity} en stock
                        </span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 mb-4">
                        <h4 className="font-semibold text-sm mb-1">Descripción</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                      
                      <div className="flex gap-2 pt-3 border-t">
                        <Button className="flex-1 h-10 md:h-12 text-sm md:text-base">
                          <ShoppingCart className="h-4 w-4 mr-1.5" />
                          Comprar
                        </Button>
                        <Button variant="outline" className="h-10 md:h-12 w-10 md:w-12 p-0 flex-shrink-0">
                          <Heart className="h-4 w-4" />
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