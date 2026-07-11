import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando creación de viajes para el día de mañana...");

  // 1. Obtener todas las rutas
  const rutas = await prisma.ruta.findMany({
    include: {
      origen: true,
      destino: true,
    },
  });

  if (rutas.length === 0) {
    console.error("❌ No se encontraron rutas en la base de datos. Por favor, crea rutas antes de ejecutar este script.");
    process.exit(1);
  }

  console.log(`✅ Se encontraron ${rutas.length} rutas.`);

  // 2. Obtener buses disponibles
  let buses = await prisma.bus.findMany();
  if (buses.length === 0) {
    console.log("⚠️ No se encontraron buses. Creando un bus por defecto...");
    const busDefecto = await prisma.bus.create({
      data: {
        placa: "CUM-100",
        marca: "Mercedes-Benz",
        capacidad: 40,
        pisos: 1,
      },
    });
    buses = [busDefecto];
  }
  console.log(`✅ Se encontraron ${buses.length} buses disponibles.`);

  // 3. Obtener conductores disponibles (opcional)
  const conductores = await prisma.persona.findMany({
    where: {
      usuario: {
        rol: "conductor",
      },
    },
  });
  console.log(`ℹ️ Se encontraron ${conductores.length} conductores registrados.`);

  // 4. Calcular el día de mañana
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  console.log(`📅 Fecha base para mañana: ${manana.toDateString()}`);

  // Horas requeridas: 8 am, 3 pm, 10 pm
  const horas = [
    { label: "8:00 AM", horas: 8, minutos: 0 },
    { label: "3:00 PM", horas: 15, minutos: 0 },
    { label: "10:00 PM", horas: 22, minutos: 0 },
  ];

  let viajesCreadosCount = 0;
  let asientosCreadosCount = 0;

  // 5. Iterar por cada ruta e insertar viajes para cada hora
  for (const ruta of rutas) {
    console.log(`\n🛤️ Procesando ruta: ${ruta.origen.nombre} ➡️ ${ruta.destino.nombre} (ID: ${ruta.id})`);

    for (let hIndex = 0; hIndex < horas.length; hIndex++) {
      const horaInfo = horas[hIndex];
      
      // Crear objeto de fecha de salida
      const fechaSalida = new Date(manana);
      fechaSalida.setHours(horaInfo.horas, horaInfo.minutos, 0, 0);

      // Calcular fecha de llegada estimada basada en la duración de la ruta
      const fechaLlegada = new Date(fechaSalida);
      fechaLlegada.setMinutes(fechaLlegada.getMinutes() + ruta.duracion_estimada_minutos);

      // Asignar un bus de manera rotativa
      const bus = buses[hIndex % buses.length];

      // Asignar un conductor de manera rotativa si existen
      const conductor = conductores.length > 0 ? conductores[hIndex % conductores.length] : null;

      // Crear el viaje
      const viaje = await prisma.viaje.create({
        data: {
          ruta_id: ruta.id,
          bus_id: bus.id,
          conductor_id: conductor ? conductor.id : null,
          fecha_salida: fechaSalida,
          fecha_llegada: fechaLlegada,
          estado: "programado",
        },
      });

      viajesCreadosCount++;
      console.log(`  ➕ Viaje creado para las ${horaInfo.label} (Salida: ${fechaSalida.toLocaleString()}) - ID: ${viaje.id} con Bus: ${bus.placa}`);

      // Generar asientos correspondientes
      let restringidos: number[] = [];
      if (bus.asientos_restringidos) {
        try {
          restringidos = JSON.parse(bus.asientos_restringidos);
        } catch (e) {}
      }

      const asientosData: any[] = [];
      const totalAsientos = bus.capacidad;
      
      let asientosPiso1 = totalAsientos;
      let asientosPiso2 = 0;

      if (bus.pisos === 2) {
        if (bus.asientos_piso_1) {
          asientosPiso1 = bus.asientos_piso_1;
        } else {
          asientosPiso1 = 12;
        }
        asientosPiso2 = totalAsientos - asientosPiso1;
      }

      // Asientos Piso 1
      for (let i = 1; i <= asientosPiso1; i++) {
        asientosData.push({
          viaje_id: viaje.id,
          numero_asiento: i,
          piso: 1,
          estado: restringidos.includes(i) ? "inactivo" : "disponible"
        });
      }

      // Asientos Piso 2
      if (bus.pisos === 2) {
        for (let i = 1; i <= asientosPiso2; i++) {
          const numAsiento = asientosPiso1 + i;
          asientosData.push({
            viaje_id: viaje.id,
            numero_asiento: numAsiento,
            piso: 2,
            estado: restringidos.includes(numAsiento) ? "inactivo" : "disponible"
          });
        }
      }

      // Crear los asientos en lote
      await prisma.asientoViaje.createMany({
        data: asientosData,
      });

      asientosCreadosCount += asientosData.length;
    }
  }

  console.log(`\n🎉 Proceso completado con éxito.`);
  console.log(`📊 Resumen:`);
  console.log(`   - Viajes creados: ${viajesCreadosCount}`);
  console.log(`   - Asientos creados: ${asientosCreadosCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Error al crear viajes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
