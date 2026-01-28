-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Policy for user_roles: users can read their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Policy for user_roles: only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop existing public policies
DROP POLICY IF EXISTS "Allow all access to team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow all access to centers" ON public.centers;
DROP POLICY IF EXISTS "Allow all access to operations" ON public.operations;
DROP POLICY IF EXISTS "Allow all access to assignments" ON public.assignments;
DROP POLICY IF EXISTS "Allow all access to operation_assignments" ON public.operation_assignments;

-- Create new authenticated-only policies for team_members
CREATE POLICY "Authenticated users can read team_members"
ON public.team_members FOR SELECT
USING (public.is_authenticated());

CREATE POLICY "Staff and admins can insert team_members"
ON public.team_members FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff and admins can update team_members"
ON public.team_members FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Only admins can delete team_members"
ON public.team_members FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create new authenticated-only policies for centers
CREATE POLICY "Authenticated users can read centers"
ON public.centers FOR SELECT
USING (public.is_authenticated());

CREATE POLICY "Staff and admins can insert centers"
ON public.centers FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff and admins can update centers"
ON public.centers FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Only admins can delete centers"
ON public.centers FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create new authenticated-only policies for operations
CREATE POLICY "Authenticated users can read operations"
ON public.operations FOR SELECT
USING (public.is_authenticated());

CREATE POLICY "Staff and admins can insert operations"
ON public.operations FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff and admins can update operations"
ON public.operations FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Only admins can delete operations"
ON public.operations FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create new authenticated-only policies for assignments
CREATE POLICY "Authenticated users can read assignments"
ON public.assignments FOR SELECT
USING (public.is_authenticated());

CREATE POLICY "Staff and admins can insert assignments"
ON public.assignments FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff and admins can update assignments"
ON public.assignments FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Only admins can delete assignments"
ON public.assignments FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create new authenticated-only policies for operation_assignments
CREATE POLICY "Authenticated users can read operation_assignments"
ON public.operation_assignments FOR SELECT
USING (public.is_authenticated());

CREATE POLICY "Staff and admins can insert operation_assignments"
ON public.operation_assignments FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff and admins can update operation_assignments"
ON public.operation_assignments FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Only admins can delete operation_assignments"
ON public.operation_assignments FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger to auto-assign 'admin' role to first user, 'staff' to others
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  IF user_count = 0 THEN
    -- First user becomes admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Subsequent users get staff role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'staff');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();