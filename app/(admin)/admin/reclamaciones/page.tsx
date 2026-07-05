import { getReclamaciones } from "@/app/(admin)/actions/reclamaciones";
import ReclamacionesClient from "./ReclamacionesClient";

export const metadata = {
  title: "Gestión de Reclamaciones | El Cumbe",
  description: "Administración de reclamos y quejas",
};

export default async function ReclamacionesPage() {
  const reclamaciones = await getReclamaciones();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0d1220] tracking-tight">Reclamaciones</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Gestión de quejas y reclamos de los clientes</p>
        </div>
      </div>

      <ReclamacionesClient initialData={reclamaciones} />
    </div>
  );
}
