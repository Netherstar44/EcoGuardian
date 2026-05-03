import { useParams, Link } from "wouter";
import { useReport, useCreateComment } from "@/hooks/use-reports";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { MapDisplay } from "@/components/reports/MapDisplay";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, MessageSquare, MapPin, User, Send, ShieldAlert, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ReportDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: report, isLoading } = useReport(Number(id));
  const { user } = useAuth();
  const { mutateAsync: addComment, isPending: isCommenting } = useCreateComment();
  const [commentText, setCommentText] = useState("");

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando detalles...</div>;
  if (!report) return <div className="p-8 text-center text-destructive">Reporte no encontrado</div>;

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment({ reportId: report.id, content: commentText });
      setCommentText("");
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Pendiente</span>;
      case 'resolved': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Resuelto</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al mapa
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-3xl overflow-hidden shadow-lg border border-border">
            {report.imageUrl && (
              <div className="w-full h-72 bg-muted relative">
                <img src={report.imageUrl} alt="Evidencia" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}
            
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {getStatusBadge(report.status)}
                <span className="bg-secondary text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {report.type}
                </span>
              </div>

              <h1 className="text-3xl font-display font-bold text-foreground mb-4">{report.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
                <div className="flex items-center gap-1.5 font-medium">
                  <User className="h-4 w-4 text-primary" /> {report.author?.name || "Usuario"}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" /> {report.location}
                </div>
                <div>
                  {format(new Date(report.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                </div>
              </div>

              <div className="prose text-foreground max-w-none">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" /> Descripción del problema
                </h3>
                <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">{report.description}</p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-card rounded-3xl p-6 md:p-8 shadow-lg border border-border">
            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2 text-foreground">
              <MessageSquare className="h-6 w-6 text-primary" /> 
              Comentarios ({report.comments?.length || 0})
            </h3>

            <div className="space-y-6 mb-8">
              {report.comments?.length === 0 ? (
                <p className="text-center text-muted-foreground italic py-4">No hay comentarios aún. ¡Inicia la conversación!</p>
              ) : (
                report.comments?.map((comment: any) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold">{comment.author?.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 bg-muted p-4 rounded-2xl rounded-tl-none">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-sm text-foreground">{comment.author?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), "dd MMM HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {user ? (
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center shrink-0 text-white font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 space-y-2">
                  <Textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Agrega información útil o apoya este reporte..."
                    className="min-h-[100px] resize-none rounded-xl focus-visible:ring-primary bg-background"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleComment} 
                      disabled={isCommenting || !commentText.trim()}
                      className="rounded-xl shadow-md gap-2"
                    >
                      <Send className="h-4 w-4" /> Comentar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-secondary/50 p-4 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-3">Inicia sesión para unirte a la conversación</p>
                <Link href="/auth">
                  <Button variant="outline" size="sm" className="rounded-full bg-background">Ingresar</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Map & Meta */}
        <div className="space-y-6">
          <div className="bg-card rounded-3xl p-2 shadow-lg border border-border">
            <div className="h-[300px] w-full rounded-2xl overflow-hidden">
              <MapDisplay 
                reports={[report]} 
                center={[report.latitude, report.longitude]} 
                zoom={14} 
                interactive={false} 
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/10 rounded-3xl p-6 shadow-sm border border-green-200 dark:border-green-800/50">
            <h4 className="font-bold text-green-800 dark:text-green-400 mb-2">Impacto del Reporte</h4>
            <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed mb-4">
              Este reporte suma a las estadísticas ambientales de Colombia. Las autoridades pertinentes utilizan esta data para enfocar sus esfuerzos de limpieza y recuperación.
            </p>
            <div className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-3 rounded-xl">
              <span className="text-sm font-medium">Recompensas</span>
              <span className="font-bold text-primary flex items-center gap-1">
                +10 <Leaf className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
