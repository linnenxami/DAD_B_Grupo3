"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { getClienteProfile, updateClienteProfile } from "@/app/actions";
import { User, Calendar, Phone, CreditCard, Mail, Ticket, CheckCircle, Save, Loader2, Bus } from "lucide-react";
import Link from "next/link";

function PerfilContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "datos";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      loadProfile();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  // Sincronizar tab desde url
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "tickets" || tab === "datos") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await getClienteProfile(session!.user!.email!);
      if (data) {
        setProfile(data);
        setNombre(data.nombre || "");
        setDni(data.dni || "");
        setTelefono(data.telefono || "");
        if (data.fecha_nacimiento) {
          const dateObj = new Date(data.fecha_nacimiento);
          const yyyy = dateObj.getUTCFullYear();
          const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(dateObj.getUTCDate()).padStart(2, '0');
          setFechaNacimiento(`${yyyy}-${mm}-${dd}`);
        } else {
          setFechaNacimiento("");
        }
      }
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      setError("Error al obtener la información de perfil.");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!nombre.trim()) {
      setError("El nombre es requerido.");
      return;
    }

    if (dni && !/^\d{8}$/.test(dni)) {
      setError("El DNI debe tener exactamente 8 dígitos numéricos.");
      return;
    }

    if (telefono && !/^\d{9}$/.test(telefono)) {
      setError("El teléfono debe tener exactamente 9 dígitos numéricos.");
      return;
    }

    try {
      setSaving(true);
      const res = await updateClienteProfile(session!.user!.email!, {
        nombre,
        dni: dni || undefined,
        telefono: telefono || undefined,
        fecha_nacimiento: fechaNacimiento || undefined,
      });

      if (res.success) {
        setSuccessMsg("¡Tus datos se actualizaron con éxito!");
        await loadProfile();
      } else {
        setError(res.error || "Ocurrió un error al guardar los datos.");
      }
    } catch (err: any) {
      setError(err.message || "Error al actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#f07639] w-10 h-10" />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "cliente") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl text-center border border-gray-100">
          <User className="mx-auto h-16 w-16 text-[#f07639]" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Inicia sesión como cliente</h2>
          <p className="mt-2 text-sm text-gray-600">
            Para acceder a tu perfil y revisar tus pasajes, debes estar autenticado como cliente.
          </p>
          <div className="mt-8 space-y-4">
            <Link
              href="/login?callbackUrl=/perfil"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#f07639] hover:bg-[#d8662d] transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/registro"
              className="w-full flex justify-center py-3.5 px-4 border border-[#f07639] rounded-xl text-sm font-bold text-[#f07639] bg-white hover:bg-orange-50 transition-colors"
            >
              Crear una cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabecera del Perfil */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-[#f07639]">
              <User size={44} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{profile?.nombre}</h1>
              <p className="text-sm text-gray-500 font-medium">{profile?.correo}</p>
              <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-[#f07639]">
                Cliente Registrado
              </span>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas (Tabs) */}
        <div className="flex border-b border-gray-200 mb-8 bg-white p-2 rounded-xl shadow-sm border">
          <button
            onClick={() => setActiveTab("datos")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "datos"
                ? "bg-[#f07639] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <User size={18} />
            Mis Datos Personales
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "tickets"
                ? "bg-[#f07639] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Ticket size={18} />
            Mis Pasajes / Tickets ({profile?.pasajes?.length || 0})
          </button>
        </div>

        {/* CONTENIDO DE LA PESTAÑA: DATOS */}
        {activeTab === "datos" && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#f07639] rounded-full"></span>
              Modificar Información de Perfil
            </h2>

            {error && (
              <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-100 flex items-center gap-2">
                <CheckCircle size={18} />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-11 pr-4 py-3.5 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f07639]/20 focus:border-[#f07639] rounded-xl bg-gray-50/50 text-gray-800"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>
                </div>

                {/* Correo (No editable) */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Correo Electrónico (No modificable)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-300" />
                    </div>
                    <input
                      type="email"
                      disabled
                      className="block w-full pl-11 pr-4 py-3.5 text-sm border-gray-200 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
                      value={profile?.correo}
                    />
                  </div>
                </div>

                {/* DNI */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">DNI (Documento Nacional de Identidad)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      maxLength={8}
                      className="block w-full pl-11 pr-4 py-3.5 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f07639]/20 focus:border-[#f07639] rounded-xl bg-gray-50/50 text-gray-800"
                      value={dni}
                      onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                      placeholder="12345678"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Número de Celular</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      maxLength={9}
                      className="block w-full pl-11 pr-4 py-3.5 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f07639]/20 focus:border-[#f07639] rounded-xl bg-gray-50/50 text-gray-800"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                      placeholder="987654321"
                    />
                  </div>
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Nacimiento</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      className="block w-full pl-11 pr-4 py-3.5 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f07639]/20 focus:border-[#f07639] rounded-xl bg-gray-50/50 text-gray-800"
                      value={fechaNacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-sm font-bold rounded-xl shadow-md text-white bg-[#f07639] hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CONTENIDO DE LA PESTAÑA: TICKETS */}
        {activeTab === "tickets" && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#f07639] rounded-full"></span>
              Historial de Pasajes Comprados
            </h2>

            {!profile?.pasajes || profile.pasajes.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Ticket className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aún no has comprado pasajes</h3>
                <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto">
                  Tus boletos comprados aparecerán aquí para que puedas abordar y rastrearlos.
                </p>
                <div className="mt-6">
                  <Link
                    href="/compra"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-sm text-white bg-[#f07639] hover:bg-orange-600 transition-colors"
                  >
                    Comprar mi primer pasaje
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {profile.pasajes.map((ticket: any) => {
                  const salida = ticket.asiento_viaje?.viaje?.fecha_salida 
                    ? new Date(ticket.asiento_viaje.viaje.fecha_salida) 
                    : null;
                  
                  return (
                    <div 
                      key={ticket.id} 
                      className="border border-gray-200 rounded-2xl p-6 hover:border-[#f07639] transition-all bg-white relative overflow-hidden group flex flex-col md:flex-row justify-between items-center gap-6"
                    >
                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex items-center gap-2">
                          <Bus className="h-5 w-5 text-[#f07639]" />
                          <span className="text-sm font-bold text-gray-900 uppercase">
                            Servicio de Bus - N° {ticket.asiento_viaje?.viaje?.bus?.placa}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Ruta</span>
                            <span className="text-sm font-bold text-gray-800">
                              {ticket.asiento_viaje?.viaje?.ruta?.origen?.nombre} &rarr; {ticket.asiento_viaje?.viaje?.ruta?.destino?.nombre}
                            </span>
                          </div>

                          <div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Fecha y Hora</span>
                            <span className="text-sm font-bold text-gray-800">
                              {salida 
                                ? `${salida.toLocaleDateString()} - ${salida.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : "No especificado"}
                            </span>
                          </div>

                          <div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Asiento</span>
                            <span className="text-sm font-bold text-gray-800">N° {ticket.asiento_viaje?.numero_asiento} (Piso {ticket.asiento_viaje?.piso})</span>
                          </div>

                          <div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Precio Pagado</span>
                            <span className="text-sm font-bold text-[#f07639]">S/ {ticket.precio}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-xl border border-gray-100 text-center w-full md:w-auto min-w-[200px]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Código de Abordaje</span>
                        <span className="text-base font-mono font-bold text-gray-800 select-all border border-dashed border-gray-300 px-3 py-1.5 rounded-lg bg-white break-all w-full md:w-auto">
                          {ticket.codigo_qr}
                        </span>
                        <span className="text-[10px] text-green-600 font-semibold mt-2 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Ticket Válido
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-[#f07639] w-10 h-10" /></div>}>
      <PerfilContent />
    </Suspense>
  );
}
