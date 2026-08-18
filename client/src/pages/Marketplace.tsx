import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient, apiBase } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, ShoppingCart, Heart, MessageCircle, Leaf, Store, Tag, Package } from "lucide-react";
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

// Build a clean WhatsApp URL from a phone number string and a message
function buildWhatsAppUrl(rawNumber: string, message: string): string {
  // Remove all non-digit characters
  const clean = rawNumber.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}

export default function Marketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState("newest");
  const [createOpen, setCreateOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    category: "abono",
    price: 0,
    quantity: 1,
    imageBase64: "",
  });

  // Selected product for the detail modal
  const [detailProduct, setDetailProduct] = useState<any>(null);

  const toggleLikeMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("POST", `/api/marketplace/products/${productId}/like`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace/products"] });
    },
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
      toast({ title: "✅ Producto publicado", description: "Tu producto fue publicado exitosamente en EcoMarket." });
      setNewProduct({ title: "", description: "", category: "abono", price: 0, quantity: 1, imageBase64: "" });
      setCreateOpen(false);
    },
    onError: () => {
      toast({ title: "❌ Error", description: "No se pudo publicar el producto. Intenta de nuevo.", variant: "destructive" });
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

  const handleWhatsAppContact = (product: any) => {
    if (!product.sellerWhatsapp) {
      toast({
        title: "Sin WhatsApp registrado",
        description: "Este vendedor no ha registrado un número de WhatsApp. Intenta contactarlo por mensajes internos.",
        variant: "destructive",
      });
      return;
    }
    const message = `Hola! Vi tu producto *${product.title}* en EcoMarket (EcoGuardian) por $${product.price.toFixed(2)}. Me gustaría obtener más información. ¿Está disponible?`;
    const url = buildWhatsAppUrl(product.sellerWhatsapp, message);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-sm">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                EcoMarket
                <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {sortedProducts.length} productos
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">Compra y vende productos ambientalmente sostenibles</p>
            </div>
          </div>

          {user && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm gap-1.5 rounded-xl shadow-md">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Vender</span> Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-emerald-500" />
                    Publicar Nuevo Producto
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {!(user as any).whatsappNumber && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-800 dark:text-amber-300">
                      <strong>⚠️ Sin WhatsApp registrado:</strong> Los compradores no podrán contactarte directamente.
                      Ve a tu perfil → Editar Perfil para agregar tu número de WhatsApp.
                    </div>
                  )}

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
                      <Label htmlFor="quantity">Cantidad</Label>
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
                    className="w-full h-11 rounded-xl"
                  >
                    {createProductMutation.isPending ? "Publicando..." : "Publicar Producto"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* ── Search & Filters ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos ecológicos..."
            className="pl-10 bg-background border-border h-10 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-background border-border h-9 text-xs sm:text-sm rounded-lg">
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
            <SelectTrigger className="bg-background border-border h-9 text-xs sm:text-sm rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Recientes</SelectItem>
              <SelectItem value="price-asc">$ ↑ Menor precio</SelectItem>
              <SelectItem value="price-desc">$ ↓ Mayor precio</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Máx $:</Label>
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
              className="w-full h-1.5 rounded-full cursor-pointer accent-primary bg-muted"
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap font-bold">${priceRange.max}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Product Grid ─────────────────────────────────────────────────── */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="text-center py-16 space-y-3">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando productos...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <Card className="border-dashed border-2 border-border">
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
              <p className="text-lg font-semibold text-foreground">No hay productos disponibles</p>
              <p className="text-sm text-muted-foreground">Ajusta los filtros o sé el primero en publicar un producto</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {sortedProducts.map((product: any, idx: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card
                  className="overflow-hidden hover:shadow-lg transition-all h-full flex flex-col cursor-pointer group border border-border"
                  onClick={() => setDetailProduct(product)}
                >
                  {/* Product image */}
                  {product.imageUrl ? (
                    <div className="w-full aspect-square bg-muted overflow-hidden relative">
                      <img
                        src={`${apiBase}${product.imageUrl}`}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.sellerWhatsapp && (
                        <span className="absolute top-1.5 right-1.5 bg-[#25D366] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                          WA
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center relative">
                      <Package className="h-10 w-10 text-emerald-400" />
                      {product.sellerWhatsapp && (
                        <span className="absolute top-1.5 right-1.5 bg-[#25D366] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                          WA
                        </span>
                      )}
                    </div>
                  )}

                  <CardContent className="flex-1 p-2.5 sm:p-3 space-y-1.5">
                    <p className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                      {CATEGORIES.find(c => c.id === product.category)?.label || product.category}
                    </p>
                    <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 leading-tight">{product.title}</h3>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-sm sm:text-base font-black text-emerald-600">${product.price.toFixed(2)}</span>
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Heart className={`h-3 w-3 ${product.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                        <span>{product.likesCount || 0}</span>
                      </div>
                    </div>
                    {product.sellerName && (
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                        Por: <span className="font-medium">{product.sellerName}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Product Detail Modal ─────────────────────────────────────────── */}
      <Dialog open={!!detailProduct} onOpenChange={(open) => { if (!open) setDetailProduct(null); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          {detailProduct && (
            <div className="flex flex-col sm:flex-row">
              {/* Image panel */}
              <div className="w-full sm:w-[45%] bg-muted flex items-center justify-center p-4 sm:p-6 shrink-0">
                {detailProduct.imageUrl ? (
                  <img
                    src={`${apiBase}${detailProduct.imageUrl}`}
                    alt={detailProduct.title}
                    className="w-full h-auto max-h-[260px] sm:max-h-[440px] object-contain rounded-2xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                    <Package className="h-14 w-14 opacity-30" />
                    <span className="text-sm">Sin imagen</span>
                  </div>
                )}
              </div>

              {/* Info panel */}
              <div className="w-full sm:flex-1 p-5 sm:p-7 flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <Tag className="h-3 w-3" />
                      {CATEGORIES.find(c => c.id === detailProduct.category)?.label || detailProduct.category}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground leading-tight">{detailProduct.title}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-600">${detailProduct.price.toFixed(2)}</span>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full text-xs sm:text-sm font-bold border border-emerald-500/20">
                    {detailProduct.quantity} en stock
                  </span>
                </div>

                {/* Seller info */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/60 border border-border">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {detailProduct.sellerName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Vendedor</p>
                    <p className="text-sm font-bold text-foreground truncate">{detailProduct.sellerName || "Anónimo"}</p>
                  </div>
                  {detailProduct.sellerWhatsapp && (
                    <span className="ml-auto text-[10px] font-bold text-[#25D366] flex items-center gap-1 bg-[#25D366]/10 px-2 py-0.5 rounded-full shrink-0">
                      ✓ WhatsApp
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Descripción</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {detailProduct.description}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  {/* WhatsApp CTA */}
                  {detailProduct.sellerWhatsapp ? (
                    <Button
                      className="flex-1 h-11 sm:h-12 text-sm sm:text-base gap-2 bg-[#25D366] hover:bg-[#1DAA54] text-white rounded-xl shadow-md shadow-[#25D366]/30 font-bold"
                      onClick={() => handleWhatsAppContact(detailProduct)}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Contactar por WhatsApp
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 h-11 sm:h-12 text-sm sm:text-base gap-2 bg-muted text-muted-foreground rounded-xl"
                      disabled
                      title="El vendedor no ha registrado WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Sin contacto disponible
                    </Button>
                  )}

                  {/* Like button */}
                  <Button
                    variant="outline"
                    className={`h-11 sm:h-12 flex gap-1.5 px-3 items-center flex-shrink-0 rounded-xl ${
                      detailProduct.isLiked
                        ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900"
                        : ""
                    }`}
                    onClick={() => {
                      if (!user) {
                        toast({ title: "⚠️ Inicia sesión", description: "Debes iniciar sesión para agregar a favoritos." });
                        return;
                      }
                      toggleLikeMutation.mutate(detailProduct.id);
                      // Optimistically update local state
                      setDetailProduct((prev: any) => prev
                        ? {
                            ...prev,
                            isLiked: !prev.isLiked,
                            likesCount: prev.isLiked ? (prev.likesCount - 1) : (prev.likesCount + 1),
                          }
                        : prev
                      );
                    }}
                  >
                    <Heart className={`h-5 w-5 ${detailProduct.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                    <span className="text-xs sm:text-sm font-bold">{detailProduct.likesCount || 0}</span>
                  </Button>
                </div>

                {/* WhatsApp disclaimer */}
                {detailProduct.sellerWhatsapp && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    Al contactar, serás redirigido a WhatsApp con un mensaje pre-escrito sobre este producto.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}