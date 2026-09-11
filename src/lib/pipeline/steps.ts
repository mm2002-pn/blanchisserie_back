import {
  ListChecks,
  Droplets,
  Sun,
  Flame,
  Shirt,
  PackageOpen,
  Truck,
  type LucideIcon,
} from 'lucide-react';

/**
 * Définition centralisée des étapes du pipeline atelier.
 *
 * STEPS est rendu dynamique via `usePipelineSteps()` :
 *  - aujourd'hui : ordre par défaut codé ici (rétro-compat)
 *  - demain : pourra être surchargé depuis une API
 *    (ex. `GET /settings/pipeline`) sans toucher à la page
 *
 * Les métadonnées UI (icône, accent, label) restent par contre statiques
 * — elles n'ont aucun sens à venir d'une DB.
 */

export type StepKey =
  | 'triage'
  | 'lavage'
  | 'sechage'
  | 'calandrage'
  | 'repassage'
  | 'finition'
  | 'livraison';

export interface StepDef {
  key: StepKey;
  /** Position 1-based dans la séquence active (calculée). */
  index: number;
  icon: LucideIcon;
  title: string;
  shortLabel: string;
  hint: string;
  /** classe Tailwind pour la couleur d'accent texte (text-...) */
  accent: string;
  /** classe Tailwind pour le fond de l'icône (bg-... border-...) */
  accentBg: string;
}

/** Registre des métadonnées UI par clé d'étape. */
const STEP_REGISTRY: Record<StepKey, Omit<StepDef, 'key' | 'index'>> = {
  triage: {
    icon: ListChecks,
    title: 'À triater',
    shortLabel: 'Triage',
    hint: 'Commandes pesées en attente de triage',
    accent: 'text-brand-800',
    accentBg: 'bg-brand-50 border-brand-200',
  },
  lavage: {
    icon: Droplets,
    title: 'Lavage',
    shortLabel: 'Lavage',
    hint: 'Batches en cours dans les laveuses',
    accent: 'text-blue-700',
    accentBg: 'bg-blue-50 border-blue-200',
  },
  sechage: {
    icon: Sun,
    title: 'Séchage',
    shortLabel: 'Séchage',
    hint: 'Linge sortant du lavage à sécher',
    accent: 'text-amber-700',
    accentBg: 'bg-amber-50 border-amber-200',
  },
  calandrage: {
    icon: Flame,
    title: 'Calandrage',
    shortLabel: 'Calandre',
    hint: 'Linge plat (LP) — draps, taies, nappes',
    accent: 'text-orange-700',
    accentBg: 'bg-orange-50 border-orange-200',
  },
  repassage: {
    icon: Shirt,
    title: 'Repassage',
    shortLabel: 'Repassage',
    hint: 'Linge forme (LF) — chemises, pantalons',
    accent: 'text-violet-700',
    accentBg: 'bg-violet-50 border-violet-200',
  },
  finition: {
    icon: PackageOpen,
    title: 'Finition',
    shortLabel: 'Finition',
    hint: 'Pliage, contrôle qualité, mise en sachet',
    accent: 'text-baobab-700',
    accentBg: 'bg-baobab-50 border-baobab-200',
  },
  livraison: {
    icon: Truck,
    title: 'Livraison',
    shortLabel: 'Livraison',
    hint: 'Commandes prêtes — regrouper et planifier',
    accent: 'text-ok-700',
    accentBg: 'bg-ok-50 border-ok-200',
  },
};

/** Ordre par défaut du pipeline (utilisé tant qu'aucune config n'existe). */
export const DEFAULT_PIPELINE_ORDER: StepKey[] = [
  'triage',
  'lavage',
  'sechage',
  'calandrage',
  'repassage',
  'finition',
  'livraison',
];

/** Construit la séquence StepDef[] (avec index 1-based) à partir d'un ordre. */
export function buildSteps(order: StepKey[]): StepDef[] {
  return order.map((key, i) => ({
    key,
    index: i + 1,
    ...STEP_REGISTRY[key],
  }));
}

/** Catégorie de linge → ordre des étapes traversées.
 *  Aligné avec le routage backend (`nextTagStateFor`). Source de vérité unique
 *  pour l'aperçu UI. */
export type LinenCategoryFr = 'Linge Plat' | 'Linge Forme' | 'NAE';

export function pipelineForCategory(cat: LinenCategoryFr): StepKey[] {
  const order: StepKey[] = ['triage', 'lavage', 'sechage'];
  if (cat === 'Linge Plat') order.push('calandrage');
  else if (cat === 'Linge Forme') order.push('repassage');
  // NAE → pas de calandrage ni de repassage, finition direct
  order.push('finition', 'livraison');
  return order;
}

/** StepDef[] pour le circuit d'une catégorie. */
export function stepsForCategory(cat: LinenCategoryFr): StepDef[] {
  return buildSteps(pipelineForCategory(cat));
}

/**
 * Hook : retourne la séquence active des étapes.
 *
 * Pour l'instant figé sur DEFAULT_PIPELINE_ORDER. Pour brancher une config
 * API/DB :
 *   const { data } = useQuery({ queryKey: ['pipeline-steps'], ... });
 *   return buildSteps(data?.order ?? DEFAULT_PIPELINE_ORDER);
 */
export function usePipelineSteps(): StepDef[] {
  return buildSteps(DEFAULT_PIPELINE_ORDER);
}
