import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";
import { type PostWithAuthor, type InsertPost } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema } from "@shared/schema";
import { Form, FormControl,FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Send, Image as ImageIcon, Recycle, Leaf, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const categories = [
  { id: "limpieza", label: "Limpieza", icon: Trash2 },
  { id: "clasificacion", label: "Clasificación de Residuos", icon: Recycle },
  { id: "compostaje", label: "Compostaje", icon: Leaf },
  { id: "reciclaje", label: "Reciclaje", icon: Recycle },
];

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: [api.posts.list.path],
  });

  const form = useForm<InsertPost>({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      content: "",
      category: "reciclaje",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: InsertPost) => {
      const res = await apiRequest(api.posts.create.method, api.posts.create.path, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      form.reset();
      setIsDialogOpen(false);
      toast({
        title: "¡Publicado!",
        description: "Tu aporte ambiental ha sido compartido con la comunidad.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-4xl font-bold text-primary mb-4">Comunidad Eco-Activa</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Comparte tus labores, consejos y experiencias cuidando nuestro entorno.
        </p>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Plus className="h-5 w-5" />
              Publicar contenido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Compartir labor ambiental</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <cat.icon className="h-4 w-4" />
                                {cat.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Comparte cómo clasificaste tus residuos, tu proceso de compostaje o tu jornada de limpieza..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline" type="button" size="sm" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Subir Foto
                  </Button>
                  <Button type="submit" disabled={mutation.isPending} className="gap-2">
                    {mutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Publicar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="space-y-6">
        <AnimatePresence>
          {posts?.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              layout
            >
              <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {post.author.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{post.author.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(post.createdAt), "d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {post.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Leaf className="h-3 w-3" />
                        {post.author.points} puntos
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-foreground/90">{post.content}</p>
                  {post.imageUrl && (
                    <div className="mt-4 rounded-lg overflow-hidden border">
                      <img src={post.imageUrl} alt="Contenido ambiental" className="w-full h-auto object-cover max-h-96" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/30 py-3 flex gap-4">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-2">
                    Me gusta
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-2">
                    Comentar
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
