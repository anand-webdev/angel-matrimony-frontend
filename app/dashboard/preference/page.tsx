'use client';

import { useEffect, useState } from 'react';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';
import { Field, TextInput, SelectInput, MultiSelectInput } from '../../components/Input';
import { API_URL, apiFetch } from '../../lib/api';
import { useLookups } from '../../providers/LookupProvider';
import { lookupOptions } from '../../lib/lookups';

// ─── Constants ────────────────────────────────────────────────────────────────

const fmt = (s: string) =>
  s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const GENDERS = ['MALE', 'FEMALE'] as const;
const MARITAL_STATUSES = ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE'] as const;
const EATING_HABITS = ['VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN'] as const;
const DRINKING_HABITS = ['NO', 'YES', 'OCCASIONALLY'] as const;
const SMOKING_HABITS = ['NO', 'YES', 'OCCASIONALLY'] as const;
const EMPLOYMENT_TYPES = ['PRIVATE', 'GOVERNMENT', 'BUSINESS', 'SELF_EMPLOYED', 'NOT_WORKING'] as const;
const PHYSICAL_STATUSES = ['Normal', 'Physically Challenged'] as const;

// ─── Height helpers (cm ↔ display) ───────────────────────────────────────────

/** Build height options from 4'0" (122 cm) to 7'0" (213 cm) */
const HEIGHT_OPTIONS: { value: string; label: string; cm: number }[] = (() => {
  const opts: { value: string; label: string; cm: number }[] = [];
  for (let ft = 4; ft <= 7; ft++) {
    const maxIn = ft === 7 ? 0 : 11;
    for (let inch = 0; inch <= maxIn; inch++) {
      const cm = Math.round(ft * 30.48 + inch * 2.54);
      const label = `${ft} Ft ${inch} In`;
      opts.push({ value: String(cm), label, cm });
    }
  }
  return opts;
})();

const cmToDisplay = (cm: number | null | undefined): string => {
  if (cm == null) return '';
  const match = HEIGHT_OPTIONS.find((o) => o.cm === cm);
  return match ? match.label : `${cm} cm`;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type LookupItem = { id: number; name: string; slug: string };

type Preference = {
  id: string;
  preferredGender: string | null;
  minAge: number;
  maxAge: number;
  minHeight: number | null;
  maxHeight: number | null;
  physicalStatus: string | null;
  annualIncome: string | null;
  education: string | null;
  occupation: string | null;
  maritalStatuses: string[];
  eatingHabits: string[];
  drinkingHabits: string[];
  smokingHabits: string[];
  employmentTypes: string[];
  religions: LookupItem[];
  denominations: LookupItem[];
  languages: LookupItem[];
  castes: LookupItem[];
  nakshatras: LookupItem[];
  countries: LookupItem[];
  states: LookupItem[];
  cities: LookupItem[];
  createdAt: string;
};

const EMPTY_PREFERENCE: Preference = {
  id: '', preferredGender: null, minAge: 18, maxAge: 35,
  minHeight: null, maxHeight: null, physicalStatus: null,
  annualIncome: null, education: null, occupation: null,
  maritalStatuses: [], eatingHabits: [], drinkingHabits: [],
  smokingHabits: [], employmentTypes: [],
  religions: [], denominations: [], languages: [], castes: [],
  nakshatras: [], countries: [], states: [], cities: [],
  createdAt: '',
};

type SectionFormProps = {
  pref: Preference;
  isNew: boolean;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
};

// ─── View Components ──────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-text-muted font-medium">{label}</span>
        <span className={`text-sm font-semibold ${empty ? 'text-text-muted italic' : 'text-text'}`}>
          {empty ? 'Not specified' : value}
        </span>
      </div>
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="text-primary text-sm font-medium hover:text-primary-dark transition-colors flex items-center gap-1">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      Edit
    </button>
  );
}

function SaveCancelButtons({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="flex gap-3 mt-2">
      <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
      <Button size="sm" onClick={onSave} disabled={saving}>{saving ? 'Saving\u2026' : 'Save'}</Button>
    </div>
  );
}

function EditableSection({
  title, sectionKey, editingSection, onEdit, children, editForm,
}: {
  title: string;
  sectionKey: string;
  editingSection: string | null;
  onEdit: (key: string) => void;
  children: React.ReactNode;
  editForm: React.ReactNode;
}) {
  const isEditing = editingSection === sectionKey;
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">{title}</h3>
        {!isEditing && <EditButton onClick={() => onEdit(sectionKey)} />}
      </div>
      {isEditing ? editForm : <div className="flex flex-col">{children}</div>}
    </div>
  );
}

