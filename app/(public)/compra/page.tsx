"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { 
  getLocations, 
  searchTrips, 
  getTripSeats, 
  marcarAsientoPendiente, 
  liberarAsiento, 
  crearCargoCulqi, 
  procesarPagoExitosoCulqi,
  getClienteProfile
} from "@/app/actions";
import { 
  Loader2, 
  ArrowRight, 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  BusFront, 
  Search 
} from "lucide-react";
import Link from "next/link";
import Script from "next/script";

function CompraContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const originParam = searchParams.get("origin") || "";
  const destinationParam = searchParams.get("destination") || "";
  const dateParam = searchParams.get("date") || "";
  
  // Stepper state
  const [step, setStep] = useState(1);
  
  // Global loading state for actions
  const [loading, setLoading] = useState(false);

  // Step 1: Búsqueda
  const [locations, setLocations] = useState<any[]>([]);
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [peruDate] = useState(() => {
    const options = { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" } as const;
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === "year")?.value;
    const month = parts.find(p => p.type === "month")?.value;
    const day = parts.find(p => p.type === "day")?.value;
    return `${year}-${month}-${day}`;
  });
  const [date, setDate] = useState(peruDate);
  const [errorStep1, setErrorStep1] = useState("");

  const handleOriginChange = (val: string) => {
    if (val && val === destinationId) {
      setDestinationId(originId);
    }
    setOriginId(val);
  };

  const handleDestinationChange = (val: string) => {
    if (val && val === originId) {
      setOriginId(destinationId);
    }
    setDestinationId(val);
  };

  // Step 2: Viajes
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

  // Step 3: Asientos
  const [seats, setSeats] = useState<any[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<any | null>(null);

  // Step 4: Checkout
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [ticketResult, setTicketResult] = useState<any | null>(null);
  const [pasajero, setPasajero] = useState({ nombres: "", apellidos: "", dni: "", telefono: "" });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(480); // 8 minutos en segundos

  // Mantener referencia del asiento seleccionado para liberarlo al desmontar
  const selectedSeatRef = useRef<any>(null);
  useEffect(() => {
    selectedSeatRef.current = selectedSeat;
  }, [selectedSeat]);

  // Liberar el asiento bloqueado si el usuario abandona la página (desmonta el componente)
  useEffect(() => {
    return () => {
      if (selectedSeatRef.current) {
        liberarAsiento(selectedSeatRef.current.id).catch((err) => {
          console.error("Error al liberar asiento al abandonar la página:", err);
        });
      }
    };
  }, []);

  // Función para manejar la expiración del temporizador
  const handleExpiration = async () => {
    if (selectedSeatRef.current) {
      setLoading(true);
      await liberarAsiento(selectedSeatRef.current.id);
      alert("Tu tiempo de reserva para completar el pago ha expirado. Por favor, selecciona un asiento nuevamente.");
      setSelectedSeat(null);
      if (selectedTrip) {
        const tripSeats = await getTripSeats(selectedTrip.id);
        setSeats(tripSeats);
      }
      setStep(3);
      setLoading(false);
    }
  };

  // Efecto del temporizador en el paso 4
  useEffect(() => {
    if (step !== 4 || paymentSuccess) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleExpiration();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, paymentSuccess, selectedTrip]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Cargar datos completos del perfil del cliente autenticado para el llenado automático
  useEffect(() => {
    async function fetchPerfilCliente() {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const perfil = await getClienteProfile(session.user.email);
          if (perfil) {
            const partes = perfil.nombre.split(" ");
            const nombresStr = partes.slice(0, Math.ceil(partes.length / 2)).join(" ");
            const apellidosStr = partes.slice(Math.ceil(partes.length / 2)).join(" ");
            
            setPasajero({
              nombres: nombresStr || "",
              apellidos: apellidosStr || "",
              dni: perfil.dni || "",
              telefono: perfil.telefono || "",
            });
          }
        } catch (e) {
          console.error("Error al cargar perfil de cliente para autocompletado:", e);
        }
      }
    }
    fetchPerfilCliente();
  }, [session, status]);

  useEffect(() => {
    async function loadLocationsAndAutosearch() {
      const locs = await getLocations();
      setLocations(locs);

      // Si vienen parámetros en la URL, disparar búsqueda automática de viajes
      if (originParam && destinationParam && dateParam) {
        setOriginId(originParam);
        setDestinationId(destinationParam);
        setDate(dateParam);
        
        setLoading(true);
        const results = await searchTrips(originParam, destinationParam, dateParam);
        setTrips(results);
        setStep(2);
        setLoading(false);
      }
    }
    loadLocationsAndAutosearch();
  }, [originParam, destinationParam, dateParam]);

  // Listener para cuando el usuario cierra el modal de Culqi manualmente
  useEffect(() => {
    const handleCulqiMessage = async (event: MessageEvent) => {
      if (event.data === "checkout_cerrado") {
        console.log("Checkout cerrado por el usuario.");
        if (selectedSeat) {
          setLoading(true);
          await liberarAsiento(selectedSeat.id);
          alert("Pago fallido");
          setPaymentError("El proceso de pago fue cancelado o cerrado.");
          setStep(3);
          setSelectedSeat(null);
          // Recargar asientos
          if (selectedTrip) {
            const tripSeats = await getTripSeats(selectedTrip.id);
            setSeats(tripSeats);
          }
          setLoading(false);
        }
      }
    };
    
    window.addEventListener("message", handleCulqiMessage);
    return () => {
      window.removeEventListener("message", handleCulqiMessage);
    };
  }, [selectedSeat, selectedTrip]);

  const handleSearchTrips = async () => {
    if (!originId || !destinationId || !date) {
      setErrorStep1("Por favor completa todos los campos.");
      return;
    }
    if (originId === destinationId) {
      setErrorStep1("El origen y el destino no pueden ser iguales.");
      return;
    }
    setErrorStep1("");
    setLoading(true);
    const results = await searchTrips(originId, destinationId, date);
    setTrips(results);
    setStep(2);
    setLoading(false);
  };

  const handleSelectTrip = async (trip: any) => {
    setSelectedTrip(trip);
    setLoading(true);
    const tripSeats = await getTripSeats(trip.id);
    setSeats(tripSeats);
    setStep(3);
    setLoading(false);
  };

  const goToStep4 = async () => {
    if (!selectedSeat) return;
    setLoading(true);
    setPaymentError(null);
    try {
      const reserveRes = await marcarAsientoPendiente(selectedSeat.id, session?.user?.email || undefined);
      if (!reserveRes.success) {
        alert(reserveRes.error || "El asiento ya ha sido seleccionado por otro pasajero.");
        // Volver a cargar asientos
        if (selectedTrip) {
          const tripSeats = await getTripSeats(selectedTrip.id);
          setSeats(tripSeats);
        }
        setSelectedSeat(null);
        setStep(3);
        setLoading(false);
        return;
      }

      // Reiniciar temporizador
      setTimeLeft(480);

      // Si hay sesión activa, pre-completamos los nombres si están vacíos
      if (session?.user?.name && !pasajero.nombres) {
        const partes = session.user.name.split(" ");
        const nombresStr = partes.slice(0, Math.ceil(partes.length / 2)).join(" ");
        const apellidosStr = partes.slice(Math.ceil(partes.length / 2)).join(" ");
        setPasajero(p => ({ ...p, nombres: nombresStr, apellidos: apellidosStr }));
      }
      setStep(4);
    } catch (e) {
      console.error("Error al marcar asiento temporal en goToStep4:", e);
      alert("Hubo un error al reservar el asiento temporalmente.");
    } finally {
      setLoading(false);
    }
  };

  const handlePagarConCulqi = async () => {
    if (!pasajero.nombres || !pasajero.apellidos || !pasajero.dni) {
      alert("Nombres, Apellidos y DNI son obligatorios.");
      return;
    }
    if (!/^\d{8}$/.test(pasajero.dni)) {
      alert("El DNI debe tener exactamente 8 dígitos.");
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      const email = session?.user?.email || `invitado_${pasajero.dni}@elcumbe.com`;

      // 1. Configurar el objeto Culqi global
      const Culqi = (window as any).Culqi;
      if (!Culqi) {
        await liberarAsiento(selectedSeat.id);
        alert("No se pudo cargar la pasarela de pago Culqi. Por favor intenta de nuevo.");
        setLoading(false);
        return;
      }

      // Configurar Llave Pública de Culqi
      Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY || "pk_test_d7a5b3a32f6236b2";

      Culqi.settings({
        title: "Transportes El Cumbe",
        currency: "PEN",
        amount: Math.round(Number(selectedTrip.ruta.precio_base) * 100), // En centavos
      });

      Culqi.options({
        style: {
          logo: "https://i.ibb.co/C0hYj1f/logo-cumbe.png",
          bannerColor: "#f07639",
        }
      });

      // 3. Definir la función callback que recibirá el token de pago
      (window as any).culqi = async () => {
        if (Culqi.token) {
          const token = Culqi.token.id;
          console.log("Token generado exitosamente:", token);
          setLoading(true);

          try {
            // Enviar token al backend para realizar el cargo
            const chargeRes = await crearCargoCulqi(
              token,
              email,
              Number(selectedTrip.ruta.precio_base)
            );

            if (chargeRes.success && chargeRes.chargeId) {
              // Registro de pago y creación del pasaje en BD
              const dbRes = await procesarPagoExitosoCulqi(
                selectedTrip.id,
                selectedSeat.id,
                pasajero,
                Number(selectedTrip.ruta.precio_base),
                chargeRes.chargeId,
                session?.user?.email || undefined
              );

              if (dbRes.success && dbRes.ticket) {
                setTicketResult(dbRes.ticket);
                setPaymentSuccess(true);
                setStep(4);
                Culqi.close();
              } else {
                alert(dbRes.error || "El pago fue procesado, pero hubo un problema emitiendo tu boleto. Por favor contacta a soporte.");
                Culqi.close();
              }
            } else {
              // Error al procesar el cargo
              await liberarAsiento(selectedSeat.id);
              alert(chargeRes.error || "El pago no pudo ser completado.");
              setPaymentError(chargeRes.error || "Pago fallido en pasarela.");
              setStep(3);
              setSelectedSeat(null);
              // Recargar asientos
              const tripSeats = await getTripSeats(selectedTrip.id);
              setSeats(tripSeats);
              Culqi.close();
            }
          } catch (e: any) {
            console.error("Error procesando pago en callback:", e);
            await liberarAsiento(selectedSeat.id);
            alert("Ocurrió un error inesperado al procesar el pago.");
            Culqi.close();
          } finally {
            setLoading(false);
          }
        } else if (Culqi.order) {
          console.log("Orden generada exitosamente:", Culqi.order);
          Culqi.close();
        } else {
          console.error("Error de tokenización:", Culqi.error);
          await liberarAsiento(selectedSeat.id);
          alert("Pago fallido");
          setPaymentError(Culqi.error?.user_message || "Pago fallido");
          setStep(3);
          setSelectedSeat(null);
          // Recargar asientos
          const tripSeats = await getTripSeats(selectedTrip.id);
          setSeats(tripSeats);
          setLoading(false);
        }
      };

      // 4. Abrir pasarela Culqi
      Culqi.open();

    } catch (e) {
      console.error("Error al iniciar checkout:", e);
      alert("Error al iniciar el checkout.");
      setLoading(false);
    }
  };

  const seatsPiso1 = seats.filter(s => Number(s.piso) === 1);
  const seatsPiso2 = seats.filter(s => Number(s.piso) === 2);

  const renderTVIcon = () => (
    <svg className="w-4 h-4 text-gray-400 opacity-70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M8 3l4 4 4-4" />
    </svg>
  );

  const renderEscaleraIcon = () => (
    <div className="w-8 h-8 flex items-center justify-center">
      <svg className="w-6 h-6 text-gray-400 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h4v-5h4v-5h4v-5h6" />
      </svg>
    </div>
  );

  const renderVolante = () => (
    <div className="text-gray-400 p-1 flex justify-center items-center">
      <svg className="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 15l-3.5 6" />
        <path d="M12 15l3.5 6" />
        <path d="M12 9V2" />
        <path d="M4 10l5.5 2" />
        <path d="M20 10l-5.5 2" />
      </svg>
    </div>
  );

  const renderAsientoButton = (seat: any, esPiso1: boolean) => {
    const isAvailable = seat.estado === "disponible";
    const isSelected = selectedSeat?.id === seat.id;

    let colorClass = "";
    let isOcupado = false;

    if (isSelected) {
      colorClass = "text-white bg-[#f07639] border-[#d8662d] shadow-md scale-105 rounded-xl";
    } else if (!isAvailable) {
      colorClass = "text-gray-300 bg-transparent";
      isOcupado = true;
    } else {
      colorClass = "text-[#7c2d12] hover:text-orange-600 bg-transparent hover:scale-105";
    }

    return (
      <button
        key={seat.id}
        disabled={!isAvailable}
        onClick={() => setSelectedSeat(seat)}
        className={`relative w-8 h-8 flex items-center justify-center transition-all focus:outline-none cursor-pointer ${colorClass}`}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Contorno Exterior (Respaldo + Apoyabrazos) */}
          <path
            d="M 22 42 H 28 V 22 C 28 14, 72 14, 72 22 V 42 H 78 C 83 42, 85 46, 85 50 V 78 C 85 86, 77 88, 70 88 H 30 C 23 88, 15 86, 15 78 V 50 C 15 46, 17 42, 22 42 Z"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Línea Interior (Cojín) */}
          <path
            d="M 28 42 V 66 C 28 74, 72 74, 72 66 V 42"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {isOcupado ? (
            /* Cruz X para ocupados */
            <path
              d="M 40 22 L 60 42 M 60 22 L 40 42"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
            />
          ) : (
            /* Número de Asiento */
            <text
              x="50"
              y="34"
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-bold text-[20px]"
              fill="currentColor"
            >
              {seat.numero_asiento}
            </text>
          )}
        </svg>
      </button>
    );
  };

  const renderAsientosPiso = (asientosPiso: any[], esPiso1: boolean) => {
    const filas: any[][] = [];
    for (let i = 0; i < asientosPiso.length; i += 4) {
      filas.push(asientosPiso.slice(i, i + 4));
    }

    return (
      <div className="space-y-2">
        {filas.map((fila, filaIdx) => (
          <div key={filaIdx} className="grid grid-cols-5 gap-2 items-center justify-items-center">
            {fila[0] ? renderAsientoButton(fila[0], esPiso1) : <div className="w-10 h-10" />}
            {fila[1] ? renderAsientoButton(fila[1], esPiso1) : <div className="w-10 h-10" />}
            <div className="w-3 h-8" />
            {fila[2] ? renderAsientoButton(fila[2], esPiso1) : <div className="w-10 h-10" />}
            {fila[3] ? renderAsientoButton(fila[3], esPiso1) : <div className="w-10 h-10" />}
          </div>
        ))}
      </div>
    );
  };

  const renderPiso1DoblePiso = () => {
    const filasPiso1 = [
      { col1: 1, col2: 2, col4: 3, hasTV: true },
      { col1: 4, col2: 5, col4: 6, hasTV: false },
      { col1: 7, col2: 8, col4: 9, hasTV: false },
      { col1: 10, col2: 11, col4: 12, hasTV: false },
    ];

    return (
      <div className="space-y-0.5">
        {filasPiso1.map((fila, idx) => {
          const seatCol1 = seats.find(s => Number(s.piso) === 1 && s.numero_asiento === fila.col1);
          const seatCol2 = seats.find(s => Number(s.piso) === 1 && s.numero_asiento === fila.col2);
          const seatCol4 = seats.find(s => Number(s.piso) === 1 && s.numero_asiento === fila.col4);

          return (
            <div key={idx} className="flex items-center justify-center gap-0.5">
              {seatCol1 ? renderAsientoButton(seatCol1, true) : <div className="w-8 h-8" />}
              {seatCol2 ? renderAsientoButton(seatCol2, true) : <div className="w-8 h-8" />}
              <div className="w-4 flex items-center justify-center">
                {fila.hasTV && renderTVIcon()}
              </div>
              {seatCol4 ? renderAsientoButton(seatCol4, true) : <div className="w-8 h-8" />}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPiso2DoblePiso = () => {
    type Fila2 = { col1: number; col2: number; col4: number | null; col5: number | null; hasTV: boolean; escalera: boolean };
    const filasPiso2: Fila2[] = [
      { col1: 13, col2: 14, col4: 15, col5: 16, hasTV: true, escalera: false },
      { col1: 17, col2: 18, col4: 19, col5: 20, hasTV: false, escalera: false },
      { col1: 21, col2: 22, col4: null, col5: null, hasTV: false, escalera: true },
      { col1: 23, col2: 24, col4: null, col5: null, hasTV: false, escalera: false },
      { col1: 25, col2: 26, col4: 27, col5: 28, hasTV: true, escalera: false },
      { col1: 29, col2: 30, col4: 31, col5: 32, hasTV: true, escalera: false },
      { col1: 33, col2: 34, col4: 35, col5: 36, hasTV: false, escalera: false },
      { col1: 37, col2: 38, col4: 39, col5: 40, hasTV: false, escalera: false },
      { col1: 41, col2: 42, col4: 43, col5: 44, hasTV: false, escalera: false },
      { col1: 45, col2: 46, col4: 47, col5: 48, hasTV: false, escalera: false },
      { col1: 49, col2: 50, col4: 51, col5: 52, hasTV: true, escalera: false },
      { col1: 53, col2: 54, col4: 55, col5: 56, hasTV: false, escalera: false },
      { col1: 57, col2: 58, col4: 59, col5: 60, hasTV: false, escalera: false },
    ];

    return (
      <div className="space-y-0.5">
        {filasPiso2.map((fila, idx) => {
          const seatCol1 = seats.find(s => Number(s.piso) === 2 && s.numero_asiento === fila.col1);
          const seatCol2 = seats.find(s => Number(s.piso) === 2 && s.numero_asiento === fila.col2);
          const seatCol4 = fila.col4 !== null ? seats.find(s => Number(s.piso) === 2 && s.numero_asiento === fila.col4) : null;
          const seatCol5 = fila.col5 !== null ? seats.find(s => Number(s.piso) === 2 && s.numero_asiento === fila.col5) : null;

          return (
            <div key={idx} className="flex items-center justify-center gap-0.5">
              {seatCol1 ? renderAsientoButton(seatCol1, false) : <div className="w-8 h-8" />}
              {seatCol2 ? renderAsientoButton(seatCol2, false) : <div className="w-8 h-8" />}
              <div className="w-4 flex items-center justify-center">
                {fila.hasTV && renderTVIcon()}
              </div>
              {fila.escalera ? (
                <>{renderEscaleraIcon()}<div className="w-8 h-8" /></>
              ) : fila.col4 === null ? (
                <><div className="w-8 h-8" /><div className="w-8 h-8" /></>
              ) : (
                <>
                  {seatCol4 ? renderAsientoButton(seatCol4, false) : <div className="w-8 h-8" />}
                  {seatCol5 ? renderAsientoButton(seatCol5, false) : <div className="w-8 h-8" />}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStepper = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-[#f07639] z-0 transition-all duration-500 ease-in-out" 
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        ></div>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 ${
              step >= s ? "bg-[#f07639] border-orange-100 text-white" : "bg-white border-gray-200 text-gray-400"
            }`}>
              {s}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs font-medium text-gray-500 px-2">
        <span>Búsqueda</span>
        <span>Viajes</span>
        <span>Asiento</span>
        <span>Pago</span>
      </div>
    </div>
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#f07639] w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {!paymentSuccess && renderStepper()}

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* STEP 1: Búsqueda */}
          {step === 1 && (
            <div className="p-8 md:p-12">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">¿A dónde quieres viajar hoy?</h2>
              
              {errorStep1 && (
                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium text-center border border-red-100">
                  {errorStep1}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Origen</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="block w-full pl-10 py-4 text-base border-gray-300 focus:outline-none focus:ring-[#f07639] focus:border-[#f07639] sm:text-sm rounded-xl bg-gray-50 bg-none cursor-pointer text-gray-900"
                      value={originId}
                      onChange={(e) => handleOriginChange(e.target.value)}
                    >
                      <option value="">Selecciona Origen</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destino</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      className="block w-full pl-10 py-4 text-base border-gray-300 focus:outline-none focus:ring-[#f07639] focus:border-[#f07639] sm:text-sm rounded-xl bg-gray-50 bg-none cursor-pointer text-gray-900"
                      value={destinationId}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                    >
                      <option value="">Selecciona Destino</option>
                      {locations
                        .filter((loc) => loc.id.toString() !== originId.toString())
                        .map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Viaje</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      min={peruDate}
                      className="block w-full pl-10 py-4 text-base border-gray-300 focus:outline-none focus:ring-[#f07639] focus:border-[#f07639] sm:text-sm rounded-xl bg-gray-50 text-gray-900"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 text-center">
                <button
                  onClick={handleSearchTrips}
                  disabled={loading}
                  className="inline-flex items-center px-10 py-4 border border-transparent text-lg font-bold rounded-xl shadow-sm text-white bg-[#f07639] hover:bg-[#d8662d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f07639] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
                  Buscar Viajes
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Viajes */}
          {step === 2 && (
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900">Viajes Disponibles</h2>
                <button onClick={() => setStep(1)} className="text-sm text-[#f07639] hover:underline font-medium">Modificar Búsqueda</button>
              </div>

              {trips.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay viajes programados</h3>
                  <p className="mt-1 text-sm text-gray-500">Prueba cambiando la fecha o tu lugar de destino.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <div key={trip.id} className="border border-gray-200 rounded-2xl p-6 hover:border-[#f07639] transition-all bg-white flex flex-col sm:flex-row justify-between items-center group cursor-pointer" onClick={() => handleSelectTrip(trip)}>
                      <div className="flex items-center space-x-6 mb-4 sm:mb-0">
                        <div className="text-center">
                          <p className="text-3xl font-extrabold text-gray-900">
                            {trip.departure_time_formatted}
                          </p>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">Salida</p>
                        </div>
                        <div className="h-12 w-px bg-gray-200 hidden sm:block"></div>
                        <div>
                          <p className="text-lg font-bold text-[#f07639]">S/ {trip.ruta.precio_base}</p>
                          <p className="text-sm text-gray-500 font-medium">
                            <span className="text-green-600 font-bold">{trip.available_seats}</span> asientos disponibles
                          </p>
                        </div>
                      </div>
                      <button className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl group-hover:bg-[#f07639] group-hover:text-white transition-colors">
                        Seleccionar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Asientos */}
          {step === 3 && (
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-gray-900">Selecciona tu Asiento</h2>
                <button onClick={() => setStep(2)} className="text-sm text-[#f07639] hover:underline font-medium">Volver a Viajes</button>
              </div>

              {/* Leyenda horizontal + Botón */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-5 rounded-t rounded-b-sm border border-[#7c2d12] bg-white" />
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-5 rounded-t rounded-b-sm border border-[#d8662d] bg-[#f07639]" />
                    <span>Seleccionado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-5 rounded-t rounded-b-sm border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-300">
                      <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <span>Ocupado</span>
                  </div>
                </div>

                {paymentError && (
                  <span className="text-red-600 text-xs font-medium">{paymentError}</span>
                )}

                <button
                  disabled={!selectedSeat || loading}
                  onClick={goToStep4}
                  className="flex items-center px-5 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#f07639] hover:bg-[#d8662d] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Continuar al Pago <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                </button>
              </div>

              {/* Croquis de Asientos */}
              {selectedTrip?.bus?.pisos === 2 ? (
                <div className="flex flex-col md:flex-row justify-center gap-4">
                  {/* Primer Piso */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-3 pb-4 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                       {renderVolante()}
                       <span className="text-xs font-extrabold text-gray-700">Primer Piso</span>
                    </div>
                    {renderPiso1DoblePiso()}
                  </div>

                  {/* Segundo Piso */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-3 pb-4 shadow-sm">
                    <div className="flex justify-center items-center mb-2">
                       <span className="text-xs font-extrabold text-gray-700">Segundo Piso</span>
                    </div>
                    {renderPiso2DoblePiso()}
                  </div>
                </div>
              ) : (
                /* Bus de 1 solo piso */
                <div className="max-w-xs bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mx-auto">
                  <div className="flex items-center space-x-2 mb-3">
                    {renderVolante()}
                    <span className="text-xs font-extrabold text-gray-700">Distribución de Asientos</span>
                  </div>
                  {renderAsientosPiso(seats, true)}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Checkout */}
          {step === 4 && !paymentSuccess && (
            <div className="p-6 md:p-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900">Resumen de Compra</h2>
                <button 
                  onClick={async () => {
                    if (selectedSeat) {
                      setLoading(true);
                      await liberarAsiento(selectedSeat.id);
                      setSelectedSeat(null);
                      setLoading(false);
                    }
                    setStep(3);
                  }} 
                  className="text-sm text-[#f07639] hover:underline font-medium"
                  disabled={loading}
                >
                  Cambiar Asiento
                </button>
              </div>

              {/* Layout de dos columnas para optimizar espacio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                {/* Lado izquierdo (Datos y Botón de Pago) - 2/3 en pantallas medianas y grandes */}
                <div className="md:col-span-2 space-y-6">
                  {/* Formulario del Pasajero */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Datos del Pasajero</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                        <input 
                          type="text" 
                          value={pasajero.nombres}
                          onChange={(e) => setPasajero({...pasajero, nombres: e.target.value.toUpperCase()})}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#f07639] outline-none text-gray-900 bg-white text-sm"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                        <input 
                          type="text" 
                          value={pasajero.apellidos}
                          onChange={(e) => setPasajero({...pasajero, apellidos: e.target.value.toUpperCase()})}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#f07639] outline-none text-gray-900 bg-white text-sm"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
                        <input 
                          type="text" 
                          maxLength={8}
                          value={pasajero.dni}
                          onChange={(e) => setPasajero({...pasajero, dni: e.target.value.replace(/\D/g, "")})}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#f07639] outline-none text-gray-900 bg-white text-sm"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Celular (Opcional)</label>
                        <input 
                          type="text" 
                          value={pasajero.telefono}
                          onChange={(e) => setPasajero({...pasajero, telefono: e.target.value.replace(/\D/g, "")})}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#f07639] outline-none text-gray-900 bg-white text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium text-center border border-red-100">
                      {paymentError}
                    </div>
                  )}

                  <button
                    onClick={handlePagarConCulqi}
                    disabled={loading || !pasajero.nombres || !pasajero.apellidos || !pasajero.dni}
                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" /> Pagar con Culqi (Tarjeta / Yape)
                      </>
                    )}
                  </button>
                </div>

                {/* Lado derecho (Temporizador y Detalle de Compra) - 1/3 en pantallas medianas y grandes */}
                <div className="space-y-4">
                  {/* Temporizador de Cuenta Regresiva */}
                  <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-red-600 animate-pulse" />
                      <div>
                        <p className="font-bold text-xs">Tiempo para pagar</p>
                      </div>
                    </div>
                    <div className="bg-red-600 text-white font-mono font-black text-base px-3 py-1.5 rounded-lg shadow-sm border border-red-700 tracking-wider">
                      {formatTime(timeLeft)}
                    </div>
                  </div>

                  {/* Resumen de Ruta y Precio */}
                  <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 shadow-sm">
                    <h4 className="text-sm font-bold text-orange-950 mb-3 border-b border-orange-200 pb-2">Detalles del Viaje</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-orange-800 font-medium opacity-75">Fecha y Hora</p>
                        <p className="text-sm font-bold text-gray-900">
                          {selectedTrip && new Date(selectedTrip.fecha_salida || selectedTrip.departure_time).toLocaleDateString()} - {selectedTrip && new Date(selectedTrip.fecha_salida || selectedTrip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-800 font-medium opacity-75">Asiento</p>
                        <p className="text-sm font-bold text-gray-900">N° {selectedSeat?.numero_asiento}</p>
                      </div>
                      <div className="pt-2 border-t border-orange-200 flex justify-between items-center">
                        <p className="text-sm font-bold text-gray-900">Total a Pagar</p>
                        <p className="text-2xl font-extrabold text-[#f07639]">S/ {selectedTrip?.ruta.precio_base}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* PAGO EXITOSO */}
          {paymentSuccess && (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">¡Compra Exitosa!</h2>
              <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
                Tu pasaje ha sido confirmado. Presenta este código al abordar el bus.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-sm mx-auto mb-10">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Código de Ticket</p>
                <p className="text-2xl font-mono font-bold text-gray-900 break-all">{ticketResult?.codigo_qr}</p>
              </div>

              <Link href="/" className="inline-flex justify-center items-center py-3 px-8 border border-gray-300 rounded-xl shadow-sm text-lg font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all">
                Volver al Inicio
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function CompraPage() {
  return (
    <>
      <Script src="https://checkout.culqi.com/js/v4" strategy="afterInteractive" />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#f07639] w-10 h-10" /></div>}>
        <CompraContent />
      </Suspense>
    </>
  );
}
