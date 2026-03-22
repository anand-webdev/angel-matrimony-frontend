"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "../../components/Toast";
import { Button } from "../../components/Button";
import {
  Field,
  TextInput,
  SelectInput,
  Textarea,
  MultiSelectInput,
} from "../../components/Input";
import { API_URL, BACKEND_URL, apiFetch } from "../../lib/api";
import { useLookups } from "../../providers/LookupProvider";
import { lookupOptions } from "../../lib/lookups";
import { fmt, calcAge } from "../../lib/profile-utils";
import type { Profile } from "../../types/profile";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFILE_CREATED_FOR = [
  "SELF",
  "SON",
  "DAUGHTER",
  "SIBLING",
  "FRIEND",
] as const;
const GENDERS = ["MALE", "FEMALE"] as const;
const MARITAL_STATUSES = [
  "NEVER_MARRIED",
  "DIVORCED",
  "WIDOWED",
  "AWAITING_DIVORCE",
] as const;
const EDUCATIONS = [
  "High School",
  "Diploma",
  "Bachelor's",
  "Master's",
  "PhD",
  "Other",
];
const ANNUAL_INCOMES = [
  "Below 2 LPA",
  "2–5 LPA",
  "5–10 LPA",
  "10–20 LPA",
  "20–50 LPA",
  "50 LPA+",
  "Prefer not to say",
];
const EMPLOYMENT_TYPES = [
  "PRIVATE",
  "GOVERNMENT",
  "BUSINESS",
  "SELF_EMPLOYED",
  "NOT_WORKING",
] as const;
const BODY_TYPES = ["SLIM", "AVERAGE", "ATHLETIC", "HEAVY"] as const;
const COMPLEXIONS = ["VERY_FAIR", "FAIR", "WHEATISH", "DARK"] as const;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DIETS = ["VEGETARIAN", "NON_VEGETARIAN", "EGGETARIAN"] as const;
const YES_NO_OCC = ["YES", "NO", "OCCASIONALLY"] as const;
const FAMILY_TYPES = ["JOINT", "NUCLEAR"] as const;
const FAMILY_STATUSES = ["MIDDLE_CLASS", "UPPER_MIDDLE_CLASS", "RICH"] as const;
const FAMILY_VALUES_OPTIONS = ["TRADITIONAL", "MODERATE", "LIBERAL"] as const;
const COMMUNITY_PREFERENCES = ["Same community", "Other communities also"];
const FAMILY_LOCATIONS = ["Same as my Location", "Different Location"];

/** Build height options from 4'0" (122 cm) to 7'0" (213 cm) */
const HEIGHT_OPTIONS: { value: string; label: string }[] = (() => {
  const opts: { value: string; label: string }[] = [];
  for (let ft = 4; ft <= 7; ft++) {
    const maxIn = ft === 7 ? 0 : 11;
    for (let inch = 0; inch <= maxIn; inch++) {
      const cm = Math.round(ft * 30.48 + inch * 2.54);
      opts.push({ value: String(cm), label: `${ft} Ft ${inch} In` });
    }
  }
  return opts;
})();

const cmToDisplay = (cm: number | null | undefined): string | null => {
  if (cm == null) return null;
  const match = HEIGHT_OPTIONS.find((o) => o.value === String(cm));
  return match ? match.label : `${cm} cm`;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type User = { id: string; email: string; name: string; createdAt: string };

const EMPTY_PROFILE: Profile = {
  id: "",
  profileCreatedFor: null,
  firstName: null,
  lastName: null,
  gender: null,
  dateOfBirth: null,
  maritalStatus: null,
  numberOfChildren: null,
  childrenLivingWithYou: null,
  religionId: null,
  religion: null,
  casteId: null,
  caste: null,
  communityName: null,
  gothram: null,
  denominationId: null,
  denomination: null,
  sect: null,
  motherTongueId: null,
  motherTongue: null,
  knownLanguages: [],
  communityPreference: null,
  timeOfBirth: null,
  placeOfBirth: null,
  rasiId: null,
  rasi: null,
  nakshatraId: null,
  nakshatra: null,
  lagna: null,
  dasaBhukti: null,
  chevvaiDosham: null,
  starCompatibility: null,
  education: null,
  degree: null,
  fieldOfStudy: null,
  collegeUniversity: null,
  occupation: null,
  jobTitle: null,
  companyName: null,
  industry: null,
  employmentType: null,
  annualIncome: null,
  workLocation: null,
  familyType: null,
  familyStatus: null,
  familyValues: null,
  fatherName: null,
  fatherOccupation: null,
  motherName: null,
  motherOccupation: null,
  numberOfBrothers: null,
  numberOfSisters: null,
  marriedSiblings: null,
  nativePlace: null,
  familyBackground: null,
  familyLocation: null,
  aboutFamily: null,
  ancestralOrigin: null,
  height: null,
  weight: null,
  bodyType: null,
  complexion: null,
  bloodGroup: null,
  physicalDisability: null,
  physicalDisabilityDetails: null,
  diet: null,
  smoking: null,
  drinking: null,
  fitnessLevel: null,
  hobbiesAndInterests: null,
  hobbies: null,
  interests: null,
  favouriteMusic: null,
  favouriteSports: null,
  favouriteReads: null,
  favouriteMovies: null,
  favouriteCuisine: null,
  cityId: null,
  city: null,
  stateId: null,
  state: null,
  countryId: null,
  country: null,
  currentAddress: null,
  citizenship: null,
  residencyStatus: null,
  bio: null,
  photos: [],
  primaryPhoto: null,
};

type SectionFormProps = {
  profile: Profile;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
};

// ─── Profile Completeness ────────────────────────────────────────────────────

function calcCompleteness(p: Profile): number {
  const fields: (string | number | boolean | null | undefined)[] = [
    p.firstName,
    p.gender,
    p.dateOfBirth,
    p.maritalStatus,
    p.religionId,
    p.motherTongueId,
    p.casteId,
    p.education,
    p.occupation,
    p.employmentType,
    p.height,
    p.bodyType,
    p.diet,
    p.familyType,
    p.fatherName,
    p.motherName,
    p.countryId,
    p.stateId,
    p.cityId,
    p.bio,
    p.photos.length > 0 ? "yes" : null,
  ];
  const filled = fields.filter((v) => v != null && v !== "").length;
  return Math.round((filled / fields.length) * 100);
}

// ─── View Components ──────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  onAdd,
}: {
  label: string;
  value?: string | number | null;
  onAdd?: () => void;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
        {label}
      </span>
      {empty ? (
        onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="text-sm text-primary font-medium hover:text-primary-dark transition-colors text-left flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add {label}
          </button>
        ) : (
          <span className="text-sm text-text-muted italic">Not specified</span>
        )
      ) : (
        <span className="text-sm font-semibold text-text">{value}</span>
      )}
    </div>
  );
}

function BoolRow({
  label,
  value,
  onAdd,
}: {
  label: string;
  value?: boolean | null;
  onAdd?: () => void;
}) {
  const empty = value === null || value === undefined;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
        {label}
      </span>
      {empty ? (
        onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="text-sm text-primary font-medium hover:text-primary-dark transition-colors text-left flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add {label}
          </button>
        ) : (
          <span className="text-sm text-text-muted italic">Not specified</span>
        )
      ) : (
        <span className="text-sm font-semibold text-text">
          {value ? "Yes" : "No"}
        </span>
      )}
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-primary text-xs font-semibold hover:text-primary-dark transition-colors flex items-center gap-1 bg-secondary/60 hover:bg-secondary px-2.5 py-1 rounded-lg"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      Edit
    </button>
  );
}

