import { useState } from "react";
import { useReports } from "@/hooks/use-reports";
import { MapDisplay } from "@/components/reports/MapDisplay";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";
import { MapPin, Image as ImageIcon, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: reports = [], isLoading } = useReports();
  const [view, setView] = useState<"map" | "list">("map");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Cargando territorio...</p>
      </div>
    );
  }

  // Data for charts
  const typeCounts = reports.reduce((acc: any, report: any) => {
    acc[report.type] = (acc[report.type] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(typeCounts).map(key => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    count: typeCounts[key]
  }));

  const COLORS = ['#2E7D32', '#66BB6A', '#FFA726', '#42A5F5'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Panel de Control</h1>
          <p className="text-muted-foreground mt-1">Explora los problemas reportados en tu región</p>
        </div>
        <Link href="/create-report">
          <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30">
            <Plus className="h-5 w-5" /> Nuevo Reporte
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main View Area (Map/List) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-card p-2 rounded-2xl shadow-sm border border-border">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant={view === "map" ? "default" : "ghost"} 
                onClick={() => setView("map")}
                className={`rounded-xl flex-1 sm:flex-none ${view === 'map' ? 'shadow-md' : ''}`}
              >
                Vista Mapa
              </Button>
              <Button 
                variant={view === "list" ? "default" : "ghost"} 
                onClick={() => setView("list")}
                className={`rounded-xl flex-1 sm:flex-none ${view === 'list' ? 'shadow-md' : ''}`}
              >
                Vista Lista
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-3xl p-2 shadow-lg shadow-black/5 border border-border h-[500px]">
            {view === "map" ? (
              <MapDisplay reports={reports} />
            ) : (
              <div className="h-full overflow-y-auto pr-2 space-y-4 p-2 custom-scrollbar">
                {reports.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No hay reportes todavía. ¡Sé el primero!
                  </div>
                ) : (
                  reports.map((report: any) => (
                    <ReportListItem key={report.id} report={report} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          <div className="bg-card rounded-3xl p-6 shadow-lg shadow-black/5 border border-border">
            <h3 className="font-display font-bold text-lg mb-6">Resumen de Categorías</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{fontSize: 12}} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-accent rounded-3xl p-6 shadow-lg text-primary-foreground">
            <h3 className="font-display font-bold text-xl mb-2">Total de Reportes</h3>
            <p className="text-5xl font-black">{reports.length}</p>
            <p className="opacity-80 mt-2 text-sm">Ayudando a limpiar nuestro país, un reporte a la vez.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportListItem({ report }: { report: any }) {
  return (
    <Link href={`/report/${report.id}`}>
      <div className="group bg-background p-4 rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer flex gap-4">
        {report.imageUrl ? (
          <img src={report.imageUrl} alt="reporte" className="w-24 h-24 object-cover rounded-xl shrink-0" />
        ) : (
          <div className="w-24 h-24 bg-secondary rounded-xl flex items-center justify-center shrink-0">
            <ImageIcon className="h-8 w-8 text-primary/40" />
          </div>
        )}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-foreground truncate pr-2 group-hover:text-primary transition-colors">{report.title}</h4>
              <span className="text-[10px] uppercase font-bold bg-secondary text-primary px-2 py-1 rounded-full shrink-0">
                {report.type}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">{report.description}</p>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{report.location}</span>
            </div>
            <div className="shrink-0 flex gap-3">
              <span>{format(new Date(report.createdAt), "dd MMM")}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
