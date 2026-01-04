import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="min-h-screen bg-primary-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-accent-500 rounded-xl items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Blanchisserie Pro
          </h1>
          <p className="text-gray-600 mt-2">Connectez-vous à votre compte</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-error-light bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            type="email"
            label="Email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={!email || !password}
          >
            Se connecter
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-info bg-opacity-10 rounded-lg">
          <p className="text-sm text-info-dark font-medium mb-2">
            Identifiants de démonstration :
          </p>
          <p className="text-sm text-gray-600">
            Email : <code className="bg-white px-2 py-1 rounded">admin@blanchisserie.com</code>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Mot de passe : <code className="bg-white px-2 py-1 rounded">password</code>
          </p>
        </div>
      </Card>
    </div>
  );
}
