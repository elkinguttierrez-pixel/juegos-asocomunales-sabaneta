import React, { useState, useMemo } from 'react';
import { MatchSchedule, JAC, SportBranch } from '../types';
import { OFFICIAL_SPORTS } from '../data/initialData';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trophy, 
  Search, 
  Printer, 
  Download, 
  LayoutGrid, 
  CalendarDays, 
  Award, 
  CheckCircle2, 
  Flame, 
  X,
  Sparkles,
  Eye
} from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

interface FixtureAndResultsProps {
  matches: MatchSchedule[];
  jacs: JAC[];
  onAddMatch?: (match: MatchSchedule) => void;
  onUpdateMatchScore?: (matchId: string, scoreA: number, scoreB: number, status: 'Pendiente' | 'En Vivo' | 'Finalizado', winnerJacId?: string) => void;
}

const BULLETIN_EMISSION_DATE = new Date().toISOString().slice(0, 10);

export const FixtureAndResults: React.FC<FixtureAndResultsProps> = ({
  matches,
  jacs
}) => {
  const [selectedSportFilter, setSelectedSportFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Finalizado' | 'En Vivo' | 'Pendiente'>('all');
  const [branchFilter, setBranchFilter] = useState<'all' | SportBranch>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');

  const getJac = (jacId: string) => jacs.find(j => j.id === jacId);
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

  // Filtered and sorted matches (read-only)
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const matchSport = selectedSportFilter === 'all' || m.sportId === selectedSportFilter;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchBranch = branchFilter === 'all' || m.branch === branchFilter;
      
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term || 
        m.venue.toLowerCase().includes(term) ||
        m.teamA.name.toLowerCase().includes(term) ||
        m.teamB.name.toLowerCase().includes(term) ||
        m.round.toLowerCase().includes(term) ||
        getSportName(m.sportId).toLowerCase().includes(term) ||
        m.date.includes(term);

      return matchSport && matchStatus && matchBranch && matchSearch;
    }).sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [matches, selectedSportFilter, statusFilter, branchFilter, searchTerm]);

  // Grouped by date for timeline view
  const matchesByDate = useMemo(() => {
    const groups: Record<string, MatchSchedule[]> = {};
    filteredMatches.forEach(match => {
      if (!groups[match.date]) {
        groups[match.date] = [];
      }
      groups[match.date].push(match);
    });
    return groups;
  }, [filteredMatches]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = matches.length;
    const finished = matches.filter(m => m.status === 'Finalizado').length;
    const live = matches.filter(m => m.status === 'En Vivo').length;
    const pending = matches.filter(m => m.status === 'Pendiente').length;
    return { total, finished, live, pending };
  }, [matches]);

  const handleExportExcel = () => {
    const rows = filteredMatches.map(m => {
      const jacWinner = m.winnerJacId ? getJac(m.winnerJacId)?.name : 'N/A';
      return {
        'Deporte': getSportName(m.sportId),
        'Rama': m.branch,
        'Ronda': m.round,
        'Fecha': m.date,
        'Hora': m.time,
        'Lugar / Escenario': m.venue,
        'Equipo A': m.teamA.name,
        'Marcador A': m.teamA.score !== undefined ? m.teamA.score : '-',
        'Marcador B': m.teamB.score !== undefined ? m.teamB.score : '-',
        'Equipo B': m.teamB.name,
        'Estado': m.status,
        'Ganador Oficial': m.winnerJacId ? jacWinner : m.status === 'Finalizado' && m.teamA.score === m.teamB.score ? 'Empate' : 'Por Definir'
      };
    });

    exportToExcel(
      rows,
      'Programación y Resultados',
      `Programacion_Resultados_Juegos_Asocomunales_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Official Printable Header for physical bulletins */}
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
              Boletín Oficial de Consulta: Sedes, Horarios y Resultados Finales
            </h2>
          </div>
          <div className="text-right text-[10px] text-slate-600">
            <div className="font-bold">Boletín Oficial Informativo</div>
            <div>Fecha: {BULLETIN_EMISSION_DATE}</div>
          </div>
        </div>
      </div>

      {/* Top Banner (Read-Only) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Competencias Oficiales • 11 Disciplinas
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <Eye className="w-3 h-3 text-emerald-600" />
                Consulta Oficial (Solo Lectura)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Programación, Sedes y Resultados por Deporte
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Consulta en tiempo real el <strong className="text-slate-800">lugar (escenario deportivo)</strong>, la <strong className="text-slate-800">fecha y hora exacta</strong> de cada competencia, y el <strong className="text-emerald-700">resultado final oficial</strong> de los Juegos Asocomunales de Sabaneta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="Imprimir boletín oficial de partidos y sedes"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir Boletín</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="Descargar tabla en formato Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Encuentros</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</div>
          </div>
          <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-200/70">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Finalizados (Con Resultado)
            </div>
            <div className="text-xl font-black text-emerald-900 mt-0.5">{stats.finished}</div>
          </div>
          <div className="bg-red-50/70 rounded-xl p-3 border border-red-200/70">
            <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-red-600 animate-pulse" /> En Vivo
            </div>
            <div className="text-xl font-black text-red-900 mt-0.5">{stats.live}</div>
          </div>
          <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/70">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Próximos / Programados
            </div>
            <div className="text-xl font-black text-amber-900 mt-0.5">{stats.pending}</div>
          </div>
        </div>
      </div>

      {/* SPORT SELECTOR TABS BAR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3 no-print">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Selecciona una Disciplina ({OFFICIAL_SPORTS.length} deportes):
          </span>
          <span className="text-xs text-emerald-700 font-bold">
            {filteredMatches.length} competencia(s) encontrada(s)
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedSportFilter('all')}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              selectedSportFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos los Deportes ({matches.length})
          </button>
          {OFFICIAL_SPORTS.map(sport => {
            const count = matches.filter(m => m.sportId === sport.id).length;
            const isSelected = selectedSportFilter === sport.id;

            return (
              <button
                key={sport.id}
                onClick={() => setSelectedSportFilter(sport.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{sport.name}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH BAR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-3 no-print">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search box (by venue, team, date) */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por lugar (ej. Coliseo Adida), JAC o fecha..."
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

          {/* Status filter pills */}
          <div className="md:col-span-4 flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('Finalizado')}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                statusFilter === 'Finalizado' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Finalizados
            </button>
            <button
              onClick={() => setStatusFilter('En Vivo')}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                statusFilter === 'En Vivo' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              En Vivo
            </button>
            <button
              onClick={() => setStatusFilter('Pendiente')}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                statusFilter === 'Pendiente' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Próximos
            </button>
          </div>

          {/* Branch filter & View mode switch */}
          <div className="md:col-span-3 flex items-center justify-between gap-2">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1"
            >
              <option value="all">Todas las Ramas</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Mixto">Mixto</option>
            </select>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista de Tarjetas con marcadores"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'timeline' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista Cronológica por Fecha"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* COMPETITION MATCHES LIST (READ ONLY) */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            No se encontraron competencias con los filtros seleccionados
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Prueba cambiando la disciplina, el estado o limpiando el texto del buscador.
          </p>
          <button
            onClick={() => {
              setSelectedSportFilter('all');
              setStatusFilter('all');
              setBranchFilter('all');
              setSearchTerm('');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* MODE 1: RICH CARDS GRID (READ ONLY) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((m) => {
            const jacA = getJac(m.teamA.jacId);
            const jacB = getJac(m.teamB.jacId);
            const isFinished = m.status === 'Finalizado';
            const isLive = m.status === 'En Vivo';
            const sport = getSport(m.sportId);

            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                {/* 1. Header with Sport, Branch, Round & Status Badge */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
                        <Award className="w-4 h-4 text-emerald-700" />
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
                      isFinished ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                      isLive ? 'bg-red-500 text-white shadow-sm animate-pulse flex items-center gap-1' :
                      'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      {isLive && <Flame className="w-3 h-3" />}
                      {m.status}
                    </span>
                  </div>
                </div>

                {/* 2. VENUE (LUGAR) & TIME (HORA) PROMINENT BAR */}
                <div className="px-4 py-2.5 bg-emerald-950/5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {/* Lugar / Escenario */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </span>
                    <div className="truncate">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Lugar / Sede:</span>
                      <strong className="text-slate-800 text-xs font-bold truncate block">
                        {m.venue}
                      </strong>
                    </div>
                  </div>

                  {/* Fecha y Hora */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="p-1 bg-amber-100 text-amber-800 rounded-md shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Fecha y Hora:</span>
                      <strong className="text-slate-800 text-xs font-bold block">
                        {formatFriendlyDate(m.date)} • {m.time}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. TEAMS, COMPETITORS & FINAL RESULT SCOREBOARD */}
                <div className="p-5 flex-1 flex flex-col justify-center">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    
                    {/* Team A */}
                    <div className="col-span-5 text-center flex flex-col items-center">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xs mb-2 shadow-sm ring-2 ring-white"
                        style={{ backgroundColor: jacA?.color || '#059669' }}
                      >
                        {jacA?.name.slice(4, 7).toUpperCase() || 'JAC'}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight line-clamp-2">
                        {m.teamA.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {jacA?.sector || 'Sabaneta'}
                      </span>
                    </div>

                    {/* Score / Result Display */}
                    <div className="col-span-2 text-center flex flex-col items-center justify-center">
                      <div className="bg-slate-900 text-white rounded-xl px-2.5 py-1.5 shadow-sm min-w-[56px]">
                        <div className="flex items-center justify-center gap-1.5 text-base sm:text-lg font-black tracking-tight">
                          <span>{m.teamA.score !== undefined ? m.teamA.score : '-'}</span>
                          <span className="text-slate-400 text-xs">:</span>
                          <span>{m.teamB.score !== undefined ? m.teamB.score : '-'}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">
                        {isFinished ? 'Final' : isLive ? 'En Juego' : 'VS'}
                      </span>
                    </div>

                    {/* Team B */}
                    <div className="col-span-5 text-center flex flex-col items-center">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xs mb-2 shadow-sm ring-2 ring-white"
                        style={{ backgroundColor: jacB?.color || '#3b82f6' }}
                      >
                        {jacB?.name.slice(4, 7).toUpperCase() || 'JAC'}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight line-clamp-2">
                        {m.teamB.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {jacB?.sector || 'Sabaneta'}
                      </span>
                    </div>
                  </div>

                  {/* 4. FINAL RESULT & WINNER HIGHLIGHT */}
                  {isFinished && (
                    <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                      {m.winnerJacId ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>
                            Ganador Oficial: <strong>{getJac(m.winnerJacId)?.name || 'JAC'}</strong>
                          </span>
                        </div>
                      ) : m.teamA.score === m.teamB.score ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                          <span>🤝 Empate Reglamentario</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* 5. Clean read-only footer */}
                <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Sede: {m.venue}</span>
                  <span className="font-medium">{formatFriendlyDate(m.date)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODE 2: TIMELINE / CHRONOGRAM BY DATE (READ ONLY) */
        <div className="space-y-6">
          {Object.entries(matchesByDate).map(([dateStr, dayMatches]) => (
            <div key={dateStr} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              {/* Date Header */}
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-black capitalize">
                    {formatFriendlyDate(dateStr)} ({dateStr})
                  </span>
                </div>
                <span className="text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                  {dayMatches.length} competencia(s)
                </span>
              </div>

              {/* Day Schedule Table */}
              <div className="divide-y divide-slate-100">
                {dayMatches.map(m => {
                  const isFinished = m.status === 'Finalizado';
                  const isLive = m.status === 'En Vivo';
                  const jacWinner = m.winnerJacId ? getJac(m.winnerJacId)?.name : null;

                  return (
                    <div 
                      key={m.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 transition"
                    >
                      {/* Time and Venue Column */}
                      <div className="md:w-1/3 flex items-start gap-3">
                        <div className="bg-amber-100 text-amber-900 px-2.5 py-1.5 rounded-xl text-center shrink-0">
                          <span className="text-xs font-black block leading-none">{m.time}</span>
                          <span className="text-[9px] font-bold text-amber-700 uppercase">Hora</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800">
                              {getSportName(m.sportId)}
                            </span>
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-slate-600">
                              {m.branch}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{m.venue}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block">{m.round}</span>
                        </div>
                      </div>

                      {/* Opponents and Score Column */}
                      <div className="md:w-1/3 flex items-center justify-between md:justify-center gap-4 bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl">
                        <span className={`text-xs font-bold flex-1 text-right truncate ${
                          m.winnerJacId === m.teamA.jacId ? 'text-emerald-700 font-black' : 'text-slate-800'
                        }`}>
                          {m.teamA.name}
                        </span>

                        <div className="bg-white md:bg-slate-900 text-slate-900 md:text-white px-3 py-1 rounded-lg border md:border-transparent border-slate-200 font-black text-sm shrink-0">
                          {m.teamA.score !== undefined ? m.teamA.score : '-'} : {m.teamB.score !== undefined ? m.teamB.score : '-'}
                        </div>

                        <span className={`text-xs font-bold flex-1 text-left truncate ${
                          m.winnerJacId === m.teamB.jacId ? 'text-emerald-700 font-black' : 'text-slate-800'
                        }`}>
                          {m.teamB.name}
                        </span>
                      </div>

                      {/* Status Column */}
                      <div className="md:w-1/4 flex items-center justify-between md:justify-end gap-3">
                        <div className="text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isFinished ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            isLive ? 'bg-red-500 text-white animate-pulse' :
                            'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}>
                            {m.status}
                          </span>
                          {jacWinner && (
                            <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                              🥇 {jacWinner}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
