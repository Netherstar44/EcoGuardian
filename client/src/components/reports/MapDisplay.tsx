import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "wouter";

// Fix missing marker icons in React Leaflet
const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = iconDefault;

interface ReportMarker {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  type: string;
}

interface MapDisplayProps {
  reports: ReportMarker[];
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
}

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function MapDisplay({ reports, center = [4.6097, -74.0817], zoom = 5, interactive = true }: MapDisplayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">Cargando mapa...</div>;
  }

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'basura': return 'text-orange-500';
      case 'contaminación de agua': return 'text-blue-500';
      case 'deforestación': return 'text-green-700';
      case 'contaminación del aire': return 'text-gray-500';
      default: return 'text-primary';
    }
  };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-border">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="w-full h-full z-0"
      >
        <MapUpdater center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.latitude, report.longitude]}
          >
            <Popup className="rounded-xl font-sans">
              <div className="p-1">
                <h4 className="font-bold text-base mb-1">{report.title}</h4>
                <p className={`text-sm capitalize font-medium mb-2 ${getTypeColor(report.type)}`}>
                  {report.type}
                </p>
                <Link href={`/report/${report.id}`}>
                  <span className="inline-block w-full text-center bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer">
                    Ver detalles
                  </span>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
