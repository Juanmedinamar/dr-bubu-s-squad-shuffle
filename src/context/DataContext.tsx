import { createContext, useContext, useState, ReactNode } from 'react';
import { TeamMember, Center, Assignment, Operation } from '@/types';
import { 
  mockTeamMembers as initialMembers, 
  mockCenters as initialCenters, 
  mockAssignments as initialAssignments,
  mockOperations as initialOperations 
} from '@/data/mockData';

interface DataContextType {
  // Team Members
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  
  // Centers
  centers: Center[];
  setCenters: React.Dispatch<React.SetStateAction<Center[]>>;
  
  // Assignments
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  
  // Operations
  operations: Operation[];
  setOperations: React.Dispatch<React.SetStateAction<Operation[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialMembers);
  const [centers, setCenters] = useState<Center[]>(initialCenters);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [operations, setOperations] = useState<Operation[]>(initialOperations);

  return (
    <DataContext.Provider value={{
      teamMembers,
      setTeamMembers,
      centers,
      setCenters,
      assignments,
      setAssignments,
      operations,
      setOperations,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
