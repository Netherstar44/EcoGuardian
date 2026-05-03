import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Droplets, Eye, Gauge, Thermometer, MapPin, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Open-Meteo is free, no API key needed
const WMO_CODES: Record<number, { label: string; emoji: string; isRain: boolean; isCloud: boolean; isStorm: boolean; isFog: boolean; isSnow: boolean }> = {
  0:  { label: "Despejado", emoji: "☀️", isRain: false, isCloud: false, isStorm: false, isFog: false, isSnow: false },
  1:  { label: "Mayormente despejado", emoji: "🌤️", isRain: false, isCloud: true, isStorm: false, isFog: false, isSnow: false },
  2:  { label: "Parcialmente nublado", emoji: "⛅", isRain: false, isCloud: true, isStorm: false, isFog: false, isSnow: false },
  3:  { label: "Nublado", emoji: "☁️", isRain: false, isCloud: true, isStorm: false, isFog: false, isSnow: false },
  45: { label: "Neblina", emoji: "🌫️", isRain: false, isCloud: false, isStorm: false, isFog: true, isSnow: false },
  48: { label: "Neblina helada", emoji: "🌫️", isRain: false, isCloud: false, isStorm: false, isFog: true, isSnow: false },
  51: { label: "Llovizna leve", emoji: "🌦️", isRain: true, isCloud: true, isStorm: false, isFog: false, isSnow: false },
  53: { label: "Llovizna moderada", emoji: "🌦️", isRain: true, isCloud: true, isStorm: false, isFog: false, isSnow: false },
  55: { label: "Llovizna densa", emoji: "🌧️", isRain: true, isCloud: true, isStorm: false, isFog: false, isSnow: false },
  61: { label: "Lluvia leve", emoji: "🌧️", isRain: true, isCloud: true, isStorm: false, isFog: false, isSnow: false },
  63: { label: "Lluvia moderada", emoji: "🌧️", isRain: true, isCloud: true, isStorm: false, isFog: false, isSnow: false },
  65: { label: "Lluvia intensa", emoji: "🌧️", isRain: true, isCloud: true, isStorm: false, isFog: false, isSnow: false },
  71: { label: "Nevada leve", emoji: "🌨️", isRain: false, isCloud: true, isStorm: false, isFog: false, isSnow: true },
  73: { label: "Nevada moderada", emoji: "❄️", isRain: false, isCloud: true, isStorm: false, isFog: false, isSnow: true },
  75: { label: "Nevada intensa", emoji: "❄️", isRain: false, isCloud: true, isStorm: false, isFog: false, isSnow: true },
  80: { label: "Chubascos leves", emoji: "🌦️", isRain: true, isCloud: true, isStorm: false, isFog: false, isSnow: false },
  81: { label: "Chubascos moderados", emoji: "🌧️", isRain: true, isCloud: true, isStorm: false, isFog: false, isSnow: false },
  82: { label: "Chubascos fuertes", emoji: "⛈️", isRain: true, isCloud: true, isStorm: true, isFog: false, isSnow: false },
  95: { label: "Tormenta", emoji: "⛈️", isRain: true, isCloud: true, isStorm: true, isFog: false, isSnow: false },
  96: { label: "Tormenta con granizo", emoji: "⛈️", isRain: true, isCloud: true, isStorm: true, isFog: false, isSnow: false },
  99: { label: "Tormenta severa", emoji: "🌩️", isRain: true, isCloud: true, isStorm: true, isFog: false, isSnow: false },
};

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function toF(c: number) { return Math.round(c * 9/5 + 32); }
function formatTemp(c: number, isFahrenheit: boolean) {
  return isFahrenheit ? `${toF(c)}°F` : `${Math.round(c)}°C`;
}

