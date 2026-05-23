import { useState } from 'react';
import type { FormEvent } from 'react';
import { Droplet, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
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
      <aside className="lg:flex-[1.1] bg-brand-900 text-paper flex flex-col justify-between p-10 lg:p-14 relative overflow-hidden">
        {/* Ambient shapes */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-800 opacity-60" />
        <div className="pointer-events-none absolute bottom-10 -left-20 w-72 h-72 rounded-full bg-terra-600 opacity-20" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-terra-600 rounded-xl flex items-center justify-center">
            <span className="font-serif font-medium text-xl text-paper">B</span>
          </div>
          <div>
            <div className="font-serif text-xl font-medium tracking-tight leading-none">
              Blanchisserie SN
            </div>
            <div className="text-micro font-mono text-brand-100 mt-1">
              Admin · Dakar
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10 max-w-md">
          <div className="caps text-brand-100 mb-4">Gestion professionnelle</div>
          <h1 className="font-serif text-4xl lg:text-5xl font-medium leading-[1.05] tracking-tight mb-4">
            Pilote ton atelier comme une rédaction.
          </h1>
          <p className="text-sm text-brand-100 leading-relaxed">
            Commandes, production, facturation, équipes. Tout l'outil de gestion
            pour les blanchisseries industrielles du Sénégal.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 grid grid-cols-3 gap-6 max-w-lg">
          <Feature icon={<Droplet className="w-4 h-4" strokeWidth={1.75} />} label="Workflow 7 étapes" />
          <Feature icon={<Sparkles className="w-4 h-4" strokeWidth={1.75} />} label="Qualité tracée" />
          <Feature icon={<Shield className="w-4 h-4" strokeWidth={1.75} />} label="Multi-rôles" />
        </div>
      </aside>

      {/* Right form */}
      <main className="flex-[1] flex items-center justify-center p-6 lg:p-12 bg-paper">
        <div className="w-full max-w-sm">
          <div className="caps mb-2">Connexion</div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-ink-900 mb-2">
            Accède à ton espace
          </h2>
          <p className="text-tiny text-ink-500 mb-8">
            Entre tes identifiants pour continuer.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 bg-danger-100 border-hairline border-danger-600 text-danger-600 px-3 py-2.5 rounded-input text-tiny">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <Input
              type="email"
              label="Email professionnel"
              placeholder="nom@etablissement.sn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-ink-300 text-brand-800 focus:ring-brand-500 focus:ring-offset-0"
                />
                <span className="text-tiny text-ink-700">Se souvenir</span>
              </label>
              <a
                href="#"
                className="text-tiny font-medium text-brand-800 hover:text-brand-700"
              >
                Mot de passe oublié ?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={!email || !password}
            >
              Se connecter
            </Button>
          </form>

          {/* Demo creds — clic = pré-remplit le formulaire */}
          <div className="mt-8 p-4 bg-paper-2 rounded-input border-hairline border-ink-200">
            <p className="caps mb-2">Accès démo</p>
            <p className="text-tiny text-ink-600 mb-2">
              Mot de passe pour tous :{' '}
              <code className="font-mono text-ink-900">Password!1</code>
            </p>
            <div className="space-y-1">
              {[
                ['Admin', 'admin@blanchisserie.sn'],
                ['Manager', 'mgr@blanchisserie.sn'],
                ['Superviseur', 'sup@blanchisserie.sn'],
                ['Opérateur', 'op1@blanchisserie.sn'],
                ['Chauffeur', 'driver@blanchisserie.sn'],
              ].map(([role, mail]) => (
                <button
                  key={mail}
                  type="button"
                  onClick={() => {
                    setEmail(mail);
                    setPassword('Password!1');
                  }}
                  className="w-full flex items-center justify-between gap-3 px-2 py-1 rounded hover:bg-paper text-left transition-colors"
                >
                  <span className="text-tiny font-semibold text-ink-700">
                    {role}
                  </span>
                  <code className="font-mono text-tiny text-ink-500 truncate">
                    {mail}
                  </code>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-micro font-mono text-ink-500 mt-8">
            Blanchisserie SN · v1.0.0
          </p>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="w-8 h-8 rounded-lg bg-brand-800 border-hairline border-brand-700 flex items-center justify-center mb-2">
        {icon}
      </div>
      <div className="text-tiny font-medium text-brand-100 leading-snug">
        {label}
      </div>
    </div>
  );
}
