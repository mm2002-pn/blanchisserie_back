import { Outlet } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Atelier du jour — Production (lavage → livraison).
 * Réception (pesée + triage) est désormais une page autonome (/reception).
 */
export default function AtelierJourLayout() {
  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Atelier du jour</h1>
        <p className="text-sm text-ink-500 capitalize">{today}</p>
      </div>

      <Outlet />
    </div>
  );
}
