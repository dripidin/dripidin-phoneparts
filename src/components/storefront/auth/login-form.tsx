'use client';

// HamzaPhone Customer Login Form with Email/Password & Social OAuth

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { loginWithPasswordAction } from '@/lib/actions/auth.actions';
import { OAuthButtons } from './oauth-buttons';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('next') || searchParams.get('redirect') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Veuillez renseigner votre email et mot de passe');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await loginWithPasswordAction({ email, password });
      if (!res.success) {
        setErrorMsg(res.error || 'Identifiants invalides');
        setIsLoading(false);
        return;
      }

      // Successful login redirect
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-10 shadow-xl max-w-md w-full mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-extrabold border border-orange-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Espace Client & Réparateur</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Connexion
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Accédez à vos commandes, adresses et tarifs réservés.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Social OAuth Buttons */}
      <div className="space-y-3">
        <OAuthButtons redirectTo={redirectTo} />

        <div className="relative flex items-center justify-center py-2">
          <div className="border-t border-gray-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider absolute">
            OU PAR EMAIL
          </span>
        </div>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 block">
            Adresse Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.dz"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 block">
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connexion en cours...</span>
            </>
          ) : (
            <>
              <span>Se Connecter</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

      </form>

      {/* Register Links */}
      <div className="pt-4 border-t border-gray-100 text-center space-y-2">
        <p className="text-xs text-gray-600">
          Pas encore de compte ?{' '}
          <Link
            href={`/register${redirectTo !== '/account' ? `?next=${encodeURIComponent(redirectTo)}` : ''}`}
            className="font-bold text-orange-600 hover:underline"
          >
            Créer un compte particulier ou pro
          </Link>
        </p>
      </div>

    </div>
  );
}
