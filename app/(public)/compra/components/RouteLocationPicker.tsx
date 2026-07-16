"use client";

import { useEffect, useRef, useState } from "react";
import { BusFront, Check, ChevronDown, MapPin } from "lucide-react";

type LocationOption = {
  id: string | number;
  nombre: string;
};

type RouteLocationPickerProps = {
  id: string;
  label: string;
  helper: string;
  placeholder: string;
  locations: LocationOption[];
  value: string;
  onChange: (value: string) => void;
};

const TERMINAL_META: Record<string, { code: string; region: string; descriptor: string }> = {
  cajamarca: { code: "CJA", region: "Sierra norte", descriptor: "Terminal principal" },
  chiclayo: { code: "CIX", region: "Lambayeque", descriptor: "Terminal costera" },
  jaen: { code: "JAE", region: "Cajamarca norte", descriptor: "Terminal nororiental" },
  trujillo: { code: "TRU", region: "La Libertad", descriptor: "Terminal costera" },
};

function getTerminalMeta(name: string) {
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return TERMINAL_META[normalizedName] || {
    code: normalizedName.slice(0, 3).toUpperCase(),
    region: "Red El Cumbe",
    descriptor: "Terminal terrestre",
  };
}

export default function RouteLocationPicker({
  id,
  label,
  helper,
  placeholder,
  locations,
  value,
  onChange,
}: RouteLocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLocation = locations.find((location) => location.id.toString() === value);
  const selectedMeta = selectedLocation ? getTerminalMeta(selectedLocation.nombre) : null;

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative min-w-0">
      <span className="mb-2 block text-[11px] font-extrabold uppercase text-[var(--muted)]">
        {label}
      </span>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-options`}
        onClick={() => setIsOpen((open) => !open)}
        className={`group grid min-h-16 w-full grid-cols-[60px_minmax(0,1fr)_auto] items-stretch overflow-hidden rounded-lg border bg-[var(--input-bg)] text-left transition-all duration-200 hover:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
          isOpen ? "border-[var(--primary)] shadow-[0_0_0_3px_rgba(240,113,56,0.12)]" : "border-[var(--input-border)]"
        }`}
      >
        <span className="flex flex-col items-center justify-center border-r border-dashed border-[var(--input-border)] bg-[var(--surface-secondary)] px-2 text-[var(--primary-text)] transition-colors group-hover:bg-[var(--primary-soft)]">
          {selectedMeta ? (
            <>
              <span className="font-mono text-sm font-black leading-none">{selectedMeta.code}</span>
              <span className="mt-0.5 text-[8px] font-bold uppercase text-[var(--muted)]">Terminal</span>
            </>
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </span>
        <span className="flex min-w-0 flex-col justify-center px-4 py-1.5">
          <span className={`block truncate text-base font-black ${selectedLocation ? "text-[var(--foreground)]" : "text-[var(--input-placeholder)]"}`}>
            {selectedLocation?.nombre || placeholder}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--muted)]">
            {selectedMeta ? `${helper} · ${selectedMeta.region}` : "Selecciona una terminal de la red"}
          </span>
        </span>
        <span className="flex items-center border-l border-[var(--card-border)] px-3">
          <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 ${isOpen ? "rotate-180 text-[var(--primary-text)]" : ""}`} />
        </span>
      </button>

      {isOpen && (
        <div
          id={`${id}-options`}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-lg border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] shadow-[var(--shadow-md)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <BusFront className="h-4 w-4 text-[var(--primary-text)]" />
              <p className="text-[10px] font-extrabold uppercase text-[var(--foreground)]">Red de terminales El Cumbe</p>
            </div>
            <span className="text-[10px] font-bold text-[var(--muted)]">{locations.length} destinos</span>
          </div>
          <div className="px-2 py-2">
          {locations.map((location) => {
            const optionValue = location.id.toString();
            const isSelected = optionValue === value;

            return (
              <button
                key={location.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(optionValue);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--primary-soft)] text-[var(--primary-text)] font-bold"
                    : "text-[var(--foreground)] hover:bg-[var(--surface-secondary)]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-[var(--primary)]" : "text-[var(--muted)]"}`} />
                  <span className="truncate text-sm font-bold">{location.nombre}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />}
              </button>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