// ---- SVG Scene ----
function WeatherScene({ code, isNight }: { code: number; isNight: boolean }) {
  const info = WMO_CODES[code] ?? WMO_CODES[0];

  const skyDay = info.isStorm
    ? ["#374151", "#1f2937"]
    : info.isCloud
    ? ["#93c5fd", "#bfdbfe"]
    : ["#38bdf8", "#7dd3fc"];

  const skyNight = info.isStorm
    ? ["#0f172a", "#1e293b"]
    : info.isCloud
    ? ["#1e293b", "#334155"]
    : ["#0f172a", "#1e3a5f"];

  const sky = isNight ? skyNight : skyDay;

  return (
    <svg viewBox="0 0 400 240" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky[0]} />
          <stop offset="100%" stopColor={sky[1]} />
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <filter id="blur2">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <filter id="blur6">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Sky */}
      <rect width="400" height="240" fill="url(#sky)" />

      {/* Stars (night only) */}
      {isNight && !info.isCloud && !info.isStorm && (
        <g opacity="0.9">
          {[
            [30, 20], [80, 40], [130, 15], [200, 30], [270, 18], [330, 45], [370, 25],
            [50, 60], [160, 55], [310, 60], [100, 80], [240, 70], [350, 75],
          ].map(([x, y], i) => (
            <motion.circle
              key={i}
              cx={x} cy={y} r={i % 3 === 0 ? 1.5 : 1}
              fill="white"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </g>
      )}

      {/* Moon */}
      {isNight && !info.isStorm && (
        <g>
          <motion.circle cx={300} cy={55} r={30} fill="#e2e8f0" filter="url(#blur2)"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 0.15, y: 0 }} transition={{ duration: 1 }} />
          <motion.circle cx={300} cy={55} r={22} fill="#f8fafc"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
          <circle cx={310} cy={48} r={16} fill={sky[1]} />
          <circle cx={291} cy={60} r={4} fill="#e2e8f0" opacity="0.4" />
          <circle cx={305} cy={66} r={2.5} fill="#e2e8f0" opacity="0.3" />
        </g>
      )}

      {/* Sun */}
      {!isNight && !info.isStorm && (
        <g>
          <circle cx={300} cy={55} r={50} fill="url(#sunGlow)" filter="url(#blur6)" />
          <motion.circle cx={300} cy={55} r={28} fill="#fde68a"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <circle cx={300} cy={55} r={22} fill="#fbbf24" />
          {/* Rays */}
          {[0,45,90,135,180,225,270,315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 300 + Math.cos(rad) * 30;
            const y1 = 55 + Math.sin(rad) * 30;
            const x2 = 300 + Math.cos(rad) * 40;
            const y2 = 55 + Math.sin(rad) * 40;
            return (
              <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              />
            );
          })}
        </g>
      )}

      {/* Lightning (storm) */}
      {info.isStorm && (
        <motion.path
          d="M220 60 L205 105 L215 105 L198 150 L225 95 L213 95 Z"
          fill="#fde68a"
          animate={{ opacity: [0, 1, 0, 0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, times: [0, 0.05, 0.15, 0.7, 0.75, 0.85] }}
        />
      )}

      {/* Clouds */}
      {(info.isCloud || info.isStorm) && (
        <>
          <motion.g animate={{ x: [-5, 5, -5] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}>
            <ellipse cx={120} cy={75} rx={60} ry={28} fill={info.isStorm ? "#374151" : "#e0f2fe"} opacity="0.95" />
            <ellipse cx={90} cy={82} rx={38} ry={22} fill={info.isStorm ? "#4b5563" : "#f0f9ff"} opacity="0.9" />
            <ellipse cx={155} cy={80} rx={35} ry={20} fill={info.isStorm ? "#4b5563" : "#f0f9ff"} opacity="0.9" />
          </motion.g>
          <motion.g animate={{ x: [3, -3, 3] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
            <ellipse cx={230} cy={65} rx={50} ry={24} fill={info.isStorm ? "#374151" : "#bae6fd"} opacity="0.8" />
            <ellipse cx={210} cy={72} rx={32} ry={18} fill={info.isStorm ? "#4b5563" : "#e0f2fe"} opacity="0.9" />
            <ellipse cx={258} cy={70} rx={30} ry={17} fill={info.isStorm ? "#4b5563" : "#e0f2fe"} opacity="0.9" />
          </motion.g>
        </>
      )}

      {/* Rain drops */}
      {info.isRain && (
        <g>
          {Array.from({ length: 22 }).map((_, i) => {
            const x = 20 + (i * 17) % 370;
            const delay = (i * 0.13) % 1.2;
            return (
              <motion.line key={i}
                x1={x} y1={100 + (i % 5) * 20}
                x2={x - 3} y2={120 + (i % 5) * 20}
                stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"
                animate={{ y: [0, 130], opacity: [0.7, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay, ease: "linear" }}
              />
            );
          })}
        </g>
      )}

      {/* Snow */}
      {info.isSnow && (
        <g>
          {Array.from({ length: 18 }).map((_, i) => {
            const x = 15 + (i * 22) % 370;
            const delay = (i * 0.2) % 1.5;
            return (
              <motion.text key={i} x={x} y={100 + (i % 4) * 25} fontSize="10" fill="white" opacity="0.8"
                animate={{ y: [0, 120], x: [x, x + (i % 2 === 0 ? 8 : -8)], opacity: [0.8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay, ease: "linear" }}
              >❄</motion.text>
            );
          })}
        </g>
      )}

      {/* Fog wisps */}
      {info.isFog && (
        <g opacity="0.5">
          {[100, 150, 200, 250, 300].map((y, i) => (
            <motion.rect key={i} x={0} y={y} width={400} height={12}
              fill="white" rx={6}
              animate={{ x: [-10, 10, -10], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </g>
      )}

      {/* Ground */}
      <rect x={0} y={195} width={400} height={45} fill={isNight ? "#1e293b" : "#bbf7d0"} opacity="0.4" rx={4} />
      {/* Hills */}
      <ellipse cx={60} cy={205} rx={80} ry={30} fill={isNight ? "#1e3a5f" : "#86efac"} opacity="0.5" />
      <ellipse cx={340} cy={210} rx={70} ry={25} fill={isNight ? "#1e3a5f" : "#86efac"} opacity="0.5" />
    </svg>
  );
}

// ---- Forecast card ----
function ForecastDay({ day, maxC, minC, code, isFahrenheit }: { day: string; maxC: number; minC: number; code: number; isFahrenheit: boolean }) {
  const info = WMO_CODES[code] ?? WMO_CODES[0];
  return (
    <div className="flex flex-col items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-4 flex-1 min-w-0 border border-white/20">
      <span className="text-xs font-bold text-white/70 uppercase tracking-wide">{day}</span>
      <span className="text-2xl">{info.emoji}</span>
      <span className="text-sm font-bold text-white">{formatTemp(maxC, isFahrenheit)}</span>
      <span className="text-xs text-white/50">{formatTemp(minC, isFahrenheit)}</span>
    </div>
  );
}

// ---- Hourly dot ----
function HourlyCard({ hour, tempC, code, isFahrenheit, isNow }: { hour: string; tempC: number; code: number; isFahrenheit: boolean; isNow: boolean }) {
  const info = WMO_CODES[code] ?? WMO_CODES[0];
  return (
    <div className={`flex flex-col items-center gap-2 px-4 py-3 rounded-2xl flex-shrink-0 border transition-all ${isNow ? "bg-white/20 border-white/40 scale-105" : "bg-white/5 border-white/10"}`}>
      <span className="text-xs font-semibold text-white/70">{isNow ? "Ahora" : hour}</span>
      <span className="text-xl">{info.emoji}</span>
      <span className="text-sm font-bold text-white">{formatTemp(tempC, isFahrenheit)}</span>
    </div>
  );
}

// ---- Main Component ----
export default function Weather() {
  const [isFahrenheit, setIsFahrenheit] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [location, setLocationData] = useState<{ name: string; lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,visibility,surface_pressure,is_day&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener el clima");
      const data = await res.json();
      setWeather(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Tu ubicación";
      const country = data.address?.country_code?.toUpperCase() || "";
      setLocationData({ name: `${city}${country ? ", " + country : ""}`, lat, lon });
    } catch {
      setLocationData({ name: "Tu ubicación", lat, lon });
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      // Fallback: Bogotá
      const lat = 4.711, lon = -74.0721;
      reverseGeocode(lat, lon);
      fetchWeather(lat, lon);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        reverseGeocode(lat, lon);
        fetchWeather(lat, lon);
      },
      () => {
        // Fallback: Bogotá
        const lat = 4.711, lon = -74.0721;
        reverseGeocode(lat, lon);
        fetchWeather(lat, lon);
      }
    );
  }, []);

  const handleRefresh = () => {
    if (location) fetchWeather(location.lat, location.lon);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary"
        />
        <p className="text-muted-foreground font-medium animate-pulse">Detectando tu ubicación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <span className="text-5xl">🌧️</span>
        <h2 className="text-xl font-bold text-foreground">No se pudo obtener el clima</h2>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button onClick={handleRefresh} className="rounded-full gap-2">
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  }

  if (!weather) return null;

  const curr = weather.current;
  const isDay: boolean = curr.is_day === 1;
  const code: number = curr.weather_code;
  const info = WMO_CODES[code] ?? WMO_CODES[0];

  // Hourly: next 12h
  const nowHour = new Date().getHours();
  const hourlySlice = weather.hourly.time
    .map((t: string, i: number) => ({ time: t, temp: weather.hourly.temperature_2m[i], code: weather.hourly.weather_code[i] }))
    .filter((_: any, i: number) => {
      const h = new Date(weather.hourly.time[i]).getHours();
      const d = new Date(weather.hourly.time[i]).getDate();
      const today = new Date().getDate();
      return d === today && i >= Math.floor(nowHour);
    })
    .slice(0, 12);

  const gradientMap: Record<string, string> = {
    clear_day: "from-sky-400 via-blue-500 to-blue-600",
    clear_night: "from-slate-900 via-blue-950 to-indigo-950",
    cloud_day: "from-blue-300 via-slate-400 to-slate-500",
    cloud_night: "from-slate-800 via-slate-700 to-slate-900",
    rain_day: "from-slate-500 via-blue-700 to-slate-700",
    rain_night: "from-slate-900 via-blue-900 to-slate-900",
    storm_day: "from-gray-700 via-gray-800 to-gray-900",
    storm_night: "from-gray-950 via-slate-900 to-black",
  };

  const bgKey = info.isStorm ? (isDay ? "storm_day" : "storm_night")
    : info.isRain ? (isDay ? "rain_day" : "rain_night")
    : info.isCloud ? (isDay ? "cloud_day" : "cloud_night")
    : isDay ? "clear_day" : "clear_night";

  const bgGradient = gradientMap[bgKey] || gradientMap.clear_day;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-4 px-2">
      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br ${bgGradient}`}
      >
        {/* Scene illustration */}
        <div className="h-52 relative">
          <WeatherScene code={code} isNight={!isDay} />
          {/* Overlay header controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <MapPin className="h-3.5 w-3.5 text-white" />
              <span className="text-white text-sm font-semibold truncate max-w-[180px]">{location?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Unit toggle */}
              <button
                onClick={() => setIsFahrenheit(f => !f)}
                className="bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-bold border border-white/20 hover:bg-white/20 transition-colors"
              >
                °{isFahrenheit ? "C" : "F"}
              </button>
              <button
                onClick={handleRefresh}
                className="bg-black/20 backdrop-blur-sm p-1.5 rounded-full text-white border border-white/20 hover:bg-white/20 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Current temp */}
        <div className="px-6 pb-6 text-white">
          <div className="flex items-end justify-between mb-1">
            <div>
              <motion.p
                key={`${curr.temperature_2m}-${isFahrenheit}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-8xl font-black tracking-tighter leading-none"
              >
                {isFahrenheit ? toF(curr.temperature_2m) : Math.round(curr.temperature_2m)}
                <span className="text-4xl font-light opacity-70">{isFahrenheit ? "°F" : "°C"}</span>
              </motion.p>
              <p className="text-xl font-semibold mt-2 opacity-90">{info.label}</p>
              <p className="text-sm opacity-60 mt-0.5">
                Sensación: {formatTemp(curr.apparent_temperature, isFahrenheit)}
              </p>
            </div>
            <span className="text-6xl">{info.emoji}</span>
          </div>

          {/* Day/Night badge */}
          <div className="mt-3 inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold">
            {isDay ? "☀️ Día" : "🌙 Noche"} · {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Wind, label: "Viento", value: `${Math.round(curr.wind_speed_10m)} km/h` },
          { icon: Droplets, label: "Humedad", value: `${curr.relative_humidity_2m}%` },
          { icon: Eye, label: "Visibilidad", value: `${Math.round((curr.visibility || 10000) / 1000)} km` },
          { icon: Gauge, label: "Presión", value: `${Math.round(curr.surface_pressure)} hPa` },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="border-border bg-card shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-4 gap-1.5">
              <Icon className="h-5 w-5 text-primary opacity-70" />
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <span className="text-base font-bold text-foreground">{value}</span>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Hourly forecast */}
      {hourlySlice.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Próximas horas</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {hourlySlice.map((h: any, i: number) => {
                const hourLabel = new Date(h.time).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
                return (
                  <HourlyCard
                    key={i}
                    hour={hourLabel}
                    tempC={h.temp}
                    code={h.code}
                    isFahrenheit={isFahrenheit}
                    isNow={i === 0}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* 7-day forecast */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Pronóstico 7 días</h3>
          <div className="flex gap-2">
            {weather.daily.time.slice(0, 7).map((dateStr: string, i: number) => {
              const d = new Date(dateStr);
              const dayName = i === 0 ? "Hoy" : DAY_NAMES[d.getDay()];
              return (
                <ForecastDay
                  key={i}
                  day={dayName}
                  maxC={weather.daily.temperature_2m_max[i]}
                  minC={weather.daily.temperature_2m_min[i]}
                  code={weather.daily.weather_code[i]}
                  isFahrenheit={isFahrenheit}
                />
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Sunrise/Sunset */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Sol</h3>
          <div className="flex justify-around">
            <div className="text-center">
              <span className="text-3xl block mb-1">🌅</span>
              <p className="text-xs text-muted-foreground font-medium">Amanecer</p>
              <p className="text-lg font-bold text-foreground">
                {new Date(weather.daily.sunrise[0]).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-24 h-px bg-gradient-to-r from-orange-300 via-yellow-200 to-orange-400 opacity-60" />
            </div>
            <div className="text-center">
              <span className="text-3xl block mb-1">🌇</span>
              <p className="text-xs text-muted-foreground font-medium">Atardecer</p>
              <p className="text-lg font-bold text-foreground">
                {new Date(weather.daily.sunset[0]).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground pb-2 opacity-50">Datos de Open-Meteo · Actualización automática</p>
    </div>
  );
}
