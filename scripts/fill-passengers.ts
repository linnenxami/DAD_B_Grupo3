import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PASAJEROS_DEMO = [
  { nombres: "Juan Carlos", apellidos: "Pérez Rojas", dni: "45010001", telefono: "945010001", abordado: true },
  { nombres: "María Elena", apellidos: "Gómez Alva", dni: "45010002", telefono: "945010002", abordado: true },
  { nombres: "Pedro Luis", apellidos: "Flores Díaz", dni: "45010003", telefono: "945010003", abordado: true },
  { nombres: "Ana Julia", apellidos: "Solano Ríos", dni: "45010004", telefono: "945010004", abordado: false }, // Pendiente
  { nombres: "Luis Alberto", apellidos: "Castro Huamán", dni: "45010005", telefono: "945010005", abordado: true },
  { nombres: "Carmen Rosa", apellidos: "Ruiz Mendoza", dni: "45010006", telefono: "945010006", abordado: true },
  { nombres: "Jorge Luis", apellidos: "Chávez Quispe", dni: "45010007", telefono: "945010007", abordado: true },
  { nombres: "Rosa María", apellidos: "Torres Silva", dni: "45010008", telefono: "945010008", abordado: true },
  { nombres: "Miguel Ángel", apellidos: "Quispe Mamani", dni: "45010009", telefono: "945010009", abordado: true },
  { nombres: "Sofía Lorena", apellidos: "Mamani Vargas", dni: "45010010", telefono: "945010010", abordado: false }, // Pendiente
  { nombres: "Carlos Augusto", apellidos: "Díaz Sánchez", dni: "45010011", telefono: "945010011", abordado: true },
  { nombres: "Elena Victoria", apellidos: "Sánchez Romero", dni: "45010012", telefono: "945010012", abordado: true },
  { nombres: "José Manuel", apellidos: "Mendoza Herrera", dni: "45010013", telefono: "945010013", abordado: true },
  { nombres: "Lucía Fernanda", apellidos: "Ramos Medina", dni: "45010014", telefono: "945010014", abordado: true },
  { nombres: "Francisco Javier", apellidos: "Silva Castro", dni: "45010015", telefono: "945010015", abordado: true },
  { nombres: "Juana Beatriz", apellidos: "Morales Delgado", dni: "45010016", telefono: "945010016", abordado: true },
  { nombres: "David Orlando", apellidos: "Castillo Ortega", dni: "45010017", telefono: "945010017", abordado: true },
  { nombres: "Isabel Cristina", apellidos: "Guerrero Vargas", dni: "45010018", telefono: "945010018", abordado: true },
  { nombres: "Alejandro René", apellidos: "Romero Rojas", dni: "45010019", telefono: "945010019", abordado: true },
  { nombres: "Patricia Inés", apellidos: "Herrera Salazar", dni: "45010020", telefono: "945010020", abordado: false }, // Pendiente
  { nombres: "Fernando Gabriel", apellidos: "Medina Paredes", dni: "45010021", telefono: "945010021", abordado: true },
  { nombres: "Teresa de Jesús", apellidos: "Castro Ganoza", dni: "45010022", telefono: "945010022", abordado: true },
  { nombres: "Roberto Carlos", apellidos: "Vargas Cárdenas", dni: "45010023", telefono: "945010023", abordado: true },
  { nombres: "Silvia Patricia", apellidos: "Rojas Gutiérrez", dni: "45010024", telefono: "945010024", abordado: true },
  { nombres: "Oscar Eduardo", apellidos: "Delgado Flores", dni: "45010025", telefono: "945010025", abordado: true },
  { nombres: "Natalia Mercedes", apellidos: "Ortega Benítez", dni: "45010026", telefono: "945010026", abordado: true },
  { nombres: "Walter Enrique", apellidos: "Silva Santos", dni: "45010027", telefono: "945010027", abordado: true },
  { nombres: "Beatriz Amanda", apellidos: "Ramos Navarro", dni: "45010028", telefono: "945010028", abordado: true },
  { nombres: "Raúl Ernesto", apellidos: "Morales Espinoza", dni: "45010029", telefono: "945010029", abordado: true },
  { nombres: "Julia Elizabeth", apellidos: "Espinoza Salazar", dni: "45010030", telefono: "945010030", abordado: false }, // Pendiente
  { nombres: "Ricardo Alfredo", apellidos: "Mendoza Paredes", dni: "45010031", telefono: "945010031", abordado: true },
  { nombres: "Gloria Estela", apellidos: "Salazar Cárdenas", dni: "45010032", telefono: "945010032", abordado: true },
  { nombres: "César Augusto", apellidos: "Paredes Huamán", dni: "45010033", telefono: "945010033", abordado: true },
  { nombres: "Mónica Sofía", apellidos: "Cárdenas Alva", dni: "45010034", telefono: "945010034", abordado: true },
  { nombres: "Hugo Humberto", apellidos: "Gutiérrez Flores", dni: "45010035", telefono: "945010035", abordado: true },
  { nombres: "Pilar Angélica", apellidos: "Flores Díaz", dni: "45010036", telefono: "945010036", abordado: true },
  { nombres: "Andrés Abelardo", apellidos: "Benítez Ríos", dni: "45010037", telefono: "945010037", abordado: true },
  { nombres: "Victoria Raquel", apellidos: "Ramos Solano", dni: "45010038", telefono: "945010038", abordado: true },
  { nombres: "Daniel Stefano", apellidos: "Santos Vargas", dni: "45010039", telefono: "945010039", abordado: true },
  { nombres: "Sara Noemí", apellidos: "Navarro Castro", dni: "45010040", telefono: "945010040", abordado: true }
];

