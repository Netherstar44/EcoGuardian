import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Button } from "./button";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultLocation?: [number, number];
}

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export function LocationPicker({ onLocationSelect, defaultLocation = [4.6097, -74.0817] }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (position) {
      onLocationSelect(position.lat, position.lng);
    }
  }, [position, onLocationSelect]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
          setPosition(latlng);
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Haz clic en el mapa para ubicar el problema</p>
        <Button type="button" variant="outline" size="sm" onClick={handleGetCurrentLocation} className="gap-2">
          <MapPin className="h-4 w-4 text-primary" /> Mi ubicación actual
        </Button>
      </div>
      <div className="h-[300px] rounded-xl overflow-hidden border-2 border-border shadow-sm">
        <MapContainer 
          center={defaultLocation} 
          zoom={12} 
          className="w-full h-full z-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>
    </div>
  );
}
