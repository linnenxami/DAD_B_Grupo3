import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SUCURSALES ===");
  const sucursales = await prisma.sucursal.findMany();
  for (const s of sucursales) {
    console.log(`ID: ${s.id} - Nombre: ${s.nombre}`);
  }

  console.log("\n=== RUTAS ===");
  const rutas = await prisma.ruta.findMany({
    include: {
      origen: true,
      destino: true,
    }
  });
  for (const r of rutas) {
    console.log(`ID: ${r.id} | Origen: ID ${r.origen_id} (${r.origen.nombre}) ➡️ Destino: ID ${r.destino_id} (${r.destino.nombre})`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
