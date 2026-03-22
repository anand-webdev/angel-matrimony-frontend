import { API_URL } from './api';

// ─── Lookup Types ────────────────────────────────────────────────────────────

export type LookupItem = {
  id: number;
  name: string;
  slug: string;
};

export type Religion = LookupItem;
export type Denomination = LookupItem & { religionId: number };
export type Language = LookupItem;
export type Caste = LookupItem & { religionId: number };
export type Country = LookupItem & { code: string };
export type State = LookupItem & { countryId: number };
export type City = LookupItem & { stateId: number };
export type Nakshatra = LookupItem;
export type Rasi = LookupItem;

export type LookupData = {
  religions: Religion[];
  denominations: Denomination[];
  languages: Language[];
  castes: Caste[];
  countries: Country[];
  states: State[];
  cities: City[];
  nakshatras: Nakshatra[];
  rasis: Rasi[];
};

export const EMPTY_LOOKUPS: LookupData = {
  religions: [], denominations: [], languages: [], castes: [],
  countries: [], states: [], cities: [], nakshatras: [], rasis: [],
};

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchLookups(): Promise<LookupData> {
  const res = await fetch(`${API_URL}/lookups`);
  if (!res.ok) throw new Error('Failed to fetch lookups');
  return res.json();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function lookupOptions(items: LookupItem[]): { value: string; label: string }[] {
  return items.map((i) => ({ value: String(i.id), label: i.name }));
}

export function lookupName(items: LookupItem[], id: number | null | undefined): string | null {
  if (id == null) return null;
  return items.find((i) => i.id === id)?.name ?? null;
}
