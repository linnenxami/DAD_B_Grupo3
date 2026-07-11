import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getViajesConductor } from "@/app/(admin)/actions/conductor";
import ViajesConductorClient from "./ViajesConductorClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConductorViajesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "conductor") {
    redirect("/login");
  }

  const viajes = await getViajesConductor(Number((session.user as any).persona_id));

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-0 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link 
          href="/staff/conductor" 
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-650 hover:bg-slate-50 transition-all shadow-sm mr-4 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Mis Viajes Asignados</h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">Selecciona un viaje para ver la hoja de ruta y comenzar.</p>
        </div>
      </div>
      
      <ViajesConductorClient initialViajes={viajes} />
    </div>
  );
}
