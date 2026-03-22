"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL, apiFetch } from "../../../lib/api";
import { fmt, calcAge, cmToDisplay, buildLocation } from "../../../lib/profile-utils";
import type { ProfileWithUser } from "../../../types/profile";
import { InfoRow, BoolRow, Section, PhotoGallery } from "../../../components/profile";

export default function ProfileDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.userId) return;
    (async () => {
      try {
        const res = await apiFetch(`${API_URL}/profiles/${params.userId}`);
        if (!res.ok) throw new Error("Profile not found");
        const data = await res.json();
        setProfile(data);
      } catch {
        setError("Could not load this profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-text-muted">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <svg className="w-16 h-16 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-text-secondary font-medium">{error ?? "Profile not found"}</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-primary font-semibold hover:text-primary-dark transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const p = profile;
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ") || p.user.name;
  const age = p.dateOfBirth ? calcAge(p.dateOfBirth) : null;
  const height = cmToDisplay(p.height);
  const location = buildLocation(p);
  const avatarSrc = p.primaryPhoto ?? p.photos[0] ?? null;
  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isNeverMarried = p.maritalStatus === "NEVER_MARRIED";

  return (
    <div className="p-6 lg:p-8 w-full max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Search
      </button>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden mb-6">
        <div className="h-1" style={{ background: "linear-gradient(90deg, #D72638 0%, #D4AF37 100%)" }} />

        <div className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-primary text-2xl font-bold flex-none overflow-hidden ring-3 ring-secondary">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>

            {/* Name + details */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-text truncate">{fullName}</h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                {age && (
                  <span className="text-[13px] text-text-secondary flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {age} yrs
                  </span>
                )}
                {height && (
                  <span className="text-[13px] text-text-secondary flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    {height}
                  </span>
                )}
                {p.occupation && (
                  <span className="text-[13px] text-text-secondary flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {p.occupation}
                  </span>
                )}
                {location && (
                  <span className="text-[13px] text-text-secondary flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {location}
                  </span>
                )}
              </div>

              {/* Tags */}
              {(p.religion || p.caste || p.motherTongue) && (
                <div className="flex items-center gap-1.5 mt-3">
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

            {/* Actions */}
            <div className="flex items-center gap-2 flex-none">
              <button
                type="button"
                className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-secondary/60 transition-colors"
                title="Shortlist"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-dark transition-colors"
              >
                Send Interest
              </button>
            </div>
          </div>
        </div>

        {/* Bio */}
        {p.bio && (
          <div className="px-6 pb-5 -mt-1">
            <p className="text-sm text-text-secondary leading-relaxed">{p.bio}</p>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — Photos */}
        <div className="lg:col-span-1">
          <PhotoGallery photos={p.photos} primaryPhoto={p.primaryPhoto} />
        </div>

        {/* Right column — Detail sections */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Section title="Basic Information" sectionKey="basic">
            <InfoRow label="Gender" value={p.gender ? fmt(p.gender) : null} />
            <InfoRow
              label="Date of Birth"
              value={p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null}
            />
            <InfoRow label="Age" value={age ? `${age} years` : null} />
            <InfoRow label="Marital Status" value={p.maritalStatus ? fmt(p.maritalStatus) : null} />
            {!isNeverMarried && (
              <>
                <InfoRow label="Children" value={p.numberOfChildren != null ? String(p.numberOfChildren) : null} />
                <BoolRow label="Children Living With You" value={p.childrenLivingWithYou} />
              </>
            )}
          </Section>

          <Section title="Religion & Community" sectionKey="religion">
            <InfoRow label="Religion" value={p.religion?.name} />
            <InfoRow label="Mother Tongue" value={p.motherTongue?.name} />
            <InfoRow label="Caste" value={p.caste?.name} />
            <InfoRow label="Community" value={p.communityName} />
            <InfoRow label="Gothram" value={p.gothram} />
            <InfoRow label="Denomination" value={p.denomination?.name} />
            <InfoRow label="Sect" value={p.sect} />
            <InfoRow
              label="Known Languages"
              value={p.knownLanguages?.length ? p.knownLanguages.map((kl) => kl.language.name).join(", ") : null}
            />
            <InfoRow label="Community Preference" value={p.communityPreference} />
          </Section>

          <Section title="Horoscope / Astrology" sectionKey="horoscope">
            <InfoRow label="Time of Birth" value={p.timeOfBirth} />
            <InfoRow label="Place of Birth" value={p.placeOfBirth} />
            <InfoRow label="Rasi" value={p.rasi?.name} />
            <InfoRow label="Nakshatra" value={p.nakshatra?.name} />
            <InfoRow label="Lagna" value={p.lagna} />
            <InfoRow label="Dasa / Bhukti" value={p.dasaBhukti} />
            <BoolRow label="Chevvai Dosham" value={p.chevvaiDosham} />
            <InfoRow label="Star Compatibility" value={p.starCompatibility} />
          </Section>

          <Section title="Education & Career" sectionKey="education">
            <InfoRow label="Highest Qualification" value={p.education} />
            <InfoRow label="Degree" value={p.degree} />
            <InfoRow label="Field of Study" value={p.fieldOfStudy} />
            <InfoRow label="College / University" value={p.collegeUniversity} />
            <InfoRow label="Occupation" value={p.occupation} />
            <InfoRow label="Job Title" value={p.jobTitle} />
            <InfoRow label="Company" value={p.companyName} />
            <InfoRow label="Industry" value={p.industry} />
            <InfoRow label="Employment Type" value={p.employmentType ? fmt(p.employmentType) : null} />
            <InfoRow label="Annual Income" value={p.annualIncome} />
            <InfoRow label="Work Location" value={p.workLocation} />
          </Section>

          <Section title="Family Details" sectionKey="family">
            <InfoRow label="Family Type" value={p.familyType ? fmt(p.familyType) : null} />
            <InfoRow label="Family Status" value={p.familyStatus ? fmt(p.familyStatus) : null} />
            <InfoRow label="Family Values" value={p.familyValues ? fmt(p.familyValues) : null} />
            <InfoRow label="Father's Name" value={p.fatherName} />
            <InfoRow label="Father's Occupation" value={p.fatherOccupation} />
            <InfoRow label="Mother's Name" value={p.motherName} />
            <InfoRow label="Mother's Occupation" value={p.motherOccupation} />
            <InfoRow label="Brothers" value={p.numberOfBrothers != null ? String(p.numberOfBrothers) : null} />
            <InfoRow label="Sisters" value={p.numberOfSisters != null ? String(p.numberOfSisters) : null} />
            <InfoRow label="Married Siblings" value={p.marriedSiblings != null ? String(p.marriedSiblings) : null} />
            <InfoRow label="Native Place" value={p.nativePlace} />
            <InfoRow label="Family Background" value={p.familyBackground} />
            <InfoRow label="Ancestral Origin" value={p.ancestralOrigin} />
            <InfoRow label="Family Location" value={p.familyLocation} />
          </Section>

          {p.aboutFamily && (
            <Section title="About Family" sectionKey="bio">
              <div className="col-span-2">
                <p className="text-sm text-text-secondary leading-relaxed">{p.aboutFamily}</p>
              </div>
            </Section>
          )}

          <Section title="Physical Attributes" sectionKey="physical">
            <InfoRow label="Height" value={cmToDisplay(p.height)} />
            <InfoRow label="Weight" value={p.weight} />
            <InfoRow label="Body Type" value={p.bodyType ? fmt(p.bodyType) : null} />
            <InfoRow label="Complexion" value={p.complexion ? fmt(p.complexion) : null} />
            <InfoRow label="Blood Group" value={p.bloodGroup} />
            <BoolRow label="Physical Disability" value={p.physicalDisability} />
            <InfoRow label="Disability Details" value={p.physicalDisabilityDetails} />
          </Section>

          <Section title="Lifestyle & Habits" sectionKey="lifestyle">
            <InfoRow label="Diet" value={p.diet ? fmt(p.diet) : null} />
            <InfoRow label="Smoking" value={p.smoking ? fmt(p.smoking) : null} />
            <InfoRow label="Drinking" value={p.drinking ? fmt(p.drinking) : null} />
            <InfoRow label="Fitness Level" value={p.fitnessLevel} />
          </Section>

          <Section title="Hobbies & Interests" sectionKey="hobbies">
            <InfoRow label="Hobbies" value={p.hobbies} />
            <InfoRow label="Interests" value={p.interests} />
            <InfoRow label="Favourite Music" value={p.favouriteMusic} />
            <InfoRow label="Favourite Sports" value={p.favouriteSports} />
            <InfoRow label="Favourite Reads" value={p.favouriteReads} />
            <InfoRow label="Favourite Movies" value={p.favouriteMovies} />
            <InfoRow label="Favourite Cuisine" value={p.favouriteCuisine} />
          </Section>

          <Section title="Location Details" sectionKey="location">
            <InfoRow label="City" value={p.city?.name} />
            <InfoRow label="State" value={p.state?.name} />
            <InfoRow label="Country" value={p.country?.name} />
            <InfoRow label="Citizenship" value={p.citizenship} />
            <InfoRow label="Residency Status" value={p.residencyStatus} />
          </Section>
        </div>
      </div>
    </div>
  );
}
