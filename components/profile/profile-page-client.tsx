"use client";

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Loader2,
  LogOut,
  Sparkles,
  Trophy,
  Upload,
  UserRound,
} from "lucide-react";
import { signOut, updateUserProfile } from "@/lib/actions/auth.actions";
import { getLevelBadgeTier, getLevelUsernameEffect } from "@/lib/level-badge-tiers";
import {
  EXP_PER_CHAPTER,
  EXP_PER_LEVEL,
  type ReadingExpStats,
} from "@/lib/user-level";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type ProfilePageClientProps = {
  initialProfile: {
    name: string;
    email: string;
    image: string;
  };
  readingExp: ReadingExpStats;
};

type NoticeState = {
  type: "success" | "error";
  message: string;
} | null;

const MAX_AVATAR_SIZE_BYTES = 1024 * 1024;

export function ProfilePageClient({
  initialProfile,
  readingExp,
}: ProfilePageClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(initialProfile.name);
  const [avatarInput, setAvatarInput] = useState(initialProfile.image || "");
  const [avatarPreview, setAvatarPreview] = useState(
    initialProfile.image || "",
  );
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isSaving, startSaving] = useTransition();
  const [isSigningOut, startSigningOut] = useTransition();

  const userInitial = useMemo(
    () =>
      displayName.trim().charAt(0).toUpperCase() ||
      initialProfile.email.charAt(0).toUpperCase() ||
      "U",
    [displayName, initialProfile.email],
  );

  const isMaxLevel = readingExp.level >= readingExp.maxLevel;
  const nextLevel = Math.min(readingExp.level + 1, readingExp.maxLevel);
  const levelBadgeTier = getLevelBadgeTier(readingExp.level);
  const usernameEffect = getLevelUsernameEffect(readingExp.level);
  const LevelBadgeIcon = levelBadgeTier.icon;

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", message: "Please select an image file." });
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setNotice({
        type: "error",
        message: "Avatar image must be 1MB or smaller.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setAvatarInput(result);
      setAvatarPreview(result);
      setNotice(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const normalizedName = displayName.trim();
    if (normalizedName.length < 2 || normalizedName.length > 40) {
      setNotice({
        type: "error",
        message: "Display name must be between 2 and 40 characters.",
      });
      return;
    }

    startSaving(async () => {
      const result = await updateUserProfile({
        displayName: normalizedName,
        avatar: avatarInput.trim() || null,
      });

      if (!result.success) {
        setNotice({ type: "error", message: result.message });
        return;
      }

      setNotice({ type: "success", message: result.message });
      router.refresh();
    });
  };

  const handleSignOut = () => {
    setNotice(null);
    startSigningOut(async () => {
      const result = await signOut();

      if (result && !result.success) {
        setNotice({ type: "error", message: result.message });
        return;
      }

      router.push("/sign-in");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-lg backdrop-blur">
        <div className="h-28 bg-gradient-to-r from-primary/80 via-accent/75 to-primary/50" />
        <div className="-mt-12 flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={avatarPreview} alt={displayName} />
              <AvatarFallback className="text-2xl">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1
                className={cn(
                  "text-2xl font-semibold tracking-wide",
                  usernameEffect.className,
                )}
                title={`${usernameEffect.name} username effect`}
              >
                {displayName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {initialProfile.email}
              </p>
            </div>
          </div>
          <Badge
            className={cn(
              "w-fit gap-1.5 rounded-full px-3 py-1.5 text-sm",
              levelBadgeTier.className,
            )}
          >
            <LevelBadgeIcon className="h-4 w-4" />
            Level {readingExp.level}
            <span className="hidden text-[10px] font-medium uppercase tracking-wide sm:inline">
              {levelBadgeTier.title}
            </span>
          </Badge>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="h-5 w-5 text-primary" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={40}
                placeholder="Enter your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar-url">Avatar URL or Uploaded Image</Label>
              <Input
                id="avatar-url"
                value={avatarInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setAvatarInput(value);
                  setAvatarPreview(value);
                }}
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload Avatar
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="gap-2"
                onClick={() => {
                  setAvatarInput("");
                  setAvatarPreview("");
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                <Camera className="h-4 w-4" />
                Remove Avatar
              </Button>
            </div>

            {notice ? (
              <p
                className={cn(
                  "rounded-md border px-3 py-2 text-sm",
                  notice.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-destructive/30 bg-destructive/10 text-destructive",
                )}
              >
                {notice.message}
              </p>
            ) : null}

            <Button
              type="button"
              className="gap-2"
              onClick={handleSaveProfile}
              disabled={isSaving || isSigningOut}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Reader Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Level {readingExp.level}
                </span>
                <span className="font-medium text-foreground">
                  {Math.round(readingExp.progressPercent)}%
                </span>
              </div>
              <Progress value={readingExp.progressPercent} />
            </div>

            <p className="text-sm text-muted-foreground">
              {isMaxLevel
                ? "Maximum level reached. Keep reading to grow your total EXP."
                : `${readingExp.currentLevelExp}/${EXP_PER_LEVEL} EXP in this level. ${readingExp.expToNextLevel} EXP until Level ${nextLevel}.`}
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-muted-foreground">Total EXP</p>
                <p className="text-lg font-semibold text-foreground">
                  {readingExp.totalExp.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-muted-foreground">Chapters Read</p>
                <p className="text-lg font-semibold text-foreground">
                  {readingExp.chaptersRead.toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              EXP is earned from manga reading activity. Current rate:{" "}
              {EXP_PER_CHAPTER} EXP per chapter.
            </p>

            <Button
              type="button"
              variant="destructive"
              className="w-full gap-2"
              onClick={handleSignOut}
              disabled={isSaving || isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
