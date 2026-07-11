import { obtenerViajes, obtenerConductores } from "../../actions/viajes";
import { obtenerRutas } from "../../actions/rutas";
import { obtenerBuses } from "../../actions/buses";
import ViajeClient from "./ViajeClient";

export const dynamic = "force-dynamic";

export default async function ViajesPage() {
  const [viajesRes, rutasRes, busesRes, conductoresRes] = await Promise.all([
    obtenerViajes(),
    obtenerRutas(),
    obtenerBuses(),
    obtenerConductores()
  ]);

  if (!viajesRes.success) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Error al cargar los viajes: {viajesRes.error}</p>
      </div>
    );
  }

  const rutas = rutasRes.success ? rutasRes.data : [];
  const buses = busesRes.success ? busesRes.data : [];
  const conductores = conductoresRes.success ? conductoresRes.data : [];

  return (
    <div>
      <ViajeClient 
        initialViajes={viajesRes.data || []} 
        rutas={rutas} 
        buses={buses} 
        conductores={conductores}
      />
    </div>
  );
}
