-- Fix team_members SELECT policy to allow staff to read (currently only admins can)
-- This was causing data persistence issues - staff couldn't see the data they inserted

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Only admins can read full team_member data" ON public.team_members;

-- Create new policy allowing both staff and admins to read team_members
CREATE POLICY "Staff and admins can read team_members" 
ON public.team_members 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));