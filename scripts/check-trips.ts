import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const viajes = await prisma.viaje.findMany({
    take: 10,
    orderBy: { id: "desc" },
    include: {
      ruta: {
        include: {
          origen: true,
          destino: true,
        }
      }
    }
  });

  console.log("=== ÚLTIMOS VIAJES ===");
  for (const v of viajes) {
    console.log(`ID: ${v.id} | Ruta: ${v.ruta.origen.nombre} ➡️ ${v.ruta.destino.nombre} | Fecha Salida (ISO): ${v.fecha_salida.toISOString()} | Local String: ${v.fecha_salida.toLocaleString()}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
