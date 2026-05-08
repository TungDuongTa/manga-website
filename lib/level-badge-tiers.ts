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
    title: "Phàm Nhân",
    className:
      "border-slate-400/30 bg-gradient-to-r from-slate-600/20 via-slate-500/15 to-zinc-500/15 text-slate-100 shadow-sm",
    icon: Shield,
  },
  {
    title: "Khai Mạch",
    className:
      "border-stone-400/35 bg-gradient-to-r from-stone-600/25 via-amber-700/20 to-stone-500/20 text-stone-100 shadow-[0_0_14px_rgba(168,162,158,0.22)]",
    icon: Shield,
  },
  {
    title: "Tụ Khí",
    className:
      "border-amber-500/40 bg-gradient-to-r from-amber-700/30 via-amber-500/30 to-orange-500/25 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.25)]",
    icon: Medal,
  },
  {
    title: "Luyện Cốt",
    className:
      "border-rose-400/55 bg-gradient-to-r from-rose-600/40 via-red-500/35 to-orange-500/30 text-rose-50 shadow-[0_0_22px_rgba(244,63,94,0.34)]",
    icon: Medal,
  },
  {
    title: "Hóa Kình",
    className:
      "border-fuchsia-300/50 bg-gradient-to-r from-fuchsia-400/35 via-violet-300/30 to-pink-200/30 text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,0.3)]",
    icon: Medal,
  },
  {
    title: "Địa Sát",
    className:
      "border-sky-300/55 bg-gradient-to-r from-sky-500/40 via-cyan-300/35 to-blue-300/30 text-sky-50 shadow-[0_0_24px_rgba(56,189,248,0.34)]",
    icon: Trophy,
  },
  {
    title: "Thiên Cương",
    className:
      "border-yellow-400/50 bg-gradient-to-r from-yellow-500/35 via-amber-400/35 to-orange-400/30 text-yellow-50 shadow-[0_0_22px_rgba(251,191,36,0.38)]",
    icon: Trophy,
  },
  {
    title: "Huyền Ảnh",
    className:
      "border-indigo-400/60 bg-gradient-to-r from-slate-700/45 via-indigo-600/40 to-violet-500/35 text-indigo-50 shadow-[0_0_28px_rgba(99,102,241,0.44)]",
    icon: Gem,
  },
  {
    title: "Linh Hải",
    className:
      "border-cyan-300/55 bg-gradient-to-r from-cyan-500/35 via-sky-400/35 to-indigo-400/25 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.36)]",
    icon: Gem,
  },
  {
    title: "Chân Nguyên",
    className:
      "border-emerald-300/65 bg-gradient-to-r from-emerald-500/45 via-teal-400/40 to-cyan-300/35 text-emerald-50 shadow-[0_0_30px_rgba(16,185,129,0.46)]",
    icon: Gem,
  },
  {
    title: "Võ Tông",
    className:
      "border-blue-300/55 bg-gradient-to-r from-blue-600/45 via-indigo-500/40 to-blue-400/30 text-blue-50 shadow-[0_0_24px_rgba(59,130,246,0.42)]",
    icon: Sparkles,
  },
  {
    title: "Võ Vương",
    className:
      "border-fuchsia-300/70 bg-gradient-to-r from-indigo-600/45 via-fuchsia-500/45 to-pink-400/35 text-fuchsia-50 shadow-[0_0_32px_rgba(217,70,239,0.5)]",
    icon: Sparkles,
  },
  {
    title: "Võ Hoàng",
    className:
      "border-violet-300/60 bg-gradient-to-r from-violet-600/45 via-fuchsia-500/40 to-purple-400/35 text-violet-50 shadow-[0_0_26px_rgba(167,139,250,0.42)]",
    icon: Sparkles,
  },
  {
    title: "Võ Tôn",
    className:
      "border-cyan-300/70 bg-gradient-to-r from-violet-500/50 via-sky-400/45 to-cyan-300/40 text-cyan-50 shadow-[0_0_34px_rgba(56,189,248,0.52)]",
    icon: Flame,
  },
  {
    title: "Võ Thánh",
    className:
      "border-rose-300/60 bg-gradient-to-r from-rose-500/45 via-pink-400/45 to-orange-300/35 text-rose-50 shadow-[0_0_28px_rgba(251,113,133,0.42)]",
    icon: Flame,
  },
  {
    title: "Thiên Thánh",
    className:
      "border-amber-200/75 bg-gradient-to-r from-amber-300/60 via-rose-200/50 to-orange-100/45 text-white shadow-[0_0_36px_rgba(251,191,36,0.48)]",
    icon: Crown,
  },
  {
    title: "Thần Võ",
    className:
      "border-emerald-300/60 bg-gradient-to-r from-emerald-500/50 via-teal-400/45 to-cyan-300/40 text-emerald-50 shadow-[0_0_30px_rgba(16,185,129,0.42)]",
    icon: Crown,
  },
  {
    title: "Thiên Đế",
    className:
      "border-lime-300/75 bg-gradient-to-r from-lime-400/55 via-emerald-300/50 to-yellow-300/40 text-white shadow-[0_0_38px_rgba(132,204,22,0.5)]",
    icon: Crown,
  },
  {
    title: "Chí Tôn",
    className:
      "border-fuchsia-200/70 bg-gradient-to-r from-fuchsia-500/55 via-yellow-400/45 to-cyan-300/45 text-white shadow-[0_0_36px_rgba(217,70,239,0.52)]",
    icon: Crown,
  },
  {
    title: "Thần Chủ",
    className:
      "border-amber-200/90 bg-gradient-to-r from-amber-700/80 via-yellow-600/75 to-orange-700/80 text-yellow-50 drop-shadow-[0_1px_2px_rgba(120,53,15,0.7)] ring-1 ring-yellow-200/70 shadow-[0_0_52px_rgba(250,204,21,0.72)]",
    icon: Crown,
  },
] as const;

