import { useState } from 'react';
import { Card, Input, Button } from '@/components/ui';
import { usePermissions } from '@/hooks';
import companyData from '@/mocks/data/company.json';
import type { CompanySettings } from '@/types';

export default function CompanySettingsPage() {
  const { canEdit } = usePermissions();
  const [company] = useState<CompanySettings>(companyData as any);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-gray-900">Paramètres de l'entreprise</h2>
        <p className="text-gray-600 mt-1">Informations générales et configuration système</p>
      </div>

      <Card>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom officiel" defaultValue={company.officialName} disabled={!canEdit('settings')} />
            <Input label="SIRET" defaultValue={company.siret} disabled={!canEdit('settings')} />
          </div>

          <Input label="Adresse" defaultValue={company.address} disabled={!canEdit('settings')} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Téléphone" defaultValue={company.phone} disabled={!canEdit('settings')} />
            <Input label="Email" type="email" defaultValue={company.email} disabled={!canEdit('settings')} />
          </div>

          {canEdit('settings') && (
            <div className="flex justify-end">
              <Button>Enregistrer les modifications</Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
