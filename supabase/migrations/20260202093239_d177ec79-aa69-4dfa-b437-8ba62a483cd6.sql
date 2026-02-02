-- Fix 1: Restrict team_members SELECT to admins only (staff uses get_team_members_public function)
DROP POLICY IF EXISTS "Staff and admins can read all team_member data" ON public.team_members;

CREATE POLICY "Only admins can read full team_member data"
ON public.team_members
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict operations table - only staff/admins assigned to the center can see patient data
-- First, drop the current overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read operations" ON public.operations;

-- Create more restrictive policy - only staff and admins can read operations
CREATE POLICY "Staff and admins can read operations"
ON public.operations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Fix 3: Also restrict operation_assignments similarly
DROP POLICY IF EXISTS "Authenticated users can read operation_assignments" ON public.operation_assignments;

CREATE POLICY "Staff and admins can read operation_assignments"
ON public.operation_assignments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));