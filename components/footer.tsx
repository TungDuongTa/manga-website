import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    browse: [
      { label: "Manga", href: "/browse?type=manga" },
      { label: "Manhwa", href: "/browse?type=manhwa" },
      { label: "Manhua", href: "/browse?type=manhua" },
      { label: "Latest Updates", href: "/latest" },
    ],
    genres: [
      { label: "Action", href: "/browse?genre=action" },
      { label: "Romance", href: "/browse?genre=romance" },
      { label: "Fantasy", href: "/browse?genre=fantasy" },
      { label: "Comedy", href: "/browse?genre=comedy" },
    ],
    community: [
      { label: "Discord", href: "#" },
      { label: "Reddit", href: "#" },
      { label: "Twitter", href: "#" },
      { label: "Contact", href: "#" },
    ],
    legal: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "DMCA", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  };

  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary logo-glow">
                VuaTruyen
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your ultimate destination for reading manga, manhwa, and manhua
              online for free.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Browse</h3>
            <ul className="space-y-2">
              {footerLinks.browse.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Genres</h3>
            <ul className="space-y-2">
              {footerLinks.genres.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Community</h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {currentYear} VuaTruyen. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            All manga, manhwa, and manhua content are the property of their
            respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
