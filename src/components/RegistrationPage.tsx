import React, { useState } from 'react';
import { JAC, Athlete, SportRegistration, SportBranch } from '../types';
import { RegistrationForm } from './RegistrationForm';
import { RegistrationsList } from './RegistrationsList';
import { AthletesList } from './AthletesList';
import { JACDirectory } from './JACDirectory';
import { 
  UserPlus, 
  FileSpreadsheet, 
  Users, 
  Building2, 
  Sparkles,
  Download
} from 'lucide-react';

interface RegistrationPageProps {
  jacs: JAC[];
  athletes: Athlete[];
  registrations: SportRegistration[];
  onSaveRegistration: (newReg: SportRegistration, newAthletes: Athlete[]) => void;
  onDeleteRegistration: (id: string) => void;
  onAddAthlete: (athlete: Athlete) => void;
  onDeleteAthlete: (id: string) => void;
  onAddJAC: (jac: JAC) => void;
  onUpdateJAC: (jac: JAC) => void;
  onOpenPrintModal: (reg: SportRegistration) => void;
  onSelectAthleteForCard: (ath: Athlete) => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({
  jacs,
  athletes,
  registrations,
  onSaveRegistration,
  onDeleteRegistration,
  onAddAthlete,
  onDeleteAthlete,
  onAddJAC,
  onUpdateJAC,
  onOpenPrintModal,
  onSelectAthleteForCard
}) => {
  const [subTab, setSubTab] = useState<'form' | 'rosters' | 'athletes' | 'jacs'>('rosters');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              Módulo de Inscripciones y Acreditaciones Oficiales
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Inscripción, Planillas y Censo de Atletas
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Registra nuevas planillas de juego, consulta las nóminas oficiales con tallas de uniforme, expide carnets con código QR y administra las delegaciones comunales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubTab('form')}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Inscribir Nueva Planilla
            </button>
          </div>
        </div>
      </div>

      {/* Subtabs Selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('rosters')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
            subTab === 'rosters'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Planillas Oficiales ({registrations.length})</span>
        </button>

        <button
          onClick={() => setSubTab('athletes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
            subTab === 'athletes'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Base de Deportistas & Carnets ({athletes.length})</span>
        </button>

        <button
          onClick={() => setSubTab('form')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
            subTab === 'form'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Formulario de Inscripción</span>
        </button>

        <button
          onClick={() => setSubTab('jacs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
            subTab === 'jacs'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Directorio de JACs ({jacs.length})</span>
        </button>
      </div>

      {/* Subtab Content */}
      <div>
        {subTab === 'rosters' && (
          <RegistrationsList
            registrations={registrations}
            jacs={jacs}
            onDeleteRegistration={onDeleteRegistration}
            onOpenPrintModal={onOpenPrintModal}
          />
        )}

        {subTab === 'athletes' && (
          <AthletesList
            athletes={athletes}
            jacs={jacs}
            onDeleteAthlete={onDeleteAthlete}
            onAddAthlete={onAddAthlete}
            onSelectAthleteForCard={onSelectAthleteForCard}
          />
        )}

        {subTab === 'form' && (
          <RegistrationForm
            jacs={jacs}
            athletes={athletes}
            onSaveRegistration={(reg, newAths) => {
              onSaveRegistration(reg, newAths);
              setSubTab('rosters');
            }}
            onOpenPrintModal={onOpenPrintModal}
          />
        )}

        {subTab === 'jacs' && (
          <JACDirectory
            jacs={jacs}
            athletes={athletes}
            registrations={registrations}
            onAddJAC={onAddJAC}
            onUpdateJAC={onUpdateJAC}
          />
        )}
      </div>
    </div>
  );
};
