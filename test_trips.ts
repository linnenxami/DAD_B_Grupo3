import { prisma } from './lib/prisma';
import { serializeBigInt } from './lib/utils';

interface MappedTrip {
  id: string;
  ruta_id: string;
  bus_id: string;
  fecha_salida: string;
  fecha_llegada: string | null;
  estado: string;
  created_at: string;
  updated_at: string;
  departure_time_formatted: string;
  available_seats: number;
  [key: string]: any;
}

async function main() {
  const trips = await prisma.viaje.findMany({
    include: {
      ruta: true,
      asientos_viaje: {
        where: {
          estado: "disponible",
        },
      },
    },
  });
  
  console.log("RAW TRIPS:", JSON.stringify(trips, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));

  const serialized = serializeBigInt(trips);
  
  const mapped: MappedTrip[] = serialized.map((trip: any) => ({
    ...trip,
    departure_time_formatted: trip.fecha_salida
      ? new Date(trip.fecha_salida).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })
      : '',
    available_seats: trip.asientos_viaje ? trip.asientos_viaje.length : 0
  }));

  console.log("MAPPED:", JSON.stringify(mapped, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
