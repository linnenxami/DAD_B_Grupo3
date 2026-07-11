import { prisma } from "../lib/prisma";
import { resolverIncidente } from "../app/(admin)/actions/conductor";

async function main() {
  console.log("=== Diagnóstico Granular ===");
  try {
    // Resetear a false para pruebas repetibles
    await prisma.bitacoraViaje.updateMany({
      where: { viaje_id: 64 },
      data: { solucionado: false, fecha_solucion: null }
    });

    const bitacoras = await prisma.bitacoraViaje.findMany({
      where: { viaje_id: 64 }
    });
    
    if (bitacoras.length > 0) {
      const bitacora = bitacoras[0];
      const targetId = Number(bitacora.id);
      console.log(`Paso 1: Datos de bitácora encontrados. ID: ${targetId}`);
      
      const fechaCreacion = bitacora.created_at ? new Date(bitacora.created_at) : new Date();
      const fechaSolucion = new Date();
      const diferenciaMs = fechaSolucion.getTime() - fechaCreacion.getTime();
      const minutosTranscurridos = Math.max(1, Math.round(diferenciaMs / (1000 * 60)));
      
      console.log(`Paso 2: Diferencia calculada = ${diferenciaMs}ms (${minutosTranscurridos} minutos)`);
      
      console.log("Paso 3: Actualizando BitacoraViaje en base de datos...");
      await prisma.bitacoraViaje.update({
        where: { id: targetId },
        data: {
          solucionado: true,
          fecha_solucion: fechaSolucion,
          retraso_minutos: minutosTranscurridos
        }
      });
      console.log("¡BitacoraViaje actualizada con éxito!");
      
      console.log("Paso 4: Buscando Viaje...");
      const viaje = await prisma.viaje.findUnique({
        where: { id: bitacora.viaje_id }
      });
      
      if (viaje) {
        console.log(`Viaje encontrado. fecha_llegada actual: ${viaje.fecha_llegada}`);
        if (viaje.fecha_llegada && minutosTranscurridos > 0) {
          const nuevaLlegada = new Date(viaje.fecha_llegada.getTime() + minutosTranscurridos * 60 * 1000);
          console.log(`Paso 5: Actualizando fecha_llegada del Viaje a: ${nuevaLlegada.toISOString()}`);
          await prisma.viaje.update({
            where: { id: bitacora.viaje_id },
            data: { fecha_llegada: nuevaLlegada }
          });
          console.log("¡Viaje actualizado con éxito!");
        } else {
          console.log("No se actualizó fecha_llegada porque es null o minutosTranscurridos <= 0");
        }
      } else {
        console.log("Viaje no encontrado.");
      }
    } else {
      console.log("No hay novedades pendientes de solucionar.");
    }
  } catch (error) {
    console.error("Error granular detectado:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
