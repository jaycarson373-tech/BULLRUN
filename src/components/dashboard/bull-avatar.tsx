/* eslint-disable @next/next/no-img-element */
import type { Bull } from "@/types/domain";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function BullAvatar({ bull, size = "md" }: { bull: Bull; size?: "sm" | "md" | "lg" | "xl" }) {
  const classes = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
    xl: "h-28 w-28 text-2xl",
  }[size];

  if (bull.image) {
    return (
      <img
        src={bull.image}
        alt=""
        className={`${classes} shrink-0 rounded-sm border border-[#6d151d] object-cover shadow-[0_0_30px_rgba(223,16,28,0.16)]`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${classes} grid shrink-0 place-items-center rounded-sm border border-[#6d151d] bg-[radial-gradient(circle_at_35%_25%,#71101a,#171010_50%,#070707)] font-black text-[#f7f7f2] shadow-[0_0_30px_rgba(223,16,28,0.16)]`}
    >
      {initials(bull.name)}
    </div>
  );
}
