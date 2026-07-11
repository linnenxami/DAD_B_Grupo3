import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bus, MapPin, Wrench, AlertTriangle, ChevronRight, Calendar, Clock, Route, Shield } from "lucide-react";
import Link from "next/link";
import { getViajesConductor } from "@/app/(admin)/actions/conductor";

export const dynamic = "force-dynamic";

export default async function ConductorDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "conductor") {
    redirect("/login");
  }

  const viajes = await getViajesConductor(Number((session.user as any).persona_id));
  const viajesHoy = viajes.filter((v: any) => new Date(v.fecha_salida).toDateString() === new Date().toDateString());
  const viajesCompletados = viajes.filter((v: any) => v.estado === "completado" || v.estado === "finalizado");
  const viajesEnCurso = viajes.filter((v: any) => v.estado === "en_ruta" || v.estado === "en curso");

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Banner Premium */}
      <div className="relative rounded-[28px] overflow-hidden shadow-2xl">
        {/* Fondo con gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
        {/* Patrón geométrico */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {/* Orbs de color */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#f07639]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <span className="text-2xl">🚛</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/20">
                  <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">En servicio</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                {saludo}, <span className="bg-gradient-to-r from-[#f07639] to-[#ff9a5c] bg-clip-text text-transparent">{session.user.name}</span>
              </h1>
              <p className="text-slate-400 font-medium text-base md:text-lg">
                Panel de control de tu jornada laboral
              </p>
            </div>

            {/* Fecha actual con estilo */}
            <div className="flex items-center gap-3 bg-white/[0.06] backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/[0.08] self-start">
              <div className="w-10 h-10 rounded-xl bg-[#f07639]/15 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#f07639]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{new Date().toLocaleDateString("es-PE", { weekday: "long" })}</p>
                <p className="text-slate-400 text-xs font-medium capitalize">{new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </div>
          </div>

          {/* Stats en línea */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.08] text-center">
              <p className="text-3xl font-black text-white">{viajesHoy.length}</p>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1">Hoy</p>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.08] text-center">
              <p className="text-3xl font-black text-emerald-400">{viajesEnCurso.length}</p>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1">En ruta</p>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.08] text-center">
              <p className="text-3xl font-black text-blue-400">{viajesCompletados.length}</p>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1">Completados</p>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.08] text-center">
              <p className="text-3xl font-black text-[#f07639]">{viajes.length}</p>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de navegación premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Mis Viajes */}
        <Link href="/staff/conductor/viajes" className="group block">
          <div className="relative rounded-[22px] overflow-hidden bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1.5">
            {/* Barra superior de color */}
            <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <MapPin className="w-7 h-7" />
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-1.5">Mis Viajes</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">Gestiona tus rutas, estado de viaje y pasajeros asignados.</p>
              {viajesHoy.length > 0 && (
                <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg w-fit">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-blue-600 text-xs font-bold">{viajesHoy.length} programado(s) hoy</span>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Novedades */}
        <Link href="/staff/conductor/novedades" className="group block">
          <div className="relative rounded-[22px] overflow-hidden bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1.5">
            <div className="h-1.5 bg-gradient-to-r from-[#f07639] to-[#ff9a5c]" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 text-[#f07639] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Wrench className="w-7 h-7" />
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#f07639] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-1.5">Novedades</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">Estado del bus asignado e historial de fallas mecánicas.</p>
            </div>
          </div>
        </Link>

        {/* Alertas */}
        <Link href="/staff/conductor/alertas" className="group block">
          <div className="relative rounded-[22px] overflow-hidden bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1.5">
            <div className="h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-1.5">Alertas</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">Bandeja de mensajes urgentes de la central.</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Sección de accesos rápidos */}
      <div className="bg-white rounded-[22px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">Información de Servicio</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Route className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rol</p>
              <p className="text-sm font-extrabold text-slate-700">Conductor</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sesión</p>
              <p className="text-sm font-extrabold text-slate-700">{session.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Bus className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empresa</p>
              <p className="text-sm font-extrabold text-slate-700">Transportes El Cumbe S.A.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
