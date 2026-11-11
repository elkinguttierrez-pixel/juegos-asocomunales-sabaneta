import React, { useState, useMemo } from 'react';
import { JAC, Athlete, SportRegistration } from '../types';
import { Building2, Plus, Users, Award, X, Edit2 } from 'lucide-react';

interface JACDirectoryProps {
  jacs: JAC[];
  athletes: Athlete[];
  registrations: SportRegistration[];
  onAddJAC: (jac: JAC) => void;
  onUpdateJAC: (jac: JAC) => void;
}

export const JACDirectory: React.FC<JACDirectoryProps> = ({
  jacs,
  athletes,
  registrations,
  onAddJAC,
  onUpdateJAC
}) => {
  const [filterSector, setFilterSector] = useState<'all' | 'Urbano' | 'Rural'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJac, setEditingJac] = useState<JAC | null>(null);

  // New JAC state
  const [name, setName] = useState('');
  const [sector, setSector] = useState<'Urbano' | 'Rural'>('Urbano');
  const [president, setPresident] = useState('');
  const [phone, setPhone] = useState('');
  const [color, setColor] = useState('#059669');

  const getAthletesCount = (jacId: string) => {
    return athletes.filter(a => a.jacId === jacId).length;
  };

  const getRegistrationsCount = (jacId: string) => {
    return registrations.filter(r => r.jacId === jacId).length;
  };

  const filteredJacs = useMemo(() => {
    return jacs.filter(j => {
      const matchSector = filterSector === 'all' || j.sector === filterSector;
      const matchSearch = j.name.toLowerCase().includes(searchTerm.toLowerCase()) || j.president.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSector && matchSearch;
    });
  }, [jacs, filterSector, searchTerm]);

  const handleSaveJAC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingJac) {
      onUpdateJAC({
        ...editingJac,
        name: name.trim(),
        sector,
        president: president.trim(),
        phone: phone.trim(),
        color
      });
      setEditingJac(null);
    } else {
      const newJac: JAC = {
        id: `jac-${Date.now()}`,
        name: name.trim(),
        sector,
        president: president.trim() || 'Presidente JAC',
        phone: phone.trim() || '',
        color
      };
      onAddJAC(newJac);
    }

    setName('');
    setPresident('');
    setPhone('');
    setShowAddModal(false);
  };

  const openEditModal = (jac: JAC) => {
    setEditingJac(jac);
    setName(jac.name);
    setSector(jac.sector);
    setPresident(jac.president);
    setPhone(jac.phone);
    setColor(jac.color);
    setShowAddModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              Directorio de Organizaciones Comunales
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Juntas de Acción Comunal (JAC) de Sabaneta
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Censo de juntas comunales adscritas a ASOCOMUNAL Sabaneta, divididas por sectores urbanos y veredas rurales, con sus delegados deportivos y representantes legales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingJac(null);
                setName('');
                setPresident('');
                setPhone('');
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Agregar JAC
            </button>
          </div>
        </div>
      </div>

      {/* Filter and stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar JAC o presidente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterSector('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterSector === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({jacs.length})
            </button>
            <button
              onClick={() => setFilterSector('Urbano')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterSector === 'Urbano' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Barrios Urbanos ({jacs.filter(j => j.sector === 'Urbano').length})
            </button>
            <button
              onClick={() => setFilterSector('Rural')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterSector === 'Rural' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Veredas Rurales ({jacs.filter(j => j.sector === 'Rural').length})
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Total registradas: <strong className="text-slate-800">{filteredJacs.length}</strong>
        </div>
      </div>

      {/* JAC Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJacs.map((jac) => {
          const athletesCount = getAthletesCount(jac.id);
          const regsCount = getRegistrationsCount(jac.id);

          return (
            <div
              key={jac.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-4 h-10 rounded-full"
                      style={{ backgroundColor: jac.color || '#10b981' }}
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {jac.name}
                      </h3>
                      <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        jac.sector === 'Rural' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {jac.sector === 'Rural' ? '🌲 Sector Veredal' : '🏙️ Sector Urbano'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal(jac)}
                    className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    title="Editar datos de contacto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Presidente/Delegado:</span>
                    <strong className="text-slate-800">{jac.president}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Contacto:</span>
                    <span className="font-mono text-slate-700">{jac.phone}</span>
                  </div>
                </div>
              </div>

              {/* Stats badges */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span><strong>{athletesCount}</strong> Deportistas</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span><strong>{regsCount}</strong> Equipos</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit JAC Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-800">
                {editingJac ? 'Editar Junta de Acción Comunal' : 'Nueva Junta de Acción Comunal'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJAC} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de la JAC *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. JAC Vereda San Isidro"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sector *
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800"
                >
                  <option value="Urbano">Sector Urbano (Barrio)</option>
                  <option value="Rural">Sector Rural (Vereda)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Presidente / Delegado Deportivo
                </label>
                <input
                  type="text"
                  value={president}
                  onChange={(e) => setPresident(e.target.value)}
                  placeholder="Nombre del presidente"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 310 123 4567"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Color Distintivo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-slate-200 p-0.5"
                  />
                  <span className="text-xs font-mono text-slate-600">{color}</span>
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
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {editingJac ? 'Guardar Cambios' : 'Registrar JAC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
