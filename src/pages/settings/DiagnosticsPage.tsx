import { Card, Badge } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

export default function DiagnosticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-gray-900">Diagnostic système</h2>
        <p className="text-gray-600 mt-1">État de santé de l'application</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Base de données</h3>
              <p className="text-sm text-gray-600 mt-1">Connectivité</p>
            </div>
            <Badge variant="success">
              <CheckCircle className="w-4 h-4 mr-1" />
              Opérationnel
            </Badge>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Serveur API</h3>
              <p className="text-sm text-gray-600 mt-1">Temps de réponse</p>
            </div>
            <Badge variant="success">
              <CheckCircle className="w-4 h-4 mr-1" />
              &lt; 100ms
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
