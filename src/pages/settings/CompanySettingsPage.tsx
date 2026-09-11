import { useState } from 'react';
import { Building2, Mail, Phone, MapPin, Save } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { usePermissions } from '@/hooks';
import companyData from '@/mocks/data/company.json';
import type { CompanySettings } from '@/types';

export default function CompanySettingsPage() {
  const { canEdit } = usePermissions();
  const [company] = useState<CompanySettings>(companyData as any);

  const readonly = !canEdit('settings');

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <div className="caps mb-2">Entreprise</div>
        <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
          Informations générales
        </h2>
        <p className="text-sm text-ink-500 mt-1">
          Identité officielle, coordonnées et données utilisées sur factures et bordereaux.
        </p>
      </div>

      {/* Identity panel */}
      <div className="card-surface p-5">
        <SectionTitle
          icon={Building2}
          caps="Identité"
          title="Identité officielle"
          sub="Raison sociale + numéro SIRET ou NINEA"
        />
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Nom officiel"
            defaultValue={company.officialName}
            disabled={readonly}
          />
          <Input
            label="SIRET / NINEA"
            defaultValue={company.siret}
            disabled={readonly}
          />
        </form>
      </div>

      {/* Contact panel */}
      <div className="card-surface p-5">
        <SectionTitle
          icon={Mail}
          caps="Contacts"
          title="Coordonnées"
          sub="Apparaissent sur les emails et bordereaux émis"
        />
        <form className="space-y-4 mt-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0 mt-5">
              <MapPin className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <Input
                label="Adresse"
                defaultValue={company.address}
                disabled={readonly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0 mt-5">
                <Phone className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <Input
                  label="Téléphone"
                  defaultValue={company.phone}
                  disabled={readonly}
                />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0 mt-5">
                <Mail className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <Input
                  label="Email"
                  type="email"
                  defaultValue={company.email}
                  disabled={readonly}
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer actions */}
      {canEdit('settings') && (
        <div className="flex items-center justify-between card-surface bg-paper-2 p-4">
          <p className="text-tiny text-ink-500">
            Les modifications sont enregistrées immédiatement après validation.
          </p>
          <Button className="gap-1.5">
            <Save className="w-3.5 h-3.5" strokeWidth={1.75} />
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  caps,
  title,
  sub,
}: {
  icon: typeof Building2;
  caps: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-input bg-brand-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand-800" strokeWidth={1.75} />
      </div>
      <div>
        <p className="caps">{caps}</p>
        <p className="font-serif text-lg font-medium tracking-tight text-ink-900 mt-0.5">
          {title}
        </p>
        <p className="text-tiny text-ink-500 mt-1">{sub}</p>
      </div>
    </div>
  );
}
