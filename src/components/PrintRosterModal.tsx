import React from 'react';
import { SportRegistration, JAC } from '../types';
import { Printer, X } from 'lucide-react';

interface PrintRosterModalProps {
  registration: SportRegistration | null;
  jacs: JAC[];
  onClose: () => void;
}

export const PrintRosterModal: React.FC<PrintRosterModalProps> = ({
  registration,
  jacs,
  onClose
}) => {
  if (!registration) return null;

  const jac = jacs.find(j => j.id === registration.jacId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 border border-slate-300">
        
        {/* Action bar (Hidden when printing) */}
        <div className="no-print px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Vista Previa de Planilla Oficial</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Planilla
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet (Standard A4 / Letter format) */}
        <div className="p-8 bg-white text-slate-900 font-sans print:p-0 print:m-0" id="official-roster-sheet">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
              República de Colombia • Municipio de Sabaneta
            </div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight my-1">
              JUEGOS ASOCOMUNALES SABANETA
            </h1>
            <div className="text-xs font-semibold text-slate-700">
              Asociación de Juntas de Acción Comunal (ASOCOMUNAL) & INDESA Sabaneta
            </div>
            <div className="inline-block mt-2 px-3 py-1 bg-slate-100 border border-slate-300 rounded font-black text-xs uppercase tracking-wide">
              Planilla Oficial de Inscripción y Control de Mesa
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs border border-slate-300 p-3 rounded-lg bg-slate-50/50 mb-4">
            <div>
              <span className="text-slate-500 font-medium">Deporte: </span>
              <strong className="text-slate-900 font-black">{registration.sportName}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Rama / Categoría: </span>
              <strong className="text-slate-900 font-bold">{registration.branch}</strong>
              {registration.modalityDetail && ` (${registration.modalityDetail})`}
            </div>
            <div>
              <span className="text-slate-500 font-medium">Junta de Acción Comunal: </span>
              <strong className="text-slate-900 font-bold">{jac?.name || 'JAC Sabaneta'}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Nombre de Equipo: </span>
              <strong className="text-slate-900 font-bold">{registration.teamName}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Delegado / DT: </span>
              <strong className="text-slate-900">{registration.delegateName}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Teléfono Delegado: </span>
              <strong className="text-slate-900 font-mono">{registration.delegatePhone}</strong>
            </div>
            {registration.uniformPrimaryColor && (
              <div className="col-span-2 pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Colores de Uniforme: </span>
                <span className="text-slate-800">
                  Principal: <strong>{registration.uniformPrimaryColor}</strong> | Alterno: <strong>{registration.uniformSecondaryColor || 'N/A'}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Athletes Table */}
          <table className="w-full text-left text-xs border border-slate-300 border-collapse mb-6">
            <thead>
              <tr className="bg-slate-200/80 text-slate-800 font-bold uppercase text-[10px]">
                <th className="border border-slate-300 px-2 py-1.5 w-8 text-center">#</th>
                <th className="border border-slate-300 px-2 py-1.5 w-12 text-center">Dorsal</th>
                <th className="border border-slate-300 px-3 py-1.5">Nombres y Apellidos del Deportista</th>
                <th className="border border-slate-300 px-2 py-1.5 w-14 text-center">Talla</th>
                <th className="border border-slate-300 px-3 py-1.5 w-28">No. Documento</th>
                <th className="border border-slate-300 px-2 py-1.5 w-16 text-center">Género</th>
                <th className="border border-slate-300 px-3 py-1.5 w-24">EPS</th>
                <th className="border border-slate-300 px-3 py-1.5 w-28 text-center">Firma Deportista</th>
              </tr>
            </thead>
            <tbody>
              {registration.members.map((member, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-900">
                    {member.dorsal || '-'}
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                    {member.fullName}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-emerald-700 bg-emerald-50/50">
                    {member.talla || '-'}
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 font-mono text-slate-700">
                    {member.documentType} {member.documentNumber}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center font-medium">
                    {member.gender.slice(0, 3)}
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-700">
                    {member.eps}
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legal statement */}
          <div className="text-[10px] text-slate-500 italic mb-8 leading-relaxed">
            Certifico bajo la gravedad de juramento que todos los deportistas relacionados en esta planilla residen en el barrio o vereda perteneciente a esta Junta de Acción Comunal, cumplen con las normas vigentes de afiliación a salud (EPS) y se encuentran en óptimas condiciones para participar en los Juegos Asocomunales de Sabaneta.
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 text-center text-xs pt-4">
            <div className="border-t border-slate-800 pt-1">
              <div className="font-bold text-slate-900">{registration.delegateName}</div>
              <div className="text-[10px] text-slate-500">Firma Delegado / DT JAC</div>
            </div>
            <div className="border-t border-slate-800 pt-1">
              <div className="font-bold text-slate-900">Mesa Técnica / Juez</div>
              <div className="text-[10px] text-slate-500">Juez de Mesa / Árbitro</div>
            </div>
            <div className="border-t border-slate-800 pt-1">
              <div className="font-bold text-slate-900">ASOCOMUNAL Sabaneta</div>
              <div className="text-[10px] text-slate-500">Comisión Técnica Municipal</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
