import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { cn } from '../lib/utils';

const LEGAL_LINKS = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/delete-account', label: 'Delete Account' },
  { to: '/support', label: 'Support' },
];

export default function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center">
              <Rocket size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-slate-900 dark:text-zinc-100">PitchNest</span>
          </Link>
          <Link
            to="/login"
            className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 pb-20">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">
          Legal
        </p>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mb-2">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-500 mb-8">Last updated: {lastUpdated}</p>

        <article className="legal-doc space-y-6 text-slate-700 dark:text-zinc-300 leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:dark:text-zinc-100 [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-sky-600 [&_a]:dark:text-sky-400 [&_a]:font-medium [&_a]:hover:underline [&_strong]:text-slate-900 [&_strong]:dark:text-zinc-100">
          {children}
        </article>

        <nav className="mt-12 pt-8 border-t border-slate-200 dark:border-zinc-800">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Related</p>
          <ul className="flex flex-wrap gap-3">
            {LEGAL_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={cn(
                    'text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700',
                    'hover:border-sky-300 dark:hover:border-sky-600 hover:text-sky-600 dark:hover:text-sky-400 transition-colors'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}
