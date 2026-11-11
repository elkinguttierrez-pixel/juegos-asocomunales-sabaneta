import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Settings, 
  Radio, 
  CheckCircle2, 
  X,
  Server,
  KeyRound
} from 'lucide-react';
import { realtime, getDefaultServerUrl, setCustomServerUrl } from '../services/realtime';

interface RealtimeStatusBadgeProps {
  isCoordinator: boolean;
  setIsCoordinator: (val: boolean) => void;
}

export const RealtimeStatusBadge: React.FC<RealtimeStatusBadgeProps> = ({
  isCoordinator,
  setIsCoordinator
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(realtime.getIsConnected());
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getDefaultServerUrl());
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const unsub = realtime.onConnectionChange((connected) => {
      setIsConnected(connected);
    });
    return unsub;
  }, []);

  const handleSaveServerUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomServerUrl(serverUrlInput);
    realtime.connect(serverUrlInput);
    setIsConfigOpen(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = await realtime.loginCoordinator(pinInput);
    if (success) {
      setIsCoordinator(true);
      setIsLoginOpen(false);
      setPinInput('');
    } else {
      setLoginError('PIN incorrecto. El PIN por defecto es 2026.');
    }
  };

  const handleLogout = () => {
    realtime.logoutCoordinator();
    setIsCoordinator(false);
  };

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Realtime Live Status Indicator */}
        <button
          onClick={() => setIsConfigOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
            isConnected
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/25'
              : 'bg-amber-500/15 text-amber-300 border-amber-400/30 hover:bg-amber-500/25'
          }`}
          title={isConnected ? 'Conectado al servidor en tiempo real (Render)' : 'Modo local sin conexión en tiempo real. Clic para configurar servidor.'}
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="hidden sm:inline">En Vivo</span>
              <Wifi className="w-3.5 h-3.5 text-emerald-300" />
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="hidden sm:inline">Modo Local</span>
              <WifiOff className="w-3.5 h-3.5 text-amber-300" />
            </>
          )}
        </button>

        {/* Coordinator vs Community Spectator Mode */}
        {isCoordinator ? (
          <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full text-[11px] font-black shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
            <span className="hidden sm:inline">Coordinador</span>
            <button
              onClick={handleLogout}
              className="text-slate-900/70 hover:text-slate-900 ml-1 text-[10px] font-bold underline cursor-pointer"
              title="Salir del modo coordinador"
            >
              Salir
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsLoginOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 transition cursor-pointer"
            title="Ingresar como Coordinador para programar y editar marcadores"
          >
            <Lock className="w-3 h-3 text-amber-300" />
            <span className="hidden sm:inline">Acceso Coordinador</span>
          </button>
        )}
      </div>

      {/* MODAL 1: Login de Coordinador */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900">Acceso de Coordinador</h3>
              </div>
              <button onClick={() => setIsLoginOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="mt-4 space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Ingresa el PIN de Coordinador para habilitar la creación de partidos, edición de horarios y registro de marcadores oficiales.
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1">PIN de Seguridad:</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="PIN oficial (ej: 2026)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-center text-lg font-black tracking-widest text-slate-900"
                />
                {loginError && (
                  <span className="text-[11px] text-red-600 font-bold block mt-1">{loginError}</span>
                )}
                <span className="text-[10px] text-slate-400 mt-1 block text-center">
                  PIN inicial por defecto: <strong>2026</strong>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Configuración del Servidor Render */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900">Servidor en Tiempo Real (Render)</h3>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveServerUrl} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Estado de la conexión:</span>
                  <span className={`font-black ${isConnected ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isConnected ? '🟢 Conectado y Sincronizando' : '🟠 Desconectado / Modo Local'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {isConnected 
                    ? 'Los cambios se transmiten instantáneamente a todos los dispositivos conectados.' 
                    : 'Puedes conectar tu servicio de Render para habilitar multiusuarios en tiempo real.'}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">URL de tu servicio Render:</label>
                <input
                  type="text"
                  required
                  placeholder="https://tu-servicio.onrender.com"
                  value={serverUrlInput}
                  onChange={(e) => setServerUrlInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ejemplo: <code>https://juegos-asocomunales-api.onrender.com</code> o <code>http://localhost:3001</code>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setServerUrlInput('http://localhost:3001');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] cursor-pointer"
                >
                  Localhost
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Guardar y Conectar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
