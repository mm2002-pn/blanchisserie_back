import { Card, Button } from '@/components/ui';
import { Download, Upload } from 'lucide-react';

export default function DataImportExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-gray-900">Import / Export de données</h2>
        <p className="text-gray-600 mt-1">Gestion des imports et exports en masse</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Import</h3>
          <p className="text-gray-600 mb-4">Importer des données depuis Excel ou CSV</p>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Importer des données
          </Button>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Export</h3>
          <p className="text-gray-600 mb-4">Exporter les données au format Excel ou PDF</p>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Exporter les données
          </Button>
        </Card>
      </div>
    </div>
  );
}
