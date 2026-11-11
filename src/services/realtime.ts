import { io, Socket } from 'socket.io-client';
import { MatchSchedule, JAC, Athlete, SportRegistration } from '../types';

export interface RealtimeState {
  matches: MatchSchedule[];
  medals: Record<string, { gold: number; silver: number; bronze: number }>;
  registrations: SportRegistration[];
  athletes: Athlete[];
  jacs: JAC[];
}

const STORAGE_KEYS = {
  SERVER_URL: 'asocomunales_custom_server_url',
  COORDINATOR_TOKEN: 'asocomunales_coordinator_session'
};

// Default server URL
export const getDefaultServerUrl = (): string => {
  const custom = localStorage.getItem(STORAGE_KEYS.SERVER_URL);
  if (custom && custom.trim()) return custom.trim();

  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3001';
  }

  // Production Render default URL
  return 'https://juegos-asocomunales-api.onrender.com';
};

export const setCustomServerUrl = (url: string) => {
  if (!url || !url.trim()) {
    localStorage.removeItem(STORAGE_KEYS.SERVER_URL);
  } else {
    localStorage.setItem(STORAGE_KEYS.SERVER_URL, url.trim());
  }
};

class RealtimeService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private currentServerUrl: string = '';

  // Event callbacks
  private onConnectCallbacks: ((connected: boolean) => void)[] = [];
  private onInitDataCallbacks: ((data: RealtimeState) => void)[] = [];
  private onMatchCreatedCallbacks: ((match: MatchSchedule) => void)[] = [];
  private onMatchUpdatedCallbacks: ((match: MatchSchedule) => void)[] = [];
  private onMatchDeletedCallbacks: ((matchId: string) => void)[] = [];
  private onMedalUpdatedCallbacks: ((payload: { jacId: string; medals: { gold: number; silver: number; bronze: number } }) => void)[] = [];

  constructor() {
    this.connect();
  }

  public connect(newUrl?: string) {
    const targetUrl = newUrl || getDefaultServerUrl();

    if (this.socket && this.currentServerUrl === targetUrl && this.socket.connected) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentServerUrl = targetUrl;

    try {
      this.socket = io(targetUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnectionAttempts: 15,
        reconnectionDelay: 2000
      });

      this.socket.on('connect', () => {
        console.log('🟢 Conectado al servidor en tiempo real:', targetUrl);
        this.isConnected = true;
        this.notifyConnectChange(true);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔴 Desconectado del servidor en tiempo real:', reason);
        this.isConnected = false;
        this.notifyConnectChange(false);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('⚠️ Error de conexión con el servidor en tiempo real:', err.message);
        this.isConnected = false;
        this.notifyConnectChange(false);
      });

      // Data events
      this.socket.on('init:data', (data: RealtimeState) => {
        this.onInitDataCallbacks.forEach(cb => cb(data));
      });

      this.socket.on('match:created', (match: MatchSchedule) => {
        this.onMatchCreatedCallbacks.forEach(cb => cb(match));
      });

      this.socket.on('match:updated', (match: MatchSchedule) => {
        this.onMatchUpdatedCallbacks.forEach(cb => cb(match));
      });

      this.socket.on('match:deleted', (matchId: string) => {
        this.onMatchDeletedCallbacks.forEach(cb => cb(matchId));
      });

      this.socket.on('medal:updated', (payload) => {
        this.onMedalUpdatedCallbacks.forEach(cb => cb(payload));
      });

    } catch (err) {
      console.error('Error inicializando socket:', err);
      this.isConnected = false;
      this.notifyConnectChange(false);
    }
  }

  // Subscription methods
  public onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectCallbacks.push(callback);
    callback(this.isConnected);
    return () => {
      this.onConnectCallbacks = this.onConnectCallbacks.filter(c => c !== callback);
    };
  }

  public onInitData(callback: (data: RealtimeState) => void) {
    this.onInitDataCallbacks.push(callback);
    return () => {
      this.onInitDataCallbacks = this.onInitDataCallbacks.filter(c => c !== callback);
    };
  }

  public onMatchCreated(callback: (match: MatchSchedule) => void) {
    this.onMatchCreatedCallbacks.push(callback);
    return () => {
      this.onMatchCreatedCallbacks = this.onMatchCreatedCallbacks.filter(c => c !== callback);
    };
  }

  public onMatchUpdated(callback: (match: MatchSchedule) => void) {
    this.onMatchUpdatedCallbacks.push(callback);
    return () => {
      this.onMatchUpdatedCallbacks = this.onMatchUpdatedCallbacks.filter(c => c !== callback);
    };
  }

  public onMatchDeleted(callback: (matchId: string) => void) {
    this.onMatchDeletedCallbacks.push(callback);
    return () => {
      this.onMatchDeletedCallbacks = this.onMatchDeletedCallbacks.filter(c => c !== callback);
    };
  }

  public onMedalUpdated(callback: (payload: { jacId: string; medals: { gold: number; silver: number; bronze: number } }) => void) {
    this.onMedalUpdatedCallbacks.push(callback);
    return () => {
      this.onMedalUpdatedCallbacks = this.onMedalUpdatedCallbacks.filter(c => c !== callback);
    };
  }

  private notifyConnectChange(connected: boolean) {
    this.onConnectCallbacks.forEach(cb => cb(connected));
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getServerUrl(): string {
    return this.currentServerUrl;
  }

  // Action methods
  public createMatch(match: MatchSchedule) {
    if (this.socket && this.isConnected) {
      this.socket.emit('match:create', match);
    }
  }

  public updateMatch(match: MatchSchedule) {
    if (this.socket && this.isConnected) {
      this.socket.emit('match:update', match);
    }
  }

  public scoreMatch(matchId: string, scoreA: number, scoreB: number, status: 'Pendiente' | 'En Vivo' | 'Finalizado', winnerJacId?: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('match:score', { matchId, scoreA, scoreB, status, winnerJacId });
    }
  }

  public deleteMatch(matchId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('match:delete', matchId);
    }
  }

  public updateMedal(jacId: string, type: 'gold' | 'silver' | 'bronze', delta: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('medal:update', { jacId, type, delta });
    }
  }

  public resetDatabase(pin: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket && this.isConnected) {
        this.socket.emit('db:reset', { pin }, (response: { success: boolean }) => {
          resolve(!!response?.success);
        });
      } else {
        resolve(false);
      }
    });
  }

  // Coordinator authentication (Default PIN: 2026)
  public isCoordinatorLoggedIn(): boolean {
    return sessionStorage.getItem(STORAGE_KEYS.COORDINATOR_TOKEN) === 'true';
  }

  public async loginCoordinator(pin: string): Promise<boolean> {
    // 1. If server is online, verify with server
    if (this.currentServerUrl) {
      try {
        const resp = await fetch(`${this.currentServerUrl}/api/verify-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        });
        if (resp.ok) {
          sessionStorage.setItem(STORAGE_KEYS.COORDINATOR_TOKEN, 'true');
          return true;
        }
      } catch {
        // Fallback to local check if offline
      }
    }

    // Default coordinator PIN: 2026
    if (pin.trim() === '2026') {
      sessionStorage.setItem(STORAGE_KEYS.COORDINATOR_TOKEN, 'true');
      return true;
    }

    return false;
  }

  public logoutCoordinator() {
    sessionStorage.removeItem(STORAGE_KEYS.COORDINATOR_TOKEN);
  }
}

export const realtime = new RealtimeService();