function SaveCancelButtons({
  onCancel,
  onSave,
  saving,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex gap-3 mt-2">
      <Button variant="secondary" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      <Button size="sm" onClick={onSave} disabled={saving}>
        {saving ? "Saving\u2026" : "Save"}
      </Button>
    </div>
  );
}

// ─── Section Icons ──────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ReactNode> = {
  basic: (
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
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  religion: (
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
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
      />
    </svg>
  ),
  horoscope: (
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
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  ),
  education: (
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
        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
      />
    </svg>
  ),
  family: (
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
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  aboutFamily: (
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
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  physical: (
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
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  ),
  lifestyle: (
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
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
  hobbies: (
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
        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  location: (
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
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  bio: (
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
};

function EditableSection({
  title,
  sectionKey,
  editingSection,
  onEdit,
  children,
  editForm,
}: {
  title: string;
  sectionKey: string;
  editingSection: string | null;
  onEdit: (key: string) => void;
  children: React.ReactNode;
  editForm: React.ReactNode;
}) {
  const isEditing = editingSection === sectionKey;
  const icon = SECTION_ICONS[sectionKey];
  return (
    <div className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30 bg-surface/30">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary/70">{icon}</span>}
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            {title}
          </h3>
        </div>
        {!isEditing && <EditButton onClick={() => onEdit(sectionKey)} />}
      </div>
      <div className="p-5">
        {isEditing ? (
          editForm
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
        )}
      </div>
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!selected.length) return;
    const slots = 4 - photos.length;
    const files = selected.slice(0, slots);
    if (selected.length > slots) {
      toast.info(
        `Only ${slots} slot${slots !== 1 ? "s" : ""} remaining \u2014 uploading first ${files.length}.`,
      );
    }
    setUploading(true);
    let lastProfile: { photos: string[]; primaryPhoto: string | null } | null =
      null;
    for (const file of files) {
      const form = new FormData();
      form.append("photo", file);
      try {
        const res = await apiFetch(`${API_URL}/profiles/me/photos`, {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Upload failed.");
        lastProfile = data;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed.");
        break;
      }
    }
    if (lastProfile) {
      onUpdate(lastProfile.photos, lastProfile.primaryPhoto);
      toast.success(
        `${files.length} photo${files.length !== 1 ? "s" : ""} uploaded!`,
      );
    }
    setUploading(false);
  };

  const handleDelete = async (photoPath: string) => {
    const filename = photoPath.split("/").pop()!;
    setActionLoading(photoPath);
    try {
      const res = await apiFetch(`${API_URL}/profiles/me/photos/${filename}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Delete failed.");
      onUpdate(data.photos, data.primaryPhoto);
      toast.success("Photo removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete photo.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPrimary = async (photoPath: string) => {
    setActionLoading(photoPath);
    try {
      const res = await apiFetch(`${API_URL}/profiles/me/primary-photo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoPath }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message ?? "Could not set primary photo.");
      onUpdate(data.photos, data.primaryPhoto);
      toast.success("Primary photo updated!");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not update primary photo.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Separate primary photo from other photos
  const otherPhotos = photos.filter((p) => p !== primaryPhoto);
  const hasEmptySlots = photos.length < 4;

  return (
    <div className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30 bg-surface/30">
        <div className="flex items-center gap-2">
          <span className="text-primary/70">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Photos
          </h3>
        </div>
        <span className="text-xs text-text-muted font-medium">
          {photos.length}/4
        </span>
      </div>
      <div className="p-5">
        {photos.length === 0 ? (
          /* Empty state — large upload area */
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full aspect-3/1 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-secondary/30 transition-all disabled:opacity-50"
          >
            {uploading ? (
              <svg
                className="w-6 h-6 animate-spin text-primary"
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
            ) : (
              <>
                <svg
                  className="w-8 h-8 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-primary font-semibold">
                  Upload your photos
                </span>
                <span className="text-xs text-text-muted">
                  JPG, PNG, or WebP &middot; Max 5 MB
                </span>
              </>
            )}
          </button>
        ) : (
          /* Gallery: main photo + thumbnails */
          <div className="flex gap-3">
            {/* Primary photo — large */}
            {primaryPhoto && (
              <div className="relative group w-36 h-36 rounded-xl overflow-hidden border border-border flex-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${BACKEND_URL}${primaryPhoto}`}
                  alt="Primary"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 left-1.5 bg-accent text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  Primary
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  {actionLoading === primaryPhoto ? (
                    <svg
                      className="w-5 h-5 animate-spin text-white"
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
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDelete(primaryPhoto)}
                      className="py-1 px-3 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* Thumbnails + add button */}
            <div className="grid grid-cols-3 gap-2 flex-1">
              {otherPhotos.map((photoPath, i) => {
                const isActing = actionLoading === photoPath;
                return (
                  <div
                    key={i}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${BACKEND_URL}${photoPath}`}
                      alt={`Photo ${i + 2}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1.5">
                      {isActing ? (
                        <svg
                          className="w-4 h-4 animate-spin text-white"
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
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(photoPath)}
                            className="w-full py-0.5 rounded bg-accent text-white text-[10px] font-semibold hover:bg-yellow-500 transition-colors"
                          >
                            Set Primary
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(photoPath)}
                            className="w-full py-0.5 rounded bg-red-500 text-white text-[10px] font-semibold hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {hasEmptySlots && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-secondary/30 transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <svg
                      className="w-4 h-4 animate-spin text-primary"
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
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 text-text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span className="text-[10px] text-text-muted">Add</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}

// ─── Section Edit Forms ───────────────────────────────────────────────────────

function BasicInfoForm({
  profile: p,
  onSave,
  onCancel,
  saving,
}: SectionFormProps) {
  const [v, setV] = useState({
    profileCreatedFor: p.profileCreatedFor ?? "",
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    gender: p.gender ?? "",
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
    maritalStatus: p.maritalStatus ?? "",
    numberOfChildren:
      p.numberOfChildren != null ? String(p.numberOfChildren) : "",
    childrenLivingWithYou:
      p.childrenLivingWithYou != null
        ? p.childrenLivingWithYou
          ? "YES"
          : "NO"
        : "",
  });
  const set = (n: string, val: string) =>
    setV((prev) => ({ ...prev, [n]: val }));
  const onChange =
    (n: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      set(n, e.target.value);
  const showChildren = ["DIVORCED", "WIDOWED", "AWAITING_DIVORCE"].includes(
    v.maritalStatus,
  );

  const handleSave = () => {
    const body: Record<string, unknown> = {};
    for (const k of [
      "profileCreatedFor",
      "firstName",
      "lastName",
      "gender",
      "maritalStatus",
    ] as const) {
      if (v[k]) body[k] = v[k];
    }
    if (v.dateOfBirth) {
      body.dateOfBirth = new Date(v.dateOfBirth).toISOString();
    }
    if (v.numberOfChildren) body.numberOfChildren = Number(v.numberOfChildren);
    if (v.childrenLivingWithYou)
      body.childrenLivingWithYou = v.childrenLivingWithYou === "YES";
    onSave(body);
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Profile Created For">
        <SelectInput
          name="profileCreatedFor"
          value={v.profileCreatedFor}
          onChange={onChange("profileCreatedFor")}
          placeholder="Select"
          options={PROFILE_CREATED_FOR.map((o) => ({
            value: o,
            label: fmt(o),
          }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name">
          <TextInput
            name="firstName"
            value={v.firstName}
            onChange={onChange("firstName")}
            placeholder="First name"
          />
        </Field>
        <Field label="Last Name">
          <TextInput
            name="lastName"
            value={v.lastName}
            onChange={onChange("lastName")}
            placeholder="Last name"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Gender" required>
          <SelectInput
            name="gender"
            value={v.gender}
            onChange={onChange("gender")}
            placeholder="Select gender"
            options={GENDERS.map((g) => ({ value: g, label: fmt(g) }))}
          />
        </Field>
        <Field label="Date of Birth" required>
          <TextInput
            name="dateOfBirth"
            type="date"
            value={v.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
          />
        </Field>
      </div>
      {v.dateOfBirth && (
        <p className="text-sm text-text-secondary -mt-2">
          Age:{" "}
          <span className="font-semibold text-text">
            {calcAge(v.dateOfBirth)} years
          </span>
        </p>
      )}
      <Field label="Marital Status" required>
        <SelectInput
          name="maritalStatus"
          value={v.maritalStatus}
          onChange={onChange("maritalStatus")}
          placeholder="Select"
          options={MARITAL_STATUSES.map((s) => ({ value: s, label: fmt(s) }))}
        />
      </Field>
      {showChildren && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Number of Children">
            <TextInput
              name="numberOfChildren"
              type="number"
              min={0}
              value={v.numberOfChildren}
              onChange={onChange("numberOfChildren")}
              placeholder="0"
            />
          </Field>
          <Field label="Children Living With You">
            <SelectInput
              name="childrenLivingWithYou"
              value={v.childrenLivingWithYou}
              onChange={onChange("childrenLivingWithYou")}
              placeholder="Select"
              options={[
                { value: "YES", label: "Yes" },
                { value: "NO", label: "No" },
              ]}
            />
          </Field>
        </div>
      )}
      <SaveCancelButtons
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

function ReligionForm({
  profile: p,
  onSave,
  onCancel,
  saving,
}: SectionFormProps) {
  const lookups = useLookups();
  const [v, setV] = useState({
    religionId: p.religionId != null ? String(p.religionId) : "",
    motherTongueId: p.motherTongueId != null ? String(p.motherTongueId) : "",
    casteId: p.casteId != null ? String(p.casteId) : "",
    communityName: p.communityName ?? "",
    gothram: p.gothram ?? "",
    denominationId: p.denominationId != null ? String(p.denominationId) : "",
    sect: p.sect ?? "",
    communityPreference: p.communityPreference ?? "",
    knownLanguageIds: p.knownLanguages.map((kl) => String(kl.languageId)),
  });
  const set = (n: string, val: string) =>
    setV((prev) => ({ ...prev, [n]: val }));
  const onChange =
    (n: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      set(n, e.target.value);
  const selectedReligion = lookups.religions.find(
    (r) => r.id === Number(v.religionId),
  );
  const religionSlug = selectedReligion?.slug ?? "";
  const filteredDenominations = lookups.denominations.filter(
    (d) => d.religionId === Number(v.religionId),
  );

  const handleSave = () => {
    const body: Record<string, unknown> = {};
    if (v.religionId) body.religionId = Number(v.religionId);
    if (v.motherTongueId) body.motherTongueId = Number(v.motherTongueId);
    if (v.casteId) body.casteId = Number(v.casteId);
    if (v.denominationId) body.denominationId = Number(v.denominationId);
    if (v.communityName) body.communityName = v.communityName;
    if (v.gothram) body.gothram = v.gothram;
    if (v.sect) body.sect = v.sect;
    if (v.communityPreference) body.communityPreference = v.communityPreference;
    if (v.knownLanguageIds.length > 0)
      body.knownLanguageIds = v.knownLanguageIds.map(Number);
    onSave(body);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Religion" required>
          <SelectInput
            name="religionId"
            value={v.religionId}
            onChange={(e) => {
              set("religionId", e.target.value);
              set("denominationId", "");
              set("casteId", "");
            }}
            placeholder="Select religion"
            options={lookupOptions(lookups.religions)}
          />
        </Field>
        <Field label="Mother Tongue" required>
          <SelectInput
            name="motherTongueId"
            value={v.motherTongueId}
            onChange={onChange("motherTongueId")}
            placeholder="Select language"
            options={lookupOptions(lookups.languages)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Caste">
          <SelectInput
            name="casteId"
            value={v.casteId}
            onChange={onChange("casteId")}
            placeholder="Select caste"
            options={lookupOptions(lookups.castes)}
          />
        </Field>
      </div>
      <Field label="Community Name" hint="Optional">
        <TextInput
          name="communityName"
          value={v.communityName}
          onChange={onChange("communityName")}
          placeholder="Custom community name"
        />
      </Field>
      {religionSlug === "hindu" && (
        <Field label="Gothram">
          <TextInput
            name="gothram"
            value={v.gothram}
            onChange={onChange("gothram")}
            placeholder="e.g. Bharadwaj"
          />
        </Field>
      )}
      {religionSlug === "christian" && (
        <Field label="Denomination">
          <SelectInput
            name="denominationId"
            value={v.denominationId}
            onChange={onChange("denominationId")}
            placeholder="Select denomination"
            options={lookupOptions(filteredDenominations)}
          />
        </Field>
      )}
      {religionSlug === "muslim" && (
        <Field label="Sect">
          <TextInput
            name="sect"
            value={v.sect}
            onChange={onChange("sect")}
            placeholder="e.g. Sunni, Shia"
          />
        </Field>
      )}
      <Field label="Community Preference">
        <SelectInput
          name="communityPreference"
          value={v.communityPreference}
          onChange={onChange("communityPreference")}
          placeholder="Select"
          options={COMMUNITY_PREFERENCES.map((c) => ({ value: c, label: c }))}
        />
      </Field>
      <Field label="Known Languages" hint="Select all that apply">
        <MultiSelectInput
          options={lookupOptions(lookups.languages)}
          value={v.knownLanguageIds}
          onChange={(ids) =>
            setV((prev) => ({ ...prev, knownLanguageIds: ids }))
          }
        />
      </Field>
      <SaveCancelButtons
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

function HoroscopeForm({
  profile: p,
  onSave,
  onCancel,
  saving,
}: SectionFormProps) {
  const lookups = useLookups();
  const [v, setV] = useState({
    timeOfBirth: p.timeOfBirth ?? "",
    placeOfBirth: p.placeOfBirth ?? "",
    rasiId: p.rasiId != null ? String(p.rasiId) : "",
    nakshatraId: p.nakshatraId != null ? String(p.nakshatraId) : "",
    lagna: p.lagna ?? "",
    dasaBhukti: p.dasaBhukti ?? "",
    chevvaiDosham:
      p.chevvaiDosham != null ? (p.chevvaiDosham ? "YES" : "NO") : "",
    starCompatibility: p.starCompatibility ?? "",
  });
  const onChange =
    (n: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setV((prev) => ({ ...prev, [n]: e.target.value }));

  const handleSave = () => {
    const body: Record<string, unknown> = {};
    if (v.timeOfBirth) body.timeOfBirth = v.timeOfBirth;
    if (v.placeOfBirth) body.placeOfBirth = v.placeOfBirth;
    if (v.rasiId) body.rasiId = Number(v.rasiId);
    if (v.nakshatraId) body.nakshatraId = Number(v.nakshatraId);
    if (v.lagna) body.lagna = v.lagna;
    if (v.dasaBhukti) body.dasaBhukti = v.dasaBhukti;
    if (v.starCompatibility) body.starCompatibility = v.starCompatibility;
    if (v.chevvaiDosham) body.chevvaiDosham = v.chevvaiDosham === "YES";
    onSave(body);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Time of Birth">
          <TextInput
            name="timeOfBirth"
            type="time"
            value={v.timeOfBirth}
            onChange={onChange("timeOfBirth")}
          />
        </Field>
        <Field label="Place of Birth">
          <TextInput
            name="placeOfBirth"
            value={v.placeOfBirth}
            onChange={onChange("placeOfBirth")}
            placeholder="e.g. Chennai"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Rasi (Moon Sign)">
          <SelectInput
            name="rasiId"
            value={v.rasiId}
            onChange={onChange("rasiId")}
            placeholder="Select rasi"
            options={lookupOptions(lookups.rasis)}
          />
        </Field>
        <Field label="Nakshatra (Star)">
          <SelectInput
            name="nakshatraId"
            value={v.nakshatraId}
            onChange={onChange("nakshatraId")}
            placeholder="Select nakshatra"
            options={lookupOptions(lookups.nakshatras)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Lagna (Ascendant)">
          <SelectInput
            name="lagna"
            value={v.lagna}
            onChange={onChange("lagna")}
            placeholder="Select lagna"
            options={lookupOptions(lookups.rasis)}
          />
        </Field>
        <Field label="Dasa / Bhukti">
          <TextInput
            name="dasaBhukti"
            value={v.dasaBhukti}
            onChange={onChange("dasaBhukti")}
            placeholder="e.g. Rahu / Jupiter"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Chevvai Dosham (Manglik)">
          <SelectInput
            name="chevvaiDosham"
            value={v.chevvaiDosham}
            onChange={onChange("chevvaiDosham")}
            placeholder="Select"
            options={[
              { value: "YES", label: "Yes" },
              { value: "NO", label: "No" },
            ]}
          />
        </Field>
        <Field label="Star Compatibility">
          <TextInput
            name="starCompatibility"
            value={v.starCompatibility}
            onChange={onChange("starCompatibility")}
            placeholder="e.g. Must match"
          />
        </Field>
      </div>
      <SaveCancelButtons
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

function EducationForm({
  profile: p,
  onSave,
  onCancel,
  saving,
}: SectionFormProps) {
  const [v, setV] = useState({
    education: p.education ?? "",
    degree: p.degree ?? "",
    fieldOfStudy: p.fieldOfStudy ?? "",
    collegeUniversity: p.collegeUniversity ?? "",
    occupation: p.occupation ?? "",
    jobTitle: p.jobTitle ?? "",
    companyName: p.companyName ?? "",
    industry: p.industry ?? "",
    employmentType: p.employmentType ?? "",
    annualIncome: p.annualIncome ?? "",
    workLocation: p.workLocation ?? "",
  });
  const onChange =
    (n: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setV((prev) => ({ ...prev, [n]: e.target.value }));
  const handleSave = () => {
    const body: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      if (val) body[k] = val;
    }
    onSave(body);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Highest Qualification">
          <SelectInput
            name="education"
            value={v.education}
            onChange={onChange("education")}
            placeholder="Select"
            options={EDUCATIONS.map((e) => ({ value: e, label: e }))}
          />
        </Field>
        <Field label="Degree">
          <TextInput
            name="degree"
            value={v.degree}
            onChange={onChange("degree")}
            placeholder="e.g. B.E., MBA"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Field of Study">
          <TextInput
            name="fieldOfStudy"
            value={v.fieldOfStudy}
            onChange={onChange("fieldOfStudy")}
            placeholder="e.g. Computer Science"
          />
        </Field>
        <Field label="College / University">
          <TextInput
            name="collegeUniversity"
            value={v.collegeUniversity}
            onChange={onChange("collegeUniversity")}
            placeholder="e.g. Anna University"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Occupation">
          <TextInput
            name="occupation"
            value={v.occupation}
            onChange={onChange("occupation")}
            placeholder="e.g. Software Engineer"
          />
        </Field>
        <Field label="Job Title">
          <TextInput
            name="jobTitle"
            value={v.jobTitle}
            onChange={onChange("jobTitle")}
            placeholder="e.g. Senior Developer"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Company Name">
          <TextInput
            name="companyName"
            value={v.companyName}
            onChange={onChange("companyName")}
            placeholder="e.g. TCS, Infosys"
          />
        </Field>
        <Field label="Industry">
          <TextInput
            name="industry"
            value={v.industry}
            onChange={onChange("industry")}
            placeholder="e.g. Information Technology"
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Employment Type">
          <SelectInput
            name="employmentType"
            value={v.employmentType}
            onChange={onChange("employmentType")}
            placeholder="Select"
            options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: fmt(t) }))}
          />
        </Field>
        <Field label="Annual Income">
          <SelectInput
            name="annualIncome"
            value={v.annualIncome}
            onChange={onChange("annualIncome")}
            placeholder="Select"
            options={ANNUAL_INCOMES.map((i) => ({ value: i, label: i }))}
          />
        </Field>
        <Field label="Work Location">
          <TextInput
            name="workLocation"
            value={v.workLocation}
            onChange={onChange("workLocation")}
            placeholder="e.g. Bangalore"
          />
        </Field>
      </div>
      <SaveCancelButtons
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

function FamilyForm({
  profile: p,
  onSave,
  onCancel,
  saving,
}: SectionFormProps) {
  const [v, setV] = useState({
    familyType: p.familyType ?? "",
    familyStatus: p.familyStatus ?? "",
    familyValues: p.familyValues ?? "",
    fatherName: p.fatherName ?? "",
    fatherOccupation: p.fatherOccupation ?? "",
    motherName: p.motherName ?? "",
    motherOccupation: p.motherOccupation ?? "",
    numberOfBrothers:
      p.numberOfBrothers != null ? String(p.numberOfBrothers) : "",
    numberOfSisters: p.numberOfSisters != null ? String(p.numberOfSisters) : "",
    marriedSiblings: p.marriedSiblings != null ? String(p.marriedSiblings) : "",
    nativePlace: p.nativePlace ?? "",
    familyBackground: p.familyBackground ?? "",
    ancestralOrigin: p.ancestralOrigin ?? "",
    familyLocation: p.familyLocation ?? "",
  });
  const onChange =
    (n: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setV((prev) => ({ ...prev, [n]: e.target.value }));
  const handleSave = () => {
    const body: Record<string, unknown> = {};
    for (const k of [
      "familyType",
      "familyStatus",
      "familyValues",
      "fatherName",
      "fatherOccupation",
      "motherName",
      "motherOccupation",
      "nativePlace",
      "familyBackground",
      "ancestralOrigin",
      "familyLocation",
    ]) {
      if (v[k as keyof typeof v]) body[k] = v[k as keyof typeof v];
    }
    if (v.numberOfBrothers) body.numberOfBrothers = Number(v.numberOfBrothers);
    if (v.numberOfSisters) body.numberOfSisters = Number(v.numberOfSisters);
    if (v.marriedSiblings) body.marriedSiblings = Number(v.marriedSiblings);
    onSave(body);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <Field label="Family Type">
          <SelectInput
            name="familyType"
            value={v.familyType}
            onChange={onChange("familyType")}
            placeholder="Select"
            options={FAMILY_TYPES.map((t) => ({ value: t, label: fmt(t) }))}
          />
        </Field>
        <Field label="Family Status">
          <SelectInput
            name="familyStatus"
            value={v.familyStatus}
            onChange={onChange("familyStatus")}
            placeholder="Select"
            options={FAMILY_STATUSES.map((s) => ({ value: s, label: fmt(s) }))}
          />
        </Field>
        <Field label="Family Values">
          <SelectInput
            name="familyValues"
            value={v.familyValues}
            onChange={onChange("familyValues")}
            placeholder="Select"
            options={FAMILY_VALUES_OPTIONS.map((fv) => ({
              value: fv,
              label: fmt(fv),
            }))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Father's Name">
          <TextInput
            name="fatherName"
            value={v.fatherName}
            onChange={onChange("fatherName")}
            placeholder="Father's name"
          />
        </Field>
        <Field label="Father's Occupation">
          <TextInput
            name="fatherOccupation"
            value={v.fatherOccupation}
            onChange={onChange("fatherOccupation")}
            placeholder="e.g. Retired Teacher"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Mother's Name">
          <TextInput
            name="motherName"
            value={v.motherName}
            onChange={onChange("motherName")}
            placeholder="Mother's name"
          />
        </Field>
        <Field label="Mother's Occupation">
          <TextInput
            name="motherOccupation"
            value={v.motherOccupation}
            onChange={onChange("motherOccupation")}
            placeholder="e.g. Homemaker"
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="No. of Brothers">
          <TextInput
            name="numberOfBrothers"
            type="number"
            min={0}
            value={v.numberOfBrothers}
            onChange={onChange("numberOfBrothers")}
            placeholder="0"
          />
        </Field>
        <Field label="No. of Sisters">
          <TextInput
            name="numberOfSisters"
            type="number"
            min={0}
            value={v.numberOfSisters}
            onChange={onChange("numberOfSisters")}
            placeholder="0"
          />
        </Field>
        <Field label="Married Siblings">
          <TextInput
            name="marriedSiblings"
            type="number"
            min={0}
            value={v.marriedSiblings}
            onChange={onChange("marriedSiblings")}
            placeholder="0"
          />
        </Field>
      </div>
      <Field label="Native Place">
        <TextInput
          name="nativePlace"
          value={v.nativePlace}
          onChange={onChange("nativePlace")}
          placeholder="e.g. Nagercoil"
        />
      </Field>
      <Field label="Family Background" hint="Brief description">
        <Textarea
          name="familyBackground"
          value={v.familyBackground}
          onChange={onChange("familyBackground")}
          rows={3}
          maxLength={500}
          placeholder="Describe your family background..."
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Ancestral Origin">
          <TextInput
            name="ancestralOrigin"
            value={v.ancestralOrigin}
            onChange={onChange("ancestralOrigin")}
            placeholder="e.g. Kerala"
          />
        </Field>
        <Field label="Family Location">
          <SelectInput
            name="familyLocation"
            value={v.familyLocation}
            onChange={onChange("familyLocation")}
            placeholder="Select"
            options={FAMILY_LOCATIONS.map((l) => ({ value: l, label: l }))}
          />
        </Field>
      </div>
      <SaveCancelButtons
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

function AboutFamilyForm({
  profile: p,
  onSave,
  onCancel,
  saving,
}: SectionFormProps) {
  const [aboutFamily, setAboutFamily] = useState(p.aboutFamily ?? "");
  const handleSave = () => {
    const body: Record<string, unknown> = {};
    if (aboutFamily) body.aboutFamily = aboutFamily;
    onSave(body);
  };
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="About Family"
        hint={`${aboutFamily.length}/1000 \u2014 Describe your family in detail`}
      >
        <Textarea
          name="aboutFamily"
          value={aboutFamily}
          onChange={(e) => setAboutFamily(e.target.value)}
          rows={5}
          maxLength={1000}
          placeholder="Tell us about your family \u2014 values, traditions, members, lifestyle..."
        />
      </Field>
      <SaveCancelButtons
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

function PhysicalForm({
  profile: p,
  onSave,
  onCancel,
  saving,
}: SectionFormProps) {
  const [v, setV] = useState({
    height: p.height != null ? String(p.height) : "",
    weight: p.weight ?? "",
    bodyType: p.bodyType ?? "",
    complexion: p.complexion ?? "",
    bloodGroup: p.bloodGroup ?? "",
    physicalDisability:
      p.physicalDisability != null ? (p.physicalDisability ? "YES" : "NO") : "",
    physicalDisabilityDetails: p.physicalDisabilityDetails ?? "",
  });
  const onChange =
    (n: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setV((prev) => ({ ...prev, [n]: e.target.value }));
  const handleSave = () => {
    const body: Record<string, unknown> = {};
    if (v.height) body.height = Number(v.height);
    for (const k of [
      "weight",
      "bodyType",
      "complexion",
      "bloodGroup",
      "physicalDisabilityDetails",
    ]) {
      if (v[k as keyof typeof v]) body[k] = v[k as keyof typeof v];
    }
    if (v.physicalDisability)
      body.physicalDisability = v.physicalDisability === "YES";
    onSave(body);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Height">
          <SelectInput
            name="height"
            value={v.height}
            onChange={onChange("height")}
            placeholder="Select height"
            options={HEIGHT_OPTIONS}
          />
        </Field>
        <Field label="Weight">
          <TextInput
            name="weight"
            value={v.weight}
            onChange={onChange("weight")}
            placeholder="e.g. 70 kg"
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Body Type">
          <SelectInput
            name="bodyType"
            value={v.bodyType}
            onChange={onChange("bodyType")}
            placeholder="Select"
            options={BODY_TYPES.map((t) => ({ value: t, label: fmt(t) }))}
          />
        </Field>
        <Field label="Complexion">
          <SelectInput
            name="complexion"
            value={v.complexion}
            onChange={onChange("complexion")}
            placeholder="Select"
            options={COMPLEXIONS.map((c) => ({ value: c, label: fmt(c) }))}
          />
        </Field>
        <Field label="Blood Group">
          <SelectInput
            name="bloodGroup"
            value={v.bloodGroup}
            onChange={onChange("bloodGroup")}
            placeholder="Select"
            options={BLOOD_GROUPS.map((b) => ({ value: b, label: b }))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Physical Disability">
          <SelectInput
            name="physicalDisability"
            value={v.physicalDisability}
            onChange={onChange("physicalDisability")}
            placeholder="Select"
            options={[
              { value: "YES", label: "Yes" },
              { value: "NO", label: "No" },
            ]}
          />
        </Field>
        {v.physicalDisability === "YES" && (
          <Field label="Disability Details">
            <TextInput
              name="physicalDisabilityDetails"
              value={v.physicalDisabilityDetails}
              onChange={onChange("physicalDisabilityDetails")}
              placeholder="Please describe"
            />
          </Field>
        )}
      </div>
      <SaveCancelButtons
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

function LifestyleForm({
  profile: p,
  onSave,
  onCancel,
  saving,
}: SectionFormProps) {
  const [v, setV] = useState({
    diet: p.diet ?? "",
    smoking: p.smoking ?? "",
    drinking: p.drinking ?? "",
    fitnessLevel: p.fitnessLevel ?? "",
  });
  const onChange =
    (n: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setV((prev) => ({ ...prev, [n]: e.target.value }));
  const handleSave = () => {
    const body: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      if (val) body[k] = val;
    }
    onSave(body);
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <Field label="Diet">
          <SelectInput
            name="diet"
            value={v.diet}
            onChange={onChange("diet")}
            placeholder="Select"
            options={DIETS.map((d) => ({ value: d, label: fmt(d) }))}
          />
        </Field>
        <Field label="Smoking">
          <SelectInput
            name="smoking"
            value={v.smoking}
            onChange={onChange("smoking")}
            placeholder="Select"
            options={YES_NO_OCC.map((o) => ({ value: o, label: fmt(o) }))}
          />
        </Field>
        <Field label="Drinking">
          <SelectInput
            name="drinking"
            value={v.drinking}
            onChange={onChange("drinking")}
            placeholder="Select"
            options={YES_NO_OCC.map((o) => ({ value: o, label: fmt(o) }))}
          />
        </Field>
      </div>
      <Field label="Fitness Level">
        <TextInput
          name="fitnessLevel"
          value={v.fitnessLevel}
          onChange={onChange("fitnessLevel")}
          placeholder="e.g. Active, Moderate"
        />
      </Field>
      <SaveCancelButtons
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

function HobbiesForm({
  profile: p,
  onSave,
  onCancel,
  saving,
}: SectionFormProps) {
  const [v, setV] = useState({
    hobbies: p.hobbies ?? "",
    interests: p.interests ?? "",
    favouriteMusic: p.favouriteMusic ?? "",
    favouriteSports: p.favouriteSports ?? "",
    favouriteReads: p.favouriteReads ?? "",
    favouriteMovies: p.favouriteMovies ?? "",
    favouriteCuisine: p.favouriteCuisine ?? "",
  });
  const onChange = (n: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setV((prev) => ({ ...prev, [n]: e.target.value }));
  const handleSave = () => {
    const body: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      if (val) body[k] = val;
    }
    onSave(body);
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Hobbies">
          <TextInput
            name="hobbies"
            value={v.hobbies}
            onChange={onChange("hobbies")}
            placeholder="e.g. Reading, Traveling, Cooking"
          />
        </Field>
        <Field label="Interests">
          <TextInput
            name="interests"
            value={v.interests}
            onChange={onChange("interests")}
            placeholder="e.g. Movies, Art, Technology"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Favourite Music">
          <TextInput
            name="favouriteMusic"
            value={v.favouriteMusic}
            onChange={onChange("favouriteMusic")}
            placeholder="e.g. Classical, Pop, Rock"
          />
        </Field>
        <Field label="Favourite Sports">
          <TextInput
            name="favouriteSports"
            value={v.favouriteSports}
            onChange={onChange("favouriteSports")}
            placeholder="e.g. Cricket, Football, Tennis"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Favourite Reads">
          <TextInput
            name="favouriteReads"
            value={v.favouriteReads}
            onChange={onChange("favouriteReads")}
            placeholder="e.g. Fiction, Self-help, Biographies"
          />
        </Field>
        <Field label="Favourite Movies">
          <TextInput
            name="favouriteMovies"
            value={v.favouriteMovies}
            onChange={onChange("favouriteMovies")}
            placeholder="e.g. Drama, Action, Comedy"
          />
        </Field>
      </div>
      <Field label="Favourite Cuisine">
        <TextInput
          name="favouriteCuisine"
          value={v.favouriteCuisine}
          onChange={onChange("favouriteCuisine")}
          placeholder="e.g. South Indian, Italian, Chinese"
        />
      </Field>
      <SaveCancelButtons
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

function LocationForm({
  profile: p,
  onSave,
  onCancel,
  saving,
}: SectionFormProps) {
  const lookups = useLookups();
  const [v, setV] = useState({
    countryId: p.countryId != null ? String(p.countryId) : "",
    stateId: p.stateId != null ? String(p.stateId) : "",
    cityId: p.cityId != null ? String(p.cityId) : "",
    currentAddress: p.currentAddress ?? "",
    citizenship: p.citizenship ?? "",
    residencyStatus: p.residencyStatus ?? "",
  });
  const set = (n: string, val: string) =>
    setV((prev) => ({ ...prev, [n]: val }));
  const onChange =
    (n: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      set(n, e.target.value);
  const filteredStates = lookups.states.filter(
    (s) => s.countryId === Number(v.countryId),
  );
  const filteredCities = lookups.cities.filter(
    (c) => c.stateId === Number(v.stateId),
  );
  const handleSave = () => {
    const body: Record<string, unknown> = {};
    if (v.countryId) body.countryId = Number(v.countryId);
    if (v.stateId) body.stateId = Number(v.stateId);
    if (v.cityId) body.cityId = Number(v.cityId);
    if (v.currentAddress) body.currentAddress = v.currentAddress;
    if (v.citizenship) body.citizenship = v.citizenship;
    if (v.residencyStatus) body.residencyStatus = v.residencyStatus;
    onSave(body);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <Field label="Country">
          <SelectInput
            name="countryId"
            value={v.countryId}
            onChange={(e) => {
              set("countryId", e.target.value);
              set("stateId", "");
              set("cityId", "");
            }}
            placeholder="Select country"
            options={lookupOptions(lookups.countries)}
          />
        </Field>
        <Field label="State">
          <SelectInput
            name="stateId"
            value={v.stateId}
            onChange={(e) => {
              set("stateId", e.target.value);
              set("cityId", "");
            }}
            placeholder="Select state"
            options={lookupOptions(filteredStates)}
          />
        </Field>
        <Field label="City">
          <SelectInput
            name="cityId"
            value={v.cityId}
            onChange={onChange("cityId")}
            placeholder="Select city"
            options={lookupOptions(filteredCities)}
          />
        </Field>
      </div>
      <Field label="Current Address" hint="Optional / Private">
        <TextInput
          name="currentAddress"
          value={v.currentAddress}
          onChange={onChange("currentAddress")}
          placeholder="Your current address"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Citizenship">
          <TextInput
            name="citizenship"
            value={v.citizenship}
            onChange={onChange("citizenship")}
            placeholder="e.g. Indian"
          />
        </Field>
        <Field label="Residency Status" hint="For NRIs">
          <TextInput
            name="residencyStatus"
            value={v.residencyStatus}
            onChange={onChange("residencyStatus")}
            placeholder="e.g. Citizen, PR, Work Visa"
          />
        </Field>
      </div>
      <SaveCancelButtons
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

function BioForm({ profile: p, onSave, onCancel, saving }: SectionFormProps) {
  const [bio, setBio] = useState(p.bio ?? "");
  const handleSave = () => {
    const body: Record<string, unknown> = {};
    if (bio) body.bio = bio;
    onSave(body);
  };
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Bio"
        hint={`${bio.length}/500 \u2014 Tell potential matches about yourself`}
      >
        <Textarea
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Share your interests, values, and what you're looking for in a partner..."
        />
      </Field>
      <SaveCancelButtons
        onCancel={onCancel}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      apiFetch(`${API_URL}/users/me`, { signal }),
      apiFetch(`${API_URL}/profiles/me`, { signal }),
    ])
      .then(async ([userRes, profileRes]) => {
        if (userRes.ok) setUser(await userRes.json());
        if (profileRes.ok) setProfile(await profileRes.json());
      })
      .catch((err) => {
        if (err.name !== "AbortError")
          toast.error("Could not connect to the server.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotosUpdate = (
    photos: string[],
    primaryPhoto: string | null,
  ) => {
    setProfile((prev) => ({ ...prev, photos, primaryPhoto }));
  };

  const handleSectionSave = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await apiFetch(`${API_URL}/profiles/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Failed to save.");
      }
      const updated: Profile = await res.json();
      setProfile(updated);
      setEditingSection(null);
      toast.success("Section updated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (key: string) => setEditingSection(key);
  const onCancel = () => setEditingSection(null);
  const formProps: SectionFormProps = {
    profile,
    onSave: handleSectionSave,
    onCancel,
    saving,
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <svg
          className="w-6 h-6 animate-spin text-primary"
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
      </div>
    );
  }

  const p = profile;
  const fullName =
    [p.firstName, p.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    "Your Name";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const location = [p.city?.name, p.state?.name, p.country?.name]
    .filter(Boolean)
    .join(", ");
  const avatarSrc = p.primaryPhoto ? `${BACKEND_URL}${p.primaryPhoto}` : null;
  const completeness = calcCompleteness(p);
  const isNeverMarried = p.maritalStatus === "NEVER_MARRIED";

  return (
    <div className="p-6 lg:p-8 w-full max-w-6xl mx-auto">
      {/* ─── Profile Summary Hero Card ─────────────────────────────────── */}
      <div className="relative bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden mb-6">
        {/* Decorative top accent bar */}
        <div
          className="h-1"
          style={{
            background: "linear-gradient(90deg, #D72638 0%, #D4AF37 100%)",
          }}
        />

        <div className="px-6 py-5">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-primary text-xl font-bold flex-none overflow-hidden ring-3 ring-secondary">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Name + details */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-text truncate">
                {fullName}
              </h1>

              {/* Info pills */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {p.dateOfBirth && (
                  <span className="text-[13px] text-text-secondary flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 text-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {calcAge(p.dateOfBirth)} yrs
                  </span>
                )}
                {p.height && (
                  <span className="text-[13px] text-text-secondary flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 text-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                    {cmToDisplay(p.height)}
                  </span>
                )}
                {p.occupation && (
                  <span className="text-[13px] text-text-secondary flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 text-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {p.occupation}
                  </span>
                )}
                {location && (
                  <span className="text-[13px] text-text-secondary flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 text-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {location}
                  </span>
                )}
              </div>

              {/* Tags */}
              {(p.religion || p.caste || p.motherTongue) && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  {p.religion && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-secondary text-primary">
                      {p.religion.name}
                    </span>
                  )}
                  {p.caste && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-surface text-text-secondary">
                      {p.caste.name}
                    </span>
                  )}
                  {p.motherTongue && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-surface text-text-secondary">
                      {p.motherTongue.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Completeness ring */}
            <div className="flex-none flex flex-col items-center gap-1">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="4"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{
                      stroke:
                        completeness >= 80
                          ? "#10B981"
                          : completeness >= 50
                            ? "#D4AF37"
                            : "#D72638",
                      strokeDasharray: `${(completeness / 100) * 150.8} 150.8`,
                      transition: "stroke-dasharray 0.5s ease",
                    }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text">
                  {completeness}%
                </span>
              </div>
              <span className="text-[10px] text-text-muted font-medium">
                Complete
              </span>
            </div>
          </div>
        </div>

        {/* Completeness hint */}
        {completeness < 80 && (
          <div className="px-6 py-2 bg-surface/50 border-t border-border/20">
            <p className="text-[11px] text-text-muted">
              Complete your profile to get better matches. Add photos, bio, and
              fill in missing details.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <PhotosSection
            photos={p.photos}
            primaryPhoto={p.primaryPhoto}
            onUpdate={handlePhotosUpdate}
          />

          {/* Basic Information */}
          <EditableSection
            title="Basic Information"
            sectionKey="basic"
            editingSection={editingSection}
            onEdit={onEdit}
            editForm={<BasicInfoForm {...formProps} />}
          >
            <InfoRow
              label="Gender"
              value={p.gender ? fmt(p.gender) : null}
              onAdd={() => onEdit("basic")}
            />
            <InfoRow
              label="Date of Birth"
              value={
                p.dateOfBirth
                  ? new Date(p.dateOfBirth).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : null
              }
              onAdd={() => onEdit("basic")}
            />
            <InfoRow
              label="Age"
              value={p.dateOfBirth ? `${calcAge(p.dateOfBirth)} years` : null}
            />
            <InfoRow
              label="Marital Status"
              value={p.maritalStatus ? fmt(p.maritalStatus) : null}
              onAdd={() => onEdit("basic")}
            />
            {!isNeverMarried && (
              <>
                <InfoRow
                  label="Children"
                  value={
                    p.numberOfChildren != null
                      ? String(p.numberOfChildren)
                      : null
                  }
                  onAdd={() => onEdit("basic")}
                />
                <BoolRow
                  label="Children Living With You"
                  value={p.childrenLivingWithYou}
                  onAdd={() => onEdit("basic")}
                />
              </>
            )}
          </EditableSection>

          {/* Religion & Community */}
          <EditableSection
            title="Religion & Community"
            sectionKey="religion"
            editingSection={editingSection}
            onEdit={onEdit}
            editForm={<ReligionForm {...formProps} />}
          >
            <InfoRow
              label="Religion"
              value={p.religion?.name ?? null}
              onAdd={() => onEdit("religion")}
            />
            <InfoRow
              label="Mother Tongue"
              value={p.motherTongue?.name ?? null}
              onAdd={() => onEdit("religion")}
            />
            <InfoRow
              label="Caste"
              value={p.caste?.name ?? null}
              onAdd={() => onEdit("religion")}
            />
            <InfoRow label="Community" value={p.communityName} />
            <InfoRow label="Gothram" value={p.gothram} />
            <InfoRow
              label="Denomination"
              value={p.denomination?.name ?? null}
            />
            <InfoRow label="Sect" value={p.sect} />
            <InfoRow
              label="Known Languages"
              value={
                p.knownLanguages?.length
                  ? p.knownLanguages.map((kl) => kl.language.name).join(", ")
                  : null
              }
              onAdd={() => onEdit("religion")}
            />
            <InfoRow
              label="Community Preference"
              value={p.communityPreference}
            />
          </EditableSection>

          {/* Horoscope */}
          <EditableSection
            title="Horoscope / Astrology"
            sectionKey="horoscope"
            editingSection={editingSection}
            onEdit={onEdit}
            editForm={<HoroscopeForm {...formProps} />}
          >
            <InfoRow
              label="Time of Birth"
              value={p.timeOfBirth}
              onAdd={() => onEdit("horoscope")}
            />
            <InfoRow
              label="Place of Birth"
              value={p.placeOfBirth}
              onAdd={() => onEdit("horoscope")}
            />
            <InfoRow
              label="Rasi"
              value={p.rasi?.name ?? null}
              onAdd={() => onEdit("horoscope")}
            />
            <InfoRow
              label="Nakshatra"
              value={p.nakshatra?.name ?? null}
              onAdd={() => onEdit("horoscope")}
            />
            <InfoRow label="Lagna" value={p.lagna} />
            <InfoRow label="Dasa / Bhukti" value={p.dasaBhukti} />
            <BoolRow label="Chevvai Dosham" value={p.chevvaiDosham} />
            <InfoRow label="Star Compatibility" value={p.starCompatibility} />
          </EditableSection>

          {/* Education & Career */}
          <EditableSection
            title="Education & Career"
            sectionKey="education"
            editingSection={editingSection}
            onEdit={onEdit}
            editForm={<EducationForm {...formProps} />}
          >
            <InfoRow
              label="Highest Qualification"
              value={p.education}
              onAdd={() => onEdit("education")}
            />
            <InfoRow label="Degree" value={p.degree} />
            <InfoRow label="Field of Study" value={p.fieldOfStudy} />
            <InfoRow label="College / University" value={p.collegeUniversity} />
            <InfoRow
              label="Occupation"
              value={p.occupation}
              onAdd={() => onEdit("education")}
            />
            <InfoRow label="Job Title" value={p.jobTitle} />
            <InfoRow label="Company" value={p.companyName} />
            <InfoRow label="Industry" value={p.industry} />
            <InfoRow
              label="Employment Type"
              value={p.employmentType ? fmt(p.employmentType) : null}
              onAdd={() => onEdit("education")}
            />
            <InfoRow label="Annual Income" value={p.annualIncome} />
            <InfoRow label="Work Location" value={p.workLocation} />
          </EditableSection>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Family Details */}
          <EditableSection
            title="Family Details"
            sectionKey="family"
            editingSection={editingSection}
            onEdit={onEdit}
            editForm={<FamilyForm {...formProps} />}
          >
            <InfoRow
              label="Family Type"
              value={p.familyType ? fmt(p.familyType) : null}
              onAdd={() => onEdit("family")}
            />
            <InfoRow
              label="Family Status"
              value={p.familyStatus ? fmt(p.familyStatus) : null}
            />
            <InfoRow
              label="Family Values"
              value={p.familyValues ? fmt(p.familyValues) : null}
            />
            <InfoRow
              label="Father's Name"
              value={p.fatherName}
              onAdd={() => onEdit("family")}
            />
            <InfoRow label="Father's Occupation" value={p.fatherOccupation} />
            <InfoRow
              label="Mother's Name"
              value={p.motherName}
              onAdd={() => onEdit("family")}
            />
            <InfoRow label="Mother's Occupation" value={p.motherOccupation} />
            <InfoRow
              label="Brothers"
              value={
                p.numberOfBrothers != null ? String(p.numberOfBrothers) : null
              }
            />
            <InfoRow
              label="Sisters"
              value={
                p.numberOfSisters != null ? String(p.numberOfSisters) : null
              }
            />
            <InfoRow
              label="Married Siblings"
              value={
                p.marriedSiblings != null ? String(p.marriedSiblings) : null
              }
            />
            <InfoRow
              label="Native Place"
              value={p.nativePlace}
              onAdd={() => onEdit("family")}
            />
            <InfoRow label="Family Background" value={p.familyBackground} />
            <InfoRow
              label="Ancestral Origin"
              value={p.ancestralOrigin}
              onAdd={() => onEdit("family")}
            />
            <InfoRow label="Family Location" value={p.familyLocation} />
          </EditableSection>

          {/* About my Family */}
          <EditableSection
            title="About my Family"
            sectionKey="aboutFamily"
            editingSection={editingSection}
            onEdit={onEdit}
            editForm={<AboutFamilyForm {...formProps} />}
          >
            <div className="col-span-2">
              <InfoRow
                label="About Family"
                value={p.aboutFamily}
                onAdd={() => onEdit("aboutFamily")}
              />
            </div>
          </EditableSection>

          {/* Physical Attributes */}
          <EditableSection
            title="Physical Attributes"
            sectionKey="physical"
            editingSection={editingSection}
            onEdit={onEdit}
            editForm={<PhysicalForm {...formProps} />}
          >
            <InfoRow
              label="Height"
              value={cmToDisplay(p.height)}
              onAdd={() => onEdit("physical")}
            />
            <InfoRow label="Weight" value={p.weight} />
            <InfoRow
              label="Body Type"
              value={p.bodyType ? fmt(p.bodyType) : null}
            />
            <InfoRow
              label="Complexion"
              value={p.complexion ? fmt(p.complexion) : null}
            />
            <InfoRow label="Blood Group" value={p.bloodGroup} />
            <BoolRow label="Physical Disability" value={p.physicalDisability} />
            <InfoRow
              label="Disability Details"
              value={p.physicalDisabilityDetails}
            />
          </EditableSection>

          {/* Lifestyle & Habits */}
          <EditableSection
            title="Lifestyle & Habits"
            sectionKey="lifestyle"
            editingSection={editingSection}
            onEdit={onEdit}
            editForm={<LifestyleForm {...formProps} />}
          >
            <InfoRow
              label="Diet"
              value={p.diet ? fmt(p.diet) : null}
              onAdd={() => onEdit("lifestyle")}
            />
            <InfoRow
              label="Smoking"
              value={p.smoking ? fmt(p.smoking) : null}
            />
            <InfoRow
              label="Drinking"
              value={p.drinking ? fmt(p.drinking) : null}
            />
            <InfoRow label="Fitness Level" value={p.fitnessLevel} />
          </EditableSection>

          {/* Hobbies & Interest */}
          <EditableSection
            title="Hobbies & Interest"
            sectionKey="hobbies"
            editingSection={editingSection}
            onEdit={onEdit}
            editForm={<HobbiesForm {...formProps} />}
          >
            <InfoRow
              label="Hobbies"
              value={p.hobbies}
              onAdd={() => onEdit("hobbies")}
            />
            <InfoRow label="Interests" value={p.interests} />
            <InfoRow label="Favourite Music" value={p.favouriteMusic} />
            <InfoRow label="Favourite Sports" value={p.favouriteSports} />
            <InfoRow label="Favourite Reads" value={p.favouriteReads} />
            <InfoRow label="Favourite Movies" value={p.favouriteMovies} />
            <InfoRow label="Favourite Cuisine" value={p.favouriteCuisine} />
          </EditableSection>

          {/* Location */}
          <EditableSection
            title="Location Details"
            sectionKey="location"
            editingSection={editingSection}
            onEdit={onEdit}
            editForm={<LocationForm {...formProps} />}
          >
            <InfoRow
              label="City"
              value={p.city?.name ?? null}
              onAdd={() => onEdit("location")}
            />
            <InfoRow label="State" value={p.state?.name ?? null} />
            <InfoRow label="Country" value={p.country?.name ?? null} />
            <InfoRow label="Citizenship" value={p.citizenship} />
            <InfoRow label="Residency Status" value={p.residencyStatus} />
          </EditableSection>

          {/* Bio */}
          <EditableSection
            title="About"
            sectionKey="bio"
            editingSection={editingSection}
            onEdit={onEdit}
            editForm={<BioForm {...formProps} />}
          >
            <div className="col-span-2">
              <InfoRow label="Bio" value={p.bio} onAdd={() => onEdit("bio")} />
            </div>
          </EditableSection>
        </div>
      </div>
    </div>
  );
}
