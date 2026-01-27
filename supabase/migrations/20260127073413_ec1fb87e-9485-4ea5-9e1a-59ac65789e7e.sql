-- Create centers table
CREATE TABLE public.centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  color TEXT NOT NULL DEFAULT '#0ea5e9',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('anesthetist', 'nurse')),
  email TEXT,
  phone TEXT,
  excluded_centers UUID[] DEFAULT '{}',
  incompatible_with UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operations table
CREATE TABLE public.operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'afternoon')),
  operating_room TEXT NOT NULL,
  type TEXT NOT NULL,
  specialty TEXT NOT NULL,
  estimated_duration INTEGER NOT NULL DEFAULT 60,
  patient_code TEXT,
  notes TEXT,
  required_anesthetists INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignments table (who works where and when)
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
  center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'afternoon', 'full')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(member_id, date, shift)
);

-- Create operation_assignments table (which staff participated in which operation)
CREATE TABLE public.operation_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_id UUID REFERENCES public.operations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
  role_in_operation TEXT NOT NULL CHECK (role_in_operation IN ('anesthetist', 'nurse', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(operation_id, member_id)
);

-- Create indexes for performance
CREATE INDEX idx_operations_date ON public.operations(date);
CREATE INDEX idx_operations_center ON public.operations(center_id);
CREATE INDEX idx_assignments_date ON public.assignments(date);
CREATE INDEX idx_assignments_member ON public.assignments(member_id);
CREATE INDEX idx_operation_assignments_member ON public.operation_assignments(member_id);
CREATE INDEX idx_operation_assignments_operation ON public.operation_assignments(operation_id);

-- Enable RLS (allowing public access for now - can add auth later)
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for now)
CREATE POLICY "Allow all access to centers" ON public.centers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to operations" ON public.operations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to assignments" ON public.assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to operation_assignments" ON public.operation_assignments FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_centers_updated_at
  BEFORE UPDATE ON public.centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_operations_updated_at
  BEFORE UPDATE ON public.operations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();