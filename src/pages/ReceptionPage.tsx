import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Delete, CheckCircle2, PanelRightClose, PanelRightOpen } from 'lucide-react';
import {
  useOrders,
  useOrdersRealtime,
  useReceiveOrder,
} from '@/hooks/queries/useOrders';
import { useLinenTypes } from '@/hooks/queries/useLinenTypes';
import { useCreateTriage } from '@/hooks/queries/useTriage';
import { openOrderDocument } from '@/lib/api/documents.api';
import { usePageHeader } from '@/context/PageHeaderContext';

/**
 * Réception atelier — pesée officielle + triage par type de linge, réunis
 * dans un seul écran (comme dans la maquette) : une commande sélectionnée
 * dans la file du haut ouvre son panneau de triage juste en dessous.
 */

type QueueOrder = {
  id: string;
  orderNumber: string;
  clientName?: string;
  apiStatus?: string;
  driverWeight?: number;
  driverPieces?: number;
  receivedWeight?: number;
  receivedPieces?: number;
  driverItems?: { type: string; quantity: number }[];
  estimatedItemsRaw?: { type: string; quantity: number }[];
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function ReceptionPage() {
  usePageHeader({
    eyebrow: 'Atelier',
    title: 'Réception',
    sub: 'Toute commande déposée est pesée puis ventilée par type.',
  });

  useOrdersRealtime();
  const { data: ordersData, isLoading } = useOrders({ pageSize: 200 });
  const orders = (ordersData?.items ?? []) as QueueOrder[];
  const { data: linenTypes = [] } = useLinenTypes();
  const receive = useReceiveOrder();
  const triage = useCreateTriage();

  const queue = useMemo(
    () =>
      orders.filter(
        (o) =>
          (o.apiStatus === 'collected' && (o as any).unloadedAt != null && !o.receivedWeight) ||
          o.apiStatus === 'received',
      ),
    [orders],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId && queue.length > 0) setSelectedId(queue[0].id);
  }, [queue, selectedId]);

  const selected = orders.find((o) => o.id === selectedId);
  const needsTriage = selected?.apiStatus === 'received';

  const totalKg = queue.reduce((s, o) => s + (o.driverWeight ?? o.receivedWeight ?? 0) / 1000, 0);

  // ── Pesée : draft de poids par commande (kg), init depuis le poids chauffeur ──
  const [weightDraft, setWeightDraft] = useState<Record<string, number>>({});
  const getDraftKg = (o: QueueOrder) =>
    weightDraft[o.id] ?? round1((o.driverWeight ?? 0) / 1000);
  const bumpWeight = (o: QueueOrder, delta: number) =>
    setWeightDraft((prev) => ({
      ...prev,
      [o.id]: Math.max(0, round1(getDraftKg(o) + delta)),
    }));

  const [weighError, setWeighError] = useState<string | null>(null);
  const handleWeigh = async (o: QueueOrder) => {
    const kg = getDraftKg(o);
    if (kg <= 0) {
      setWeighError('Saisis un poids valide avant de peser.');
      return;
    }
    setWeighError(null);
    try {
      await receive.mutateAsync({
        id: o.id,
        data: {
          receivedWeight: Math.round(kg * 1000),
          receivedPieces: o.driverPieces || 1,
          acceptDeviation: true,
        },
      });
      setSelectedId(o.id);
    } catch (err) {
      setWeighError(err instanceof Error ? err.message : 'Échec de la pesée.');
    }
  };

  // ── Triage : compteurs par type de linge pour la commande sélectionnée ──
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [triageError, setTriageError] = useState<string | null>(null);
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null);
  const prefilledFor = useRef<string | null>(null);

  useEffect(() => {
    if (!selected || !needsTriage) return;
    if (prefilledFor.current === selected.id) return;
    const idByCode: Record<string, string> = {};
    for (const lt of linenTypes) idByCode[lt.code] = lt.id;
    const source = selected.driverItems?.length
      ? selected.driverItems
      : (selected.estimatedItemsRaw ?? []);
    const next: Record<string, number> = {};
    for (const it of source) {
      const id = idByCode[it.type];
      if (id && it.quantity > 0) next[id] = it.quantity;
    }
    setCounts(next);
    prefilledFor.current = selected.id;
  }, [selected, needsTriage, linenTypes]);

  const ltById = useMemo(() => {
    const m: Record<string, (typeof linenTypes)[number]> = {};
    for (const lt of linenTypes) m[lt.id] = lt;
    return m;
  }, [linenTypes]);

  const totals = useMemo(() => {
    let pieces = 0;
    let weightG = 0;
    for (const [id, n] of Object.entries(counts)) {
      const lt = ltById[id];
      if (!lt) continue;
      pieces += n;
      weightG += n * (lt.averageWeight ?? 0);
    }
    return { pieces, weightKg: weightG / 1000 };
  }, [counts, ltById]);

  const officialKg = selected ? (selected.receivedWeight ?? 0) / 1000 : 0;
  const over = officialKg > 0 && totals.weightKg > officialKg * 1.05;

  const bump = (id: string, delta: number) =>
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));

  const addableTypes = linenTypes.filter((lt) => !counts[lt.id]);

  const handleTriageSubmit = async () => {
    if (totals.pieces <= 0) {
      setTriageError('Compte au moins une pièce avant de valider.');
      return;
    }
    setTriageError(null);
    const items = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([linenTypeId, n]) => ({
        linenTypeId,
        pieces: n,
        weight: n * (ltById[linenTypeId]?.averageWeight ?? 0),
      }));
    try {
      await triage.mutateAsync({
        orderId: selected!.id,
        data: { items, acceptDeviation: true },
      });
      setJustSubmittedId(selected!.id);
      setCounts({});
      prefilledFor.current = null;
      setSelectedId(null);
    } catch (err) {
      setTriageError(err instanceof Error ? err.message : 'Échec du triage.');
    }
  };

  const [panelOpen, setPanelOpen] = useState(true);

  // ── Clavier plein écran (saisie rapide au gant/à distance) ──
  const [focusedWeightId, setFocusedWeightId] = useState<string | null>(null);
  const [focusedTriageId, setFocusedTriageId] = useState<string | null>(null);
  const focusedWeightOrder = queue.find((o) => o.id === focusedWeightId);

  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const downloadBordereau = async (orderId: string) => {
    setPdfLoadingId(orderId);
    try {
      await openOrderDocument(orderId, 'bordereau-triage');
    } finally {
      setPdfLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start">
      {/* Table de pesée — colonne gauche, scroll interne (n'entraîne pas le panneau de droite) */}
      <div className="flex-1 min-w-0 w-full bg-paper border border-ink-200">
        <div className="px-5 py-4 border-b border-ink-200 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="font-heading font-bold text-xl text-ink-900">Linge arrivé à l'atelier</p>
            <p className="text-[12.5px] text-ink-600 mt-0.5">
              Toute commande déposée est pesée puis ventilée par type. Cliquez une ligne pour la trier.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[12.5px] text-ink-600">
              {queue.length} commande{queue.length > 1 ? 's' : ''} · {totalKg.toFixed(1)} kg
            </p>
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="w-8 h-8 flex items-center justify-center border border-ink-200 text-ink-700 hover:border-terra-600 hover:bg-terra-100 hover:text-terra-700 transition-colors"
              title={panelOpen ? 'Masquer le panneau de triage' : 'Afficher le panneau de triage'}
            >
              {panelOpen ? (
                <PanelRightClose className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <PanelRightOpen className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            <div className="grid grid-cols-[110px_minmax(160px,1fr)_80px_90px_160px_90px_110px_100px] gap-3 px-5 py-3 bg-[#FAFBFC] border-b border-ink-200 text-[10px] font-heading font-bold uppercase tracking-[0.12em] text-ink-600 sticky top-0 z-10">
              <span>Commande</span>
              <span>Client</span>
              <span>Estimé</span>
              <span>Chauffeur</span>
              <span>Poids officiel</span>
              <span>Écart</span>
              <span>État</span>
              <span />
            </div>

            <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
            {isLoading ? (
              <p className="text-tiny text-ink-500 italic px-5 py-6">Chargement…</p>
            ) : queue.length === 0 ? (
              <p className="text-tiny text-ink-500 px-5 py-6">
                Aucune commande en attente de pesée ou de triage.
              </p>
            ) : (
              queue.map((o) => {
                const isSelected = o.id === selectedId;
                const weighed = o.apiStatus !== 'collected';
                const driverKg = (o.driverWeight ?? 0) / 1000;
                const officialKgRow = weighed
                  ? (o.receivedWeight ?? 0) / 1000
                  : getDraftKg(o);
                const gapPct =
                  weighed && driverKg > 0
                    ? ((officialKgRow - driverKg) / driverKg) * 100
                    : null;

                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedId(o.id)}
                    className="grid grid-cols-[110px_minmax(160px,1fr)_80px_90px_160px_90px_110px_100px] gap-3 px-5 py-3 border-b border-[#F4F6F9] items-center text-[13px] cursor-pointer"
                    style={{
                      background: isSelected ? '#FCEBD9' : '#fff',
                      borderLeft: `3px solid ${weighed ? '#2C7A4B' : '#F0A03D'}`,
                    }}
                  >
                    <span className="font-heading font-semibold text-ink-800 truncate">
                      {o.orderNumber}
                    </span>
                    <span className="truncate">{o.clientName ?? '—'}</span>
                    <span className="text-ink-600">
                      {(o as any).estimatedWeight ? `${(o as any).estimatedWeight} kg` : '—'}
                    </span>
                    <span className="text-ink-600">{driverKg > 0 ? `${driverKg.toFixed(1)} kg` : '—'}</span>

                    {weighed ? (
                      <span className="font-heading font-bold text-ink-900">
                        {officialKgRow.toFixed(1)} kg
                      </span>
                    ) : (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => bumpWeight(o, -0.5)}
                          className="w-[30px] h-[30px] flex-none border border-ink-200 bg-[#FAFBFC] text-ink-800 font-heading"
                        >
                          −
                        </button>
                        <button
                          onClick={() => setFocusedWeightId(o.id)}
                          className="flex-1 text-center font-heading font-bold text-sm"
                          title="Saisie rapide au clavier"
                        >
                          {officialKgRow.toFixed(1)}
                        </button>
                        <button
                          onClick={() => bumpWeight(o, 0.5)}
                          className="w-[30px] h-[30px] flex-none border-none bg-brand-800 text-white font-heading"
                        >
                          +
                        </button>
                      </div>
                    )}

                    <span
                      className="font-heading font-bold"
                      style={{
                        color:
                          gapPct == null
                            ? '#8B97A8'
                            : Math.abs(gapPct) > 10
                              ? '#C1441F'
                              : '#2C7A4B',
                      }}
                    >
                      {gapPct == null ? '—' : `${gapPct > 0 ? '+' : ''}${gapPct.toFixed(1)}%`}
                    </span>

                    <span
                      className="text-[10px] font-heading font-bold uppercase tracking-[0.05em] text-center px-2 py-1"
                      style={{
                        background: weighed ? '#E4F3E9' : '#FCEBD9',
                        color: weighed ? '#2C7A4B' : '#B3540A',
                      }}
                    >
                      {weighed ? 'À trier' : 'À peser'}
                    </span>

                    {weighed ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(o.id);
                        }}
                        className="h-[34px] border-none bg-brand-800 text-white text-[11.5px] font-heading font-bold"
                      >
                        Trier
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWeigh(o);
                        }}
                        disabled={receive.isPending}
                        className="h-[34px] border-none bg-terra-600 text-white text-[11.5px] font-heading font-bold disabled:opacity-50"
                      >
                        Peser
                      </button>
                    )}
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>

        {weighError && (
          <p className="px-5 py-2 text-tiny text-danger-600 bg-danger-100">{weighError}</p>
        )}
      </div>

      {/* Panneau de triage — colonne droite, figée : reste visible sans scroller. Repliable. */}
      {panelOpen && (
      <div className="w-full xl:w-[400px] flex-none xl:sticky xl:top-4">
      {selected && needsTriage ? (
        <div className="bg-paper border border-ink-200 p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="order-last w-7 h-7 flex-none flex items-center justify-center text-ink-500 hover:text-terra-700"
              title="Masquer le panneau"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <div>
              <p className="caps">Triage de la commande sélectionnée</p>
              <p className="font-heading font-bold text-lg text-ink-900 mt-1.5">
                {selected.orderNumber}
              </p>
              <p className="text-[12.5px] text-ink-600 mt-0.5">{officialKg.toFixed(1)} kg pesés</p>
            </div>
            <div className="text-right">
              <p
                className="font-heading font-bold text-[19px]"
                style={{ color: over ? '#C1441F' : '#17356B' }}
              >
                {totals.weightKg.toFixed(1)} / {officialKg.toFixed(1)} kg
              </p>
              <p className="text-[11.5px] text-ink-600 mt-0.5">{totals.pieces} pièces comptées</p>
            </div>
          </div>

          {over && (
            <div className="mt-4 bg-danger-100 border-l-[3px] border-danger-600 px-3.5 py-3 text-[12.5px] text-danger-600 leading-relaxed">
              Le total compté dépasse la pesée officielle de plus de 5 %. Vérifie le comptage.
            </div>
          )}

          <div className="flex flex-col gap-4 mt-5">
            {Object.keys(counts).length === 0 ? (
              <p className="text-tiny text-ink-500">Aucun article pré-rempli — ajoute un type ci-dessous.</p>
            ) : (
              Object.entries(counts).map(([id, n]) => {
                const lt = ltById[id];
                if (!lt) return null;
                const pct = officialKg > 0 ? Math.min(100, ((n * lt.averageWeight) / 1000 / officialKg) * 100) : 0;
                return (
                  <div key={id}>
                    <div className="flex items-center justify-between gap-3.5">
                      <span className="text-[13.5px] font-medium text-ink-900">{lt.name}</span>
                      <div className="flex items-center gap-1 flex-none">
                        <button
                          onClick={() => bump(id, -1)}
                          className="w-[30px] h-[30px] border border-ink-200 bg-[#FAFBFC] font-heading text-ink-800"
                        >
                          −
                        </button>
                        <button
                          onClick={() => setFocusedTriageId(id)}
                          className="w-12 text-center font-heading font-bold text-[13.5px]"
                          title="Saisie rapide au clavier"
                        >
                          {n}
                        </button>
                        <button
                          onClick={() => bump(id, 1)}
                          className="w-[30px] h-[30px] border-none bg-brand-800 text-white font-heading"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5 h-[7px] bg-ink-200 overflow-hidden">
                      <div
                        className="h-full bg-brand-800"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {addableTypes.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) bump(e.target.value, 1);
              }}
              className="mt-4 h-9 px-2 text-tiny font-heading bg-paper-2 border border-ink-300 rounded-input text-ink-700"
            >
              <option value="">+ Ajouter un type d'article…</option>
              {addableTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
          )}

          {triageError && (
            <p className="mt-3 text-tiny text-danger-600">{triageError}</p>
          )}

          <div className="flex gap-2.5 mt-4">
            <button
              onClick={handleTriageSubmit}
              disabled={triage.isPending}
              className="flex-1 h-11 border-none bg-brand-800 text-white font-heading font-bold text-[12.5px] disabled:opacity-50"
            >
              Valider et envoyer au triage
            </button>
            <button
              onClick={() => downloadBordereau(selected.id)}
              disabled={pdfLoadingId === selected.id}
              className="h-11 px-4 border border-ink-200 bg-paper text-ink-800 font-heading font-bold text-[12.5px] disabled:opacity-50"
            >
              Bordereau PDF
            </button>
          </div>
          <p className="mt-3 pt-3 border-t border-ink-200 text-[12px] text-ink-600 leading-relaxed">
            Une fois triée, la commande rejoint le linge prêt pour l'atelier. Le lancement en production reste une décision distincte, prise dans l'atelier du jour.
          </p>
        </div>
      ) : justSubmittedId ? (
        <div className="bg-ok-100 border-l-[3px] border-ok-600 px-4 py-3 text-sm text-ok-700">
          Triage confirmé ✓ — la commande a rejoint le linge prêt pour l'atelier.
        </div>
      ) : (
        <div className="border border-dashed border-ink-300 p-6 text-center text-tiny text-ink-500">
          Sélectionne une commande dans la liste pour la peser ou la trier.
        </div>
      )}
      </div>
      )}

      {/* Clavier plein écran — pesée (décimal) */}
      {focusedWeightOrder && (
        <FocusKeypad
          mode="decimal"
          title="Pesée atelier"
          subtitle={
            focusedWeightOrder.driverWeight
              ? `Référence chauffeur : ${(focusedWeightOrder.driverWeight / 1000).toFixed(1)} kg`
              : undefined
          }
          unit="kg"
          initialValue={getDraftKg(focusedWeightOrder)}
          onCancel={() => setFocusedWeightId(null)}
          onValidate={(v) => {
            setWeightDraft((prev) => ({ ...prev, [focusedWeightOrder.id]: round1(v) }));
            setFocusedWeightId(null);
          }}
        />
      )}

      {/* Clavier plein écran — triage (entier + quick-add) */}
      {focusedTriageId && ltById[focusedTriageId] && (
        <FocusKeypad
          mode="integer"
          title={ltById[focusedTriageId].name}
          subtitle={`${ltById[focusedTriageId].code} · ${ltById[focusedTriageId].averageWeight}g/pièce`}
          unit="pcs"
          quickAdd={[5, 10, 25]}
          initialValue={counts[focusedTriageId] ?? 0}
          onCancel={() => setFocusedTriageId(null)}
          onValidate={(v) => {
            setCounts((prev) => ({ ...prev, [focusedTriageId]: Math.round(v) }));
            setFocusedTriageId(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Clavier plein écran (décimal pour kg, entier pour pièces) ─── */

function FocusKeypad({
  mode,
  title,
  subtitle,
  unit,
  quickAdd,
  initialValue,
  onCancel,
  onValidate,
}: {
  mode: 'decimal' | 'integer';
  title: string;
  subtitle?: string;
  unit: string;
  quickAdd?: number[];
  initialValue: number;
  onCancel: () => void;
  onValidate: (n: number) => void;
}) {
  const [draft, setDraft] = useState<string>(() => {
    if (initialValue === 0) return '';
    if (mode === 'decimal') return initialValue.toString().replace('.', ',');
    return String(Math.round(initialValue));
  });

  const parsed =
    mode === 'decimal'
      ? parseFloat(draft.replace(',', '.')) || 0
      : parseInt(draft, 10) || 0;

  const pressDigit = (d: string) => {
    setDraft((prev) => {
      if (prev === '0' && d !== ',') return d;
      if (prev === '' && d === ',') return '0,';
      if (d === ',' && prev.includes(',')) return prev;
      const next = `${prev}${d}`;
      return next.length > 7 ? prev : next;
    });
  };
  const pressBack = () => setDraft((prev) => prev.slice(0, -1));
  const pressClear = () => setDraft('');
  const bump = (delta: number) => setDraft(String(Math.max(0, parsed + delta)));

  return (
    <div className="fixed inset-0 z-40 bg-ink-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-paper shadow-2xl border-2 border-brand-800 flex flex-col max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-ink-200 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="font-heading font-bold text-lg text-ink-900 truncate">{title}</p>
            {subtitle && (
              <p className="text-tiny text-ink-600 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 flex items-center justify-center text-ink-500 hover:bg-paper-2 shrink-0"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 py-5 bg-terra-100">
            <p className="text-center text-micro text-ink-600 uppercase tracking-wide mb-2">Saisie</p>
            <p className="font-heading text-6xl font-bold text-brand-800 text-center leading-none break-all">
              {draft || '0'}
              <span className="text-2xl font-normal text-brand-800/60 ml-2">{unit}</span>
            </p>
          </div>

          {quickAdd && (
            <div className="grid grid-cols-3 gap-2 p-3 border-b border-ink-200">
              {quickAdd.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => bump(n)}
                  className="h-11 bg-brand-800 text-white font-heading font-semibold text-sm"
                >
                  +{n}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 p-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <KeypadBtn key={d} onClick={() => pressDigit(d)}>
                {d}
              </KeypadBtn>
            ))}
            {mode === 'decimal' ? (
              <KeypadBtn onClick={() => pressDigit(',')} variant="muted">
                ,
              </KeypadBtn>
            ) : (
              <KeypadBtn onClick={pressClear} variant="muted">
                C
              </KeypadBtn>
            )}
            <KeypadBtn onClick={() => pressDigit('0')}>0</KeypadBtn>
            <KeypadBtn onClick={pressBack} variant="muted">
              <Delete className="w-6 h-6" strokeWidth={2} />
            </KeypadBtn>
          </div>
          {mode === 'decimal' && (
            <div className="px-3 pb-3">
              <button
                type="button"
                onClick={pressClear}
                className="w-full h-11 bg-paper-2 text-ink-700 font-heading text-sm font-semibold"
              >
                Effacer
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-3 border-t border-ink-200 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-12 border border-ink-300 bg-paper text-ink-800 font-heading font-semibold text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onValidate(parsed)}
            disabled={parsed <= 0}
            className="flex-[2] h-12 bg-brand-800 text-white font-heading font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

function KeypadBtn({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'muted';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === 'muted'
          ? 'h-14 bg-paper-2 text-ink-700 font-heading text-xl font-semibold flex items-center justify-center'
          : 'h-14 bg-paper border border-ink-200 text-ink-900 font-heading text-xl font-semibold flex items-center justify-center'
      }
    >
      {children}
    </button>
  );
}
