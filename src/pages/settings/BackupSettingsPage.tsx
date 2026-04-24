import { Card, Button } from '@/components/ui';
import { Download } from 'lucide-react';

export default function BackupSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">Sauvegardes</h2>
        <p className="text-ink-500 mt-1">Configuration et gestion des sauvegardes</p>
      </div>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Dernières sauvegardes</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-paper-2 rounded-input">
            <div>
              <p className="font-medium">Sauvegarde complète</p>
              <p className="text-sm text-ink-500">29/12/2024 02:00</p>
            </div>
            <Button variant="secondary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
