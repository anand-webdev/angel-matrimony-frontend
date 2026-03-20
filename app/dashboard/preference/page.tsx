'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '../../components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Preference = {
  id: string;
  minAge: number;
  maxAge: number;
  preferredCity: string | null;
  preferredState: string | null;
  preferredCountry: string | null;
  religion: string | null;
  subCaste: string | null;
  education: string | null;
  profession: string | null;
  createdAt: string;
};

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-text-muted font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-text font-medium">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyPreference() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-4xl mb-6">
        🎯
      </div>
      <h2 className="text-xl font-bold text-text mb-2">No preference set</h2>
      <p className="text-text-secondary text-sm max-w-sm mb-8">
        Tell us what you're looking for in a partner — age range, location, religion, education, and more.
        We'll use this to show you the most compatible matches.
      </p>
      <Link
        href="/dashboard/preference/create"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary-dark transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Set My Preference
      </Link>
    </div>
  );
}

// ─── Preference Page ──────────────────────────────────────────────────────────

export default function PreferencePage() {
  const toast = useToast();
  const [pref, setPref] = useState<Preference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const controller = new AbortController();

    fetch(`${API_URL}/preferences/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 404) {
          setPref(null);
        } else if (res.ok) {
          setPref(await res.json());
        } else {
          const err = await res.json();
          toast.error(err.message ?? 'Failed to load preference.');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') toast.error('Could not connect to the server.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (!pref) return <EmptyPreference />;

  const location = [pref.preferredCity, pref.preferredState, pref.preferredCountry]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">My Preference</h1>
          <p className="text-sm text-text-muted mt-0.5">
            What you're looking for in a partner.
          </p>
        </div>
        <Link
          href="/dashboard/preference/create"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-border text-sm font-medium text-text-secondary hover:border-primary hover:text-primary transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Update Preference
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {/* Age Range */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Age Range</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-surface rounded-lg p-4 text-center border border-border">
              <p className="text-xs text-text-muted mb-1">Minimum Age</p>
              <p className="text-2xl font-bold text-primary">{pref.minAge}</p>
            </div>
            <div className="text-text-muted font-medium">—</div>
            <div className="flex-1 bg-surface rounded-lg p-4 text-center border border-border">
              <p className="text-xs text-text-muted mb-1">Maximum Age</p>
              <p className="text-2xl font-bold text-primary">{pref.maxAge}</p>
            </div>
          </div>
        </div>

        {/* Background */}
        <Section title="Background">
          <InfoRow label="Religion"  value={pref.religion} />
          <InfoRow label="Sub-Caste" value={pref.subCaste} />
        </Section>

        {/* Career & Education */}
        <Section title="Career & Education">
          <InfoRow label="Education"  value={pref.education} />
          <InfoRow label="Profession" value={pref.profession} />
        </Section>

        {/* Location */}
        {location && (
          <Section title="Preferred Location">
            <InfoRow label="City"    value={pref.preferredCity} />
            <InfoRow label="State"   value={pref.preferredState} />
            <InfoRow label="Country" value={pref.preferredCountry} />
          </Section>
        )}
      </div>
    </div>
  );
}
