import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import "@/app/globals.css";
import ProgressBar from "@/components/ProgressBar";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user) {
    redirect("/");
  }
  return (
    <main lang="en" suppressHydrationWarning>
      <section className={` font-sans antialiased`}>{children}</section>
    </main>
  );
}
