// =============================================================
// COMPONENTE: AdminCategoriaSocio.tsx
// PORTAL: Mothership (staff/admin)
// QUÉ HACE:
//  1) Lista los inversionistas y permite marcar/cambiar su
//     categoria_socio ('fundador' | 'fase_2' | 'regular').
//  2) Incluye un mini-formulario para, dentro de una asignación
//     específica, definir el monto_bono_fundadores_usd.
//
// CÓMO IDENTIFICAR SI ESTO REEMPLAZA ALGO QUE YA TIENES:
// Busca en el Mothership la pantalla de gestión de inversionistas
// (lista/tabla de inversionistas, probablemente algo como
// InversionistasTable.tsx o admin/inversionistas/page.tsx) y la
// pantalla donde se configuran las asignaciones de cada equipo
// (AsignacionForm.tsx o similar). Este archivo cubre AMBAS piezas
// en un solo componente de ejemplo — puedes partirlo en dos si tu
// estructura ya está separada así.
//
// AJUSTA: la ruta del import de Supabase según tu proyecto.
// =============================================================

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Inversionista = {
  id: string;
  nombre: string;
  email: string;
  categoria_socio: 'fundador' | 'fase_2' | 'regular';
};

const OPCIONES_CATEGORIA: Array<{ value: Inversionista['categoria_socio']; label: string }> = [
  { value: 'fundador', label: 'Fundador' },
  { value: 'fase_2', label: 'Fase 2' },
  { value: 'regular', label: 'Regular' },
];

export function ListaInversionistasCategoria() {
  const [inversionistas, setInversionistas] = useState<Inversionista[]>([]);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('inversionista')
        .select('id, nombre, email, categoria_socio')
        .order('nombre', { ascending: true });
      setInversionistas(data ?? []);
    }
    cargar();
  }, [supabase]);

  async function actualizarCategoria(id: string, nuevaCategoria: Inversionista['categoria_socio']) {
    setGuardandoId(id);
    const { error } = await supabase
      .from('inversionista')
      .update({ categoria_socio: nuevaCategoria })
      .eq('id', id);

    if (!error) {
      setInversionistas((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, categoria_socio: nuevaCategoria } : inv))
      );
    } else {
      alert('No se pudo actualizar la categoría: ' + error.message);
    }
    setGuardandoId(null);
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h3 className="text-sm font-medium text-slate-300">Categoría de socio por inversionista</h3>
        <p className="text-xs text-slate-500 mt-1">
          Los inversionistas marcados como &quot;Fundador&quot; reciben el Bono de Expansión del Ecosistema
          cuando una asignación lo tenga configurado.
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
            <th className="px-6 py-3 font-normal">Nombre</th>
            <th className="px-6 py-3 font-normal">Email</th>
            <th className="px-6 py-3 font-normal">Categoría</th>
          </tr>
        </thead>
        <tbody>
          {inversionistas.map((inv) => (
            <tr key={inv.id} className="border-b border-slate-800/60 last:border-0">
              <td className="px-6 py-3 text-white">{inv.nombre}</td>
              <td className="px-6 py-3 text-slate-400">{inv.email}</td>
              <td className="px-6 py-3">
                <select
                  value={inv.categoria_socio}
                  disabled={guardandoId === inv.id}
                  onChange={(e) =>
                    actualizarCategoria(inv.id, e.target.value as Inversionista['categoria_socio'])
                  }
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  {OPCIONES_CATEGORIA.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {inversionistas.length === 0 && (
            <tr>
              <td colSpan={3} className="px-6 py-6 text-center text-slate-500">
                No hay inversionistas registrados todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// -------------------------------------------------------------
// Sub-componente: campo de bono dentro del formulario de asignación
// Insértalo donde ya tengas los campos mensualidad_usd,
// monto_pool_inversionistas_usd, monto_fondo_operativo_usd, etc.
// -------------------------------------------------------------
type CampoBonoProps = {
  montoBono: number;
  onChange: (valor: number) => void;
  mensualidad: number;
  sumaOtrosMontos: number; // pool + fondo operativo + margen empresa
};

export function CampoBonoFundadores({
  montoBono,
  onChange,
  mensualidad,
  sumaOtrosMontos,
}: CampoBonoProps) {
  const disponible = mensualidad - sumaOtrosMontos;
  const excedeLimite = montoBono > disponible;

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">
        Bono de Expansión del Ecosistema (USD/mes)
      </label>
      <input
        type="number"
        step="0.01"
        min={0}
        value={montoBono}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
      />
      <p className={`text-[11px] mt-1 ${excedeLimite ? 'text-red-400' : 'text-slate-500'}`}>
        {excedeLimite
          ? `Excede el monto disponible ($${disponible.toFixed(2)}). La base de datos rechazará este valor.`
          : `Disponible sin superar la mensualidad: $${disponible.toFixed(2)}`}
      </p>
    </div>
  );
}
