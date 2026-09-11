import { Download, Upload, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui';

const IMPORT_SOURCES = [
  { icon: FileSpreadsheet, name: 'Excel (.xlsx)', sub: 'Modèle fourni, 1 feuille = 1 entité' },
  { icon: FileText, name: 'CSV', sub: 'UTF-8, séparateur virgule' },
];

const EXPORT_ENTITIES = [
  { name: 'Clients', note: 'Fiches + contacts + contrats', icon: FileSpreadsheet },
  { name: 'Commandes', note: 'Depuis une période donnée', icon: FileSpreadsheet },
  { name: 'Factures', note: 'PDF par lot ou feuille Excel', icon: FileText },
  { name: 'Inventaire', note: 'Stock, prix unitaires, fournisseurs', icon: FileSpreadsheet },
];

export default function DataImportExportPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="caps mb-2">Import / Export</div>
        <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
          Données de référence
        </h2>
        <p className="text-sm text-ink-500 mt-1">
          Bulk import depuis Excel ou CSV · export ponctuel ou planifié.
        </p>
      </div>

      {/* Import */}
      <div className="card-surface p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-input bg-brand-100 flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <p className="caps">Import</p>
            <p className="font-serif text-lg font-medium tracking-tight text-ink-900 mt-0.5">
              Charger un fichier
            </p>
            <p className="text-tiny text-ink-500 mt-1">
              Télécharge d'abord le modèle correspondant, remplis-le, puis dépose le ici.
            </p>
          </div>
          <Button size="sm" className="gap-1.5 shrink-0">
            <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
            Importer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
          {IMPORT_SOURCES.map((src) => {
            const Icon = src.icon;
            return (
              <div
                key={src.name}
                className="flex items-center gap-3 px-3 py-2.5 rounded-input bg-paper-2 border-hairline border-ink-200"
              >
                <Icon className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{src.name}</p>
                  <p className="text-tiny text-ink-500">{src.sub}</p>
                </div>
                <Button variant="ghost" size="sm">
                  Modèle
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export */}
      <div className="card-surface p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-input bg-ok-100 flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-ok-700" strokeWidth={1.75} />
          </div>
          <div>
            <p className="caps">Export</p>
            <p className="font-serif text-lg font-medium tracking-tight text-ink-900 mt-0.5">
              Télécharger les données
            </p>
            <p className="text-tiny text-ink-500 mt-1">
              Export Excel ou PDF pour audit, reporting ou migration.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
          {EXPORT_ENTITIES.map((e) => {
            const Icon = e.icon;
            return (
              <div
                key={e.name}
                className="flex items-center gap-3 px-3 py-2.5 rounded-input bg-paper-2 border-hairline border-ink-200"
              >
                <Icon className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{e.name}</p>
                  <p className="text-tiny text-ink-500">{e.note}</p>
                </div>
                <Button variant="secondary" size="sm" className="gap-1">
                  <Download className="w-3 h-3" strokeWidth={1.75} />
                  Exporter
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
