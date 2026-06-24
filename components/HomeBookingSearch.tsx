"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocations } from "@/app/actions";
import { MapPin, Calendar as CalendarIcon, Search, Loader2 } from "lucide-react";

export default function HomeBookingSearch() {
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [peruDate] = useState(() => {
    const options = { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" } as const;
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === "year")?.value;
    const month = parts.find(p => p.type === "month")?.value;
    const day = parts.find(p => p.type === "day")?.value;
    return `${year}-${month}-${day}`;
  });

  const [date, setDate] = useState(peruDate);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOriginChange = (val: string) => {
    if (val && val === destinationId) {
      setDestinationId(originId);
    }
    setOriginId(val);
  };

  const handleDestinationChange = (val: string) => {
    if (val && val === originId) {
      setOriginId(destinationId);
    }
    setDestinationId(val);
  };

  useEffect(() => {
    async function loadLocations() {
      try {
        const locs = await getLocations();
        setLocations(locs);
      } catch (err) {
        console.error("Error al cargar sucursales:", err);
      }
    }
    loadLocations();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originId || !destinationId || !date) {
      setError("Por favor, completa todos los campos para buscar viajes.");
      return;
    }

    setError("");
    setLoading(true);
    
    // Redirigir a la página de compra pasando los parámetros de búsqueda en la URL
    router.push(`/compra?origin=${originId}&destination=${destinationId}&date=${date}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-20">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 backdrop-blur-md bg-white/95">
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <span className="w-2.5 h-6 bg-[#f07639] rounded-full mr-2.5"></span>
              ¿A dónde quieres viajar hoy?
            </h3>
            {error && (
              <span className="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-pulse">
                {error}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* ORIGEN */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Origen</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-[#f07639]" />
                </div>
                <select
                  className="block w-full pl-11 pr-4 py-4 text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f07639]/20 focus:border-[#f07639] rounded-xl bg-gray-50/50 text-gray-800 transition-all cursor-pointer hover:bg-gray-50"
                  value={originId}
                  onChange={(e) => handleOriginChange(e.target.value)}
                >
                  <option value="">Selecciona Origen</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* DESTINO */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Destino</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-[#f07639]" />
                </div>
                <select
                  className="block w-full pl-11 pr-4 py-4 text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f07639]/20 focus:border-[#f07639] rounded-xl bg-gray-50/50 text-gray-800 transition-all cursor-pointer hover:bg-gray-50"
                  value={destinationId}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                >
                  <option value="">Selecciona Destino</option>
                  {locations
                    .filter((loc) => loc.id.toString() !== originId.toString())
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nombre}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* FECHA */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fecha de Viaje</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-[#f07639]" />
                </div>
                <input
                  type="date"
                  min={peruDate}
                  className="block w-full pl-11 pr-4 py-4 text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f07639]/20 focus:border-[#f07639] rounded-xl bg-gray-50/50 text-gray-800 transition-all cursor-pointer hover:bg-gray-50"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-xl shadow-md text-white bg-[#f07639] hover:bg-[#d8662d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f07639] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Buscar Viajes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
