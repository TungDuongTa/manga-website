"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export type HeaderUser = {
  id: string;
  name: string;
  email: string;
  image: string;
};

type HeaderAuthButtonProps = {
  user?: HeaderUser | null;
};

export function HeaderAuthButton({ user }: HeaderAuthButtonProps) {
  const userInitial =
    user?.name?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    "U";

  if (user) {
    return (
      <Link href="/profile" aria-label="View profile">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarImage src={user.image} alt={user.name} />
          <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
      </Link>
    );
  }

  return (
    <Link href="/sign-in">
      <Button variant="secondary" size="sm" className="gap-2">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Button>
    </Link>
  );
}
