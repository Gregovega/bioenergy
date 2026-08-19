// =============================================================
// COMPONENTE: BilleteraDesglose.tsx
// PORTAL: Inversionista
// QUÉ HACE: Muestra el balance de billetera del inversionista,
// separando visualmente el dividendo normal del "Bono de
// Expansión del Ecosistema" (solo aplica a inversionistas con
// categoria_socio = 'fundador').
//
// CÓMO IDENTIFICAR SI ESTO REEMPLAZA ALGO QUE YA TIENES:
// Busca en tu proyecto el componente que muestra el balance /
// historial de billetera del inversionista (probablemente algo
// como BalanceCard.tsx, WalletSummary.tsx o dentro de
// dashboard/page.tsx del portal inversionista). Ese es el que
// hay que sustituir o fusionar con este.
//
// AJUSTA: la ruta del import de tu cliente Supabase según cómo
// lo tengas configurado en tu proyecto (createClientComponentClient,
// createServerComponentClient, etc.)
// =============================================================

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type MovimientoBilletera = {
  id: string;
  monto_usd: number;
  tipo: string;
  estado: string;
  fecha: string;
};

type Props = {
  inversionistaId: string;
};

const ETIQUETAS_TIPO: Record<string, { label: string; color: string }> = {
  credito_dividendo: { label: 'Dividendo', color: 'text-emerald-400' },
  credito_bono_expansion: { label: 'Bono de Expansión (Fundador)', color: 'text-amber-400' },
  credito_fondo_operativo: { label: 'Fondo Operativo', color: 'text-slate-400' },
  credito_margen_empresa: { label: 'Margen Empresa', color: 'text-slate-400' },
};

export default function BilleteraDesglose({ inversionistaId }: Props) {
  const [movimientos, setMovimientos] = useState<MovimientoBilletera[]>([]);
  const [cargando, setCargando] = useState(true);
  const [esFundador, setEsFundador] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);

      // 1) Verificar si el inversionista es 'fundador'
      const { data: inv } = await supabase
        .from('inversionista')
        .select('categoria_socio')
        .eq('id', inversionistaId)
        .single();

      setEsFundador(inv?.categoria_socio === 'fundador');

      // 2) Traer movimientos de billetera
      const { data: movs } = await supabase
        .from('billetera_movimiento')
        .select('id, monto_usd, tipo, estado, fecha')
        .eq('inversionista_id', inversionistaId)
        .order('fecha', { ascending: false })
        .limit(50);

      setMovimientos(movs ?? []);
      setCargando(false);
    }

    cargarDatos();
  }, [inversionistaId, supabase]);

  const totalDividendos = movimientos
    .filter((m) => m.tipo === 'credito_dividendo')
    .reduce((acc, m) => acc + Number(m.monto_usd), 0);

  const totalBono = movimientos
    .filter((m) => m.tipo === 'credito_bono_expansion')
    .reduce((acc, m) => acc + Number(m.monto_usd), 0);

  const totalGeneral = totalDividendos + totalBono;

  if (cargando) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-800 rounded mb-4" />
        <div className="h-8 w-48 bg-slate-800 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-slate-400">Balance total generado</h3>
        {esFundador && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
            Socio Fundador
          </span>
        )}
      </div>

      <p className="text-3xl font-semibold text-white mb-6">
        ${totalGeneral.toFixed(2)}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-slate-500 mb-1">Dividendos</p>
          <p className="text-lg font-medium text-emerald-400">${totalDividendos.toFixed(2)}</p>
        </div>
        {esFundador && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Bono de Expansión</p>
            <p className="text-lg font-medium text-amber-400">${totalBono.toFixed(2)}</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 pt-4">
        <h4 className="text-xs font-medium text-slate-500 mb-3">Movimientos recientes</h4>
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {movimientos.map((m) => {
            const meta = ETIQUETAS_TIPO[m.tipo] ?? { label: m.tipo, color: 'text-slate-300' };
            return (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className={meta.color}>{meta.label}</span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(m.fecha).toLocaleDateString('es-VE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <span className="font-medium text-white">
                  +${Number(m.monto_usd).toFixed(2)}
                </span>
              </li>
            );
          })}
          {movimientos.length === 0 && (
            <li className="text-sm text-slate-500">Aún no hay movimientos registrados.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
