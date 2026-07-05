"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Panel Admin Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full px-4 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Ups! Algo salió mal</h2>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        Ha ocurrido un error inesperado al intentar cargar esta sección. Por favor, intenta de nuevo.
      </p>
      
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-3 bg-[#f07639] hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
      >
        <RefreshCcw className="w-5 h-5" />
        Reintentar
      </button>
    </div>
  );
}
