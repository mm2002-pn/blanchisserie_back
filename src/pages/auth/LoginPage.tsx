import { useState } from 'react';
import type { FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input, BrandMark } from '@/components/ui';
import { useAuth } from '@/hooks';

const STATS = [
  { value: '7', label: 'Étapes de workflow' },
  { value: '22', label: 'Programmes de lavage' },
  { value: '100%', label: 'Traçabilité qualité' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trust, setTrust] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left banner — brand hero */}
      <aside className="lg:flex-[1.05] bg-brand-900 text-paper flex flex-col justify-center gap-10 p-10 lg:p-14">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <BrandMark variant="full" className="w-11 h-11 shrink-0" />
          <span className="w-px h-[34px] bg-brand-600" />
          <div className="leading-none">
            <div className="font-heading font-bold text-[19px] tracking-tight text-white">
              B&amp;C
            </div>
            <div className="font-heading font-medium text-[9px] tracking-[0.26em] text-terra-500 mt-1.5">
              TERANGA
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div>
          <div className="font-heading font-bold text-[11px] tracking-[0.22em] uppercase text-terra-500">
            Poste de pilotage
          </div>
          <h1 className="font-heading font-bold text-[38px] leading-[1.04] tracking-tight text-white mt-3.5 max-w-[16ch] text-pretty">
            De la collecte à la facture, sans ressaisie.
          </h1>
          <p className="text-[14.5px] text-ink-400 mt-4 leading-relaxed max-w-[40ch]">
            Commandes, réception du linge, atelier du jour, tournées et
            facturation — un seul poste de travail pour toute l'usine.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 flex-wrap pt-7 border-t border-brand-600">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-heading font-bold text-[22px] leading-none text-white">
                {s.value}
              </div>
              <div className="text-[11px] text-[#8AB8DE] mt-1.5 tracking-[0.04em]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Right form */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-paper">
        <div className="w-full max-w-sm">
          <div className="font-heading font-bold text-[27px] tracking-tight text-ink-800">
            Connexion
          </div>
          <p className="text-[13.5px] text-ink-500 mt-1.5 leading-relaxed">
            Réservé aux comptes usine. Les hôtels et chauffeurs passent par
            l'application mobile.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-6">
            <Input
              type="email"
              label="Identifiant"
              placeholder="prenom.nom@bcteranga.sn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div className="w-full">
              <div className="flex justify-between items-baseline gap-2.5">
                <label
                  htmlFor="login-password"
                  className="block text-tiny font-semibold text-ink-700"
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[11.5px] font-semibold text-terra-600 hover:text-terra-700"
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1.5 w-full px-3 py-2 bg-paper-2 border border-ink-300 rounded-input text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:bg-paper focus:border-brand-800 focus:ring-2 focus:ring-brand-800/15 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-terra-100 border-l-[3px] border-danger-600 px-3.5 py-3">
                <span className="shrink-0 w-[17px] h-[17px] mt-px rounded-full bg-danger-600 text-white text-[11px] font-heading font-bold flex items-center justify-center">
                  !
                </span>
                <span className="flex-1 text-[12.5px] text-danger-600 leading-relaxed">
                  {error}
                </span>
              </div>
            )}

            <label className="flex items-center gap-2.5 cursor-pointer select-none py-0.5">
              <input
                type="checkbox"
                checked={trust}
                onChange={(e) => setTrust(e.target.checked)}
                className="sr-only"
              />
              <span
                className={cn(
                  'shrink-0 w-[19px] h-[19px] border-[1.5px] flex items-center justify-center text-white text-[11px] font-bold transition-colors',
                  trust ? 'bg-brand-800 border-brand-800' : 'bg-paper border-ink-300'
                )}
              >
                {trust ? '✓' : ''}
              </span>
              <span className="flex-1 text-[12.5px] text-ink-600">
                Poste de confiance — garder la session 12 h
              </span>
            </label>

            <Button
              type="submit"
              size="lg"
              className="w-full !bg-brand-900 hover:!bg-brand-800"
              isLoading={isLoading}
              disabled={!email || !password}
            >
              Se connecter
            </Button>

            <div className="flex justify-between gap-3 text-[12.5px]">
              <button
                type="button"
                className="text-terra-600 font-semibold hover:text-terra-700"
              >
                Mot de passe oublié ?
              </button>
              <span className="text-ink-500">Aide : 33 869 12 40</span>
            </div>
          </form>

          <p className="text-center text-micro font-mono text-ink-500 mt-8">
            B&amp;C Teranga · v1.0.0
          </p>
        </div>
      </main>
    </div>
  );
}
