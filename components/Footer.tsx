import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ComplaintBookModalTrigger } from "@/components/ComplaintBook";

const footerLinks = [
  { href: "/", label: "Inicio" },
  { href: "/quienes-somos", label: "Sucursales" },
  { href: "/quienes-somos", label: "¿Quiénes Somos?" },
  { href: "/ayuda", label: "Ayuda" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#2d3b35] bg-[#18221e] py-4 text-white transition-colors duration-300 dark:border-[#202c27] dark:bg-[#090e0c]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-4 text-center md:grid-cols-3 md:items-start md:text-left">
          <div className="flex flex-col space-y-1">
            <h4 className="mb-0.5 text-sm font-bold text-white uppercase tracking-wider">Enlaces rápidos</h4>
            <div className="flex flex-col space-y-1">
              {footerLinks.map((link) => (
                <Link key={`${link.href}-${link.label}`} href={link.href} className="text-xs text-[#aebbb5] transition-colors hover:text-[#ff9663]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex justify-center items-center h-full">
            <Link href="/" aria-label="Ir al inicio">
              <img src="/logocumbe.png" alt="El Cumbe Logo" className="h-9 w-auto object-contain transition-opacity hover:opacity-90" />
            </Link>
          </div>

          <div className="flex flex-col space-y-2 md:items-end">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Atención al cliente</h4>
            <ComplaintBookModalTrigger icon={<BookOpen size={16} className="text-[#ff8b55]" aria-hidden="true" />} />
          </div>
        </div>

        <div className="mt-4 border-t border-[#324039] pt-3 text-center md:flex md:items-center md:justify-between dark:border-[#202c27]">
          <p className="text-xs text-[#82918a]">© 2026 El Cumbe. Todos los derechos reservados.</p>
          <div className="mt-2 flex justify-center space-x-6 text-[#82918a] md:mt-0">
            <Link href="#" className="text-xs transition-colors hover:text-white">Términos y Condiciones</Link>
            <Link href="#" className="text-xs transition-colors hover:text-white">Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
