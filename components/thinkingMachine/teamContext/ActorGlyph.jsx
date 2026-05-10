"use client";

import { CircleUserRound, UserRound, UsersRound } from "lucide-react";

const ACTOR_VARIANTS = [
  {
    Icon: CircleUserRound,
    className: "border-teal-100 bg-teal-50 text-teal-700",
  },
  {
    Icon: UserRound,
    className: "border-sky-100 bg-sky-50 text-sky-700",
  },
  {
    Icon: UsersRound,
    className: "border-pink-100 bg-pink-50 text-pink-700",
  },
];

const SIZE_CLASSES = {
  xs: "h-5 w-5 border text-[10px]",
  sm: "h-7 w-7 border text-[11px]",
  md: "h-9 w-9 border text-[12px]",
};

const ICON_SIZE_CLASSES = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4.5 w-4.5",
};

function getActorSeed(actor) {
  return String(
    actor?.id ||
    actor?.userId ||
    actor?.email ||
    actor?.name ||
    actor?.userName ||
    ""
  );
}

function getActorVariant(actor) {
  const seed = getActorSeed(actor);
  const name = String(actor?.name || actor?.userName || "").toLowerCase();
  if (seed.startsWith("local-user") || name === "local teammate") return ACTOR_VARIANTS[0];

  const hash = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ACTOR_VARIANTS[hash % ACTOR_VARIANTS.length] || ACTOR_VARIANTS[0];
}

export default function ActorGlyph({ actor, size = "sm", className = "" }) {
  const variant = getActorVariant(actor);
  const Icon = variant.Icon;
  const label = actor?.name || actor?.userName || actor?.id || actor?.userId || "Teammate";
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;
  const iconSizeClass = ICON_SIZE_CLASSES[size] || ICON_SIZE_CLASSES.sm;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-sm ${sizeClass} ${variant.className} ${className}`}
      aria-label={label}
      title={label}
    >
      <Icon className={iconSizeClass} aria-hidden="true" />
    </span>
  );
}
