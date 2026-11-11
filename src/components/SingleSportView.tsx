import React, { useState, useMemo } from 'react';
import { OFFICIAL_SPORTS } from '../data/initialData';
import { SportRegistration, MatchSchedule, JAC, Athlete, SportBranch } from '../types';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Printer, 
  Plus, 
  Download, 
  Clock, 
  Award,
  BookOpen,
  Filter,
  Phone,
  Trophy,
  Edit,
  Trash2,
  CheckCircle2,
  Flame,
  X,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

interface SingleSportViewProps {
  initialSportId?: string;
  registrations: SportRegistration[];
  matches: MatchSchedule[];
  jacs: JAC[];
  athletes: Athlete[];
  onOpenPrintModal: (reg: SportRegistration) => void;
  onSelectAthleteForCard: (ath: Athlete) => void;
  onGoToRegistration: (sportId: string, branch: SportBranch) => void;
  onUpdateMatchScore?: (matchId: string, scoreA: number, scoreB: number, status: 'Pendiente' | 'En Vivo' | 'Finalizado', winnerJacId?: string) => void;
  onAddMatch?: (newMatch: MatchSchedule) => void;
  onUpdateMatchSchedule?: (matchId: string, updates: Partial<MatchSchedule>) => void;
  onDeleteMatch?: (matchId: string) => void;
}

