"use client";

import { useState } from "react";

export function PhotoGallery({ photos, primaryPhoto }: { photos: string[]; primaryPhoto: string | null }) {
  const [selected, setSelected] = useState(primaryPhoto ?? photos[0] ?? null);

  if (!photos.length) return null;

  return (
    <div className="bg-white rounded-xl border border-border/40 shadow-sm overflow-hidden">
      {/* Main photo */}
      <div className="w-full aspect-square bg-secondary/20 overflow-hidden">
        {selected && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected} alt="Profile photo" className="w-full h-full object-cover" />
        )}
      </div>
      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="p-3 flex gap-2">
          {photos.map((photo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(photo)}
              className={[
                "w-16 h-16 rounded-lg overflow-hidden flex-none border-2 transition-all",
                selected === photo ? "border-primary ring-1 ring-primary/30" : "border-transparent opacity-60 hover:opacity-100",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
