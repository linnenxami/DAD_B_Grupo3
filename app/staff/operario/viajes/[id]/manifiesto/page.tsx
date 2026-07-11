import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerPasajerosViaje } from "@/app/(admin)/actions/operario";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BotonImprimir from "./BotonImprimir";

export const dynamic = "force-dynamic";

export default async function ManifiestoImpresionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "operario") {
    redirect("/login");
  }

  const viaje = await prisma.viaje.findUnique({
    where: { id: BigInt(resolvedParams.id) },
    include: {
      ruta: { include: { origen: true, destino: true } },
      bus: true,
      conductor: true
    }
  });

  if (!viaje) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h1 className="text-xl font-bold">Viaje no encontrado.</h1>
      </div>
    );
  }

  const pasajesRes = await obtenerPasajerosViaje(resolvedParams.id);
  const pasajeros = pasajesRes.success ? pasajesRes.data : [];

  const fechaSalidaFormateada = new Date(viaje.fecha_salida).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
      {/* Botones de Navegación y Control (Ocultos en impresión) */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href={`/staff/operario/viajes/${viaje.id}`}
            className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors border border-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-sm font-bold text-slate-700">Regresar al Control de Embarque</span>
        </div>

        <BotonImprimir />
      </div>

      {/* DOCUMENTO OFICIAL IMPRIMIBLE */}
      <div className="bg-white border border-slate-300 p-8 shadow-sm rounded-3xl print:border-none print:shadow-none print:p-0 print:m-0 space-y-8 text-black">
        {/* Encabezado Oficial */}
        <div className="flex justify-between items-start border-b-2 border-slate-850 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Transportes El Cumbe S.A.</h1>
            <p className="text-xs font-bold text-slate-500 uppercase">R.U.C. N° 20456789123 | Empresa Autorizada por el MTC</p>
            <p className="text-[10px] text-slate-400 font-bold">Oficina Central: Av. Atahualpa 345, Cajamarca</p>
          </div>
          <div className="text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-800 rounded-lg print:border-slate-800">
              MANIFIESTO DE PASAJEROS
            </span>
            <p className="text-xs font-bold text-slate-600 mt-1">ID Viaje: #{viaje.id.toString()}</p>
          </div>
        </div>

        {/* Detalles del Servicio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-100 print:bg-transparent print:border-slate-800 print:rounded-none">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Vehículo (Placa)</span>
            <span className="font-extrabold text-slate-800 uppercase text-sm">{viaje.bus.placa}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Fecha y Hora Salida</span>
            <span className="font-extrabold text-slate-800 text-sm">{fechaSalidaFormateada}</span>
          </div>

          <div className="space-y-0.5 col-span-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Ruta del Servicio</span>
            <span className="font-extrabold text-slate-800 uppercase text-sm">
              {viaje.ruta.origen.nombre} <span className="text-slate-400 mx-1">→</span> {viaje.ruta.destino.nombre}
            </span>
          </div>

          <div className="space-y-0.5 col-span-2 border-t border-slate-200/80 pt-2 print:border-slate-800">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Conductor del Servicio</span>
            <span className="font-extrabold text-slate-800 uppercase text-sm">
              {viaje.conductor 
                ? `${viaje.conductor.apellidos}, ${viaje.conductor.nombres}`
                : "CONDUCTOR NO ASIGNADO"
              }
            </span>
          </div>

          <div className="space-y-0.5 border-t border-slate-200/80 pt-2 print:border-slate-800">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">D.N.I. Conductor</span>
            <span className="font-extrabold text-slate-800 uppercase text-sm">
              {viaje.conductor?.dni || "-"}
            </span>
          </div>

          <div className="space-y-0.5 border-t border-slate-200/80 pt-2 print:border-slate-800">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Capacidad del Bus</span>
            <span className="font-extrabold text-slate-800 text-sm">{viaje.bus.capacidad} Asientos</span>
          </div>
        </div>

        {/* Tabla Oficial de Pasajeros */}
        <div className="space-y-2">
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-black uppercase text-slate-600 print:bg-transparent print:border-slate-800">
                <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center print:border-slate-850">N°</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-16 text-center print:border-slate-850">Asiento</th>
                <th className="py-2.5 px-3 border-r border-slate-300 print:border-slate-850">Apellidos y Nombres</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-center print:border-slate-850">Documento (DNI)</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-center print:border-slate-850">Teléfono</th>
                <th className="py-2.5 px-3 w-28 text-center">Firma / Huella</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 print:divide-slate-800 print:border-b print:border-slate-800">
              {pasajeros.map((p: any, idx: number) => (
                <tr key={p.id} className="hover:bg-slate-50/20 print:hover:bg-transparent">
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center font-bold text-slate-500 print:border-slate-800">{idx + 1}</td>
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center font-black text-slate-900 print:border-slate-800">{p.asiento_viaje.numero_asiento}</td>
                  <td className="py-2.5 px-3 border-r border-slate-300 font-extrabold text-slate-800 uppercase print:border-slate-800">
                    {p.pasajero.apellidos}, {p.pasajero.nombres}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center font-bold text-slate-700 print:border-slate-800">{p.pasajero.dni}</td>
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center text-slate-500 print:border-slate-800">{p.pasajero.telefono || "-"}</td>
                  <td className="py-2.5 px-3 text-center text-[10px] font-bold uppercase">
                    {p.abordado ? (
                      <span className="text-green-700 print:text-black font-extrabold bg-green-50 print:bg-transparent px-1.5 py-0.5 rounded border border-green-250 print:border-none uppercase tracking-wide">
                        A bordo
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold print:text-slate-300">No abordó</span>
                    )}
                  </td>
                </tr>
              ))}

              {/* Rellenar filas vacías para completar 10 filas de presentación estética si hay pocos pasajeros */}
              {pasajeros.length < 8 && Array.from({ length: 8 - pasajeros.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-9">
                  <td className="border-r border-slate-300 print:border-slate-800"></td>
                  <td className="border-r border-slate-300 print:border-slate-800"></td>
                  <td className="border-r border-slate-300 print:border-slate-800"></td>
                  <td className="border-r border-slate-300 print:border-slate-800"></td>
                  <td className="border-r border-slate-300 print:border-slate-800"></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen e Indicaciones SUTRAN */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 text-[10px] font-semibold text-slate-500 border-t border-slate-200 pt-4 print:border-slate-800">
          <div>
            <p>Total Pasajeros Registrados en Venta: <span className="font-extrabold text-slate-850">{pasajeros.length}</span></p>
            <p>Total Pasajeros a Bordo (Abordados): <span className="font-extrabold text-slate-850">{pasajeros.filter((p: any) => p.abordado).length}</span></p>
          </div>
          <div className="text-right">
            <p>Operario Responsable de Salida: <span className="font-extrabold text-slate-850 uppercase">{session.user.name}</span></p>
            <p>Este manifiesto debe ser portado en el vehículo durante todo el viaje.</p>
          </div>
        </div>

        {/* Bloque de Firmas para Conformidad SUTRAN */}
        <div className="grid grid-cols-2 gap-12 pt-16">
          <div className="text-center space-y-1">
            <div className="border-t border-slate-400 w-48 mx-auto print:border-slate-800" />
            <p className="text-[10px] font-black uppercase text-slate-700">Firma del Conductor</p>
            <p className="text-[9px] text-slate-400 font-bold">D.N.I. {viaje.conductor?.dni || "__________________"}</p>
          </div>

          <div className="text-center space-y-1">
            <div className="border-t border-slate-400 w-48 mx-auto print:border-slate-800" />
            <p className="text-[10px] font-black uppercase text-slate-700">Firma del Operario</p>
            <p className="text-[9px] text-slate-400 font-bold">{session.user.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
