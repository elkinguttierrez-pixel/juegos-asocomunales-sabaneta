export type SportBranch = 'Masculino' | 'Femenino' | 'Mixto';

export type SportType = 'individual' | 'parejas' | 'conjunto' | 'cultural';

export interface SportConfig {
  id: string;
  name: string;
  branches: SportBranch[];
  type: SportType;
  minPlayers: number;
  maxPlayers: number;
  iconName: string;
  description: string;
  rulesNotes?: string;
  scenarios?: string[];
  positions?: string[];
  modalities?: string[];
  officialDates?: string;
}

export interface JAC {
  id: string;
  name: string;
  sector: 'Urbano' | 'Rural';
  president: string;
  phone: string;
  email?: string;
  color: string;
  registeredAthletesCount?: number;
}

export interface Athlete {
  id: string;
  fullName: string;
  documentType: 'CC' | 'TI' | 'CE' | 'PAS';
  documentNumber: string;
  birthDate: string;
  age: number;
  gender: 'Masculino' | 'Femenino';
  phone: string;
  email?: string;
  jacId: string;
  address: string;
  eps: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  photoUrl?: string;
  verifiedResidency: boolean;
  createdAt: string;
  talla?: string;
}

export interface TeamMember {
  athleteId?: string;
  fullName: string;
  documentNumber: string;
  documentType: 'CC' | 'TI' | 'CE' | 'PAS';
  dorsal?: string | number;
  position?: string;
  gender: 'Masculino' | 'Femenino';
  eps: string;
  phone?: string;
  talla?: string;
}

export interface SportRegistration {
  id: string;
  sportId: string;
  sportName: string;
  branch: SportBranch;
  jacId: string;
  teamName?: string;
  delegateName: string;
  delegatePhone: string;
  uniformPrimaryColor?: string;
  uniformSecondaryColor?: string;
  modalityDetail?: string; // e.g. "Tres Bandas" or "100m" or "Parejas"
  members: TeamMember[];
  registeredAt: string;
  status: 'Inscrito' | 'Aprobado' | 'Observado';
}

export interface MatchSchedule {
  id: string;
  sportId: string;
  branch: SportBranch;
  round: string; // "Fase de Grupos", "Cuartos", "Semifinal", "Final"
  date: string;
  time: string;
  venue: string;
  teamA: {
    jacId: string;
    name: string;
    score?: number;
  };
  teamB: {
    jacId: string;
    name: string;
    score?: number;
  };
  status: 'Pendiente' | 'En Vivo' | 'Finalizado';
  winnerJacId?: string;
}

export interface MedalRecord {
  jacId: string;
  gold: number;
  silver: number;
  bronze: number;
}
