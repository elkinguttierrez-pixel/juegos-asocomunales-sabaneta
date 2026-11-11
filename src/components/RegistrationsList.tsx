import React, { useState, useMemo } from 'react';
import { SportRegistration, JAC } from '../types';
import { OFFICIAL_SPORTS } from '../data/initialData';
import { 
  FileSpreadsheet, 
  Printer, 
  Trash2, 
  Search, 
  Building2, 
  Award,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

interface RegistrationsListProps {
  registrations: SportRegistration[];
  jacs: JAC[];
  onDeleteRegistration: (id: string) => void;
  onOpenPrintModal: (reg: SportRegistration) => void;
}

export const RegistrationsList: React.FC<RegistrationsListProps> = ({
  registrations,
  jacs,
  onDeleteRegistration,
  onOpenPrintModal
}) => {
  const [selectedSportFilter, setSelectedSportFilter] = useState('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [selectedJacFilter, setSelectedJacFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);

  const getJac = (jacId: string) => {
    return jacs.find(j => j.id === jacId);
  };

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      const matchSport = selectedSportFilter === 'all' || reg.sportId === selectedSportFilter;
      const matchBranch = selectedBranchFilter === 'all' || reg.branch === selectedBranchFilter;
      const matchJac = selectedJacFilter === 'all' || reg.jacId === selectedJacFilter;
      const matchSearch =
        reg.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.delegateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.sportName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.members.some(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || m.documentNumber.includes(searchTerm));

      return matchSport && matchBranch && matchJac && matchSearch;
    });
  }, [registrations, selectedSportFilter, selectedBranchFilter, selectedJacFilter, searchTerm]);

  // Export registrations to Excel
  const handleExportRegistrationsExcel = () => {
    const rows: any[] = [];
    filteredRegistrations.forEach(reg => {
      const jac = getJac(reg.jacId);
      reg.members.forEach((m, idx) => {
        rows.push({
          'ID Planilla': reg.id,
          'Deporte': reg.sportName,
          'Rama': reg.branch,
          'Modalidad': reg.modalityDetail || 'General',
          'JAC Sabaneta': jac?.name || 'JAC',
          'Nombre Equipo / Dupla': reg.teamName,
          'Delegado': reg.delegateName,
          'Teléfono Delegado': reg.delegatePhone,
          'Color Camiseta 1': reg.uniformPrimaryColor || 'N/A',
          'Color Camiseta 2': reg.uniformSecondaryColor || 'N/A',
          'Posición / Orden': idx + 1,
          'Dorsal': m.dorsal || 'N/A',
          'Talla Camiseta': m.talla || 'M',
          'Deportista': m.fullName,
          'Tipo Doc': m.documentType,
          'No. Documento': m.documentNumber,
          'Género': m.gender,
          'Rol / Posición': m.position || 'N/A',
          'EPS': m.eps,
          'Fecha Inscripción': reg.registeredAt
        });
      });
    });

    exportToExcel(rows, 'Planillas Juegos', `Planillas_Juegos_Asocomunales_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
              Control de Planillas Oficiales
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Planillas de Equipos y Deportistas por Deporte
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Listado de inscripciones oficiales aprobadas para los Juegos Asocomunales de Sabaneta. Imprime planillas de juego oficiales para las mesas técnicas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportRegistrationsExcel}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" /> Exportar a Excel
            </button>
          </div>
        </div>
      </div>

      {/* Quick Sport Selector Pills */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedSportFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              selectedSportFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos ({registrations.length})
          </button>
          {OFFICIAL_SPORTS.map(sport => {
            const count = registrations.filter(r => r.sportId === sport.id).length;
            const isSelected = selectedSportFilter === sport.id;

            return (
              <button
                key={sport.id}
                onClick={() => setSelectedSportFilter(sport.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{sport.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar equipo, delegado, deportista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <select
              value={selectedSportFilter}
              onChange={(e) => setSelectedSportFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Todos los Deportes ({OFFICIAL_SPORTS.length})</option>
              {OFFICIAL_SPORTS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Todas las Ramas</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>

          <div>
            <select
              value={selectedJacFilter}
              onChange={(e) => setSelectedJacFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Todas las JACs ({jacs.length})</option>
              {jacs.map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Registrations List Cards */}
      <div className="space-y-4">
        {filteredRegistrations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            No hay planillas registradas que coincidan con los filtros.
          </div>
        ) : (
          filteredRegistrations.map((reg) => {
            const jac = getJac(reg.jacId);
            const isExpanded = expandedRegId === reg.id;
            return (
              <div 
                key={reg.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden transition hover:border-slate-300"
              >
                {/* Header Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: jac?.color || '#059669' }}
                    >
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">
                          {reg.teamName || `${jac?.name} - ${reg.sportName}`}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {reg.sportName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          reg.branch === 'Masculino' ? 'bg-blue-100 text-blue-800' :
                          reg.branch === 'Femenino' ? 'bg-pink-100 text-pink-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {reg.branch}
                        </span>
                        {reg.modalityDetail && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            • {reg.modalityDetail}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {jac?.name} ({jac?.sector})
                        </span>
                        <span>Delegado: <strong className="text-slate-700">{reg.delegateName}</strong> ({reg.delegatePhone})</span>
                        <span>Deportistas: <strong className="text-emerald-700 font-bold">{reg.members.length}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => onOpenPrintModal(reg)}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                      title="Imprimir planilla reglamentaria"
                    >
                      <Printer className="w-3.5 h-3.5" /> Imprimir Planilla
                    </button>
                    <button
                      onClick={() => setExpandedRegId(isExpanded ? null : reg.id)}
                      className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      <span>{isExpanded ? 'Ocultar' : 'Ver Nómina'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onDeleteRegistration(reg.id)}
                      title="Eliminar planilla"
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Roster Members */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-200 bg-white">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>Nómina Oficial Registrada</span>
                      {reg.uniformPrimaryColor && (
                        <span className="text-[11px] font-normal text-slate-500">
                          Uniforme: Principal: <strong>{reg.uniformPrimaryColor}</strong> | Alterno: <strong>{reg.uniformSecondaryColor || 'N/A'}</strong>
                        </span>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="px-3 py-2 w-10 text-center">#</th>
                            {reg.members.some(m => m.dorsal) && (
                              <th className="px-2 py-2 w-16 text-center">Dorsal</th>
                            )}
                            <th className="px-3 py-2">Deportista</th>
                            <th className="px-3 py-2">Documento</th>
                            <th className="px-3 py-2">Género</th>
                            <th className="px-3 py-2">Posición / Rol</th>
                            <th className="px-3 py-2">EPS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reg.members.map((m, index) => (
                            <tr key={index} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2 text-center font-bold text-slate-400">{index + 1}</td>
                              {reg.members.some(mem => mem.dorsal) && (
                                <td className="px-2 py-2 text-center font-bold text-slate-800">
                                  {m.dorsal ? `#${m.dorsal}` : '-'}
                                </td>
                              )}
                              <td className="px-3 py-2 font-bold text-slate-800">{m.fullName}</td>
                              <td className="px-3 py-2 font-mono text-slate-600">
                                <span className="text-[10px] text-slate-400 mr-1">{m.documentType}</span>
                                {m.documentNumber}
                              </td>
                              <td className="px-3 py-2 font-medium">{m.gender}</td>
                              <td className="px-3 py-2 text-slate-600">{m.position || '-'}</td>
                              <td className="px-3 py-2 font-medium text-slate-700">{m.eps}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
