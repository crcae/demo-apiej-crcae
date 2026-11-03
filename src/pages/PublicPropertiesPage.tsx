import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InventoryView } from '../features/inventario/InventoryView.js';
import { mockListings } from '../mock/listings.mock.js';

/** Public catalog — no system chrome / no login required. */
export function PublicPropertiesPage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-50 text-white">
        <div className="border-b border-white/10 bg-[#0E1A3D]/95 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 md:px-6">
            <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2.5" title="Inicio">
              <img src="/apiej_logo.png" alt="APIEJ" className="h-9 w-auto object-contain brightness-0 invert" />
              <span className="hidden border-l border-white/25 pl-2.5 text-[10px] font-bold uppercase tracking-wider text-white/65 sm:block">
                Propiedades públicas
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-xl px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Landing
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 rounded-xl bg-[#4A6CFF] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#3b5aef]"
              >
                Iniciar sesión ↗
              </button>
            </div>
          </div>
        </div>
        <div className="flex h-[3px] w-full" aria-hidden="true">
          <span className="flex-1 bg-[#FF7A00]" />
          <span className="flex-1 bg-[#10B981]" />
          <span className="flex-1 bg-[#4A6CFF]" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 md:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#4A6CFF]/20 bg-[#4A6CFF]/5 px-4 py-2.5 text-xs font-semibold text-[#0E1A3D]">
          <Building2 size={14} className="text-[#4A6CFF]" />
          Estás en el catálogo público · solo lectura · sin cuenta
        </div>
        <InventoryView listings={mockListings} mode="public" />
      </div>
    </div>
  );
}
