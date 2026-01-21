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

export const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const SHIFTS = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  full: 'Jornada completa',
};
