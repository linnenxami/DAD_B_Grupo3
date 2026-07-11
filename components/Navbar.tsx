"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, ChevronDown, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (["/login", "/registro", "/recuperar-password", "/verificar"].includes(pathname)) {
    return null;
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-100 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex flex-shrink-0 items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-9 md:h-11 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex md:items-center space-x-1 lg:space-x-2">
            <Link
              href="/"
              onMouseEnter={() => router.prefetch('/')}
              className={`transition-all duration-200 px-3.5 py-2 text-xs lg:text-sm rounded-full font-bold ${pathname === '/' ? 'text-[#f07639] bg-orange-50/80 font-extrabold' : 'text-gray-650 hover:text-[#f07639] hover:bg-orange-50/30'}`}
            >
              Inicio
            </Link>
            <Link
              href="/seguimiento"
              onMouseEnter={() => router.prefetch('/seguimiento')}
              className={`transition-all duration-200 px-3.5 py-2 text-xs lg:text-sm rounded-full font-bold whitespace-nowrap ${pathname === '/seguimiento' ? 'text-[#f07639] bg-orange-50/80 font-extrabold' : 'text-gray-650 hover:text-[#f07639] hover:bg-orange-50/30'}`}
            >
              Revisar Encomienda
            </Link>
            <Link
              href="/quienes-somos"
              onMouseEnter={() => router.prefetch('/quienes-somos')}
              className={`transition-all duration-200 px-3.5 py-2 text-xs lg:text-sm rounded-full font-bold whitespace-nowrap ${pathname === '/quienes-somos' ? 'text-[#f07639] bg-orange-50/80 font-extrabold' : 'text-gray-650 hover:text-[#f07639] hover:bg-orange-50/30'}`}
            >
              ¿Quiénes Somos?
            </Link>
            <Link
              href="/ayuda"
              onMouseEnter={() => router.prefetch('/ayuda')}
              className={`transition-all duration-200 px-3.5 py-2 text-xs lg:text-sm rounded-full font-bold whitespace-nowrap ${pathname === '/ayuda' ? 'text-[#f07639] bg-orange-50/80 font-extrabold' : 'text-gray-650 hover:text-[#f07639] hover:bg-orange-50/30'}`}
            >
              Ayuda / FAQs
            </Link>
            <Link
              href="/compra"
              onMouseEnter={() => router.prefetch('/compra')}
              className={`transition-all duration-200 px-3.5 py-2 text-xs lg:text-sm rounded-full font-bold whitespace-nowrap ${pathname === '/compra' ? 'text-[#f07639] bg-orange-50/80 font-extrabold' : 'text-gray-650 hover:text-[#f07639] hover:bg-orange-50/30'}`}
            >
              Compra tu pasaje
            </Link>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {status === "loading" ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-md"></div>
            ) : session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 lg:gap-2 text-gray-700 hover:text-[#f07639] focus:outline-none transition-all duration-200 max-w-[180px] lg:max-w-[260px]"
                >
                  <div className="bg-gray-100 p-2 rounded-full hover:bg-orange-50 hover:text-[#f07639] transition-colors flex-shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <span 
                    className="font-semibold text-xs lg:text-sm truncate max-w-[80px] lg:max-w-[140px] whitespace-nowrap"
                    title={session.user?.name || ""}
                  >
                    {session.user?.name ? session.user.name.split(" ").slice(0, 2).join(" ") : ""}
                  </span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#f07639]' : ''}`} />
                </button>

                {/* Dropdown transition Wrapper */}
                <div 
                  className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 transition-all duration-200 ease-out
                    ${isDropdownOpen ? 'opacity-100 transform scale-100 translate-y-0 visible' : 'opacity-0 transform scale-95 -translate-y-2 invisible pointer-events-none'}`}
                >
                  {session.user?.role === "conductor" && (
                    <Link href="/staff/conductor" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f07639] transition-colors" onClick={() => setIsDropdownOpen(false)}>Panel de Conductor</Link>
                  )}
                  {session.user?.role === "operario" && (
                    <Link href="/staff/operario" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f07639] transition-colors" onClick={() => setIsDropdownOpen(false)}>Panel de Operario</Link>
                  )}
                  {(session.user?.role === "admin" || session.user?.role === "gerente") && (
                    <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f07639] transition-colors" onClick={() => setIsDropdownOpen(false)}>Panel Admin</Link>
                  )}
                  <Link href="/perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f07639] transition-colors" onClick={() => setIsDropdownOpen(false)}>Mi Perfil</Link>
                  {session.user?.role === "cliente" && (
                    <Link href="/perfil?tab=tickets" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f07639] transition-colors" onClick={() => setIsDropdownOpen(false)}>Mis Pasajes</Link>
                  )}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f07639] transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-[#f07639] font-medium text-sm transition-colors">
                  Iniciar Sesión
                </Link>
                <Link href="/registro" className="bg-[#f07639] hover:bg-[#d8662d] text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors">
                  Registro
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-[#f07639] bg-orange-50/50 hover:bg-orange-50 active:scale-95 transition-all"
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              aria-label="Menu principal"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg">
          <div className="px-4 pt-3 pb-4 space-y-1 sm:px-6">
            <Link
              href="/"
              className={`block px-3.5 py-2.5 rounded-xl text-base font-bold transition-all ${pathname === '/' ? 'text-[#f07639] bg-orange-50/50' : 'text-gray-700 hover:text-[#f07639] hover:bg-orange-50/20'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              href="/seguimiento"
              className={`block px-3.5 py-2.5 rounded-xl text-base font-bold transition-all ${pathname === '/seguimiento' ? 'text-[#f07639] bg-orange-50/50' : 'text-gray-700 hover:text-[#f07639] hover:bg-orange-50/20'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Revisar Encomienda
            </Link>
            <Link
              href="/quienes-somos"
              className={`block px-3.5 py-2.5 rounded-xl text-base font-bold transition-all ${pathname === '/quienes-somos' ? 'text-[#f07639] bg-orange-50/50' : 'text-gray-700 hover:text-[#f07639] hover:bg-orange-50/20'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ¿Quiénes Somos?
            </Link>
            <Link
              href="/ayuda"
              className={`block px-3.5 py-2.5 rounded-xl text-base font-bold transition-all ${pathname === '/ayuda' ? 'text-[#f07639] bg-orange-50/50' : 'text-gray-700 hover:text-[#f07639] hover:bg-orange-50/20'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Ayuda / FAQs
            </Link>
            <Link
              href="/compra"
              className={`block px-3.5 py-2.5 rounded-xl text-base font-bold transition-all ${pathname === '/compra' ? 'text-[#f07639] bg-orange-50/50' : 'text-gray-700 hover:text-[#f07639] hover:bg-orange-50/20'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Compra tu pasaje
            </Link>
          </div>
          <div className="pt-4 pb-4 border-t border-gray-100 px-4 sm:px-6">
            {session ? (
              <div className="space-y-4">
                <div className="flex items-center px-3.5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex-shrink-0 bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 text-[#f07639]">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="ml-3 overflow-hidden">
                    <div className="text-sm font-extrabold text-slate-800 truncate">{session.user?.name}</div>
                    <div className="text-xs font-semibold text-slate-450 truncate">{session.user?.email}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  {session.user?.role === "conductor" && (
                    <Link
                      href="/staff/conductor"
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-bold text-[#f07639] hover:bg-orange-50/50 transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                      <span>Panel de Conductor</span>
                    </Link>
                  )}
                  {session.user?.role === "operario" && (
                    <Link
                      href="/staff/operario"
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-bold text-[#f07639] hover:bg-orange-50/50 transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                      <span>Panel de Operario</span>
                    </Link>
                  )}
                  {session.user?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-bold text-blue-600 hover:bg-blue-50/50 transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                      <span>Panel Admin</span>
                    </Link>
                  )}
                  <Link
                    href="/perfil"
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-bold transition-all ${pathname === '/perfil' ? 'text-[#f07639] bg-orange-50/50' : 'text-gray-700 hover:text-[#f07639] hover:bg-orange-50/20'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span>Mi Perfil</span>
                  </Link>
                  {session.user?.role === "cliente" && (
                    <Link
                      href="/perfil?tab=tickets"
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-bold transition-all ${pathname.includes('/perfil') && pathname.includes('tab=tickets') ? 'text-[#f07639] bg-orange-50/50' : 'text-gray-700 hover:text-[#f07639] hover:bg-orange-50/20'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 flex-shrink-0" />
                      <span>Mis Pasajes</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-base font-bold text-red-500 hover:bg-red-50/50 transition-all"
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0 text-red-500" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  className="block text-center px-4 py-3 border border-gray-250 rounded-xl shadow-sm text-base font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/registro"
                  className="block text-center px-4 py-3 rounded-xl shadow-sm text-base font-bold text-white bg-[#f07639] hover:bg-[#d8662d] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Registro
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
