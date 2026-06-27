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

export function BullAvatar({ bull, size = "md" }: { bull: Bull; size?: "sm" | "md" | "lg" }) {
  const classes = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
  }[size];

  if (bull.image) {
    return (
      <img
        src={bull.image}
        alt=""
        className={`${classes} shrink-0 rounded border border-[#3a3221] object-cover`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${classes} grid shrink-0 place-items-center rounded border border-[#3a3221] bg-[radial-gradient(circle_at_35%_25%,#4a3217,#17110b_52%,#070707)] font-bold text-[#f1d189]`}
    >
      {initials(bull.name)}
    </div>
  );
}
