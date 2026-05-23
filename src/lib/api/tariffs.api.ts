import { api } from './client';

export interface ApiTariffItem {
  id: string;
  linenTypeCode: string;
  linenTypeName: string;
  pricePerKg: string | null;
  pricePerPiece: string | null;
  billingMode: 'weight' | 'piece';
}

export interface ApiTariff {
  id: string;
  code: string;
  name: string;
  type: 'standard' | 'premium' | 'forfait' | 'segment';
  description: string | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  isDefault: boolean;
  monthlyPriceFcfa: string | null;
  monthlyKgLimit: number | null;
  overagePerKgFcfa: string | null;
  applicableClientTypes: string[];
  items: ApiTariffItem[];
}

const TYPE_FR: Record<ApiTariff['type'], 'Standard' | 'Premium' | 'Forfait' | 'Segment'> = {
  standard: 'Standard',
  premium: 'Premium',
  forfait: 'Forfait',
  segment: 'Segment',
};

/** Format normalisé pour la page (compatible avec la shape de tariffs.json). */
export function mapApiTariff(t: ApiTariff) {
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    type: TYPE_FR[t.type],
    description: t.description ?? '',
    validFrom: t.validFrom,
    validUntil: t.validUntil,
    isActive: t.isActive,
    isDefault: t.isDefault,
    monthlyPrice: t.monthlyPriceFcfa ? Number(t.monthlyPriceFcfa) : 0,
    monthlyKgLimit: t.monthlyKgLimit ?? 0,
    overagePricePerKg: t.overagePerKgFcfa ? Number(t.overagePerKgFcfa) : 0,
    applicableClients: t.applicableClientTypes ?? [],
    items: t.items.map((i) => ({
      linenTypeCode: i.linenTypeCode,
      linenTypeName: i.linenTypeName,
      pricePerKg: i.pricePerKg ? Number(i.pricePerKg) : 0,
      pricePerPiece: i.pricePerPiece ? Number(i.pricePerPiece) : 0,
      billingMode: i.billingMode,
    })),
  };
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listTariffs() {
  const { data } = await api.get<PageResult<ApiTariff>>('/tariffs');
  return data.items.map(mapApiTariff);
}
