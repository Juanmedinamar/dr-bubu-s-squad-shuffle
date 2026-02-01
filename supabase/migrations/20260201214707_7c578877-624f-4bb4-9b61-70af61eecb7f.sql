-- Fix security issue: Viewers should not access sensitive contact data

-- Step 1: Drop the viewer policy that allows direct access to team_members table
DROP POLICY IF EXISTS "Viewers can read basic team_member info" ON public.team_members;

-- Step 2: Create a SECURITY DEFINER function that viewers can use to get public team data
-- This function returns only non-sensitive fields (id, name, role, created_at, updated_at)
CREATE OR REPLACE FUNCTION public.get_team_members_public()
RETURNS TABLE (
  id UUID,
  name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, role, created_at, updated_at
  FROM public.team_members
  ORDER BY name;
$$;

-- Step 3: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_team_members_public() TO authenticated;

-- Step 4: Drop the insecure view (it has no RLS and exposes data)
DROP VIEW IF EXISTS public.team_members_public;