"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Bookmark,
  Clock,
  Home,
  Library,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchCommand, SearchTrigger } from "@/components/search-command";
import { cn } from "@/lib/utils";
import {
  HeaderAuthButton,
  type HeaderUser,
} from "@/components/header-auth-button";

type HeaderProps = {
  user?: HeaderUser | null;
};

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll to hide/show header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/browse", label: "Browse", icon: Library },
    { href: "/latest", label: "Latest", icon: Clock },
    { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
    { href: "/ranking", label: "Ranking", icon: Trophy },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header
        className={`max-w-screen fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-background/95 shadow-lg shadow-black/5 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex shrink-0 items-center rounded-xl px-2 py-1 transition-colors hover:bg-secondary/30"
            >
              <span className=" text-2xl md:text-3xl font-bold tracking-tight brand-pink-mask ">
                VuaTruyen
              </span>
            </Link>

            {/* Search Bar */}
            <div className="hidden max-w-xl flex-1 px-2 md:block">
              <SearchTrigger onClick={() => setSearchOpen(true)} />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/50 px-2 py-1">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-secondary/70"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>

              <ThemeToggle />

              <HeaderAuthButton user={user} />

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-secondary/70"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Desktop Navigation (Second Row) */}
          <div className="hidden border-t border-border/70 bg-gradient-to-r from-secondary/25 via-secondary/10 to-secondary/25 lg:block">
            <nav className="flex h-12 items-center justify-start gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActiveLink(link.href) ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-all",
                    isActiveLink(link.href)
                      ? "border-primary/35 bg-primary/15 text-primary shadow-sm shadow-primary/10"
                      : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-secondary/70 hover:text-foreground",
                  )}
                >
                  <link.icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActiveLink(link.href)
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  {link.label}
                  {isActiveLink(link.href) && (
                    <span className="absolute -bottom-[7px] left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary/70" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="border-t border-border py-4 lg:hidden">
              <nav className="flex flex-col gap-1.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isActiveLink(link.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                      isActiveLink(link.href)
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 lg:h-28" />

      {/* Search Command Dialog */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