const LEVEL_USERNAME_EFFECTS: ReadonlyArray<LevelUsernameEffect> = [
  {
    name: "Pham Nhan",
    className: "username-mask username-mask--pham-nhan",
  },
  {
    name: "Khai Mach",
    className: "username-mask username-mask--khai-mach",
  },
  {
    name: "Tu Khi",
    className: "username-mask username-mask--tu-khi",
  },
  {
    name: "Luyen Cot",
    className: "username-mask username-mask--luyen-cot",
  },
  {
    name: "Hoa Kinh",
    className: "username-mask username-mask--hoa-kinh",
  },
  {
    name: "Dia Sat",
    className: "username-mask username-mask--dia-sat",
  },
  {
    name: "Thien Cuong",
    className: "username-mask username-mask--thien-cuong",
  },
  {
    name: "Huyen Anh",
    className: "username-mask username-mask--huyen-anh",
  },
  {
    name: "Linh Hai",
    className: "username-mask username-mask--linh-hai",
  },
  {
    name: "Chan Nguyen",
    className: "username-mask username-mask--chan-nguyen",
  },
  {
    name: "Vo Tong",
    className: "username-mask username-mask--vo-tong",
  },
  {
    name: "Vo Vuong",
    className: "username-mask username-mask--vo-vuong",
  },
  {
    name: "Vo Hoang",
    className: "username-mask username-mask--vo-hoang",
  },
  {
    name: "Vo Ton",
    className: "username-mask username-mask--vo-ton",
  },
  {
    name: "Vo Thanh",
    className: "username-mask username-mask--vo-thanh",
  },
  {
    name: "Thien Thanh",
    className: "username-mask username-mask--thien-thanh",
  },
  {
    name: "Than Vo",
    className: "username-mask username-mask--than-vo",
  },
  {
    name: "Thien De",
    className: "username-mask username-mask--thien-de",
  },
  {
    name: "Chi Ton",
    className: "username-mask username-mask--chi-ton",
  },
  {
    name: "Than Chu",
    className: "username-mask username-mask--than-chu",
  },
] as const;

const LEVELS_PER_TIER = 5;

const getTierIndex = (level: number) =>
  Math.min(
    LEVEL_BADGE_TIERS.length - 1,
    Math.floor((Math.max(level, 1) - 1) / LEVELS_PER_TIER),
  );

export const getLevelBadgeTier = (level: number): LevelBadgeTier => {
  const tierIndex = getTierIndex(level);

  return LEVEL_BADGE_TIERS[tierIndex];
};

export const getLevelUsernameEffect = (level: number): LevelUsernameEffect => {
  const tierIndex = getTierIndex(level);
  return LEVEL_USERNAME_EFFECTS[tierIndex];
};
