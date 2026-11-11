import React, { useState, useMemo } from 'react';
import { MatchSchedule, JAC, SportRegistration, SportBranch } from '../types';
import { OFFICIAL_SPORTS } from '../data/initialData';
import { 
  Building2, 
  Flame, 
  Clock, 
  MapPin, 
  Search, 
  Printer, 
  Download, 
  Award, 
  Calendar, 
  X,
  Radio,
  Users
} from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

interface JACActiveSportsProps {
  matches: MatchSchedule[];
  jacs: JAC[];
  registrations: SportRegistration[];
}

const BULLETIN_DATE_STR = new Date().toISOString().slice(0, 10);

export const JACActiveSports: React.FC<JACActiveSportsProps> = ({
  matches,
  jacs,
  registrations
}) => {
  const [selectedJacId, setSelectedJacId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'En Vivo' | 'Pendiente'>('all');
  const [branchFilter, setBranchFilter] = useState<'all' | SportBranch>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getJac = (id: string) => jacs.find(j => j.id === id);
  const getSport = (id: string) => OFFICIAL_SPORTS.find(s => s.id === id);
  const getSportName = (id: string) => getSport(id)?.name || id;

  // Format date nicely to Spanish
  const formatFriendlyDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  // Only matches that are NOT finalized (En Vivo or Pendiente)
  const activeMatches = useMemo(() => {
    return matches.filter(m => m.status === 'En Vivo' || m.status === 'Pendiente');
  }, [matches]);

  // Compute activity per JAC (how many live, how many pending)
  const jacActivitySummary = useMemo(() => {
    const map: Record<string, { live: number; pending: number; total: number }> = {};
    jacs.forEach(jac => {
      map[jac.id] = { live: 0, pending: 0, total: 0 };
    });

    activeMatches.forEach(m => {
      if (map[m.teamA.jacId]) {
        if (m.status === 'En Vivo') map[m.teamA.jacId].live += 1;
        if (m.status === 'Pendiente') map[m.teamA.jacId].pending += 1;
        map[m.teamA.jacId].total += 1;
      }
      if (map[m.teamB.jacId]) {
        if (m.status === 'En Vivo') map[m.teamB.jacId].live += 1;
        if (m.status === 'Pendiente') map[m.teamB.jacId].pending += 1;
        map[m.teamB.jacId].total += 1;
      }
    });

    return map;
  }, [activeMatches, jacs]);

  // Filtered JAC list for selector bar
  const filteredJacsForSelector = useMemo(() => {
    if (!searchTerm.trim()) return jacs;
    const term = searchTerm.toLowerCase();
    return jacs.filter(j => j.name.toLowerCase().includes(term) || j.sector.toLowerCase().includes(term));
  }, [jacs, searchTerm]);

  // Matches filtered by selected JAC and subfilters
  const filteredMatches = useMemo(() => {
    return activeMatches.filter(m => {
      // JAC filter: must involve selected JAC if not 'all'
      const matchJac = selectedJacId === 'all' || 
        m.teamA.jacId === selectedJacId || 
        m.teamB.jacId === selectedJacId;

      // Status filter
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;

      // Branch filter
      const matchBranch = branchFilter === 'all' || m.branch === branchFilter;

      // Search term
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        m.teamA.name.toLowerCase().includes(term) ||
        m.teamB.name.toLowerCase().includes(term) ||
        m.venue.toLowerCase().includes(term) ||
        getSportName(m.sportId).toLowerCase().includes(term) ||
        m.round.toLowerCase().includes(term);

      return matchJac && matchStatus && matchBranch && matchSearch;
    }).sort((a, b) => {
      // Prioritize 'En Vivo' first, then sort by date and time
      if (a.status === 'En Vivo' && b.status !== 'En Vivo') return -1;
      if (b.status === 'En Vivo' && a.status !== 'En Vivo') return 1;

      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [activeMatches, selectedJacId, statusFilter, branchFilter, searchTerm]);

  // Overall active counters
  const totalLive = useMemo(() => activeMatches.filter(m => m.status === 'En Vivo').length, [activeMatches]);
  const totalPending = useMemo(() => activeMatches.filter(m => m.status === 'Pendiente').length, [activeMatches]);

  // Sports inscribed for the selected JAC (if one is selected)
  const selectedJacInscribedSports = useMemo(() => {
    if (selectedJacId === 'all') return [];
    return registrations.filter(r => r.jacId === selectedJacId);
  }, [selectedJacId, registrations]);

  const selectedJac = useMemo(() => {
    if (selectedJacId === 'all') return null;
    return jacs.find(j => j.id === selectedJacId) || null;
  }, [selectedJacId, jacs]);

  // Export to Excel
  const handleExportExcel = () => {
    const rows = filteredMatches.map(m => {
      return {
        'JAC A': m.teamA.name,
        'JAC B': m.teamB.name,
        'Deporte': getSportName(m.sportId),
        'Rama': m.branch,
        'Ronda': m.round,
        'Estado': m.status === 'En Vivo' ? 'EN VIVO (JUGANDO)' : 'PENDIENTE (POR DISPUTAR)',
        'Marcador Actual': m.status === 'En Vivo' ? `${m.teamA.score ?? 0} - ${m.teamB.score ?? 0}` : 'Por Definir',
        'Fecha': m.date,
        'Hora': m.time,
        'Lugar / Escenario': m.venue
      };
    });

    const jacNameTitle = selectedJac ? selectedJac.name.replace(/\s+/g, '_') : 'Todas_JACs';
    exportToExcel(
      rows,
      'Partidos Activos JAC',
      `Competencias_Activas_${jacNameTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Printable Header */}
      <div className="hidden print:block mb-4 border-b-2 border-slate-900 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
              ALCALDÍA DE SABANETA • INDESA • ASOCOMUNAL
            </div>
            <h1 className="text-xl font-black uppercase text-slate-950 tracking-tight leading-none mt-0.5">
              JUEGOS ASOCOMUNALES DE SABANETA 2026
            </h1>
            <h2 className="text-xs font-bold text-slate-700 mt-1">
              Programación de Competencias Activas (En Vivo y Pendientes) por Junta de Acción Comunal
            </h2>
            {selectedJac && (
              <div className="text-xs font-black text-emerald-800 mt-1">
                Junta Consultada: {selectedJac.name} ({selectedJac.sector})
              </div>
            )}
          </div>
          <div className="text-right text-[10px] text-slate-600">
            <div className="font-bold">Boletín Oficial de Competencias Activas</div>
            <div>Fecha: {BULLETIN_DATE_STR}</div>
          </div>
        </div>
      </div>

      {/* TOP BANNER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                Seguimiento en Vivo & Calendario de Partidos
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                Solo Pendientes y En Disputa
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Deportes por JAC: En Vivo & Pendientes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Selecciona tu <strong className="text-slate-800">Junta de Acción Comunal</strong> para consultar al instante qué deportes están <strong className="text-red-600">jugando ahora mismo en vivo</strong> o qué partidos tienen <strong className="text-amber-700">programados para los próximos días</strong> con su respectivo escenario y horario.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir Agenda</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-red-50/80 rounded-xl p-3 border border-red-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider">Jugando Ahora (En Vivo)</div>
              <div className="text-xl font-black text-red-950">{totalLive} encuentros</div>
            </div>
          </div>

          <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Por Jugar (Pendientes)</div>
              <div className="text-xl font-black text-amber-950">{totalPending} encuentros</div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">JACs Participantes</div>
              <div className="text-xl font-black text-slate-900">{jacs.length} juntas</div>
            </div>
          </div>
        </div>
      </div>

      {/* JAC SELECTOR CAROUSEL / STRIP */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Selecciona una Junta de Acción Comunal:
          </span>
          <span className="text-xs text-slate-400">
            Haz clic en cualquier JAC para filtrar sus partidos activos
          </span>
        </div>

        {/* JAC Horizontal Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {/* Option: All JACs */}
          <button
            onClick={() => setSelectedJacId('all')}
            className={`flex-shrink-0 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-2 ${
              selectedJacId === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Todas las JACs</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              selectedJacId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {activeMatches.length}
            </span>
          </button>

          {/* Individual JACs */}
          {filteredJacsForSelector.map(jac => {
            const isSelected = selectedJacId === jac.id;
            const act = jacActivitySummary[jac.id] || { live: 0, pending: 0, total: 0 };

            return (
              <button
                key={jac.id}
                onClick={() => setSelectedJacId(jac.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: jac.color || '#059669' }}
                />
                <span className="truncate max-w-[130px]">{jac.name}</span>

                {/* Badges for active status */}
                {act.live > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
                    🔴 {act.live}
                  </span>
                ) : act.pending > 0 ? (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                  }`}>
                    ⏳ {act.pending}
                  </span>
                ) : (
                  <span className={`text-[10px] font-medium opacity-60 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    0
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-3 no-print">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por deporte, escenario, rival o JAC..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Switch (Live / Pending / All active) */}
          <div className="md:col-span-4 flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos los Activos ({activeMatches.length})
            </button>
            <button
              onClick={() => setStatusFilter('En Vivo')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer flex items-center justify-center gap-1 ${
                statusFilter === 'En Vivo' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3 h-3" /> En Vivo ({totalLive})
            </button>
            <button
              onClick={() => setStatusFilter('Pendiente')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                statusFilter === 'Pendiente' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes ({totalPending})
            </button>
          </div>

          {/* Branch filter */}
          <div className="md:col-span-3">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todas las Ramas</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>
        </div>

        {/* Selected JAC Banner if a specific JAC is chosen */}
        {selectedJac && (
          <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs"
                style={{ backgroundColor: selectedJac.color || '#059669' }}
              >
                {selectedJac.name.slice(4, 7).toUpperCase()}
              </span>
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  {selectedJac.name}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Sector {selectedJac.sector}
                  </span>
                </h3>
                <span className="text-xs text-slate-500">
                  Presidente: {selectedJac.president} • Tel: {selectedJac.phone}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedJacId('all')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer self-start sm:self-auto"
            >
              Ver todas las JACs
            </button>
          </div>
        )}
      </div>

      {/* MATCHES LIST / SCHEDULE CARDS */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            No hay partidos pendientes ni en vivo para {selectedJac ? selectedJac.name : 'los filtros seleccionados'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {selectedJac 
              ? 'Todos los partidos programados para esta JAC ya han finalizado o están a la espera de ser calendarizados en la siguiente fase.'
              : 'Prueba cambiando el estado o seleccionando otra Junta de Acción Comunal.'}
          </p>
          <button
            onClick={() => {
              setSelectedJacId('all');
              setStatusFilter('all');
              setBranchFilter('all');
              setSearchTerm('');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            Ver todos los encuentros activos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map(m => {
            const jacA = getJac(m.teamA.jacId);
            const jacB = getJac(m.teamB.jacId);
            const isLive = m.status === 'En Vivo';
            const sport = getSport(m.sportId);

            // Highlight if one of the teams matches the specifically selected JAC
            const isJacASelected = selectedJacId !== 'all' && m.teamA.jacId === selectedJacId;
            const isJacBSelected = selectedJacId !== 'all' && m.teamB.jacId === selectedJacId;

            return (
              <div
                key={m.id}
                className={`bg-white rounded-2xl border shadow-sm transition overflow-hidden flex flex-col justify-between ${
                  isLive 
                    ? 'border-red-300 ring-2 ring-red-500/10 hover:shadow-md' 
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* 1. Header: Sport, Branch, Round and LIVE/PENDING badge */}
                <div className={`p-4 border-b ${isLive ? 'bg-red-50/50 border-red-100' : 'bg-slate-50/70 border-slate-100'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        isLive ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isLive ? <Flame className="w-4 h-4 animate-pulse" /> : <Award className="w-4 h-4 text-emerald-700" />}
                      </div>
                      <div className="truncate">
                        <span className="font-black text-xs text-slate-900 uppercase tracking-tight">
                          {sport?.name || m.sportId}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className={`font-bold px-1.5 py-0.2 rounded ${
                            m.branch === 'Masculino' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            m.branch === 'Femenino' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                            'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {m.branch}
                          </span>
                          <span>•</span>
                          <span className="truncate">{m.round}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 tracking-wide uppercase ${
                      isLive 
                        ? 'bg-red-600 text-white shadow-sm animate-pulse flex items-center gap-1' 
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      {isLive && <Flame className="w-3 h-3" />}
                      {isLive ? 'Jugando Ahora' : 'Pendiente / Próximo'}
                    </span>
                  </div>
                </div>

                {/* 2. Venue and Time Box */}
                <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {/* Venue */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="p-1 bg-emerald-100 text-emerald-800 rounded shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    </span>
                    <div className="truncate">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Lugar / Sede:</span>
                      <strong className="text-slate-800 text-xs font-bold truncate block">
                        {m.venue}
                      </strong>
                    </div>
                  </div>

                  {/* Time and Date */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="p-1 bg-amber-100 text-amber-800 rounded shrink-0">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Fecha y Hora:</span>
                      <strong className="text-slate-800 text-xs font-bold block">
                        {formatFriendlyDate(m.date)} • {m.time}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Match Competitors / Opponents */}
                <div className="p-5 flex-1 flex flex-col justify-center">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    
                    {/* Team A */}
                    <div className="col-span-5 text-center flex flex-col items-center">
                      <div 
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xs mb-2 shadow-sm ${
                          isJacASelected ? 'ring-3 ring-emerald-500 scale-105' : 'ring-2 ring-white'
                        }`}
                        style={{ backgroundColor: jacA?.color || '#059669' }}
                      >
                        {jacA?.name.slice(4, 7).toUpperCase() || 'JAC'}
                      </div>
                      <h4 className={`font-bold text-xs sm:text-sm leading-tight line-clamp-2 ${
                        isJacASelected ? 'text-emerald-800 font-black' : 'text-slate-900'
                      }`}>
                        {m.teamA.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {jacA?.sector || 'Sabaneta'}
                      </span>
                      {isJacASelected && (
                        <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-1 border border-emerald-200">
                          Tu JAC
                        </span>
                      )}
                    </div>

                    {/* Live score or VS */}
                    <div className="col-span-2 text-center flex flex-col items-center justify-center">
                      {isLive ? (
                        <div className="bg-red-600 text-white rounded-xl px-2.5 py-1.5 shadow-sm min-w-[56px] animate-pulse">
                          <div className="flex items-center justify-center gap-1.5 text-base sm:text-lg font-black tracking-tight">
                            <span>{m.teamA.score !== undefined ? m.teamA.score : '0'}</span>
                            <span className="text-red-200 text-xs">:</span>
                            <span>{m.teamB.score !== undefined ? m.teamB.score : '0'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-100 text-slate-700 rounded-xl px-2.5 py-1.5 border border-slate-200 min-w-[56px]">
                          <span className="text-xs font-black uppercase tracking-wider">VS</span>
                        </div>
                      )}
                      <span className={`text-[9px] font-black uppercase tracking-wider mt-1 ${
                        isLive ? 'text-red-600 animate-pulse' : 'text-slate-400'
                      }`}>
                        {isLive ? 'En Juego' : 'Próximamente'}
                      </span>
                    </div>

                    {/* Team B */}
                    <div className="col-span-5 text-center flex flex-col items-center">
                      <div 
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xs mb-2 shadow-sm ${
                          isJacBSelected ? 'ring-3 ring-emerald-500 scale-105' : 'ring-2 ring-white'
                        }`}
                        style={{ backgroundColor: jacB?.color || '#3b82f6' }}
                      >
                        {jacB?.name.slice(4, 7).toUpperCase() || 'JAC'}
                      </div>
                      <h4 className={`font-bold text-xs sm:text-sm leading-tight line-clamp-2 ${
                        isJacBSelected ? 'text-emerald-800 font-black' : 'text-slate-900'
                      }`}>
                        {m.teamB.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {jacB?.sector || 'Sabaneta'}
                      </span>
                      {isJacBSelected && (
                        <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-1 border border-emerald-200">
                          Tu JAC
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Footer */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">Sede: {m.venue}</span>
                  <span className="font-bold text-slate-700 shrink-0">
                    {formatFriendlyDate(m.date)} • {m.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION: ALL REGISTERED SPORTS FOR SELECTED JAC */}
      {selectedJac && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6 no-print space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Todas las Planillas y Disciplinas Inscritas por {selectedJac.name}
              </h3>
              <p className="text-xs text-slate-500">
                Resumen de todos los equipos y deportistas registrados oficialmente por esta JAC en los Juegos Asocomunales.
              </p>
            </div>
            <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full shrink-0">
              {selectedJacInscribedSports.length} planillas inscritas
            </span>
          </div>

          {selectedJacInscribedSports.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay planillas registradas aún para esta JAC.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedJacInscribedSports.map(reg => {
                return (
                  <div key={reg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-800 font-bold">{reg.sportName}</strong>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        reg.branch === 'Masculino' ? 'bg-blue-100 text-blue-700' :
                        reg.branch === 'Femenino' ? 'bg-pink-100 text-pink-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {reg.branch}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Equipo: <span className="font-semibold text-slate-700">{reg.teamName || 'Equipo Oficial'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {reg.members.length} deportistas habilitados
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
