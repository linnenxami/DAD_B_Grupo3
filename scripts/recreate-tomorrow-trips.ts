import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Limpiando viajes previos creados con IDs incorrectos...");

  // 1. Eliminar viajes creados en la corrida anterior (IDs >= 25)
  // Las cascadas onDelete en AsientoViaje, etc. se encargarán del resto de tablas
  const deleteResult = await prisma.viaje.deleteMany({
    where: {
      id: {
        gte: BigInt(25),
      },
    },
  });
  console.log(`✅ Se eliminaron ${deleteResult.count} viajes anteriores.`);

  // 2. Verificar y crear la ruta Cajamarca (4) ➡️ Jaén (1) si no existe
  let rutaCajamarcaJaen = await prisma.ruta.findFirst({
    where: {
      origen_id: BigInt(4),
      destino_id: BigInt(1),
    },
  });

  if (!rutaCajamarcaJaen) {
    console.log("🛤️ La ruta Cajamarca ➡️ Jaén no existe en la base de datos. Creándola...");
    rutaCajamarcaJaen = await prisma.ruta.create({
      data: {
        origen_id: BigInt(4),
        destino_id: BigInt(1),
        duracion_estimada_minutos: 360, // 6 horas
        precio_base: 50.00,
      },
    });
    console.log(`✅ Ruta Cajamarca ➡️ Jaén creada con ID: ${rutaCajamarcaJaen.id}`);
  } else {
    console.log(`✅ Ruta Cajamarca ➡️ Jaén ya existía con ID: ${rutaCajamarcaJaen.id}`);
  }

  // 3. Obtener todas las rutas (incluida la nueva)
  const rutas = await prisma.ruta.findMany({
    include: {
      origen: true,
      destino: true,
    },
  });
  console.log(`ℹ️ Total de rutas a procesar: ${rutas.length}`);

  // 4. Obtener buses disponibles
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

  // 5. Obtener conductores disponibles
  const conductores = await prisma.persona.findMany({
    where: {
      usuario: {
        rol: "conductor",
      },
    },
  });

  // 6. Calcular el día de mañana en formato UTC
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  const anio = manana.getFullYear();
  const mes = manana.getMonth(); // 0-indexed
  const dia = manana.getDate();

  console.log(`📅 Fecha objetivo para mañana (Local): ${manana.toDateString()}`);

  const horas = [
    { label: "8:00 AM", horas: 8, minutos: 0 },
    { label: "3:00 PM", horas: 15, minutos: 0 },
    { label: "10:00 PM", horas: 22, minutos: 0 },
  ];

  let viajesCreadosCount = 0;
  let asientosCreadosCount = 0;

  // 7. Generar los viajes con fechas "naive UTC"
  for (const ruta of rutas) {
    console.log(`\n🛤️ Procesando ruta: ${ruta.origen.nombre} ➡️ ${ruta.destino.nombre} (ID: ${ruta.id})`);

    for (let hIndex = 0; hIndex < horas.length; hIndex++) {
      const horaInfo = horas[hIndex];
      
      // Crear objeto Date usando Date.UTC para almacenar la hora exacta como "naive timestamp"
      const fechaSalida = new Date(Date.UTC(anio, mes, dia, horaInfo.horas, horaInfo.minutos, 0, 0));

      // Calcular fecha de llegada
      const fechaLlegada = new Date(fechaSalida);
      fechaLlegada.setMinutes(fechaLlegada.getMinutes() + ruta.duracion_estimada_minutos);

      // Asignar bus y conductor rotativamente
      const bus = buses[hIndex % buses.length];
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
      console.log(`  ➕ Viaje creado para las ${horaInfo.label} (Salida UTC-naive: ${viaje.fecha_salida.toISOString()}) - ID: ${viaje.id} con Bus: ${bus.placa}`);

      // Generar asientos
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

      // Crear los asientos
      await prisma.asientoViaje.createMany({
        data: asientosData,
      });

      asientosCreadosCount += asientosData.length;
    }
  }

  console.log(`\n🎉 Recreación completada con éxito.`);
  console.log(`📊 Resumen:`);
  console.log(`   - Viajes creados: ${viajesCreadosCount}`);
  console.log(`   - Asientos creados: ${asientosCreadosCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Error en la recreación de viajes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
