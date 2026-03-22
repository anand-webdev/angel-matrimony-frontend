import type { Profile } from "../types/profile";

export const fmt = (s: string) =>
  s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function cmToDisplay(cm: number | null | undefined): string | null {
  if (cm == null) return null;
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${ft}'${inches}"`;
}

export function buildLocation(p: Pick<Profile, "city" | "state" | "country">): string | null {
  const parts = [p.city?.name, p.state?.name, p.country?.name].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}