export const SingleSportView: React.FC<SingleSportViewProps> = ({
  initialSportId,
  registrations,
  matches,
  jacs,
  athletes,
  onOpenPrintModal,
  onSelectAthleteForCard,
  onGoToRegistration,
  onUpdateMatchScore,
  onAddMatch,
  onUpdateMatchSchedule,
  onDeleteMatch
}) => {
  const [selectedSportId, setSelectedSportId] = useState<string>(() => initialSportId || OFFICIAL_SPORTS[0].id);
  const [prevInitialSportId, setPrevInitialSportId] = useState(initialSportId);

  // Sync state during render when initialSportId prop changes
  if (initialSportId && initialSportId !== prevInitialSportId) {
    setPrevInitialSportId(initialSportId);
    setSelectedSportId(initialSportId);
  }

  const [selectedBranch, setSelectedBranch] = useState<'all' | SportBranch>('all');
  // Default to 'matches' subtab so user directly sees and schedules Lugar y Hora!
  const [activeSubTab, setActiveSubTab] = useState<'matches' | 'teams' | 'rules'>('matches');

  // Modal states for Scheduling (Lugar y Hora)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchSchedule | null>(null);

  // Modal state for Scoring (Marcador)
  const [scoringMatch, setScoringMatch] = useState<MatchSchedule | null>(null);
  const [scoreAInput, setScoreAInput] = useState<number>(0);
  const [scoreBInput, setScoreBInput] = useState<number>(0);
  const [statusInput, setStatusInput] = useState<'Pendiente' | 'En Vivo' | 'Finalizado'>('Pendiente');
  const [winnerInput, setWinnerInput] = useState<string>('');

  // Modal state for Printing the Sport's Schedule Sheet
  const [isPrintScheduleOpen, setIsPrintScheduleOpen] = useState(false);

  // Form data for creating or editing match venue and time
  const [formData, setFormData] = useState({
    branch: 'Masculino' as SportBranch,
    round: 'Fase de Grupos - Fecha 1',
    date: '2026-11-28',
    time: '19:00',
    venue: '',
    customVenue: '',
    teamAJacId: '',
    teamBJacId: '',
    status: 'Pendiente' as 'Pendiente' | 'En Vivo' | 'Finalizado'
  });

  // Currently active sport config
  const currentSport = useMemo(() => {
    return OFFICIAL_SPORTS.find(s => s.id === selectedSportId) || OFFICIAL_SPORTS[0];
  }, [selectedSportId]);

  // Registrations for this sport
  const sportRegistrations = useMemo(() => {
    return registrations.filter(r => {
      const matchSport = r.sportId === selectedSportId;
      const matchBranch = selectedBranch === 'all' || r.branch === selectedBranch;
      return matchSport && matchBranch;
    });
  }, [registrations, selectedSportId, selectedBranch]);

  // Matches for this sport
  const sportMatches = useMemo(() => {
    return matches.filter(m => {
      const matchSport = m.sportId === selectedSportId;
      const matchBranch = selectedBranch === 'all' || m.branch === selectedBranch;
      return matchSport && matchBranch;
    });
  }, [matches, selectedSportId, selectedBranch]);

  const getJac = (jacId: string) => jacs.find(j => j.id === jacId);

  // Available JACs registered in this sport
  const registeredJacsInThisSport = useMemo(() => {
    const jacIds = new Set(sportRegistrations.map(r => r.jacId));
    if (jacIds.size > 0) {
      return jacs.filter(j => jacIds.has(j.id));
    }
    return jacs;
  }, [sportRegistrations, jacs]);

  // Open modal to schedule a new match
  const handleOpenNewMatchModal = () => {
    setEditingMatch(null);
    const defaultVenue = currentSport.scenarios?.[0] || 'Coliseo INDESA Sabaneta';
    const teamA = registeredJacsInThisSport[0]?.id || jacs[0]?.id || '';
    const teamB = registeredJacsInThisSport[1]?.id || jacs[1]?.id || '';

    setFormData({
      branch: currentSport.branches[0] || 'Masculino',
      round: 'Fase de Grupos - Fecha 1',
      date: '2026-11-28',
      time: '18:30',
      venue: defaultVenue,
      customVenue: '',
      teamAJacId: teamA,
      teamBJacId: teamB,
      status: 'Pendiente'
    });
    setIsScheduleModalOpen(true);
  };

  // Open modal to edit existing match venue and time
  const handleOpenEditMatchModal = (match: MatchSchedule) => {
    setEditingMatch(match);
    const isStandardVenue = currentSport.scenarios?.includes(match.venue);

    setFormData({
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

  // Save the scheduled match
  const handleSaveScheduledMatch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.teamAJacId || !formData.teamBJacId) {
      alert('Por favor selecciona los dos equipos o representaciones comunales.');
      return;
    }

    if (formData.teamAJacId === formData.teamBJacId) {
      alert('Los equipos deben pertenecer a Juntas de Acción Comunal distintas.');
      return;
    }

    const finalVenue = formData.venue === 'custom' 
      ? (formData.customVenue.trim() || 'Escenario Municipal Sabaneta') 
      : formData.venue;

    const nameA = getJac(formData.teamAJacId)?.name || 'JAC A';
    const nameB = getJac(formData.teamBJacId)?.name || 'JAC B';

    if (editingMatch) {
      if (onUpdateMatchSchedule) {
        onUpdateMatchSchedule(editingMatch.id, {
          branch: formData.branch,
          round: formData.round,
          date: formData.date,
          time: formData.time,
          venue: finalVenue,
          teamA: { ...editingMatch.teamA, jacId: formData.teamAJacId, name: nameA },
          teamB: { ...editingMatch.teamB, jacId: formData.teamBJacId, name: nameB },
          status: formData.status
        });
      }
    } else {
      if (onAddMatch) {
        const newMatch: MatchSchedule = {
          id: `match-${currentSport.id}-${Date.now()}`,
          sportId: currentSport.id,
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
    }

    setIsScheduleModalOpen(false);
  };

  // Open scoring modal
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

    if (onUpdateMatchScore) {
      onUpdateMatchScore(scoringMatch.id, scoreAInput, scoreBInput, statusInput, determinedWinner || undefined);
    }
    setScoringMatch(null);
  };

  // Export registrations of this sport to Excel
  const handleExportThisSportExcel = () => {
    const rows: any[] = [];
    sportRegistrations.forEach(reg => {
      const jac = getJac(reg.jacId);
      reg.members.forEach((m, idx) => {
        rows.push({
          'Deporte': reg.sportName,
          'Rama': reg.branch,
          'Modalidad': reg.modalityDetail || 'Oficial',
          'JAC Sabaneta': jac?.name || 'JAC',
          'Equipo / Dupla': reg.teamName,
          'Delegado': reg.delegateName,
          'Teléfono Delegado': reg.delegatePhone,
          'Uniforme Principal': reg.uniformPrimaryColor || 'N/A',
          'Uniforme Secundario': reg.uniformSecondaryColor || 'N/A',
          'Posición / No.': idx + 1,
          'Dorsal': m.dorsal || 'N/A',
          'Talla Uniforme': m.talla || 'M',
          'Deportista': m.fullName,
          'Documento': `${m.documentType} ${m.documentNumber}`,
          'Género': m.gender,
          'Posición / Rol': m.position || 'N/A',
          'EPS': m.eps
        });
      });
    });

    exportToExcel(rows, currentSport.name, `${currentSport.name}_Planillas_Juegos_Asocomunales.xlsx`);
  };

  // Export schedule of this sport to Excel
  const handleExportScheduleExcel = () => {
    const rows = sportMatches.map((m, idx) => ({
      'No.': idx + 1,
      'Deporte': currentSport.name,
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

    exportToExcel(rows, `Programacion_${currentSport.name}`, `Programacion_${currentSport.name}_Lugar_y_Hora.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Sport Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Programación Oficial: Lugar, Fecha y Hora por Deporte
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              {currentSport.name}
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {currentSport.type === 'conjunto' ? 'Conjunto' : currentSport.type === 'cultural' ? 'Cultural' : 'Individual'}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
              {currentSport.officialDates && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2.5 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  Fechas de Competencia: {currentSport.officialDates}
                </span>
              )}
              {currentSport.scenarios && (
                <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Sedes en Sabaneta: {currentSport.scenarios.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenNewMatchModal}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition shadow-sm cursor-pointer active:scale-95"
              title="Programar un nuevo encuentro con lugar y hora"
            >
              <Plus className="w-4 h-4" /> Programar Lugar y Hora
            </button>
            <button
              onClick={() => setIsPrintScheduleOpen(true)}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              title="Imprimir boletín oficial de programación y horarios de este deporte"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" /> Imprimir Programación
            </button>
            <button
              onClick={handleExportScheduleExcel}
              disabled={sportMatches.length === 0}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Descargar fixture de lugar y hora en Excel"
            >
              <Download className="w-3.5 h-3.5" /> Excel Horarios
            </button>
          </div>
        </div>
      </div>

      {/* HORIZONTAL SPORTS SELECTOR BAR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3 no-print">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Selecciona la Disciplina para Programar:
          </span>
          <span className="text-xs text-emerald-700 font-bold">
            {currentSport.name} ({sportMatches.length} partidos programados)
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {OFFICIAL_SPORTS.map(sport => {
            const isSelected = sport.id === selectedSportId;
            const teamsCount = registrations.filter(r => r.sportId === sport.id).length;
            const matchesCount = matches.filter(m => m.sportId === sport.id).length;

            return (
              <button
                key={sport.id}
                onClick={() => {
                  setSelectedSportId(sport.id);
                  setSelectedBranch('all');
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isSelected 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.02]' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span>{sport.name}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {matchesCount > 0 ? `${matchesCount} part` : `${teamsCount} eq`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTABS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-1">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('matches')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeSubTab === 'matches'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>📍 Programación: Lugar y Hora ({sportMatches.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('teams')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeSubTab === 'teams'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Planillas y Equipos ({sportRegistrations.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeSubTab === 'rules'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📖 Reglamento y Sedes</span>
          </button>
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Rama:</span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
          >
            <option value="all">Todas ({currentSport.branches.join(', ')})</option>
            {currentSport.branches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SUBTAB 1: PROGRAMACIÓN DE LUGAR Y HORA (MATCHES) */}
      {activeSubTab === 'matches' && (
        <div className="space-y-4">
          {/* Quick Header Strip */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">
                Fixture y Control de Canchas • Sabaneta
              </span>
              <h3 className="text-base font-black">
                Programación de Encuentros para {currentSport.name}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Define el lugar, la hora, la fecha y los rivales de cada jornada.
              </p>
            </div>
            <button
              onClick={handleOpenNewMatchModal}
              className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-slate-900" /> Programar Partido / Cruce
            </button>
          </div>

          {sportMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Aún no hay competencias programadas para {currentSport.name}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Usa el botón de arriba para asignar el lugar, la fecha y la hora entre las JACs inscritas de Sabaneta.
                </p>
              </div>
              <button
                onClick={handleOpenNewMatchModal}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Programar el Primer Encuentro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sportMatches.map((match) => {
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
                      {/* Round and Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {match.round} • {match.branch}
                        </span>
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                          isFinished ? 'bg-slate-100 text-slate-700' :
                          isLive ? 'bg-red-500 text-white animate-pulse' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {match.status}
                        </span>
                      </div>

                      {/* Prominent Lugar y Hora Box */}
                      <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-xl p-3 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0 shadow-xs">
                            <MapPin className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="text-[10px] text-emerald-800 uppercase font-black block leading-none">Lugar / Escenario:</span>
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

                      {/* Scoreboard display */}
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

                      {/* Winner highlight */}
                      {isFinished && match.winnerJacId && (
                        <div className="mt-2 text-center">
                          <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            🏆 Ganador: {getJac(match.winnerJacId)?.name || 'JAC'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Management and Action bar */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditMatchModal(match)}
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer"
                          title="Cambiar fecha, hora, lugar o fase"
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

                      {onDeleteMatch && (
                        <button
                          onClick={() => onDeleteMatch(match.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Eliminar este encuentro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: TEAMS AND ROSTERS */}
      {activeSubTab === 'teams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              Planillas y Cuadros Oficiales de {currentSport.name} ({sportRegistrations.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onGoToRegistration(currentSport.id, currentSport.branches[0])}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Inscribir Nueva Planilla
              </button>
              <button
                onClick={handleExportThisSportExcel}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Descargar Nóminas
              </button>
            </div>
          </div>

          {sportRegistrations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                No hay planillas inscritas en {currentSport.name}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Inscribe el primer equipo de tu Junta de Acción Comunal para este deporte.
              </p>
              <button
                onClick={() => onGoToRegistration(currentSport.id, currentSport.branches[0])}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Inscribir Planilla
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sportRegistrations.map((reg) => {
                const jac = getJac(reg.jacId);

                return (
                  <div
                    key={reg.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
                  >
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white mb-1.5"
                            style={{ backgroundColor: jac?.color || '#059669' }}
                          >
                            {jac?.name || 'JAC Sabaneta'}
                          </span>
                          <h4 className="text-base font-black text-slate-900 truncate">
                            {reg.teamName}
                          </h4>
                          <span className="text-xs text-slate-500 block">
                            Rama: <strong>{reg.branch}</strong> • {reg.modalityDetail || 'Comunal'}
                          </span>
                        </div>

                        <button
                          onClick={() => onOpenPrintModal(reg)}
                          className="flex items-center gap-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                          title="Imprimir planilla oficial para mesa técnica"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" /> Planilla
                        </button>
                      </div>

                      {/* Delegate and Uniform info */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Delegado Responsable:</span>
                          <strong className="text-slate-800">{reg.delegateName}</strong>
                          <span className="text-slate-500 block text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {reg.delegatePhone}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Colores de Uniforme:</span>
                          <span className="text-slate-800 font-medium">
                            {reg.uniformPrimaryColor || 'N/A'} {reg.uniformSecondaryColor ? `/ ${reg.uniformSecondaryColor}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Members List Table */}
                    <div className="p-5 flex-1">
                      <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center justify-between">
                        <span>Alineación de Deportistas ({reg.members.length})</span>
                        <span className="text-[11px] font-medium text-emerald-600">Habilitados con talla</span>
                      </div>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto scrollbar-thin">
                        {reg.members.map((m, idx) => {
                          const athleteData = athletes.find(a => a.documentNumber === m.documentNumber);

                          return (
                            <div
                              key={m.documentNumber || idx}
                              className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/80 transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-6 h-6 rounded-md bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs flex-shrink-0">
                                  {m.dorsal ? `#${m.dorsal}` : idx + 1}
                                </span>
                                <div className="truncate">
                                  <div className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                                    {m.fullName}
                                    {m.talla && (
                                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                        Talla {m.talla}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {m.documentType} {m.documentNumber} • EPS: {m.eps}
                                  </div>
                                </div>
                              </div>

                              {athleteData && (
                                <button
                                  onClick={() => onSelectAthleteForCard(athleteData)}
                                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 hover:underline flex-shrink-0 ml-2 cursor-pointer"
                                  title="Ver carné del atleta"
                                >
                                  Carné
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: RULES & TECHNICAL INFO */}
      {activeSubTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Reglamento Oficial: {currentSport.name}
            </h3>
            <p className="text-xs text-slate-500">
              Disposiciones técnicas y normativas aplicables a los Juegos Asocomunales de Sabaneta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                1. Cupos y Conformación de Planilla
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cada JAC puede registrar entre <strong>{currentSport.minPlayers}</strong> y <strong>{currentSport.maxPlayers}</strong> deportistas en este deporte. 
                Todos los integrantes deben estar certificados con residencia en la jurisdicción comunal correspondiente.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                2. Ramas de Competencia
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Este deporte se disputa en las siguientes ramas oficiales: {currentSport.branches.join(', ')}.
                {currentSport.branches.includes('Mixto') && (
                  <span className="block mt-1 text-purple-700 font-semibold">
                    * En modalidad Mixta se exige la presencia simultánea reglamentaria en competencia.
                  </span>
                )}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                3. Modalidades y Pruebas
              </h4>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {currentSport.modalities ? (
                  currentSport.modalities.map(m => (
                    <span key={m} className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-800">
                      {m}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Modalidad única reglamentaria</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                4. Notas Técnicas y Arbitraje
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentSport.rulesNotes || 'Reglamentación estándar de federación avalada por INDESA Sabaneta y el congreso técnico de delegados.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: PROGRAMAR LUGAR Y HORA (NUEVO O EDITAR)          */}
      {/* ========================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                  Programación de Competencia
                </span>
                <h3 className="text-lg font-black mt-0.5">
                  {editingMatch ? 'Reprogramar Lugar y Hora' : `Programar Encuentro: ${currentSport.name}`}
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveScheduledMatch} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Category & Round */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Rama / Categoría:
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value as SportBranch })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800"
                  >
                    {currentSport.branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Fase / Ronda del Torneo:
                  </label>
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
              </div>

              {/* Date & Time (CRITICAL FIELDS) */}
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
                  {currentSport.officialDates && (
                    <span className="text-[10px] text-emerald-700 mt-1 block">
                      Fechas sugeridas: {currentSport.officialDates}
                    </span>
                  )}
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
                  <span className="text-[10px] text-emerald-700 mt-1 block">
                    Formato 24h (ej: 18:30, 20:00)
                  </span>
                </div>
              </div>

              {/* Venue / Lugar (CRITICAL FIELD) */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-2">
                <label className="block text-amber-950 font-black flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" /> Lugar / Escenario Deportivo en Sabaneta:
                </label>
                <select
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                >
                  {currentSport.scenarios?.map(sc => (
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
                    placeholder="Escribe el nombre del escenario o dirección..."
                    value={formData.customVenue}
                    onChange={(e) => setFormData({ ...formData, customVenue: e.target.value })}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-medium text-slate-900 mt-2"
                  />
                )}
              </div>

              {/* Teams Matchup (Team A vs Team B) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Equipo A (JAC Local):
                  </label>
                  <select
                    value={formData.teamAJacId}
                    onChange={(e) => setFormData({ ...formData, teamAJacId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  >
                    <option value="">-- Seleccionar JAC A --</option>
                    {jacs.map(j => {
                      const isRegistered = sportRegistrations.some(r => r.jacId === j.id);
                      return (
                        <option key={j.id} value={j.id}>
                          {j.name} {isRegistered ? '✓' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Equipo B (JAC Visitante):
                  </label>
                  <select
                    value={formData.teamBJacId}
                    onChange={(e) => setFormData({ ...formData, teamBJacId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  >
                    <option value="">-- Seleccionar JAC B --</option>
                    {jacs.map(j => {
                      const isRegistered = sportRegistrations.some(r => r.jacId === j.id);
                      return (
                        <option key={j.id} value={j.id}>
                          {j.name} {isRegistered ? '✓' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Estado Inicial:
                </label>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  {editingMatch ? 'Guardar Cambios de Programación' : 'Programar Encuentro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: REGISTRAR MARCADOR Y RESULTADO                    */}
      {/* ========================================================= */}
      {scoringMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  Control de Resultados
                </span>
                <h3 className="text-base font-black">
                  Registrar Marcador: {currentSport.name}
                </h3>
              </div>
              <button
                onClick={() => setScoringMatch(null)}
                className="text-white/70 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  {scoringMatch.round} • {scoringMatch.venue}
                </span>
                <span className="text-xs font-mono text-slate-600 font-bold">
                  {scoringMatch.date} • {scoringMatch.time}
                </span>
              </div>

              {/* Score inputs */}
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

              {/* Status */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Estado del Partido:
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                >
                  <option value="Pendiente">Pendiente (Por Jugar)</option>
                  <option value="En Vivo">En Vivo (Jugándose Ahora)</option>
                  <option value="Finalizado">Finalizado (Oficial)</option>
                </select>
              </div>

              {/* Winner Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Ganador Declarado:
                </label>
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

              {/* Buttons */}
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  Guardar Resultado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: IMPRESIÓN OFICIAL DEL FIXTURE DE LUGAR Y HORA    */}
      {/* ========================================================= */}
      {isPrintScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print">
              <span className="font-bold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" /> Vista Previa de Impresión: Programación Oficial
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs cursor-pointer shadow-sm active:scale-95"
                >
                  <Printer className="w-4 h-4" /> Imprimir en Físico / PDF
                </button>
                <button
                  onClick={() => setIsPrintScheduleOpen(false)}
                  className="text-white/70 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 bg-white text-slate-900 font-sans print:p-0 print:m-0" id="official-schedule-sheet">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                  República de Colombia • Municipio de Sabaneta
                </div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight my-1">
                  JUEGOS ASOCOMUNALES SABANETA 2026
                </h1>
                <div className="text-xs font-semibold text-slate-700">
                  Boletín Oficial de Programación de Canchas, Sedes y Horarios
                </div>
                <div className="inline-block mt-2 px-3 py-1 bg-slate-100 border border-slate-300 rounded font-black text-xs uppercase tracking-wide">
                  Disciplina: {currentSport.name} {currentSport.officialDates ? `• Fechas: ${currentSport.officialDates}` : ''}
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-xs border border-slate-300 border-collapse mb-6">
                <thead>
                  <tr className="bg-slate-200/80 text-slate-800 font-bold uppercase text-[10px]">
                    <th className="border border-slate-300 px-2 py-2 text-center w-8">#</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-24">Fecha</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-16">Hora</th>
                    <th className="border border-slate-300 px-3 py-2">Lugar / Escenario</th>
                    <th className="border border-slate-300 px-2 py-2">Fase / Rama</th>
                    <th className="border border-slate-300 px-3 py-2">Equipo A (JAC)</th>
                    <th className="border border-slate-300 px-2 py-2 text-center w-14">Marcador</th>
                    <th className="border border-slate-300 px-3 py-2">Equipo B (JAC)</th>
                    <th className="border border-slate-300 px-3 py-2 w-24 text-center">Firma Mesa</th>
                  </tr>
                </thead>
                <tbody>
                  {sportMatches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border border-slate-300 p-6 text-center text-slate-500">
                        No hay encuentros programados en el sistema para esta disciplina deportiva.
                      </td>
                    </tr>
                  ) : (
                    sportMatches.map((m, idx) => (
                      <tr key={m.id} className="border-b border-slate-200">
                        <td className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-500">
                          {idx + 1}
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
                        <td className="border border-slate-300 px-2 py-2 text-[11px] text-slate-700">
                          {m.round} ({m.branch})
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
                        <td className="border border-slate-300 px-3 py-2"></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 mt-12 pt-6 border-t border-slate-300 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 mb-2 w-48 mx-auto h-8" />
                  <span className="font-bold text-slate-900 block">Coordinador de Escenarios</span>
                  <span className="text-slate-500 text-[11px]">INDESA Sabaneta</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 mb-2 w-48 mx-auto h-8" />
                  <span className="font-bold text-slate-900 block">Comité Técnico Asocomunal</span>
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
