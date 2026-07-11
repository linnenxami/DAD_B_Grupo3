import { Target, Lightbulb, MapPin, Phone } from "lucide-react";
import Image from "next/image";

export default function QuienesSomos() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent relative overflow-hidden">
      {/* Círculos decorativos de fondo con desenfoque (Glow Effect) */}
      <div className="absolute top-[40%] -left-36 w-[400px] h-[400px] bg-orange-200/20 rounded-full filter blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] -right-36 w-[400px] h-[400px] bg-amber-100/20 rounded-full filter blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* SECCIÓN A: CABECERA (Hero con degradado y rejilla sutil) */}
        <section className="w-full bg-gradient-to-tr from-[#f07639] via-[#e66c2f] to-[#c8561d] py-16 md:py-24 relative overflow-hidden">
          {/* Luces difuminadas internas en el Hero */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/10 rounded-full filter blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-black/10 rounded-full filter blur-3xl pointer-events-none"></div>
          
          {/* Imagen de fondo oficial de El Cumbe en el banner */}
          <div 
            className="absolute inset-0 opacity-[0.25] pointer-events-none" 
            style={{
              backgroundImage: "url('/imagen-centro-ayuda.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }} 
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
              ¿Quiénes Somos?
            </h1>
            <p className="mt-4 text-orange-50/90 text-base md:text-lg max-w-xl mx-auto font-semibold leading-relaxed">
              Conoce más sobre nuestra historia, propósito y a dónde queremos llegar junto a ti.
            </p>
          </div>
        </section>

        {/* SECCIÓN B: MISIÓN Y VISIÓN */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Tarjeta Misión */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100/80 p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/20 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#f07639] flex items-center justify-center mb-6">
                <Target size={36} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestra Misión</h2>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed flex-1">
                Brindar un servicio de transporte interprovincial seguro, puntual y de calidad, conectando a las familias peruanas.
              </p>
            </div>

            {/* Tarjeta Visión */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100/80 p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/20 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#f07639] flex items-center justify-center mb-6">
                <Lightbulb size={36} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestra Visión</h2>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed flex-1">
                Ser la empresa líder en transporte terrestre en el norte del país, reconocida por nuestra innovación y compromiso con el cliente.
              </p>
            </div>
          </div>
        </section>

        {/* SECCIÓN C: SUCURSALES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-16 w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Nuestras <span className="text-[#f07639]">Sucursales</span>
            </h2>
            <div className="h-1.5 w-20 bg-[#f07639] rounded-full mt-4 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sucursal Chiclayo */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/30 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between">
              <div className="relative w-full h-48 overflow-hidden">
                <Image 
                  src="/chiclayo.webp" 
                  alt="Sucursal Chiclayo" 
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 bg-white relative z-10 border-t border-gray-50 flex flex-col gap-3 text-left">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#f07639] transition-colors border-b border-gray-50 pb-2">Chiclayo</h3>
                <div className="flex items-start gap-2 text-xs text-gray-500 leading-snug">
                  <MapPin className="w-3.5 h-3.5 text-[#f07639] flex-shrink-0 mt-0.5" />
                  <span>Av. José Quiñones 425</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="w-3.5 h-3.5 text-[#f07639] flex-shrink-0" />
                  <span>(074) 231 454 / 964 435 513</span>
                </div>
              </div>
            </div>

            {/* Sucursal Jaén */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/30 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between">
              <div className="relative w-full h-48 overflow-hidden">
                <Image 
                  src="/jaen.webp" 
                  alt="Sucursal Jaén" 
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 bg-white relative z-10 border-t border-gray-50 flex flex-col gap-3 text-left">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#f07639] transition-colors border-b border-gray-50 pb-2">Jaén</h3>
                <div className="flex items-start gap-2 text-xs text-gray-500 leading-snug">
                  <MapPin className="w-3.5 h-3.5 text-[#f07639] flex-shrink-0 mt-0.5" />
                  <span>Av. Mesones Muro Esquina con la Marina – TETSUR</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="w-3.5 h-3.5 text-[#f07639] flex-shrink-0" />
                  <span>(083) 312 789</span>
                </div>
              </div>
            </div>

            {/* Sucursal Cajamarca */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/30 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between">
              <div className="relative w-full h-48 overflow-hidden">
                <Image 
                  src="/cajamarca.webp" 
                  alt="Sucursal Cajamarca" 
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 bg-white relative z-10 border-t border-gray-50 flex flex-col gap-3 text-left">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#f07639] transition-colors border-b border-gray-50 pb-2">Cajamarca</h3>
                <div className="flex items-start gap-2 text-xs text-gray-500 leading-snug">
                  <MapPin className="w-3.5 h-3.5 text-[#f07639] flex-shrink-0 mt-0.5" />
                  <span>Av. San Martín de Porres 140</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="w-3.5 h-3.5 text-[#f07639] flex-shrink-0" />
                  <span>(084) 234 567</span>
                </div>
              </div>
            </div>

            {/* Sucursal Trujillo */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-200/30 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between">
              <div className="relative w-full h-48 overflow-hidden">
                <Image 
                  src="/trujillo.webp" 
                  alt="Sucursal Trujillo" 
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 bg-white relative z-10 border-t border-gray-50 flex flex-col gap-3 text-left">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#f07639] transition-colors border-b border-gray-50 pb-2">Trujillo</h3>
                <div className="flex items-start gap-2 text-xs text-gray-500 leading-snug">
                  <MapPin className="w-3.5 h-3.5 text-[#f07639] flex-shrink-0 mt-0.5" />
                  <span>Av. Nicolás de Piérola 1300 (A una cuadra del Óvalo Mochica)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="w-3.5 h-3.5 text-[#f07639] flex-shrink-0" />
                  <span>(044) 123 456</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
