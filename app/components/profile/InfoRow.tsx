export function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[13px] font-semibold text-text">{value}</span>
    </div>
  );
}

export function BoolRow({ label, value }: { label: string; value?: boolean | null }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[13px] font-semibold text-text">{value ? "Yes" : "No"}</span>
    </div>
  );
}
