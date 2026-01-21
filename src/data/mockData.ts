import { TeamMember, Center, Assignment } from '@/types';

export const mockCenters: Center[] = [
  { id: 'c1', name: 'Hospital Central', address: 'Av. Principal 123', color: '#0ea5e9' },
  { id: 'c2', name: 'Clínica Norte', address: 'Calle Norte 456', color: '#8b5cf6' },
  { id: 'c3', name: 'Centro Médico Sur', address: 'Av. Sur 789', color: '#f59e0b' },
  { id: 'c4', name: 'Hospital Universitario', address: 'Campus Universitario', color: '#10b981' },
  { id: 'c5', name: 'Clínica Santa María', address: 'Plaza Mayor 12', color: '#ef4444' },
  { id: 'c6', name: 'Centro Quirúrgico Este', address: 'Zona Este 34', color: '#ec4899' },
  { id: 'c7', name: 'Hospital San José', address: 'Calle San José 56', color: '#6366f1' },
  { id: 'c8', name: 'Clínica del Valle', address: 'Valle Verde 78', color: '#14b8a6' },
  { id: 'c9', name: 'Centro Médico Oeste', address: 'Av. Oeste 90', color: '#f97316' },
  { id: 'c10', name: 'Hospital Regional', address: 'Zona Regional 11', color: '#84cc16' },
];

export const mockTeamMembers: TeamMember[] = [
  // Anestesistas
  { id: 'a1', name: 'Dr. García', role: 'anesthetist', email: 'garcia@hospital.com', phone: '+34600111222', excludedCenters: ['c5'], incompatibleWith: ['a5'] },
  { id: 'a2', name: 'Dra. Martínez', role: 'anesthetist', email: 'martinez@hospital.com', phone: '+34600222333', excludedCenters: [], incompatibleWith: [] },
  { id: 'a3', name: 'Dr. López', role: 'anesthetist', email: 'lopez@hospital.com', phone: '+34600333444', excludedCenters: ['c3', 'c7'], incompatibleWith: ['a8'] },
  { id: 'a4', name: 'Dra. Sánchez', role: 'anesthetist', email: 'sanchez@hospital.com', phone: '+34600444555', excludedCenters: [], incompatibleWith: [] },
  { id: 'a5', name: 'Dr. Fernández', role: 'anesthetist', email: 'fernandez@hospital.com', phone: '+34600555666', excludedCenters: ['c2'], incompatibleWith: ['a1'] },
  { id: 'a6', name: 'Dra. Rodríguez', role: 'anesthetist', email: 'rodriguez@hospital.com', phone: '+34600666777', excludedCenters: [], incompatibleWith: ['a10'] },
  { id: 'a7', name: 'Dr. Pérez', role: 'anesthetist', email: 'perez@hospital.com', phone: '+34600777888', excludedCenters: ['c1'], incompatibleWith: [] },
  { id: 'a8', name: 'Dra. González', role: 'anesthetist', email: 'gonzalez@hospital.com', phone: '+34600888999', excludedCenters: [], incompatibleWith: ['a3'] },
  { id: 'a9', name: 'Dr. Díaz', role: 'anesthetist', email: 'diaz@hospital.com', phone: '+34600999000', excludedCenters: ['c6', 'c9'], incompatibleWith: [] },
  { id: 'a10', name: 'Dra. Ruiz', role: 'anesthetist', email: 'ruiz@hospital.com', phone: '+34601000111', excludedCenters: [], incompatibleWith: ['a6'] },
  { id: 'a11', name: 'Dr. Moreno', role: 'anesthetist', email: 'moreno@hospital.com', phone: '+34601111222', excludedCenters: ['c4'], incompatibleWith: [] },
  { id: 'a12', name: 'Dra. Jiménez', role: 'anesthetist', email: 'jimenez@hospital.com', phone: '+34601222333', excludedCenters: [], incompatibleWith: [] },
  { id: 'a13', name: 'Dr. Álvarez', role: 'anesthetist', email: 'alvarez@hospital.com', phone: '+34601333444', excludedCenters: ['c8'], incompatibleWith: ['a15'] },
  { id: 'a14', name: 'Dra. Romero', role: 'anesthetist', email: 'romero@hospital.com', phone: '+34601444555', excludedCenters: [], incompatibleWith: [] },
  { id: 'a15', name: 'Dr. Torres', role: 'anesthetist', email: 'torres@hospital.com', phone: '+34601555666', excludedCenters: ['c10'], incompatibleWith: ['a13'] },
  { id: 'a16', name: 'Dra. Navarro', role: 'anesthetist', email: 'navarro@hospital.com', phone: '+34601666777', excludedCenters: [], incompatibleWith: [] },
  { id: 'a17', name: 'Dr. Serrano', role: 'anesthetist', email: 'serrano@hospital.com', phone: '+34601777888', excludedCenters: ['c5', 'c6'], incompatibleWith: [] },
  { id: 'a18', name: 'Dra. Castro', role: 'anesthetist', email: 'castro@hospital.com', phone: '+34601888999', excludedCenters: [], incompatibleWith: [] },
  { id: 'a19', name: 'Dr. Molina', role: 'anesthetist', email: 'molina@hospital.com', phone: '+34601999000', excludedCenters: ['c3'], incompatibleWith: [] },
  { id: 'a20', name: 'Dra. Ortega', role: 'anesthetist', email: 'ortega@hospital.com', phone: '+34602000111', excludedCenters: [], incompatibleWith: [] },
  
  // Enfermeros
  { id: 'e1', name: 'Enf. Martín', role: 'nurse', email: 'martin@hospital.com', phone: '+34602111222', excludedCenters: ['c2'], incompatibleWith: [] },
  { id: 'e2', name: 'Enf. Hernández', role: 'nurse', email: 'hernandez@hospital.com', phone: '+34602222333', excludedCenters: [], incompatibleWith: ['e4'] },
  { id: 'e3', name: 'Enf. Muñoz', role: 'nurse', email: 'munoz@hospital.com', phone: '+34602333444', excludedCenters: ['c7'], incompatibleWith: [] },
  { id: 'e4', name: 'Enf. Rubio', role: 'nurse', email: 'rubio@hospital.com', phone: '+34602444555', excludedCenters: [], incompatibleWith: ['e2'] },
  { id: 'e5', name: 'Enf. Blanco', role: 'nurse', email: 'blanco@hospital.com', phone: '+34602555666', excludedCenters: ['c9'], incompatibleWith: [] },
];

export const mockAssignments: Assignment[] = [
  { id: 'as1', memberId: 'a1', centerId: 'c1', date: '2024-01-22', shift: 'morning' },
  { id: 'as2', memberId: 'a2', centerId: 'c2', date: '2024-01-22', shift: 'full' },
  { id: 'as3', memberId: 'e1', centerId: 'c1', date: '2024-01-22', shift: 'morning' },
  { id: 'as4', memberId: 'a3', centerId: 'c4', date: '2024-01-23', shift: 'afternoon' },
  { id: 'as5', memberId: 'a4', centerId: 'c3', date: '2024-01-23', shift: 'full' },
];
