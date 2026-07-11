import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Iniciando reseteo del viaje de prueba 24...");

  const hoy = new Date();
  hoy.setHours(20, 0, 0, 0); // Fijar salida para hoy a las 8:00 PM (hora local)

  // Resetear el estado en la base de datos a "programado" y fecha a hoy
  const viaje = await prisma.viaje.update({
    where: { id: 24 },
    data: {
      estado: "programado",
      fecha_salida: hoy,
    },
  });

  console.log(`✅ Viaje ID ${viaje.id} (${viaje.estado}) reseteado de forma exitosa en la base de datos MySQL.`);
}

main()
  .catch((e) => {
    console.error("❌ Error al resetear viaje:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
