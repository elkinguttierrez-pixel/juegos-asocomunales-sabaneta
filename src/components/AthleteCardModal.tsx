import React from 'react';
import { Athlete, JAC } from '../types';
import { Printer, X, ShieldCheck, QrCode } from 'lucide-react';

interface AthleteCardModalProps {
  athlete: Athlete | null;
  jacs: JAC[];
  onClose: () => void;
}

export const AthleteCardModal: React.FC<AthleteCardModalProps> = ({
  athlete,
  jacs,
  onClose
}) => {
  if (!athlete) return null;

  const jac = jacs.find(j => j.id === athlete.jacId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-300">
        
        {/* Actions (hidden in print) */}
        <div className="no-print px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
          <span className="font-bold text-xs">Carnet Oficial de Acreditación</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carnet Badge Card */}
        <div className="p-5 flex justify-center bg-slate-100">
          <div className="w-80 bg-white rounded-2xl shadow-lg border border-slate-300 overflow-hidden text-slate-800">
            {/* Top header with Sabaneta Green and Gold */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-3.5 text-center relative">
              <div className="text-[9px] font-black tracking-widest text-amber-400 uppercase">
                Alcaldía de Sabaneta • ASOCOMUNAL
              </div>
              <h2 className="text-sm font-black uppercase tracking-tight mt-0.5">
                Juegos Asocomunales 2026
              </h2>
              <div className="text-[10px] text-emerald-200">
                Acreditación Oficial de Deportista
              </div>
            </div>

            {/* Photo & Info */}
            <div className="p-4 flex flex-col items-center text-center">
              {/* Avatar placeholder with Initials */}
              <div 
                className="w-20 h-20 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-black mb-3"
                style={{ backgroundColor: jac?.color || '#059669' }}
              >
                {athlete.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>

              <h3 className="font-black text-slate-900 text-base leading-tight">
                {athlete.fullName}
              </h3>

              <div className="font-mono text-xs font-bold text-slate-600 mt-1">
                {athlete.documentType}: {athlete.documentNumber}
              </div>

              {/* JAC Badge */}
              <div className="mt-2.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {jac?.name || 'JAC Sabaneta'}
              </div>

              <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-left text-[11px]">
                <div>
                  <span className="text-slate-400 block">EPS:</span>
                  <strong className="text-slate-700">{athlete.eps}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Talla Uniforme:</span>
                  <strong className="text-emerald-700 font-bold">{athlete.talla || 'M'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Género / Edad:</span>
                  <strong className="text-slate-700">{athlete.gender} ({athlete.age}a)</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Emergencia:</span>
                  <strong className="text-slate-700">{athlete.emergencyContactName} ({athlete.emergencyContactPhone})</strong>
                </div>
              </div>

              {/* QR and Security code */}
              <div className="mt-4 pt-3 border-t border-slate-200 w-full flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Código de Control</span>
                  <span className="font-mono text-[10px] font-bold text-emerald-700">
                    SAB-{athlete.documentNumber.slice(-4)}-{jac?.id.slice(-3).toUpperCase()}
                  </span>
                  <div className="text-[8px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" /> Afiliación Verificada
                  </div>
                </div>
                <div className="p-1 bg-slate-50 border border-slate-200 rounded">
                  <QrCode className="w-9 h-9 text-slate-800" />
                </div>
              </div>

            </div>

            {/* Bottom Color Stripe */}
            <div className="h-2 w-full bg-gradient-to-r from-emerald-600 via-amber-400 to-teal-700" />
          </div>
        </div>

      </div>
    </div>
  );
};
