'use client';

import { useEffect, useState } from 'react';

type Lang = 'en' | 'ta';

const STORAGE_KEY = 'anm_lang';

const OPTIONS: { value: Lang; icon: string; label: string; native: string }[] = [
  { value: 'en', icon: '🌐', label: 'English', native: 'English' },
  { value: 'ta', icon: '🌸', label: 'Tamil', native: 'தமிழ்' },
];

export function LanguageModal() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Lang | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setOpen(true);
  }, []);

  const handleSelect = (lang: Lang) => {
    setSelected(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    // slight delay so user sees the selection feedback
    setTimeout(() => setOpen(false), 220);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 px-6 py-8 flex flex-col items-center gap-6"
        style={{ animation: 'fadeIn 0.25s ease' }}
      >
        {/* Header */}
        <div className="text-center">
          <div className="text-3xl mb-2">✦</div>
          <h2 className="text-xl font-bold text-text">Choose Your Language</h2>
          <p className="text-sm text-text-muted mt-1">மொழியை தேர்ந்தெடுக்கவும்</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {OPTIONS.map((opt) => {
            const isActive = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={[
                  'flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none',
                  isActive
                    ? 'border-primary bg-secondary shadow-md scale-[1.03]'
                    : 'border-border hover:border-primary/50 hover:bg-surface',
                ].join(' ')}
              >
                <span className="text-4xl">{opt.icon}</span>
                <span className={`text-base font-semibold ${isActive ? 'text-primary' : 'text-text'}`}>
                  {opt.native}
                </span>
                {opt.native !== opt.label && (
                  <span className="text-xs text-text-muted">{opt.label}</span>
                )}
                {/* Radio indicator */}
                <span
                  className={[
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center mt-1 transition-all',
                    isActive ? 'border-primary' : 'border-border',
                  ].join(' ')}
                >
                  {isActive && <span className="w-2 h-2 rounded-full bg-primary block" />}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-text-muted text-center">
          You can change this later in Settings.
        </p>
      </div>
    </div>
  );
}
