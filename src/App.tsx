import React, { useState, useEffect } from 'react';
import { 
  getStoredJACs, 
  saveJACs, 
  getStoredAthletes, 
  saveAthletes, 
  getStoredRegistrations, 
  saveRegistrations, 
  getStoredMatches, 
  saveMatches,
  exportAllDataJSON,
  resetToInitialData,
  loadFullSimulationDatabase
} from './utils/storage';
import { realtime } from './services/realtime';
import { JAC, Athlete, SportRegistration, MatchSchedule, SportBranch } from './types';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { MedalTable } from './components/MedalTable';
import { SchedulePage } from './components/SchedulePage';
import { RegistrationPage } from './components/RegistrationPage';
import { SingleSportView } from './components/SingleSportView';
import { JACActiveSports } from './components/JACActiveSports';
import { PrintRosterModal } from './components/PrintRosterModal';
import { AthleteCardModal } from './components/AthleteCardModal';

export function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('asocomunales_active_tab') || 'inicio';
    if (saved === 'medals') return 'medalleria';
    if (saved === 'by-sport' || saved === 'fixture' || saved === 'sports') return 'por-deporte';
    if (saved === 'jac-active') return 'por-junta';
    if (saved === 'registrations-list' || saved === 'athletes' || saved === 'jacs' || saved === 'registration') return 'inscripcion';
    return saved;
  });
  const [activeSportDetailId, setActiveSportDetailId] = useState<string>('domino');
  const [jacs, setJacs] = useState<JAC[]>(getStoredJACs);
  const [athletes, setAthletes] = useState<Athlete[]>(getStoredAthletes);
  const [registrations, setRegistrations] = useState<SportRegistration[]>(getStoredRegistrations);
  const [matches, setMatches] = useState<MatchSchedule[]>(getStoredMatches);
  const [isCoordinator, setIsCoordinator] = useState<boolean>(() => realtime.isCoordinatorLoggedIn());

  // Real-time synchronization subscriptions
  useEffect(() => {
    // 1. Initial full state from server
    const unsubInit = realtime.onInitData((state) => {
      if (state.matches !== undefined) {
        setMatches(state.matches);
        saveMatches(state.matches);
      }
      if (state.registrations && state.registrations.length > 0) {
        setRegistrations(state.registrations);
        saveRegistrations(state.registrations);
      }
      if (state.athletes && state.athletes.length > 0) {
        setAthletes(state.athletes);
        saveAthletes(state.athletes);
      }
      if (state.jacs && state.jacs.length > 0) {
        setJacs(state.jacs);
        saveJACs(state.jacs);
      }
    });

    // 2. Real-time match created by any coordinator
    const unsubCreated = realtime.onMatchCreated((newMatch) => {
      setMatches(prev => {
        const exists = prev.some(m => m.id === newMatch.id);
        const updated = exists ? prev : [newMatch, ...prev];
        saveMatches(updated);
        return updated;
      });
    });

    // 3. Real-time match schedule or score updated
    const unsubUpdated = realtime.onMatchUpdated((updatedMatch) => {
      setMatches(prev => {
        const updated = prev.map(m => m.id === updatedMatch.id ? updatedMatch : m);
        saveMatches(updated);
        return updated;
      });
    });

    // 4. Real-time match deleted
    const unsubDeleted = realtime.onMatchDeleted((deletedId) => {
      setMatches(prev => {
        const updated = prev.filter(m => m.id !== deletedId);
        saveMatches(updated);
        return updated;
      });
    });

    return () => {
      unsubInit();
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, []);

  // Modals state
  const [selectedRosterToPrint, setSelectedRosterToPrint] = useState<SportRegistration | null>(null);
  const [selectedAthleteForCard, setSelectedAthleteForCard] = useState<Athlete | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('asocomunales_active_tab', tab);
  };

  // Save changes to storage
  const handleSaveRegistration = (newReg: SportRegistration, newAthletes: Athlete[]) => {
    const updatedRegs = [newReg, ...registrations];
    setRegistrations(updatedRegs);
    saveRegistrations(updatedRegs);

    if (newAthletes.length > 0) {
      const updatedAthletes = [...newAthletes, ...athletes];
      setAthletes(updatedAthletes);
      saveAthletes(updatedAthletes);
    }
  };

  const handleDeleteRegistration = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta planilla de inscripción?')) {
      const updated = registrations.filter(r => r.id !== id);
      setRegistrations(updated);
      saveRegistrations(updated);
    }
  };

  const handleAddAthlete = (newAthlete: Athlete) => {
    const updated = [newAthlete, ...athletes];
    setAthletes(updated);
    saveAthletes(updated);
  };

  const handleDeleteAthlete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este deportista del censo?')) {
      const updated = athletes.filter(a => a.id !== id);
      setAthletes(updated);
      saveAthletes(updated);
    }
  };

  const handleAddJAC = (newJac: JAC) => {
    const updated = [...jacs, newJac];
    setJacs(updated);
    saveJACs(updated);
  };

  const handleUpdateJAC = (updatedJac: JAC) => {
    const updated = jacs.map(j => j.id === updatedJac.id ? updatedJac : j);
    setJacs(updated);
    saveJACs(updated);
  };

  const handleAddMatch = (newMatch: MatchSchedule) => {
    const updated = [newMatch, ...matches];
    setMatches(updated);
    saveMatches(updated);
    // Broadcast via realtime WebSocket
    realtime.createMatch(newMatch);
  };

  const handleUpdateMatchSchedule = (matchId: string, updates: Partial<MatchSchedule>) => {
    const updated = matches.map(m => m.id === matchId ? { ...m, ...updates } : m);
    setMatches(updated);
    saveMatches(updated);
    const target = updated.find(m => m.id === matchId);
    if (target) {
      realtime.updateMatch(target);
    }
  };

  const handleDeleteMatch = (matchId: string) => {
    if (confirm('¿Estás seguro de eliminar este encuentro programado?')) {
      const updated = matches.filter(m => m.id !== matchId);
      setMatches(updated);
      saveMatches(updated);
      realtime.deleteMatch(matchId);
    }
  };

  const handleUpdateMatchScore = (
    matchId: string, 
    scoreA: number, 
    scoreB: number, 
    status: 'Pendiente' | 'En Vivo' | 'Finalizado',
    winnerJacId?: string
  ) => {
    const updated = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          teamA: { ...m.teamA, score: scoreA },
          teamB: { ...m.teamB, score: scoreB },
          status,
          winnerJacId
        };
      }
      return m;
    });
    setMatches(updated);
    saveMatches(updated);
    // Broadcast score and live status in real time
    realtime.scoreMatch(matchId, scoreA, scoreB, status, winnerJacId);
  };

  const handleSelectSportForRegistration = (_sportId: string, _branch: SportBranch) => {
    setActiveTab('registration');
  };

  const handleResetData = () => {
    if (confirm('¿Deseas restaurar la base de datos oficial completa de los Juegos (357 deportistas, 71 planillas oficiales)?')) {
      resetToInitialData();
      setJacs(getStoredJACs());
      setAthletes(getStoredAthletes());
      setRegistrations(getStoredRegistrations());
      setMatches(getStoredMatches());
      alert('¡Base de datos oficial restablecida exitosamente!');
    }
  };

  const handleLoadSimulation = () => {
    if (confirm('¿Deseas recargar la base de datos oficial 2026 (357 deportistas, 71 planillas oficiales)?')) {
      loadFullSimulationDatabase();
      setJacs(getStoredJACs());
      setAthletes(getStoredAthletes());
      setRegistrations(getStoredRegistrations());
      setMatches(getStoredMatches());
      alert('¡Base de datos oficial de los Juegos cargada exitosamente! Se han sincronizado los 357 deportistas y 71 planillas.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        stats={{
          athletesCount: athletes.length,
          registrationsCount: registrations.length,
          jacsCount: jacs.length
        }}
        onExportBackup={exportAllDataJSON}
        onLoadSimulation={handleLoadSimulation}
        isCoordinator={isCoordinator}
        setIsCoordinator={setIsCoordinator}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        {/* PÁGINA 1: INICIO (Dashboard General & Resumen) */}
        {activeTab === 'inicio' && (
          <HomePage
            jacs={jacs}
            registrations={registrations}
            matches={matches}
            athletes={athletes}
            onNavigate={handleTabChange}
          />
        )}

        {/* PÁGINA 2: MEDALLERÍA Y CUADRO DE HONOR (Dedicada) */}
        {activeTab === 'medalleria' && (
          <MedalTable
            jacs={jacs}
            registrations={registrations}
            matches={matches}
            athletes={athletes}
          />
        )}

        {/* PÁGINA 3: PARA PROGRAMAR (Lugar, Fecha y Hora) */}
        {activeTab === 'programar' && (
          <SchedulePage
            matches={matches}
            jacs={jacs}
            registrations={registrations}
            onAddMatch={handleAddMatch}
            onUpdateMatchSchedule={handleUpdateMatchSchedule}
            onUpdateMatchScore={handleUpdateMatchScore}
            onDeleteMatch={handleDeleteMatch}
          />
        )}

        {/* PÁGINA 3: INSCRIPCIÓN & PLANILLAS */}
        {activeTab === 'inscripcion' && (
          <RegistrationPage
            jacs={jacs}
            athletes={athletes}
            registrations={registrations}
            onSaveRegistration={handleSaveRegistration}
            onDeleteRegistration={handleDeleteRegistration}
            onAddAthlete={handleAddAthlete}
            onDeleteAthlete={handleDeleteAthlete}
            onAddJAC={handleAddJAC}
            onUpdateJAC={handleUpdateJAC}
            onOpenPrintModal={(reg) => setSelectedRosterToPrint(reg)}
            onSelectAthleteForCard={(ath) => setSelectedAthleteForCard(ath)}
          />
        )}

        {/* PÁGINA 4: PROGRAMACIÓN Y RESULTADOS POR DEPORTE */}
        {activeTab === 'por-deporte' && (
          <SingleSportView
            initialSportId={activeSportDetailId}
            registrations={registrations}
            matches={matches}
            jacs={jacs}
            athletes={athletes}
            onOpenPrintModal={(reg) => setSelectedRosterToPrint(reg)}
            onSelectAthleteForCard={(ath) => setSelectedAthleteForCard(ath)}
            onGoToRegistration={(_sportId, _branch) => {
              setActiveTab('inscripcion');
            }}
            onUpdateMatchScore={handleUpdateMatchScore}
            onAddMatch={handleAddMatch}
            onUpdateMatchSchedule={handleUpdateMatchSchedule}
            onDeleteMatch={handleDeleteMatch}
          />
        )}

        {/* PÁGINA 5: PROGRAMACIÓN Y RESULTADOS POR JUNTA (JAC) */}
        {activeTab === 'por-junta' && (
          <JACActiveSports
            matches={matches}
            jacs={jacs}
            registrations={registrations}
          />
        )}
      </main>

      {/* Modals */}
      <PrintRosterModal
        registration={selectedRosterToPrint}
        jacs={jacs}
        onClose={() => setSelectedRosterToPrint(null)}
      />

      <AthleteCardModal
        athlete={selectedAthleteForCard}
        jacs={jacs}
        onClose={() => setSelectedAthleteForCard(null)}
      />

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Juegos Asocomunales de Sabaneta</span>
            <span>•</span>
            <span>Unidos por el deporte comunal</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-red-600 transition cursor-pointer"
            >
              Vaciar y Reiniciar Sistema a Cero
            </button>
            <span>•</span>
            <span>ASOCOMUNAL Sabaneta & INDESA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
