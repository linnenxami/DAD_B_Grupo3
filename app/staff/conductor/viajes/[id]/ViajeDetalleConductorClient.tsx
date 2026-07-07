"use client";

import { useState, useEffect } from "react";
import { updateEstadoViaje, registrarGasto, reportarNovedad } from "@/app/(admin)/actions/conductor";
import { ArrowLeft, MapPin, Bus, Clock, Box, Play, CheckCircle, Receipt, Wrench, AlertCircle, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ViajeDetalleConductorClient({ viaje, conductorId }: { viaje: any, conductorId: number }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("ruta");
  const [isUpdating, setIsUpdating] = useState(false);
  const [gastoForm, setGastoForm] = useState({ concepto: "", monto: "" });
  const [novedadForm, setNovedadForm] = useState({ categoria: "Motor", descripcion: "" });

  // Estados de conexión offline y sincronización
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // Listas locales temporales (para modo offline)
  const [localGastos, setLocalGastos] = useState<any[]>([]);
  const [localNovedades, setLocalNovedades] = useState<any[]>([]);
  
  // Paradas completadas en la hoja de ruta
  const [completedStops, setCompletedStops] = useState<string[]>([]);

  const formatDuracion = (minutos: number) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h}h ${m}m`;
  };

  // Obtener paradas en base a la ruta
  const getParadas = (origen: string, destino: string) => {
    const o = origen.toLowerCase();
    const d = destino.toLowerCase();
    if ((o.includes("jaén") && d.includes("chiclayo")) || (o.includes("chiclayo") && d.includes("jaén"))) {
      return ["Jaén", "Chamaya", "Bagua Grande", "Olmos", "Chiclayo"];
    }
    if ((o.includes("trujillo") && d.includes("chiclayo")) || (o.includes("chiclayo") && d.includes("trujillo"))) {
      return ["Trujillo", "Mocupe", "Guadalupe", "Pacasmayo", "Chiclayo"];
    }
    if ((o.includes("cajamarca") && d.includes("trujillo")) || (o.includes("trujillo") && d.includes("cajamarca"))) {
      return ["Cajamarca", "Chilete", "Tembladera", "Ciudad de Dios", "Trujillo"];
    }
    return [origen, "Control A", "Control B", destino];
  };

  const paradas = getParadas(viaje.ruta.origen.nombre, viaje.ruta.destino.nombre);

  // Inicializar estados desde localStorage en el cliente
  useEffect(() => {
    setMounted(true);
    
    // Cargar estado de simulación offline
    const offlineSaved = localStorage.getItem(`offline_mode_${viaje.id}`);
    if (offlineSaved === "true") {
      setIsOffline(true);
    }

    // Cargar gastos locales en cola
    const gastosSaved = localStorage.getItem(`queued_gastos_${viaje.id}`);
    if (gastosSaved) {
      setLocalGastos(JSON.parse(gastosSaved));
    }

    // Cargar novedades locales en cola
    const novedadesSaved = localStorage.getItem(`queued_novedades_${viaje.id}`);
    if (novedadesSaved) {
      setLocalNovedades(JSON.parse(novedadesSaved));
    }

    // Cargar progreso de paradas
    const paradasSaved = localStorage.getItem(`completed_stops_${viaje.id}`);
    if (paradasSaved) {
      setCompletedStops(JSON.parse(paradasSaved));
    }
  }, [viaje.id]);

  // Sincronizar cola local con el servidor al volver a estar "En Línea"
  const handleSyncData = async (gastosToSync: any[], novedadesToSync: any[]) => {
    setIsUpdating(true);
    let successCount = 0;

    try {
      // 1. Sincronizar Gastos
      for (const gasto of gastosToSync) {
        const res = await registrarGasto({
          viaje_id: viaje.id,
          conductor_id: conductorId,
          concepto: gasto.concepto,
          monto: Number(gasto.monto)
        });
        if (res.success) successCount++;
      }

      // 2. Sincronizar Novedades Mecánicas
      for (const nov of novedadesToSync) {
        const res = await reportarNovedad({
          viaje_id: viaje.id,
          bus_id: viaje.bus.id,
          conductor_id: conductorId,
          categoria: nov.categoria,
          descripcion: nov.descripcion
        });
        if (res.success) successCount++;
      }

      // Limpiar colas locales si todo se sincronizó
      localStorage.removeItem(`queued_gastos_${viaje.id}`);
      localStorage.removeItem(`queued_novedades_${viaje.id}`);
      setLocalGastos([]);
      setLocalNovedades([]);

      if (successCount > 0) {
        alert(`✅ ¡Sincronización exitosa! Se subieron ${successCount} registros pendientes al servidor.`);
        router.refresh();
      }
    } catch (err) {
      alert("⚠️ Error de conexión durante la sincronización. Se reintentará al recuperar señal.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Alternar modo de simulación offline
  const toggleOfflineMode = async () => {
    const newOfflineState = !isOffline;
    setIsOffline(newOfflineState);
    localStorage.setItem(`offline_mode_${viaje.id}`, String(newOfflineState));

    if (!newOfflineState) {
      // Si pasa a estar "En Línea", intentar sincronizar colas
      const gQueue = JSON.parse(localStorage.getItem(`queued_gastos_${viaje.id}`) || "[]");
      const nQueue = JSON.parse(localStorage.getItem(`queued_novedades_${viaje.id}`) || "[]");
      if (gQueue.length > 0 || nQueue.length > 0) {
        await handleSyncData(gQueue, nQueue);
      }
    }
  };

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (isOffline) {
      alert("⚠️ No puedes cambiar el estado del viaje mientras estás Sin Señal.");
      return;
    }
    if (!confirm(`¿Estás seguro de marcar el viaje como ${nuevoEstado.replace('_', ' ')}?`)) return;
    setIsUpdating(true);
    const res = await updateEstadoViaje(viaje.id, nuevoEstado);
    if (res.success) {
      router.refresh();
    } else {
      alert("Error al actualizar estado");
    }
    setIsUpdating(false);
  };

  const handleGuardarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gastoForm.concepto || !gastoForm.monto) return;
    setIsUpdating(true);

    if (isOffline) {
      // Guardar localmente
      const nuevoGastoLocal = {
        id: `local-g_${Date.now()}`,
        concepto: `${gastoForm.concepto} (Local/Pendiente)`,
        monto: Number(gastoForm.monto),
        fecha: new Date().toISOString()
      };
      const updatedLocalGastos = [...localGastos, nuevoGastoLocal];
      setLocalGastos(updatedLocalGastos);
      localStorage.setItem(`queued_gastos_${viaje.id}`, JSON.stringify(updatedLocalGastos));
      setGastoForm({ concepto: "", monto: "" });
      alert("💾 Gasto guardado localmente. Se sincronizará cuando recuperes señal.");
      setIsUpdating(false);
    } else {
      // Enviar al servidor
      const res = await registrarGasto({
        viaje_id: viaje.id,
        conductor_id: conductorId,
        concepto: gastoForm.concepto,
        monto: Number(gastoForm.monto)
      });
      if (res.success) {
        setGastoForm({ concepto: "", monto: "" });
        router.refresh();
        alert("Gasto registrado con éxito.");
      } else {
        alert("Error al registrar gasto.");
      }
      setIsUpdating(false);
    }
  };

  const handleGuardarNovedad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novedadForm.descripcion) return;
    setIsUpdating(true);

    if (isOffline) {
      // Guardar localmente
      const nuevaNovedadLocal = {
        id: `local-n_${Date.now()}`,
        categoria: novedadForm.categoria,
        descripcion: `${novedadForm.descripcion} (Local/Pendiente)`,
        estado: "pendiente"
      };
      const updatedLocalNovedades = [...localNovedades, nuevaNovedadLocal];
      setLocalNovedades(updatedLocalNovedades);
      localStorage.setItem(`queued_novedades_${viaje.id}`, JSON.stringify(updatedLocalNovedades));
      setNovedadForm({ categoria: "Motor", descripcion: "" });
      alert("💾 Novedad guardada localmente. Se sincronizará cuando recuperes señal.");
      setIsUpdating(false);
    } else {
      // Enviar al servidor
      const res = await reportarNovedad({
        viaje_id: viaje.id,
        bus_id: viaje.bus.id,
        conductor_id: conductorId,
        categoria: novedadForm.categoria,
        descripcion: novedadForm.descripcion
      });
      if (res.success) {
        setNovedadForm({ categoria: "Motor", descripcion: "" });
        router.refresh();
        alert("Novedad reportada. Mantenimiento ha sido notificado.");
      } else {
        alert("Error al registrar novedad.");
      }
      setIsUpdating(false);
    }
  };

  // Toggle de parada completada
  const handleToggleParada = (stopName: string) => {
    let updated: string[];
    if (completedStops.includes(stopName)) {
      updated = completedStops.filter(s => s !== stopName);
    } else {
      updated = [...completedStops, stopName];
    }
    setCompletedStops(updated);
    localStorage.setItem(`completed_stops_${viaje.id}`, JSON.stringify(updated));
  };

  const progressPct = paradas.length > 0 
    ? Math.round((completedStops.length / paradas.length) * 100) 
    : 0;

  // Combinación de datos en servidor + datos locales en cola offline
  const allGastos = [...viaje.gastos, ...localGastos];
  const allNovedades = [...viaje.novedades, ...localNovedades];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Cabecera con Botón de Señal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Link href="/staff/conductor/viajes" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-[#f07639] mr-4 transition-colors border border-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Detalle del Viaje</h1>
            <p className="text-slate-500 text-sm" suppressHydrationWarning>
              {new Date(viaje.fecha_salida).toLocaleString('es-PE')}
            </p>
          </div>
        </div>

        {/* Simulador Offline */}
        {mounted && (
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              isOffline 
                ? "bg-red-50 text-red-700 border-red-200" 
                : "bg-green-50 text-green-700 border-green-200"
            }`}>
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  Sin Señal
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  En Línea
                </>
              )}
            </div>
            <button
              onClick={toggleOfflineMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-sm ${
                isOffline
                  ? "bg-slate-800 text-white hover:bg-slate-700 border-slate-800"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
              }`}
            >
              {isOffline ? "Conectar Señal" : "Perder Señal"}
            </button>
          </div>
        )}
      </div>

      {/* Alerta de Modo Sin Señal */}
      {mounted && isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 mb-6 flex items-start gap-3 animate-fadeIn text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold">⚠️ Modo Sin Cobertura de Red Activo</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed font-medium">
              No tienes señal de internet en esta zona de la carretera. Los reportes de gastos e incidencias mecánicas se guardarán localmente en la memoria del navegador y se subirán de forma automática cuando presiones <strong>"Conectar Señal"</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Tarjeta de Resumen */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
        {viaje.estado === "en_ruta" && (
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse" />
        )}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#f07639]/10 text-[#f07639] flex items-center justify-center">
              <Bus className="w-7 h-7" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800">
                {viaje.ruta.origen.nombre} <span className="text-slate-300 mx-2">→</span> {viaje.ruta.destino.nombre}
              </p>
              <p className="text-slate-500 font-medium">Bus Placa: <span className="text-slate-700 font-bold">{viaje.bus.placa}</span></p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {viaje.estado === "programado" && (
              <button 
                disabled={isUpdating}
                onClick={() => handleEstadoChange("en_ruta")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center disabled:opacity-50 transition-all hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 mr-2" />
                INICIAR VIAJE
              </button>
            )}
            {viaje.estado === "en_ruta" && (
              <button 
                disabled={isUpdating}
                onClick={() => handleEstadoChange("completado")}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-500/30 flex items-center justify-center disabled:opacity-50 animate-pulse transition-all hover:scale-[1.02]"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                FINALIZAR VIAJE
              </button>
            )}
            {viaje.estado === "completado" && (
              <div className="bg-green-100 text-green-700 px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center border border-green-200">
                <CheckCircle className="w-4 h-4 mr-2" />
                VIAJE COMPLETADO
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        {[
          { id: "ruta", label: "Hoja de Ruta", icon: MapPin },
          { id: "encomiendas", label: "Encomiendas", icon: Box },
          { id: "gastos", label: "Gastos (Peajes)", icon: Receipt },
          { id: "novedades", label: "Fallas Mecánicas", icon: Wrench },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`whitespace-nowrap flex items-center px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === t.id 
                ? "bg-slate-800 text-white shadow-md" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <t.icon className="w-4 h-4 mr-2" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido Tabs */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        
        {activeTab === "ruta" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Hoja de Ruta Interactiva</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <p className="text-[11px] text-slate-400 font-bold uppercase mb-1">Distancia</p>
                  <p className="text-xl font-extrabold text-slate-700">~250 km</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <p className="text-[11px] text-slate-400 font-bold uppercase mb-1">Tiempo Estimado</p>
                  <p className="text-xl font-extrabold text-slate-700">{formatDuracion(viaje.ruta.duracion_estimada_minutos)}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <p className="text-[11px] text-slate-400 font-bold uppercase mb-1">Pasajeros</p>
                  <p className="text-xl font-extrabold text-slate-700">{viaje.bus.capacidad}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <p className="text-[11px] text-slate-400 font-bold uppercase mb-1">Bultos Bodega</p>
                  <p className="text-xl font-extrabold text-slate-700">{viaje.encomiendas.length}</p>
                </div>
              </div>
            </div>

            {/* Croquis de Ruta SVG Interactivo */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-600 uppercase tracking-wider">Mapa de Progreso Offline</h3>
              
              <div className="w-full overflow-hidden bg-slate-50 border border-slate-100 rounded-3xl p-6 relative">
                {/* SVG del trayecto */}
                <svg viewBox="0 0 500 80" className="w-full h-20">
                  {/* Línea base */}
                  <line x1="40" y1="40" x2="460" y2="40" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
                  {/* Línea de progreso */}
                  <line 
                    x1="40" 
                    y1="40" 
                    x2={40 + (420 * progressPct) / 100} 
                    y2="40" 
                    stroke="#f07639" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    className="transition-all duration-500" 
                  />
                  {/* Círculos de paradas */}
                  {paradas.map((p, idx) => {
                    const x = 40 + (420 * idx) / (paradas.length - 1);
                    const isPassed = completedStops.includes(p);
                    return (
                      <g key={p}>
                        <circle 
                          cx={x} 
                          cy="40" 
                          r="10" 
                          fill={isPassed ? "#f07639" : "#ffffff"} 
                          stroke={isPassed ? "#f07639" : "#cbd5e1"} 
                          strokeWidth="3" 
                          className="transition-all duration-300" 
                        />
                        <text 
                          x={x} 
                          y="20" 
                          textAnchor="middle" 
                          className="text-[10px] font-black text-slate-600 uppercase fill-current tracking-tight"
                        >
                          {p}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Checklist de Paradas de Control */}
              <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmación de Paradas Pasadas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {paradas.map((stop) => (
                    <label 
                      key={stop} 
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer select-none transition-all ${
                        completedStops.includes(stop)
                          ? "bg-orange-50/50 text-[#f07639] border-orange-100 font-bold"
                          : "bg-white text-slate-600 border-slate-150 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={completedStops.includes(stop)}
                        onChange={() => handleToggleParada(stop)}
                        className="w-4.5 h-4.5 rounded border-slate-300 text-[#f07639] focus:ring-[#f07639]/30 transition-all cursor-pointer"
                      />
                      <span className="text-xs">{stop}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "encomiendas" && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Manifiesto de Bodega</h2>
            {viaje.encomiendas.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No hay encomiendas para este viaje.</p>
            ) : (
              <div className="space-y-3">
                {viaje.encomiendas.map((enc: any) => (
                  <div key={enc.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex items-center">
                      <Box className="w-6 h-6 text-[#f07639] mr-3" />
                      <div>
                        <p className="font-bold text-slate-700 text-sm">{enc.codigo_seguimiento}</p>
                        <p className="text-xs text-slate-500">Peso: {enc.peso_kg}kg</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Descargar en</p>
                      <p className="font-extrabold text-slate-800 text-sm">{enc.destino.nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "gastos" && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Reporte de Peajes y Gastos</h2>
            
            <form onSubmit={handleGuardarGasto} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-500 mb-1">Concepto</label>
                <input 
                  type="text" 
                  placeholder="Ej. Peaje Chicama"
                  required
                  value={gastoForm.concepto}
                  onChange={(e) => setGastoForm({...gastoForm, concepto: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-[#f07639] bg-white text-sm"
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="block text-xs font-bold text-slate-500 mb-1">Monto (S/)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  placeholder="15.50"
                  value={gastoForm.monto}
                  onChange={(e) => setGastoForm({...gastoForm, monto: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-[#f07639] bg-white text-sm"
                />
              </div>
              <button disabled={isUpdating} type="submit" className="bg-[#f07639] hover:bg-[#e06528] text-white px-6 py-2 rounded-xl font-bold h-[42px] w-full sm:w-auto transition-colors">
                Agregar
              </button>
            </form>

            <div className="space-y-2">
              {allGastos.map((g: any) => (
                <div key={g.id} className="flex justify-between items-center p-3 border-b border-slate-100 text-sm">
                  <span className="font-medium text-slate-700">{g.concepto}</span>
                  <span className="font-bold text-slate-900">S/ {Number(g.monto).toFixed(2)}</span>
                </div>
              ))}
              {allGastos.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">No has registrado gastos aún.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "novedades" && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Reportar Novedad Mecánica</h2>
            
            <form onSubmit={handleGuardarNovedad} className="bg-red-50/50 p-5 rounded-2xl border border-red-100 mb-6">
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-1">Categoría</label>
                <select 
                  value={novedadForm.categoria}
                  onChange={(e) => setNovedadForm({...novedadForm, categoria: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-red-400 bg-white text-sm"
                >
                  <option>Motor</option>
                  <option>Llantas</option>
                  <option>Frenos</option>
                  <option>Interiores / Asientos</option>
                  <option>Aire Acondicionado</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-1">Descripción del problema</label>
                <textarea 
                  required
                  rows={3}
                  value={novedadForm.descripcion}
                  onChange={(e) => setNovedadForm({...novedadForm, descripcion: e.target.value})}
                  placeholder="Describe brevemente el ruido o problema que notaste..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-red-400 bg-white text-sm"
                />
              </div>
              <button disabled={isUpdating} type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold flex justify-center items-center transition-colors">
                <AlertCircle className="w-5 h-5 mr-2" /> Enviar Reporte a Mantenimiento
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-500">Historial de Reportes</h3>
              {allNovedades.map((n: any) => (
                <div key={n.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-start">
                  <div>
                    <span className="inline-block px-2 py-1 rounded bg-slate-200 text-[10px] font-bold text-slate-600 mb-2">{n.categoria}</span>
                    <p className="text-sm text-slate-700">{n.descripcion}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${n.estado === 'pendiente' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {n.estado}
                  </span>
                </div>
              ))}
              {allNovedades.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">Sin reportes registrados en este viaje.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