// ─── Enum option helpers ─────────────────────────────────────────────────────

const enumOptions = (values: readonly string[]) =>
  values.map((v) => ({ value: v, label: fmt(v) }));

// ─── Section Edit Forms ───────────────────────────────────────────────────────

function BasicPrefForm({ pref: p, onSave, onCancel, saving }: SectionFormProps) {
  const lookups = useLookups();

  const [v, setV] = useState({
    preferredGender: p.preferredGender ?? '',
    minAge: String(p.minAge),
    maxAge: String(p.maxAge),
    minHeight: p.minHeight != null ? String(p.minHeight) : '',
    maxHeight: p.maxHeight != null ? String(p.maxHeight) : '',
    physicalStatus: p.physicalStatus ?? '',
    maritalStatuses: [...p.maritalStatuses],
    languages: p.languages.map((l) => String(l.id)),
    eatingHabits: [...p.eatingHabits],
    drinkingHabits: [...p.drinkingHabits],
    smokingHabits: [...p.smokingHabits],
  });

  const onScalar = (n: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((prev) => ({ ...prev, [n]: e.target.value }));

  const onMulti = (n: string) => (vals: string[]) =>
    setV((prev) => ({ ...prev, [n]: vals }));

  const handleSave = () => {
    const body: Record<string, unknown> = {
      minAge: Number(v.minAge),
      maxAge: Number(v.maxAge),
      maritalStatuses: v.maritalStatuses,
      eatingHabits: v.eatingHabits,
      drinkingHabits: v.drinkingHabits,
      smokingHabits: v.smokingHabits,
      languageIds: v.languages.map(Number),
    };
    if (v.preferredGender) body.preferredGender = v.preferredGender;
    if (v.minHeight) body.minHeight = Number(v.minHeight);
    if (v.maxHeight) body.maxHeight = Number(v.maxHeight);
    if (v.physicalStatus) body.physicalStatus = v.physicalStatus;
    onSave(body);
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Preferred Gender">
        <SelectInput name="preferredGender" value={v.preferredGender} onChange={onScalar('preferredGender')} placeholder="Any"
          options={enumOptions(GENDERS)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Minimum Age" required>
          <TextInput name="minAge" type="number" min={18} max={80} value={v.minAge} onChange={onScalar('minAge')} placeholder="18" />
        </Field>
        <Field label="Maximum Age" required>
          <TextInput name="maxAge" type="number" min={18} max={80} value={v.maxAge} onChange={onScalar('maxAge')} placeholder="35" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Minimum Height">
          <SelectInput name="minHeight" value={v.minHeight} onChange={onScalar('minHeight')} placeholder="Select"
            options={HEIGHT_OPTIONS.map((h) => ({ value: h.value, label: h.label }))} />
        </Field>
        <Field label="Maximum Height">
          <SelectInput name="maxHeight" value={v.maxHeight} onChange={onScalar('maxHeight')} placeholder="Select"
            options={HEIGHT_OPTIONS.map((h) => ({ value: h.value, label: h.label }))} />
        </Field>
      </div>
      <Field label="Marital Status">
        <MultiSelectInput options={enumOptions(MARITAL_STATUSES)} value={v.maritalStatuses} onChange={onMulti('maritalStatuses')} />
      </Field>
      <Field label="Mother Tongue">
        <MultiSelectInput options={lookupOptions(lookups.languages)} value={v.languages} onChange={onMulti('languages')} columns={3} />
      </Field>
      <Field label="Physical Status">
        <SelectInput name="physicalStatus" value={v.physicalStatus} onChange={onScalar('physicalStatus')} placeholder="Any"
          options={PHYSICAL_STATUSES.map((s) => ({ value: s, label: s }))} />
      </Field>
      <Field label="Eating Habits">
        <MultiSelectInput options={enumOptions(EATING_HABITS)} value={v.eatingHabits} onChange={onMulti('eatingHabits')} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Drinking Habits">
          <MultiSelectInput options={enumOptions(DRINKING_HABITS)} value={v.drinkingHabits} onChange={onMulti('drinkingHabits')} columns={1} />
        </Field>
        <Field label="Smoking Habits">
          <MultiSelectInput options={enumOptions(SMOKING_HABITS)} value={v.smokingHabits} onChange={onMulti('smokingHabits')} columns={1} />
        </Field>
      </div>
      <SaveCancelButtons onCancel={onCancel} onSave={handleSave} saving={saving} />
    </div>
  );
}

function ReligiousPrefForm({ pref: p, onSave, onCancel, saving }: SectionFormProps) {
  const lookups = useLookups();

  const [v, setV] = useState({
    religions: p.religions.map((r) => String(r.id)),
    denominations: p.denominations.map((d) => String(d.id)),
    castes: p.castes.map((c) => String(c.id)),
    nakshatras: p.nakshatras.map((n) => String(n.id)),
  });

  const onMulti = (n: string) => (vals: string[]) =>
    setV((prev) => ({ ...prev, [n]: vals }));

  const handleSave = () => {
    onSave({
      minAge: p.minAge,
      maxAge: p.maxAge,
      religionIds: v.religions.map(Number),
      denominationIds: v.denominations.map(Number),
      casteIds: v.castes.map(Number),
      nakshatraIds: v.nakshatras.map(Number),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Preferred Religion">
        <MultiSelectInput options={lookupOptions(lookups.religions)} value={v.religions} onChange={onMulti('religions')} />
      </Field>
      <Field label="Denomination">
        <MultiSelectInput options={lookupOptions(lookups.denominations)} value={v.denominations} onChange={onMulti('denominations')} columns={3} />
      </Field>
      <Field label="Caste">
        <MultiSelectInput options={lookupOptions(lookups.castes)} value={v.castes} onChange={onMulti('castes')} columns={3} />
      </Field>
      <Field label="Star (Nakshatra)">
        <MultiSelectInput options={lookupOptions(lookups.nakshatras)} value={v.nakshatras} onChange={onMulti('nakshatras')} columns={3} />
      </Field>
      <SaveCancelButtons onCancel={onCancel} onSave={handleSave} saving={saving} />
    </div>
  );
}

function ProfessionalPrefForm({ pref: p, onSave, onCancel, saving }: SectionFormProps) {
  const [v, setV] = useState({
    education: p.education ?? '',
    employmentTypes: [...p.employmentTypes],
    occupation: p.occupation ?? '',
    annualIncome: p.annualIncome ?? '',
  });

  const onScalar = (n: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((prev) => ({ ...prev, [n]: e.target.value }));

  const onMulti = (n: string) => (vals: string[]) =>
    setV((prev) => ({ ...prev, [n]: vals }));

  const handleSave = () => {
    const body: Record<string, unknown> = {
      minAge: p.minAge,
      maxAge: p.maxAge,
      employmentTypes: v.employmentTypes,
    };
    if (v.education) body.education = v.education;
    if (v.occupation) body.occupation = v.occupation;
    if (v.annualIncome) body.annualIncome = v.annualIncome;
    onSave(body);
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Education">
        <TextInput name="education" value={v.education} onChange={onScalar('education')} placeholder="Any" />
      </Field>
      <Field label="Employed In">
        <MultiSelectInput options={enumOptions(EMPLOYMENT_TYPES)} value={v.employmentTypes} onChange={onMulti('employmentTypes')} columns={3} />
      </Field>
      <Field label="Occupation">
        <TextInput name="occupation" value={v.occupation} onChange={onScalar('occupation')} placeholder="Any" />
      </Field>
      <Field label="Annual Income">
        <TextInput name="annualIncome" value={v.annualIncome} onChange={onScalar('annualIncome')} placeholder="Any" />
      </Field>
      <SaveCancelButtons onCancel={onCancel} onSave={handleSave} saving={saving} />
    </div>
  );
}

function LocationPrefForm({ pref: p, onSave, onCancel, saving }: SectionFormProps) {
  const lookups = useLookups();

  const [v, setV] = useState({
    countries: p.countries.map((c) => String(c.id)),
    states: p.states.map((s) => String(s.id)),
    cities: p.cities.map((c) => String(c.id)),
  });

  const onMulti = (n: string) => (vals: string[]) =>
    setV((prev) => ({ ...prev, [n]: vals }));

  const handleSave = () => {
    onSave({
      minAge: p.minAge,
      maxAge: p.maxAge,
      countryIds: v.countries.map(Number),
      stateIds: v.states.map(Number),
      cityIds: v.cities.map(Number),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Country">
        <MultiSelectInput options={lookupOptions(lookups.countries)} value={v.countries} onChange={onMulti('countries')} columns={3} />
      </Field>
      <Field label="State">
        <MultiSelectInput options={lookupOptions(lookups.states)} value={v.states} onChange={onMulti('states')} columns={3} />
      </Field>
      <Field label="City">
        <MultiSelectInput options={lookupOptions(lookups.cities)} value={v.cities} onChange={onMulti('cities')} columns={3} />
      </Field>
      <SaveCancelButtons onCancel={onCancel} onSave={handleSave} saving={saving} />
    </div>
  );
}

// ─── Display helpers ──────────────────────────────────────────────────────────

const fmtEnumList = (arr: string[]) => arr.length ? arr.map(fmt).join(', ') : null;
const fmtLookupNames = (arr: LookupItem[]) =>
  arr.length ? arr.map((item) => item.name).join(', ') : null;

// ─── Preference Page ──────────────────────────────────────────────────────────

export default function PreferencePage() {
  const toast = useToast();
  const [pref, setPref] = useState<Preference>(EMPTY_PREFERENCE);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch(`${API_URL}/preferences/me`, { signal: controller.signal })
      .then(async (res) => {
        if (res.ok) {
          setPref(await res.json());
          setIsNew(false);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') toast.error('Could not connect to the server.');
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSectionSave = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await apiFetch(
        `${API_URL}/preferences${isNew ? '' : '/me'}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Failed to save.');
      }
      const updated: Preference = await res.json();
      setPref(updated);
      setIsNew(false);
      setEditingSection(null);
      toast.success('Preference updated!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (key: string) => setEditingSection(key);
  const onCancel = () => setEditingSection(null);
  const formProps: SectionFormProps = { pref, isNew, onSave: handleSectionSave, onCancel, saving };

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

  const p = pref;
  const heightDisplay = (() => {
    if (p.minHeight != null && p.maxHeight != null) return `${cmToDisplay(p.minHeight)} - ${cmToDisplay(p.maxHeight)}`;
    return cmToDisplay(p.minHeight) || cmToDisplay(p.maxHeight) || null;
  })();

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">My Preference</h1>
          <p className="text-sm text-text-muted mt-0.5">What you're looking for in a partner.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Basic Preferences */}
        <EditableSection title="Basic Preferences" sectionKey="basic" editingSection={editingSection} onEdit={onEdit}
          editForm={<BasicPrefForm {...formProps} />}>
          <InfoRow label="Preferred Gender" value={p.preferredGender ? fmt(p.preferredGender) : null} />
          <InfoRow label="Age" value={`${p.minAge} - ${p.maxAge} years`} />
          <InfoRow label="Height" value={heightDisplay} />
          <InfoRow label="Marital Status" value={fmtEnumList(p.maritalStatuses)} />
          <InfoRow label="Mother Tongue" value={fmtLookupNames(p.languages)} />
          <InfoRow label="Physical Status" value={p.physicalStatus} />
          <InfoRow label="Eating Habits" value={fmtEnumList(p.eatingHabits)} />
          <InfoRow label="Drinking Habits" value={fmtEnumList(p.drinkingHabits)} />
          <InfoRow label="Smoking Habits" value={fmtEnumList(p.smokingHabits)} />
        </EditableSection>

        {/* Religious Preferences */}
        <EditableSection title="Religious Preferences" sectionKey="religious" editingSection={editingSection} onEdit={onEdit}
          editForm={<ReligiousPrefForm {...formProps} />}>
          <InfoRow label="Religion" value={fmtLookupNames(p.religions)} />
          <InfoRow label="Denomination" value={fmtLookupNames(p.denominations)} />
          <InfoRow label="Caste" value={fmtLookupNames(p.castes)} />
          <InfoRow label="Star (Nakshatra)" value={fmtLookupNames(p.nakshatras)} />
        </EditableSection>

        {/* Professional Preferences */}
        <EditableSection title="Professional Preferences" sectionKey="professional" editingSection={editingSection} onEdit={onEdit}
          editForm={<ProfessionalPrefForm {...formProps} />}>
          <InfoRow label="Education" value={p.education} />
          <InfoRow label="Employed In" value={fmtEnumList(p.employmentTypes)} />
          <InfoRow label="Occupation" value={p.occupation} />
          <InfoRow label="Annual Income" value={p.annualIncome} />
        </EditableSection>

        {/* Location Preferences */}
        <EditableSection title="Location Preferences" sectionKey="location" editingSection={editingSection} onEdit={onEdit}
          editForm={<LocationPrefForm {...formProps} />}>
          <InfoRow label="Country" value={fmtLookupNames(p.countries)} />
          <InfoRow label="State" value={fmtLookupNames(p.states)} />
          <InfoRow label="City" value={fmtLookupNames(p.cities)} />
        </EditableSection>
      </div>
    </div>
  );
}
