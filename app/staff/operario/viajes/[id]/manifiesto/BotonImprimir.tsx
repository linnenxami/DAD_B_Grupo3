"use client";

import { Printer } from "lucide-react";

export default function BotonImprimir() {
  return (
    <button
      onClick={() => {
        if (typeof window !== "undefined") {
          window.print();
        }
      }}
      className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm active:scale-95"
    >
      <Printer className="w-4 h-4" />
      IMPRIMIR MANIFIESTO (SUTRAN)
    </button>
  );
}
