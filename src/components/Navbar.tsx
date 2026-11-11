import React, { useState } from 'react';
import { 
  Trophy, 
  UserPlus, 
  Users, 
  Building2, 
  Calendar, 
  Award, 
  FileSpreadsheet, 
  Download, 
  Flame, 
  Sparkles, 
  Menu, 
  X, 
  BookOpen, 
  RotateCcw, 
  Home, 
  CalendarClock 
} from 'lucide-react';
import { RealtimeStatusBadge } from './RealtimeStatusBadge';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: {
    athletesCount: number;
    registrationsCount: number;
    jacsCount: number;
  };
  onExportBackup: () => void;
  onLoadSimulation?: () => void;
  isCoordinator: boolean;
  setIsCoordinator: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onExportBackup,
  onLoadSimulation,
  isCoordinator,
  setIsCoordinator
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'inicio', label: '1. Inicio', icon: Home, badge: '🏠 Tablero' },
    { id: 'medalleria', label: '2. Medallería', icon: Trophy, badge: '👑 Podio' },
    { id: 'programar', label: '3. Programar (Lugar y Hora)', icon: CalendarClock, badge: '📍 Asignar Sedes & Horas' },
    { id: 'inscripcion', label: '4. Inscripción & Planillas', icon: UserPlus, count: stats.registrationsCount },
    { id: 'por-deporte', label: '5. Por Deporte (Resultados)', icon: Award, badge: '🏆 11 Deportes' },
    { id: 'por-junta', label: '6. Por Junta Comunal (JAC)', icon: Building2, count: stats.jacsCount, badge: '🏘️ 19 JACs' },
  ];

  const handleMobileNav = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-900 text-white shadow-xl sticky top-0 z-40">
        {/* Top Mini Bar */}
        <div className="border-b border-emerald-600/40 bg-emerald-950/40 px-3 sm:px-4 py-1.5 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-amber-400 text-slate-900 flex-shrink-0">
                <Flame className="w-3 h-3 mr-1 text-red-600 fill-red-600" /> Sabaneta
              </span>
              <span className="text-emerald-200 hidden sm:inline">|</span>
              <span className="text-emerald-100 text-[11px] sm:text-xs truncate hidden sm:inline">
                ASOCOMUNAL & INDESA
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <RealtimeStatusBadge isCoordinator={isCoordinator} setIsCoordinator={setIsCoordinator} />

              {onLoadSimulation && (
                <button
                  onClick={onLoadSimulation}
                  title="Recargar base de datos oficial de los Juegos Asocomunales"
                  className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-slate-900 px-2.5 py-0.5 rounded text-[11px] font-black cursor-pointer shadow-sm active:scale-95 transition"
                >
                  <RotateCcw className="w-3 h-3 text-slate-900" /> 
                  <span className="hidden sm:inline">Base Oficial 2026</span>
                  <span className="sm:hidden">Base Oficial</span>
                </button>
              )}
              <button
                onClick={onExportBackup}
                title="Descargar copia de respaldo en JSON"
                className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition"
              >
                <Download className="w-3 h-3" /> 
                <span className="hidden sm:inline">Respaldo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-900 ring-2 ring-amber-300/50 flex-shrink-0">
              <Trophy className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-tight text-white m-0 p-0 leading-tight truncate">
                  JUEGOS ASOCOMUNALES
                </h1>
                <span className="bg-amber-400 text-slate-900 text-[10px] sm:text-xs font-black px-1.5 py-0.2 rounded uppercase flex-shrink-0">
                  Sabaneta
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-emerald-200/90 font-medium truncate">
                Gestión, Inscripciones, Fixture y Medallería
              </p>
            </div>
          </div>

          {/* Quick Stats Pill (Desktop and Tablet) */}
          <div className="hidden md:flex items-center gap-2 bg-emerald-950/60 backdrop-blur-sm p-1.5 rounded-xl border border-emerald-500/30 flex-shrink-0">
            <div className="px-3 py-0.5 text-center border-r border-emerald-700/50">
              <div className="text-[10px] text-emerald-300 font-medium">JACs</div>
              <div className="text-sm font-bold text-white">{stats.jacsCount}</div>
            </div>
            <div className="px-3 py-0.5 text-center border-r border-emerald-700/50">
              <div className="text-[10px] text-emerald-300 font-medium">Planillas</div>
              <div className="text-sm font-bold text-amber-300">{stats.registrationsCount}</div>
            </div>
            <div className="px-3 py-0.5 text-center">
              <div className="text-[10px] text-emerald-300 font-medium">Deportistas</div>
              <div className="text-sm font-bold text-emerald-200">{stats.athletesCount}</div>
            </div>
          </div>

          {/* Hamburger button for Mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 cursor-pointer"
              title="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-emerald-600/40">
          <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-900 shadow-md font-bold'
                      : 'text-emerald-100 hover:bg-emerald-600/50 hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 mr-1.5 ${isActive ? 'text-emerald-700' : 'text-emerald-300'}`} />
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 font-bold'
                          : 'bg-emerald-800/80 text-emerald-200'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                  {item.badge && !isActive && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-slate-900 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Full Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-emerald-950 border-t border-emerald-600/60 p-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <div className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider mb-2">
              Módulos del Sistema
            </div>
            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMobileNav(item.id)}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                      isActive
                        ? 'bg-white text-emerald-950 shadow'
                        : 'text-emerald-100 hover:bg-emerald-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-amber-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-800 text-emerald-200'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Stats on Mobile Drawer */}
            <div className="mt-4 pt-3 border-t border-emerald-800/80 flex justify-around text-center text-xs">
              <div>
                <span className="text-[10px] text-emerald-400 block">JACs</span>
                <strong className="text-white text-sm">{stats.jacsCount}</strong>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 block">Planillas</span>
                <strong className="text-amber-300 text-sm">{stats.registrationsCount}</strong>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 block">Deportistas</span>
                <strong className="text-emerald-200 text-sm">{stats.athletesCount}</strong>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR (Thumb-friendly for smartphone users) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1 px-2 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.08)] no-print">
        {/* 1. Medallería */}
        <button
          onClick={() => handleMobileNav('medals')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer flex-1 ${
            activeTab === 'medals' ? 'text-amber-600 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <Trophy className={`w-5 h-5 ${activeTab === 'medals' ? 'text-amber-600 scale-110' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5">Medallas</span>
        </button>

        {/* 2. Por JAC: En Vivo & Pendientes */}
        <button
          onClick={() => handleMobileNav('jac-active')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer flex-1 ${
            activeTab === 'jac-active' ? 'text-red-600 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <Flame className={`w-5 h-5 ${activeTab === 'jac-active' ? 'text-red-600 scale-110 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5 font-bold">Por JAC</span>
        </button>

        {/* 3. Horarios & Resultados */}
        <button
          onClick={() => handleMobileNav('fixture')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer flex-1 ${
            activeTab === 'fixture' ? 'text-emerald-600 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <Calendar className={`w-5 h-5 ${activeTab === 'fixture' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5 font-bold">Horarios</span>
        </button>

        {/* 4. Por Deporte */}
        <button
          onClick={() => handleMobileNav('by-sport')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer flex-1 ${
            activeTab === 'by-sport' ? 'text-emerald-600 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <Award className={`w-5 h-5 ${activeTab === 'by-sport' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5">Deportes</span>
        </button>

        {/* 5. Más */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer flex-1 ${
            mobileMenuOpen || ['registrations-list', 'registration', 'athletes', 'jacs', 'sports'].includes(activeTab)
              ? 'text-emerald-700 font-black' 
              : 'text-slate-500 font-medium'
          }`}
        >
          <Menu className="w-5 h-5 text-slate-500" />
          <span className="text-[10px] mt-0.5">Más</span>
        </button>
      </nav>
    </>
  );
};
