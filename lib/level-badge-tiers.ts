import {
  Crown,
  Flame,
  Gem,
  Medal,
  Shield,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

type LevelBadgeTier = {
  title: string;
  className: string;
  icon: LucideIcon;
};

type LevelUsernameEffect = {
  name: string;
  className: string;
};

export const LEVEL_BADGE_TIERS: ReadonlyArray<LevelBadgeTier> = [
  {
    title: "Novice",
    className:
      "border-slate-400/30 bg-gradient-to-r from-slate-500/20 to-zinc-500/20 text-slate-100 shadow-sm",
    icon: Shield,
  },
  {
    title: "Bronze",
    className:
      "border-amber-500/40 bg-gradient-to-r from-amber-700/30 via-amber-500/30 to-orange-500/25 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.25)]",
    icon: Medal,
  },
  {
    title: "Silver",
    className:
      "border-zinc-300/40 bg-gradient-to-r from-zinc-400/35 via-slate-300/30 to-zinc-200/25 text-zinc-100 shadow-[0_0_18px_rgba(212,212,216,0.26)]",
    icon: Medal,
  },
  {
    title: "Gold",
    className:
      "border-yellow-400/50 bg-gradient-to-r from-yellow-500/35 via-amber-400/35 to-orange-400/30 text-yellow-50 shadow-[0_0_22px_rgba(251,191,36,0.38)]",
    icon: Trophy,
  },
  {
    title: "Platinum",
    className:
      "border-cyan-300/55 bg-gradient-to-r from-cyan-500/35 via-sky-400/35 to-indigo-400/25 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.36)]",
    icon: Gem,
  },
  {
    title: "Sapphire",
    className:
      "border-blue-300/55 bg-gradient-to-r from-blue-600/45 via-indigo-500/40 to-blue-400/30 text-blue-50 shadow-[0_0_24px_rgba(59,130,246,0.42)]",
    icon: Gem,
  },
  {
    title: "Mythic",
    className:
      "border-violet-300/60 bg-gradient-to-r from-violet-600/45 via-fuchsia-500/40 to-purple-400/35 text-violet-50 shadow-[0_0_26px_rgba(167,139,250,0.42)]",
    icon: Sparkles,
  },
  {
    title: "Celestial",
    className:
      "border-rose-300/60 bg-gradient-to-r from-rose-500/45 via-pink-400/45 to-orange-300/35 text-rose-50 shadow-[0_0_28px_rgba(251,113,133,0.42)]",
    icon: Flame,
  },
  {
    title: "Legend",
    className:
      "border-emerald-300/60 bg-gradient-to-r from-emerald-500/50 via-teal-400/45 to-cyan-300/40 text-emerald-50 shadow-[0_0_30px_rgba(16,185,129,0.42)]",
    icon: Crown,
  },
  {
    title: "Ascendant",
    className:
      "border-fuchsia-200/70 bg-gradient-to-r from-fuchsia-500/55 via-yellow-400/45 to-cyan-300/45 text-white shadow-[0_0_36px_rgba(217,70,239,0.5)]",
    icon: Crown,
  },
] as const;

const LEVEL_USERNAME_EFFECTS: ReadonlyArray<LevelUsernameEffect> = [
  { name: "Mist", className: "username-mask username-mask--mist" },
  { name: "Ember", className: "username-mask username-mask--ember" },
  { name: "Steel", className: "username-mask username-mask--steel" },
  { name: "Solar", className: "username-mask username-mask--solar" },
  { name: "Plasma", className: "username-mask username-mask--plasma" },
  { name: "Tide", className: "username-mask username-mask--tide" },
  { name: "Arcane", className: "username-mask username-mask--arcane" },
  { name: "Inferno", className: "username-mask username-mask--inferno" },
  { name: "Aurora", className: "username-mask username-mask--aurora" },
  {
    name: "Thunder",
    className: "username-mask username-mask--thunder",
  },
] as const;

const getTierIndex = (level: number) =>
  Math.min(
    LEVEL_BADGE_TIERS.length - 1,
    Math.floor((Math.max(level, 1) - 1) / 10),
  );

export const getLevelBadgeTier = (level: number): LevelBadgeTier => {
  const tierIndex = getTierIndex(level);

  return LEVEL_BADGE_TIERS[tierIndex];
};

export const getLevelUsernameEffect = (level: number): LevelUsernameEffect => {
  const tierIndex = getTierIndex(level);
  return LEVEL_USERNAME_EFFECTS[tierIndex];
};
