import { useState } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Download, User, Activity, Clock, Building2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMonthlyOperationsSummary } from '@/hooks/useDatabase';
import { SPECIALTIES } from '@/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export default function MonthlySummaryPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: summary, isLoading, error } = useMonthlyOperationsSummary(year, month);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatShift = (shift: string) => shift === 'morning' ? 'Mañana' : 'Tarde';

  const anesthetists = summary?.allMembers.filter((m: any) => m.role === 'anesthetist') || [];
  const nurses = summary?.allMembers.filter((m: any) => m.role === 'nurse') || [];

  const exportToCSV = () => {
    if (!summary) return;
    
    const headers = ['Nombre', 'Rol', 'Total Operaciones', 'Tiempo Total', 'Centros', 'Especialidades'];
    const rows = summary.allMembers.map((m: any) => [
      m.name,
      m.role === 'anesthetist' ? 'Anestesista' : 'Enfermero/a',
      m.totalOperations,
      formatDuration(m.totalDurationMinutes),
      Object.keys(m.byCenter).join(', '),
      Object.keys(m.bySpecialty).join(', '),
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resumen-mensual-${year}-${month}.csv`;
    link.click();
  };

  const renderMemberTable = (members: any[], title: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          {members.filter(m => m.totalOperations > 0).length} de {members.length} con actividad este mes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-center">Operaciones</TableHead>
              <TableHead className="text-center">Tiempo Total</TableHead>
              <TableHead>Centros</TableHead>
              <TableHead>Especialidades</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay miembros registrados
                </TableCell>
              </TableRow>
            ) : (
              members.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {member.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={member.totalOperations > 0 ? 'default' : 'secondary'}>
                      {member.totalOperations}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {member.totalDurationMinutes > 0 ? (
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(member.totalDurationMinutes)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(member.byCenter).map(([center, count]) => (
                        <Badge key={center} variant="outline" className="text-xs">
                          {center}: {count as number}
                        </Badge>
                      ))}
                      {Object.keys(member.byCenter).length === 0 && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(member.bySpecialty).map(([spec, count]) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {SPECIALTIES[spec as keyof typeof SPECIALTIES] || spec}: {count as number}
                        </Badge>
                      ))}
                      {Object.keys(member.bySpecialty).length === 0 && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {member.operations && member.operations.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground w-full">
                          <ChevronDown className="h-4 w-4" />
                          Ver detalle de operaciones ({member.operations.length})
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Fecha</TableHead>
                                  <TableHead>Turno</TableHead>
                                  <TableHead>Centro</TableHead>
                                  <TableHead>Especialidad</TableHead>
                                  <TableHead>Duración</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {member.operations
                                  .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                  .map((op: any) => (
                                    <TableRow key={op.id}>
                                      <TableCell>
                                        {format(new Date(op.date), 'dd MMM yyyy', { locale: es })}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={op.shift === 'morning' ? 'default' : 'secondary'}>
                                          {formatShift(op.shift)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{op.centerName}</TableCell>
                                      <TableCell>
                                        {SPECIALTIES[op.specialty as keyof typeof SPECIALTIES] || op.specialty}
                                      </TableCell>
                                      <TableCell>{formatDuration(op.duration)}</TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </TableCell>
                  </TableRow>
                )}
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const monthName = format(currentDate, 'MMMM yyyy', { locale: es });

  return (
    <MainLayout title="Resumen Mensual" subtitle="Estadísticas de operaciones por profesional">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Resumen Mensual</h1>
            <p className="text-muted-foreground">
              Estadísticas de operaciones por profesional
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline" disabled={!summary}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Month Navigator */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold min-w-[200px] text-center capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h2>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              Error al cargar los datos: {(error as Error).message}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Operaciones</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <Activity className="h-6 w-6 text-primary" />
                    {summary?.totalOperations || 0}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Profesionales Activos</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <User className="h-6 w-6 text-green-500" />
                    {summary?.memberSummary.length || 0}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Anestesistas</CardDescription>
                  <CardTitle className="text-3xl">
                    {anesthetists.filter((m: any) => m.totalOperations > 0).length} / {anesthetists.length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Enfermeros/as</CardDescription>
                  <CardTitle className="text-3xl">
                    {nurses.filter((m: any) => m.totalOperations > 0).length} / {nurses.length}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Detailed Tables */}
            <Tabs defaultValue="anesthetists">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="anesthetists">Anestesistas</TabsTrigger>
                <TabsTrigger value="nurses">Enfermeros/as</TabsTrigger>
              </TabsList>
              <TabsContent value="anesthetists" className="mt-4">
                {renderMemberTable(anesthetists, 'Anestesistas')}
              </TabsContent>
              <TabsContent value="nurses" className="mt-4">
                {renderMemberTable(nurses, 'Enfermeros/as')}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
}
