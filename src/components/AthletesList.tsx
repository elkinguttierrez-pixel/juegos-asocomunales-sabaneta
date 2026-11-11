import React, { useState, useMemo } from 'react';
import { Athlete, JAC } from '../types';
import { 
  Search, 
  Download, 
  UserCheck, 
  IdCard, 
  Trash2, 
  Plus, 
  Building2, 
  ShieldAlert,
  CheckCircle,
  X
} from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';

interface AthletesListProps {
  athletes: Athlete[];
  jacs: JAC[];
  onDeleteAthlete: (id: string) => void;
  onAddAthlete: (athlete: Athlete) => void;
  onSelectAthleteForCard: (athlete: Athlete) => void;
}

export const AthletesList: React.FC<AthletesListProps> = ({
  athletes,
  jacs,
  onDeleteAthlete,
  onAddAthlete,
  onSelectAthleteForCard
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJacFilter, setSelectedJacFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Athlete form state
  const [formData, setFormData] = useState<Partial<Athlete>>({
    fullName: '',
    documentType: 'CC',
    documentNumber: '',
    birthDate: '1995-01-01',
    age: 30,
    gender: 'Masculino',
    phone: '',
    email: '',
    jacId: jacs[0]?.id || '',
    address: '',
    eps: 'SURA EPS',
    emergencyContactName: '',
    emergencyContactPhone: '',
    verifiedResidency: true
  });

  const filteredAthletes = useMemo(() => {
    return athletes.filter((ath) => {
      const matchSearch =
        ath.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ath.documentNumber.includes(searchTerm) ||
        (ath.phone && ath.phone.includes(searchTerm));
      const matchJac = selectedJacFilter === 'all' || ath.jacId === selectedJacFilter;
      const matchGender = genderFilter === 'all' || ath.gender === genderFilter;
      return matchSearch && matchJac && matchGender;
    });
  }, [athletes, searchTerm, selectedJacFilter, genderFilter]);

  const getJacName = (jacId: string) => {
    return jacs.find(j => j.id === jacId)?.name || 'JAC no asignada';
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const dataToExport = filteredAthletes.map(a => ({
      'ID': a.id,
      'Nombres y Apellidos': a.fullName,
      'Talla Uniforme': a.talla || 'M',
      'Tipo Doc': a.documentType,
      'No. Documento': a.documentNumber,
      'Género': a.gender,
      'Edad': a.age,
      'Fecha Nacimiento': a.birthDate,
      'JAC Sabaneta': getJacName(a.jacId),
      'Dirección': a.address,
      'Teléfono': a.phone,
      'EPS': a.eps,
      'Contacto Emergencia': a.emergencyContactName,
      'Teléfono Emergencia': a.emergencyContactPhone,
      'Vecindad Verificada': a.verifiedResidency ? 'SÍ' : 'PENDIENTE',
      'Fecha Registro': a.createdAt
    }));

    exportToExcel(dataToExport, 'Deportistas Sabaneta', `Deportistas_Asocomunales_Sabaneta_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.documentNumber || !formData.jacId) return;

    // Calculate age if birthDate provided
    let calculatedAge = 25;
    if (formData.birthDate) {
      const birth = new Date(formData.birthDate);
      calculatedAge = new Date().getFullYear() - birth.getFullYear();
    }

    const newAthlete: Athlete = {
      id: `ath-${Date.now()}`,
      fullName: formData.fullName.trim(),
      documentType: formData.documentType as any || 'CC',
      documentNumber: formData.documentNumber.trim(),
      birthDate: formData.birthDate || '1995-01-01',
      age: calculatedAge,
      gender: formData.gender as any || 'Masculino',
      phone: formData.phone || '',
      email: formData.email || '',
      jacId: formData.jacId,
      address: formData.address || '',
      eps: formData.eps || 'SURA EPS',
      emergencyContactName: formData.emergencyContactName || '',
      emergencyContactPhone: formData.emergencyContactPhone || '',
      verifiedResidency: formData.verifiedResidency ?? true,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    onAddAthlete(newAthlete);
    setShowAddModal(false);
    setFormData({
      fullName: '',
      documentType: 'CC',
      documentNumber: '',
      birthDate: '1995-01-01',
      age: 30,
      gender: 'Masculino',
      phone: '',
      email: '',
      jacId: jacs[0]?.id || '',
      address: '',
      eps: 'SURA EPS',
      emergencyContactName: '',
      emergencyContactPhone: '',
      verifiedResidency: true
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Censo Oficial de Deportistas Comunales
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Base de Datos de Deportistas de Sabaneta
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Registro centralizado de deportistas afiliados a las Juntas de Acción Comunal de Sabaneta. Consulta cédula, EPS, vecindad y genera carnets oficiales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" /> Exportar Excel
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nuevo Deportista
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* JAC Filter */}
          <div className="relative">
            <select
              value={selectedJacFilter}
              onChange={(e) => setSelectedJacFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las JACs ({jacs.length})</option>
              {jacs.map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="relative">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los Géneros</option>
              <option value="Masculino">♂️ Masculino</option>
              <option value="Femenino">♀️ Femenino</option>
            </select>
          </div>

          {/* Counter info */}
          <div className="flex items-center justify-end px-3 text-xs text-slate-500 font-semibold">
            <span>Mostrando: <strong>{filteredAthletes.length}</strong> de {athletes.length}</span>
          </div>
        </div>
      </div>

      {/* Athletes Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Deportista</th>
                <th className="px-3 py-3">Documento</th>
                <th className="px-3 py-3">JAC Representada</th>
                <th className="px-3 py-3">Género / Edad</th>
                <th className="px-3 py-3">EPS</th>
                <th className="px-3 py-3">Contacto</th>
                <th className="px-3 py-3 text-center">Vecindad</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAthletes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron deportistas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAthletes.map((ath) => (
                  <tr key={ath.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{ath.fullName}</span>
                        {ath.talla && (
                          <span className="text-[10px] bg-slate-100 font-extrabold px-1.5 py-0.5 rounded text-emerald-800 border border-slate-200">
                            {ath.talla}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{ath.address || 'Sabaneta'}</div>
                    </td>
                    <td className="px-3 py-3 font-mono font-medium text-slate-700">
                      <span className="text-[10px] text-slate-400 mr-1">{ath.documentType}</span>
                      {ath.documentNumber}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Building2 className="w-3 h-3 text-emerald-600" />
                        {getJacName(ath.jacId)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-700">{ath.gender}</div>
                      <div className="text-[11px] text-slate-400">{ath.age} años</div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-700">
                      {ath.eps}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-slate-800">{ath.phone || 'Sin tel'}</div>
                      <div className="text-[10px] text-slate-400">Emerg: {ath.emergencyContactName || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {ath.verifiedResidency ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3 h-3" /> Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          <ShieldAlert className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectAthleteForCard(ath)}
                          title="Generar Carnet Oficial"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        >
                          <IdCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteAthlete(ath.id)}
                          title="Eliminar deportista"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Athlete Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-800">
                Registrar Nuevo Deportista
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombres y Apellidos *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ej. Andrés Camilo Morales Ruiz"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo Doc *
                  </label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-medium text-slate-800"
                  >
                    <option value="CC">C.C.</option>
                    <option value="TI">T.I.</option>
                    <option value="CE">C.E.</option>
                    <option value="PAS">PAS</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    placeholder="Ej. 1037654321"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    JAC Sabaneta *
                  </label>
                  <select
                    value={formData.jacId}
                    onChange={(e) => setFormData({ ...formData, jacId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {jacs.map(j => (
                      <option key={j.id} value={j.id}>{j.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Género *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="Masculino">♂️ Masculino</option>
                    <option value="Femenino">♀️ Femenino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    EPS *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.eps}
                    onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                    placeholder="Ej. SURA EPS"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej. 310 123 4567"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dirección en Sabaneta
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ej. Calle 75 Sur # 45-12"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contacto Emergencia
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="Nombre familiar"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono Emergencia
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="Teléfono familiar"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Guardar Deportista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
