"use server";

import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import bcrypt from "bcrypt";

// Función auxiliar para liberar asientos bloqueados que ya excedieron los 8 minutos
export async function limpiarBloqueosExpirados() {
  try {
    const limiteTiempo = new Date(Date.now() - 8 * 60 * 1000); // 8 minutos atrás
    await prisma.asientoViaje.updateMany({
      where: {
        estado: "pendiente",
        bloqueado_en: {
          lt: limiteTiempo,
        },
      },
      data: {
        estado: "disponible",
        bloqueado_por_usuario_id: null,
        bloqueado_en: null,
      },
    });
  } catch (error) {
    console.error("Error limpiando bloqueos de asientos expirados:", error);
  }
}


// 1. buscarEncomiendasPorDNI
export async function buscarEncomiendasPorDNI(dni: string) {
  try {
    const encomiendas = await prisma.encomienda.findMany({
      where: {
        remitente_dni: dni,
      },
      include: {
        origen: true,
        destino: true,
        viaje: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return serializeBigInt(encomiendas);
  } catch (error) {
    console.error("Error buscando encomiendas:", error);
    return [];
  }
}

// 2. getLocations
export async function getLocations() {
  try {
    const locs = await prisma.sucursal.findMany({
      orderBy: {
        nombre: "asc",
      },
    });
    return serializeBigInt(locs);
  } catch (error) {
    console.error("Error getting locations:", error);
    return [];
  }
}

// 3. searchTrips
export async function searchTrips(originId: string, destinationId: string, date: string) {
  try {
    await limpiarBloqueosExpirados();
    
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    const trips = await prisma.viaje.findMany({
      where: {
        ruta: {
          origen_id: BigInt(originId),
          destino_id: BigInt(destinationId),
        },
        fecha_salida: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        ruta: true,
        bus: true,
        asientos_viaje: true,
      },
      orderBy: {
        fecha_salida: "asc",
      },
    });

    const serialized = serializeBigInt(trips);
    return serialized.map((trip: any) => {
      let timeStr = "";
      if (trip.fecha_salida) {
        const d = new Date(trip.fecha_salida);
        timeStr = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      }

      let available = 0;
      if (trip.asientos_viaje && trip.asientos_viaje.length > 0) {
        available = trip.asientos_viaje.filter((s: any) => s.estado === "disponible").length;
      } else {
        available = trip.bus?.capacidad || 40;
      }

      return {
        ...trip,
        departure_time_formatted: timeStr,
        available_seats: available
      };
    });

  } catch (error) {
    console.error("Error searching trips:", error);
    return [];
  }
}

// 4. getTripSeats
export async function getTripSeats(tripId: string) {
  try {
    await limpiarBloqueosExpirados();
    
    let seats = await prisma.asientoViaje.findMany({
      where: {
        viaje_id: BigInt(tripId),
      },
      orderBy: {
        numero_asiento: "asc",
      },
    });

    if (seats.length === 0) {
      const trip = await prisma.viaje.findUnique({
        where: { id: BigInt(tripId) },
        include: { bus: true }
      });
      const capacity = trip?.bus?.capacidad || 40;
      const pisos = trip?.bus?.pisos || 1;
      
      const newSeatsData = Array.from({ length: capacity }).map((_, i) => ({
        viaje_id: BigInt(tripId),
        numero_asiento: i + 1,
        piso: pisos === 2 && i >= capacity / 2 ? 2 : 1,
        estado: "disponible" as const
      }));

      await prisma.asientoViaje.createMany({ data: newSeatsData });

      seats = await prisma.asientoViaje.findMany({
        where: { viaje_id: BigInt(tripId) },
        orderBy: { numero_asiento: "asc" },
      });
    }

    return serializeBigInt(seats);
  } catch (error) {
    console.error("Error getting trip seats:", error);
    return [];
  }
}

// 5. simularPagoYCrearTicket
export async function simularPagoYCrearTicket(
  tripSeatId: string, 
  price: string,
  pasajeroData: { nombres: string; apellidos: string; dni: string; telefono?: string },
  email?: string
) {
  try {
    let userId: bigint | null = null;
    
    // Si proveen email (tienen sesión activa o intentaron vincular), buscamos el cliente
    if (email) {
      const user = await prisma.cliente.findUnique({ where: { correo: email } });
      if (user) {
        userId = user.id;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const seat = await tx.asientoViaje.findUnique({
        where: { id: BigInt(tripSeatId) },
      });

      if (!seat || seat.estado !== "disponible") {
        throw new Error("Asiento ya no disponible.");
      }

      await tx.asientoViaje.update({
        where: { id: BigInt(tripSeatId) },
        data: { estado: "vendido", bloqueado_por_usuario_id: userId },
      });

      const ticket = await tx.pasaje.create({
        data: {
          asiento_viaje_id: BigInt(tripSeatId),
          nombres: pasajeroData.nombres,
          apellidos: pasajeroData.apellidos,
          dni: pasajeroData.dni,
          telefono: pasajeroData.telefono || null,
          usuario_id: userId,
          precio: parseFloat(price),
          codigo_qr: `QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`,
        },
      });

      return ticket;
    });

    return serializeBigInt(result);
  } catch (error: any) {
    console.error("Error procesando pago:", error);
    throw new Error(error.message || "Error al procesar el pago");
  }
}

// 6. getClienteProfile
export async function getClienteProfile(email: string) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { correo: email },
      include: {
        pasajes: {
          include: {
            asiento_viaje: {
              include: {
                viaje: {
                  include: {
                    ruta: {
                      include: {
                        origen: true,
                        destino: true,
                      },
                    },
                    bus: true,
                  },
                },
              },
            },
          },
          orderBy: {
            fecha_compra: "desc",
          },
        },
      },
    });

    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }

    return serializeBigInt(cliente);
  } catch (error) {
    console.error("Error al obtener perfil de cliente:", error);
    return null;
  }
}

