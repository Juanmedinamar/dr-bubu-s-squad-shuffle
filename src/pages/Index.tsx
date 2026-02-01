import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { WeeklyOverview } from '@/components/dashboard/WeeklyOverview';
import { TeamList } from '@/components/dashboard/TeamList';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { Users, Building2, AlertTriangle, Loader2 } from 'lucide-react';
import { useTeamMembers, useCenters } from '@/hooks/useDatabase';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { role } = useAuth();
  const { data: teamMembers = [], isLoading: loadingMembers } = useTeamMembers(role);
  const { data: centers = [], isLoading: loadingCenters } = useCenters();
  
  const isLoading = loadingMembers || loadingCenters;
  
  const anesthetistCount = teamMembers.filter(m => m.role === 'anesthetist').length;
  const nurseCount = teamMembers.filter(m => m.role === 'nurse').length;
  const conflictCount = teamMembers.filter(m => m.incompatibleWith.length > 0).length;

  if (isLoading) {
    return (
      <MainLayout title="Dashboard" subtitle="Gestión de turnos del equipo del Dr. Bubu">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Gestión de turnos del equipo del Dr. Bubu"
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Anestesistas"
          value={anesthetistCount}
          icon={Users}
          variant="anesthetist"
        />
        <StatCard
          title="Enfermeros"
          value={nurseCount}
          icon={Users}
          variant="nurse"
        />
        <StatCard
          title="Centros"
          value={centers.length}
          icon={Building2}
          variant="center"
        />
        <StatCard
          title="Incompatibilidades"
          value={conflictCount}
          icon={AlertTriangle}
          variant="default"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyOverview />
        </div>
        <div className="space-y-6">
          <TeamList />
          <AlertsPanel />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
