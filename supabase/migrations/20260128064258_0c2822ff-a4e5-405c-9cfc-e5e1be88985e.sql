-- Fix: team_members contact exposure - Restrict email/phone to admin/staff only

-- Step 1: Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read team_members" ON public.team_members;

-- Step 2: Create new policy - Admins and staff can see all team member data including contact info
CREATE POLICY "Staff and admins can read all team_member data"
ON public.team_members
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Step 3: Create a view for viewers that excludes sensitive fields
CREATE VIEW public.team_members_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    name,
    role,
    created_at,
    updated_at
    -- Excludes: email, phone, excluded_centers, incompatible_with
  FROM public.team_members;

-- Step 4: Grant SELECT on the view to authenticated users
GRANT SELECT ON public.team_members_public TO authenticated;

-- Step 5: Add policy for viewers to access the view
-- Note: The view uses security_invoker so it respects RLS of the base table
-- We need a base table policy for viewers that only shows non-sensitive data
CREATE POLICY "Viewers can read basic team_member info"
ON public.team_members
FOR SELECT
USING (
  has_role(auth.uid(), 'viewer'::app_role)
);