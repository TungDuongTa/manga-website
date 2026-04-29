import "@/app/globals.css";
import { getSessionUser } from "@/lib/server-session";
import { redirect } from "next/navigation";

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
    <main lang="en" suppressHydrationWarning>
      <section className={` font-sans antialiased`}>{children}</section>
    </main>
  );
}
