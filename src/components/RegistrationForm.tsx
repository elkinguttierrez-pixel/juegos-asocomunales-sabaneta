import React, { useState, useMemo } from 'react';
import { 
  OFFICIAL_SPORTS 
} from '../data/initialData';
import { 
  JAC, 
  Athlete, 
  SportConfig, 
  SportBranch, 
  SportRegistration, 
  TeamMember 
} from '../types';
import { 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Shield, 
  Printer, 
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';

interface RegistrationFormProps {
  jacs: JAC[];
  athletes: Athlete[];
  onSaveRegistration: (registration: SportRegistration, newAthletes: Athlete[]) => void;
  onOpenPrintModal?: (reg: SportRegistration) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  jacs,
  athletes,
  onSaveRegistration,
  onOpenPrintModal
}) => {
  // Step 1: Sport and Branch Selection
  const [selectedSportId, setSelectedSportId] = useState<string>('futbol-de-salon');
  const [selectedBranch, setSelectedBranch] = useState<SportBranch>('Masculino');
  const [selectedJacId, setSelectedJacId] = useState<string>(jacs[0]?.id || '');

  // Step 2: Team/General Info
  const [teamName, setTeamName] = useState<string>('');
  const [delegateName, setDelegateName] = useState<string>('');
  const [delegatePhone, setDelegatePhone] = useState<string>('');
  const [uniformPrimaryColor, setUniformPrimaryColor] = useState<string>('');
  const [uniformSecondaryColor, setUniformSecondaryColor] = useState<string>('');
  const [selectedModality, setSelectedModality] = useState<string>('');

  // Step 3: Members / Athletes in this registration
  const [members, setMembers] = useState<TeamMember[]>([
    {
      fullName: '',
      documentType: 'CC',
      documentNumber: '',
      dorsal: 1,
      position: '',
      gender: 'Masculino',
      eps: 'SURA EPS',
      phone: ''
    }
  ]);

  // UI state
  const [submittedReg, setSubmittedReg] = useState<SportRegistration | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Selected sport configuration
  const currentSport = useMemo(() => {
    return OFFICIAL_SPORTS.find(s => s.id === selectedSportId) || OFFICIAL_SPORTS[0];
  }, [selectedSportId]);

  // Auto-adjust branch if current sport doesn't support selected branch
  const handleSportChange = (sport: SportConfig) => {
    setSelectedSportId(sport.id);
    if (!sport.branches.includes(selectedBranch)) {
      setSelectedBranch(sport.branches[0]);
    }
    if (sport.modalities && sport.modalities.length > 0) {
      setSelectedModality(sport.modalities[0]);
    } else {
      setSelectedModality('');
    }
    // Pre-populate sensible number of members
    const initialCount = Math.max(1, sport.minPlayers || 1);
    const initialMembers: TeamMember[] = Array.from({ length: initialCount }, (_, index) => ({
      fullName: '',
      documentType: 'CC',
      documentNumber: '',
      dorsal: index + 1,
      position: sport.positions ? sport.positions[index % sport.positions.length] : '',
      gender: selectedBranch === 'Femenino' ? 'Femenino' : 'Masculino',
      eps: 'SURA EPS',
      phone: ''
    }));
    setMembers(initialMembers);
    setSubmittedReg(null);
  };

  const handleBranchChange = (branch: SportBranch) => {
    setSelectedBranch(branch);
    // update default gender on members
    if (branch === 'Masculino' || branch === 'Femenino') {
      setMembers(prev => prev.map(m => ({ ...m, gender: branch })));
    }
  };

  // Existing athletes of the selected JAC for quick autofill
  const jacAthletes = useMemo(() => {
    return athletes.filter(a => a.jacId === selectedJacId);
  }, [athletes, selectedJacId]);

  // Autofill delegate if JAC has president
  const handleJacChange = (id: string) => {
    setSelectedJacId(id);
    const jac = jacs.find(j => j.id === id);
    if (jac && !delegateName) {
      setDelegateName(jac.president);
      setDelegatePhone(jac.phone);
    }
  };

  // Add a new member row
  const addMemberRow = () => {
    if (members.length >= currentSport.maxPlayers) {
      setFormError(`El cupo máximo para ${currentSport.name} es de ${currentSport.maxPlayers} participantes.`);
      return;
    }
    setFormError(null);
    setMembers([
      ...members,
      {
        fullName: '',
        documentType: 'CC',
        documentNumber: '',
        dorsal: members.length + 1,
        position: currentSport.positions ? currentSport.positions[members.length % currentSport.positions.length] : '',
        gender: selectedBranch === 'Femenino' ? 'Femenino' : selectedBranch === 'Masculino' ? 'Masculino' : (members.length % 2 === 0 ? 'Masculino' : 'Femenino'),
        eps: 'SURA EPS',
        phone: ''
      }
    ]);
  };

  // Remove member row
  const removeMemberRow = (index: number) => {
    if (members.length <= currentSport.minPlayers) {
      setFormError(`Se requiere un mínimo de ${currentSport.minPlayers} participantes para ${currentSport.name}.`);
      return;
    }
    setFormError(null);
    setMembers(members.filter((_, i) => i !== index));
  };

  // Update specific member
  const updateMember = (index: number, field: keyof TeamMember, value: any) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  // Autofill member from existing JAC athlete
  const handleAutofillMember = (index: number, athleteId: string) => {
    const ath = athletes.find(a => a.id === athleteId);
    if (!ath) return;
    const updated = [...members];
    updated[index] = {
      ...updated[index],
      athleteId: ath.id,
      fullName: ath.fullName,
      documentType: ath.documentType,
      documentNumber: ath.documentNumber,
      gender: ath.gender,
      eps: ath.eps,
      phone: ath.phone
    };
    setMembers(updated);
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!selectedJacId) {
      setFormError('Por favor seleccione la Junta de Acción Comunal (JAC) participante.');
      return;
    }

    if (members.length < currentSport.minPlayers) {
      setFormError(`Debe registrar mínimo ${currentSport.minPlayers} integrante(s) para ${currentSport.name}.`);
      return;
    }

    // Check if members have name and document
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.fullName.trim() || !m.documentNumber.trim()) {
        setFormError(`El integrante #${i + 1} no tiene nombre completo o documento de identidad.`);
        return;
      }
    }

    // Special validation for Mixed sports (Voleibol / Danza Folclórica / Rana Mixta)
    if (selectedBranch === 'Mixto') {
      const males = members.filter(m => m.gender === 'Masculino').length;
      const females = members.filter(m => m.gender === 'Femenino').length;
      if (currentSport.id === 'voleibol' && (females < 2 || males < 1)) {
        setFormError('En Voleibol Mixto la planilla debe incluir obligatoriamente tanto hombres como mujeres (mínimo 2 mujeres).');
        return;
      }
    }

    const regId = `reg-${Date.now()}`;
    const selectedJac = jacs.find(j => j.id === selectedJacId);
    
    // Create registration object
    const newRegistration: SportRegistration = {
      id: regId,
      sportId: currentSport.id,
      sportName: currentSport.name,
      branch: selectedBranch,
      jacId: selectedJacId,
      teamName: teamName.trim() || `${selectedJac?.name || 'JAC'} - ${currentSport.name}`,
      delegateName: delegateName.trim() || selectedJac?.president || 'Delegado Comunal',
      delegatePhone: delegatePhone.trim() || selectedJac?.phone || '',
      uniformPrimaryColor: uniformPrimaryColor.trim() || undefined,
      uniformSecondaryColor: uniformSecondaryColor.trim() || undefined,
      modalityDetail: selectedModality || undefined,
      members: members.map(m => ({ ...m })),
      registeredAt: new Date().toISOString().slice(0, 10),
      status: 'Aprobado'
    };

    // Auto-create/sync athletes into general athlete database
    const newAthletesToAdd: Athlete[] = [];
    members.forEach((m) => {
      const exists = athletes.some(a => a.documentNumber === m.documentNumber);
      if (!exists && m.fullName.trim()) {
        newAthletesToAdd.push({
          id: `ath-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          fullName: m.fullName.trim(),
          documentType: m.documentType,
          documentNumber: m.documentNumber.trim(),
          birthDate: '1995-01-01',
          age: 30,
          gender: m.gender,
          phone: m.phone || delegatePhone,
          jacId: selectedJacId,
          address: selectedJac?.name || 'Sabaneta',
          eps: m.eps || 'SURA EPS',
          emergencyContactName: delegateName || 'Delegado JAC',
          emergencyContactPhone: delegatePhone || '',
          verifiedResidency: true,
          createdAt: new Date().toISOString().slice(0, 10)
        });
      }
    });

    onSaveRegistration(newRegistration, newAthletesToAdd);
    setSubmittedReg(newRegistration);

    // Launch celebratory confetti
    import('canvas-confetti')
      .then(module => {
        module.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      })
      .catch(() => {});
  };

  const handleResetForm = () => {
    setSubmittedReg(null);
    setTeamName('');
    handleSportChange(currentSport);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Inscripciones Oficiales Juegos Asocomunales Sabaneta
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Formulario de Inscripción por Deporte
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              Diligencia la planilla oficial de inscripción para tu Junta de Acción Comunal. El sistema valida las ramas autorizadas (Masculino, Femenino y Mixto) y genera automáticamente la planilla imprimible y los carnets deportivos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
              Vigencia 2026
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification if just registered */}
      {submittedReg && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 shadow-md transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-900">
                  ¡Inscripción Exitosa en {submittedReg.sportName} ({submittedReg.branch})!
                </h3>
                <p className="text-sm text-emerald-700">
                  Equipo/Participante: <strong className="font-semibold">{submittedReg.teamName}</strong> ({submittedReg.members.length} deportistas registrados).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onOpenPrintModal && (
                <button
                  type="button"
                  onClick={() => onOpenPrintModal(submittedReg)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Imprimir Planilla
                </button>
              )}
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer"
              >
                Inscribir Otro Deporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: SPORT SELECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Selecciona el Deporte y la Rama
              </h3>
              <p className="text-xs text-slate-500">
                Los 11 deportes oficiales de los Juegos Asocomunales de Sabaneta
              </p>
            </div>
          </div>

          {/* Sports Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mb-5">
            {OFFICIAL_SPORTS.map((sport) => {
              const isSelected = sport.id === selectedSportId;
              return (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => handleSportChange(sport)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {sport.type === 'conjunto' ? 'Equipo' : sport.type === 'cultural' ? 'Cultural' : 'Individual/Dupla'}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 leading-snug">
                      {sport.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {sport.branches.join(', ')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Branch & Modality Selector */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rama / Género Autorizado
              </label>
              <div className="flex items-center gap-2">
                {currentSport.branches.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleBranchChange(b)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedBranch === b
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {b === 'Masculino' ? '♂️ Masculino' : b === 'Femenino' ? '♀️ Femenino' : '⚧️ Mixto'}
                  </button>
                ))}
              </div>
            </div>

            {currentSport.modalities && currentSport.modalities.length > 0 && (
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Modalidad Específica
                </label>
                <select
                  value={selectedModality}
                  onChange={(e) => setSelectedModality(e.target.value)}
                  className="w-full sm:w-64 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {currentSport.modalities.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Sport rule alert */}
          {currentSport.rulesNotes && (
            <div className="mt-3 flex items-start gap-2 text-xs text-amber-800 bg-amber-50/70 border border-amber-200 rounded-lg p-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Reglamento técnico:</strong> {currentSport.rulesNotes} (Mínimo {currentSport.minPlayers} y máximo {currentSport.maxPlayers} participantes).
              </span>
            </div>
          )}
        </div>

        {/* STEP 2: JAC AND TEAM DATA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Junta de Acción Comunal (JAC) y Delegación
              </h3>
              <p className="text-xs text-slate-500">
                Selecciona la junta de Sabaneta a la que representa y el delegado responsable
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* JAC Selector */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                JAC Participante *
              </label>
              <div className="relative">
                <select
                  value={selectedJacId}
                  onChange={(e) => handleJacChange(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="" disabled>-- Selecciona una JAC --</option>
                  {jacs.map((jac) => (
                    <option key={jac.id} value={jac.id}>
                      {jac.name} ({jac.sector})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Total {jacs.length} Juntas de Acción Comunal reconocidas en Sabaneta
              </p>
            </div>

            {/* Team or Representative Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {currentSport.type === 'conjunto' ? 'Nombre del Equipo' : currentSport.type === 'cultural' ? 'Nombre de la Agrupación' : 'Nombre de la Dupla o Representante'}
              </label>
              <input
                type="text"
                placeholder={
                  currentSport.type === 'conjunto'
                    ? 'Ej. Los Titanes de Betania F.S.'
                    : currentSport.type === 'cultural'
                    ? 'Ej. Raíces Comunales Las Lomitas'
                    : 'Ej. Dupla 1 María Auxiliadora'
                }
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Delegate Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Delegado / Director Técnico *
              </label>
              <input
                type="text"
                placeholder="Nombre del delegado oficial"
                value={delegateName}
                onChange={(e) => setDelegateName(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Delegate Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Teléfono / WhatsApp Delegado *
              </label>
              <input
                type="text"
                placeholder="Ej. 310 123 4567"
                value={delegatePhone}
                onChange={(e) => setDelegatePhone(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Uniform Colors (for team sports) */}
            {(currentSport.type === 'conjunto' || currentSport.id === 'voleibol' || currentSport.id === 'futbol-de-salon' || currentSport.id === 'baloncesto') && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Color Camiseta Principal
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Verde Oscuro"
                    value={uniformPrimaryColor}
                    onChange={(e) => setUniformPrimaryColor(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Color Camiseta Alterna
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Blanco / Amarillo"
                    value={uniformSecondaryColor}
                    onChange={(e) => setUniformSecondaryColor(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* STEP 3: DEPORTISTAS / INTEGRANTES DE LA PLANILLA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Planilla de Deportistas ({members.length} / máx {currentSport.maxPlayers})
                </h3>
                <p className="text-xs text-slate-500">
                  Ingresa los datos de los participantes o vincúlalos desde la base de datos de la JAC
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addMemberRow}
                disabled={members.length >= currentSport.maxPlayers}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Deportista
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 w-12 text-center">#</th>
                  {currentSport.type === 'conjunto' && (
                    <th className="px-2 py-2.5 w-16 text-center">Dorsal</th>
                  )}
                  <th className="px-3 py-2.5 min-w-[180px]">Nombres y Apellidos *</th>
                  <th className="px-2 py-2.5 w-20">Tipo</th>
                  <th className="px-3 py-2.5 min-w-[130px]">No. Documento *</th>
                  {selectedBranch === 'Mixto' && (
                    <th className="px-2 py-2.5 w-28">Género</th>
                  )}
                  {currentSport.positions && (
                    <th className="px-3 py-2.5 min-w-[130px]">Posición / Rol</th>
                  )}
                  <th className="px-3 py-2.5 min-w-[120px]">EPS *</th>
                  <th className="px-3 py-2.5 min-w-[110px]">Teléfono</th>
                  <th className="px-2 py-2.5 w-10 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member, index) => (
                  <tr key={index} className="hover:bg-slate-50/70 transition">
                    {/* Index */}
                    <td className="px-3 py-2 text-center font-bold text-slate-500">
                      {index + 1}
                    </td>

                    {/* Dorsal for team sports */}
                    {currentSport.type === 'conjunto' && (
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={member.dorsal || ''}
                          onChange={(e) => updateMember(index, 'dorsal', e.target.value)}
                          className="w-14 text-center font-bold bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-800"
                          placeholder="10"
                        />
                      </td>
                    )}

                    {/* Full Name & JAC athlete autofill */}
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <input
                          type="text"
                          required
                          placeholder="Nombres completos"
                          value={member.fullName}
                          onChange={(e) => updateMember(index, 'fullName', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
                        />
                        {/* Quick pick from JAC if available */}
                        {jacAthletes.length > 0 && !member.fullName && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-700">
                            <span>Sugerencia:</span>
                            <select
                              onChange={(e) => handleAutofillMember(index, e.target.value)}
                              defaultValue=""
                              className="bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 text-[10px]"
                            >
                              <option value="" disabled>-- Elegir de la JAC --</option>
                              {jacAthletes.map(a => (
                                <option key={a.id} value={a.id}>{a.fullName}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Doc Type */}
                    <td className="px-2 py-2">
                      <select
                        value={member.documentType}
                        onChange={(e) => updateMember(index, 'documentType', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-700"
                      >
                        <option value="CC">C.C.</option>
                        <option value="TI">T.I.</option>
                        <option value="CE">C.E.</option>
                        <option value="PAS">PAS</option>
                      </select>
                    </td>

                    {/* Doc Number */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        required
                        placeholder="Número de cédula"
                        value={member.documentNumber}
                        onChange={(e) => updateMember(index, 'documentNumber', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-mono"
                      />
                    </td>

                    {/* Gender (shown for mixed sports) */}
                    {selectedBranch === 'Mixto' && (
                      <td className="px-2 py-2">
                        <select
                          value={member.gender}
                          onChange={(e) => updateMember(index, 'gender', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-700 font-semibold"
                        >
                          <option value="Masculino">♂️ Masculino</option>
                          <option value="Femenino">♀️ Femenino</option>
                        </select>
                      </td>
                    )}

                    {/* Position / Role if applicable */}
                    {currentSport.positions && (
                      <td className="px-3 py-2">
                        <select
                          value={member.position || ''}
                          onChange={(e) => updateMember(index, 'position', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-700"
                        >
                          <option value="">-- Posición --</option>
                          {currentSport.positions.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                    )}

                    {/* EPS */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        required
                        placeholder="Ej. SURA / Nueva EPS"
                        value={member.eps}
                        onChange={(e) => updateMember(index, 'eps', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800"
                      />
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Contacto"
                        value={member.phone || ''}
                        onChange={(e) => updateMember(index, 'phone', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800"
                      />
                    </td>

                    {/* Delete button */}
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeMemberRow(index)}
                        disabled={members.length <= currentSport.minPlayers}
                        title="Eliminar fila"
                        className="text-slate-400 hover:text-red-600 disabled:opacity-20 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Validation Error Message */}
          {formError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>
                Al enviar, los deportistas quedan registrados en la base general de la JAC y protegidos por el seguro comunal.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetForm}
                className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Limpiar
              </button>
              <button
                type="submit"
                className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-700/20 transition-all cursor-pointer"
              >
                <span>Guardar e Inscribir</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
};
