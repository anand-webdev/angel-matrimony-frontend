'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useToast } from '../../components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const BACKEND_URL = API_URL.replace('/api', '');

const fmt = (s: string) =>
  s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Types ────────────────────────────────────────────────────────────────────

type User = { id: string; email: string; name: string; createdAt: string };
type Profile = {
  id: string;
  age: number | null;
  gender: string | null;
  religion: string | null;
  denomination: string | null;
  caste: string | null;
  motherTongue: string | null;
  education: string | null;
  occupation: string | null;
  annualIncome: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  bio: string | null;
  photos: string[];
  primaryPhoto: string | null;
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

// ─── Photos Section ───────────────────────────────────────────────────────────

function PhotosSection({
  photos,
  primaryPhoto,
  onUpdate,
}: {
  photos: string[];
  primaryPhoto: string | null;
  onUpdate: (photos: string[], primaryPhoto: string | null) => void;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // stores photoPath being acted on

  const token = () => localStorage.getItem('access_token') ?? '';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!selected.length) return;

    const slots = 4 - photos.length;
    const files = selected.slice(0, slots);

    if (selected.length > slots) {
      toast.info(`Only ${slots} slot${slots !== 1 ? 's' : ''} remaining — uploading first ${files.length}.`);
    }

    setUploading(true);
    let lastProfile: { photos: string[]; primaryPhoto: string | null } | null = null;

    for (const file of files) {
      const form = new FormData();
      form.append('photo', file);
      try {
        const res = await fetch(`${API_URL}/profiles/me/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token()}` },
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? 'Upload failed.');
        lastProfile = data;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Upload failed.');
        break;
      }
    }

    if (lastProfile) {
      onUpdate(lastProfile.photos, lastProfile.primaryPhoto);
      toast.success(`${files.length} photo${files.length !== 1 ? 's' : ''} uploaded!`);
    }
    setUploading(false);
  };

  const handleDelete = async (photoPath: string) => {
    const filename = photoPath.split('/').pop()!;
    setActionLoading(photoPath);
    try {
      const res = await fetch(`${API_URL}/profiles/me/photos/${filename}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Delete failed.');
      onUpdate(data.photos, data.primaryPhoto);
      toast.success('Photo removed.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete photo.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPrimary = async (photoPath: string) => {
    setActionLoading(photoPath);
    try {
      const res = await fetch(`${API_URL}/profiles/me/primary-photo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ photoPath }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not set primary photo.');
      onUpdate(data.photos, data.primaryPhoto);
      toast.success('Primary photo updated!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update primary photo.');
    } finally {
      setActionLoading(null);
    }
  };

  const slots = Array.from({ length: 4 });

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Photos</h3>
          <p className="text-xs text-text-muted mt-0.5">{photos.length}/4 uploaded · First photo becomes primary by default</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {slots.map((_, i) => {
          const photoPath = photos[i];

          if (!photoPath) {
            // Empty slot — show upload button if room available
            if (photos.length < 4 && i === photos.length) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <svg className="w-5 h-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-text-muted">Add photo</span>
                    </>
                  )}
                </button>
              );
            }
            // Placeholder slot
            return (
              <div
                key={i}
                className="aspect-square rounded-xl border border-dashed border-border bg-surface"
              />
            );
          }

          const isPrimary = photoPath === primaryPhoto;
          const isActing = actionLoading === photoPath;

          return (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BACKEND_URL}${photoPath}`}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Primary badge */}
              {isPrimary && (
                <div className="absolute top-1.5 left-1.5 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  ★ Primary
                </div>
              )}

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                {isActing ? (
                  <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <>
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(photoPath)}
                        className="w-full py-1 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-yellow-500 transition-colors"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(photoPath)}
                      className="w-full py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      <p className="text-xs text-text-muted mt-3">
        JPG, PNG, or WebP · Max 5 MB per photo · Hover over a photo to set it as primary or delete it
      </p>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyProfile({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-4xl mb-6">
        👤
      </div>
      <h2 className="text-xl font-bold text-text mb-2">Your profile isn't set up yet</h2>
      <p className="text-text-secondary text-sm max-w-sm mb-1">
        Hi <span className="font-semibold">{name}</span>! Complete your profile so potential matches can find you.
      </p>
      <p className="text-text-muted text-xs mb-8">{email}</p>
      <Link
        href="/dashboard/profile/create"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary-dark transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create My Profile
      </Link>
      <p className="text-xs text-text-muted mt-4">
        Profiles with complete information get 3× more interest.
      </p>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const controller = new AbortController();
    const { signal } = controller;

    Promise.all([
      fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` }, signal }),
      fetch(`${API_URL}/profiles/me`, { headers: { Authorization: `Bearer ${token}` }, signal }),
    ])
      .then(async ([userRes, profileRes]) => {
        if (userRes.ok) setUser(await userRes.json());

        if (profileRes.status === 404) {
          setIsEmpty(true);
        } else if (profileRes.ok) {
          const p: Profile = await profileRes.json();
          if (!p.gender && !p.age && !p.religion) {
            setIsEmpty(true);
          } else {
            setProfile(p);
          }
        } else {
          const err = await profileRes.json();
          toast.error(err.message ?? 'Failed to load profile.');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') toast.error('Could not connect to the server.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotosUpdate = (photos: string[], primaryPhoto: string | null) => {
    setProfile((prev) => prev ? { ...prev, photos, primaryPhoto } : prev);
  };

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

  if (isEmpty) {
    return <EmptyProfile name={user?.name ?? 'there'} email={user?.email ?? ''} />;
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const location = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ');
  const avatarSrc = profile?.primaryPhoto ? `${BACKEND_URL}${profile.primaryPhoto}` : null;

  return (
    <div className="p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">My Profile</h1>
        <Link
          href="/dashboard/profile/create"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-border text-sm font-medium text-text-secondary hover:border-primary hover:text-primary transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Profile
        </Link>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-xl border border-border p-6 mb-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-primary text-xl font-bold flex-none overflow-hidden">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">{user?.name}</h2>
          <p className="text-sm text-text-secondary">{user?.email}</p>
          {location && <p className="text-xs text-text-muted mt-1">📍 {location}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Photos */}
          <PhotosSection
            photos={profile?.photos ?? []}
            primaryPhoto={profile?.primaryPhoto ?? null}
            onUpdate={handlePhotosUpdate}
          />

          {/* Personal */}
          <Section title="Personal Details">
            <InfoRow label="Gender"        value={profile?.gender ? fmt(profile.gender) : null} />
            <InfoRow label="Age"           value={profile?.age} />
            <InfoRow label="Religion"      value={profile?.religion ? fmt(profile.religion) : null} />
            <InfoRow label="Denomination"  value={profile?.denomination ? fmt(profile.denomination) : null} />
            <InfoRow label="Mother Tongue" value={profile?.motherTongue ? fmt(profile.motherTongue) : null} />
            <InfoRow label="Caste"         value={profile?.caste} />
          </Section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Career & Education */}
          <Section title="Career & Education">
            <InfoRow label="Education"     value={profile?.education} />
            <InfoRow label="Occupation"    value={profile?.occupation} />
            <InfoRow label="Annual Income" value={profile?.annualIncome} />
          </Section>

          {/* Location */}
          <Section title="Location">
            <InfoRow label="City"    value={profile?.city} />
            <InfoRow label="State"   value={profile?.state} />
            <InfoRow label="Country" value={profile?.country} />
          </Section>

          {/* Bio */}
          {profile?.bio && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">About</h3>
              <p className="text-sm text-text leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
