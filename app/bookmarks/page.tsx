import Link from "next/link";
import { headers } from "next/headers";
import { Bookmark, Trash2 } from "lucide-react";
import { MangaCardApi } from "@/components/manga-card-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/better-auth/auth";
import {
  getCurrentUserBookmarks,
  removeMangaBookmark,
} from "@/lib/actions/bookmark.actions";

const formatBookmarkedDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default async function BookmarksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Sign In Required
            </h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to view and manage your manga bookmarks.
            </p>
            <Link href="/sign-in">
              <Button>Go to Sign In</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const bookmarkedManga = await getCurrentUserBookmarks();

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">My Bookmarks</h1>
          </div>
          <p className="text-muted-foreground">
            Manga you saved for quick access.
          </p>
        </div>

        {bookmarkedManga.length > 0 ? (
          <>
            <div className="mb-6">
              <Badge className="bg-accent text-accent-foreground">
                {bookmarkedManga.length} saved
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {bookmarkedManga.map((manga) => {
                const removeAction = removeMangaBookmark.bind(null, manga.slug);

                return (
                  <div key={manga.slug}>
                    <MangaCardApi comic={manga} />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        Saved {formatBookmarkedDate(manga.bookmarkedAt)}
                      </p>
                      <form action={removeAction}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${manga.name} from bookmarks`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No bookmarks yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start adding manga and they will appear here.
            </p>
            <Link href="/browse">
              <Button>Browse Manga</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
