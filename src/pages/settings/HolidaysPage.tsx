import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { Plus, Calendar, AlertCircle } from 'lucide-react';
import { usePermissions } from '@/hooks';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import holidaysData from '@/mocks/data/holidays.json';

export default function HolidaysPage() {
  const { canEdit } = usePermissions();
  const [holidays] = useState(holidaysData);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const typeBadgeVariants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    'Férié national': 'success',
    'Férié religieux': 'info',
    'Fermeture technique': 'warning',
  };

  // Get holidays for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getHolidaysForDate = (date: Date) => {
    return holidays.filter(h => isSameDay(new Date(h.date), date));
  };

  const hasHoliday = (date: Date) => {
    return holidays.some(h => isSameDay(new Date(h.date), date));
  };

  // Upcoming holidays (next 30 days)
  const today = new Date();
  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">Jours fériés et fermetures</h2>
          <p className="text-gray-600 mt-1">{holidays.length} jours configurés pour 2024</p>
        </div>
        {canEdit('settings') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un jour férié
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Calendrier {format(currentMonth, 'MMMM yyyy', { locale: fr })}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    Aujourd'hui
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Headers */}
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                  <div key={day} className="text-center py-2 text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {daysInMonth.map((day, index) => {
                  const dayHolidays = getHolidaysForDate(day);
                  const isToday = isSameDay(day, today);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[80px] p-2 border rounded-lg
                        ${isToday ? 'border-accent-500 bg-accent-50' : 'border-gray-200'}
                        ${isWeekend ? 'bg-gray-50' : 'bg-white'}
                        ${hasHoliday(day) ? 'bg-danger-50 border-danger-200' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          isToday ? 'text-accent-600' :
                          hasHoliday(day) ? 'text-danger' :
                          isWeekend ? 'text-gray-400' :
                          'text-gray-900'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {hasHoliday(day) && (
                          <Calendar className="w-3 h-3 text-danger" />
                        )}
                      </div>
                      {dayHolidays.length > 0 && (
                        <div className="space-y-1">
                          {dayHolidays.map(holiday => (
                            <div
                              key={holiday.id}
                              className="text-xs bg-danger text-white px-1 py-0.5 rounded truncate"
                              title={holiday.name}
                            >
                              {holiday.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-accent-500 bg-accent-50"></div>
                  <span className="text-sm text-gray-600">Aujourd'hui</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-danger-50 border border-danger-200"></div>
                  <span className="text-sm text-gray-600">Jour férié</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200"></div>
                  <span className="text-sm text-gray-600">Weekend</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Holidays List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prochains jours fériés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingHolidays.map(holiday => (
                  <div
                    key={holiday.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{holiday.name}</h4>
                      <Badge variant={typeBadgeVariants[holiday.type]} className="text-xs">
                        {holiday.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {format(new Date(holiday.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                    </p>
                    {holiday.description && (
                      <p className="text-xs text-gray-500">{holiday.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {holiday.affectsProduction && (
                        <Badge variant="warning" className="text-xs">Production fermée</Badge>
                      )}
                      {holiday.affectsDelivery && (
                        <Badge variant="error" className="text-xs">Livraison fermée</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Impact Alert */}
          <Card className="border-warning-200 bg-warning-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-warning-900 mb-1">Impact sur les opérations</h4>
                  <p className="text-sm text-warning-700">
                    Les jours fériés affectent automatiquement le planning de production et de livraison.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All Holidays Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les jours fériés 2024</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Nom</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Production</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Livraison</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Récurrent</th>
                </tr>
              </thead>
              <tbody>
                {holidays
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(holiday => (
                    <tr key={holiday.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {format(new Date(holiday.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{holiday.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant={typeBadgeVariants[holiday.type]} className="text-xs">
                          {holiday.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{holiday.description}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={holiday.affectsProduction ? 'error' : 'success'} className="text-xs">
                          {holiday.affectsProduction ? 'Fermé' : 'Ouvert'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={holiday.affectsDelivery ? 'error' : 'success'} className="text-xs">
                          {holiday.affectsDelivery ? 'Fermé' : 'Ouvert'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {holiday.isRecurring ? (
                          <span className="text-success">✓</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
