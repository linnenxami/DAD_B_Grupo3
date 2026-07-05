import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
      <Loader2 className="w-12 h-12 text-[#f07639] animate-spin mb-4" />
      <h2 className="text-xl font-bold text-gray-700">Cargando...</h2>
      <p className="text-gray-500 text-sm mt-2">Estamos preparando la información para ti.</p>
    </div>
  );
}
