import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Shirt, ChevronRight, Check, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button, Modal, Input, Select, EmptyState, Badge } from '@/components/ui';
import { DataTable } from '@/components/table/DataTable';
import { usePermissions } from '@/hooks';
import { cn, formatCurrency } from '@/lib/utils';
import { useLinenTypes } from '@/hooks/queries/useLinenTypes';
import {
  useLinenCategories,
  useUpdateLinenCategory,
} from '@/hooks/queries/useLinenCategories';
import type { ApiLinenCategory } from '@/lib/api/linenCategories.api';
import { resolveAsset } from '@/lib/utils';
import { updateLinenType, uploadLinenTypeImage } from '@/lib/api/linenTypes.api';
import { useQueryClient } from '@tanstack/react-query';
import type { LinenType } from '@/types';
import {
  stepsForCategory,
  type LinenCategoryFr,
} from '@/lib/pipeline/steps';

const CATEGORY_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
  'Linge Plat': 'info',
  LP: 'info',
  'Linge Forme': 'success',
  LF: 'success',
  NAE: 'warning',
  'Nettoyage à sec': 'warning',
};

export default function LinenTypesPage() {
  const { canEdit } = usePermissions();
  const { data, isLoading, error } = useLinenTypes();
  const linenTypes: LinenType[] = data ?? [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LinenType | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return linenTypes;
    return linenTypes.filter((t) =>
      `${t.code} ${t.name} ${t.category}`.toLowerCase().includes(q),
    );
  }, [linenTypes, search]);

  const byCategory = useMemo(() => {
    return linenTypes.reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [linenTypes]);

  const columns = [
    {
      header: 'Code',
      accessorKey: 'code' as keyof LinenType,
      cell: (row: LinenType) => (
        <span className="font-mono text-sm font-semibold text-ink-900 tnum">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Nom',
      accessorKey: 'name' as keyof LinenType,
      cell: (row: LinenType) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-input bg-paper-2 border-hairline border-ink-200 flex items-center justify-center shrink-0">
            <Shirt className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold text-ink-900">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Catégorie',
      accessorKey: 'category' as keyof LinenType,
      cell: (row: LinenType) => (
        <Badge variant={CATEGORY_VARIANT[row.category] ?? 'neutral'} dot>
          {row.category}
        </Badge>
      ),
    },
    {
      header: 'Facturation',
      accessorKey: 'billingMode' as keyof LinenType,
      cell: (row: LinenType) => (
        <span className="text-sm text-ink-700">
          {row.billingMode === 'Poids' ? 'au kg' : 'à la pièce'}
        </span>
      ),
    },
    {
      header: 'Prix',
      accessorKey: 'unitPrice' as keyof LinenType,
      align: 'right' as const,
      cell: (row: LinenType) => (
        <span className="font-mono text-sm font-semibold text-ink-900 tnum">
          {formatCurrency(row.unitPrice)}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'id' as keyof LinenType,
      align: 'right' as const,
      cell: (row: LinenType) =>
        canEdit('settings') && (
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => {
                setSelectedType(row);
                setIsModalOpen(true);
              }}
              className="p-1.5 rounded-input hover:bg-paper-2 text-ink-500 hover:text-brand-800 transition-colors"
              title="Modifier"
            >
              <Pencil className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <button
              className="p-1.5 rounded-input hover:bg-danger-100 text-ink-500 hover:text-danger-600 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="caps mb-2">Types de linge</div>
          <h2 className="font-serif text-2xl font-medium tracking-tight text-ink-900">
            {linenTypes.length}
            <span className="text-ink-500 text-lg ml-2 font-normal">
              types configurés
            </span>
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Référentiel tarifaire par catégorie et mode de facturation.
          </p>
        </div>
        {canEdit('settings') && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Ajouter un type
          </Button>
        )}
      </div>

      {/* Categories editor — admin-configurable labels & emoji */}
      <LinenCategoriesSection counts={byCategory} canEdit={canEdit('settings')} />

      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="caps">Liste · {filtered.length}</div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un type, un code…"
            className="w-72 pl-9 pr-4 py-2 text-sm bg-paper border-hairline border-ink-200 rounded-input text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-800 focus:border-2"
          />
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-input border-hairline border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Impossible de charger les types : {(error as Error).message}
        </div>
      ) : linenTypes.length > 0 || isLoading ? (
        <DataTable
          data={filtered}
          columns={columns}
          emptyMessage={
            isLoading
              ? 'Chargement…'
              : search
                ? `Aucun résultat pour « ${search} »`
                : 'Aucun type de linge'
          }
        />
      ) : (
        <EmptyState
          icon={Plus}
          title="Aucun type de linge"
          message="Commence par ajouter des types de linge pour configurer ton système."
          actionLabel="Ajouter un type"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Modal */}
      <LinenTypeModal
        open={isModalOpen}
        selected={selectedType}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedType(null);
        }}
      />
    </div>
  );
}

