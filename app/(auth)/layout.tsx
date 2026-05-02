import type { Metadata } from "next";
import "@/app/globals.css";
import { getSessionUser } from "@/lib/server-session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in or create an account to sync bookmarks and reading progress.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    redirect("/");
  }
  return (
    <main>
      <section className={` font-sans antialiased`}>{children}</section>
    </main>
  );
}