async function main() {
  const viajeId = 24;
  console.log(`🔄 Rellenando con pasajeros el viaje ID ${viajeId}...`);

  // 1. Verificar existencia del viaje
  const viaje = await prisma.viaje.findUnique({
    where: { id: BigInt(viajeId) }
  });

  if (!viaje) {
    console.error(`❌ Viaje con ID ${viajeId} no existe en la base de datos.`);
    return;
  }

  // 2. Limpiar registros de pasajes existentes en cascada sobre los asientos del viaje
  const deletePasajesResult = await prisma.pasaje.deleteMany({
    where: {
      asiento_viaje: { viaje_id: BigInt(viajeId) }
    }
  });
  console.log(`🧹 Eliminados ${deletePasajesResult.count} pasajes antiguos del viaje.`);

  // 3. Limpiar los asientos registrados del viaje
  const deleteAsientosResult = await prisma.asientoViaje.deleteMany({
    where: { viaje_id: BigInt(viajeId) }
  });
  console.log(`🧹 Eliminados ${deleteAsientosResult.count} asientos antiguos del viaje.`);

  // 4. Sembrar nuevos asientos y sus pasajes con personas
  console.log("⚙️  Sembrando 40 asientos y pasajes con datos reales de clientes...");
  let count = 0;
  for (let i = 0; i < 40; i++) {
    const numAsiento = i + 1;
    const datosPasajero = PASAJEROS_DEMO[i];

    // Buscar o crear la persona física
    let persona = await prisma.persona.findFirst({
      where: { dni: datosPasajero.dni }
    });

    if (!persona) {
      persona = await prisma.persona.create({
        data: {
          nombres: datosPasajero.nombres,
          apellidos: datosPasajero.apellidos,
          dni: datosPasajero.dni,
          telefono: datosPasajero.telefono
        }
      });
    }

    // Crear el Asiento del viaje ocupado
    const asiento = await prisma.asientoViaje.create({
      data: {
        viaje_id: BigInt(viajeId),
        numero_asiento: numAsiento,
        piso: 1,
        estado: "ocupado"
      }
    });

    // Crear el Pasaje
    await prisma.pasaje.create({
      data: {
        asiento_viaje_id: asiento.id,
        persona_id: persona.id,
        precio: 50.00,
        codigo_qr: `QR-CUM-24-A${numAsiento}`,
        abordado: datosPasajero.abordado
      }
    });

    count++;
  }

  console.log(`✅ ¡Proceso completado! Se sembraron ${count} pasajeros en el viaje ID ${viajeId}.`);
  console.log(`📊 Estadísticas:`);
  console.log(`   - Pasajeros a bordo: ${PASAJEROS_DEMO.filter(p => p.abordado).length}`);
  console.log(`   - Pasajeros pendientes (no subieron): ${PASAJEROS_DEMO.filter(p => !p.abordado).length}`);
}

main()
  .catch((e) => {
    console.error("❌ Error al rellenar pasajeros:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
