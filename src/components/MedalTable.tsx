import React, { useState, useMemo } from 'react';
import { JAC, SportRegistration, MatchSchedule, Athlete } from '../types';
import { getStoredMedals, saveMedals } from '../utils/storage';
import { 
  Trophy, 
  Download, 
  Printer, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Minimize2, 
  LayoutGrid, 
  Table as TableIcon
} from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

interface MedalTableProps {
  jacs: JAC[];
  registrations?: SportRegistration[];
  matches?: MatchSchedule[];
  athletes?: Athlete[];
}

const BULLETIN_DATE_STR = new Date().toLocaleDateString('es-CO');

export const MedalTable: React.FC<MedalTableProps> = ({ 
  jacs,
  registrations = [],
  matches = [],
  athletes = []
}) => {
  // Local state for medal count by JAC
  const [medals, setMedals] = useState<Record<string, { gold: number; silver: number; bronze: number }>>(() => {
    return getStoredMedals();
  });

  const [sectorFilter, setSectorFilter] = useState<'all' | 'Urbano' | 'Rural'>('all');
  const [sortBy, setSortBy] = useState<'olympic' | 'points' | 'total' | 'wins'>('olympic');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJacDetail, setSelectedJacDetail] = useState<JAC | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');
  const [expandedJacId, setExpandedJacId] = useState<string | null>(null);

  const updateMedal = (jacId: string, type: 'gold' | 'silver' | 'bronze', delta: number) => {
    const current = medals[jacId] || { gold: 0, silver: 0, bronze: 0 };
    const nextVal = Math.max(0, current[type] + delta);
    const updated = {
      ...medals,
      [jacId]: {
        ...current,
        [type]: nextVal
      }
    };
    setMedals(updated);
    saveMedals(updated);
  };

  // Compute stats for each JAC
  const enrichedJacs = useMemo(() => {
    return jacs.map(jac => {
      const record = medals[jac.id] || { gold: 0, silver: 0, bronze: 0 };
      const totalMedals = record.gold + record.silver + record.bronze;
      const points = record.gold * 5 + record.silver * 3 + record.bronze * 1;

      // Registrations & sports participating
      const jacRegs = registrations.filter(r => r.jacId === jac.id);
      const sportsParticipatingCount = new Set(jacRegs.map(r => r.sportId)).size;
      const athletesCount = athletes.filter(a => a.jacId === jac.id).length;

      // Matches stats
      const jacMatches = matches.filter(m => 
        (m.teamA.jacId === jac.id || m.teamB.jacId === jac.id) && m.status === 'Finalizado'
      );
      const played = jacMatches.length;
      const won = jacMatches.filter(m => m.winnerJacId === jac.id).length;
      const lost = played - won;
      const winRate = played > 0 ? Math.round((won / played) * 100) : 0;

      return {
        jac,
        ...record,
        total: totalMedals,
        points,
        sportsCount: sportsParticipatingCount,
        athletesCount,
        played,
        won,
        lost,
        winRate,
        registrations: jacRegs
      };
    });
  }, [jacs, medals, registrations, matches, athletes]);

  // Filter and sort JACs
  const sortedAndFilteredJacs = useMemo(() => {
    return enrichedJacs
      .filter(item => {
        const matchSector = sectorFilter === 'all' || item.jac.sector === sectorFilter;
        const matchSearch = item.jac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.jac.president.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSector && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'olympic') {
          if (b.gold !== a.gold) return b.gold - a.gold;
          if (b.silver !== a.silver) return b.silver - a.silver;
          if (b.bronze !== a.bronze) return b.bronze - a.bronze;
          return b.points - a.points;
        } else if (sortBy === 'points') {
          if (b.points !== a.points) return b.points - a.points;
          return b.gold - a.gold;
        } else if (sortBy === 'total') {
          if (b.total !== a.total) return b.total - a.total;
          return b.gold - a.gold;
        } else {
          if (b.won !== a.won) return b.won - a.won;
          return b.winRate - a.winRate;
        }
      });
  }, [enrichedJacs, sectorFilter, sortBy, searchTerm]);

  // Overall medal totals
  const globalTotals = useMemo(() => {
    let gold = 0;
    let silver = 0;
    let bronze = 0;
    Object.values(medals).forEach(m => {
      gold += m.gold;
      silver += m.silver;
      bronze += m.bronze;
    });
    return { gold, silver, bronze, total: gold + silver + bronze };
  }, [medals]);

  // Export to Excel
  const handleExportExcel = () => {
    const rows = sortedAndFilteredJacs.map((row, index) => ({
      'Posición': index + 1,
      'Junta de Acción Comunal': row.jac.name,
      'Sector': row.jac.sector,
      'Presidente': row.jac.president,
      '🥇 Medallas de Oro': row.gold,
      '🥈 Medallas de Plata': row.silver,
      '🥉 Medallas de Bronce': row.bronze,
      'Total Medallas': row.total,
      'Puntos Acumulados (5-3-1)': row.points,
      'Deportes Inscritos': row.sportsCount,
      'Atletas Registrados': row.athletesCount,
      'Partidos Jugados (PJ)': row.played,
      'Partidos Ganados (PG)': row.won,
      'Partidos Perdidos (PP)': row.lost,
      'Efectividad (%)': `${row.winRate}%`
    }));

    exportToExcel(rows, 'Tabla Posiciones Medallero', `Tabla_Posiciones_Medallero_Asocomunal_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const topThree = sortedAndFilteredJacs.slice(0, 3);

  return (
    <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-slate-900 text-white p-4 md:p-6 overflow-y-auto' : 'max-w-7xl mx-auto space-y-4 md:space-y-6'}`}>
      {/* Official Print Header (Visible strictly when printing to ensure 1 single clean page) */}
      <div className="hidden print:block mb-3 border-b-2 border-slate-900 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
              ALCALDÍA DE SABANETA • INDESA • ASOCOMUNAL
            </div>
            <h1 className="text-xl font-black uppercase text-slate-950 tracking-tight leading-none mt-0.5">
              JUEGOS ASOCOMUNALES DE SABANETA
            </h1>
            <h2 className="text-xs font-bold text-slate-700 mt-0.5">
              Cuadro Oficial de Medallería y Posiciones por Junta de Acción Comunal
            </h2>
          </div>
          <div className="text-right text-[9px] text-slate-600">
            <div className="font-bold">Boletín Oficial de Resultados</div>
            <div>Fecha: {BULLETIN_DATE_STR}</div>
            <div>Puntuación: 🥇 5 pts | 🥈 3 pts | 🥉 1 pto</div>
          </div>
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              Cuadro Oficial de Honor y Rendimiento Deportivo
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Tabla General de Posiciones & Medallería
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Clasificación oficial de las 18 Juntas de Acción Comunal de Sabaneta. 
              Puntuación: <strong className="text-amber-700">🥇 Oro (5 pts)</strong> • <strong className="text-slate-700">🥈 Plata (3 pts)</strong> • <strong className="text-amber-900">🥉 Bronce (1 pto)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              title="Modo pantalla completa para proyector o pantalla gigante"
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" /> Salir
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" /> Pantalla Completa
                </>
              )}
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black transition shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir 1 Pág
            </button>
          </div>
        </div>

        {/* Global Summary Metrics (Responsive Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-100 text-center">
          <div className="bg-amber-50/70 border border-amber-200/80 p-2.5 sm:p-3 rounded-xl">
            <div className="text-xl sm:text-2xl font-black text-amber-600">🥇 {globalTotals.gold}</div>
            <div className="text-[10px] sm:text-xs font-bold text-amber-800 mt-0.5">Medallas de Oro</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-2.5 sm:p-3 rounded-xl">
            <div className="text-xl sm:text-2xl font-black text-slate-600">🥈 {globalTotals.silver}</div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-700 mt-0.5">Medallas de Plata</div>
          </div>
          <div className="bg-amber-100/40 border border-amber-300/60 p-2.5 sm:p-3 rounded-xl">
            <div className="text-xl sm:text-2xl font-black text-amber-900">🥉 {globalTotals.bronze}</div>
            <div className="text-[10px] sm:text-xs font-bold text-amber-950 mt-0.5">Medallas de Bronce</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 sm:p-3 rounded-xl">
            <div className="text-xl sm:text-2xl font-black text-emerald-700">🏆 {globalTotals.total}</div>
            <div className="text-[10px] sm:text-xs font-bold text-emerald-900 mt-0.5">Total Medallas</div>
          </div>
        </div>
      </div>

      {/* Podium Top 3 Cards (Responsive for Mobile) */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-end no-print">
          {/* 2nd Place */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-5 text-center shadow-sm order-2 md:order-1 flex flex-col justify-between">
            <div className="flex md:block items-center justify-between">
              <div className="w-12 h-12 md:w-14 md:h-14 mx-0 md:mx-auto rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300 text-slate-700 font-black text-lg md:text-xl flex items-center justify-center shadow-sm mb-0 md:mb-2 flex-shrink-0">
                🥈 2°
              </div>
              <div className="text-left md:text-center ml-3 md:ml-0 flex-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Subcampeón General</span>
                <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug">{topThree[1].jac.name}</h3>
                <p className="text-[11px] text-slate-400">{topThree[1].jac.sector}</p>
              </div>
            </div>
            <div className="mt-3 md:mt-4 bg-slate-50 border border-slate-200/80 p-2.5 md:p-3 rounded-xl">
              <div className="flex items-center justify-center gap-3 text-sm font-black">
                <span className="text-amber-600">🥇 {topThree[1].gold}</span>
                <span className="text-slate-500">🥈 {topThree[1].silver}</span>
                <span className="text-amber-800">🥉 {topThree[1].bronze}</span>
              </div>
              <div className="text-xs text-slate-600 font-bold mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                <span>{topThree[1].total} Medallas</span>
                <span className="text-emerald-700 font-black">{topThree[1].points} Pts</span>
              </div>
            </div>
          </div>

          {/* 1st Place (Leader) */}
          <div className="bg-gradient-to-b from-amber-50/90 via-white to-amber-50/30 rounded-2xl border-2 border-amber-400 p-4 sm:p-6 text-center shadow-lg order-1 md:order-2 md:-translate-y-2 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                👑 Líder
              </span>
            </div>

            <div className="flex md:block items-center justify-between">
              <div className="w-14 h-14 md:w-16 md:h-16 mx-0 md:mx-auto rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-slate-950 font-black text-2xl md:text-3xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-0 md:mb-2 border-2 border-amber-200 flex-shrink-0">
                🥇
              </div>
              <div className="text-left md:text-center ml-3 md:ml-0 flex-1">
                <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider block">Campeón de los Juegos</span>
                <h3 className="font-black text-slate-900 text-base sm:text-lg leading-snug">{topThree[0].jac.name}</h3>
                <p className="text-[11px] text-slate-500">{topThree[0].jac.sector}</p>
              </div>
            </div>

            <div className="mt-3 md:mt-4 bg-amber-100/70 border border-amber-300 p-3 rounded-xl">
              <div className="flex items-center justify-center gap-4 text-base font-black">
                <span className="text-amber-700">🥇 {topThree[0].gold}</span>
                <span className="text-slate-600">🥈 {topThree[0].silver}</span>
                <span className="text-amber-900">🥉 {topThree[0].bronze}</span>
              </div>
              <div className="text-xs font-black text-slate-800 mt-2 pt-2 border-t border-amber-300/80 flex items-center justify-between">
                <span>{topThree[0].total} Medallas Totales</span>
                <span className="text-emerald-800 text-sm font-black">{topThree[0].points} Pts</span>
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="bg-white rounded-2xl border-2 border-amber-200/80 p-4 sm:p-5 text-center shadow-sm order-3 md:order-3 flex flex-col justify-between">
            <div className="flex md:block items-center justify-between">
              <div className="w-12 h-12 md:w-14 md:h-14 mx-0 md:mx-auto rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 text-amber-900 font-black text-lg md:text-xl flex items-center justify-center shadow-sm mb-0 md:mb-2 flex-shrink-0">
                🥉 3°
              </div>
              <div className="text-left md:text-center ml-3 md:ml-0 flex-1">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Tercer Lugar</span>
                <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug">{topThree[2].jac.name}</h3>
                <p className="text-[11px] text-slate-400">{topThree[2].jac.sector}</p>
              </div>
            </div>
            <div className="mt-3 md:mt-4 bg-slate-50 border border-slate-200/80 p-2.5 md:p-3 rounded-xl">
              <div className="flex items-center justify-center gap-3 text-sm font-black">
                <span className="text-amber-600">🥇 {topThree[2].gold}</span>
                <span className="text-slate-500">🥈 {topThree[2].silver}</span>
                <span className="text-amber-800">🥉 {topThree[2].bronze}</span>
              </div>
              <div className="text-xs text-slate-600 font-bold mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                <span>{topThree[2].total} Medallas</span>
                <span className="text-emerald-700 font-black">{topThree[2].points} Pts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Control Bar (Touch-friendly on mobile) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar Junta de Acción Comunal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Sector and Sort Filters */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
          {/* Sector Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSectorFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                sectorFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({jacs.length})
            </button>
            <button
              onClick={() => setSectorFilter('Urbano')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                sectorFilter === 'Urbano' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Urbano
            </button>
            <button
              onClick={() => setSectorFilter('Rural')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                sectorFilter === 'Rural' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rural
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="olympic">🥇 Criterio Olímpico</option>
            <option value="points">⭐ Puntos Ponderados</option>
            <option value="total">🏅 Total Medallas</option>
            <option value="wins">🏆 Partidos Ganados</option>
          </select>

          {/* Mobile View Mode Switch */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl md:hidden">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-sm"
              title="Cambiar formato de visualización"
            >
              {viewMode === 'table' ? (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" /> Tarjetas
                </>
              ) : (
                <>
                  <TableIcon className="w-3.5 h-3.5 text-blue-600" /> Tabla
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE CARDS VIEW (Displayed on mobile screens when viewMode is 'cards' or default 'auto' on phones) */}
      <div className={`space-y-3 md:hidden no-print ${viewMode === 'table' ? 'hidden' : 'block'}`}>
        {sortedAndFilteredJacs.map((row, index) => {
          const isLeader = index === 0;
          const isExpanded = expandedJacId === row.jac.id;

          return (
            <div
              key={row.jac.id}
              className={`bg-white rounded-2xl border p-4 shadow-sm transition ${
                isLeader ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              {/* Top row: Pos + Name + Sector */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black flex-shrink-0 ${
                    index === 0 ? 'bg-amber-400 text-slate-950 shadow-sm' :
                    index === 1 ? 'bg-slate-200 text-slate-800' :
                    index === 2 ? 'bg-amber-100 text-amber-900' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {index + 1}°
                  </span>
                  <div className="truncate">
                    <h4 className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.jac.color || '#059669' }} />
                      {row.jac.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Pres: {row.jac.president}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  row.jac.sector === 'Rural' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {row.jac.sector}
                </span>
              </div>

              {/* Medals Bar (Visual badges) */}
              <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-black">
                  <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                    🥇 {row.gold}
                  </span>
                  <span className="text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">
                    🥈 {row.silver}
                  </span>
                  <span className="text-amber-900 bg-amber-50/50 px-2 py-1 rounded-md border border-amber-200">
                    🥉 {row.bronze}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-emerald-800">{row.points} Pts</div>
                  <div className="text-[10px] text-slate-400 font-medium">{row.total} Medallas</div>
                </div>
              </div>

              {/* Toggle details button */}
              <button
                onClick={() => setExpandedJacId(isExpanded ? null : row.jac.id)}
                className="mt-2.5 w-full flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 hover:text-emerald-700 py-1 transition cursor-pointer"
              >
                <span>{isExpanded ? 'Ocultar detalles' : 'Ver estadísticas y partidos'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-slate-100 space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/70 p-2 rounded-lg text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Deportes</span>
                      <strong className="text-slate-800">{row.sportsCount} / 11</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Atletas</span>
                      <strong className="text-slate-800">{row.athletesCount}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Partidos</span>
                      <strong className="text-slate-800">{row.played} PJ ({row.won} PG)</strong>
                    </div>
                  </div>

                  {/* Medal controls */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-semibold text-slate-500">Ajustar medallas:</span>
                    <div className="flex items-center gap-1.5">
                      <div className="inline-flex items-center border border-amber-200 rounded bg-amber-50 text-[10px]">
                        <button onClick={() => updateMedal(row.jac.id, 'gold', -1)} className="px-1.5 py-0.5">-</button>
                        <span className="font-bold text-amber-700 px-0.5">🥇</span>
                        <button onClick={() => updateMedal(row.jac.id, 'gold', 1)} className="px-1.5 py-0.5">+</button>
                      </div>
                      <div className="inline-flex items-center border border-slate-200 rounded bg-slate-50 text-[10px]">
                        <button onClick={() => updateMedal(row.jac.id, 'silver', -1)} className="px-1.5 py-0.5">-</button>
                        <span className="font-bold text-slate-600 px-0.5">🥈</span>
                        <button onClick={() => updateMedal(row.jac.id, 'silver', 1)} className="px-1.5 py-0.5">+</button>
                      </div>
                      <div className="inline-flex items-center border border-amber-200 rounded bg-amber-50 text-[10px]">
                        <button onClick={() => updateMedal(row.jac.id, 'bronze', -1)} className="px-1.5 py-0.5">-</button>
                        <span className="font-bold text-amber-900 px-0.5">🥉</span>
                        <button onClick={() => updateMedal(row.jac.id, 'bronze', 1)} className="px-1.5 py-0.5">+</button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedJacDetail(row.jac)}
                    className="w-full text-center py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Ver planillas y atletas de {row.jac.name}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FULL DESKTOP TABLE & PRINT CONTAINER */}
      <div className={`medal-print-container bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden ${
        viewMode === 'cards' ? 'hidden md:block' : 'block'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 py-3.5 w-12 text-center">Pos</th>
                <th className="px-4 py-3.5">Junta de Acción Comunal</th>
                <th className="px-3 py-3.5 text-center">Sector</th>
                <th className="px-3 py-3.5 text-center text-amber-400 bg-slate-800">🥇 Oro</th>
                <th className="px-3 py-3.5 text-center text-slate-300 bg-slate-800">🥈 Plata</th>
                <th className="px-3 py-3.5 text-center text-amber-600 bg-slate-800">🥉 Bronce</th>
                <th className="px-3 py-3.5 text-center font-black bg-slate-800/90 text-white">Total</th>
                <th className="px-3 py-3.5 text-center font-black bg-emerald-900/80 text-emerald-300">Puntos</th>
                <th className="px-3 py-3.5 text-center text-slate-300" title="Deportes en los que participa">Deportes</th>
                <th className="px-3 py-3.5 text-center text-slate-300" title="Atletas inscritos">Atletas</th>
                <th className="px-3 py-3.5 text-center text-slate-300" title="Partidos Jugados">PJ</th>
                <th className="px-3 py-3.5 text-center text-emerald-400" title="Partidos Ganados">PG</th>
                <th className="px-3 py-3.5 text-center text-red-400" title="Partidos Perdidos">PP</th>
                <th className="px-3 py-3.5 text-center text-slate-300" title="Efectividad en victorias">% Efic.</th>
                <th className="px-4 py-3.5 text-center no-print">Ajuste Medallas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sortedAndFilteredJacs.map((row, index) => {
                const isLeader = index === 0;

                return (
                  <tr 
                    key={row.jac.id} 
                    className={`transition hover:bg-emerald-50/40 ${
                      isLeader ? 'bg-amber-50/30 font-semibold' : ''
                    }`}
                  >
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                        index === 0 ? 'bg-amber-400 text-slate-950 shadow-sm' :
                        index === 1 ? 'bg-slate-200 text-slate-800' :
                        index === 2 ? 'bg-amber-100 text-amber-900' :
                        'text-slate-500'
                      }`}>
                        {index + 1}°
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-black/10" 
                          style={{ backgroundColor: row.jac.color || '#059669' }} 
                        />
                        <div>
                          <div className="font-bold text-slate-900 hover:text-emerald-700 cursor-pointer" onClick={() => setSelectedJacDetail(row.jac)}>
                            {row.jac.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            Pres: {row.jac.president}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        row.jac.sector === 'Rural' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {row.jac.sector}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center font-black text-amber-600 text-sm bg-amber-50/30">
                      {row.gold}
                    </td>

                    <td className="px-3 py-3 text-center font-black text-slate-600 text-sm bg-slate-50/50">
                      {row.silver}
                    </td>

                    <td className="px-3 py-3 text-center font-black text-amber-900 text-sm bg-amber-100/20">
                      {row.bronze}
                    </td>

                    <td className="px-3 py-3 text-center font-black text-slate-900 text-sm bg-slate-100/70">
                      {row.total}
                    </td>

                    <td className="px-3 py-3 text-center font-black text-emerald-700 text-sm bg-emerald-50">
                      {row.points}
                    </td>

                    <td className="px-3 py-3 text-center font-semibold text-slate-700">
                      {row.sportsCount} / 11
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">
                      {row.athletesCount}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-600">
                      {row.played}
                    </td>
                    <td className="px-3 py-3 text-center font-black text-emerald-600">
                      {row.won}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-400">
                      {row.lost}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800">
                      {row.played > 0 ? `${row.winRate}%` : '-'}
                    </td>

                    <td className="px-4 py-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="inline-flex items-center border border-amber-200 rounded-md bg-amber-50/70 text-[10px]">
                          <button
                            onClick={() => updateMedal(row.jac.id, 'gold', -1)}
                            className="px-1.5 py-0.5 text-slate-500 hover:text-red-600 cursor-pointer"
                          >-</button>
                          <span className="font-bold text-amber-700 px-0.5">🥇</span>
                          <button
                            onClick={() => updateMedal(row.jac.id, 'gold', 1)}
                            className="px-1.5 py-0.5 text-slate-500 hover:text-emerald-700 cursor-pointer"
                          >+</button>
                        </div>

                        <div className="inline-flex items-center border border-slate-200 rounded-md bg-slate-50 text-[10px]">
                          <button
                            onClick={() => updateMedal(row.jac.id, 'silver', -1)}
                            className="px-1.5 py-0.5 text-slate-500 hover:text-red-600 cursor-pointer"
                          >-</button>
                          <span className="font-bold text-slate-600 px-0.5">🥈</span>
                          <button
                            onClick={() => updateMedal(row.jac.id, 'silver', 1)}
                            className="px-1.5 py-0.5 text-slate-500 hover:text-emerald-700 cursor-pointer"
                          >+</button>
                        </div>

                        <div className="inline-flex items-center border border-amber-200 rounded-md bg-amber-50/50 text-[10px]">
                          <button
                            onClick={() => updateMedal(row.jac.id, 'bronze', -1)}
                            className="px-1.5 py-0.5 text-slate-500 hover:text-red-600 cursor-pointer"
                          >-</button>
                          <span className="font-bold text-amber-900 px-0.5">🥉</span>
                          <button
                            onClick={() => updateMedal(row.jac.id, 'bronze', 1)}
                            className="px-1.5 py-0.5 text-slate-500 hover:text-emerald-700 cursor-pointer"
                          >+</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Quick View of selected JAC */}
      {selectedJacDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase">Ficha de Posición Comunal</span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">{selectedJacDetail.name}</h3>
                <p className="text-xs text-slate-500">Sector {selectedJacDetail.sector} • Pres: {selectedJacDetail.president}</p>
              </div>
              <button
                onClick={() => setSelectedJacDetail(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            {/* Medals summary for this JAC */}
            {(() => {
              const row = enrichedJacs.find(j => j.jac.id === selectedJacDetail.id);
              if (!row) return null;
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-base sm:text-lg font-black text-amber-600">🥇 {row.gold}</div>
                      <div className="text-[10px] text-slate-400">Oro</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-600">🥈 {row.silver}</div>
                      <div className="text-[10px] text-slate-400">Plata</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-amber-900">🥉 {row.bronze}</div>
                      <div className="text-[10px] text-slate-400">Bronce</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-emerald-700">{row.points}</div>
                      <div className="text-[10px] text-slate-400">Puntos</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">
                      Deportes y Planillas Registradas ({row.registrations.length})
                    </h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {row.registrations.map(r => (
                        <div key={r.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                          <div>
                            <strong className="text-slate-800">{r.sportName}</strong>
                            <span className="text-slate-400 ml-1.5">({r.branch})</span>
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{r.teamName || 'Equipo oficial'}</div>
                          </div>
                          <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                            {r.members.length} atletas
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedJacDetail(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
