import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { useWaitlist } from '@/hooks/useWaitlist';

interface WaitlistFormProps {
  source: string;
  variant?: 'dark' | 'light';
}

export default function WaitlistForm({ source, variant = 'dark' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const { state, error, alreadySubscribed, subscribe, reset } = useWaitlist();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    subscribe(email.trim(), source);
  }

  if (state === 'success') {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 text-emerald-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">
            {alreadySubscribed ? "You're already on the list!" : "You're on the list! Check your email."}
          </span>
        </div>
        <button
          onClick={reset}
          className="mt-3 block mx-auto text-sm text-slate-500 hover:text-slate-400 transition-colors"
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
      <div className="flex-1">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === 'loading'}
          className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl focus:outline-none transition-colors disabled:opacity-50 ${
            variant === 'dark'
              ? 'bg-white/10 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
              : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
          }`}
        />
        {state === 'error' && error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={state === 'loading'}
        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all disabled:opacity-50 whitespace-nowrap shrink-0 flex items-center justify-center gap-2"
      >
        {state === 'loading' ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Joining...
          </span>
        ) : (
          <>
            Get Early Access
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
