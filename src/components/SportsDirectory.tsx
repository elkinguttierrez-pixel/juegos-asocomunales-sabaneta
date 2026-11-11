import React, { useState, useMemo } from 'react';
import { OFFICIAL_SPORTS } from '../data/initialData';
import { SportBranch } from '../types';
import { Award, MapPin, ArrowRight, BookOpen, Calendar } from 'lucide-react';

interface SportsDirectoryProps {
  onSelectSportForRegistration: (sportId: string, branch: SportBranch) => void;
  onViewSportDetail?: (sportId: string) => void;
}

export const SportsDirectory: React.FC<SportsDirectoryProps> = ({
  onSelectSportForRegistration,
  onViewSportDetail
}) => {
  const [activeBranchFilter, setActiveBranchFilter] = useState<'all' | 'Masculino' | 'Femenino' | 'Mixto'>('all');

  const filteredSports = useMemo(() => {
    return OFFICIAL_SPORTS.filter(s => {
      if (activeBranchFilter === 'all') return true;
      return s.branches.includes(activeBranchFilter);
    });
  }, [activeBranchFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Reglamento y Disciplinas Oficiales
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Catálogo Oficial de Deportes y Ramas
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Listado oficial de las 11 disciplinas autorizadas para los Juegos Asocomunales de Sabaneta según la resolución deportiva municipal: Masculino, Femenino y Mixto.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveBranchFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeBranchFilter === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos (11)
            </button>
            <button
              onClick={() => setActiveBranchFilter('Masculino')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeBranchFilter === 'Masculino' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masculino (9)
            </button>
            <button
              onClick={() => setActiveBranchFilter('Femenino')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeBranchFilter === 'Femenino' ? 'bg-pink-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Femenino (9)
            </button>
            <button
              onClick={() => setActiveBranchFilter('Mixto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeBranchFilter === 'Mixto' ? 'bg-purple-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mixtos (4)
            </button>
          </div>
        </div>
      </div>

      {/* Official Summary Table from document */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">
            Cuadro Oficial de Competencias por Rama (Resolución Asocomunal)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Masculinos */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
            <div className="font-bold text-sm text-blue-400 pb-2 border-b border-slate-700 mb-3 flex items-center justify-between">
              <span>♂️ Juegos Masculinos</span>
              <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-[10px]">9 Deportes</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>1. Dominó</li>
              <li>2. Rana</li>
              <li>3. Trompo</li>
              <li>4. Ajedrez</li>
              <li>5. Atletismo</li>
              <li>6. Billar</li>
              <li>7. Baloncesto</li>
              <li>8. Fútbol de Salón</li>
              <li>9. Tejo</li>
            </ul>
          </div>

          {/* Femeninos */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
            <div className="font-bold text-sm text-pink-400 pb-2 border-b border-slate-700 mb-3 flex items-center justify-between">
              <span>♀️ Juegos Femeninos</span>
              <span className="bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full text-[10px]">9 Deportes</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>1. Dominó</li>
              <li>2. Rana</li>
              <li>3. Trompo</li>
              <li>4. Ajedrez</li>
              <li>5. Atletismo</li>
              <li>6. Billar</li>
              <li>7. Baloncesto</li>
              <li>8. Fútbol de Salón</li>
              <li>9. Tejo</li>
            </ul>
          </div>

          {/* Mixtos */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
            <div className="font-bold text-sm text-purple-400 pb-2 border-b border-slate-700 mb-3 flex items-center justify-between">
              <span>⚧️ Juegos Mixtos</span>
              <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-[10px]">4 Disciplinas</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>1. Dominó</li>
              <li>2. Rana</li>
              <li>3. Voleibol</li>
              <li>4. Danza Folclórica</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sports Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSports.map((sport) => {
          return (
            <div
              key={sport.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-black text-slate-900">{sport.name}</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {sport.type === 'conjunto' ? 'Conjunto' : sport.type === 'cultural' ? 'Cultural' : 'Individual'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-2">{sport.description}</p>

                {sport.officialDates && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg mb-3">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>Fechas Oficiales: {sport.officialDates}</span>
                  </div>
                )}

                {/* Branches Pill List */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {sport.branches.map(b => (
                    <span
                      key={b}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        b === 'Masculino' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        b === 'Femenino' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                        'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {b}
                    </span>
                  ))}
                </div>

                {/* Modalities & limits */}
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cupo deportistas:</span>
                    <strong className="text-slate-800">Mín {sport.minPlayers} - Máx {sport.maxPlayers}</strong>
                  </div>
                  {sport.modalities && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">Modalidades:</span>
                      <div className="flex flex-wrap gap-1">
                        {sport.modalities.map(m => (
                          <span key={m} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-medium text-slate-700">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {sport.scenarios && (
                    <div className="pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" /> Escenarios en Sabaneta:
                      </span>
                      <p className="text-[11px] text-slate-600 italic">
                        {sport.scenarios.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                {onViewSportDetail && (
                  <button
                    onClick={() => onViewSportDetail(sport.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <span>Ver Deporte</span>
                  </button>
                )}
                <button
                  onClick={() => onSelectSportForRegistration(sport.id, sport.branches[0])}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <span>Inscribir</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
