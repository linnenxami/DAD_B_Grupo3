import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando registro de datos de prueba para el conductor...");

  // 1. Obtener o crear al conductor Carlos Mendoza
  let conductor = await prisma.persona.findFirst({
    where: { dni: "87654321" },
  });

  if (!conductor) {
    console.log("Conductor 'Carlos Mendoza' no encontrado. Creándolo...");
    conductor = await prisma.persona.create({
      data: {
        nombres: "Carlos",
        apellidos: "Mendoza",
        dni: "87654321",
        telefono: "987654321",
        usuario: {
          create: {
            correo: "conductor@elcumbe.com",
            contrasena: "$2b$10$wKzPZ6sVqUuEaHkQfUq/P.X0FzCpeqA/rB3Jsk/zZk3Fj5v6T.2C6", // contraseña '123456' en hash
            rol: "conductor",
          },
        },
      },
    });
  }
  console.log(`✅ Conductor seleccionado: ${conductor.nombres} ${conductor.apellidos} (ID: ${conductor.id})`);

  // 2. Obtener o crear sucursales
  let sucursalChiclayo = await prisma.sucursal.findFirst({
    where: { nombre: { contains: "Chiclayo" } },
  });
  if (!sucursalChiclayo) {
    sucursalChiclayo = await prisma.sucursal.create({
      data: { nombre: "Chiclayo", direccion: "Terminal Terrestre Chiclayo Av. Bolognesi" },
    });
  }

  let sucursalJaen = await prisma.sucursal.findFirst({
    where: { nombre: { contains: "Jaén" } },
  });
  if (!sucursalJaen) {
    sucursalJaen = await prisma.sucursal.create({
      data: { nombre: "Jaén", direccion: "Terminal Terrestre Jaén Av. Pakamuros" },
    });
  }
  console.log(`✅ Sucursales validadas: ${sucursalChiclayo.nombre} y ${sucursalJaen.nombre}`);

  // 3. Obtener o crear ruta Chiclayo -> Jaén
  let ruta = await prisma.ruta.findFirst({
    where: { origen_id: sucursalChiclayo.id, destino_id: sucursalJaen.id },
  });
  if (!ruta) {
    ruta = await prisma.ruta.create({
      data: {
        origen_id: sucursalChiclayo.id,
        destino_id: sucursalJaen.id,
        duracion_estimada_minutos: 300, // 5 horas
        precio_base: 50.00,
      },
    });
  }
  console.log(`✅ Ruta de viaje validada (ID: ${ruta.id}): ${sucursalChiclayo.nombre} -> ${sucursalJaen.nombre}`);

  // 4. Obtener o crear un bus
  let bus = await prisma.bus.findFirst({
    where: { placa: "CUM-789" },
  });
  if (!bus) {
    bus = await prisma.bus.create({
      data: {
        placa: "CUM-789",
        marca: "Mercedes-Benz",
        capacidad: 40,
        pisos: 1,
      },
    });
  }
  console.log(`✅ Bus asignado validado: Placa ${bus.placa}`);

  // 5. Crear el viaje de prueba para hoy
  const hoy = new Date();
  // El conductor necesita que el viaje salga "hoy" para verlo en el dashboard principal
  hoy.setHours(20, 0, 0, 0); // Fijar salida para hoy a las 8:00 PM

  const viaje = await prisma.viaje.create({
    data: {
      ruta_id: ruta.id,
      bus_id: bus.id,
      conductor_id: conductor.id,
      fecha_salida: hoy,
      estado: "programado",
    },
  });
  console.log(`✅ ¡Viaje de Chiclayo a Jaén Creado! (ID Viaje: ${viaje.id})`);

  // 6. Generar Asientos del Viaje y Pasajeros
  console.log("⚙️  Generando asientos del viaje...");
  const asientosData = [];
  for (let i = 1; i <= 10; i++) {
    asientosData.push({
      numero_asiento: i,
      piso: 1,
      estado: i <= 2 ? "ocupado" : "disponible", // Primeros 2 asientos ocupados
    });
  }

  // Crear registros de asientos del viaje uno a uno para evitar conflictos de transaction
  const asientosCreados = [];
  for (const asData of asientosData) {
    const asiento = await prisma.asientoViaje.create({
      data: {
        viaje_id: viaje.id,
        numero_asiento: asData.numero_asiento,
        piso: asData.piso,
        estado: asData.estado,
      },
    });
    asientosCreados.push(asiento);
  }
  console.log(`✅ ${asientosCreados.length} asientos registrados para el viaje.`);

  // 7. Crear pasajeros y pasajes de prueba
  console.log("⚙️  Registrando pasajeros de prueba...");
  const personaPasajero1 = await prisma.persona.create({
    data: { nombres: "Juan", apellidos: "Pérez", dni: "44556677", telefono: "944556677" },
  });

  const personaPasajero2 = await prisma.persona.create({
    data: { nombres: "María", apellidos: "Gómez", dni: "77665544", telefono: "977665544" },
  });

  await prisma.pasaje.create({
    data: {
      asiento_viaje_id: asientosCreados[0].id, // Asiento 1
      persona_id: personaPasajero1.id,
      precio: 50.00,
      codigo_qr: `QR-TEST-C1-${viaje.id}`,
      abordado: false,
    },
  });

  await prisma.pasaje.create({
    data: {
      asiento_viaje_id: asientosCreados[1].id, // Asiento 2
      persona_id: personaPasajero2.id,
      precio: 55.00,
      codigo_qr: `QR-TEST-C2-${viaje.id}`,
      abordado: false,
    },
  });
  console.log("✅ Pasajeros y pasajes de prueba asignados.");

  // 8. Registrar encomiendas de prueba para el viaje
  console.log("⚙️  Asignando encomiendas de bodega...");
  const personaRemitente = await prisma.persona.create({
    data: { nombres: "Julio", apellidos: "Alva", dni: "11223344", telefono: "911223344" },
  });
  const personaDestinatario = await prisma.persona.create({
    data: { nombres: "Ana", apellidos: "Rios", dni: "44332211", telefono: "944332211" },
  });

  await prisma.encomienda.create({
    data: {
      codigo_seguimiento: `ENC-${viaje.id}-01`,
      remitente_id: personaRemitente.id,
      destinatario_id: personaDestinatario.id,
      origen_id: sucursalChiclayo.id,
      destino_id: sucursalJaen.id,
      viaje_id: viaje.id,
      peso_kg: 15.50,
      descripcion: "Caja mediana con repuestos mecánicos",
      precio: 25.00,
      estado: "en_transito",
    },
  });

  await prisma.encomienda.create({
    data: {
      codigo_seguimiento: `ENC-${viaje.id}-02`,
      remitente_id: personaRemitente.id,
      destinatario_id: personaDestinatario.id,
      origen_id: sucursalChiclayo.id,
      destino_id: sucursalJaen.id,
      viaje_id: viaje.id,
      peso_kg: 8.20,
      descripcion: "Saco pequeño de encomiendas de vestir",
      precio: 15.00,
      estado: "en_transito",
    },
  });
  console.log("✅ Encomiendas de bodega asociadas con éxito.");

  console.log("\n🎉 ¡Suite de datos de prueba creada con éxito! 🎉");
  console.log("Detalles del viaje:");
  console.log(`  - Conductor: Carlos Mendoza (conductor@elcumbe.com)`);
  console.log(`  - Ruta: ${sucursalChiclayo.nombre} ➡️  ${sucursalJaen.nombre}`);
  console.log(`  - ID del viaje: ${viaje.id}`);
  console.log(`  - Fecha de salida: ${viaje.fecha_salida.toLocaleString()}`);
  console.log(`  - Pasajeros: 2 registrados (Juan Pérez y María Gómez)`);
  console.log(`  - Encomiendas en bodega: 2 paquetes`);
}

main()
  .catch((e) => {
    console.error("❌ Error al crear datos de prueba:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
