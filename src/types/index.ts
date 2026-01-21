export type Role = 'anesthetist' | 'nurse';

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  email?: string;
  phone?: string;
  excludedCenters: string[];
  incompatibleWith: string[];
}

export interface Center {
  id: string;
  name: string;
  address?: string;
  color: string;
}

export interface Assignment {
  id: string;
  memberId: string;
  centerId: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'full';
}

export interface WeekSchedule {
  weekStart: string;
  assignments: Assignment[];
}

// Nuevos tipos para operaciones
export type OperationType = 'general' | 'cardiac' | 'neuro' | 'pediatric' | 'trauma' | 'orthopedic' | 'oncology' | 'vascular';
export type Specialty = 'general' | 'cardiac' | 'neuro' | 'pediatric' | 'trauma' | 'orthopedic' | 'oncology' | 'vascular' | 'urology' | 'gynecology';

export interface Operation {
  id: string;
  centerId: string;
  date: string;
  shift: 'morning' | 'afternoon';
  operatingRoom: string;
  type: OperationType;
  specialty: Specialty;
  estimatedDuration: number; // en minutos
  patientCode?: string;
  notes?: string;
  requiredAnesthetists: number;
}

export interface DemandSlot {
  centerId: string;
  date: string;
  shift: 'morning' | 'afternoon';
  requiredAnesthetists: number;
  requiredNurses: number;
  operations: Operation[];
}

export const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const SHIFTS = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  full: 'Jornada completa',
};

export const OPERATION_TYPES: Record<OperationType, string> = {
  general: 'Cirugía General',
  cardiac: 'Cirugía Cardíaca',
  neuro: 'Neurocirugía',
  pediatric: 'Cirugía Pediátrica',
  trauma: 'Traumatología',
  orthopedic: 'Ortopedia',
  oncology: 'Oncología',
  vascular: 'Cirugía Vascular',
};

export const SPECIALTIES: Record<Specialty, string> = {
  general: 'General',
  cardiac: 'Cardiología',
  neuro: 'Neurología',
  pediatric: 'Pediatría',
  trauma: 'Traumatología',
  orthopedic: 'Ortopedia',
  oncology: 'Oncología',
  vascular: 'Vascular',
  urology: 'Urología',
  gynecology: 'Ginecología',
};
