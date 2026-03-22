"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { API_URL, apiFetch } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type LookupItem = { id: number; name: string; slug: string };

type ProfileResult = {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  maritalStatus: string | null;
  height: number | null;
  education: string | null;
  occupation: string | null;
  employmentType: string | null;
  annualIncome: string | null;
  bio: string | null;
  photos: string[];
  primaryPhoto: string | null;
  religion: LookupItem | null;
  caste: LookupItem | null;
  motherTongue: LookupItem | null;
  country: LookupItem | null;
  state: LookupItem | null;
  city: LookupItem | null;
  user: { name: string; email: string };
};

type SearchResponse = {
  data: ProfileResult[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (s: string) =>
  s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function cmToDisplay(cm: number): string {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${ft}'${inches}"`;
}

function buildLocation(p: ProfileResult): string | null {
  const parts = [p.city?.name, p.state?.name].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

const ITEMS_PER_PAGE = 12;

// ─── Profile Card ─────────────────────────────────────────────────────────────

function ProfileCard({ profile: p }: { profile: ProfileResult }) {
  const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || p.user.name;
  const age = p.dateOfBirth ? calcAge(p.dateOfBirth) : null;
  const height = p.height ? cmToDisplay(p.height) : null;
  const location = buildLocation(p);
  const photoUrl = p.primaryPhoto ?? p.photos[0] ?? null;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-border/40 shadow-sm hover:shadow-md transition-shadow p-4">
      <Link href={`/dashboard/search/${p.userId}`} className="flex gap-5 cursor-pointer">
        {/* Photo — fixed square */}
        <div className="w-44 h-44 flex-none rounded-lg overflow-hidden bg-secondary/30">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl font-bold text-primary/40">
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top row: name + shortlist */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="text-base font-bold text-text truncate leading-tight">
                {name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {age && (
                  <span className="text-[13px] text-text-secondary">
                    {age} yrs
                  </span>
                )}
                {age && height && (
                  <span className="w-1 h-1 rounded-full bg-border" />
                )}
                {height && (
                  <span className="text-[13px] text-text-secondary">
                    {height}
                  </span>
                )}
              </div>
            </div>
            {/* Shortlist button */}
            <button
              type="button"
              className="flex-none p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-secondary/60 transition-colors"
              title="Shortlist"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>

          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
            {p.religion && (
              <DetailItem label="Religion" value={p.religion.name} />
            )}
            {p.caste && (
              <DetailItem label="Caste" value={p.caste.name} />
            )}
            {p.motherTongue && (
              <DetailItem label="Mother Tongue" value={p.motherTongue.name} />
            )}
            {p.maritalStatus && (
              <DetailItem label="Marital Status" value={fmt(p.maritalStatus)} />
            )}
            {p.education && (
              <DetailItem label="Education" value={p.education} />
            )}
            {p.occupation && (
              <DetailItem label="Occupation" value={p.occupation} />
            )}
          </div>

          {/* Footer: location left, actions right */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/20">
            <div className="flex items-center gap-3">
              {location && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {location}
                </span>
              )}
              {p.annualIncome && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {p.annualIncome}
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted border border-border/50 hover:bg-surface hover:text-text-secondary transition-colors"
              >
                Don&apos;t Show
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-dark transition-colors"
              >
                Send Interest
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] text-text-muted font-medium uppercase tracking-wider leading-none mb-0.5">
        {label}
      </span>
      <span className="block text-[13px] font-semibold text-text truncate">
        {value}
      </span>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Build page number buttons
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:pointer-events-none transition-all"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`dots-${i}`}
            className="px-2 py-2 text-sm text-text-muted"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={[
              "min-w-[36px] px-2 py-2 rounded-lg text-sm font-medium transition-all",
              p === page
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:bg-white hover:shadow-sm",
            ].join(" ")}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:pointer-events-none transition-all"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: ITEMS_PER_PAGE, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `${API_URL}/profiles/search?page=${page}&limit=${ITEMS_PER_PAGE}`
      );
      if (!res.ok) throw new Error("Failed to fetch profiles");
      const json: SearchResponse = await res.json();
      setProfiles(json.data);
      setMeta(json.meta);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles(1);
  }, [fetchProfiles]);

  const handlePageChange = (page: number) => {
    fetchProfiles(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6 lg:p-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Search Profiles</h1>
        {!loading && (
          <p className="text-sm text-text-muted mt-1">
            {meta.total} profile{meta.total !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg
            className="w-8 h-8 animate-spin text-primary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-sm text-text-muted">Loading profiles...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20">
          <svg
            className="w-16 h-16 mx-auto text-border mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-text-secondary font-medium">No profiles found</p>
          <p className="text-sm text-text-muted mt-1">
            Check back later for new profiles.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {profiles.map((p) => (
              <ProfileCard key={p.id} profile={p} />
            ))}
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={handlePageChange}
          />

          {/* Page info */}
          {meta.totalPages > 1 && (
            <p className="text-center text-xs text-text-muted mt-3">
              Page {meta.page} of {meta.totalPages}
            </p>
          )}
        </>
      )}
    </div>
  );
}
