import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember, Center, Operation, Assignment } from '@/types';

// Type converters
const mapDbToTeamMember = (row: any): TeamMember => ({
  id: row.id,
  name: row.name,
  role: row.role,
  email: row.email,
  phone: row.phone,
  excludedCenters: row.excluded_centers || [],
  incompatibleWith: row.incompatible_with || [],
});

const mapDbToCenter = (row: any): Center => ({
  id: row.id,
  name: row.name,
  address: row.address,
  color: row.color,
});

const mapDbToOperation = (row: any): Operation => ({
  id: row.id,
  centerId: row.center_id,
  date: row.date,
  shift: row.shift,
  operatingRoom: row.operating_room,
  type: row.type,
  specialty: row.specialty,
  estimatedDuration: row.estimated_duration,
  patientCode: row.patient_code,
  notes: row.notes,
  requiredAnesthetists: row.required_anesthetists,
});

const mapDbToAssignment = (row: any): Assignment => ({
  id: row.id,
  memberId: row.member_id,
  centerId: row.center_id,
  date: row.date,
  shift: row.shift,
});

// Centers hooks
export function useCenters() {
  return useQuery({
    queryKey: ['centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data.map(mapDbToCenter);
    },
  });
}

export function useSaveCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (center: Partial<Center> & { id?: string }) => {
      if (center.id) {
        const { error } = await supabase
          .from('centers')
          .update({ name: center.name, address: center.address, color: center.color })
          .eq('id', center.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('centers')
          .insert({ name: center.name, address: center.address, color: center.color });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['centers'] }),
  });
}

export function useDeleteCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('centers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['centers'] }),
  });
}

// Team Members hooks - uses secure function for viewers, direct table for staff/admin
export function useTeamMembers(userRole?: 'admin' | 'staff' | 'viewer' | null) {
  return useQuery({
    queryKey: ['team_members', userRole],
    queryFn: async () => {
      // Staff and admins can access full team_members table
      if (userRole === 'admin' || userRole === 'staff') {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('name');
        if (error) throw error;
        return data.map(mapDbToTeamMember);
      }
      
      // Viewers use the secure function that only returns public fields
      const { data, error } = await supabase.rpc('get_team_members_public');
      if (error) throw error;
      
      // Map to TeamMember type with empty sensitive fields
      return (data || []).map((row: any): TeamMember => ({
        id: row.id,
        name: row.name,
        role: row.role,
        email: undefined, // Not accessible to viewers
        phone: undefined, // Not accessible to viewers
        excludedCenters: [], // Not accessible to viewers
        incompatibleWith: [], // Not accessible to viewers
      }));
    },
    enabled: userRole !== undefined, // Only run when role is determined
  });
}

export function useSaveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (member: Partial<TeamMember> & { id?: string }) => {
      const payload = {
        name: member.name,
        role: member.role,
        email: member.email,
        phone: member.phone,
        excluded_centers: member.excludedCenters || [],
        incompatible_with: member.incompatibleWith || [],
      };
      if (member.id) {
        const { error } = await supabase
          .from('team_members')
          .update(payload)
          .eq('id', member.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('team_members').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team_members'] }),
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team_members'] }),
  });
}

// Operations hooks
export function useOperations() {
  return useQuery({
    queryKey: ['operations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operations')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data.map(mapDbToOperation);
    },
  });
}

export function useSaveOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (op: Partial<Operation> & { id?: string }) => {
      const payload = {
        center_id: op.centerId,
        date: op.date,
        shift: op.shift,
        operating_room: op.operatingRoom,
        type: op.type,
        specialty: op.specialty,
        estimated_duration: op.estimatedDuration,
        patient_code: op.patientCode,
        notes: op.notes,
        required_anesthetists: op.requiredAnesthetists,
      };
      if (op.id) {
        const { error } = await supabase.from('operations').update(payload).eq('id', op.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('operations').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operations'] }),
  });
}

export function useDeleteOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('operations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operations'] }),
  });
}

// Assignments hooks
export function useAssignments() {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data.map(mapDbToAssignment);
    },
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: 'always', // Refetch when component mounts
  });
}

export function useSaveAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: Partial<Assignment> & { id?: string }) => {
      const payload = {
        member_id: assignment.memberId,
        center_id: assignment.centerId,
        date: assignment.date,
        shift: assignment.shift,
      };
      if (assignment.id) {
        const { error } = await supabase.from('assignments').update(payload).eq('id', assignment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('assignments').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });
}

// Operation Assignments (who participated in which operation)
export interface OperationAssignment {
  id: string;
  operationId: string;
  memberId: string;
  roleInOperation: 'anesthetist' | 'nurse' | 'assistant';
}

export function useOperationAssignments() {
  return useQuery({
    queryKey: ['operation_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operation_assignments')
        .select('*');
      if (error) throw error;
      return data.map((row: any): OperationAssignment => ({
        id: row.id,
        operationId: row.operation_id,
        memberId: row.member_id,
        roleInOperation: row.role_in_operation,
      }));
    },
  });
}

export function useSaveOperationAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (oa: Partial<OperationAssignment>) => {
      const { error } = await supabase.from('operation_assignments').insert({
        operation_id: oa.operationId,
        member_id: oa.memberId,
        role_in_operation: oa.roleInOperation,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operation_assignments'] }),
  });
}

export function useDeleteOperationAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('operation_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operation_assignments'] }),
  });
}

// Monthly summary query
export function useMonthlyOperationsSummary(year: number, month: number) {
  return useQuery({
    queryKey: ['monthly_summary', year, month],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      // Calculate actual last day of the month
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      // Get operations in date range
      const { data: operations, error: opError } = await supabase
        .from('operations')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      if (opError) throw opError;

      // Get operation assignments
      const { data: opAssignments, error: oaError } = await supabase
        .from('operation_assignments')
        .select('*');
      if (oaError) throw oaError;

      // Get team members
      const { data: members, error: mError } = await supabase
        .from('team_members')
        .select('*');
      if (mError) throw mError;

      // Get centers
      const { data: centers, error: cError } = await supabase
        .from('centers')
        .select('*');
      if (cError) throw cError;

      // Build summary per member
      const memberSummary = members.map((member: any) => {
        const memberOps = opAssignments
          .filter((oa: any) => oa.member_id === member.id)
          .map((oa: any) => operations.find((op: any) => op.id === oa.operation_id))
          .filter(Boolean);

        const totalOperations = memberOps.length;
        const totalDuration = memberOps.reduce((sum: number, op: any) => sum + (op?.estimated_duration || 0), 0);
        
        // Group by specialty
        const bySpecialty = memberOps.reduce((acc: any, op: any) => {
          acc[op.specialty] = (acc[op.specialty] || 0) + 1;
          return acc;
        }, {});

        // Group by center
        const byCenter = memberOps.reduce((acc: any, op: any) => {
          const center = centers.find((c: any) => c.id === op.center_id);
          const centerName = center?.name || 'Desconocido';
          acc[centerName] = (acc[centerName] || 0) + 1;
          return acc;
        }, {});

        return {
          id: member.id,
          name: member.name,
          role: member.role,
          totalOperations,
          totalDurationMinutes: totalDuration,
          bySpecialty,
          byCenter,
        };
      });

      return {
        year,
        month,
        totalOperations: operations.length,
        memberSummary: memberSummary.filter((m: any) => m.totalOperations > 0),
        allMembers: memberSummary,
      };
    },
  });
}
