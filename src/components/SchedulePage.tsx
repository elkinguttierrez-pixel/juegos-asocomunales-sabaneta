import React, { useState, useMemo } from 'react';
import { MatchSchedule, JAC, SportRegistration, SportBranch } from '../types';
import { OFFICIAL_SPORTS } from '../data/initialData';
import { 
  CalendarClock, 
  Plus, 
  MapPin, 
  Clock, 
  Calendar, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Trophy, 
  CheckCircle2, 
  Flame, 
  X,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

interface SchedulePageProps {
  matches: MatchSchedule[];
  jacs: JAC[];
  registrations: SportRegistration[];
  onAddMatch: (match: MatchSchedule) => void;
  onUpdateMatchSchedule: (matchId: string, updates: Partial<MatchSchedule>) => void;
  onUpdateMatchScore: (matchId: string, scoreA: number, scoreB: number, status: 'Pendiente' | 'En Vivo' | 'Finalizado', winnerJacId?: string) => void;
  onDeleteMatch: (matchId: string) => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({
  matches,
  jacs,
  registrations,
  onAddMatch,
  onUpdateMatchSchedule,
  onUpdateMatchScore,
  onDeleteMatch
}) => {
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'Pendiente' | 'En Vivo' | 'Finalizado'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchSchedule | null>(null);

  // Scoring modal state
  const [scoringMatch, setScoringMatch] = useState<MatchSchedule | null>(null);
  const [scoreAInput, setScoreAInput] = useState<number>(0);
  const [scoreBInput, setScoreBInput] = useState<number>(0);
  const [statusInput, setStatusInput] = useState<'Pendiente' | 'En Vivo' | 'Finalizado'>('Pendiente');
  const [winnerInput, setWinnerInput] = useState<string>('');

  // Print schedule bulletin modal
  const [isPrintScheduleOpen, setIsPrintScheduleOpen] = useState(false);

  // Form data for creating or editing match
  const [formData, setFormData] = useState({
    sportId: 'baloncesto',
    branch: 'Masculino' as SportBranch,
    round: 'Fase de Grupos - Fecha 1',
    date: '2026-11-28',
    time: '18:30',
    venue: 'Gimnasio Cubierto INDESA Zona Norte',
    customVenue: '',
    teamAJacId: '',
    teamBJacId: '',
    status: 'Pendiente' as 'Pendiente' | 'En Vivo' | 'Finalizado'
  });

  const getJac = (jacId: string) => jacs.find(j => j.id === jacId);
  const getSport = (sportId: string) => OFFICIAL_SPORTS.find(s => s.id === sportId);

  // Eligible registrations and JACs strictly registered for this sport and branch in modal
  const eligibleModalRegistrations = useMemo(() => {
    const bySport = registrations.filter(r => r.sportId === formData.sportId);
    const byBranch = bySport.filter(r => r.branch === formData.branch);
    return byBranch.length > 0 ? byBranch : bySport;
  }, [registrations, formData.sportId, formData.branch]);

  const eligibleModalJacs = useMemo(() => {
    const registeredJacIds = new Set(eligibleModalRegistrations.map(r => r.jacId));
    if (editingMatch) {
      registeredJacIds.add(editingMatch.teamA.jacId);
      registeredJacIds.add(editingMatch.teamB.jacId);
    }
    return jacs.filter(j => registeredJacIds.has(j.id));
  }, [jacs, eligibleModalRegistrations, editingMatch]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const matchSport = selectedSportFilter === 'all' || m.sportId === selectedSportFilter;
      const matchStatus = selectedStatusFilter === 'all' || m.status === selectedStatusFilter;
      const matchSearch =
        m.teamA.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.teamB.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.round.toLowerCase().includes(searchTerm.toLowerCase());

      return matchSport && matchStatus && matchSearch;
    });
  }, [matches, selectedSportFilter, selectedStatusFilter, searchTerm]);

  // Open modal for new match
  const handleOpenNewMatchModal = (sportIdParam?: string) => {
    setEditingMatch(null);
    const chosenSportId = sportIdParam || (selectedSportFilter !== 'all' ? selectedSportFilter : 'baloncesto');
    const sportObj = getSport(chosenSportId);
    const defaultVenue = sportObj?.scenarios?.[0] || 'Coliseo Polideportivo INDESA Zona Sur';
    const chosenBranch = sportObj?.branches[0] || 'Masculino';

    // Filter JACs strictly with registered teams in this sport & branch
    const sportRegs = registrations.filter(r => r.sportId === chosenSportId);
    const branchRegs = sportRegs.filter(r => r.branch === chosenBranch);
    const targetRegs = branchRegs.length > 0 ? branchRegs : sportRegs;
    const jacA = targetRegs[0]?.jacId || '';
    const jacB = targetRegs[1]?.jacId || '';

    setFormData({
      sportId: chosenSportId,
      branch: chosenBranch,
      round: 'Fase de Grupos - Fecha 1',
      date: '2026-11-28',
      time: '19:00',
      venue: defaultVenue,
      customVenue: '',
      teamAJacId: jacA,
      teamBJacId: jacB,
      status: 'Pendiente'
    });
    setIsScheduleModalOpen(true);
  };

  // Open modal for editing existing match venue/time
  const handleOpenEditMatchModal = (match: MatchSchedule) => {
    setEditingMatch(match);
    const sportObj = getSport(match.sportId);
    const isStandardVenue = sportObj?.scenarios?.includes(match.venue);

    setFormData({
      sportId: match.sportId,
      branch: match.branch,
      round: match.round,
      date: match.date,
      time: match.time,
      venue: isStandardVenue ? match.venue : 'custom',
      customVenue: isStandardVenue ? '' : match.venue,
      teamAJacId: match.teamA.jacId,
      teamBJacId: match.teamB.jacId,
      status: match.status
    });
    setIsScheduleModalOpen(true);
  };

  // Save scheduled match
  const handleSaveScheduledMatch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.teamAJacId || !formData.teamBJacId) {
      alert('Por favor selecciona las dos Juntas de Acción Comunal para el encuentro.');
      return;
    }

    if (formData.teamAJacId === formData.teamBJacId) {
      alert('Los equipos deben ser de Juntas de Acción Comunal distintas.');
      return;
    }

    const finalVenue = formData.venue === 'custom' 
      ? (formData.customVenue.trim() || 'Escenario Municipal Sabaneta') 
      : formData.venue;

    const nameA = getJac(formData.teamAJacId)?.name || 'JAC A';
    const nameB = getJac(formData.teamBJacId)?.name || 'JAC B';

    if (editingMatch) {
      onUpdateMatchSchedule(editingMatch.id, {
        sportId: formData.sportId,
        branch: formData.branch,
        round: formData.round,
        date: formData.date,
        time: formData.time,
        venue: finalVenue,
        teamA: { ...editingMatch.teamA, jacId: formData.teamAJacId, name: nameA },
        teamB: { ...editingMatch.teamB, jacId: formData.teamBJacId, name: nameB },
        status: formData.status
      });
    } else {
      const newMatch: MatchSchedule = {
        id: `match-${formData.sportId}-${Date.now()}`,
        sportId: formData.sportId,
        branch: formData.branch,
        round: formData.round,
        date: formData.date,
        time: formData.time,
        venue: finalVenue,
        teamA: { jacId: formData.teamAJacId, name: nameA },
        teamB: { jacId: formData.teamBJacId, name: nameB },
        status: formData.status
      };
      onAddMatch(newMatch);
    }

    setIsScheduleModalOpen(false);
  };

  // Scoring
  const handleOpenScoringModal = (match: MatchSchedule) => {
    setScoringMatch(match);
    setScoreAInput(match.teamA.score !== undefined ? match.teamA.score : 0);
    setScoreBInput(match.teamB.score !== undefined ? match.teamB.score : 0);
    setStatusInput(match.status);
    setWinnerInput(match.winnerJacId || '');
  };

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringMatch) return;

    let determinedWinner = winnerInput;
    if (statusInput === 'Finalizado' && !determinedWinner) {
      if (scoreAInput > scoreBInput) determinedWinner = scoringMatch.teamA.jacId;
      else if (scoreBInput > scoreAInput) determinedWinner = scoringMatch.teamB.jacId;
    }

    onUpdateMatchScore(scoringMatch.id, scoreAInput, scoreBInput, statusInput, determinedWinner || undefined);
    setScoringMatch(null);
  };

  // Export to Excel
  const handleExportScheduleExcel = () => {
    const rows = filteredMatches.map((m, idx) => ({
      'No.': idx + 1,
      'Deporte': getSport(m.sportId)?.name || m.sportId,
      'Fase / Ronda': m.round,
      'Rama': m.branch,
      'Fecha Programada': m.date,
      'Hora Inicio': m.time,
      'Lugar / Escenario': m.venue,
      'Equipo A (JAC)': m.teamA.name,
      'Marcador A': m.teamA.score !== undefined ? m.teamA.score : '-',
      'Marcador B': m.teamB.score !== undefined ? m.teamB.score : '-',
      'Equipo B (JAC)': m.teamB.name,
      'Estado': m.status,
      'Ganador': m.winnerJacId ? getJac(m.winnerJacId)?.name : 'N/A'
    }));

    exportToExcel(rows, 'Programacion_Juegos', `Programacion_Oficial_Lugar_y_Hora_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <CalendarClock className="w-3.5 h-3.5 text-emerald-600" />
              Módulo de Programación Oficial
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Programar Competencias: Asignación de Lugar y Hora
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Agenda los enfrentamientos oficiales de los Juegos Asocomunales. Asigna el escenario deportivo en Sabaneta, la fecha del cronograma y la hora de inicio para cada disciplina.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenNewMatchModal()}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Programar Nuevo Encuentro
            </button>
            <button
              onClick={() => setIsPrintScheduleOpen(true)}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" /> Imprimir Fixture
            </button>
            <button
              onClick={handleExportScheduleExcel}
              disabled={filteredMatches.length === 0}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Sport Selector */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">Filtrar por Deporte:</label>
            <select
              value={selectedSportFilter}
              onChange={(e) => setSelectedSportFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800"
            >
              <option value="all">Todos los Deportes ({OFFICIAL_SPORTS.length})</option>
              {OFFICIAL_SPORTS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">Estado del Partido:</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800"
            >
              <option value="all">Todos los Estados</option>
              <option value="Pendiente">Pendientes (Programados)</option>
              <option value="En Vivo">En Vivo (Disputándose)</option>
              <option value="Finalizado">Finalizados</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="sm:col-span-2">
            <label className="block text-slate-500 font-bold mb-1">Buscar por Equipo, Sede o Fase:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ej: Holanda, Betania, INDESA, Semifinal..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Programmed Matches List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Encuentros Encontrados: {filteredMatches.length}
          </span>
          <span className="text-xs font-semibold text-emerald-700">
            Haz clic en "Reprogramar" para editar el lugar o la hora
          </span>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CalendarClock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                No hay encuentros programados con los filtros seleccionados
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Usa el botón superior para programar un nuevo encuentro asignando la sede, la fecha y la hora.
              </p>
            </div>
            <button
              onClick={() => handleOpenNewMatchModal()}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Programar Encuentro
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map(match => {
              const sportObj = getSport(match.sportId);
              const jacA = getJac(match.teamA.jacId);
              const jacB = getJac(match.teamB.jacId);
              const isFinished = match.status === 'Finalizado';
              const isLive = match.status === 'En Vivo';

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    {/* Header: Sport & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-black text-xs">
                          {sportObj?.name || match.sportId}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {match.round} • {match.branch}
                        </span>
                      </div>
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                        isFinished ? 'bg-slate-100 text-slate-700' :
                        isLive ? 'bg-red-500 text-white animate-pulse' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {match.status}
                      </span>
                    </div>

                    {/* Venue & Time Prominent Box */}
                    <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 rounded-xl p-3 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0 shadow-xs">
                          <MapPin className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="text-[10px] text-emerald-800 uppercase font-black block leading-none">Lugar / Cancha:</span>
                          <span className="font-bold text-slate-900 text-xs truncate block mt-0.5">{match.venue}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="p-1.5 bg-amber-500 text-slate-900 rounded-lg shrink-0 shadow-xs">
                          <Clock className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="text-[10px] text-amber-900 uppercase font-black block leading-none">Fecha y Hora:</span>
                          <span className="font-bold text-slate-900 text-xs block mt-0.5 font-mono">{match.date} • {match.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scoreboard */}
                    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-xs my-2">
                      <div className="space-y-3">
                        {/* Team A */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: jacA?.color || '#059669' }} />
                            <span className={`text-sm font-bold truncate ${match.winnerJacId === match.teamA.jacId ? 'text-amber-400 font-black' : 'text-slate-200'}`}>
                              {match.teamA.name}
                            </span>
                          </div>
                          <span className="text-xl font-black text-slate-900 bg-white px-3 py-1 rounded-lg min-w-[42px] text-center ml-2">
                            {match.teamA.score !== undefined ? match.teamA.score : '-'}
                          </span>
                        </div>

                        {/* Team B */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: jacB?.color || '#0284c7' }} />
                            <span className={`text-sm font-bold truncate ${match.winnerJacId === match.teamB.jacId ? 'text-amber-400 font-black' : 'text-slate-200'}`}>
                              {match.teamB.name}
                            </span>
                          </div>
                          <span className="text-xl font-black text-slate-900 bg-white px-3 py-1 rounded-lg min-w-[42px] text-center ml-2">
                            {match.teamB.score !== undefined ? match.teamB.score : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Winner */}
                    {isFinished && match.winnerJacId && (
                      <div className="mt-2 text-center">
                        <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          🏆 Ganador: {getJac(match.winnerJacId)?.name || 'JAC'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditMatchModal(match)}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
                        title="Cambiar fecha, hora, escenario o fase"
                      >
                        <Edit className="w-3.5 h-3.5 text-emerald-600" /> Reprogramar
                      </button>
                      <button
                        onClick={() => handleOpenScoringModal(match)}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
                        title="Registrar marcador y resultado"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-600" /> Resultado
                      </button>
                    </div>

                    <button
                      onClick={() => onDeleteMatch(match.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Eliminar este encuentro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: PROGRAMAR / EDITAR LUGAR Y HORA                  */}
      {/* ========================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                  Programación de Competencia
                </span>
                <h3 className="text-lg font-black mt-0.5">
                  {editingMatch ? 'Reprogramar Lugar, Fecha y Hora' : 'Programar Encuentro Deportivo'}
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheduledMatch} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Sport & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Disciplina Deportiva:</label>
                  <select
                    value={formData.sportId}
                    onChange={(e) => {
                      const spId = e.target.value;
                      const spObj = getSport(spId);
                      const newBranch = spObj?.branches[0] || 'Masculino';
                      const newVenue = spObj?.scenarios?.[0] || 'Coliseo Polideportivo INDESA';
                      const sportRegs = registrations.filter(r => r.sportId === spId);
                      const branchRegs = sportRegs.filter(r => r.branch === newBranch);
                      const targetRegs = branchRegs.length > 0 ? branchRegs : sportRegs;

                      setFormData({
                        ...formData,
                        sportId: spId,
                        branch: newBranch,
                        venue: newVenue,
                        teamAJacId: targetRegs[0]?.jacId || '',
                        teamBJacId: targetRegs[1]?.jacId || ''
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  >
                    {OFFICIAL_SPORTS.map(s => {
                      const count = registrations.filter(r => r.sportId === s.id).length;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({count} equipos inscritos)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rama / Categoría:</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => {
                      const newBranch = e.target.value as SportBranch;
                      const sportRegs = registrations.filter(r => r.sportId === formData.sportId);
                      const branchRegs = sportRegs.filter(r => r.branch === newBranch);
                      const targetRegs = branchRegs.length > 0 ? branchRegs : sportRegs;

                      setFormData({
                        ...formData,
                        branch: newBranch,
                        teamAJacId: targetRegs[0]?.jacId || '',
                        teamBJacId: targetRegs[1]?.jacId || ''
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800"
                  >
                    {getSport(formData.sportId)?.branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Round */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Fase / Ronda del Torneo:</label>
                <select
                  value={formData.round}
                  onChange={(e) => setFormData({ ...formData, round: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800"
                >
                  <option value="Fase de Grupos - Fecha 1">Fase de Grupos - Fecha 1</option>
                  <option value="Fase de Grupos - Fecha 2">Fase de Grupos - Fecha 2</option>
                  <option value="Fase de Grupos - Fecha 3">Fase de Grupos - Fecha 3</option>
                  <option value="Ronda Clasificatoria">Ronda Clasificatoria</option>
                  <option value="Cuartos de Final">Cuartos de Final</option>
                  <option value="Semifinal">Semifinal</option>
                  <option value="Tercer y Cuarto Puesto">Tercer y Cuarto Puesto</option>
                  <option value="Gran Final por el Oro">Gran Final por el Oro</option>
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                <div>
                  <label className="block text-emerald-950 font-black mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Fecha del Encuentro:
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-emerald-950 font-black mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" /> Hora de Inicio:
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 font-bold text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Venue / Lugar */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-2">
                <label className="block text-amber-950 font-black flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" /> Lugar / Escenario en Sabaneta:
                </label>
                <select
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                >
                  {getSport(formData.sportId)?.scenarios?.map(sc => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                  <option value="Coliseo Polideportivo INDESA Zona Sur">Coliseo Polideportivo INDESA Zona Sur</option>
                  <option value="Gimnasio Cubierto INDESA Zona Norte">Gimnasio Cubierto INDESA Zona Norte</option>
                  <option value="Placa Polideportiva Betania">Placa Polideportiva Betania</option>
                  <option value="Casa de la Cultura La Barquereña">Casa de la Cultura La Barquereña</option>
                  <option value="Canchas de Tejo El Trapiche">Canchas de Tejo El Trapiche</option>
                  <option value="custom">-- Otro escenario o placa polideportiva --</option>
                </select>

                {formData.venue === 'custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Escribe el nombre del escenario..."
                    value={formData.customVenue}
                    onChange={(e) => setFormData({ ...formData, customVenue: e.target.value })}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-medium text-slate-900 mt-2"
                  />
                )}
              </div>

              {/* Teams Matchup - ONLY REGISTERED TEAMS FOR THIS SPORT */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-black text-xs">
                    Equipos Inscritos en {getSport(formData.sportId)?.name} ({formData.branch}):
                  </label>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black">
                    {eligibleModalJacs.length} equipo(s) disponible(s)
                  </span>
                </div>

                {/* Warning if less than 2 teams */}
                {eligibleModalJacs.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>No hay equipos inscritos en {getSport(formData.sportId)?.name} ({formData.branch}).</strong>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Para programar un encuentro en este deporte, primero debes inscribir al menos 2 equipos en el módulo de <strong>Inscripciones</strong>.
                      </p>
                    </div>
                  </div>
                ) : eligibleModalJacs.length === 1 ? (
                  <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-blue-900 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Solo hay 1 equipo inscrito ({eligibleModalJacs[0].name}).</strong>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        Se requieren mínimo 2 equipos inscritos en este deporte para poder disputar un cruce o partido oficial.
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Equipo A (JAC Local):</label>
                    <select
                      value={formData.teamAJacId}
                      required
                      onChange={(e) => setFormData({ ...formData, teamAJacId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                    >
                      <option value="">-- Seleccionar Equipo Inscrito A --</option>
                      {eligibleModalJacs.map(j => {
                        const reg = eligibleModalRegistrations.find(r => r.jacId === j.id);
                        return (
                          <option key={j.id} value={j.id}>
                            {j.name} {reg?.teamName ? `(${reg.teamName})` : ''} ✓
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Equipo B (JAC Visitante):</label>
                    <select
                      value={formData.teamBJacId}
                      required
                      onChange={(e) => setFormData({ ...formData, teamBJacId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                    >
                      <option value="">-- Seleccionar Equipo Inscrito B --</option>
                      {eligibleModalJacs.map(j => {
                        const reg = eligibleModalRegistrations.find(r => r.jacId === j.id);
                        return (
                          <option key={j.id} value={j.id}>
                            {j.name} {reg?.teamName ? `(${reg.teamName})` : ''} ✓
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Estado:</label>
                <div className="flex gap-2">
                  {(['Pendiente', 'En Vivo', 'Finalizado'] as const).map(st => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setFormData({ ...formData, status: st })}
                      className={`flex-1 py-1.5 rounded-xl font-bold border transition cursor-pointer text-center ${
                        formData.status === st
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={eligibleModalJacs.length < 2}
                  className={`px-5 py-2 font-black rounded-xl shadow-md transition ${
                    eligibleModalJacs.length < 2
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                  }`}
                >
                  {editingMatch ? 'Guardar Cambios' : 'Programar Encuentro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: MARCADOR Y RESULTADO                             */}
      {/* ========================================================= */}
      {scoringMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Control de Resultados</span>
                <h3 className="text-base font-black">Registrar Marcador</h3>
              </div>
              <button onClick={() => setScoringMatch(null)} className="text-white/70 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  {getSport(scoringMatch.sportId)?.name} • {scoringMatch.venue}
                </span>
                <span className="text-xs font-mono text-slate-600 font-bold">
                  {scoringMatch.date} • {scoringMatch.time}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="font-bold text-slate-800 block text-xs truncate mb-2">
                    {scoringMatch.teamA.name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={scoreAInput}
                    onChange={(e) => setScoreAInput(Number(e.target.value))}
                    className="w-20 text-center font-black text-2xl bg-white border border-slate-300 rounded-xl py-1.5 mx-auto block"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="font-bold text-slate-800 block text-xs truncate mb-2">
                    {scoringMatch.teamB.name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={scoreBInput}
                    onChange={(e) => setScoreBInput(Number(e.target.value))}
                    className="w-20 text-center font-black text-2xl bg-white border border-slate-300 rounded-xl py-1.5 mx-auto block"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Estado del Partido:</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                >
                  <option value="Pendiente">Pendiente (Por Jugar)</option>
                  <option value="En Vivo">En Vivo (Jugándose)</option>
                  <option value="Finalizado">Finalizado (Oficial)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Ganador Declarado:</label>
                <select
                  value={winnerInput}
                  onChange={(e) => setWinnerInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  <option value="">-- Automático según marcador --</option>
                  <option value={scoringMatch.teamA.jacId}>{scoringMatch.teamA.name}</option>
                  <option value={scoringMatch.teamB.jacId}>{scoringMatch.teamB.name}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setScoringMatch(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md cursor-pointer"
                >
                  Guardar Resultado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: IMPRESIÓN OFICIAL DEL FIXTURE GENERAL            */}
      {/* ========================================================= */}
      {isPrintScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print">
              <span className="font-bold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" /> Boletín Oficial de Programación General
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs cursor-pointer shadow-sm active:scale-95"
                >
                  <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
                </button>
                <button
                  onClick={() => setIsPrintScheduleOpen(false)}
                  className="text-white/70 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 bg-white text-slate-900 font-sans print:p-0 print:m-0" id="official-general-schedule-sheet">
              <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                  República de Colombia • Municipio de Sabaneta
                </div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight my-1">
                  JUEGOS ASOCOMUNALES SABANETA 2026
                </h1>
                <div className="text-xs font-semibold text-slate-700">
                  Programación Oficial de Sedes, Canchas, Fechas y Horarios
                </div>
                <div className="inline-block mt-2 px-3 py-1 bg-slate-100 border border-slate-300 rounded font-black text-xs uppercase tracking-wide">
                  Boletín Oficial de Competencias • ASOCOMUNAL & INDESA
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-300 border-collapse mb-6">
                <thead>
                  <tr className="bg-slate-200/80 text-slate-800 font-bold uppercase text-[10px]">
                    <th className="border border-slate-300 px-2 py-2 text-center w-8">#</th>
                    <th className="border border-slate-300 px-2 py-2">Deporte</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-24">Fecha</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-16">Hora</th>
                    <th className="border border-slate-300 px-3 py-2">Lugar / Sede</th>
                    <th className="border border-slate-300 px-3 py-2">Equipo A (JAC)</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-14">Marcador</th>
                    <th className="border border-slate-300 px-3 py-2">Equipo B (JAC)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((m, idx) => (
                    <tr key={m.id} className="border-b border-slate-200">
                      <td className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 font-black text-emerald-800">
                        {getSport(m.sportId)?.name || m.sportId}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-800 font-mono">
                        {m.date}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center font-black text-slate-900 font-mono">
                        {m.time}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900">
                        {m.venue}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900">
                        {m.teamA.name}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center font-black text-slate-900 bg-slate-50">
                        {m.teamA.score !== undefined ? `${m.teamA.score} - ${m.teamB.score}` : 'vs'}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900">
                        {m.teamB.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-12 mt-12 pt-6 border-t border-slate-300 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 mb-2 w-48 mx-auto h-8" />
                  <span className="font-bold text-slate-900 block">Coordinación de Escenarios</span>
                  <span className="text-slate-500 text-[11px]">INDESA Sabaneta</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 mb-2 w-48 mx-auto h-8" />
                  <span className="font-bold text-slate-900 block">Comité Técnico de Juzgamiento</span>
                  <span className="text-slate-500 text-[11px]">ASOCOMUNAL Sabaneta</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
