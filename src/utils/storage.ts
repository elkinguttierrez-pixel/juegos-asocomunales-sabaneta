import { JAC, Athlete, SportRegistration, MatchSchedule } from '../types';
import { 
  SABANETA_JACS, 
  INITIAL_ATHLETES, 
  INITIAL_REGISTRATIONS, 
  INITIAL_MATCHES,
  INITIAL_MEDALS 
} from '../data/initialData';

const KEYS = {
  VERSION: 'asocomunales_db_version',
  JACS: 'asocomunales_jacs_v1',
  ATHLETES: 'asocomunales_athletes_v1',
  REGISTRATIONS: 'asocomunales_registrations_v1',
  MATCHES: 'asocomunales_matches_v1',
  MEDALS: 'asocomunales_medals_v1',
};

const CURRENT_VERSION = 'v7_fixture_limpio_cero_partidos_2026';

// Auto-upgrade if old mock data exists with fewer than 10 registrations
const checkAndUpgradeStorage = () => {
  const version = localStorage.getItem(KEYS.VERSION);
  if (version !== CURRENT_VERSION) {
    loadFullSimulationDatabase();
  }
};

export const getStoredJACs = (): JAC[] => {
  checkAndUpgradeStorage();
  const data = localStorage.getItem(KEYS.JACS);
  if (!data) {
    localStorage.setItem(KEYS.JACS, JSON.stringify(SABANETA_JACS));
    return SABANETA_JACS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SABANETA_JACS;
  }
};

export const saveJACs = (jacs: JAC[]) => {
  localStorage.setItem(KEYS.JACS, JSON.stringify(jacs));
};

export const getStoredAthletes = (): Athlete[] => {
  checkAndUpgradeStorage();
  const data = localStorage.getItem(KEYS.ATHLETES);
  if (!data) {
    localStorage.setItem(KEYS.ATHLETES, JSON.stringify(INITIAL_ATHLETES));
    return INITIAL_ATHLETES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_ATHLETES;
  }
};

export const saveAthletes = (athletes: Athlete[]) => {
  localStorage.setItem(KEYS.ATHLETES, JSON.stringify(athletes));
};

export const getStoredRegistrations = (): SportRegistration[] => {
  checkAndUpgradeStorage();
  const data = localStorage.getItem(KEYS.REGISTRATIONS);
  if (!data) {
    localStorage.setItem(KEYS.REGISTRATIONS, JSON.stringify(INITIAL_REGISTRATIONS));
    return INITIAL_REGISTRATIONS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_REGISTRATIONS;
  }
};

export const saveRegistrations = (regs: SportRegistration[]) => {
  localStorage.setItem(KEYS.REGISTRATIONS, JSON.stringify(regs));
};

export const getStoredMatches = (): MatchSchedule[] => {
  checkAndUpgradeStorage();
  const data = localStorage.getItem(KEYS.MATCHES);
  if (!data) {
    localStorage.setItem(KEYS.MATCHES, JSON.stringify(INITIAL_MATCHES));
    return INITIAL_MATCHES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_MATCHES;
  }
};

export const saveMatches = (matches: MatchSchedule[]) => {
  localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
};

export const getStoredMedals = (): Record<string, { gold: number; silver: number; bronze: number }> => {
  checkAndUpgradeStorage();
  const data = localStorage.getItem(KEYS.MEDALS);
  if (!data) {
    localStorage.setItem(KEYS.MEDALS, JSON.stringify(INITIAL_MEDALS));
    return INITIAL_MEDALS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_MEDALS;
  }
};

export const saveMedals = (medals: Record<string, { gold: number; silver: number; bronze: number }>) => {
  localStorage.setItem(KEYS.MEDALS, JSON.stringify(medals));
};

export const loadFullSimulationDatabase = () => {
  localStorage.setItem(KEYS.VERSION, CURRENT_VERSION);
  localStorage.setItem(KEYS.JACS, JSON.stringify(SABANETA_JACS));
  localStorage.setItem(KEYS.ATHLETES, JSON.stringify(INITIAL_ATHLETES));
  localStorage.setItem(KEYS.REGISTRATIONS, JSON.stringify(INITIAL_REGISTRATIONS));
  localStorage.setItem(KEYS.MATCHES, JSON.stringify(INITIAL_MATCHES));
  localStorage.setItem(KEYS.MEDALS, JSON.stringify(INITIAL_MEDALS));
};

export const exportAllDataJSON = () => {
  const data = {
    exportedAt: new Date().toISOString(),
    jacs: getStoredJACs(),
    athletes: getStoredAthletes(),
    registrations: getStoredRegistrations(),
    matches: getStoredMatches(),
    medals: getStoredMedals()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `juegos-asocomunales-sabaneta-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const resetToInitialData = () => {
  loadFullSimulationDatabase();
};