// 7. updateClienteProfile
export async function updateClienteProfile(
  email: string,
  data: { nombre: string; dni?: string; telefono?: string; fecha_nacimiento?: string }
) {
  try {
    const parsedDate = data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null;

    const clienteActualizado = await prisma.cliente.update({
      where: { correo: email },
      data: {
        nombre: data.nombre,
        dni: data.dni || null,
        telefono: data.telefono || null,
        fecha_nacimiento: parsedDate,
      },
    });

    return { success: true, user: serializeBigInt(clienteActualizado) };
  } catch (error: any) {
    console.error("Error al actualizar perfil de cliente:", error);
    let errorMessage = "Ocurrió un error inesperado al guardar los datos.";
    
    // Controlar DNI duplicado
    if (error.code === "P2002" && error.meta?.target?.includes("dni")) {
      errorMessage = "El DNI ingresado ya está registrado por otro cliente.";
    }

    return { success: false, error: errorMessage };
  }
}

// 8. getAdminDashboardStats
export async function getAdminDashboardStats() {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const pasajesHoyCount = await prisma.pasaje.count({
      where: {
        fecha_compra: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const encomiendasActivasCount = await prisma.encomienda.count({
      where: {
        estado: {
          in: ["recepcionado", "en ruta", "arribado"],
        },
      },
    });

    const busesCount = await prisma.bus.count();

    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const nuevosClientesCount = await prisma.cliente.count({
      where: {
        created_at: {
          gte: hace24h,
        },
      },
    });

    const ultimaActividad = await prisma.pasaje.findMany({
      take: 5,
      orderBy: {
        fecha_compra: "desc",
      },
      include: {
        cliente: true,
        asiento_viaje: {
          include: {
            viaje: {
              include: {
                ruta: {
                  include: {
                    origen: true,
                    destino: true,
                  },
                },
                bus: true,
              },
            },
          },
        },
      },
    });

    return {
      pasajesHoy: pasajesHoyCount,
      encomiendasActivas: encomiendasActivasCount,
      busesCount: busesCount,
      nuevosClientes: nuevosClientesCount,
      actividadReciente: serializeBigInt(ultimaActividad),
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de admin:", error);
    return {
      pasajesHoy: 0,
      encomiendasActivas: 0,
      busesCount: 0,
      nuevosClientes: 0,
      actividadReciente: [],
    };
  }
}

// 9. getBuses
export async function getBuses() {
  try {
    const buses = await prisma.bus.findMany({
      orderBy: {
        created_at: "desc",
      },
    });
    return serializeBigInt(buses);
  } catch (error) {
    console.error("Error al obtener flota de buses:", error);
    return [];
  }
}

// 10. createBus
export async function createBus(data: { placa: string; marca: string; capacidad: number; pisos: number }) {
  try {
    const existe = await prisma.bus.findUnique({ where: { placa: data.placa } });
    if (existe) {
      return { success: false, error: "La placa de bus ingresada ya está registrada." };
    }

    const nuevoBus = await prisma.bus.create({
      data: {
        placa: data.placa.toUpperCase(),
        marca: data.marca,
        capacidad: data.capacidad,
        pisos: data.pisos,
      },
    });

    return { success: true, bus: serializeBigInt(nuevoBus) };
  } catch (error: any) {
    console.error("Error al registrar bus:", error);
    return { success: false, error: error.message || "Error inesperado al registrar el bus." };
  }
}

// 11. deleteBus
export async function deleteBus(id: string) {
  try {
    const tieneViajes = await prisma.viaje.findFirst({
      where: { bus_id: BigInt(id) },
    });

    if (tieneViajes) {
      return { success: false, error: "No se puede eliminar el bus porque está asociado a viajes programados." };
    }

    await prisma.bus.delete({
      where: { id: BigInt(id) },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar bus:", error);
    return { success: false, error: error.message || "Error al eliminar el bus." };
  }
}

// 12. getAdminEncomiendas
export async function getAdminEncomiendas(query?: string) {
  try {
    const whereClause: any = {};

    if (query && query.trim() !== "") {
      const q = query.trim();
      whereClause.OR = [
        { codigo_seguimiento: { contains: q } },
        { remitente_dni: { contains: q } },
        { destinatario_dni: { contains: q } },
        { remitente_nombre: { contains: q } },
        { destinatario_nombre: { contains: q } },
      ];
    }

    const encomiendas = await prisma.encomienda.findMany({
      where: whereClause,
      include: {
        origen: true,
        destino: true,
        viaje: {
          include: {
            ruta: {
              include: {
                origen: true,
                destino: true,
              },
            },
            bus: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return serializeBigInt(encomiendas);
  } catch (error) {
    console.error("Error al obtener encomiendas para admin:", error);
    return [];
  }
}

// 13. createEncomienda
export async function createEncomienda(data: {
  remitente_nombre: string;
  remitente_dni: string;
  destinatario_nombre: string;
  destinatario_dni: string;
  origen_id: string;
  destino_id: string;
  peso_kg: number;
  descripcion?: string;
  precio: number;
  viaje_id?: string;
}) {
  try {
    let codigo = "";
    let esUnico = false;

    while (!esUnico) {
      codigo = `ENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const existe = await prisma.encomienda.findUnique({ where: { codigo_seguimiento: codigo } });
      if (!existe) esUnico = true;
    }

    const nuevaEncomienda = await prisma.encomienda.create({
      data: {
        codigo_seguimiento: codigo,
        remitente_nombre: data.remitente_nombre,
        remitente_dni: data.remitente_dni,
        destinatario_nombre: data.destinatario_nombre,
        destinatario_dni: data.destinatario_dni,
        origen_id: BigInt(data.origen_id),
        destino_id: BigInt(data.destino_id),
        peso_kg: data.peso_kg,
        descripcion: data.descripcion || null,
        precio: data.precio,
        viaje_id: data.viaje_id ? BigInt(data.viaje_id) : null,
        estado: "recepcionado",
      },
    });

    return { success: true, encomienda: serializeBigInt(nuevaEncomienda) };
  } catch (error: any) {
    console.error("Error al registrar encomienda:", error);
    return { success: false, error: error.message || "Error al registrar la encomienda." };
  }
}

// 14. updateEncomiendaEstado
export async function updateEncomiendaEstado(id: string, nuevoEstado: string) {
  try {
    const actualizada = await prisma.encomienda.update({
      where: { id: BigInt(id) },
      data: { estado: nuevoEstado },
    });
    return { success: true, encomienda: serializeBigInt(actualizada) };
  } catch (error: any) {
    console.error("Error al actualizar estado de encomienda:", error);
    return { success: false, error: error.message || "Error al cambiar el estado." };
  }
}

// 15. getAdminPasajes
export async function getAdminPasajes() {
  try {
    const pasajes = await prisma.pasaje.findMany({
      include: {
        cliente: true,
        asiento_viaje: {
          include: {
            viaje: {
              include: {
                ruta: {
                  include: {
                    origen: true,
                    destino: true,
                  },
                },
                bus: true,
              },
            },
          },
        },
      },
      orderBy: {
        fecha_compra: "desc",
      },
    });
    return serializeBigInt(pasajes);
  } catch (error) {
    console.error("Error al obtener historial de pasajes:", error);
    return [];
  }
}

// 16. venderPasajePresencial
export async function venderPasajePresencial(
  asientoViajeId: string,
  clienteDni: string,
  clienteNombre: string,
  precio: number
) {
  try {
    let cliente = await prisma.cliente.findUnique({
      where: { dni: clienteDni },
    });

    if (!cliente) {
      const emailDummy = `dni_${clienteDni}_${Math.random().toString(36).substring(2, 6)}@cliente.elcumbe.com`;
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash("cumbe12345", salt);

      cliente = await prisma.cliente.create({
        data: {
          nombre: clienteNombre,
          correo: emailDummy,
          dni: clienteDni,
          contrasena: hashPassword,
          telefono: null,
          fecha_nacimiento: null,
        },
      });
    }

    const userId = cliente.id;

    const result = await prisma.$transaction(async (tx) => {
      const seat = await tx.asientoViaje.findUnique({
        where: { id: BigInt(asientoViajeId) },
      });

      if (!seat || seat.estado !== "disponible") {
        throw new Error("Asiento ya ocupado o no disponible.");
      }

      await tx.asientoViaje.update({
        where: { id: BigInt(asientoViajeId) },
        data: { estado: "vendido", bloqueado_por_usuario_id: userId },
      });

      const nameParts = clienteNombre.trim().split(/\s+/);
      const nombres = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(" ");
      const apellidos = nameParts.slice(Math.ceil(nameParts.length / 2)).join(" ") || "-";

      const pasaje = await tx.pasaje.create({
        data: {
          asiento_viaje_id: BigInt(asientoViajeId),
          usuario_id: userId as any,
          nombres: nombres,
          apellidos: apellidos,
          dni: clienteDni,
          precio: precio,
          codigo_qr: `QR-PRES-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`,
        },
      });

      return pasaje;
    });

    return { success: true, pasaje: serializeBigInt(result) };
  } catch (error: any) {
    console.error("Error en venta presencial de pasaje:", error);
    return { success: false, error: error.message || "Error al procesar la venta presencial." };
  }
}

// 17. getRutas
export async function getRutas() {
  try {
    const rutas = await prisma.ruta.findMany({
      include: {
        origen: true,
        destino: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
    return serializeBigInt(rutas);
  } catch (error) {
    console.error("Error al obtener rutas:", error);
    return [];
  }
}

// 18. createRuta
export async function createRuta(data: {
  origen_id: string;
  destino_id: string;
  duracion_estimada_minutos: number;
  precio_base: number;
}) {
  try {
    if (data.origen_id === data.destino_id) {
      return { success: false, error: "El origen y el destino de la ruta no pueden ser iguales." };
    }

    const existe = await prisma.ruta.findFirst({
      where: {
        origen_id: BigInt(data.origen_id),
        destino_id: BigInt(data.destino_id),
      },
    });

    if (existe) {
      return { success: false, error: "Ya existe una ruta configurada con este origen y destino." };
    }

    const nuevaRuta = await prisma.ruta.create({
      data: {
        origen_id: BigInt(data.origen_id),
        destino_id: BigInt(data.destino_id),
        duracion_estimada_minutos: data.duracion_estimada_minutos,
        precio_base: data.precio_base,
      },
    });

    return { success: true, ruta: serializeBigInt(nuevaRuta) };
  } catch (error: any) {
    console.error("Error al crear ruta:", error);
    return { success: false, error: error.message || "Error al registrar la ruta." };
  }
}

// 19. deleteRuta
export async function deleteRuta(id: string) {
  try {
    const tieneViajes = await prisma.viaje.findFirst({
      where: { ruta_id: BigInt(id) },
    });

    if (tieneViajes) {
      return { success: false, error: "No se puede eliminar la ruta porque posee viajes programados asociados." };
    }

    await prisma.ruta.delete({
      where: { id: BigInt(id) },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar ruta:", error);
    return { success: false, error: error.message || "Error al eliminar la ruta." };
  }
}

// 20. getViajesAdmin
export async function getViajesAdmin() {
  try {
    const viajes = await prisma.viaje.findMany({
      include: {
        ruta: {
          include: {
            origen: true,
            destino: true,
          },
        },
        bus: true,
        asientos_viaje: true,
      },
      orderBy: {
        fecha_salida: "desc",
      },
    });

    const serialized = serializeBigInt(viajes);
    return serialized.map((trip: any) => {
      let timeStr = "";
      if (trip.fecha_salida) {
        const d = new Date(trip.fecha_salida);
        timeStr = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      }

      let sold = 0;
      if (trip.asientos_viaje) {
        sold = trip.asientos_viaje.filter((s: any) => s.estado === "vendido").length;
      }

      return {
        ...trip,
        departure_time_formatted: timeStr,
        sold_seats: sold,
      };
    });
  } catch (error) {
    console.error("Error al obtener viajes de administración:", error);
    return [];
  }
}

// 21. createViaje
export async function createViaje(data: { ruta_id: string; bus_id: string; fecha_salida: string }) {
  try {
    const ruta = await prisma.ruta.findUnique({
      where: { id: BigInt(data.ruta_id) },
    });

    if (!ruta) {
      return { success: false, error: "Ruta no encontrada." };
    }

    const bus = await prisma.bus.findUnique({
      where: { id: BigInt(data.bus_id) },
    });

    if (!bus) {
      return { success: false, error: "Bus no encontrado." };
    }

    const fechaSalida = new Date(data.fecha_salida);
    const fechaLlegada = new Date(fechaSalida.getTime() + ruta.duracion_estimada_minutos * 60 * 1000);

    const nuevoViaje = await prisma.viaje.create({
      data: {
        ruta_id: BigInt(data.ruta_id),
        bus_id: BigInt(data.bus_id),
        fecha_salida: fechaSalida,
        fecha_llegada: fechaLlegada,
        estado: "programado",
      },
    });

    const capacity = bus.capacidad;
    const pisos = bus.pisos;
    const asientosData = Array.from({ length: capacity }).map((_, i) => ({
      viaje_id: nuevoViaje.id,
      numero_asiento: i + 1,
      piso: pisos === 2 && i >= capacity / 2 ? 2 : 1,
      estado: "disponible" as const,
    }));

    await prisma.asientoViaje.createMany({
      data: asientosData,
    });

    return { success: true, viaje: serializeBigInt(nuevoViaje) };
  } catch (error: any) {
    console.error("Error al crear viaje:", error);
    return { success: false, error: error.message || "Error al crear el viaje." };
  }
}

// 22. updateViajeEstado
export async function updateViajeEstado(id: string, nuevoEstado: string) {
  try {
    const actualizado = await prisma.viaje.update({
      where: { id: BigInt(id) },
      data: { estado: nuevoEstado },
    });
    return { success: true, viaje: serializeBigInt(actualizado) };
  } catch (error: any) {
    console.error("Error al actualizar estado de viaje:", error);
    return { success: false, error: error.message || "Error al cambiar el estado del viaje." };
  }
}

// 23. deleteViaje
export async function deleteViaje(id: string) {
  try {
    const tieneVentas = await prisma.asientoViaje.findFirst({
      where: {
        viaje_id: BigInt(id),
        estado: "vendido",
      },
    });

    if (tieneVentas) {
      return { success: false, error: "No se puede eliminar el viaje porque posee asientos ya vendidos." };
    }

    await prisma.viaje.delete({
      where: { id: BigInt(id) },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar viaje:", error);
    return { success: false, error: error.message || "Error al eliminar el viaje." };
  }
}

// 24. updateBus
export async function updateBus(id: string, data: { placa: string; marca: string; capacidad: number; pisos: number }) {
  try {
    const existePlaca = await prisma.bus.findFirst({
      where: {
        placa: data.placa.toUpperCase(),
        NOT: { id: BigInt(id) },
      },
    });

    if (existePlaca) {
      return { success: false, error: "La placa ingresada ya está registrada en otro bus." };
    }

    const actualizado = await prisma.bus.update({
      where: { id: BigInt(id) },
      data: {
        placa: data.placa.toUpperCase(),
        marca: data.marca,
        capacidad: data.capacidad,
        pisos: data.pisos,
      },
    });

    return { success: true, bus: serializeBigInt(actualizado) };
  } catch (error: any) {
    console.error("Error al editar bus:", error);
    return { success: false, error: error.message || "Error al actualizar el bus." };
  }
}

// 25. updateRuta
export async function updateRuta(
  id: string,
  data: { origen_id: string; destino_id: string; duracion_estimada_minutos: number; precio_base: number }
) {
  try {
    if (data.origen_id === data.destino_id) {
      return { success: false, error: "El origen y el destino de la ruta no pueden ser iguales." };
    }

    const existeDuplicada = await prisma.ruta.findFirst({
      where: {
        origen_id: BigInt(data.origen_id),
        destino_id: BigInt(data.destino_id),
        NOT: { id: BigInt(id) },
      },
    });

    if (existeDuplicada) {
      return { success: false, error: "Ya existe otra ruta configurada con ese origen y destino." };
    }

    const actualizada = await prisma.ruta.update({
      where: { id: BigInt(id) },
      data: {
        origen_id: BigInt(data.origen_id),
        destino_id: BigInt(data.destino_id),
        duracion_estimada_minutos: data.duracion_estimada_minutos,
        precio_base: data.precio_base,
      },
    });

    return { success: true, ruta: serializeBigInt(actualizada) };
  } catch (error: any) {
    console.error("Error al editar ruta:", error);
    return { success: false, error: error.message || "Error al actualizar la ruta." };
  }
}

// 26. updateViaje
export async function updateViaje(id: string, data: { ruta_id: string; bus_id: string; fecha_salida: string }) {
  try {
    const viajeActual = await prisma.viaje.findUnique({
      where: { id: BigInt(id) },
      include: { asientos_viaje: true, bus: true },
    });

    if (!viajeActual) {
      return { success: false, error: "Viaje no encontrado." };
    }

    const ruta = await prisma.ruta.findUnique({
      where: { id: BigInt(data.ruta_id) },
    });

    if (!ruta) {
      return { success: false, error: "Ruta no encontrada." };
    }

    const bus = await prisma.bus.findUnique({
      where: { id: BigInt(data.bus_id) },
    });

    if (!bus) {
      return { success: false, error: "Bus no encontrado." };
    }

    if (viajeActual.bus_id !== BigInt(data.bus_id)) {
      const vendidosCount = viajeActual.asientos_viaje.filter((s: any) => s.estado === "vendido").length;
      if (bus.capacidad < vendidosCount) {
        return {
          success: false,
          error: `No se puede asignar este bus. El viaje posee ${vendidosCount} asientos ya vendidos, pero la capacidad del nuevo bus es de solo ${bus.capacidad} asientos.`,
        };
      }

      await prisma.$transaction(async (tx) => {
        await tx.asientoViaje.deleteMany({
          where: {
            viaje_id: BigInt(id),
            estado: { not: "vendido" },
          },
        });

        const vendidos = await tx.asientoViaje.findMany({
          where: { viaje_id: BigInt(id), estado: "vendido" },
        });
        const numerosVendidos = vendidos.map((s: any) => s.numero_asiento);

        const capacity = bus.capacidad;
        const pisos = bus.pisos;
        
        const nuevosAsientosData: any[] = [];
        for (let i = 1; i <= capacity; i++) {
          if (!numerosVendidos.includes(i)) {
            nuevosAsientosData.push({
              viaje_id: BigInt(id),
              numero_asiento: i,
              piso: pisos === 2 && i > capacity / 2 ? 2 : 1,
              estado: "disponible",
            });
          }
        }

        if (nuevosAsientosData.length > 0) {
          await tx.asientoViaje.createMany({
            data: nuevosAsientosData,
          });
        }
      });
    }

    const fechaSalida = new Date(data.fecha_salida);
    const fechaLlegada = new Date(fechaSalida.getTime() + ruta.duracion_estimada_minutos * 60 * 1000);

    const actualizado = await prisma.viaje.update({
      where: { id: BigInt(id) },
      data: {
        ruta_id: BigInt(data.ruta_id),
        bus_id: BigInt(data.bus_id),
        fecha_salida: fechaSalida,
        fecha_llegada: fechaLlegada,
      },
    });

    return { success: true, viaje: serializeBigInt(actualizado) };
  } catch (error: any) {
    console.error("Error al actualizar viaje:", error);
    return { success: false, error: error.message || "Error al actualizar el viaje." };
  }
}

export async function crearCargoCulqi(tokenId: string, email: string, amount: number) {
  try {
    const SECRET_KEY = process.env.CULQI_SECRET_KEY || "sk_test_1f3b83984d5df687";

    const response = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Centavos
        currency_code: "PEN",
        email: email,
        source_id: tokenId,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.user_message || "Error al procesar el pago con Culqi" };
    }

    return { success: true, chargeId: data.id };
  } catch (error: any) {
    console.error("Error al crear cargo en Culqi:", error);
    return { success: false, error: error.message || "Error en el servidor de pagos" };
  }
}

export async function procesarPagoExitosoCulqi(
  viajeId: string,
  seatId: string,
  pasajeroData: { nombres: string; apellidos: string; dni: string; telefono?: string },
  amount: number,
  chargeId: string,
  email?: string
) {
  try {
    let userId: bigint | null = null;
    if (email) {
      const user = await prisma.cliente.findUnique({ where: { correo: email } });
      if (user) {
        userId = user.id;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Registrar el pago
      await tx.pago.create({
        data: {
          viaje_id: BigInt(viajeId),
          asiento_id: BigInt(seatId),
          preference_id: chargeId,
          status: "approved",
          amount: amount,
        },
      });

      // 2. Actualizar el asiento a vendido
      await tx.asientoViaje.update({
        where: { id: BigInt(seatId) },
        data: {
          estado: "vendido",
          bloqueado_por_usuario_id: userId,
        },
      });

      // 3. Crear el ticket/pasaje
      const ticket = await tx.pasaje.create({
        data: {
          asiento_viaje_id: BigInt(seatId),
          nombres: pasajeroData.nombres,
          apellidos: pasajeroData.apellidos,
          dni: pasajeroData.dni,
          telefono: pasajeroData.telefono || null,
          usuario_id: userId,
          precio: amount,
          codigo_qr: `QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`,
        },
      });

      return ticket;
    });

    return { success: true, ticket: serializeBigInt(result) };
  } catch (error: any) {
    console.error("Error al registrar pasaje con Culqi:", error);
    return { success: false, error: error.message || "Error al emitir el pasaje en la base de datos." };
  }
}

// 27. marcarAsientoPendiente
export async function marcarAsientoPendiente(seatId: string, email?: string) {
  try {
    await limpiarBloqueosExpirados();
    
    let userId: bigint | null = null;
    if (email) {
      const user = await prisma.cliente.findUnique({ where: { correo: email } });
      if (user) {
        userId = user.id;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const seat = await tx.asientoViaje.findUnique({
        where: { id: BigInt(seatId) },
      });

      if (!seat || (seat.estado !== "disponible" && seat.bloqueado_por_usuario_id !== userId)) {
        throw new Error("El asiento seleccionado ya no se encuentra disponible.");
      }

      const updatedSeat = await tx.asientoViaje.update({
        where: { id: BigInt(seatId) },
        data: {
          estado: "pendiente",
          bloqueado_por_usuario_id: userId,
          bloqueado_en: new Date(),
        },
      });

      return updatedSeat;
    });

    return { success: true, seat: serializeBigInt(result) };
  } catch (error: any) {
    console.error("Error al marcar asiento pendiente:", error);
    return { success: false, error: error.message || "El asiento ya ha sido seleccionado por otro pasajero." };
  }
}

// 28. liberarAsiento
export async function liberarAsiento(seatId: string) {
  try {
    const result = await prisma.asientoViaje.updateMany({
      where: {
        id: BigInt(seatId),
        estado: "pendiente",
      },
      data: {
        estado: "disponible",
        bloqueado_por_usuario_id: null,
        bloqueado_en: null,
      },
    });

    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("Error al liberar asiento:", error);
    return { success: false, error: error.message || "Error al liberar asiento." };
  }
}

