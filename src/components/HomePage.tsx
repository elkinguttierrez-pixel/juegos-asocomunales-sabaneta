import React from 'react';
import { JAC, SportRegistration, MatchSchedule, Athlete } from '../types';
import { 
  CalendarClock, 
  UserPlus, 
  Trophy, 
  Building2, 
  ArrowRight, 
  MapPin, 
  Clock, 
  Calendar,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface HomePageProps {
  jacs: JAC[];
  registrations: SportRegistration[];
  matches: MatchSchedule[];
  athletes: Athlete[];
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  jacs,
  registrations,
  matches,
  athletes,
  onNavigate
}) => {
  const liveMatches = matches.filter(m => m.status === 'En Vivo');
  const pendingMatches = matches.filter(m => m.status === 'Pendiente');

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-emerald-700/40">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-black uppercase tracking-wider mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-slate-900 fill-slate-900" /> Plataforma Oficial 2026
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Juegos Asocomunales de Sabaneta
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 mt-2 leading-relaxed">
            Asociación de Juntas de Acción Comunal (ASOCOMUNAL) & INDESA Sabaneta. 
            Portal central para programar competencias, gestionar inscripciones y seguir los resultados de las 19 JACs.
          </p>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-700/60 text-center sm:text-left">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block">Deportistas</span>
              <span className="text-2xl font-black text-white">{athletes.length}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block">Planillas</span>
              <span className="text-2xl font-black text-white">{registrations.length}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block">JACs Sabaneta</span>
              <span className="text-2xl font-black text-white">{jacs.length}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block">Partidos Totales</span>
              <span className="text-2xl font-black text-amber-300">{matches.length}</span>
            </div>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-emerald-700/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 5 Quick Access Navigation Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            Módulos Principales del Sistema
          </h2>
          <span className="text-xs text-slate-500">Accede directamente a cualquier sección</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Medallería Oficial */}
          <button
            onClick={() => onNavigate('medalleria')}
            className="group bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-amber-500 transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-900 flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-amber-700 transition">
                1. Medallería Oficial
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Cuadro de honor olímpico (Oro, Plata, Bronce), puntos y tabla de posiciones.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs font-bold text-amber-700">
              <span>{jacs.length} JACs</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* Card 2: Programar Lugar y Hora */}
          <button
            onClick={() => onNavigate('programar')}
            className="group bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition">
                <CalendarClock className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-emerald-700 transition">
                2. Programar
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Asigna el lugar, la fecha y la hora de los encuentros entre JACs por deporte.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs font-bold text-emerald-700">
              <span>{pendingMatches.length} programados</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* Card 3: Inscripción y Planillas */}
          <button
            onClick={() => onNavigate('inscripcion')}
            className="group bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-500 transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-blue-700 transition">
                3. Inscripciones
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Planillas oficiales, censo con tallas, carnets con código QR y nuevo registro.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs font-bold text-blue-700">
              <span>{registrations.length} planillas</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* Card 4: Resultados por Deporte */}
          <button
            onClick={() => onNavigate('por-deporte')}
            className="group bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-orange-500 transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-orange-700 transition">
                4. Por Deporte
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Sedes, horarios, marcadores y resultados específicos de cada disciplina.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs font-bold text-orange-700">
              <span>11 Deportes</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* Card 5: Resultados por Junta */}
          <button
            onClick={() => onNavigate('por-junta')}
            className="group bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-500 transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-pink-700 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-purple-700 transition">
                5. Por Junta (JAC)
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Agenda exclusiva para cada barrio con partidos en vivo y sedes.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs font-bold text-purple-700">
              <span>19 Barrios/Veredas</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>
        </div>
      </div>

      {/* Live Matches Strip (if any) */}
      {liveMatches.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-white animate-ping" />
            <span className="font-black text-sm">
              ¡Hay {liveMatches.length} encuentro(s) disputándose EN VIVO en este momento!
            </span>
          </div>
          <button
            onClick={() => onNavigate('por-junta')}
            className="bg-white text-red-700 font-black px-3.5 py-1.5 rounded-xl text-xs hover:bg-red-50 transition cursor-pointer"
          >
            Ver en Vivo
          </button>
        </div>
      )}

      {/* Official Calendar & Venues Information Block */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
              Cronograma & Sedes Sabaneta 2026
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              Escenarios y Fechas Oficiales de Competencia
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('programar')}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              <CalendarClock className="w-3.5 h-3.5" /> Ir a Programar
            </button>
            <button
              onClick={() => onNavigate('por-deporte')}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Ver por Deporte ➔
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Box 1: Deportes de Conjunto */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between text-xs pb-1.5 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" /> 28 Nov - 15 Dic
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.2 rounded-full font-bold">Conjunto</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 pt-1">
              <li>• <strong>Baloncesto:</strong> Gimnasio INDESA Zona Norte, Placa Betania.</li>
              <li>• <strong>Voleibol:</strong> Coliseo INDESA Zona Sur, Coliseo Adida.</li>
              <li>• <strong>Mini Tejo:</strong> Canchas de Tejo El Trapiche.</li>
            </ul>
          </div>

          {/* Box 2: Fútbol de Salón y Tradicionales */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between text-xs pb-1.5 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" /> 28 Nov - 06 Dic
              </span>
              <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.2 rounded-full font-bold">Tradicionales</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 pt-1">
              <li>• <strong>Fútbol de Salón (28-29 Nov):</strong> Coliseo Adida Sabaneta.</li>
              <li>• <strong>Dominó (28-29 Nov):</strong> Casa de la Cultura La Barquereña.</li>
              <li>• <strong>Danza Folclórica (29 Nov):</strong> Teatro Leonor Díaz Montoya.</li>
              <li>• <strong>Tejo Oficial (06 Dic):</strong> Canchas El Trapiche.</li>
            </ul>
          </div>

          {/* Box 3: Individuales y Precisión */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between text-xs pb-1.5 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" /> 05 - 13 Dic
              </span>
              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.2 rounded-full font-bold">Individuales</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 pt-1">
              <li>• <strong>Ajedrez (05-06 Dic):</strong> Biblioteca Juan Carlos Montoya.</li>
              <li>• <strong>Rana (05-06 Dic):</strong> Sede Social San José.</li>
              <li>• <strong>Billar (09-11 Dic):</strong> Club de Billar El Olimpo Sabaneta.</li>
              <li>• <strong>Atletismo (13 Dic):</strong> Pista Unidad Deportiva Zona Sur.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