/* ─── Image uploader (édition d'un type existant) ──────────────── */

function LinenTypeImageUploader({ linen }: { linen: LinenType }) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | undefined>(linen.imageUrl);
  const qc = useQueryClient();

  const displayUrl = resolveAsset(localUrl) ?? null;

  const handleFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const url = await uploadLinenTypeImage(file);
      await updateLinenType(linen.id, { imageUrl: url });
      setLocalUrl(url);
      qc.invalidateQueries({ queryKey: ['linen-types'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setBusy(true);
    try {
      await updateLinenType(linen.id, { imageUrl: null });
      setLocalUrl(undefined);
      qc.invalidateQueries({ queryKey: ['linen-types'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la suppression');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="block text-tiny font-medium text-ink-700 mb-1.5">
        Image catalogue
      </label>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-input border-hairline border-ink-200 bg-paper-2 overflow-hidden flex items-center justify-center">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={linen.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-7 h-7 text-ink-400" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-tiny font-semibold text-ink-800 bg-paper border-hairline border-ink-200 rounded-input hover:border-brand-800 disabled:opacity-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={2} />
            {busy ? 'Upload…' : displayUrl ? 'Remplacer' : 'Téléverser'}
          </button>
          {displayUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-tiny text-ink-600 hover:text-rose-600 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              Retirer
            </button>
          )}
          <p className="text-micro text-ink-500">
            PNG / JPG / WebP · 3 Mo max
          </p>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-tiny text-rose-700">{error}</p>
      )}
    </div>
  );
}

/* ─── Section catégories : label + emoji éditables ────────────── */

function LinenCategoriesSection({
  counts,
  canEdit,
}: {
  counts: Record<string, number>;
  canEdit: boolean;
}) {
  const { data: categories = [], isLoading } = useLinenCategories();

  if (isLoading) {
    return (
      <div className="card-surface p-4">
        <p className="text-tiny text-ink-500">Chargement des catégories…</p>
      </div>
    );
  }

  return (
    <div>
      <p className="caps mb-2">Catégories · {categories.length}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {categories.map((cat) => (
          <LinenCategoryCard
            key={cat.id}
            cat={cat}
            count={counts[cat.code] ?? counts[cat.label] ?? 0}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
}

function LinenCategoryCard({
  cat,
  count,
  canEdit,
}: {
  cat: ApiLinenCategory;
  count: number;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(cat.label);
  const [emoji, setEmoji] = useState(cat.emoji ?? '');
  const update = useUpdateLinenCategory();

  const handleSave = async () => {
    if (!label.trim()) return;
    await update.mutateAsync({
      id: cat.id,
      input: { label: label.trim(), emoji: emoji.trim() || null },
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setLabel(cat.label);
    setEmoji(cat.emoji ?? '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="card-surface p-3 space-y-2 border-brand-800 border-2">
        <p className="text-micro text-ink-500 uppercase tracking-wide">
          Code : <span className="font-mono">{cat.code}</span>
        </p>
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            placeholder="🛏"
            className="w-12 text-center text-base bg-paper border-hairline border-ink-200 rounded-input focus:outline-none focus:border-brand-800"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Linge plat"
            className="flex-1 text-sm bg-paper border-hairline border-ink-200 rounded-input px-2 focus:outline-none focus:border-brand-800"
          />
        </div>
        <div className="flex justify-end gap-1.5">
          <button
            onClick={handleCancel}
            className="p-1.5 text-ink-600 hover:text-ink-900 transition-colors"
            title="Annuler"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="p-1.5 bg-brand-800 text-paper rounded-input hover:bg-brand-900 disabled:opacity-50 transition-colors"
            title="Enregistrer"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {cat.emoji && (
            <span className="text-2xl leading-none">{cat.emoji}</span>
          )}
          <div className="min-w-0">
            <p className="text-tiny text-ink-500 font-mono">{cat.code}</p>
            <p className="text-sm font-semibold text-ink-900 truncate">
              {cat.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-serif text-xl font-medium tnum text-ink-900">
            {count}
          </span>
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-ink-500 hover:text-ink-900 transition-colors"
              title="Modifier"
            >
              <Pencil className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Modale création / édition (avec aperçu circuit) ──────────── */

function LinenTypeModal({
  open,
  selected,
  onClose,
}: {
  open: boolean;
  selected: LinenType | null;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<LinenCategoryFr>('Linge Plat');

  // Synchronise avec la sélection courante à l'ouverture
  useEffect(() => {
    if (selected) {
      const cat = selected.category;
      if (cat === 'Linge Plat' || cat === 'Linge Forme' || cat === 'NAE') {
        setCategory(cat);
      }
    } else {
      setCategory('Linge Plat');
    }
  }, [selected, open]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={selected ? 'Modifier le type de linge' : 'Nouveau type de linge'}
      subtitle="Code, catégorie, circuit, facturation et prix unitaire"
      size="lg"
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Code"
            placeholder="LP-001"
            defaultValue={selected?.code ?? ''}
            required
          />
          <Select
            label="Catégorie"
            value={category}
            onChange={(e) => setCategory(e.target.value as LinenCategoryFr)}
            options={[
              { label: 'Linge Plat', value: 'Linge Plat' },
              { label: 'Linge Forme', value: 'Linge Forme' },
              { label: 'NAE', value: 'NAE' },
            ]}
            required
          />
        </div>

        {/* Aperçu circuit (live) */}
        <CircuitPreview category={category} />

        <Input
          label="Nom"
          placeholder="Drap 2 personnes"
          defaultValue={selected?.name ?? ''}
          required
        />

        {/* Image catalogue — visible uniquement en édition (besoin de l'id). */}
        {selected && <LinenTypeImageUploader linen={selected} />}

        <Select
          label="Mode de facturation"
          defaultValue={selected?.billingMode ?? 'Poids'}
          options={[
            { label: 'Au poids (kg)', value: 'Poids' },
            { label: 'À la pièce', value: 'Pièce' },
          ]}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prix unitaire (F CFA)"
            type="number"
            placeholder="500"
            defaultValue={selected?.unitPrice ?? ''}
            required
          />
          <Input label="Temps de traitement (min)" type="number" placeholder="45" />
        </div>

        <Input
          label="Instructions spéciales"
          placeholder="Optionnel"
          hint="Visibles sur le bordereau de triage"
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">
            {selected ? 'Mettre à jour' : 'Créer le type'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Aperçu visuel du circuit que suivra une pièce de cette catégorie. */
function CircuitPreview({ category }: { category: LinenCategoryFr }) {
  const steps = stepsForCategory(category);

  // Étapes "skipées" relativement à la séquence complète (pour signaler ce
  // qui est NON traversé quand on choisit cette catégorie).
  const allKeys = ['triage', 'lavage', 'sechage', 'calandrage', 'repassage', 'finition', 'livraison'];
  const usedKeys = new Set(steps.map((s) => s.key));
  const skipped = allKeys.filter((k) => !usedKeys.has(k));

  const HINT: Record<LinenCategoryFr, string> = {
    'Linge Plat':
      'Draps, taies, nappes, serviettes — passe par la calandre.',
    'Linge Forme':
      'Chemises, pantalons, blouses — passe par la presse à repasser.',
    NAE: 'Tapis, éponges, t-shirts — finition directe (pas de calandre ni de presse).',
  };

  return (
    <div className="rounded-input border-hairline border-brand-200 bg-brand-50 p-3">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-tiny font-semibold text-brand-800 uppercase tracking-wide">
          Circuit appliqué
        </p>
        <p className="text-micro text-ink-500">{steps.length} étapes</p>
      </div>

      <div className="flex flex-wrap items-center gap-y-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill border-hairline bg-paper',
                  s.accentBg,
                )}
              >
                <Icon className={cn('w-3 h-3', s.accent)} strokeWidth={2} />
                <span className="text-tiny font-semibold text-ink-900">
                  {s.shortLabel}
                </span>
              </span>
              {i < steps.length - 1 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-ink-400 mx-0.5 shrink-0"
                  strokeWidth={2}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-tiny text-ink-700 mt-2 italic">{HINT[category]}</p>

      {skipped.length > 0 && (
        <p className="text-micro text-ink-500 mt-1">
          Étape{skipped.length > 1 ? 's' : ''} non concernée
          {skipped.length > 1 ? 's' : ''} :{' '}
          <span className="line-through">
            {skipped
              .map((k) =>
                k === 'calandrage'
                  ? 'Calandrage'
                  : k === 'repassage'
                    ? 'Repassage'
                    : k,
              )
              .join(', ')}
          </span>
        </p>
      )}
    </div>
  );
}
