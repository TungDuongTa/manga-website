import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";

export const getSessionUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
};

export const getCurrentUserId = async (): Promise<string | null> => {
  const user = await getSessionUser();
  return user?.id ?? null;
};

