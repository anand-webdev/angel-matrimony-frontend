import { SECTION_ICONS } from "../../constants/profile";

export function Section({
  title,
  sectionKey,
  children,
}: {
  title: string;
  sectionKey: string;
  children: React.ReactNode;
}) {
  const icon = SECTION_ICONS[sectionKey];
  return (
    <div className="bg-white rounded-xl border border-border/40 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/20 bg-surface/30">
        {icon && <span className="text-primary/70">{icon}</span>}
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">{children}</div>
      </div>
    </div>
  );
}
